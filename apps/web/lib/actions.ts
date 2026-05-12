import { prisma } from '@repo/db'
import type { User } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

export type ActionResult<T = void> = T extends void
  ? { success: true } | { success: false; error: string }
  : { success: true; data: T } | { success: false; error: string }

export async function getAuthUser(): Promise<User> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  return user
}

/**
 * Verifies the current user owns the given game.
 * Calls `notFound()` if the game is missing or owned by another user.
 * Returns the auth user and the game's `{ id, userId }`.
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
