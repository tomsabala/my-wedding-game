import { getGameForSettings } from '@/app/actions/games'
import SettingsForm from './_components/SettingsForm'

type Props = { params: Promise<{ id: string }> }

export default async function GameSettingsPage({ params }: Props) {
  const { id } = await params
  const game = await getGameForSettings(id)
  return <SettingsForm game={game} />
}
