'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { CATEGORIES, type CategoryId } from '@/lib/categories'
import { CategoryIcon } from '@/lib/CategoryIcon'
import {
  fetchLeaderboardListings,
  fetchTodayBidTotals,
  submitBid,
  type LeaderboardListing,
} from '@/lib/listings'
import type { OutbidTarget, TimeFilter } from './Leaderboard'

type SubmitFeedback = {
  type: 'success' | 'error'
  message: string
}

/**
 * OutbidDialog
 *
 * Focused outbid flow opened from a leaderboard row's Outbid button.
 * The clicked listing contributes only its rank and amount: the
 * required target total is amount + 1, and the user's domain and
 * category are always entered fresh — never copied from the target.
 *
 * Period-aware: the leaderboard's target amount reflects the
 * displayed period (all-time cumulative amount, or today's summed
 * bid contributions), so the existing-domain side of the math uses
 * the SAME period — the listing's all-time amount, or its total of
 * today's bids. A Today target is never compared against an
 * all-time total.
 *
 * Submits through the same submitBid() as ClaimRank — one bidding
 * system, two entry points. The amount passed to submitBid() is
 * always the user's CONTRIBUTION (the gap to the required total),
 * never the required total itself.
 *
 * NOTE: normalizeDomain / fetchListingMetadata / CategorySelect are
 * local copies of ClaimRank's (unexported there). Consolidate into
 * shared exports in a later step.
 */
