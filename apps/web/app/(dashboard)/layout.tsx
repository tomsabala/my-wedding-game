import DashboardShell from './_components/DashboardShell'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0"
      />
      <DashboardShell>{children}</DashboardShell>
    </>
  )
}
