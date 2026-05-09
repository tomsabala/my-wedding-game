import Link from 'next/link'
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

export default function GameCard({ game }: Props) {
  const formattedDate = new Intl.DateTimeFormat('he-IL', { dateStyle: 'long' }).format(
    new Date(game.weddingDate),
  )

  return (
    <Link
      href={`/dashboard/games/${game.id}`}
      className="block rounded-xl bg-white transition-all hover:-translate-y-0.5"
      style={{
        padding: 'var(--dashboard-card-padding)',
        boxShadow: 'var(--dashboard-card-shadow)',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <h2
          style={{ fontSize: 'var(--dashboard-subheading-size)', fontWeight: 'var(--dashboard-subheading-weight)' }}
          className="text-zinc-900"
        >
          {game.coupleNames}
        </h2>
        <span
          className={cn(
            'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold',
            game.status === 'LIVE'
              ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200'
              : 'bg-zinc-100 text-zinc-400',
          )}
        >
          {game.status === 'LIVE' ? 'פעיל' : 'טיוטה'}
        </span>
      </div>
      <p className="mt-1.5 text-zinc-400" style={{ fontSize: 'var(--dashboard-label-size)' }}>
        {formattedDate}
      </p>
      {game.status === 'LIVE' && (
        <p
          className="mt-3 border-t border-zinc-100 pt-3 text-zinc-500"
          style={{ fontSize: 'var(--dashboard-small-size)' }}
        >
          {game._count.players} שחקנים
        </p>
      )}
    </Link>
  )
}
