'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

type Tab = { href: string; label: string; icon: string; exact?: boolean }

export default function GameTabs({ id }: { id: string }) {
  const pathname = usePathname()

  const tabs: Tab[] = [
    { href: `/dashboard/games/${id}`, label: 'סקירה', icon: 'quiz', exact: true },
    { href: `/dashboard/games/${id}/questions`, label: 'שאלות', icon: 'edit_note' },
    { href: `/dashboard/games/${id}/media`, label: 'מדיה', icon: 'photo_library' },
    { href: `/dashboard/games/${id}/settings`, label: 'הגדרות', icon: 'settings_heart' },
  ]

  return (
    <nav className="flex border-b border-wedding-outline-variant">
      {tabs.map((tab) => {
        const isActive = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
              isActive
                ? 'border-wedding-primary text-wedding-primary'
                : 'border-transparent text-wedding-on-surface-variant hover:text-wedding-on-surface hover:border-wedding-outline',
            )}
          >
            <span className="material-symbols-rounded" style={{ fontSize: '20px', lineHeight: 1 }}>
              {tab.icon}
            </span>
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
