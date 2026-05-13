import { getGameForPreview } from '@/app/actions/games'
import PreviewPlayer from './_components/PreviewPlayer'

type Props = { params: Promise<{ id: string }> }

export default async function PreviewPage({ params }: Props) {
  const { id } = await params
  const game = await getGameForPreview(id)
  return <PreviewPlayer game={game} />
}
