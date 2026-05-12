import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { cn } from '@/lib/utils'
import type { GameStatus } from '@repo/db'

type Props = {
  game: {
    id: string
    coupleNames: string
    weddingDate: Date
    status: GameStatus
    _count: { players: number }
  }
}

export default async function GameCard({ game }: Props) {
  const t = await getTranslations('dashboard')
  const formattedDate = new Intl.DateTimeFormat('he-IL', { dateStyle: 'long' }).format(
    new Date(game.weddingDate),
  )

  return (
    <Link
      href={`/dashboard/games/${game.id}`}
      className="block rounded-2xl bg-wedding-surface border border-wedding-outline-variant transition-all hover:-translate-y-0.5 hover:shadow-sm"
      style={{ padding: 'var(--dashboard-card-padding)' }}
    >
      <div className="flex items-start justify-between gap-2">
        <h2
          className="font-serif text-wedding-on-surface"
          style={{
            fontSize: 'var(--dashboard-subheading-size)',
            fontWeight: 'var(--dashboard-subheading-weight)',
          }}
        >
          {game.coupleNames}
        </h2>
        <span
          className={cn(
            'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold',
            game.status === 'LIVE'
              ? 'bg-wedding-primary-container text-wedding-primary'
              : 'bg-wedding-surface-container text-wedding-on-surface-variant',
          )}
        >
          {game.status === 'LIVE' ? t('status.live') : t('status.draft')}
        </span>
      </div>
      <p
        className="mt-1.5 text-wedding-on-surface-variant"
        style={{ fontSize: 'var(--dashboard-label-size)' }}
      >
        {formattedDate}
      </p>
      {game.status === 'LIVE' && (
        <p
          className="mt-3 border-t border-wedding-outline-variant pt-3 text-wedding-on-surface-variant"
          style={{ fontSize: 'var(--dashboard-small-size)' }}
        >
          {t('overview.playersCount', { count: game._count.players })}
        </p>
      )}
    </Link>
  )
}
