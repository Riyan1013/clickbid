'use client'

import Link from 'next/link'
import { useState } from 'react'

const NAV_LINKS = [
  { label: 'Leaderboard', href: '/' },
  { label: 'Categories', href: '/categories' },
  { label: 'Rules', href: '/rules' },
  { label: 'About', href: '/about' },
]

/**
 * Header
 *
 * ClickBid's primary site header: brand mark, primary navigation,
 * and the Submit / Claim Rank actions. Collapses navigation into a
 * simple toggled menu below the `lg` breakpoint so the brand and the
 * primary "Claim Rank" action always stay visible and never overflow.
 */
export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="relative flex h-[76px] w-full items-center justify-between border-b border-[#E7E1F2] bg-[#FCFBFA] px-4 sm:px-6 md:px-10 lg:h-20">
      {/* Brand */}
      <Link
        href="/"
        onClick={() => setIsMenuOpen(false)}
        className="flex shrink-0 items-center"
      >
        <img src="/clickbid-logo.svg" alt="ClickBid" className="h-12 w-auto" />
      </Link>

      {/* Desktop navigation */}
      <nav className="hidden items-center gap-8 lg:flex" aria-label="Primary">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm font-medium text-[#5B5468] transition-colors duration-150 hover:text-[#4B2AAD]"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Desktop actions */}
      <div className="hidden items-center gap-3 lg:flex">
        <Link
          href="#claim"
          className="rounded-xl bg-[#4B2AAD] px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#3D2189]"
        >
          Claim Rank
        </Link>
      </div>

      {/* Mobile / tablet actions: primary CTA + menu toggle only */}
      <div className="flex items-center gap-2 lg:hidden">
        <Link
          href="#claim"
          className="rounded-xl bg-[#4B2AAD] px-3 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#3D2189] sm:px-4"
        >
          <span className="sm:hidden">Claim</span>
          <span className="hidden sm:inline">Claim Rank</span>
        </Link>
        <button
          type="button"
          onClick={() => setIsMenuOpen((open) => !open)}
          aria-expanded={isMenuOpen}
          aria-label="Toggle navigation menu"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E7E1F2] text-[#14102B] transition-colors duration-150 hover:bg-[#F5F1FB]"
        >
          <MenuIcon isOpen={isMenuOpen} />
        </button>
      </div>

      {/* Collapsed navigation panel (mobile / tablet) */}
      {isMenuOpen && (
        <div className="absolute left-0 top-full z-20 w-full border-b border-[#E7E1F2] bg-[#FCFBFA] px-4 py-4 shadow-[0_12px_24px_-8px_rgba(20,16,43,0.12)] lg:hidden">
          <nav className="flex flex-col gap-1" aria-label="Primary">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-[#5B5468] transition-colors duration-150 hover:bg-[#F5F1FB] hover:text-[#4B2AAD]"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}

function MenuIcon({ isOpen }: { isOpen: boolean }) {
  if (isOpen) {
    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M4 4L14 14M14 4L4 14"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    )
  }
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2.5 5H15.5M2.5 9H15.5M2.5 13H15.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
