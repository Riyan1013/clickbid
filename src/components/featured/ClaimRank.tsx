'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { submitBid } from '@/lib/listings'

type CategoryId =
  | 'ai-agents'
  | 'seo-visibility'
  | 'marketing-advertising'
  | 'developer-tools'
  | 'design-creative'
  | 'finance-business'
  | 'security-privacy'
  | 'health-wellness'
  | 'social-creator'
  | 'attention-markets'
  | 'jobs-careers'
  | 'education'
  | 'ecommerce'
  | 'other'

interface Category {
  id: CategoryId
  label: string
}

const CATEGORIES: Category[] = [
  { id: 'ai-agents', label: 'AI & Agents' },
  { id: 'seo-visibility', label: 'SEO & Visibility' },
  { id: 'marketing-advertising', label: 'Marketing & Advertising' },
  { id: 'developer-tools', label: 'Developer Tools' },
  { id: 'design-creative', label: 'Design & Creative' },
  { id: 'finance-business', label: 'Finance & Business' },
  { id: 'security-privacy', label: 'Security & Privacy' },
  { id: 'health-wellness', label: 'Health & Wellness' },
  { id: 'social-creator', label: 'Social & Creator' },
  { id: 'attention-markets', label: 'Attention Markets' },
  { id: 'jobs-careers', label: 'Jobs & Careers' },
  { id: 'education', label: 'Education' },
  { id: 'ecommerce', label: 'E-commerce' },
  { id: 'other', label: 'Other' },
]

// Demonstration data only — mirrors the Hero's placeholder #1 listing.
const CURRENT_LEADER_BID = 12_500
const MINIMUM_BID = CURRENT_LEADER_BID + 1

type SubmitFeedback = {
  type: 'success' | 'error'
  message: string
}

/**
 * ClaimRank
 *
 * Bidding control. Collects a product/domain, category (via a custom
 * dropdown), and bid amount, validates and normalizes the input, and
 * submits the bid via submitBid(). Rank is never chosen manually —
 * the section makes clear that bid amount alone determines placement.
 * No payment logic is wired up yet.
 */
