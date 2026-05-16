import type { Metadata } from 'next'
import { Heebo, Playfair_Display, Plus_Jakarta_Sans } from 'next/font/google'
import { SpeedInsights } from '@vercel/speed-insights/next'

import './globals.css'

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  weight: ['400', '600', '700'],
})

const jakarta = Plus_Jakarta_Sans({
  variable: '--font-jakarta',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

const heebo = Heebo({
  variable: '--font-heebo',
  subsets: ['latin', 'hebrew'],
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'Our Wedding Game',
  description: 'צרו את משחק הטריוויה המותאם אישית לחתונה שלכם.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${playfair.variable} ${jakarta.variable} ${heebo.variable} h-full antialiased`}
    >
      <head>
        <link rel="preload" href="/fonts/material-symbols-rounded.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <SpeedInsights />
      </body>
    </html>
  )
}
