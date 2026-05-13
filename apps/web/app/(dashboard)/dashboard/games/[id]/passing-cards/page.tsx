import { prisma } from '@repo/db'
import type { PassingCardType } from '@repo/shared'

import { getPassingCards } from '@/app/actions/passingCards'
import PassingCardsList from './_components/PassingCardsList'

type Props = { params: Promise<{ id: string }> }

export default async function PassingCardsPage({ params }: Props) {
  const t0 = performance.now()
  const { id } = await params

  const [cards, questionCount] = await Promise.all([
    getPassingCards(id),
    prisma.question.count({ where: { gameId: id } }),
  ])
  console.log(`[perf] PassingCardsPage total render data fetch: ${(performance.now() - t0).toFixed(1)}ms`)

  return (
    <PassingCardsList
      gameId={id}
      initialCards={cards.map((c) => ({
        id: c.id,
        type: c.type as PassingCardType,
        content: c.content,
        afterQuestionPosition: c.afterQuestionPosition,
      }))}
      questionCount={questionCount}
    />
  )
}
