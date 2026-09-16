import { CATEGORIES, type CategoryId } from '@/lib/categories'
import { CategoryIcon } from '@/lib/CategoryIcon'

import { PageCanvas } from '@/components/layout/PageCanvas'
import { AppShell } from '@/components/layout/AppShell'
import { Header } from '@/components/layout/Header'
import { supabase } from '@/lib/supabase'

// Live listing/bid data — render per request instead of freezing a
// build-time snapshot into the static page.
export const dynamic = 'force-dynamic'

type CategoryTopListing = {
  id: string
  name: string
  amount: number
  logoUrl?: string
}

type ListingTopRow = {
  id: string
  name: string
  category_id: string
  amount: number
  logo_url: string | null
}

/**
 * Real listings grouped per category — feeds BOTH the All Categories
 * mini leaderboards and the Trending section (listing counts +
 * current #1s): ONE Supabase query (id/name/category/amount/logo
 * only — no per-category requests), ordered by amount DESC in the
 * database, grouped in JS — so each category's array is already
 * sorted and [0] is its current #1. Throws on error; the page
 * catches it and renders its error state.
 */
async function fetchCategoryListings(): Promise<
  Map<CategoryId, CategoryTopListing[]>
> {
  const { data, error } = await supabase
    .from('listings')
    .select('id, name, category_id, amount, logo_url')
    .order('amount', { ascending: false })

  if (error) {
    throw error
  }

  const byCategory = new Map<CategoryId, CategoryTopListing[]>()

  for (const row of (data ?? []) as ListingTopRow[]) {
    const categoryId = row.category_id as CategoryId
    const listings = byCategory.get(categoryId) ?? []
    listings.push({
      id: row.id,
      name: row.name,
      // Number() coerces in case PostgREST serialized a numeric
      // column as a string — a raw string would break the amount
      // formatting.
      amount: Number(row.amount),
      logoUrl: row.logo_url ?? undefined,
    })
    byCategory.set(categoryId, listings)
  }

  return byCategory
}

type RecentBidRow = {
  listing_id: string
  amount: number
}

type TrendingCategoryEntry = {
  category: (typeof CATEGORIES)[number]
  count: number

  topListings: CategoryTopListing[]
}

/**
 * Real "Trending Categories": the three categories with the most
 * bid activity in the last 7 days — ONE bids query joined against
 * the already-fetched per-category listings in JS (no per-category
 * requests). Ranked by number of recent bids, tie-broken by recent
 * bid volume; any remaining ties keep the canonical category order
 * (Array#sort is stable). Listing counts and the "holding the top
 * spot" leader come from the listings data — the current #1 is the
 * highest accumulated listings.amount, never a single recent bid.
 * Returns [] when no category has bids in the window (the section
 * hides itself via its existing conditional). Throws on error.
 */
async function fetchTrendingCategories(
  categoryListings: Map<CategoryId, CategoryTopListing[]>,
): Promise<TrendingCategoryEntry[]> {
  // Reverse index: a bid's listing_id -> that listing's category.
  const categoryByListingId = new Map<string, CategoryId>()

  categoryListings.forEach((listings, categoryId) => {
    for (const listing of listings) {
      categoryByListingId.set(listing.id, categoryId)
    }
  })

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const { data, error } = await supabase
    .from('bids')
    .select('listing_id, amount')
    .gte('created_at', sevenDaysAgo.toISOString())

  if (error) {
    throw error
  }

  // Recent bid activity per category.
  const activity = new Map<
    CategoryId,
    { bidCount: number; bidVolume: number }
  >()

  for (const bid of (data ?? []) as RecentBidRow[]) {
    const categoryId = categoryByListingId.get(bid.listing_id)
    // Skips bids for listings that no longer exist (or whose
    // category slug is unknown to the site).
    if (!categoryId) continue

    const current = activity.get(categoryId) ?? {
      bidCount: 0,
      bidVolume: 0,
    }
    current.bidCount += 1
    // Number() coerces in case PostgREST serialized a numeric
    // column as a string — a raw string would concatenate.
    current.bidVolume += Number(bid.amount)
    activity.set(categoryId, current)
  }

  if (activity.size === 0) {
    return []
  }

  const candidates: {
    category: (typeof CATEGORIES)[number]
    bidCount: number
    bidVolume: number
  }[] = []

  for (const category of CATEGORIES) {
    const stats = activity.get(category.id)
    if (!stats) continue
    candidates.push({
      category,
      bidCount: stats.bidCount,
      bidVolume: stats.bidVolume,
    })
  }

  return candidates
    .sort((a, b) => {
      const countDiff = b.bidCount - a.bidCount
      if (countDiff !== 0) return countDiff
      return b.bidVolume - a.bidVolume
    })
    .slice(0, 3)
    .map(({ category }) => {
      const listings = categoryListings.get(category.id) ?? []

      return {
        category,
        count: listings.length,
        // Arrays are amount DESC — [0] is the current #1 by
        // accumulated listings.amount.

        topListings: listings.slice(0, 3),
      }
    })
}

