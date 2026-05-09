import { getTranslations } from 'next-intl/server'

type QuestionStat = {
  questionId: string
  position: number
  total: number
  correct: number
}

type Props = {
  players: { displayName: string; score: number }[]
  questionStats: QuestionStat[]
}

export default async function GameStats({ players, questionStats }: Props) {
  const t = await getTranslations('dashboard.stats')

  const totalPlayers = players.length
  const avgScore =
    totalPlayers > 0 ? Math.round(players.reduce((s, p) => s + p.score, 0) / totalPlayers) : 0
  const topPlayer = [...players].sort((a, b) => b.score - a.score)[0]

  return (
    <section className="rounded-lg border p-5 space-y-5">
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold">{totalPlayers}</p>
          <p className="text-xs text-muted-foreground mt-1">{t('totalPlayers')}</p>
        </div>
        <div>
          <p className="text-2xl font-bold">{avgScore}</p>
          <p className="text-xs text-muted-foreground mt-1">{t('avgScore')}</p>
        </div>
        <div>
          <p className="text-2xl font-bold truncate">{topPlayer?.displayName ?? '—'}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {t('topPlayer')}
            {topPlayer ? ` (${topPlayer.score})` : ''}
          </p>
        </div>
      </div>

      {questionStats.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-3">{t('questionAccuracy')}</h3>
          <div className="space-y-2">
            {questionStats.map((q) => {
              const pct = q.total > 0 ? Math.round((q.correct / q.total) * 100) : 0
              return (
                <div key={q.questionId} className="flex items-center gap-3 text-sm">
                  <span className="w-20 shrink-0 text-muted-foreground">
                    שאלה {q.position + 1}
                  </span>
                  <div className="flex-1 rounded-full bg-zinc-100 h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-green-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-24 shrink-0 text-left text-muted-foreground">
                    {q.correct}/{q.total} ({pct}%)
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}
