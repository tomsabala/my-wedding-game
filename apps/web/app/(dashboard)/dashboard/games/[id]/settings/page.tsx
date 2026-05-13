import { getGameForSettings } from '@/app/actions/games'
import { PerfMount } from '@/components/perf-mount'
import SettingsForm from './_components/SettingsForm'

type Props = { params: Promise<{ id: string }> }

export default async function GameSettingsPage({ params }: Props) {
  const t0 = performance.now()
  const { id } = await params
  const game = await getGameForSettings(id)
  console.log(`[perf-server] GameSettingsPage total: ${(performance.now() - t0).toFixed(1)}ms`)
  return (
    <>
      <PerfMount label="GameSettingsPage" />
      <SettingsForm game={game} />
    </>
  )
}
