import LeaderboardClient from './_components/LeaderboardClient'

type Props = { params: Promise<{ slug: string }> }

export default async function LeaderboardPage({ params }: Props) {
  const { slug } = await params
  return <LeaderboardClient slug={slug} />
}
