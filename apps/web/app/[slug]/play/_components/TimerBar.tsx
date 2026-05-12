'use client'

import { useEffect, useRef, useState } from 'react'

type Props = {
  durationMs: number
  paused: boolean
  onTimeout: () => void
}

export default function TimerBar({ durationMs, paused, onTimeout }: Props) {
  const [remaining, setRemaining] = useState(durationMs)
  const calledRef = useRef(false)

  useEffect(() => {
    if (paused) return
    const start = Date.now()
    const id = setInterval(() => {
      const elapsed = Date.now() - start
      const next = Math.max(0, durationMs - elapsed)
      setRemaining(next)
      if (next === 0 && !calledRef.current) {
        calledRef.current = true
        clearInterval(id)
        onTimeout()
      }
    }, 100)
    return () => clearInterval(id)
  }, [durationMs, paused, onTimeout])

  const pct = (remaining / durationMs) * 100
  const danger = pct < 25

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-wedding-on-surface-variant">
        <span>{Math.ceil(remaining / 1000)}s</span>
      </div>
      <div className="h-2 rounded-full bg-wedding-surface-container overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            danger ? 'bg-wedding-error' : 'bg-wedding-tertiary-container'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
