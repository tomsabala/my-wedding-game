import { cache } from 'react'
import { prisma } from '@repo/db'
import type { User } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

export type ActionResult<T = void> = T extends void
  ? { success: true; warning?: string } | { success: false; error: string }
  : { success: true; data: T; warning?: string } | { success: false; error: string }

// Reads the session from the cookie (local parse, no Supabase network call).
// Wrapped in React cache() so multiple callers in one RSC render pay once.
export const getAuthUser = cache(async (): Promise<User> => {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')
  return session.user
})

/**
 * Verifies the current user owns the given game.
 * Calls `notFound()` if the game is missing or owned by another user.
 * Returns the auth user and the game's `{ id, userId }`.
 * Used only by mutation actions — read actions fold ownership into their data query.
 */
export async function assertGameOwner(gameId: string) {
  const user = await getAuthUser()
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: { id: true, userId: true },
  })
  if (!game || game.userId !== user.id) notFound()
  return { user, game }
}
