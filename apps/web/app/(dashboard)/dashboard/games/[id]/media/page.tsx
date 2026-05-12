import { getMediaItems } from '@/app/actions/media'
import MediaGrid from './_components/MediaGrid'

type Props = { params: Promise<{ id: string }> }

export default async function MediaPage({ params }: Props) {
  const { id } = await params
  const { items, totalBytes, quotaBytes } = await getMediaItems(id)
  return (
    <MediaGrid
      gameId={id}
      initialItems={items}
      totalBytes={totalBytes}
      quotaBytes={quotaBytes}
    />
  )
}
