import type { Metadata } from 'next'
import { Dancing_Script, Heebo, Playfair_Display, Plus_Jakarta_Sans, Rubik } from 'next/font/google'
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

export const metadata: Metadata = {
  title: 'Our Wedding Game',
  description: 'צרו את משחק הטריוויה המותאם אישית לחתונה שלכם.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${playfair.variable} ${jakarta.variable} ${heebo.variable} ${dancing.variable} ${rubik.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <SpeedInsights />
      </body>
    </html>
  )
}
