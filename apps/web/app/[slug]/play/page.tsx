import { redirect } from 'next/navigation'
import { getGameForPlay } from '@/app/actions/players'
import GamePlayer from './_components/GamePlayer'

type Props = { params: Promise<{ slug: string }> }

export default async function PlayPage({ params }: Props) {
  const { slug } = await params
  const game = await getGameForPlay(slug)
  if (!game) redirect(`/${slug}`)
  return <GamePlayer slug={slug} initialGame={game} />
}
