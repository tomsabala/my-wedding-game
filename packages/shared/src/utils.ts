const CHARS = 'abcdefghijklmnopqrstuvwxyz'

export function generateSlug(): string {
  return Array.from(
    { length: 3 },
    () => CHARS[Math.floor(Math.random() * CHARS.length)],
  ).join('')
}

export function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = a[i] as T
    a[i] = a[j] as T
    a[j] = tmp
  }
  return a
}
