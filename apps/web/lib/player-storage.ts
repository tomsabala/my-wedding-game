/**
 * Helpers for reading/writing player-side localStorage.
 *
 * These are intentionally safe — every operation is wrapped in try/catch and
 * silently no-ops if storage is unavailable (private mode, SSR, blocked).
 */

const PLAYER_KEY = 'wg:player'
const PROGRESS_KEY = 'wg:progress'

export type StoredPlayer = {
  playerId: string
  gameId: string
  slug: string
  displayName: string
}

export type StoredProgress = {
  slug: string
  currentIndex: number
  totalScore: number
  shownCardIds: string[]
}

function safeRead<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function safeWrite(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore
  }
}

function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // ignore
  }
}

export function readPlayer(): StoredPlayer | null {
  return safeRead<StoredPlayer>(PLAYER_KEY)
}

export function writePlayer(player: StoredPlayer): void {
  safeWrite(PLAYER_KEY, player)
}

export function readProgress(): StoredProgress | null {
  return safeRead<StoredProgress>(PROGRESS_KEY)
}

export function writeProgress(progress: StoredProgress): void {
  safeWrite(PROGRESS_KEY, progress)
}

export function clearPlayer(): void {
  safeRemove(PLAYER_KEY)
}

export function clearProgress(): void {
  safeRemove(PROGRESS_KEY)
}

export function clearAll(): void {
  safeRemove(PLAYER_KEY)
  safeRemove(PROGRESS_KEY)
}
