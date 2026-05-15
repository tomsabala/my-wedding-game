import { cache } from 'react'
import { headers } from 'next/headers'
import { prisma } from '@repo/db'
import type { User } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

export type ActionResult<T = void> = T extends void
  ? { success: true } | { success: false; error: string }
  : { success: true; data: T } | { success: false; error: string }

// Fast path: middleware already called getUser() and stamped x-user-id on the
// forwarded request headers. We trust that verification and read the User from
// the cookie via getSession() — a local cookie parse, no Supabase network call.
//
// Slow path (fallback): no header present, do a full getUser() verification.
// This should only happen for routes middleware doesn't guard (shouldn't occur
// in practice for dashboard routes).
//
// Wrapped in React cache() so multiple callers in one RSC render pay once.
export const getAuthUser = cache(async (): Promise<User> => {
  const headersList = await headers()
  const middlewareUserId = headersList.get('x-user-id')

  if (middlewareUserId) {
    // Middleware already verified the JWT this request — read user from cookie
    const supabase = await createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session?.user) throw new Error('Unauthorized')
    return session.user
  }

  // Fallback: full JWT verification via Supabase network call
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  return user
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
