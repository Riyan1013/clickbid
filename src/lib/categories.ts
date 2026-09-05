export type CategoryId =
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

export interface Category {
  id: CategoryId
  label: string
}

/**
 * Single source of truth for ClickBid's category list. Used by the
 * Leaderboard filters, the ClaimRank category selector, and the
 * global CategoryBar so category data is defined exactly once.
 */
export const CATEGORIES: Category[] = [
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
