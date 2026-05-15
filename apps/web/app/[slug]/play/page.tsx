import GamePlayer from './_components/GamePlayer'

type Props = { params: Promise<{ slug: string }> }

export default async function PlayPage({ params }: Props) {
  const { slug } = await params
  return <GamePlayer slug={slug} />
}
