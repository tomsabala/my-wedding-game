'use server'

import { Prisma, prisma } from '@repo/db'
import { createGameSchema, generateSlug, type CreateGameInput } from '@repo/shared'
import { notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'

import { getAuthUser, type ActionResult } from '@/lib/actions'

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
  const t0 = performance.now()
  const user = await getAuthUser()

  const tFindUnique = performance.now()
  const game = await prisma.game.findUnique({
    where: { id },
    include: {
      players: {
        select: { id: true, displayName: true, score: true, finishedAt: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      },
      _count: { select: { questions: true, players: true } },
    },
  })
  console.log(`[perf] getGame findUnique: ${(performance.now() - tFindUnique).toFixed(1)}ms`)

  if (!game || game.userId !== user.id) notFound()

  console.log(`[perf] getGame total: ${(performance.now() - t0).toFixed(1)}ms`)
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
      createdAt: p.createdAt.toISOString(),
    })),
    _count: game._count,
  }
}

export async function getGameForSettings(id: string) {
  const t0 = performance.now()
  const user = await getAuthUser()
  const game = await prisma.game.findUnique({
    where: { id },
    select: { id: true, userId: true, coupleNames: true, weddingDate: true, tagline: true },
  })
  console.log(`[perf] getGameForSettings: ${(performance.now() - t0).toFixed(1)}ms`)
  if (!game || game.userId !== user.id) notFound()
  return {
    id: game.id,
    coupleNames: game.coupleNames,
    weddingDate: game.weddingDate.toISOString().split('T')[0]!,
    tagline: game.tagline,
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

export async function updateGame(
  id: string,
  data: CreateGameInput,
): Promise<ActionResult> {
  const user = await getAuthUser()

  const parsed = createGameSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? 'שגיאה בנתונים' }
  }

  const existing = await prisma.game.findUnique({ where: { id } })
  if (!existing || existing.userId !== user.id) notFound()

  const { coupleNames, weddingDate, tagline } = parsed.data

  await prisma.game.update({
    where: { id, userId: user.id },
    data: {
      coupleNames,
      weddingDate: new Date(weddingDate),
      tagline: tagline ?? null,
    },
  })

  revalidatePath('/dashboard')
  revalidatePath(`/dashboard/games/${id}`)
  revalidatePath(`/dashboard/games/${id}/settings`)
  return { success: true }
}

export async function deleteGame(id: string): Promise<ActionResult> {
  const user = await getAuthUser()

  const existing = await prisma.game.findUnique({ where: { id } })
  if (!existing || existing.userId !== user.id) notFound()

  await prisma.game.delete({ where: { id, userId: user.id } })

  revalidatePath('/dashboard')
  return { success: true }
}
