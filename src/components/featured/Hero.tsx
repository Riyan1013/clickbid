'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { CATEGORIES } from '@/lib/categories'
import { fetchLeaderboardListings } from '@/lib/listings'

/**
 * Hero
 *
 * Homepage hero: eyebrow + headline + supporting copy + CTA on the
 * left, a "Featured #1" leaderboard card on the right. Entrance
 * motion and hover elevation are done with plain Tailwind transition
 * utilities driven by a mount-state toggle — no animation library.
 */
export function Hero({
  timeFilter,
  todayTotals,
}: {
  timeFilter: 'all-time' | 'today'
  todayTotals: Map<string, number>
}) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsMounted(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <section className="relative overflow-hidden px-4 py-14 sm:px-6 sm:py-16 md:px-10 lg:px-16 lg:py-20">
      <div className="mx-auto grid max-w-[1200px] items-center gap-12 lg:grid-cols-[6fr_5fr] lg:gap-10">
        {/* Left column: copy + CTA */}
        <div
          className={[
            'transition-all duration-700 ease-out',
            isMounted ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0',
          ].join(' ')}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            The internet&apos;s competitive leaderboard
          </p>

          <h1 className="mt-4 text-[40px] font-bold leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-[56px]">
            Claim your rank.
          </h1>

          <p className="mt-5 max-w-md text-base leading-relaxed text-secondary sm:text-lg">
            Put your product in the spotlight. Bid higher, climb the
            leaderboard, and claim your place.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <a
              href="#claim"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-on-primary transition-colors duration-150 hover:bg-primary-hover"
            >
              Claim your rank
              <span aria-hidden="true">→</span>
            </a>

            <Link
              href="/rules"
              className="text-sm font-medium text-secondary underline decoration-border underline-offset-4 transition-colors duration-150 hover:text-primary"
            >
              Rules
            </Link>
          </div>
        </div>

        {/* Right column: Featured #1 card */}
        <div
          className={[
            'relative transition-all duration-700 ease-out',
            isMounted ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0',
          ].join(' ')}
          style={{ transitionDelay: isMounted ? '120ms' : '0ms' }}
        >
          {/* Subtle gold ambient glow behind the card */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 translate-y-4 scale-95 rounded-[28px] bg-gold opacity-[0.08] blur-3xl"
          />

          {/* Subtle violet ambient glow behind the card */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 translate-y-8 scale-95 rounded-[28px] bg-primary opacity-[0.06] blur-3xl"
          />

          <FeaturedCard timeFilter={timeFilter} todayTotals={todayTotals} />
        </div>
      </div>
    </section>
  )
}

/** Display shape the FeaturedCard renders. */
type FeaturedCardData = {
  name: string
  domain: string
  categoryLabel: string
  amount: number
  clickCount: number
  logoUrl?: string
}

// Demo data shown while loading, when the leaderboard is empty, or
// when the fetch fails — the hero must never break.
const FALLBACK_FEATURED: FeaturedCardData = {
  name: 'Linear',
  domain: 'linear.app',
  categoryLabel: 'Other',
  amount: 12_500,
  clickCount: 8_421,
}

/**
 * FeaturedCard
 *
 * Shows the current #1 leaderboard listing (highest bid), loaded from
 * Supabase on mount. Falls back to demo data if the request fails or
 * the board is empty, so the hero always renders.
 */
function FeaturedCard({
  timeFilter,
  todayTotals,
}: {
  timeFilter: 'all-time' | 'today'
  todayTotals: Map<string, number>
}) {
  const [featured, setFeatured] = useState<FeaturedCardData | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadFeatured() {
      try {
        const listings = await fetchLeaderboardListings()

        const top =
          timeFilter === 'today'
            ? listings
                .filter((listing) => todayTotals.has(listing.id))
                .map((listing) => ({
                  ...listing,
                  amount: todayTotals.get(listing.id) ?? 0,
                }))
                .sort((a, b) => b.amount - a.amount)[0]
            : listings[0]

        if (isMounted && top) {
          setFeatured({
            name: top.name,
            domain: top.domain,
            categoryLabel:
              CATEGORIES.find((item) => item.id === top.categoryId)?.label ??
              'Other',
            amount: top.amount,
            clickCount: top.clickCount ?? 0,
            logoUrl: top.logoUrl,
          })
        }
      } catch {
        // Fetch failed — keep the fallback card.
      }
    }

    loadFeatured()

    return () => {
      isMounted = false
    }
  }, [timeFilter, todayTotals])

  const data = featured ?? FALLBACK_FEATURED

  return (
    <div className="mx-auto w-full max-w-[420px] rounded-[24px] border-2 border-primary/20 bg-surface p-6 shadow-[0_20px_48px_-16px_rgba(75,42,173,0.28)] transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_28px_60px_-16px_rgba(75,42,173,0.34)] sm:p-7">
      {/* Winner badge */}
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#8A6A22]">
          <CrownIcon />
          #1 Leader
        </span>
      </div>

      {/* Product identity */}
      <div className="mt-5 flex items-center gap-3">
        <ProductMark name={data.name} logoUrl={data.logoUrl} />

        <div>
          <p className="text-lg font-semibold leading-tight text-ink">
            {data.name}
          </p>

          <p className="text-sm text-muted">{data.domain}</p>
        </div>
      </div>

      {/* Category pill */}
      <div className="mt-4">
        <span className="inline-flex items-center rounded-full bg-primary/8 px-3 py-1 text-xs font-medium text-primary">
          {data.categoryLabel}
        </span>
      </div>

      {/* Stats: current bid + clicks */}
      <div className="mt-6 border-t border-border pt-5">
        <div className="flex items-stretch gap-3">
          {/* Bid */}
          <div className="min-w-0 flex-1 rounded-xl bg-inset px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
              Current bid
            </p>

            <p className="mt-1 text-[26px] font-bold tabular-nums leading-none text-ink sm:text-[30px]">
              ${data.amount.toLocaleString()}
            </p>
          </div>

          {/* Clicks — navigates to /clicks */}
          <Link
            href="/clicks"
            className="group flex min-w-0 flex-1 flex-col justify-between rounded-xl border border-border bg-surface px-4 py-3 transition-colors duration-150 hover:border-primary hover:bg-inset"
          >
            <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted transition-colors duration-150 group-hover:text-primary">
              Clicks
              <span aria-hidden="true">→</span>
            </p>

            <p className="mt-1 text-[26px] font-bold tabular-nums leading-none text-primary transition-colors duration-150 group-hover:text-primary-hover sm:text-[30px]">
              {data.clickCount.toLocaleString()}
            </p>
          </Link>
        </div>
      </div>
    </div>
  )
}

/**
 * ProductMark
 *
 * Same logo behavior as the leaderboard's ProductMark: renders the
 * real logo when one exists and loads, falls back to the initial
 * letter otherwise, and retries if a different URL arrives later.
 * Styling (gradient tile) is the hero's own.
 */
function ProductMark({ name, logoUrl }: { name: string; logoUrl?: string }) {
  const [failedLogoUrl, setFailedLogoUrl] = useState<string | null>(null)

  const logo = logoUrl && logoUrl !== failedLogoUrl ? logoUrl : null
  const initial = name.charAt(0).toUpperCase()

  return (
    <div
      aria-hidden="true"
      className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-inset text-base font-bold text-ink"
    >
      {logo ? (
        <img
          src={logo}
          alt=""
          onError={() => setFailedLogoUrl(logo)}
          referrerPolicy="no-referrer"
          className="h-full w-full object-contain"
        />
      ) : (
        initial
      )}
    </div>
  )
}

function CrownIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M1.5 4.5L4 7L7 2.5L10 7L12.5 4.5L11.5 10.5H2.5L1.5 4.5Z"
        stroke="#8A6A22"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  )
}