export function ClaimRank() {
  const [productUrl, setProductUrl] = useState('')
  const [categoryId, setCategoryId] = useState<CategoryId | null>(null)
  const [bidAmount, setBidAmount] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<SubmitFeedback | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    // Guard against double submission while a request is in flight.
    if (isSubmitting) return

    const domain = normalizeDomain(productUrl)
    if (!domain) {
      setFeedback({
        type: 'error',
        message: 'Please enter a product or domain.',
      })
      return
    }

    if (!categoryId) {
      setFeedback({
        type: 'error',
        message: 'Please choose a category.',
      })
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
        message:
          'Bid submitted! Refresh the page to see it on the leaderboard.',
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

  return (
    <section className="px-4 pb-14 sm:px-6 md:px-10 lg:px-16 lg:pb-20">
      <div className="mx-auto max-w-[1200px] rounded-[20px] border border-[#E7E1F2] bg-[#F5F1FB] p-6 sm:p-8 lg:p-10">
        <div className="grid gap-10 lg:grid-cols-[5fr_7fr] lg:gap-12">
          {/* Left: context */}
          <div className="flex flex-col justify-center">
            <h2 className="text-xl font-bold leading-tight text-[#14102B] sm:text-2xl">
              Claim your place.
            </h2>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#5B5468] sm:text-[15px]">
              Submit your product, choose a category, and bid your way onto the
              board.
            </p>

            <p className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-[#4B2AAD] sm:text-sm">
              <InfoIcon />
              Your rank is determined by your bid.
            </p>

            {/* Current leader / minimum bid indicator */}
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-[#E7E1F2] pt-5">
              <div>
                <p className="text-xs text-[#9B94A8]">Current #1</p>
                <p className="text-base font-semibold tabular-nums text-[#14102B]">
                  ${CURRENT_LEADER_BID.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#9B94A8]">Minimum bid</p>
                <p className="text-base font-semibold tabular-nums text-[#14102B]">
                  ${MINIMUM_BID.toLocaleString()}
                </p>
              </div>
              <span className="text-xs text-[#9B94A8]">
                (demonstration data)
              </span>
            </div>
          </div>

          {/* Right: form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="product-url"
                className="mb-1.5 block text-xs font-medium text-[#5B5468]"
              >
                Product or domain
              </label>
              <input
                id="product-url"
                type="text"
                value={productUrl}
                onChange={(event) => setProductUrl(event.target.value)}
                placeholder="yourproduct.com"
                className="h-11 w-full rounded-xl border border-[#E7E1F2] bg-[#FCFBFA] px-4 text-sm text-[#14102B] outline-none transition-shadow duration-150 placeholder:text-[#9B94A8] focus:border-[#4B2AAD] focus:ring-2 focus:ring-[#4B2AAD33] sm:h-12"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <span className="mb-1.5 block text-xs font-medium text-[#5B5468]">
                  Category
                </span>
                <CategorySelect value={categoryId} onChange={setCategoryId} />
              </div>

              <div>
                <label
                  htmlFor="bid-amount"
                  className="mb-1.5 block text-xs font-medium text-[#5B5468]"
                >
                  Your bid
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#9B94A8]">
                    ${' '}
                  </span>
                  <input
                    id="bid-amount"
                    type="text"
                    inputMode="numeric"
                    value={bidAmount}
                    onChange={(event) =>
                      setBidAmount(event.target.value.replace(/[^0-9]/g, ''))
                    }
                    placeholder="100"
                    className="h-11 w-full rounded-xl border border-[#E7E1F2] bg-[#FCFBFA] pl-8 pr-4 text-base font-semibold tabular-nums text-[#14102B] outline-none transition-shadow duration-150 placeholder:font-normal placeholder:text-[#9B94A8] focus:border-[#4B2AAD] focus:ring-2 focus:ring-[#4B2AAD33] sm:h-12"
                  />
                </div>
                <p className="mt-1.5 text-xs text-[#9B94A8]">
                  Bid higher than the current rank you want.
                </p>
              </div>
            </div>

            <div className="mt-2 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#4B2AAD] px-5 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#3D2189] disabled:pointer-events-none disabled:opacity-60 sm:w-auto"
              >
                Claim Rank
                <span aria-hidden="true">→</span>
              </button>
              <p className="text-xs text-[#9B94A8]">
                Payment will be handled securely at checkout.
              </p>
            </div>

            {feedback && (
              <p
                aria-live="polite"
                className={[
                  'text-xs font-medium',
                  feedback.type === 'error'
                    ? 'text-[#B42318]'
                    : 'text-[#4B2AAD]',
                ].join(' ')}
              >
                {feedback.message}
              </p>
            )}
          </form>
        </div>
      </div>
    </section>
  )
}

/**
 * Normalizes user input into a bare, lowercase domain, e.g.
 * " https://Example.com/ " → "example.com": trims whitespace, strips
 * a leading http:// or https://, and removes trailing slashes.
 */
function normalizeDomain(input: string) {
  return input
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/, '')
    .toLowerCase()
}

/**
 * Best-effort server-side metadata lookup for a domain. Any failure
 * — network error, non-200 response, malformed JSON — falls back to
 * the bare domain so the bid submission is never blocked.
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
 * CategorySelect
 *
 * Custom dropdown replacing the native <select>. Closed state shows
 * the selected category's icon + label (or a placeholder). Open state
 * renders a bordered, rounded panel of icon + label rows, with the
 * active category highlighted in a subtle violet tint.
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

function InfoIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="7" cy="7" r="6" stroke="#4B2AAD" strokeWidth="1.2" />
      <path
        d="M7 6.25V10"
        stroke="#4B2AAD"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="7" cy="4.25" r="0.75" fill="#4B2AAD" />
    </svg>
  )
}

/**
 * CategoryIcon
 *
 * Small, consistent inline SVG icons for each ClickBid category.
 * No icon library — one simple stroke-based glyph per category.
 */
function CategoryIcon({
  id,
  className,
}: {
  id: CategoryId
  className?: string
}) {
  const common = {
    width: 16,
    height: 16,
    viewBox: '0 0 16 16',
    fill: 'none' as const,
    xmlns: 'http://www.w3.org/2000/svg',
    'aria-hidden': true as const,
    className,
  }

  switch (id) {
    case 'ai-agents':
      return (
        <svg {...common}>
          <path
            d="M8 1.5L9.4 6.1L14 7.5L9.4 8.9L8 13.5L6.6 8.9L2 7.5L6.6 6.1L8 1.5Z"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'seo-visibility':
      return (
        <svg {...common}>
          <circle
            cx="6.5"
            cy="6.5"
            r="4"
            stroke="currentColor"
            strokeWidth="1.3"
          />
          <path
            d="M9.5 9.5L13.5 13.5"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </svg>
      )
    case 'marketing-advertising':
      return (
        <svg {...common}>
          <path
            d="M2 6.5V9.5H4.5L9 12.5V3.5L4.5 6.5H2Z"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
          <path
            d="M11.5 6.2C12.2 6.7 12.6 7.3 12.6 8C12.6 8.7 12.2 9.3 11.5 9.8"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </svg>
      )
    case 'developer-tools':
      return (
        <svg {...common}>
          <path
            d="M5.5 4L2 8L5.5 12"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M10.5 4L14 8L10.5 12"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'design-creative':
      return (
        <svg {...common}>
          <path
            d="M8 2C4.7 2 2 4.5 2 7.6C2 9.6 3.5 10.4 4.6 10.4C5.2 10.4 5.4 10 5.2 9.5C5 9 5.3 8.6 5.8 8.6H9.4C11.4 8.6 13 7.1 13 5.4C13 3.4 10.8 2 8 2Z"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          <circle cx="5.2" cy="6" r="0.6" fill="currentColor" />
          <circle cx="8" cy="4.8" r="0.6" fill="currentColor" />
          <circle cx="10.4" cy="6.2" r="0.6" fill="currentColor" />
        </svg>
      )
    case 'finance-business':
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
          <path
            d="M8 4.8V11.2M9.8 6.2C9.8 5.4 9 4.8 8 4.8C7 4.8 6.2 5.4 6.2 6.2C6.2 7.8 9.8 7 9.8 8.8C9.8 9.6 9 10.2 8 10.2C7 10.2 6.2 9.6 6.2 8.8"
            stroke="currentColor"
            strokeWidth="1.1"
            strokeLinecap="round"
          />
        </svg>
      )
    case 'security-privacy':
      return (
        <svg {...common}>
          <path
            d="M8 1.8L13 3.6V7.4C13 10.5 10.9 12.9 8 13.8C5.1 12.9 3 10.5 3 7.4V3.6L8 1.8Z"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'health-wellness':
      return (
        <svg {...common}>
          <path
            d="M8 13.2C8 13.2 2.5 9.8 2.5 6.1C2.5 4.2 4 2.9 5.7 2.9C6.7 2.9 7.5 3.4 8 4.1C8.5 3.4 9.3 2.9 10.3 2.9C12 2.9 13.5 4.2 13.5 6.1C13.5 9.8 8 13.2 8 13.2Z"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'social-creator':
      return (
        <svg {...common}>
          <circle
            cx="5.5"
            cy="6"
            r="2"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <circle
            cx="11"
            cy="6.5"
            r="1.5"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <path
            d="M2 13C2 10.8 3.6 9.2 5.5 9.2C7.4 9.2 9 10.8 9 13"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <path
            d="M9.8 9.6C11.4 9.7 12.6 11 12.6 12.6"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>
      )
    case 'attention-markets':
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="8" cy="8" r="0.8" fill="currentColor" />
        </svg>
      )
    case 'jobs-careers':
      return (
        <svg {...common}>
          <rect
            x="2.5"
            y="5.5"
            width="11"
            height="7.5"
            rx="1.2"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <path
            d="M6 5.5V4.2C6 3.6 6.5 3.2 7 3.2H9C9.5 3.2 10 3.6 10 4.2V5.5"
            stroke="currentColor"
            strokeWidth="1.2"
          />
        </svg>
      )
    case 'education':
      return (
        <svg {...common}>
          <path
            d="M8 3L14 5.8L8 8.6L2 5.8L8 3Z"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          <path
            d="M4.5 7.2V10C4.5 11 6 12 8 12C10 12 11.5 11 11.5 10V7.2"
            stroke="currentColor"
            strokeWidth="1.2"
          />
        </svg>
      )
    case 'ecommerce':
      return (
        <svg {...common}>
          <path
            d="M2.5 4H4L5.2 10.4C5.3 10.9 5.7 11.2 6.2 11.2H11.4C11.9 11.2 12.3 10.9 12.4 10.4L13.5 5.8H4.4"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="6.4" cy="13" r="0.8" fill="currentColor" />
          <circle cx="11" cy="13" r="0.8" fill="currentColor" />
        </svg>
      )
    case 'other':
    default:
      return (
        <svg {...common}>
          <rect
            x="3"
            y="3"
            width="4"
            height="4"
            rx="1"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <rect
            x="9"
            y="3"
            width="4"
            height="4"
            rx="1"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <rect
            x="3"
            y="9"
            width="4"
            height="4"
            rx="1"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <rect
            x="9"
            y="9"
            width="4"
            height="4"
            rx="1"
            stroke="currentColor"
            strokeWidth="1.2"
          />
        </svg>
      )
  }
}
