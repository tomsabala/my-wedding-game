import { getPassingCard } from '@/app/actions/players'
import { notFound } from 'next/navigation'
import InterstitialClient from './_components/InterstitialClient'

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ cardId?: string }>
}

export default async function InterstitialPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { cardId } = await searchParams
  if (!cardId) notFound()

  const card = await getPassingCard(slug, cardId)
  if (!card) notFound()

  return <InterstitialClient slug={slug} card={card} />
}
