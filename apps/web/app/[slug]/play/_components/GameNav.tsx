'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'

type Tab = 'play' | 'leaderboard' | 'score'

type Props = { slug: string; active: Tab }

export default function GameNav({ slug, active }: Props) {
  const t = useTranslations('game')
  const items: { key: Tab; label: string; icon: string; href: string | null }[] = [
    { key: 'play', label: t('play'), icon: 'play_circle', href: `/${slug}/play` },
    { key: 'leaderboard', label: t('rankings'), icon: 'leaderboard', href: `/${slug}/leaderboard` },
    { key: 'score', label: t('myScore'), icon: 'scoreboard', href: null },
  ]

  return (
    <nav className="sticky bottom-0 flex border-t border-wedding-outline-variant bg-wedding-surface">
      {items.map((item) => {
        const isActive = item.key === active
        const cls = `flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium ${
          isActive ? 'text-wedding-primary' : 'text-wedding-on-surface-variant'
        }`
        const inner = (
          <>
            <span
              className="material-symbols-rounded"
              style={{ fontSize: '22px', lineHeight: 1 }}
            >
              {item.icon}
            </span>
            <span>{item.label}</span>
          </>
        )
        return item.href ? (
          <Link key={item.key} href={item.href} className={cls}>
            {inner}
          </Link>
        ) : (
          <span key={item.key} className={cls + ' opacity-60'}>
            {inner}
          </span>
        )
      })}
    </nav>
  )
}
