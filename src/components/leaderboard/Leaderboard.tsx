'use client'

import { useEffect, useState } from 'react'
import { ITEMS_PER_PAGE, Pagination } from './Pagination'
import { CATEGORIES, type CategoryId } from '@/lib/categories'
import { CategoryIcon } from '@/lib/CategoryIcon'
import {
  fetchLeaderboardListings,
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

function LeaderboardRow({ listing }: { listing: Listing }) {
  const podiumStyle =
    listing.rank in RANK_STYLES ? RANK_STYLES[listing.rank as 1 | 2 | 3] : null
  const category = CATEGORIES.find((item) => item.id === listing.categoryId)

  return (
    <div
      className={[
        'flex flex-col gap-3 rounded-2xl border border-[#E7E1F2] bg-[#FCFBFA] px-4 py-4 transition-shadow duration-150 hover:shadow-[0_4px_16px_-6px_rgba(20,16,43,0.12)] sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5 sm:py-4 lg:px-6 lg:py-5',
        podiumStyle?.ring ?? '',
        podiumStyle?.glow ?? '',
      ].join(' ')}
    >
      {/* Identity: rank + mark + name/domain */}
      <div className="flex min-w-0 items-center gap-3 sm:flex-1">
        <RankBadge rank={listing.rank} />
        <ProductMark name={listing.name} />
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold leading-tight text-[#14102B]">
            {listing.name}
          </p>
          <p className="truncate text-xs text-[#9B94A8]">{listing.domain}</p>
        </div>
      </div>

      {/* Category + amount + action, one real element — no display:contents */}
      <div className="flex w-full flex-col items-start gap-2 sm:w-auto sm:shrink-0 sm:flex-row sm:items-center sm:gap-6">
        {category && <CategoryPill id={category.id} label={category.label} />}
        <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end sm:gap-6">
          <p className="text-lg font-bold tabular-nums leading-none text-[#14102B] sm:text-xl">
            ${listing.amount.toLocaleString()}
          </p>
          <button
            type="button"
            className="rounded-xl border border-[#14102B] px-3.5 py-2 text-xs font-medium text-[#14102B] transition-colors duration-150 hover:bg-[#14102B] hover:text-white sm:text-sm"
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

function ProductMark({ name }: { name: string }) {
  const initial = name.charAt(0).toUpperCase()

  return (
    <div
      aria-hidden="true"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F5F1FB] text-sm font-bold text-[#4B2AAD] sm:h-11 sm:w-11"
    >
      {initial}
    </div>
  )
}
