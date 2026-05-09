const CHARS = 'abcdefghijklmnopqrstuvwxyz'

export function generateSlug(): string {
  return Array.from(
    { length: 3 },
    () => CHARS[Math.floor(Math.random() * CHARS.length)],
  ).join('')
}
