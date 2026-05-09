import SignOutButton from './SignOutButton'

type Props = { color: string; text: string; accent: string }

export default function DashboardNav({ color, text, accent }: Props) {
  return (
    <header
      className="flex items-center justify-between px-6"
      style={{
        backgroundColor: color,
        height: 'var(--dashboard-nav-height)',
        borderBottom: '1px solid rgba(255,255,255,0.2)',
      }}
    >
      <span className="text-base font-extrabold tracking-tight">
        <span style={{ color: text }}>Our </span>
        <span style={{ color: accent }}>Wedding</span>
        <span style={{ color: text }}> Game</span>
      </span>
      <SignOutButton
        style={{
          background: 'rgba(255,255,255,0.18)',
          border: '1px solid rgba(255,255,255,0.4)',
          color: 'white',
          fontWeight: 600,
        }}
      />
    </header>
  )
}
