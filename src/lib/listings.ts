import { supabase } from '@/lib/supabase'

import type { CategoryId } from '@/lib/categories'

/**
 * Shape the Leaderboard renders. Adapted from the previous static
 * Listing type (demoListings.ts) for live Supabase data:
 * - `id` is now the Supabase row's UUID (used as the React key)
 *   instead of relying on `rank`.
 * - `rank` is no longer stored data — it's derived client-side from
 *   sort position after ordering by amount, since the listings table
 *   doesn't store an explicit rank column.
 * - `categoryId` is still typed as the existing `CategoryId` union so
 *   category names/icons keep working via `@/lib/categories` /
 *   `@/lib/CategoryIcon` exactly as before.
 *
 * ASSUMPTION (please confirm against your actual schema): the
 * `listings.category_id` column stores the same slug values as
 * `CategoryId` (e.g. "developer-tools"), matching `categories.id` in
 * Supabase directly to entries in `@/lib/categories`. If your
 * `categories`/`listings` tables instead use a separate UUID primary
 * key for categories, this mapping will need a join against the
 * `categories` table (e.g. by a `slug` column) instead of the direct
 * cast used below — happy to adjust once you confirm the schema.
 */
export type LeaderboardListing = {
  id: string
  rank: number
  name: string
  domain: string
  categoryId: CategoryId
  amount: number
  description?: string
  logoUrl?: string
  clickCount?: number
  updatedAt?: string
}

type ListingRow = {
  id: string
  name: string
  domain: string
  category_id: string
  amount: number
  description?: string | null
  logo_url?: string | null
  updated_at?: string | null
  clicks?: { count: number }[]
}

export async function fetchLeaderboardListings(): Promise<
  LeaderboardListing[]
> {
  const { data, error } = await supabase
    .from('listings')
    .select(
      `
  id,
  name,
  domain,
  category_id,
  amount,
  description,
  logo_url,
  updated_at,
  clicks(count)
`,
    )
    .order('amount', { ascending: false })

  if (error) {
    throw error
  }

  return ((data ?? []) as ListingRow[]).map((row, index) => ({
    id: row.id,
    rank: index + 1,
    name: row.name,
    domain: row.domain,
    categoryId: row.category_id as CategoryId,
    amount: row.amount,
    description: row.description ?? undefined,
    logoUrl: row.logo_url ?? undefined,
    clickCount: row.clicks?.[0]?.count ?? 0,
    updatedAt: row.updated_at ?? undefined,
  }))
}

/**
 * Formats an updated_at timestamp as a short human-readable relative
 * time — "just now", "5 minutes ago", "2 hours ago", "3 days ago",
 * then weeks / months / years. Returns undefined when the timestamp
 * is missing or unparsable so the UI simply omits that part.
 */
export function formatTimeAgo(
  isoTimestamp: string | null | undefined,
): string | undefined {
  if (!isoTimestamp) {
    return undefined
  }

  const date = new Date(isoTimestamp)

  if (Number.isNaN(date.getTime())) {
    return undefined
  }

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)

  if (seconds < 60) {
    return 'just now'
  }

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) {
    return pluralize(minutes, 'minute')
  }

  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return pluralize(hours, 'hour')
  }

  const days = Math.floor(hours / 24)
  if (days < 7) {
    return pluralize(days, 'day')
  }

  const weeks = Math.floor(days / 7)
  if (weeks < 5) {
    return pluralize(weeks, 'week')
  }

  const months = Math.floor(days / 30)
  if (months < 12) {
    return pluralize(months, 'month')
  }

  return pluralize(Math.floor(months / 12), 'year')
}

function pluralize(count: number, unit: string) {
  return `${count} ${unit}${count === 1 ? '' : 's'} ago`
}

export type SubmitBidInput = {
  domain: string
  name: string
  url: string
  categoryId: CategoryId
  amount: number
  description?: string
  logoUrl?: string
}

/**
 * Submit a bid for a website. Finds the listing by domain: if none
 * exists, creates it with the bid as the initial amount; if it
 * exists, the bid is a contribution added to the current total
 * (e.g. $21,001 + $500 → $21,501). The bids row records the
 * contributed amount, not the running total. Returns the
 * created/updated listing row.
 */
export async function submitBid(input: SubmitBidInput): Promise<ListingRow> {
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error('Bid amount must be greater than 0.')
  }

  const { data: existing, error: findError } = await supabase
    .from('listings')
    .select('id, name, domain, category_id, amount')
    .eq('domain', input.domain)
    .maybeSingle()

  if (findError) {
    // PGRST116 from maybeSingle() means multiple rows matched —
    // only possible without a unique constraint on domain.
    if (findError.code === 'PGRST116') {
      throw new Error(
        `Multiple listings exist for ${input.domain}. Add a unique constraint on listings.domain.`,
      )
    }

    throw new Error(`Could not look up listing: ${findError.message}`)
  }

  let listing: ListingRow

  if (!existing) {
    const now = new Date().toISOString()

    const { data: created, error: insertError } = await supabase
      .from('listings')
      .insert({
        domain: input.domain,
        name: input.name,
        url: input.url,
        category_id: input.categoryId,
        amount: input.amount,
        description: input.description ?? null,
        logo_url: input.logoUrl ?? null,
        created_at: now,
        updated_at: now,
      })
      .select('id, name, domain, category_id, amount, description')
      .single()

    if (insertError) {
      throw new Error(`Could not create listing: ${insertError.message}`)
    }

    listing = created
  } else {
    // Cumulative bidding: input.amount is a contribution added to
    // the existing total, not a replacement for it.
    const { data: updated, error: updateError } = await supabase
      .from('listings')
      .update({
        name: input.name,
        url: input.url,
        category_id: input.categoryId,
        amount: existing.amount + input.amount,
        description: input.description ?? null,
        logo_url: input.logoUrl ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select('id, name, domain, category_id, amount')
      .single()

    if (updateError) {
      throw new Error(`Could not update listing: ${updateError.message}`)
    }

    listing = updated
  }

  const { error: bidError } = await supabase.from('bids').insert({
    listing_id: listing.id,
    amount: input.amount,
    created_at: new Date().toISOString(),
  })

  if (bidError) {
    throw new Error(`Could not record bid: ${bidError.message}`)
  }

  return listing
}
