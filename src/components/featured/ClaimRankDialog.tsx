'use client'

import { useEffect, useState, type FormEvent } from 'react'
import {
  fetchLeaderboardListings,
  submitBid,
  type LeaderboardListing,
} from '@/lib/listings'
import {
  CategorySelect,
  fetchListingMetadata,
  normalizeDomain,
  type CategoryId,
} from '@/components/featured/ClaimRank'

type SubmitFeedback = {
  type: 'success' | 'error'
  message: string
}

export function ClaimRankDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const [productUrl, setProductUrl] = useState('')
  const [categoryId, setCategoryId] = useState<CategoryId | null>(null)
  const [bidAmount, setBidAmount] = useState('')
  const [listings, setListings] = useState<LeaderboardListing[]>([])
  const [isLoadingListings, setIsLoadingListings] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<SubmitFeedback | null>(null)

  // Reset every time the dialog opens — domain/category/bid/feedback
  // always start empty, never prefilled.
  useEffect(() => {
    if (!isOpen) return

    setProductUrl('')
    setCategoryId(null)
    setBidAmount('')
    setFeedback(null)
  }, [isOpen])

  // Load current listings once, so an entered domain can be matched
  // to its existing listing. Non-critical: on failure every domain is
  // simply treated as new — it never blocks the actual bid flow.
  useEffect(() => {
    let isMounted = true

    fetchLeaderboardListings()
      .then((data) => {
        if (isMounted) setListings(data)
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
    if (!isOpen) return

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
  }, [isOpen, onClose])

  const domain = normalizeDomain(productUrl)

  const existingListing = domain
    ? listings.find((listing) => listing.domain.toLowerCase() === domain)
    : undefined

  const enteredAmount = Number(bidAmount) || 0

  const projectedTotal = existingListing
    ? existingListing.amount + enteredAmount
    : enteredAmount

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isSubmitting) return

    if (!domain) {
      setFeedback({ type: 'error', message: 'Please enter your domain.' })
      return
    }

    if (!categoryId) {
      setFeedback({ type: 'error', message: 'Please choose a category.' })
      return
    }

    const amount = Number(bidAmount)

    if (!Number.isFinite(amount) || amount <= 0) {
      setFeedback({
        type: 'error',
        message: 'Please enter a valid bid amount.',
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
        amount,
        description: metadata.description,
        logoUrl: metadata.logoUrl,
      })

      setFeedback({
        type: 'success',
        message: 'Bid submitted! Refresh to see it on the leaderboard.',
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

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="claim-rank-dialog-title"
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
      />

      {/* Panel — bottom sheet on mobile, centered card on desktop */}
      <div className="relative z-10 max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-border bg-surface p-6 shadow-[0_24px_64px_-16px_rgba(20,16,43,0.35)] sm:rounded-3xl sm:p-7">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3
              id="claim-rank-dialog-title"
              className="text-lg font-bold leading-tight text-ink sm:text-xl"
            >
              Claim a Rank
            </h3>

            <p className="mt-1 text-xs text-secondary sm:text-sm">
              Put your website or product on the ClickBid leaderboard.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors duration-150 hover:bg-inset hover:text-ink"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Form — same primitives/styles as ClaimRank/OutbidDialog */}
        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
          <div>
            <label
              htmlFor="claim-rank-domain"
              className="mb-1.5 block text-xs font-medium text-secondary"
            >
              Your domain
            </label>

            <input
              id="claim-rank-domain"
              type="text"
              value={productUrl}
              onChange={(event) => setProductUrl(event.target.value)}
              placeholder="yourproduct.com"
              autoFocus
              className="h-11 w-full rounded-xl border border-border bg-surface px-4 text-sm text-ink outline-none transition-shadow duration-150 placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 sm:h-12"
            />
          </div>

          <div>
            <span className="mb-1.5 block text-xs font-medium text-secondary">
              Category
            </span>

            <CategorySelect value={categoryId} onChange={setCategoryId} />
          </div>

          <div>
            <label
              htmlFor="claim-rank-bid"
              className="mb-1.5 block text-xs font-medium text-secondary"
            >
              Your bid
            </label>

            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted">
                $
              </span>

              <input
                id="claim-rank-bid"
                type="text"
                inputMode="numeric"
                value={bidAmount}
                onChange={(event) =>
                  setBidAmount(event.target.value.replace(/[^0-9]/g, ''))
                }
                placeholder="100"
                className="h-11 w-full rounded-xl border border-border bg-surface pl-8 pr-4 text-base font-semibold tabular-nums text-ink outline-none transition-shadow duration-150 placeholder:font-normal placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 sm:h-12"
              />
            </div>

            <p className="mt-1.5 text-xs text-muted">
              For an existing domain, this amount is added to its current total.
            </p>
          </div>

          {/* Existing-domain / new-domain status */}
          {isLoadingListings ? (
            <p className="text-xs text-muted">Checking current listings…</p>
          ) : !domain ? null : existingListing ? (
            <div className="rounded-xl border border-border bg-inset px-4 py-3">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                <div>
                  <p className="text-xs text-muted">Current total bid</p>

                  <p className="text-base font-semibold tabular-nums text-ink">
                    ${existingListing.amount.toLocaleString()}
                  </p>
                </div>

                {enteredAmount > 0 && (
                  <div>
                    <p className="text-xs text-muted">
                      New total after your bid
                    </p>

                    <p className="text-base font-semibold tabular-nums text-ink">
                      ${projectedTotal.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              <p className="mt-2 text-xs text-muted">
                This domain is already listed — your bid adds to its total.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-inset px-4 py-3">
              <p className="text-xs text-muted">
                {enteredAmount > 0
                  ? `New domain — your bid becomes its starting total of $${enteredAmount.toLocaleString()}.`
                  : 'New domain — your bid becomes its starting total.'}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || feedback?.type === 'success'}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-on-primary transition-colors duration-150 hover:bg-primary-hover disabled:pointer-events-none disabled:opacity-60"
          >
            {isSubmitting ? 'Submitting…' : 'Claim Rank →'}
          </button>

          <p className="text-center text-xs text-muted">
            Payment will be handled securely at checkout.
          </p>

          {feedback && (
            <p
              aria-live="polite"
              className={[
                'text-xs font-medium',
                feedback.type === 'error' ? 'text-danger' : 'text-primary',
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
