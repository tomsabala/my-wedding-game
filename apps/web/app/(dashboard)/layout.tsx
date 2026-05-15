import { Dancing_Script, Rubik } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'

import DashboardShell from './_components/DashboardShell'

const dancing = Dancing_Script({
  variable: '--font-dancing',
  subsets: ['latin'],
  weight: ['400', '700'],
})

const rubik = Rubik({
  variable: '--font-rubik',
  subsets: ['latin', 'hebrew'],
  weight: ['400', '500', '600', '700'],
})

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const messages = await getMessages()
  return (
    <NextIntlClientProvider messages={messages}>
      <div className={`${dancing.variable} ${rubik.variable}`}>
        <DashboardShell>{children}</DashboardShell>
      </div>
    </NextIntlClientProvider>
  )
}
