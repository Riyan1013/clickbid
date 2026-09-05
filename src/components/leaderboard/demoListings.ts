import type { CategoryId } from '@/lib/categories'

export type Listing = {
  rank: number
  name: string
  domain: string
  categoryId: CategoryId
  amount: number
}

// Fictional demo data for UI purposes only — not real ClickBid rankings.

export const DEMO_LISTINGS: Listing[] = [
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
