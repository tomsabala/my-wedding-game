import { redirect } from 'next/navigation'
import { getLeaderboard } from '@/app/actions/players'
import LeaderboardClient from './_components/LeaderboardClient'

type Props = { params: Promise<{ slug: string }> }

export default async function LeaderboardPage({ params }: Props) {
  const { slug } = await params
  const data = await getLeaderboard(slug)
  if (!data) redirect(`/${slug}`)
  return <LeaderboardClient slug={slug} initialData={data} />
}
