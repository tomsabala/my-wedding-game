'use server'

import { prisma } from '@repo/db'
import { type PassingCardType, type CardLayout } from '@repo/shared'
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
  return unstable_cache(
    async () => {
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
    },
    [`public-game-${slug}`],
    { tags: [`game-for-play-${slug}`], revalidate: 60 },
  )()
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
  endMessage: string | null
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

export async function getGameForPlay(slug: string): Promise<PlayGame | null> {
  return unstable_cache(
    async () => {
      const game = await prisma.game.findUnique({
        where: { slug },
        select: {
          id: true,
          slug: true,
          coupleNames: true,
          endMessage: true,
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
        endMessage: game.endMessage,
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
    [`game-for-play-${slug}`],
    { tags: [`game-for-play-${slug}`], revalidate: 300 },
  )()
}

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
    layout: card.layout as CardLayout | null,
    afterQuestionPosition: card.afterQuestionPosition,
  }
}

export async function submitAnswer(data: {
  playerId: string
  questionId: string
  selectedIndex: number
  isCorrect: boolean
  timeTakenMs: number
}): Promise<ActionResult> {
  await prisma.playerAnswer.create({
    data: {
      playerId: data.playerId,
      questionId: data.questionId,
      selectedIndex: data.selectedIndex,
      isCorrect: data.isCorrect,
      timeTakenMs: data.timeTakenMs,
    },
  })
  return { success: true }
}

export async function finishGame(playerId: string, score: number): Promise<ActionResult> {
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
  const rows = await prisma.$queryRaw<
    { id: string; display_name: string; correct_count: bigint; total_time_ms: bigint; game_id: string; couple_names: string }[]
  >`
    SELECT p.id,
           p.display_name,
           p.game_id,
           g.couple_names,
           COUNT(CASE WHEN pa.is_correct THEN 1 END) AS correct_count,
           COALESCE(SUM(pa.time_taken_ms), 0)        AS total_time_ms
    FROM   players p
    JOIN   games g ON g.id = p.game_id
    LEFT JOIN player_answers pa ON pa.player_id = p.id
    WHERE  g.slug = ${slug} AND g.status = 'LIVE'
    GROUP  BY p.id, p.display_name, p.game_id, g.couple_names
    ORDER  BY correct_count DESC, total_time_ms ASC
  `

  if (rows.length === 0) {
    const game = await prisma.game.findUnique({
      where: { slug },
      select: { id: true, coupleNames: true, status: true },
    })
    if (!game || game.status !== 'LIVE') return null
    return { gameId: game.id, coupleNames: game.coupleNames, players: [] }
  }

  return {
    gameId: rows[0]!.game_id,
    coupleNames: rows[0]!.couple_names,
    players: rows.map((r) => ({
      id: r.id,
      displayName: r.display_name,
      correctCount: Number(r.correct_count),
      totalTimeTakenMs: Number(r.total_time_ms),
    })),
  }
}
