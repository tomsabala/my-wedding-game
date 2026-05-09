const COLORS = ['#FF6B6B', '#FFA552', '#E8C840', '#6DB87A', '#6B9FFF', '#A78BFA']

// Server Component — re-renders on every page navigation, so colors re-pick each time.
export default function AuthCard({ children }: { children: React.ReactNode }) {
  // eslint-disable-next-line react-hooks/purity -- Server Component; runs once per request
  const bgIdx = Math.floor(Math.random() * COLORS.length)
  // eslint-disable-next-line react-hooks/purity -- same as above
  const cardIdx = (bgIdx + 1 + Math.floor(Math.random() * (COLORS.length - 1))) % COLORS.length
  const bg = COLORS[bgIdx] ?? '#FF6B6B'
  const card = COLORS[cardIdx] ?? '#6B9FFF'

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4"
      style={{ backgroundColor: bg }}
    >
      <div
        className="auth-form w-full max-w-sm"
        style={{
          backgroundColor: card,
          borderRadius: 'var(--auth-card-radius)',
          padding: 'var(--auth-card-padding)',
          boxShadow: 'var(--auth-card-shadow)',
        }}
      >
        {children}
      </div>
    </div>
  )
}
