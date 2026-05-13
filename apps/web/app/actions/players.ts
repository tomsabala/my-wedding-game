'use server'

import { prisma } from '@repo/db'
import { calculateQuestionScore, type PassingCardType } from '@repo/shared'
import { revalidatePath } from 'next/cache'

import { type ActionResult } from '@/lib/actions'

export type PublicGame = {
  id: string
  slug: string
  coupleNames: string
  tagline: string | null
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

  const player = await prisma.player.create({
    data: {
      gameId: game.id,
      displayName: name,
    },
    select: { id: true, gameId: true },
  })

  revalidatePath(`/dashboard/games/${game.id}`)
  return { success: true, data: { playerId: player.id, gameId: player.gameId } }
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
  }[]
  passingCards: {
    id: string
    type: PassingCardType
    content: string
    afterQuestionPosition: number | null
  }[]
}

export async function getGameForPlay(slug: string): Promise<PlayGame | null> {
  const game = await prisma.game.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      coupleNames: true,
      status: true,
      questions: {
        orderBy: { position: 'asc' },
        select: { id: true, text: true, options: true, position: true },
      },
      passingCards: {
        select: {
          id: true,
          type: true,
          content: true,
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
    })),
    passingCards: game.passingCards.map((c) => ({
      id: c.id,
      type: c.type as PassingCardType,
      content: c.content,
      afterQuestionPosition: c.afterQuestionPosition,
    })),
  }
}

export async function getPassingCard(slug: string, cardId: string) {
  const card = await prisma.passingCard.findFirst({
    where: { id: cardId, game: { slug, status: 'LIVE' } },
    select: { id: true, type: true, content: true, afterQuestionPosition: true },
  })
  if (!card) return null
  return {
    id: card.id,
    type: card.type as PassingCardType,
    content: card.content,
    afterQuestionPosition: card.afterQuestionPosition,
  }
}

export async function submitAnswer(data: {
  playerId: string
  questionId: string
  selectedIndex: number
  timeTakenMs: number
}): Promise<ActionResult<{ isCorrect: boolean; questionScore: number }>> {
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

  return { success: true, data: { isCorrect, questionScore } }
}

export async function finishGame(
  playerId: string,
  score: number,
): Promise<ActionResult> {
  await prisma.player.update({
    where: { id: playerId },
    data: { score, finishedAt: new Date() },
  })
  return { success: true }
}

export type LeaderboardEntry = {
  id: string
  displayName: string
  score: number
  correctCount: number
  isFinished: boolean
}

export async function getLeaderboard(
  slug: string,
): Promise<{ coupleNames: string; players: LeaderboardEntry[] } | null> {
  const game = await prisma.game.findUnique({
    where: { slug },
    select: {
      id: true,
      coupleNames: true,
      status: true,
      players: {
        orderBy: [{ score: 'desc' }, { finishedAt: 'asc' }],
        select: {
          id: true,
          displayName: true,
          score: true,
          finishedAt: true,
          answers: { where: { isCorrect: true }, select: { id: true } },
        },
      },
    },
  })

  if (!game || game.status !== 'LIVE') return null

  return {
    coupleNames: game.coupleNames,
    players: game.players.map((p) => ({
      id: p.id,
      displayName: p.displayName,
      score: p.score,
      correctCount: p.answers.length,
      isFinished: p.finishedAt !== null,
    })),
  }
}
