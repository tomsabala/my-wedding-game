'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import DashboardNav from './DashboardNav'

const PALETTE: { color: string; text: string }[] = [
  { color: '#FF6B6B', text: '#ffffff' },
  { color: '#FFA552', text: '#2d1500' },
  { color: '#E8C840', text: '#2a2000' },
  { color: '#6DB87A', text: '#ffffff' },
  { color: '#6B9FFF', text: '#ffffff' },
  { color: '#A78BFA', text: '#ffffff' },
]

function pickColors() {
  const bgIdx = Math.floor(Math.random() * PALETTE.length)
  const navIdx = (bgIdx + 1 + Math.floor(Math.random() * (PALETTE.length - 1))) % PALETTE.length
  return { bg: PALETTE[bgIdx]!, nav: PALETTE[navIdx]! }
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [colors, setColors] = useState(pickColors)

  useEffect(() => {
    setColors(pickColors())
  }, [pathname])

  return (
    <div
      className="flex min-h-screen flex-col"
      dir="rtl"
      style={{ backgroundColor: colors.bg.color }}
      suppressHydrationWarning
    >
      <DashboardNav color={colors.nav.color} text={colors.nav.text} accent={colors.bg.color} />
      <main className="flex-1" style={{ padding: 'var(--dashboard-page-padding)' }}>
        {children}
      </main>
    </div>
  )
}
