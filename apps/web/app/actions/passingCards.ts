'use server'

import { prisma, Prisma } from '@repo/db'
import { passingCardSchema, type PassingCardInput, type CardLayout } from '@repo/shared'
import { notFound } from 'next/navigation'
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache'

import { assertGameOwner, getAuthUser, type ActionResult } from '@/lib/actions'

export async function getPassingCards(gameId: string) {
  const user = await getAuthUser()
  const game = await unstable_cache(
    async () => prisma.game.findUnique({
      where: { id: gameId },
      select: {
        userId: true,
        _count: { select: { questions: true } },
        passingCards: {
          orderBy: [{ afterQuestionPosition: 'asc' }],
          select: { id: true, gameId: true, type: true, content: true, layout: true, afterQuestionPosition: true },
        },
      },
    }),
    [`cards-${user.id}-${gameId}`],
    { tags: [`game-${gameId}`] },
  )()
  if (!game || game.userId !== user.id) notFound()
  return { passingCards: game.passingCards, questionCount: game._count.questions }
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

  revalidateTag(`game-${gameId}`, 'default')
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

  revalidateTag(`game-${existing.gameId}`, 'default')
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

  revalidateTag(`game-${existing.gameId}`, 'default')
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

  revalidateTag(`game-${existing.gameId}`, 'default')
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

  revalidateTag(`game-${gameId}`, 'default')
  revalidatePath(`/dashboard/games/${gameId}/passing-cards`)
  return { success: true }
}
