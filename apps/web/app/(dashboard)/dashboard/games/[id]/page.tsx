import { getGame } from '@/app/actions/games'
import DeploySection from './_components/DeploySection'
import QRCodeSection from './_components/QRCodeSection'
import GameStats from './_components/GameStats'

type Props = { params: Promise<{ id: string }> }

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 60) return `לפני ${mins} דקות`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `לפני ${hours} שעות`
  return `לפני ${Math.floor(hours / 24)} ימים`
}

export default async function GameDetailPage({ params }: Props) {
  const { id } = await params
  const game = await getGame(id)

  const weddingDate = new Intl.DateTimeFormat('he-IL', { dateStyle: 'long' }).format(
    new Date(game.weddingDate),
  )

  const avatarPlayers = game.players.slice(0, 3)
  const extraPlayers = Math.max(0, game._count.players - 3)

  const recentActivity = game.players.slice(0, 3)

  return (
    <div className="space-y-5">
      {/* ── Header card ───────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-wedding-surface border border-wedding-outline-variant p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-wedding-on-surface leading-snug">
              {game.coupleNames}
            </h1>
            <p className="mt-1 text-sm text-wedding-on-surface-variant">
              {game.tagline ? `${game.tagline} · ` : ''}
              {weddingDate}
            </p>

            <div className="mt-3 flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  game.status === 'LIVE'
                    ? 'bg-wedding-primary-container text-wedding-primary'
                    : 'bg-wedding-surface-container text-wedding-on-surface-variant'
                }`}
              >
                <span
                  className={`size-1.5 rounded-full ${game.status === 'LIVE' ? 'bg-wedding-primary' : 'bg-wedding-outline'}`}
                />
                {game.status === 'LIVE' ? 'פעיל' : 'טיוטה'}
              </span>
            </div>
          </div>

          <DeploySection
            game={{ id: game.id, status: game.status, _count: game._count }}
          />
        </div>

        {/* Guest avatar row */}
        {game.status === 'LIVE' && game._count.players > 0 && (
          <div className="mt-4 flex items-center gap-2 border-t border-wedding-outline-variant pt-4">
            <div className="flex -space-x-2 space-x-reverse">
              {avatarPlayers.map((p) => (
                <div
                  key={p.id}
                  className="size-8 rounded-full bg-wedding-secondary-container border-2 border-wedding-surface flex items-center justify-center text-xs font-semibold text-wedding-secondary"
                  title={p.displayName}
                >
                  {p.displayName.charAt(0)}
                </div>
              ))}
            </div>
            <span className="text-sm text-wedding-on-surface-variant">
              {extraPlayers > 0 ? `+${extraPlayers} ` : ''}
              {game._count.players} שחקנים
            </span>
          </div>
        )}
      </div>

      {/* ── Stats grid ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="rounded-2xl bg-wedding-surface border border-wedding-outline-variant p-6">
          <GameStats
            questionCount={game._count.questions}
            playerCount={game._count.players}
          />
        </div>

        <div className="rounded-2xl bg-wedding-surface border border-wedding-outline-variant p-6">
          {game.status === 'LIVE' ? (
            <QRCodeSection slug={game.slug} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3 py-4">
              <span
                className="material-symbols-rounded text-wedding-outline"
                style={{ fontSize: '40px', lineHeight: 1 }}
              >
                qr_code_2
              </span>
              <p className="text-sm text-wedding-on-surface-variant text-center">
                קוד QR יופיע לאחר פרסום המשחק
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Activity feed ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-wedding-surface border border-wedding-outline-variant p-6">
        <h2 className="text-sm font-semibold text-wedding-on-surface mb-4">עדכונים אחרונים</h2>
        {recentActivity.length === 0 ? (
          <p className="text-sm text-wedding-on-surface-variant text-center py-4">
            אין פעילות עדיין. שתפו את הקישור עם האורחים!
          </p>
        ) : (
          <ul className="space-y-3">
            {recentActivity.map((p) => (
              <li key={p.id} className="flex items-center gap-3">
                <div className="size-8 shrink-0 rounded-full bg-wedding-secondary-container flex items-center justify-center">
                  <span
                    className="material-symbols-rounded text-wedding-secondary"
                    style={{ fontSize: '16px', lineHeight: 1 }}
                  >
                    person
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-wedding-on-surface truncate">
                    {p.displayName} הצטרף למשחק
                  </p>
                </div>
                <span className="text-xs text-wedding-on-surface-variant shrink-0">
                  {relativeTime(p.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
