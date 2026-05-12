import SignOutButton from './SignOutButton'

export default function DashboardNav() {
  return (
    <header
      className="flex items-center justify-between px-6 bg-wedding-surface border-b border-wedding-outline-variant"
      style={{ height: 'var(--dashboard-nav-height)' }}
    >
      <span className="font-serif text-lg font-semibold tracking-tight text-wedding-primary">
        Our Wedding Game
      </span>
      <SignOutButton />
    </header>
  )
}