export default async function CategoriesPage() {
  // Demo-based hero stats (made real in a later step).

  // Real data: one listings query feeds both the All Categories
  // mini leaderboards and the Trending section (counts + current
  // #1s); Trending adds one bids query for the last 7 days.
  let categoryListings = new Map<CategoryId, CategoryTopListing[]>()
  let didFailToListings = false

  try {
    categoryListings = await fetchCategoryListings()
  } catch (error) {
    console.error('[categories] failed to load listings', error)
    didFailToListings = true
  }

  const totalCategories = CATEGORIES.length

  const totalListings = Array.from(categoryListings.values()).reduce(
    (total, listings) => total + listings.length,
    0,
  )

  const activeCategories = Array.from(categoryListings.values()).filter(
    (listings) => listings.length > 0,
  ).length

  // Trending depends on the listings data, so it's skipped when that
  // failed. A bids-query failure just hides the Trending section —
  // supplementary content — while the rest of the page still renders.
  let trendingCategories: TrendingCategoryEntry[] = []

  if (!didFailToListings) {
    try {
      trendingCategories = await fetchTrendingCategories(categoryListings)
    } catch (error) {
      console.error('[categories] failed to load trending categories', error)
    }
  }

  return (
    <PageCanvas>
      <AppShell>
        <Header />

        <main className="px-4 py-12 sm:px-6 sm:py-14 md:px-10 lg:px-16 lg:py-16">
          {/* ── Hero ───────────────────────────────────────── */}
          <section className="mx-auto max-w-[1200px]">
            <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-[560px]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                  Click &middot; Bid &middot; Rank
                </p>
                <h1 className="mt-3 text-[34px] font-bold leading-[1.05] tracking-tight text-ink sm:text-[44px]">
                  <span className="font-serif italic font-medium text-primary">
                    Categories
                  </span>
                </h1>
                <p className="mt-3 text-[17px] leading-snug text-secondary sm:text-lg">
                  Explore where attention is being won.
                </p>
                <p className="mt-3 max-w-[480px] text-sm leading-relaxed text-secondary">
                  Every category is its own leaderboard. Listings bid for rank,
                  clicks measure attention, and the top spot goes to whoever
                  bids the most to stay there.
                </p>
              </div>

              <dl className="grid grid-cols-3 gap-4 rounded-[20px] border border-border bg-surface px-5 py-4 shadow-[0_10px_28px_-16px_rgba(20,16,43,0.12)] sm:gap-6 sm:px-6">
                <div className="min-w-[64px]">
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
                    Categories
                  </dt>
                  <dd className="mt-1 text-xl font-bold tabular-nums text-ink">
                    {totalCategories}
                  </dd>
                </div>
                <div className="min-w-[64px] border-l border-border pl-4 sm:pl-6">
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
                    Active
                  </dt>
                  <dd className="mt-1 text-xl font-bold tabular-nums text-ink">
                    {activeCategories}
                  </dd>
                </div>
                <div className="min-w-[64px] border-l border-border pl-4 sm:pl-6">
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
                    Listings
                  </dt>
                  <dd className="mt-1 text-xl font-bold tabular-nums text-ink">
                    {totalListings}
                  </dd>
                </div>
              </dl>
            </div>
          </section>

          {/* ── Trending categories ────────────────────────── */}
          {trendingCategories.length > 0 && (
            <section className="mx-auto mt-14 max-w-[1200px] sm:mt-16">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                Most active right now
              </p>
              <h2 className="mt-2 text-xl font-bold leading-tight text-ink sm:text-2xl">
                Trending Categories
              </h2>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
                {trendingCategories.map((entry, index) => (
                  <TrendingCategoryCard
                    key={entry.category.id}
                    rank={index + 1}
                    categoryId={entry.category.id}
                    label={entry.category.label}
                    count={entry.count}
                    topListings={entry.topListings}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ── All categories ─────────────────────────────── */}
          <section className="mx-auto mt-16 max-w-[1200px] sm:mt-20">
            <h2 className="text-lg font-bold leading-tight text-ink sm:text-xl">
              All categories
            </h2>
            <p className="mt-1.5 text-sm text-secondary">
              Browse every arena and claim your rank.
            </p>

            {didFailToListings ? (
              <div className="mt-6 rounded-[20px] border border-border bg-surface px-6 py-10 text-center">
                <p className="text-sm text-secondary">
                  Couldn&apos;t load the categories right now. Please refresh
                  the page.
                </p>
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
                {CATEGORIES.map((category) => {
                  const listings = categoryListings.get(category.id) ?? []

                  return (
                    <AllCategoryCard
                      key={category.id}
                      categoryId={category.id}
                      label={category.label}
                      count={listings.length}
                      topListings={listings.slice(0, 3)}
                    />
                  )
                })}
              </div>
            )}
          </section>
        </main>
      </AppShell>
    </PageCanvas>
  )
}

function TrendingCategoryCard({
  rank,
  categoryId,
  label,
  count,
  topListings,
}: {
  rank: number
  categoryId: CategoryId
  label: string
  count: number
  topListings: CategoryTopListing[]
}) {
  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-[20px] border-[1.5px] border-primary/35 bg-surface p-5 transition-all duration-200 ease-out hover:-translate-y-1 hover:border-primary hover:shadow-[0_16px_36px_-16px_rgba(75,42,173,0.28)] sm:p-6">
      <span className="absolute right-5 top-5 flex h-7 w-7 items-center justify-center rounded-full bg-gold text-[11px] font-bold tabular-nums text-on-primary sm:right-6 sm:top-6">
        {rank}
      </span>

      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-inset text-primary transition-colors duration-200 group-hover:bg-primary group-hover:text-on-primary">
          <CategoryIcon id={categoryId} className="h-5 w-5" />
        </div>
        <div className="min-w-0 pr-8">
          <p className="truncate text-[15px] font-semibold leading-tight text-ink">
            {label}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {count} {count === 1 ? 'listing' : 'listings'}
          </p>
        </div>
      </div>

      <div className="mt-4 flex-1">
        {count === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-3.5 py-3">
            <p className="text-[12px] font-medium text-secondary">
              No bids yet
            </p>
          </div>
        ) : (
          <div className="rounded-xl bg-inset">
            <ul className="divide-y divide-border">
              {topListings.map((listing, index) => (
                <li
                  key={listing.id}
                  className="flex items-center gap-2 px-3 py-1.5"
                >
                  <span className="w-5 shrink-0 text-[10px] font-bold tabular-nums text-muted">
                    #{index + 1}
                  </span>

                  <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-surface text-[9px] font-bold text-primary">
                    {listing.logoUrl ? (
                      <img
                        src={listing.logoUrl}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      listing.name.charAt(0).toUpperCase()
                    )}
                  </span>

                  <span className="min-w-0 flex-1 truncate text-xs font-medium text-ink">
                    {listing.name}
                  </span>

                  <span className="shrink-0 text-[11px] font-semibold tabular-nums text-primary">
                    ${listing.amount.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <button
        type="button"
        className="mt-4 flex items-center gap-1 border-t border-border pt-3.5 text-xs font-medium text-primary transition-colors duration-150 hover:text-primary-hover"
      >
        View category
        <span
          aria-hidden="true"
          className="inline-block transition-transform duration-150 group-hover:translate-x-0.5"
        >
          →
        </span>
      </button>
    </div>
  )
}

function AllCategoryCard({
  categoryId,
  label,
  count,
  topListings,
}: {
  categoryId: CategoryId
  label: string
  count: number
  topListings: CategoryTopListing[]
}) {
  return (
    <div className="group flex h-full flex-col rounded-[20px] border-[1.5px] border-primary/35 bg-surface p-5 transition-all duration-200 ease-out hover:-translate-y-1 hover:border-primary hover:shadow-[0_16px_36px_-16px_rgba(75,42,173,0.28)]">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-inset text-primary transition-colors duration-200 group-hover:bg-primary group-hover:text-on-primary">
          <CategoryIcon id={categoryId} className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold leading-tight text-ink">
            {label}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {count} {count === 1 ? 'listing' : 'listings'}
          </p>
        </div>
      </div>

      <div className="mt-4 flex-1">
        {count === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-3 py-2.5">
            <p className="text-[12px] font-medium text-secondary">
              No listings yet
            </p>
            <p className="mt-0.5 text-[11px] text-muted">
              Be the first to claim a rank →
            </p>
          </div>
        ) : (
          <div className="rounded-xl bg-inset">
            <ul className="divide-y divide-border">
              {topListings.map((listing, index) => (
                <li
                  key={listing.id}
                  className="flex items-center gap-2 px-3 py-1.5"
                >
                  <span className="w-5 shrink-0 text-[10px] font-bold tabular-nums text-muted">
                    #{index + 1}
                  </span>
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-surface text-[9px] font-bold text-primary">
                    {listing.logoUrl ? (
                      <img
                        src={listing.logoUrl}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      listing.name.charAt(0).toUpperCase()
                    )}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-xs font-medium text-ink">
                    {listing.name}
                  </span>
                  <span className="shrink-0 text-[11px] font-semibold tabular-nums text-primary">
                    ${listing.amount.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3.5">
        <span className="text-xs text-muted">
          {count} {count === 1 ? 'listing' : 'listings'}
        </span>
        <button
          type="button"
          className="flex items-center gap-1 text-xs font-medium text-primary transition-colors duration-150 hover:text-primary-hover"
        >
          View category
          <span
            aria-hidden="true"
            className="inline-block transition-transform duration-150 group-hover:translate-x-0.5"
          >
            →
          </span>
        </button>
      </div>
    </div>
  )
}
