'use server'

import { prisma } from '@repo/db'
import { calculateQuestionScore, calculateTotalScore, type PassingCardType, type CardLayout } from '@repo/shared'
import { revalidatePath, unstable_cache } from 'next/cache'

import { type ActionResult } from '@/lib/actions'

export type PublicGame = {
  id: string
  slug: string
  coupleNames: string
  tagline: string | null
  welcomeMessage: string | null
  questionCount: number
  isLive: boolean
  funFact: string | null
}

export async function getPublicGame(slug: string): Promise<PublicGame | null> {
  const game = await prisma.game.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      coupleNames: true,
      tagline: true,
      welcomeMessage: true,
      status: true,
      _count: { select: { questions: true } },
      passingCards: {
        where: { type: 'DID_YOU_KNOW' },
        orderBy: { afterQuestionPosition: 'asc' },
        take: 1,
        select: { content: true },
      },
    },
  })

  if (!game) return null

  return {
    id: game.id,
    slug: game.slug,
    coupleNames: game.coupleNames,
    tagline: game.tagline,
    welcomeMessage: game.welcomeMessage,
    questionCount: game._count.questions,
    isLive: game.status === 'LIVE',
    funFact: game.passingCards[0]?.content ?? null,
  }
}

export async function joinGame(
  slug: string,
  displayName: string,
): Promise<ActionResult<{ playerId: string; gameId: string }>> {
  const name = displayName.trim()
  if (!name) return { success: false, error: 'יש להזין שם' }
  if (name.length > 80) return { success: false, error: 'השם ארוך מדי' }

  const game = await prisma.game.findUnique({
    where: { slug },
    select: { id: true, status: true },
  })

  if (!game || game.status !== 'LIVE') {
    return { success: false, error: 'המשחק אינו פעיל' }
  }

  const existingPlayer = await prisma.player.findFirst({
    where: { gameId: game.id, displayName: name },
    select: { id: true },
  })

  if (existingPlayer) {
    return { success: false, error: 'nameTaken' }
  }

  const player = await prisma.player.create({
    data: { gameId: game.id, displayName: name },
    select: { id: true, gameId: true },
  })

  revalidatePath(`/dashboard/games/${game.id}`)
  return {
    success: true,
    data: { playerId: player.id, gameId: player.gameId },
  }
}

export type PlayGame = {
  gameId: string
  slug: string
  coupleNames: string
  questions: {
    id: string
    text: string
    options: string[]
    position: number
    correctIndex: number
  }[]
  passingCards: {
    id: string
    type: PassingCardType
    content: string
    layout: CardLayout | null
    afterQuestionPosition: number | null
  }[]
}

export const getGameForPlay = unstable_cache(
  async (slug: string): Promise<PlayGame | null> => {
    const game = await prisma.game.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        coupleNames: true,
        status: true,
        questions: {
          orderBy: { position: 'asc' },
          select: { id: true, text: true, options: true, position: true, correctIndex: true },
        },
        passingCards: {
          select: {
            id: true,
            type: true,
            content: true,
            // layout omitted — fetched lazily per-card via getPassingCard
            afterQuestionPosition: true,
          },
        },
      },
    })

    if (!game || game.status !== 'LIVE') return null

    return {
      gameId: game.id,
      slug: game.slug,
      coupleNames: game.coupleNames,
      questions: game.questions.map((q) => ({
        id: q.id,
        text: q.text,
        options: q.options as string[],
        position: q.position,
        correctIndex: q.correctIndex,
      })),
      passingCards: game.passingCards.map((c) => ({
        id: c.id,
        type: c.type as PassingCardType,
        content: c.content,
        layout: null,
        afterQuestionPosition: c.afterQuestionPosition,
      })),
    }
  },
  ['game-for-play'],
  { revalidate: 300 },
)

export async function getPassingCard(slug: string, cardId: string) {
  const card = await prisma.passingCard.findFirst({
    where: { id: cardId, game: { slug, status: 'LIVE' } },
    select: { id: true, type: true, content: true, layout: true, afterQuestionPosition: true },
  })
  if (!card) return null
  return {
    id: card.id,
    type: card.type as PassingCardType,
    content: card.content,
    layout: card.layout as import('@repo/shared').CardLayout | null,
    afterQuestionPosition: card.afterQuestionPosition,
  }
}

export async function submitAnswer(data: {
  playerId: string
  questionId: string
  selectedIndex: number
  timeTakenMs: number
}): Promise<ActionResult<{ isCorrect: boolean; questionScore: number; correctIndex: number }>> {
  const question = await prisma.question.findUnique({
    where: { id: data.questionId },
    select: { id: true, correctIndex: true },
  })
  if (!question) return { success: false, error: 'שאלה לא נמצאה' }

  const isCorrect = data.selectedIndex === question.correctIndex
  const questionScore = calculateQuestionScore(isCorrect, data.timeTakenMs)

  await prisma.playerAnswer.create({
    data: {
      playerId: data.playerId,
      questionId: data.questionId,
      selectedIndex: data.selectedIndex,
      isCorrect,
      timeTakenMs: data.timeTakenMs,
    },
  })

  return { success: true, data: { isCorrect, questionScore, correctIndex: question.correctIndex } }
}

export async function finishGame(playerId: string): Promise<ActionResult> {
  const answers = await prisma.playerAnswer.findMany({
    where: { playerId },
    select: { isCorrect: true, timeTakenMs: true },
  })
  const score = calculateTotalScore(answers)
  // updateMany with finishedAt: null guard is a no-op if already finished
  await prisma.player.updateMany({
    where: { id: playerId, finishedAt: null },
    data: { score, finishedAt: new Date() },
  })
  return { success: true }
}

export type LeaderboardEntry = {
  id: string
  displayName: string
  correctCount: number
  totalTimeTakenMs: number
}

export async function getLeaderboard(
  slug: string,
): Promise<{ gameId: string; coupleNames: string; players: LeaderboardEntry[] } | null> {
  const game = await prisma.game.findUnique({
    where: { slug },
    select: { id: true, coupleNames: true, status: true },
  })

  if (!game || game.status !== 'LIVE') return null

  // Single GROUP BY query — one row per player instead of fetching all answer rows
  const rows = await prisma.$queryRaw<
    { id: string; display_name: string; correct_count: bigint; total_time_ms: bigint }[]
  >`
    SELECT p.id,
           p.display_name,
           COUNT(CASE WHEN pa.is_correct THEN 1 END) AS correct_count,
           COALESCE(SUM(pa.time_taken_ms), 0)        AS total_time_ms
    FROM   players p
    LEFT JOIN player_answers pa ON pa.player_id = p.id
    WHERE  p.game_id = ${game.id}
    GROUP  BY p.id, p.display_name
    ORDER  BY correct_count DESC, total_time_ms ASC
  `

  return {
    gameId: game.id,
    coupleNames: game.coupleNames,
    players: rows.map((r) => ({
      id: r.id,
      displayName: r.display_name,
      correctCount: Number(r.correct_count),
      totalTimeTakenMs: Number(r.total_time_ms),
    })),
  }
}
