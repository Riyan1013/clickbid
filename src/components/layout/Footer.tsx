import Link from 'next/link'

const FOOTER_LINKS = [
  { label: 'Leaderboard', href: '/' },
  { label: 'Categories', href: '/categories' },
  { label: 'Rules', href: '/rules' },
  { label: 'About', href: '/about' },
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
    <footer className="border-t border-[#E7E1F2] bg-[#FCFBFA] px-4 py-10 sm:px-6 md:px-10 lg:px-16">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
        {/* Brand + tagline */}
        <div className="max-w-xs">
          <Link href="/" className="inline-flex items-center gap-2">
            <img src="/clickbid-logo.svg" alt="" className="h-12 w-auto" />
          </Link>
          <p className="mt-3 text-sm leading-relaxed text-[#5B5468]">
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
              className="text-sm font-medium text-[#5B5468] transition-colors duration-150 hover:text-[#4B2AAD]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Copyright */}
      <div className="mx-auto mt-8 max-w-[1200px] border-t border-[#E7E1F2] pt-6">
        <p className="text-xs text-[#9B94A8]">
          &copy; {new Date().getFullYear()} ClickBid. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
