import Link from 'next/link'

export default function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex min-h-screen flex-col bg-background"
      style={{
        backgroundImage:
          'radial-gradient(circle at 2px 2px, rgba(123, 84, 85, 0.06) 1px, transparent 0)',
        backgroundSize: '28px 28px',
      }}
    >
      <header className="sticky top-0 z-10 flex h-16 items-center border-b border-border/40 bg-white/80 px-6 shadow-sm backdrop-blur-sm">
        <Link href="/" className="font-serif italic text-2xl leading-none text-primary">
          Our Wedding Game
        </Link>
      </header>

      <main className="flex flex-grow items-center justify-center px-4 py-16">
        <div
          className="auth-form relative w-full max-w-sm overflow-hidden"
          style={{
            backgroundColor: 'var(--wedding-surface)',
            borderRadius: 'var(--auth-card-radius)',
            padding: 'var(--auth-card-padding)',
            boxShadow: 'var(--auth-card-shadow)',
            border: '1px solid rgba(212, 194, 194, 0.4)',
          }}
        >
          <div className="pointer-events-none absolute -end-4 -top-4 h-16 w-16 rounded-full bg-wedding-tertiary-container/30 blur-xl" />
          <div className="pointer-events-none absolute -bottom-4 -start-4 h-16 w-16 rounded-full bg-wedding-primary-container/30 blur-xl" />
          <div className="relative z-10">{children}</div>
        </div>
      </main>

      <footer className="border-t border-border/20 bg-white px-6 py-5">
        <div className="mx-auto flex max-w-sm flex-col items-center gap-3 text-center sm:flex-row sm:justify-between">
          <span className="font-serif italic text-lg leading-none text-primary/50">
            Our Wedding Game
          </span>
          <div className="flex gap-5">
            <a href="#" className="text-xs text-muted-foreground/70 transition-colors hover:text-primary">
              Privacy
            </a>
            <a href="#" className="text-xs text-muted-foreground/70 transition-colors hover:text-primary">
              Terms
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
