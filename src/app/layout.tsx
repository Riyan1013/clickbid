import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Outbid',
  description: 'Claim your place on the leaderboard.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
