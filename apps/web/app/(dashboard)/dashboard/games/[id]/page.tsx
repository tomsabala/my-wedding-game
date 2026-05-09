import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Button } from '@/components/ui/button'
import { getGame } from '@/app/actions/games'
import GameStats from './_components/GameStats'
import DeploySection from './_components/DeploySection'

type Props = {
  params: Promise<{ id: string }>
}

export default async function GameDetailPage({ params }: Props) {
  const { id } = await params
  const t = await getTranslations('dashboard')
  const game = await getGame(id)

  return (
    <div className="mx-auto max-w-2xl rounded-2xl bg-white shadow-xl space-y-8" style={{ padding: '32px' }}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1
            className="tracking-tight text-zinc-900"
            style={{
              fontSize: 'var(--dashboard-heading-size)',
              fontWeight: 'var(--dashboard-heading-weight)',
            }}
          >
            {game.coupleNames}
          </h1>
          {game.tagline && (
            <p className="mt-1 text-zinc-400" style={{ fontSize: 'var(--dashboard-label-size)' }}>
              {game.tagline}
            </p>
          )}
        </div>
        <Link href={`/dashboard/games/${id}/edit`}>
          <Button variant="outline">{t('editGame')}</Button>
        </Link>
      </div>

      {game.status === 'LIVE' && (
        <GameStats players={game.players} questionStats={game.questionStats} />
      )}

      <DeploySection
        game={{
          id: game.id,
          slug: game.slug,
          status: game.status,
          _count: game._count,
        }}
      />
    </div>
  )
}
