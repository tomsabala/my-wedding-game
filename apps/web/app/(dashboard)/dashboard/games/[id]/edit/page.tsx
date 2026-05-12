import { redirect } from 'next/navigation'

type Props = { params: Promise<{ id: string }> }

export default async function EditRedirectPage({ params }: Props) {
  const { id } = await params
  redirect(`/dashboard/games/${id}/settings`)
}
