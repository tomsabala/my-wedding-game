import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'

export default async function SlugLayout({ children }: { children: React.ReactNode }) {
  const allMessages = await getMessages()
  const messages = {
    player: allMessages['player'],
    game: allMessages['game'],
  }
  return (
    <NextIntlClientProvider messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}
