import DashboardNav from './_components/DashboardNav'

const PALETTE: { color: string; text: string }[] = [
  { color: '#FF6B6B', text: '#ffffff' }, // Coral
  { color: '#FFA552', text: '#2d1500' }, // Amber
  { color: '#E8C840', text: '#2a2000' }, // Citron
  { color: '#6DB87A', text: '#ffffff' }, // Sage
  { color: '#6B9FFF', text: '#ffffff' }, // Cornflower
  { color: '#A78BFA', text: '#ffffff' }, // Violet
]

// Server Component — colors are picked once per fresh dashboard mount (e.g. after login).
// Nav and page background are always different palette colors, mirroring the auth-card pattern.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // eslint-disable-next-line react-hooks/purity -- Server Component; runs once per request
  const bgIdx = Math.floor(Math.random() * PALETTE.length)
  // eslint-disable-next-line react-hooks/purity -- same as above
  const navIdx = (bgIdx + 1 + Math.floor(Math.random() * (PALETTE.length - 1))) % PALETTE.length

  const bg  = PALETTE[bgIdx]  ?? PALETTE[0]!
  const nav = PALETTE[navIdx] ?? PALETTE[1]!

  return (
    <div className="flex min-h-screen flex-col" dir="rtl" style={{ backgroundColor: bg.color }}>
      <DashboardNav color={nav.color} text={nav.text} accent={bg.color} />
      <main className="flex-1" style={{ padding: 'var(--dashboard-page-padding)' }}>
        {children}
      </main>
    </div>
  )
}
