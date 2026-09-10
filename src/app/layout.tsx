import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ClickBid — Bid. Rank. Get Seen.',
  description:
    'ClickBid is a competitive leaderboard where websites and products bid for visibility and rank.',
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
