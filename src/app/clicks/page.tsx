'use client'

import { useEffect, useState } from 'react'
import { PageCanvas } from '@/components/layout/PageCanvas'
import { AppShell } from '@/components/layout/AppShell'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { CATEGORIES } from '@/lib/categories'
import { supabase } from '@/lib/supabase'
import {
  fetchLeaderboardListings,
  type LeaderboardListing,
} from '@/lib/listings'

/**
 * Sorts listings by click count, descending — ties keep the fetch's
 * bid-amount order (Array#sort is stable).
 */
function sortByClickCount(listings: LeaderboardListing[]) {
  return [...listings].sort((a, b) => (b.clickCount ?? 0) - (a.clickCount ?? 0))
}

/**
 * ClicksPage
 *
 * Public "attention" leaderboard — ranked by click count instead of
 * bid amount. Loads real listings from Supabase, re-sorted by clicks,
 * and stays live through a Realtime subscription to inserts on
 * public.clicks. Rows route through the existing /api/click/[id]
 * tracking endpoint; ranks are derived from sort position, never
 * stored. Reuses the existing PageCanvas / AppShell / Header /
 * Footer unmodified. Uses ClickBid's standard visual identity
 * (violet accent, gold #1).
 */
export default function ClicksPage() {
  const [listings, setListings] = useState<LeaderboardListing[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadListings() {
      setIsLoading(true)
      setError(null)
      try {
        const data = await fetchLeaderboardListings()
        if (isMounted) {
          setListings(sortByClickCount(data))
        }
      } catch {
        if (isMounted) {
          setError("Couldn't load the clicks leaderboard. Please try again.")
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadListings()

    return () => {
      isMounted = false
    }
  }, [])

  // Live click counts: every INSERT on public.clicks bumps the
  // affected listing, re-sorts the full list, and ranks are
  // re-derived from the new sort position — so listings can move
  // up (and down) past each other.
  useEffect(() => {
    const channel = supabase
      .channel('clicks-page-inserts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'clicks' },
        (payload) => {
          // The realtime payload is untyped, so cast listing_id explicitly.
          const clickedListingId = payload.new.listing_id as string

          setListings((current) =>
            sortByClickCount(
              current.map((listing) =>
                listing.id === clickedListingId
                  ? { ...listing, clickCount: (listing.clickCount ?? 0) + 1 }
                  : listing,
              ),
            ),
          )
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <PageCanvas>
      <AppShell>
        <Header />

        <main className="bg-surface px-4 py-14 sm:px-6 sm:py-16 md:px-10 lg:px-16 lg:py-20">
          {/* Intro */}
          <div className="mx-auto max-w-[720px]">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              Clicks
            </p>
            <h1 className="mt-3 text-[28px] font-bold leading-tight tracking-tight text-ink sm:text-[32px]">
              See who&apos;s getting attention.
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-secondary sm:text-base">
              Show which websites are attracting the most attention on ClickBid.
            </p>
          </div>

          {/* Leaderboard */}
          <div className="mx-auto mt-10 flex max-w-[1000px] flex-col gap-3 sm:mt-12">
            {isLoading ? (
              [0, 1, 2].map((placeholder) => (
                <div
                  key={placeholder}
                  className="h-32 animate-pulse rounded-[20px] border border-border bg-inset sm:h-[124px]"
                />
              ))
            ) : error ? (
              <div className="flex flex-col items-center gap-3 rounded-[20px] border border-border bg-surface px-4 py-10 text-center">
                <p className="text-sm text-secondary">{error}</p>
                <button
                  type="button"
                  onClick={() => {
                    setIsLoading(true)
                    setError(null)
                    fetchLeaderboardListings()
                      .then((data) => setListings(sortByClickCount(data)))
                      .catch(() =>
                        setError(
                          "Couldn't load the clicks leaderboard. Please try again.",
                        ),
                      )
                      .finally(() => setIsLoading(false))
                  }}
                  className="rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium text-ink transition-colors duration-150 hover:bg-inset"
                >
                  Try again
                </button>
              </div>
            ) : listings.length === 0 ? (
              <div className="rounded-[20px] border border-border bg-surface px-6 py-14 text-center">
                <p className="text-base font-semibold text-ink">
                  No listings yet
                </p>
                <p className="mt-1.5 text-sm text-secondary">
                  Sites appear here as they claim ranks and collect clicks.
                </p>
              </div>
            ) : (
              listings.map((listing, index) => (
                <ClickListingRow
                  key={listing.id}
                  listing={listing}
                  rank={index + 1}
                />
              ))
            )}
          </div>
        </main>

        <Footer />
      </AppShell>
    </PageCanvas>
  )
}

function ClickListingRow({
  listing,
  rank,
}: {
  listing: LeaderboardListing
  rank: number
}) {
  const isTop = rank === 1
  const categoryLabel =
    CATEGORIES.find((category) => category.id === listing.categoryId)?.label ??
    'Other'

  const cardTone =
    rank === 1
      ? 'bg-[#E8E2F3] dark:bg-[#2A2140]'
      : rank === 2
        ? 'bg-[#EEEAF6] dark:bg-[#252039]'
        : rank === 3
          ? 'bg-[#F3F0F8] dark:bg-[#211C33]'
          : rank === 4
            ? 'bg-[#F7F5FA] dark:bg-[#1D192B]'
            : 'bg-[#FAF9FB] dark:bg-[#191525]'

  return (
    <a
      href={`/api/click/${listing.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className={[
        'group flex flex-col gap-4 rounded-[20px] border border-border px-5 py-5 transition-colors duration-150 hover:brightness-95 dark:hover:brightness-110 sm:flex-row sm:items-center sm:gap-5 sm:px-6 sm:py-6',
        cardTone,
      ].join(' ')}
    >
      {/* Rank + logo */}
      <div className="flex shrink-0 items-center gap-4">
        <span
          className={[
            'w-8 shrink-0 text-lg font-bold tabular-nums text-primary',
            isTop ? 'text-xl text-gold' : '',
          ].join(' ')}
        >
          #{rank}
        </span>

        <ProductMark name={listing.name} logoUrl={listing.logoUrl} />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold leading-tight text-ink sm:text-base">
          {listing.name}
        </p>
        <p className="mt-0.5 truncate text-xs text-secondary sm:text-sm">
          {listing.domain} &middot; {categoryLabel}
        </p>
        {listing.description && (
          <p className="mt-1.5 line-clamp-2 text-sm leading-snug text-secondary">
            {listing.description}
          </p>
        )}
      </div>

      {/* Click count */}
      <div className="flex shrink-0 items-baseline gap-1.5 sm:flex-col sm:items-end sm:gap-0">
        <span className="text-2xl font-bold leading-none tabular-nums text-primary sm:text-[26px]">
          {(listing.clickCount ?? 0).toLocaleString()}
        </span>
        <span className="text-xs font-medium text-muted sm:mt-1">clicks</span>
      </div>
    </a>
  )
}

/**
 * ProductMark
 *
 * Same logo behavior as the leaderboard's ProductMark: renders the
 * real logo when one exists and loads, falls back to the initial
 * letter otherwise, and retries if a different URL arrives later.
 * Sizing/shape is this page's own.
 */
function ProductMark({ name, logoUrl }: { name: string; logoUrl?: string }) {
  const [failedLogoUrl, setFailedLogoUrl] = useState<string | null>(null)

  const logo = logoUrl && logoUrl !== failedLogoUrl ? logoUrl : null
  const initial = name.charAt(0).toUpperCase()

  return (
    <div
      aria-hidden="true"
      className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-surface text-base font-bold text-ink shadow-[0_1px_2px_rgba(20,16,43,0.06)]"
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
