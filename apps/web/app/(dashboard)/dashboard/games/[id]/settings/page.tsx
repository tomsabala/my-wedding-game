import { getGame } from '@/app/actions/games'
import SettingsForm from './_components/SettingsForm'

type Props = { params: Promise<{ id: string }> }

export default async function GameSettingsPage({ params }: Props) {
  const { id } = await params
  const game = await getGame(id)

  return (
    <SettingsForm
      game={{
        id: game.id,
        coupleNames: game.coupleNames,
        weddingDate: game.weddingDate,
        tagline: game.tagline,
      }}
    />
  )
}
