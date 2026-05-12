import DashboardNav from './DashboardNav'

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-wedding-bg" dir="rtl">
      <DashboardNav />
      <main className="flex-1" style={{ padding: 'var(--dashboard-page-padding)' }}>
        {children}
      </main>
    </div>
  )
}
