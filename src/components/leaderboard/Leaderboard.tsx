'use client'

import { useEffect, useState } from 'react'
import { ITEMS_PER_PAGE, Pagination } from './Pagination'
import { CATEGORIES, type CategoryId } from '@/lib/categories'
import { CategoryIcon } from '@/lib/CategoryIcon'
import { formatTimeAgo, type LeaderboardListing } from '@/lib/listings'

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

export type TimeFilter = 'all-time' | 'today'

export type OutbidTarget = {
  rank: number
  name: string
  amount: number
}

/**
 * Leaderboard
 *
 * Renders as the main (left) column of the two-column grid defined in
 * page.tsx, so it does not own its own outer section padding /
 * max-width / centering.
 */
export function Leaderboard({
  listings,
  todayTotals,
  isLoading,
  error,
  onRetry,
  timeFilter,
  onTimeFilterChange,
  onOutbid,
  onClaimRank,
}: {
  listings: LeaderboardListing[]
  todayTotals: Map<string, number>
  isLoading: boolean
  error: string | null
  onRetry: () => void
  timeFilter: TimeFilter
  onTimeFilterChange: (filter: TimeFilter) => void
  onOutbid?: (target: OutbidTarget) => void
  onClaimRank?: () => void
}) {
  const [activeFilter, setActiveFilter] = useState<FilterId>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [, setTimeTick] = useState(0)

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTimeTick((tick) => tick + 1)
    }, 60_000)

    return () => clearInterval(intervalId)
  }, [])

  const periodListings =
    timeFilter === 'today'
      ? listings
          .filter((listing) => todayTotals.has(listing.id))
          .map((listing) => ({
            ...listing,
            amount: todayTotals.get(listing.id) ?? 0,
          }))
          .sort((a, b) => b.amount - a.amount)
          .map((listing, index) => ({
            ...listing,
            rank: index + 1,
          }))
      : listings

  const filteredListings =
    activeFilter === 'all'
      ? periodListings
      : periodListings.filter((listing) => listing.categoryId === activeFilter)

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
          <h2 className="text-2xl font-bold leading-tight text-ink sm:text-[28px]">
            Leaderboard
          </h2>
          <p className="mt-1 text-sm text-secondary sm:text-[15px]">
            See who&apos;s winning the internet.
          </p>
        </div>

        <div className="inline-flex w-fit items-center gap-1 rounded-xl border border-border bg-inset p-1">
          <TimeFilterButton
            label="All time"
            isActive={timeFilter === 'all-time'}
            onClick={() => {
              onTimeFilterChange('all-time')
              setCurrentPage(1)
            }}
          />
          <TimeFilterButton
            label="Today"
            isActive={timeFilter === 'today'}
            onClick={() => {
              onTimeFilterChange('today')
              setCurrentPage(1)
            }}
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
                  ? 'bg-primary text-on-primary'
                  : 'border border-border bg-surface text-secondary hover:border-primary hover:text-primary',
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
              className="h-[72px] animate-pulse rounded-2xl border border-border bg-inset sm:h-[80px]"
            />
          ))}
        </div>
      ) : error ? (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-10 text-center">
          <p className="text-sm text-secondary">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium text-ink transition-colors duration-150 hover:bg-inset"
          >
            Try again
          </button>
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-col gap-3">
            {filteredListings.length === 0 ? (
              <EmptyState onClaimRank={onClaimRank} />
            ) : (
              pageListings.map((listing) => (
                <LeaderboardRow
                  key={listing.id}
                  listing={listing}
                  onOutbid={onOutbid}
                />
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
          ? 'bg-surface text-ink shadow-[0_1px_2px_rgba(20,16,43,0.08)]'
          : 'text-secondary hover:text-ink',
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
    badgeRing: 'ring-2 ring-[#D4A73A40]',
    ring: 'ring-1 ring-[#D4A73A80]',
    glow: 'shadow-[0_12px_32px_-12px_rgba(212,167,58,0.30)] hover:shadow-[0_16px_40px_-12px_rgba(212,167,58,0.38)]',
    cardBg: 'bg-gold/5',
    amountPrefix: 'text-[#4B2AAD]',
  },
  2: {
    badgeBg: 'bg-[#B9B4C4]',
    badgeText: 'text-white',
    badgeRing: '',
    ring: 'ring-1 ring-[#B9B4C466]',
    glow: '',
    cardBg: '',
    amountPrefix: 'text-[#4B2AAD]',
  },
  3: {
    badgeBg: 'bg-[#C08552]',
    badgeText: 'text-white',
    badgeRing: '',
    ring: 'ring-1 ring-[#C0855266]',
    glow: '',
    cardBg: '',
    amountPrefix: 'text-[#4B2AAD]',
  },
} as const

function EmptyState({ onClaimRank }: { onClaimRank?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border border-border bg-surface px-6 py-14 text-center">
      <h3 className="text-base font-semibold text-ink">No listings yet</h3>
      <p className="mt-1.5 text-sm text-secondary">
        Be the first to claim a rank in this category.
      </p>
      <button
        type="button"
        onClick={onClaimRank}
        className="mt-4 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary transition-colors duration-150 hover:bg-primary-hover"
      >
        Claim Rank →
      </button>
    </div>
  )
}

type ListingWithOptionalMeta = LeaderboardListing & {
  description?: string
  clickCount?: number
  timeAgoLabel?: string
}

function LeaderboardRow({
  listing,
  onOutbid,
}: {
  listing: LeaderboardListing
  onOutbid?: (target: OutbidTarget) => void
}) {
  function handleOutbidClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    onOutbid?.({
      rank: listing.rank,
      name: listing.name,
      amount: listing.amount,
    })
  }

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
        className="pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-primary px-3.5 py-1 text-[11px] font-semibold text-on-primary opacity-0 shadow-[0_4px_12px_-2px_rgba(75,42,173,0.45)] transition-opacity duration-150 group-hover:opacity-100 sm:text-xs"
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
          'cursor-pointer flex flex-col gap-3 rounded-2xl border border-border px-4 py-5 transition-shadow duration-150 hover:shadow-[0_6px_20px_-8px_rgba(20,16,43,0.14)] sm:flex-row sm:items-start sm:gap-5 sm:px-6 sm:py-5 lg:px-7',
          podiumStyle?.cardBg ?? 'bg-surface',
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
          <p className="truncate text-[15px] font-semibold leading-tight text-ink sm:text-base">
            {listing.name}
          </p>

          <a
            href={`/api/click/${listing.id}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(event) => event.stopPropagation()}
            className="mt-0.5 block truncate text-xs text-muted transition-colors duration-150 hover:text-primary"
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
                <p className="truncate text-xs text-muted">
                  {category && (
                    <span className="mx-1.5 text-[#E7E1F2]">&middot;</span>
                  )}
                  {metaParts.map((part, index) => (
                    <span key={part}>
                      {index === metaParts.length - 1 ? (
                        <span className="font-medium text-primary">{part}</span>
                      ) : (
                        part
                      )}
                      {index < metaParts.length - 1 && (
                        <span className="mx-1.5 text-border">&middot;</span>
                      )}
                    </span>
                  ))}
                </p>
              )}
            </div>
          )}

          {listing.description && (
            <p className="mt-1.5 line-clamp-2 text-sm leading-snug text-secondary">
              {listing.description}
            </p>
          )}
        </div>

        {/* Amount + action */}
        <div className="flex w-full shrink-0 items-center justify-between gap-3 sm:w-auto sm:flex-col sm:items-end sm:justify-start sm:gap-2.5">
          <p className="leading-none text-primary">
            <span
              className={[
                'mr-0.5 align-top text-sm font-semibold',
                podiumStyle?.amountPrefix ?? 'text-primary',
              ].join(' ')}
            >
              $
            </span>
            <span className="text-xl font-bold tabular-nums sm:text-2xl">
              {listing.amount.toLocaleString()}
            </span>
          </p>

          <button
            type="button"
            onClick={handleOutbidClick}
            className="shrink-0 rounded-xl border border-ink px-4 py-2 text-xs font-medium text-ink transition-colors duration-150 hover:bg-ink hover:text-surface sm:text-sm"
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
    <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-primary/8 px-3 py-1 text-xs font-medium text-primary">
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
          podiumStyle.badgeRing,
        ].join(' ')}
      >
        {rank}
      </span>
    )
  }

  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-inset text-sm font-semibold tabular-nums text-secondary">
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
  const needsDarkLogoTreatment =
    ['framer', 'github'].includes(name.trim().toLowerCase()) ||
    /framerusercontent\.com|github\.com/i.test(logoUrl ?? '')

  return (
    <div
      aria-hidden="true"
      className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-inset text-sm font-bold text-primary sm:h-11 sm:w-11"
    >
      {logo ? (
        <img
          src={logo}
          alt=""
          onError={() => setFailedLogoUrl(logo)}
          referrerPolicy="no-referrer"
          className={[
            'h-full w-full object-contain',
            needsDarkLogoTreatment ? 'dark:brightness-0 dark:invert' : '',
          ].join(' ')}
        />
      ) : (
        initial
      )}
    </div>
  )
}
