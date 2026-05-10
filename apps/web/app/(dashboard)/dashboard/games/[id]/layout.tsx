import GameTabs from './_components/GameTabs'

type Props = {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

export default async function GameDetailLayout({ children, params }: Props) {
  const { id } = await params
  return (
    <div className="mx-auto max-w-4xl">
      <GameTabs id={id} />
      <div className="mt-6">{children}</div>
    </div>
  )
}
