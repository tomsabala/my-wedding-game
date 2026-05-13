import { getGameForPreview } from '@/app/actions/games'
import PreviewPlayer from './_components/PreviewPlayer'

type Props = { params: Promise<{ id: string }> }

export default async function PreviewPage({ params }: Props) {
  const { id } = await params
  console.log(`[preview] loading game ${id}`)
  const game = await getGameForPreview(id)
  console.log(`[preview] game loaded: ${game.questions.length} questions, ${game.passingCards.length} cards`)
  return <PreviewPlayer game={game} />
}