export function OutbidDialog({
  target,
  timeFilter,
  onClose,
}: {
  target: OutbidTarget | null
  timeFilter: TimeFilter
  onClose: () => void
}) {
  const [productUrl, setProductUrl] = useState('')
  const [categoryId, setCategoryId] = useState<CategoryId | null>(null)
  const [listings, setListings] = useState<LeaderboardListing[]>([])
  const [todayTotals, setTodayTotals] = useState<Map<string, number>>(new Map())
  const [isLoadingListings, setIsLoadingListings] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<SubmitFeedback | null>(null)

  // The total required to take the clicked rank: its current bid + 1.
  const requiredAmount = target ? target.amount + 1 : 0

  // Fresh user input every time a new target is opened.
  useEffect(() => {
    if (!target) return

    setProductUrl('')
    setCategoryId(null)
    setFeedback(null)
  }, [target])

  // Load listings + today's bid totals once, so an entered domain can
  // be matched to its listing and its period total. Same non-critical
  // degradation as ClaimRank: on failure every domain is treated as
  // new — the suggested contribution then equals the full required
  // amount, which can only overpay, never underqualify.
  useEffect(() => {
    let isMounted = true

    Promise.all([fetchLeaderboardListings(), fetchTodayBidTotals()])
      .then(([listingsData, totals]) => {
        if (!isMounted) return
        setListings(listingsData)
        setTodayTotals(totals)
      })
      .catch(() => {
        // Silently degrade — see comment above.
      })
      .finally(() => {
        if (isMounted) setIsLoadingListings(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  // Escape to close + lock body scroll while open.
  useEffect(() => {
    if (!target) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [target, onClose])

  const domain = normalizeDomain(productUrl)

  const existingListing = domain
    ? listings.find((listing) => listing.domain.toLowerCase() === domain)
    : undefined

  // The existing domain's total in the SAME period as the target:
  // its all-time cumulative amount, or the sum of its bids today.
  const currentTotal = existingListing
    ? timeFilter === 'today'
      ? (todayTotals.get(existingListing.id) ?? 0)
      : existingListing.amount
    : 0

  // The user's contribution: the gap to the required total (the full
  // required amount for a new domain, whose current total is 0).
  // Never negative.
  const contribution = Math.max(0, requiredAmount - currentTotal)
  const alreadyMeetsRequirement = Boolean(existingListing && contribution === 0)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isSubmitting || !target) return

    if (!domain) {
      setFeedback({ type: 'error', message: 'Please enter your domain.' })
      return
    }

    if (!categoryId) {
      setFeedback({ type: 'error', message: 'Please choose a category.' })
      return
    }

    if (alreadyMeetsRequirement) {
      setFeedback({
        type: 'error',
        message: 'This domain already meets the required amount.',
      })
      return
    }

    setIsSubmitting(true)
    setFeedback(null)

    try {
      const metadata = await fetchListingMetadata(domain)

      await submitBid({
        domain,
        name: metadata.name,
        url: metadata.url,
        categoryId,
        amount: contribution,
        description: metadata.description,
        logoUrl: metadata.logoUrl,
      })

      setFeedback({
        type: 'success',
        message: 'Bid submitted! Refresh to see the updated leaderboard.',
      })
    } catch (error) {
      setFeedback({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Something went wrong. Please try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!target) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="outbid-title"
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-[#14102B66] backdrop-blur-[2px]"
      />

      {/* Panel — bottom sheet on mobile, centered card on desktop */}
      <div className="relative z-10 max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-[#E7E1F2] bg-[#FCFBFA] p-6 shadow-[0_24px_64px_-16px_rgba(20,16,43,0.35)] sm:rounded-3xl sm:p-7">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3
              id="outbid-title"
              className="text-lg font-bold leading-tight text-[#14102B] sm:text-xl"
            >
              Outbid rank #{target.rank}
            </h3>
            <p className="mt-1 text-xs text-[#5B5468] sm:text-sm">
              Minimum to take this rank:{' '}
              <span className="font-semibold tabular-nums text-[#4B2AAD]">
                ${requiredAmount.toLocaleString()}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#9B94A8] transition-colors duration-150 hover:bg-[#F5F1FB] hover:text-[#14102B]"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Read-only target context — the clicked listing is never
            copied into the form; it only anchors rank + required
            amount */}
        <div className="mt-4 flex items-center gap-2.5 rounded-xl bg-[#F5F1FB] px-4 py-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#4B2AAD] text-xs font-bold text-white">
            {target.rank}
          </span>
          <p className="min-w-0 truncate text-sm font-semibold text-[#14102B]">
            {target.name}
          </p>
          <p className="ml-auto shrink-0 text-sm font-semibold tabular-nums text-[#5B5468]">
            ${target.amount.toLocaleString()}
          </p>
        </div>

        {/* Form — same primitives/styles as ClaimRank */}
        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
          <div>
            <label
              htmlFor="outbid-domain"
              className="mb-1.5 block text-xs font-medium text-[#5B5468]"
            >
              Your domain
            </label>
            <input
              id="outbid-domain"
              type="text"
              value={productUrl}
              onChange={(event) => setProductUrl(event.target.value)}
              placeholder="yourproduct.com"
              autoFocus
              className="h-11 w-full rounded-xl border border-[#E7E1F2] bg-[#FFFFFF] px-4 text-sm text-[#14102B] outline-none transition-shadow duration-150 placeholder:text-[#9B94A8] focus:border-[#4B2AAD] focus:ring-2 focus:ring-[#4B2AAD33] sm:h-12"
            />
          </div>

          <div>
            <span className="mb-1.5 block text-xs font-medium text-[#5B5468]">
              Category
            </span>
            <CategorySelect value={categoryId} onChange={setCategoryId} />
          </div>

          <div>
            <span className="mb-1.5 block text-xs font-medium text-[#5B5468]">
              Amount
            </span>
            <div className="flex h-11 items-center rounded-xl border border-[#E7E1F2] bg-[#F5F1FB] px-4 sm:h-12">
              <span className="text-base font-bold tabular-nums text-[#14102B]">
                ${requiredAmount.toLocaleString()}
              </span>
            </div>
            <p className="mt-1.5 text-xs text-[#9B94A8]">
              Fixed — the minimum needed to take rank #{target.rank}.
            </p>
          </div>

          {/* Existing-domain status */}
          {isLoadingListings ? (
            <p className="text-xs text-[#9B94A8]">Checking current listings…</p>
          ) : !domain ? null : existingListing ? (
            <div className="rounded-xl border border-[#E7E1F2] bg-[#FCFBFA] px-4 py-3">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                <div>
                  <p className="text-xs text-[#9B94A8]">Current total bid</p>
                  <p className="text-base font-semibold tabular-nums text-[#14102B]">
                    ${currentTotal.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#9B94A8]">
                    New total after your bid
                  </p>
                  <p className="text-base font-semibold tabular-nums text-[#14102B]">
                    ${(currentTotal + contribution).toLocaleString()}
                  </p>
                </div>
              </div>

              {alreadyMeetsRequirement ? (
                <p className="mt-2 text-xs font-medium text-[#4B2AAD]">
                  This domain already meets the required amount — no bid needed.
                </p>
              ) : (
                <p className="mt-2 text-xs font-medium text-[#4B2AAD]">
                  Your contribution:{' '}
                  <span className="font-semibold tabular-nums">
                    ${contribution.toLocaleString()}
                  </span>{' '}
                  <span className="font-normal text-[#9B94A8]">
                    (${requiredAmount.toLocaleString()} required − ${' '}
                    {currentTotal.toLocaleString()} existing)
                  </span>
                </p>
              )}

              <p className="mt-1 text-xs text-[#9B94A8]">
                This domain is already listed — your bid adds to its total.
              </p>
            </div>
          ) : (
            <p className="text-xs text-[#9B94A8]">
              New domain — your bid becomes its starting total of ${' '}
              {requiredAmount.toLocaleString()}.
            </p>
          )}

          <button
            type="submit"
            disabled={
              isSubmitting ||
              alreadyMeetsRequirement ||
              feedback?.type === 'success'
            }
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#4B2AAD] px-5 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#3D2189] disabled:pointer-events-none disabled:opacity-60"
          >
            {isSubmitting
              ? 'Submitting…'
              : existingListing && !alreadyMeetsRequirement
                ? `Outbid $${contribution.toLocaleString()} →`
                : 'Outbid →'}
          </button>

          {feedback && (
            <p
              aria-live="polite"
              className={[
                'text-xs font-medium',
                feedback.type === 'error' ? 'text-[#B42318]' : 'text-[#4B2AAD]',
              ].join(' ')}
            >
              {feedback.message}
            </p>
          )}
        </form>
      </div>
    </div>
  )
}

/**
 * Local copy of ClaimRank's normalizeDomain (not exported there yet —
 * consolidate in the shared-exports step).
 */
function normalizeDomain(input: string) {
  return input
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/, '')
    .toLowerCase()
}

/**
 * Local copy of ClaimRank's fetchListingMetadata — best-effort
 * server-side metadata lookup; any failure falls back to the bare
 * domain so the bid is never blocked.
 */
async function fetchListingMetadata(domain: string) {
  const fallback = {
    name: domain,
    description: '',
    logoUrl: '',
    url: `https://${domain}`,
  }

  try {
    const response = await fetch(
      `/api/metadata?domain=${encodeURIComponent(domain)}`,
    )

    if (!response.ok) {
      return fallback
    }

    const data = (await response.json()) as {
      name?: string
      description?: string
      logoUrl?: string
      url?: string
    }

    return {
      name: data.name?.trim() || fallback.name,
      description: data.description ?? '',
      logoUrl: data.logoUrl ?? '',
      url: data.url || fallback.url,
    }
  } catch {
    return fallback
  }
}

/**
 * Local copy of ClaimRank's CategorySelect (not exported there yet —
 * consolidate in the shared-exports step). Uses the shared
 * @/lib/categories + @/lib/CategoryIcon underneath.
 */
function CategorySelect({
  value,
  onChange,
}: {
  value: CategoryId | null
  onChange: (id: CategoryId) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selected = CATEGORIES.find((category) => category.id === value) ?? null

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-[#E7E1F2] bg-[#FCFBFA] px-4 text-left text-sm text-[#14102B] outline-none transition-shadow duration-150 focus:border-[#4B2AAD] focus:ring-2 focus:ring-[#4B2AAD33] sm:h-12"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 text-[#5B5468]">
            <CategoryIcon id={selected?.id ?? 'other'} className="h-4 w-4" />
          </span>
          <span
            className={[
              'truncate',
              selected ? 'text-[#14102B]' : 'text-[#9B94A8]',
            ].join(' ')}
          >
            {selected ? selected.label : 'Choose a category'}
          </span>
        </span>
        <ChevronIcon isOpen={isOpen} />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute left-0 top-[calc(100%+8px)] z-30 max-h-64 w-full overflow-y-auto rounded-2xl border border-[#E7E1F2] bg-[#FCFBFA] p-1.5 shadow-[0_16px_40px_-12px_rgba(20,16,43,0.22)]"
        >
          {CATEGORIES.map((category) => {
            const isActive = category.id === value
            return (
              <button
                key={category.id}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => {
                  onChange(category.id)
                  setIsOpen(false)
                }}
                className={[
                  'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-colors duration-150',
                  isActive
                    ? 'bg-[#4B2AAD14] text-[#4B2AAD] font-medium'
                    : 'text-[#14102B] hover:bg-[#F5F1FB]',
                ].join(' ')}
              >
                <span
                  className={isActive ? 'text-[#4B2AAD]' : 'text-[#9B94A8]'}
                >
                  <CategoryIcon id={category.id} className="h-4 w-4" />
                </span>
                {category.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ChevronIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 8"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={[
        'shrink-0 text-[#9B94A8] transition-transform duration-150',
        isOpen ? 'rotate-180' : 'rotate-0',
      ].join(' ')}
    >
      <path
        d="M1 1L6 6L11 1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M2 2L12 12M12 2L2 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
