import type { Metadata } from 'next'
import { Providers } from './providers'
import './globals.css'
import './style.css'

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
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <Providers>
          <div className="app-root" suppressHydrationWarning>{children}</div>
        </Providers>
      </body>
    </html>
  )
}
