import type { Metadata } from 'next'
import './globals.css'
import { VisitorTracker } from '@/components/visitors/VisitorTracker'
import { ThemeProvider } from '@/lib/theme/theme-provider'

export const metadata: Metadata = {
  title: 'ClickBid — Bid. Rank. Get Seen.',
  description:
    'ClickBid is a competitive leaderboard where websites and products bid for visibility and rank.',
}

const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem('clickbid-theme');
    var theme = stored === 'light' || stored === 'dark'
      ? stored
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {}
})();
`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <ThemeProvider>
          <VisitorTracker />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
