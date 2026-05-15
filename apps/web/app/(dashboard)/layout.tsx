import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'

import DashboardShell from './_components/DashboardShell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const messages = await getMessages()
  return (
    <NextIntlClientProvider messages={messages}>
      <DashboardShell>{children}</DashboardShell>
    </NextIntlClientProvider>
  )
}
