'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ITEMS_PER_PAGE, Pagination } from './Pagination'
import { CATEGORIES, type CategoryId } from '@/lib/categories'
import { CategoryIcon } from '@/lib/CategoryIcon'
import {
  fetchLeaderboardListings,
  formatTimeAgo,
  type LeaderboardListing,
} from '@/lib/listings'

type FilterId = CategoryId | 'all'

const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'all', label: 'All' },
  ...CATEGORIES,
]

type Listing = {
  rank: number
  name: string
  domain: string
  categoryId: CategoryId
  amount: number
}

type TimeFilter = 'all-time' | 'today'

/**
 * Leaderboard
 *
 * Renders as the main (left) column of the two-column grid defined in
 * page.tsx, so it does not own its own outer section padding /
 * max-width / centering.
 */
export function Leaderboard() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all-time')
  const [activeFilter, setActiveFilter] = useState<FilterId>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [listings, setListings] = useState<LeaderboardListing[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [, setTimeTick] = useState(0)

  useEffect(() => {
    let isMounted = true

    async function loadListings() {
      setIsLoading(true)
      setError(null)
      try {
        const data = await fetchLeaderboardListings()
        if (isMounted) {
          setListings(data)
        }
      } catch {
        if (isMounted) {
          setError("Couldn't load the leaderboard. Please try again.")
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

  useEffect(() => {
    const channel = supabase
      .channel('leaderboard-clicks')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'clicks',
        },
        (payload) => {
          const listingId = payload.new.listing_id as string

          setListings((currentListings) =>
            currentListings.map((listing) =>
              listing.id === listingId
                ? {
                    ...listing,
                    clickCount: (listing.clickCount ?? 0) + 1,
                  }
                : listing,
            ),
          )
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTimeTick((tick) => tick + 1)
    }, 60_000)

    return () => clearInterval(intervalId)
  }, [])

  const filteredListings =
    activeFilter === 'all'
      ? listings
      : listings.filter((listing) => listing.categoryId === activeFilter)

  const totalPages = Math.ceil(filteredListings.length / ITEMS_PER_PAGE)

  const activePage = currentPage > totalPages ? 1 : currentPage

  const pageStartIndex = (activePage - 1) * ITEMS_PER_PAGE

  const pageListings = filteredListings.slice(
    pageStartIndex,
    pageStartIndex + ITEMS_PER_PAGE,
  )

  return (
    <div className="flex min-w-0 flex-col">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold leading-tight text-[#14102B] sm:text-[28px]">
            Leaderboard
          </h2>
          <p className="mt-1 text-sm text-[#5B5468] sm:text-[15px]">
            See who&apos;s winning the internet.
          </p>
        </div>

        <div className="inline-flex w-fit items-center gap-1 rounded-xl border border-[#E7E1F2] bg-[#F5F1FB] p-1">
          <TimeFilterButton
            label="All time"
            isActive={timeFilter === 'all-time'}
            onClick={() => setTimeFilter('all-time')}
          />
          <TimeFilterButton
            label="Today"
            isActive={timeFilter === 'today'}
            onClick={() => setTimeFilter('today')}
          />
        </div>
      </div>

      <div className="mt-6 -mx-1 overflow-x-auto px-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max items-center gap-2">
          {FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => {
                setActiveFilter(filter.id)
                setCurrentPage(1)
              }}
              className={[
                'flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-150',
                activeFilter === filter.id
                  ? 'bg-[#4B2AAD] text-white'
                  : 'border border-[#E7E1F2] bg-[#FCFBFA] text-[#5B5468] hover:border-[#4B2AAD] hover:text-[#4B2AAD]',
              ].join(' ')}
            >
              <CategoryIcon id={filter.id} className="h-3.5 w-3.5" />
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="mt-6 flex flex-col gap-3">
          {[0, 1, 2].map((placeholder) => (
            <div
              key={placeholder}
              className="h-[72px] animate-pulse rounded-2xl border border-[#E7E1F2] bg-[#F5F1FB] sm:h-[80px]"
            />
          ))}
        </div>
      ) : error ? (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-[#E7E1F2] bg-[#FCFBFA] px-4 py-10 text-center">
          <p className="text-sm text-[#5B5468]">{error}</p>
          <button
            type="button"
            onClick={() => {
              setIsLoading(true)
              setError(null)
              fetchLeaderboardListings()
                .then(setListings)
                .catch(() =>
                  setError("Couldn't load the leaderboard. Please try again."),
                )
                .finally(() => setIsLoading(false))
            }}
            className="rounded-xl border border-[#E7E1F2] bg-[#FCFBFA] px-4 py-2 text-sm font-medium text-[#14102B] transition-colors duration-150 hover:bg-[#F5F1FB]"
          >
            Try again
          </button>
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-col gap-3">
            {filteredListings.length === 0 ? (
              <EmptyState />
            ) : (
              pageListings.map((listing) => (
                <LeaderboardRow key={listing.id} listing={listing} />
              ))
            )}
          </div>

          {filteredListings.length > 9 && (
            <Pagination
              currentPage={activePage}
              totalItems={filteredListings.length}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}
    </div>
  )
}

function TimeFilterButton({
  label,
  isActive,
  onClick,
}: {
  label: string
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors duration-150',
        isActive
          ? 'bg-[#FCFBFA] text-[#14102B] shadow-[0_1px_2px_rgba(20,16,43,0.08)]'
          : 'text-[#5B5468] hover:text-[#14102B]',
      ].join(' ')}
    >
      {label}
    </button>
  )
}

const RANK_STYLES = {
  1: {
    badgeBg: 'bg-[#D4A73A]',
    badgeText: 'text-white',
    ring: 'ring-1 ring-[#D4A73A66]',
    glow: 'shadow-[0_8px_24px_-8px_rgba(212,167,58,0.35)]',
  },
  2: {
    badgeBg: 'bg-[#B9B4C4]',
    badgeText: 'text-white',
    ring: 'ring-1 ring-[#B9B4C466]',
    glow: '',
  },
  3: {
    badgeBg: 'bg-[#C08552]',
    badgeText: 'text-white',
    ring: 'ring-1 ring-[#C0855266]',
    glow: '',
  },
} as const

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-[#E7E1F2] bg-[#FCFBFA] px-6 py-14 text-center">
      <h3 className="text-base font-semibold text-[#14102B]">
        No listings yet
      </h3>
      <p className="mt-1.5 text-sm text-[#5B5468]">
        Be the first to claim a rank in this category.
      </p>
      <button
        type="button"
        className="mt-5 rounded-xl bg-[#4B2AAD] px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-[#3A2288]"
      >
        Claim Rank
      </button>
    </div>
  )
}

type ListingWithOptionalMeta = LeaderboardListing & {
  description?: string
  clickCount?: number
  timeAgoLabel?: string
}

function LeaderboardRow({ listing }: { listing: LeaderboardListing }) {
  const podiumStyle =
    listing.rank in RANK_STYLES ? RANK_STYLES[listing.rank as 1 | 2 | 3] : null

  const category = CATEGORIES.find((item) => item.id === listing.categoryId)

  // description / timeAgoLabel / clickCount aren't part of
  // LeaderboardListing / fetchLeaderboardListings() yet. Read
  // defensively so each piece simply doesn't render until that data
  // is wired up in lib/listings.ts — no placeholder/fake values.
  const meta = listing as ListingWithOptionalMeta
  const timeAgoLabel = formatTimeAgo(listing.updatedAt)

  const metaParts: string[] = []
  if (timeAgoLabel) metaParts.push(timeAgoLabel)
  if (typeof meta.clickCount === 'number') {
    metaParts.push(`${meta.clickCount.toLocaleString()} clicks`)
  }

  const claimAmount = listing.amount + 1

  const openListing = () =>
    window.open(`/api/click/${listing.id}`, '_blank', 'noopener,noreferrer')

  return (
    <div className="group relative pt-4">
      {/* Floating "claim this rank" pill — appears on hover only */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-[#4B2AAD] px-3.5 py-1 text-[11px] font-semibold text-white opacity-0 shadow-[0_4px_12px_-2px_rgba(75,42,173,0.45)] transition-opacity duration-150 group-hover:opacity-100 sm:text-xs"
      >
        Claim this rank for ${claimAmount.toLocaleString()}
      </span>

      <div
        role="link"
        tabIndex={0}
        onClick={openListing}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            openListing()
          }
        }}
        className={[
          'cursor-pointer flex flex-col gap-3 rounded-2xl border border-[#E7E1F2] bg-[#FCFBFA] px-4 py-5 transition-shadow duration-150 hover:shadow-[0_6px_20px_-8px_rgba(20,16,43,0.14)] sm:flex-row sm:items-start sm:gap-5 sm:px-6 sm:py-5 lg:px-7',
          podiumStyle?.ring ?? '',
          podiumStyle?.glow ?? '',
        ].join(' ')}
      >
        {/* Rank + logo */}
        <div className="flex shrink-0 items-center gap-3.5">
          <RankBadge rank={listing.rank} />
          <ProductMark name={listing.name} logoUrl={listing.logoUrl} />
        </div>

        {/* Name / domain / category / description / metadata */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold leading-tight text-[#14102B] sm:text-base">
            {listing.name}
          </p>

          <a
            href={`/api/click/${listing.id}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(event) => event.stopPropagation()}
            className="mt-0.5 block truncate text-xs text-[#9B94A8] transition-colors duration-150 hover:text-[#4B2AAD]"
          >
            {listing.domain}
          </a>

          {(category || metaParts.length > 0) && (
            <div className="mt-1.5 flex flex-wrap items-center">
              {category && (
                <div className="scale-90 origin-left">
                  <CategoryPill id={category.id} label={category.label} />
                </div>
              )}

              {metaParts.length > 0 && (
                <p className="truncate text-xs text-[#9B94A8]">
                  {category && (
                    <span className="mx-1.5 text-[#E7E1F2]">&middot;</span>
                  )}
                  {metaParts.map((part, index) => (
                    <span key={part}>
                      {index === metaParts.length - 1 ? (
                        <span className="font-medium text-[#4B2AAD]">
                          {part}
                        </span>
                      ) : (
                        part
                      )}
                      {index < metaParts.length - 1 && (
                        <span className="mx-1.5 text-[#E7E1F2]">&middot;</span>
                      )}
                    </span>
                  ))}
                </p>
              )}
            </div>
          )}

          {listing.description && (
            <p className="mt-1.5 line-clamp-2 text-sm leading-snug text-[#5B5468]">
              {listing.description}
            </p>
          )}
        </div>

        {/* Amount + action */}
        <div className="flex w-full shrink-0 items-center justify-between gap-3 sm:w-auto sm:flex-col sm:items-end sm:justify-start sm:gap-2.5">
          <p className="leading-none text-[#14102B]">
            <span className="mr-0.5 align-top text-sm font-semibold text-[#9B94A8]">
              $
            </span>
            <span className="text-xl font-bold tabular-nums sm:text-2xl">
              {listing.amount.toLocaleString()}
            </span>
          </p>

          <button
            type="button"
            onClick={(event) => event.stopPropagation()}
            className="shrink-0 rounded-xl border border-[#14102B] px-4 py-2 text-xs font-medium text-[#14102B] transition-colors duration-150 hover:bg-[#14102B] hover:text-white sm:text-sm"
          >
            Outbid
          </button>
        </div>
      </div>
    </div>
  )
}

function CategoryPill({ id, label }: { id: CategoryId; label: string }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-[#4B2AAD14] px-3 py-1 text-xs font-medium text-[#4B2AAD]">
      <CategoryIcon id={id} className="h-3.5 w-3.5" />
      {label}
    </span>
  )
}

function RankBadge({ rank }: { rank: number }) {
  const podiumStyle =
    rank in RANK_STYLES ? RANK_STYLES[rank as 1 | 2 | 3] : null

  if (podiumStyle) {
    return (
      <span
        className={[
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold tabular-nums',
          podiumStyle.badgeBg,
          podiumStyle.badgeText,
        ].join(' ')}
      >
        {rank}
      </span>
    )
  }

  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F5F1FB] text-sm font-semibold tabular-nums text-[#5B5468]">
      {rank}
    </span>
  )
}

function ProductMark({ name, logoUrl }: { name: string; logoUrl?: string }) {
  // Tracks *which* URL failed, so a broken logo falls back to the
  // initial letter while a different URL arriving later (e.g. a new
  // bid's metadata overwrote logo_url) is retried, not stuck on the
  // fallback.
  const [failedLogoUrl, setFailedLogoUrl] = useState<string | null>(null)

  const logo = logoUrl && logoUrl !== failedLogoUrl ? logoUrl : null
  const initial = name.charAt(0).toUpperCase()

  return (
    <div
      aria-hidden="true"
      className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#F5F1FB] text-sm font-bold text-[#4B2AAD] sm:h-11 sm:w-11"
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
