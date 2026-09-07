import { supabase } from '@/lib/supabase'
import type { CategoryId } from '@/lib/categories'

/**
 * Shape the Leaderboard renders. Adapted from the previous static
 * `Listing` type (demoListings.ts) for live Supabase data:
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
}

type ListingRow = {
  id: string
  name: string
  domain: string
  category_id: string
  amount: number
}

export async function fetchLeaderboardListings(): Promise<
  LeaderboardListing[]
> {
  const { data, error } = await supabase
    .from('listings')
    .select('id, name, domain, category_id, amount')
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
  }))
}
