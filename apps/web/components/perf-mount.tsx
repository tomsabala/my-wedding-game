'use client'

import { useEffect } from 'react'

declare global {
  interface Window {
    __tabClickTime?: number
    __nextQuestionClickTime?: number
  }
}

/**
 * Drops a console log when the component mounts on the client.
 * Records two timings:
 *   - ms since the last tab-link click  (end-to-end: click → hydrated)
 *   - performance.now() absolute        (time since page opened)
 *
 * Usage: drop <PerfMount label="QuestionsPage" /> anywhere in a page component.
 */
export function PerfMount({ label }: { label: string }) {
  useEffect(() => {
    const now = performance.now()
    const sinceClick =
      typeof window.__tabClickTime === 'number'
        ? `${(now - window.__tabClickTime).toFixed(1)}ms after click`
        : 'first load'
    console.log(`[perf-client] ${label} mounted — ${sinceClick} (perf.now=${now.toFixed(1)})`)
  }, [label])

  return null
}
