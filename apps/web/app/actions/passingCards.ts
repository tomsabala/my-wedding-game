'use server'

import { prisma, Prisma } from '@repo/db'
import { passingCardSchema, type PassingCardInput, type CardLayout } from '@repo/shared'
import { notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'

import { assertGameOwner, getAuthUser, type ActionResult } from '@/lib/actions'

export async function getPassingCards(gameId: string) {
  const t0 = performance.now()
  await assertGameOwner(gameId) // ownership check — see assertGameOwner log above
  const tQuery = performance.now()
  const result = await prisma.passingCard.findMany({
    where: { gameId },
    select: {
      id: true,
      gameId: true,
      type: true,
      content: true,
      layout: true,
      afterQuestionPosition: true,
    },
    orderBy: [{ afterQuestionPosition: 'asc' }],
  })
  console.log(`[perf-server] getPassingCards — main DB query: ${(performance.now() - tQuery).toFixed(1)}ms  total (incl assertGameOwner): ${(performance.now() - t0).toFixed(1)}ms`)
  return result
}

export async function createPassingCard(
  gameId: string,
  data: PassingCardInput,
): Promise<ActionResult<{ id: string }>> {
  await assertGameOwner(gameId)

  const parsed = passingCardSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? 'שגיאה בנתוני הכרטיסייה' }
  }

  const created = await prisma.passingCard.create({
    data: {
      gameId,
      type: parsed.data.type,
      content: parsed.data.content,
      layout: parsed.data.layout != null ? (parsed.data.layout as Prisma.InputJsonValue) : Prisma.DbNull,
      afterQuestionPosition: parsed.data.afterQuestionPosition ?? null,
    },
  })

  revalidatePath(`/dashboard/games/${gameId}/passing-cards`)
  return { success: true, data: { id: created.id } }
}

export async function updatePassingCard(
  id: string,
  data: PassingCardInput,
): Promise<ActionResult> {
  const user = await getAuthUser()
  const existing = await prisma.passingCard.findUnique({
    where: { id },
    include: { game: { select: { id: true, userId: true } } },
  })
  if (!existing || existing.game.userId !== user.id) notFound()

  const parsed = passingCardSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? 'שגיאה בנתוני הכרטיסייה' }
  }

  await prisma.passingCard.update({
    where: { id },
    data: {
      type: parsed.data.type,
      content: parsed.data.content,
      layout: parsed.data.layout != null ? (parsed.data.layout as Prisma.InputJsonValue) : Prisma.DbNull,
      afterQuestionPosition: parsed.data.afterQuestionPosition ?? null,
    },
  })

  revalidatePath(`/dashboard/games/${existing.gameId}/passing-cards`)
  return { success: true }
}

export async function updatePassingCardLayout(
  id: string,
  layout: CardLayout | null,
): Promise<ActionResult> {
  const user = await getAuthUser()
  const existing = await prisma.passingCard.findUnique({
    where: { id },
    include: { game: { select: { id: true, userId: true } } },
  })
  if (!existing || existing.game.userId !== user.id) notFound()

  await prisma.passingCard.update({
    where: { id },
    data: { layout: layout != null ? (layout as unknown as Prisma.InputJsonValue) : Prisma.DbNull },
  })

  revalidatePath(`/dashboard/games/${existing.gameId}/passing-cards`)
  return { success: true }
}

export async function deletePassingCard(id: string): Promise<ActionResult> {
  const user = await getAuthUser()
  const existing = await prisma.passingCard.findUnique({
    where: { id },
    include: { game: { select: { id: true, userId: true } } },
  })
  if (!existing || existing.game.userId !== user.id) notFound()

  await prisma.passingCard.delete({ where: { id } })

  revalidatePath(`/dashboard/games/${existing.gameId}/passing-cards`)
  return { success: true }
}

export async function savePassingCardsSequence(
  gameId: string,
  sequence: { id: string; afterQuestionPosition: number | null }[],
): Promise<ActionResult> {
  await assertGameOwner(gameId)

  await prisma.$transaction(
    sequence.map((s) =>
      prisma.passingCard.update({
        where: { id: s.id },
        data: { afterQuestionPosition: s.afterQuestionPosition },
      }),
    ),
  )

  revalidatePath(`/dashboard/games/${gameId}/passing-cards`)
  return { success: true }
}
