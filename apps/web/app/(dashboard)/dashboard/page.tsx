import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Button } from '@/components/ui/button'
import { getGames } from '@/app/actions/games'
import GameCard from './_components/GameCard'

export default async function DashboardPage() {
  const t = await getTranslations('dashboard')
  const games = await getGames()

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1
          className="tracking-tight text-wedding-on-surface"
          style={{
            fontSize: 'var(--dashboard-heading-size)',
            fontWeight: 'var(--dashboard-heading-weight)',
          }}
        >
          {t('gamesTitle')}
        </h1>
        <Link href="/dashboard/games/new">
          <Button>{t('createGame')}</Button>
        </Link>
      </div>

      {games.length === 0 ? (
        <div className="flex items-center justify-center" style={{ minHeight: '40vh' }}>
          <p className="text-center text-wedding-on-surface-variant">{t('empty')}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      )}
    </div>
  )
}
