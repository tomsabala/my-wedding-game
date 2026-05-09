interface Props {
  params: Promise<{ slug: string }>
}

export default async function GamePage({ params }: Props) {
  const { slug } = await params

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white">
      <h1 className="text-2xl font-semibold text-zinc-900">Game: {slug}</h1>
      <p className="mt-2 text-zinc-500">Coming soon</p>
    </main>
  )
}
