import type { Metadata } from 'next'
import { Noto_Sans_JP } from 'next/font/google'
import { Providers } from './providers'
import './globals.css'
import './style.css'

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-noto-sans-jp',
  display: 'swap',
})

export const metadata: Metadata = {
  title: '人生ピンマップ日記',
  description: '生きてきた、ここにいた',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" className={notoSansJP.variable}>
      <body suppressHydrationWarning>
        <Providers>
          <div className="app-root" suppressHydrationWarning>{children}</div>
        </Providers>
      </body>
    </html>
  )
}
