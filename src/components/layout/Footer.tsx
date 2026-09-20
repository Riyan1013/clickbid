import Link from 'next/link'

const FOOTER_LINKS = [
  { label: 'Leaderboard', href: '/' },
  { label: 'Categories', href: '/categories' },
  { label: 'Rules', href: '/rules' },
]

/**
 * Footer
 *
 * Presentational site footer: brand mark + tagline, a short nav list,
 * and a copyright line. No backend, auth, or payment logic — purely
 * layout and styling, matching the existing ClickBid surface/border
 * system used elsewhere (Header, Leaderboard rows, Sidebar cards).
 */
export function Footer() {
  return (
    <footer className="border-t border-border bg-surface px-4 py-10 sm:px-6 md:px-10 lg:px-16">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
        {/* Brand + tagline */}
        <div className="max-w-xs">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="relative h-12 w-[180px] shrink-0">
              <img
                src="/clickbid-logo.svg"
                alt="ClickBid"
                className="absolute inset-0 h-full w-full scale-110 object-contain dark:hidden"
              />
              <img
                src="/ClickBid_logo_dark2.svg"
                alt="ClickBid"
                className="absolute inset-0 hidden h-full w-full scale-200 object-contain dark:block"
              />
            </div>
          </Link>

          <p className="mt-3 text-sm leading-relaxed text-secondary">
            Bid for visibility. Get discovered. Track the clicks.
          </p>
        </div>

        {/* Navigation */}
        <nav
          className="flex flex-col gap-3 sm:flex-row sm:gap-8"
          aria-label="Footer"
        >
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-secondary transition-colors duration-150 hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Copyright */}
      <div className="mx-auto mt-8 max-w-[1200px] border-t border-border pt-6">
        <p className="text-xs text-muted">
          &copy; {new Date().getFullYear()} ClickBid. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
