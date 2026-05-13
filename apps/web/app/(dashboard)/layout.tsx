import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'

import DashboardShell from './_components/DashboardShell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const messages = await getMessages()
  return (
    <NextIntlClientProvider messages={messages}>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0&display=swap"
      />
      <DashboardShell>{children}</DashboardShell>
    </NextIntlClientProvider>
  )
}
