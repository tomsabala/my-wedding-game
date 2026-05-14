import { prisma } from '@repo/db'
import type { PassingCardType, CardLayout } from '@repo/shared'

import { getPassingCards } from '@/app/actions/passingCards'
import { PerfMount } from '@/components/perf-mount'
import PassingCardsList from './_components/PassingCardsList'

type Props = { params: Promise<{ id: string }> }

export default async function PassingCardsPage({ params }: Props) {
  const t0 = performance.now()
  const { id } = await params

  // getPassingCards includes an assertGameOwner ownership check (extra DB round trip)
  const tCards = performance.now()
  const [cards, questionCount] = await Promise.all([
    getPassingCards(id),
    prisma.question.count({ where: { gameId: id } }),
  ])
  console.log(`[perf-server] PassingCardsPage parallel fetch: ${(performance.now() - tCards).toFixed(1)}ms  cards=${cards.length} questionCount=${questionCount}`)
  console.log(`[perf-server] PassingCardsPage total: ${(performance.now() - t0).toFixed(1)}ms`)

  return (
    <>
      <PerfMount label="PassingCardsPage" />
      <PassingCardsList
        gameId={id}
        initialCards={cards.map((c) => ({
          id: c.id,
          type: c.type as PassingCardType,
          content: c.content,
          layout: (c.layout ?? null) as CardLayout | null,
          afterQuestionPosition: c.afterQuestionPosition,
        }))}
        questionCount={questionCount}
      />
    </>
  )
}
