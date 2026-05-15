'use client'

import { useEffect, useRef } from 'react'

export function useBackPrevention(onBackAttempt: () => void): void {
  const callbackRef = useRef(onBackAttempt)
  callbackRef.current = onBackAttempt

  useEffect(() => {
    window.history.pushState(null, '', window.location.href)
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href)
      callbackRef.current()
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])
}
