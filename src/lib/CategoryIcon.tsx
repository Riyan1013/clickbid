import type { CategoryId } from '@/lib/categories'

export type CategoryIconId = CategoryId | 'all'

/**
 * CategoryIcon
 *
 * Small, consistent inline SVG icons for each ClickBid category, plus
 * an "all" variant for leading filter pills. No icon library — shared
 * across the Leaderboard filters, ClaimRank selector, and CategoryBar
 * so every icon is defined exactly once.
 */
export function CategoryIcon({
  id,
  className,
}: {
  id: CategoryIconId
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
