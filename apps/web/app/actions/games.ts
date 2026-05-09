'use server'

import { Prisma, prisma } from '@repo/db'
import { createGameSchema, generateSlug, type CreateGameInput } from '@repo/shared'
import { notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'

type ActionResult<T = void> = T extends void
  ? { success: true } | { success: false; error: string }
  : { success: true; data: T } | { success: false; error: string }

async function getAuthUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  return user
}

export async function getGames() {
  const user = await getAuthUser()
  return prisma.game.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { players: true } } },
  })
}

export async function createGame(
  data: CreateGameInput,
): Promise<ActionResult<{ id: string }>> {
  const user = await getAuthUser()

  const parsed = createGameSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? 'שגיאה בנתונים' }
  }

  const { coupleNames, weddingDate, tagline } = parsed.data

  for (let i = 0; i < 10; i++) {
    try {
      const game = await prisma.game.create({
        data: {
          userId: user.id,
          slug: generateSlug(),
          coupleNames,
          weddingDate: new Date(weddingDate),
          tagline: tagline ?? null,
          status: 'DRAFT',
        },
      })
      return { success: true, data: { id: game.id } }
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') continue
      throw e
    }
  }

  return { success: false, error: 'שגיאה ביצירת קישור ייחודי' }
}

export async function getGame(id: string) {
  const user = await getAuthUser()

  const game = await prisma.game.findUnique({
    where: { id },
    include: {
      players: { select: { id: true, displayName: true, score: true, finishedAt: true } },
      questions: { select: { id: true, position: true }, orderBy: { position: 'asc' } },
      _count: { select: { questions: true, players: true } },
    },
  })

  if (!game || game.userId !== user.id) notFound()

  const [totals, corrects] = await Promise.all([
    prisma.playerAnswer.groupBy({
      by: ['questionId'],
      where: { question: { gameId: id } },
      _count: { _all: true },
    }),
    prisma.playerAnswer.groupBy({
      by: ['questionId'],
      where: { question: { gameId: id }, isCorrect: true },
      _count: { _all: true },
    }),
  ])

  const questionStats = game.questions.map((q) => ({
    questionId: q.id,
    position: q.position,
    total: totals.find((t) => t.questionId === q.id)?._count._all ?? 0,
    correct: corrects.find((c) => c.questionId === q.id)?._count._all ?? 0,
  }))

  return {
    id: game.id,
    userId: game.userId,
    slug: game.slug,
    coupleNames: game.coupleNames,
    weddingDate: game.weddingDate.toISOString().split('T')[0]!,
    tagline: game.tagline,
    status: game.status,
    createdAt: game.createdAt.toISOString(),
    updatedAt: game.updatedAt.toISOString(),
    players: game.players.map((p) => ({
      id: p.id,
      displayName: p.displayName,
      score: p.score,
      finishedAt: p.finishedAt?.toISOString() ?? null,
    })),
    _count: game._count,
    questionStats,
  }
}

export async function deployGame(id: string): Promise<ActionResult> {
  const user = await getAuthUser()

  const game = await prisma.game.findUnique({
    where: { id },
    include: { _count: { select: { questions: true } } },
  })

  if (!game || game.userId !== user.id) notFound()

  if (game._count.questions < 3) {
    return { success: false, error: 'דרושות לפחות 3 שאלות לפרסום' }
  }

  for (let i = 0; i < 10; i++) {
    try {
      await prisma.game.update({
        where: { id, userId: user.id },
        data: { slug: generateSlug(), status: 'LIVE' },
      })
      revalidatePath('/dashboard')
      revalidatePath(`/dashboard/games/${id}`)
      return { success: true }
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') continue
      throw e
    }
  }

  return { success: false, error: 'שגיאה ביצירת קישור ייחודי, נסה שוב' }
}

export async function undeployGame(id: string): Promise<ActionResult> {
  const user = await getAuthUser()

  const game = await prisma.game.findUnique({ where: { id } })
  if (!game || game.userId !== user.id) notFound()

  await prisma.game.update({
    where: { id, userId: user.id },
    data: { status: 'DRAFT' },
  })

  revalidatePath('/dashboard')
  revalidatePath(`/dashboard/games/${id}`)
  return { success: true }
}
