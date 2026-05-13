import { cache } from 'react'
import { prisma } from '@repo/db'
import type { User } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

export type ActionResult<T = void> = T extends void
  ? { success: true } | { success: false; error: string }
  : { success: true; data: T } | { success: false; error: string }

// getSession() reads from the cookie — no Supabase network round trip.
// The middleware calls getUser() on every request and writes a fresh session cookie,
// so by the time we reach an RSC the cookie is already validated.
// Wrapped in React cache() so multiple callers within one render pay the cost once.
export const getAuthUser = cache(async (): Promise<User> => {
  const t0 = performance.now()
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  console.log(`[perf-server] getAuthUser (cookie read): ${(performance.now() - t0).toFixed(1)}ms`)
  if (!session?.user) throw new Error('Unauthorized')
  return session.user
})

/**
 * Verifies the current user owns the given game.
 * Calls `notFound()` if the game is missing or owned by another user.
 * Returns the auth user and the game's `{ id, userId }`.
 */
// NOTE: assertGameOwner fires an extra DB query on every tab switch to verify
// ownership. This is a redundant round trip — the page's own data query already
// fetches the same game. It's a known bottleneck; logged here for visibility.
export async function assertGameOwner(gameId: string) {
  const t0 = performance.now()
  const user = await getAuthUser()
  const tOwnership = performance.now()
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: { id: true, userId: true },
  })
  console.log(`[perf-server] assertGameOwner — ownership DB query: ${(performance.now() - tOwnership).toFixed(1)}ms  total (incl auth): ${(performance.now() - t0).toFixed(1)}ms`)
  if (!game || game.userId !== user.id) notFound()
  return { user, game }
}
