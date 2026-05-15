'use server'

import { prisma } from '@repo/db'
import { questionSchema, type QuestionInput } from '@repo/shared'
import { notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'

import { assertGameOwner, getAuthUser, type ActionResult } from '@/lib/actions'

type QuestionRow = {
  id: string
  gameId: string
  text: string
  options: string[]
  correctIndex: number
  position: number
}

export async function getQuestions(gameId: string): Promise<QuestionRow[]> {
  const user = await getAuthUser()
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: {
      userId: true,
      questions: {
        orderBy: { position: 'asc' },
        select: { id: true, gameId: true, text: true, options: true, correctIndex: true, position: true },
      },
    },
  })
  if (!game || game.userId !== user.id) notFound()
  return game.questions.map((q) => ({
    id: q.id,
    gameId: q.gameId,
    text: q.text,
    options: q.options as string[],
    correctIndex: q.correctIndex,
    position: q.position,
  }))
}

export async function createQuestion(
  gameId: string,
  data: Omit<QuestionInput, 'position'>,
): Promise<ActionResult<{ id: string }>> {
  await assertGameOwner(gameId)

  const last = await prisma.question.findFirst({
    where: { gameId },
    orderBy: { position: 'desc' },
    select: { position: true },
  })
  const nextPosition = last ? last.position + 1 : 0

  const parsed = questionSchema.safeParse({ ...data, position: nextPosition })
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? 'שגיאה בנתוני השאלה' }
  }

  const created = await prisma.question.create({
    data: {
      gameId,
      text: parsed.data.text,
      options: parsed.data.options,
      correctIndex: parsed.data.correctIndex,
      position: parsed.data.position,
    },
  })

  revalidatePath(`/dashboard/games/${gameId}`)
  revalidatePath(`/dashboard/games/${gameId}/questions`)
  return { success: true, data: { id: created.id } }
}

export async function updateQuestion(
  id: string,
  data: Omit<QuestionInput, 'position'>,
): Promise<ActionResult> {
  const user = await getAuthUser()
  const existing = await prisma.question.findUnique({
    where: { id },
    include: { game: { select: { id: true, userId: true } } },
  })
  if (!existing || existing.game.userId !== user.id) notFound()

  const parsed = questionSchema.safeParse({ ...data, position: existing.position })
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? 'שגיאה בנתוני השאלה' }
  }

  await prisma.question.update({
    where: { id },
    data: {
      text: parsed.data.text,
      options: parsed.data.options,
      correctIndex: parsed.data.correctIndex,
    },
  })

  revalidatePath(`/dashboard/games/${existing.gameId}`)
  revalidatePath(`/dashboard/games/${existing.gameId}/questions`)
  return { success: true }
}

export async function deleteQuestion(id: string): Promise<ActionResult> {
  const user = await getAuthUser()
  const existing = await prisma.question.findUnique({
    where: { id },
    include: { game: { select: { id: true, userId: true } } },
  })
  if (!existing || existing.game.userId !== user.id) notFound()

  await prisma.$transaction(async (tx) => {
    await tx.question.delete({ where: { id } })
    // Compact positions for subsequent questions
    await tx.question.updateMany({
      where: { gameId: existing.gameId, position: { gt: existing.position } },
      data: { position: { decrement: 1 } },
    })
  })

  revalidatePath(`/dashboard/games/${existing.gameId}`)
  revalidatePath(`/dashboard/games/${existing.gameId}/questions`)
  return { success: true }
}

export async function reorderQuestions(
  gameId: string,
  orderedIds: string[],
): Promise<ActionResult> {
  await assertGameOwner(gameId)

  await prisma.$executeRaw`
    UPDATE questions AS q
    SET    position = v.position
    FROM   (
      SELECT unnest(${orderedIds}::text[])                        AS id,
             generate_series(0, ${orderedIds.length - 1}::int)   AS position
    ) AS v
    WHERE  q.id = v.id AND q.game_id = ${gameId}
  `

  revalidatePath(`/dashboard/games/${gameId}/questions`)
  return { success: true }
}
