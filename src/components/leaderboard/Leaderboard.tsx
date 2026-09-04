'use client'

import { useState } from 'react'

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

type FilterId = CategoryId | 'all'

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

// Fictional demo data for UI purposes only — not real ClickBid rankings.
const DEMO_LISTINGS: Listing[] = [
  {
    rank: 1,
    name: 'Linear',
    domain: 'linear.app',
    categoryId: 'developer-tools',
    amount: 12_500,
  },
  {
    rank: 2,
    name: 'Vercel',
    domain: 'vercel.com',
    categoryId: 'developer-tools',
    amount: 9_800,
  },
  {
    rank: 3,
    name: 'Notion',
    domain: 'notion.so',
    categoryId: 'other',
    amount: 7_500,
  },
  {
    rank: 4,
    name: 'Cursor',
    domain: 'cursor.com',
    categoryId: 'developer-tools',
    amount: 6_200,
  },
  {
    rank: 5,
    name: 'Perplexity',
    domain: 'perplexity.ai',
    categoryId: 'ai-agents',
    amount: 5_400,
  },
  {
    rank: 6,
    name: 'Framer',
    domain: 'framer.com',
    categoryId: 'design-creative',
    amount: 4_900,
  },
  {
    rank: 7,
    name: 'Ramp',
    domain: 'ramp.com',
    categoryId: 'finance-business',
    amount: 4_300,
  },
  {
    rank: 8,
    name: 'Webflow',
    domain: 'webflow.com',
    categoryId: 'design-creative',
    amount: 3_850,
  },
  {
    rank: 9,
    name: 'Loom',
    domain: 'loom.com',
    categoryId: 'social-creator',
    amount: 3_400,
  },
  {
    rank: 10,
    name: 'HubSpot',
    domain: 'hubspot.com',
    categoryId: 'marketing-advertising',
    amount: 2_950,
  },
]

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
              onClick={() => setActiveFilter(filter.id)}
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

      <div className="mt-6 flex flex-col gap-3">
        {DEMO_LISTINGS.map((listing) => (
          <LeaderboardRow key={listing.rank} listing={listing} />
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <button
          type="button"
          className="rounded-xl border border-[#E7E1F2] bg-[#FCFBFA] px-5 py-2.5 text-sm font-medium text-[#14102B] transition-colors duration-150 hover:bg-[#F5F1FB]"
        >
          Load more
        </button>
      </div>
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

function CategoryIcon({ id, className }: { id: FilterId; className?: string }) {
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
    case 'all':
      return (
        <svg {...common}>
          <path
            d="M2.5 4.5H13.5M2.5 8H13.5M2.5 11.5H10"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </svg>
      )
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
