'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'

import { createClient } from '@/lib/supabase/client'
import { getLeaderboard, type LeaderboardEntry } from '@/app/actions/players'
import { readPlayer } from '@/lib/player-storage'
import GameNav from '../../play/_components/GameNav'

type Props = {
  slug: string
  gameId: string
  coupleNames: string
  initialPlayers: LeaderboardEntry[]
}

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  return m > 0 ? `${m}:${String(s % 60).padStart(2, '0')}` : `${s}s`
}

export default function LeaderboardClient({ slug, gameId, coupleNames, initialPlayers }: Props) {
  const t = useTranslations('game')
  const [players, setPlayers] = useState<LeaderboardEntry[]>(initialPlayers)
  const [showAll, setShowAll] = useState(false)

  const myPlayerId = useMemo(() => {
    const stored = readPlayer()
    return stored?.slug === slug ? stored.playerId : null
  }, [slug])

  useEffect(() => {
    const supabase = createClient()
    let debounceTimer: ReturnType<typeof setTimeout> | null = null

    async function refresh() {
      const next = await getLeaderboard(slug)
      if (next) setPlayers(next.players)
    }

    void refresh()

    const channel = supabase
      .channel(`leaderboard:${gameId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'players', filter: `game_id=eq.${gameId}` },
        () => {
          if (debounceTimer) clearTimeout(debounceTimer)
          debounceTimer = setTimeout(() => void refresh(), 300)
        },
      )
      .subscribe()

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      void supabase.removeChannel(channel)
    }
  }, [slug, gameId])

  const top3 = players.slice(0, 3)
  const rest = players.slice(3)
  const visible = showAll ? players : players.slice(0, 10)

  return (
    <main dir="rtl" className="min-h-screen bg-wedding-bg flex flex-col">
      <div className="flex-1 px-5 py-8 max-w-2xl w-full mx-auto flex flex-col gap-6">
        {/* Banner */}
        <div className="rounded-3xl bg-gradient-to-br from-wedding-primary-container via-wedding-surface-low to-wedding-tertiary-container/60 p-6 text-center">
          <h1 className="font-serif text-3xl font-bold text-wedding-primary">
            {t('congratulations')}
          </h1>
          <p className="mt-2 text-sm text-wedding-on-surface-variant">{coupleNames}</p>
        </div>

        {/* Top 3 podium */}
        {top3.length > 0 && (
          <div className="grid grid-cols-3 gap-3 items-end">
            {top3[1] && <PodiumCard rank={2} player={top3[1]} highlight={top3[1].id === myPlayerId} />}
            {top3[0] && <PodiumCard rank={1} player={top3[0]} highlight={top3[0].id === myPlayerId} />}
            {top3[2] && <PodiumCard rank={3} player={top3[2]} highlight={top3[2].id === myPlayerId} />}
          </div>
        )}

        {/* Full list */}
        {rest.length > 0 && (
          <div className="rounded-2xl bg-wedding-surface border border-wedding-outline-variant overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-wedding-outline-variant">
              <h2 className="text-sm font-semibold text-wedding-on-surface">
                {t('fullRanking')}
              </h2>
              <span className="text-xs text-wedding-on-surface-variant">
                {t('participants', { n: players.length })}
              </span>
            </div>
            <ul className="divide-y divide-wedding-outline-variant">
              {visible.map((p, i) => {
                const mine = p.id === myPlayerId
                return (
                  <li
                    key={p.id}
                    className={`flex items-center gap-3 p-3 ${mine ? 'bg-wedding-tertiary-container/30' : ''}`}
                  >
                    <span className="size-7 inline-flex items-center justify-center rounded-full bg-wedding-surface-container text-xs font-bold text-wedding-on-surface-variant shrink-0">
                      {i + 1}
                    </span>
                    <span className="size-8 inline-flex items-center justify-center rounded-full bg-wedding-secondary-container text-xs font-semibold text-wedding-secondary shrink-0">
                      {p.displayName.charAt(0)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-wedding-on-surface truncate">
                        {p.displayName} {mine ? `(${t('you')})` : ''}
                      </p>
                      <p className="text-xs text-wedding-on-surface-variant">
                        {t('correctCount', { n: p.correctCount })}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-wedding-on-surface shrink-0">
                      {formatTime(p.totalTimeTakenMs)}
                    </span>
                  </li>
                )
              })}
            </ul>
            {players.length > 10 && !showAll && (
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className="w-full p-3 text-sm text-wedding-primary hover:bg-wedding-surface-low"
              >
                {t('viewAll')}
              </button>
            )}
          </div>
        )}
      </div>

      <GameNav slug={slug} active="leaderboard" />
    </main>
  )
}

function PodiumCard({
  rank,
  player,
  highlight,
}: {
  rank: 1 | 2 | 3
  player: LeaderboardEntry
  highlight: boolean
}) {
  const sizes = {
    1: { container: 'pt-2 pb-5', avatar: 'size-16', text: 'text-base', icon: 'stars' },
    2: { container: 'pt-4 pb-4', avatar: 'size-12', text: 'text-sm', icon: 'workspace_premium' },
    3: { container: 'pt-6 pb-3', avatar: 'size-12', text: 'text-sm', icon: 'workspace_premium' },
  }
  const s = sizes[rank]
  const bg =
    rank === 1
      ? 'bg-wedding-tertiary-container'
      : rank === 2
        ? 'bg-wedding-secondary-container'
        : 'bg-wedding-primary-container'

  return (
    <div
      className={`rounded-2xl border border-wedding-outline-variant ${bg} flex flex-col items-center px-2 ${s.container} ${
        highlight ? 'ring-2 ring-wedding-tertiary' : ''
      }`}
    >
      <span
        className="material-symbols-rounded text-wedding-tertiary"
        style={{ fontSize: rank === 1 ? '28px' : '20px', lineHeight: 1 }}
      >
        {s.icon}
      </span>
      <span
        className={`mt-1 inline-flex ${s.avatar} items-center justify-center rounded-full bg-wedding-surface text-sm font-bold text-wedding-primary`}
      >
        {player.displayName.charAt(0)}
      </span>
      <p className={`mt-1 ${s.text} font-semibold text-wedding-on-surface truncate w-full text-center`}>
        {player.displayName}
      </p>
      <p className="text-xs font-bold text-wedding-on-surface">{player.correctCount} ✓</p>
      <p className="text-xs text-wedding-on-surface-variant">{formatTime(player.totalTimeTakenMs)}</p>
    </div>
  )
}
