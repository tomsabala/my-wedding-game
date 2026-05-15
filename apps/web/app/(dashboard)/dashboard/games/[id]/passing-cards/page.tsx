import type { PassingCardType, CardLayout } from '@repo/shared'

import { getPassingCards } from '@/app/actions/passingCards'
import PassingCardsList from './_components/PassingCardsList'

type Props = { params: Promise<{ id: string }> }

export default async function PassingCardsPage({ params }: Props) {
  const { id } = await params
  const { passingCards, questionCount } = await getPassingCards(id)

  return (
    <PassingCardsList
      gameId={id}
      initialCards={passingCards.map((c) => ({
        id: c.id,
        type: c.type as PassingCardType,
        content: c.content,
        layout: (c.layout ?? null) as CardLayout | null,
        afterQuestionPosition: c.afterQuestionPosition,
      }))}
      questionCount={questionCount}
    />
  )
}
