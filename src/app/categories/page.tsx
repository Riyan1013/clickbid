import { CATEGORIES, type CategoryId } from '@/lib/categories'
import { CategoryIcon } from '@/lib/CategoryIcon'
import {
  DEMO_LISTINGS,
  type Listing,
} from '@/components/leaderboard/demoListings'
import { PageCanvas } from '@/components/layout/PageCanvas'
import { AppShell } from '@/components/layout/AppShell'
import { Header } from '@/components/layout/Header'

const FEATURED_CATEGORY_IDS: CategoryId[] = [
  'ai-agents',
  'developer-tools',
  'marketing-advertising',
]

function getTopListings(categoryId: CategoryId, limit = 3): Listing[] {
  return DEMO_LISTINGS.filter((listing) => listing.categoryId === categoryId)
    .sort((a, b) => a.rank - b.rank)
    .slice(0, limit)
}

export default function CategoriesPage() {
  return (
    <PageCanvas>
      <AppShell>
        <Header />

        <main className="px-4 py-16 sm:px-6 sm:py-20 md:px-10 lg:px-16 lg:py-24">
          {/* Page intro */}
          <div className="mx-auto flex max-w-[720px] flex-col items-center text-center">
            <h1 className="text-[32px] font-bold leading-tight tracking-tight text-[#14102B] sm:text-4xl">
              Categories
            </h1>

            <p className="mt-4 max-w-md text-base leading-relaxed text-[#5B5468] sm:text-lg">
              Explore ClickBid categories and see who&apos;s currently ranking
              in each one.
            </p>
          </div>

          {/* Most Active Categories */}
          <section className="mx-auto mt-16 max-w-[1200px] sm:mt-20 lg:mt-24">
            <h2 className="text-xl font-bold leading-tight text-[#14102B] sm:text-2xl">
              Most Active Categories
            </h2>

            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURED_CATEGORY_IDS.map((categoryId) => {
                const category = CATEGORIES.find(
                  (item) => item.id === categoryId,
                )

                if (!category) return null

                return (
                  <CategoryCard
                    key={categoryId}
                    categoryId={categoryId}
                    label={category.label}
                    listings={getTopListings(categoryId)}
                  />
                )
              })}
            </div>
          </section>

          {/* All Categories */}
          <section className="mx-auto mt-20 max-w-[1200px] sm:mt-24 lg:mt-28">
            <div>
              <h2 className="text-xl font-bold leading-tight text-[#14102B] sm:text-2xl">
                All Categories
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-[#5B5468] sm:text-base">
                Browse every category on ClickBid.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {CATEGORIES.map((category) => (
                <AllCategoryCard
                  key={category.id}
                  categoryId={category.id}
                  label={category.label}
                />
              ))}
            </div>
          </section>
        </main>
      </AppShell>
    </PageCanvas>
  )
}

function CategoryCard({
  categoryId,
  label,
  listings,
}: {
  categoryId: CategoryId
  label: string
  listings: Listing[]
}) {
  const topListing = listings[0]

  return (
    <div
      className={[
        'rounded-[20px] border bg-[#FCFBFA] px-4 py-4',
        'transition-all duration-200 ease-out',
        'border-[#E7E1DA]',
        'hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-12px_rgba(20,16,43,0.14)]',
      ].join(' ')}
    >
      {/* Category header */}
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F5F1FB] text-[#4B2AAD]">
          <CategoryIcon id={categoryId} className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold leading-tight text-[#14102B]">
            {label}
          </p>

          <div className="mt-1 flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-[#4B2AAD]"
            />
            <span className="text-[11px] font-medium text-[#5B5468]">
              Active
            </span>
          </div>
        </div>
      </div>

      {/* Activity */}
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-[#14102B]">
          {listings.length} {listings.length === 1 ? 'listing' : 'listings'}
        </p>

        <p className="text-[11px] text-[#9B94A8]">Ranking now</p>
      </div>

      {/* Leading listing */}
      {topListing ? (
        <div className="mt-3 flex min-w-0 items-center gap-2.5 rounded-xl bg-[#F5F1FB] px-3 py-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FCFBFA] text-[10px] font-bold tabular-nums text-[#4B2AAD]">
            {topListing.rank}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] text-[#9B94A8]">Leading</p>

            <p className="truncate text-[13px] font-medium leading-tight text-[#14102B]">
              {topListing.name}
            </p>
          </div>

          <p className="shrink-0 text-[13px] font-bold tabular-nums text-[#14102B]">
            ${topListing.amount.toLocaleString()}
          </p>
        </div>
      ) : (
        <div className="mt-3 rounded-xl border border-dashed border-[#E7E1DA] px-3 py-2.5">
          <p className="text-[12px] font-medium text-[#9B94A8]">
            No listings yet
          </p>

          <p className="mt-0.5 text-[11px] text-[#9B94A8]">
            Be the first to claim a rank →
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between border-t border-[#E7E1DA] pt-3">
        <span className="text-[11px] text-[#9B94A8]">
          {listings.length} {listings.length === 1 ? 'listing' : 'listings'}
        </span>

        <button
          type="button"
          className="flex items-center gap-1 text-xs font-medium text-[#4B2AAD] transition-colors duration-150 hover:text-[#3D2189]"
        >
          View category
          <span
            aria-hidden="true"
            className="transition-transform duration-150 group-hover:translate-x-0.5"
          >
            →
          </span>
        </button>
      </div>
    </div>
  )
}

function AllCategoryCard({
  categoryId,
  label,
}: {
  categoryId: CategoryId
  label: string
}) {
  const categoryListings = DEMO_LISTINGS.filter(
    (listing) => listing.categoryId === categoryId,
  ).sort((a, b) => a.rank - b.rank)
  const listingCount = categoryListings.length
  const previewListings = categoryListings.slice(0, 3)

  return (
    <div
      className={[
        'group relative flex h-full flex-col overflow-hidden rounded-[20px] border border-[#E7E1F2]',
        'bg-gradient-to-br from-[#FCFBFA] to-[#F5F1FB]',
        'p-6 shadow-[0_10px_28px_-14px_rgba(75,42,173,0.18)]',
        'transition-all duration-200 ease-out',
        'hover:-translate-y-1 hover:shadow-[0_18px_40px_-14px_rgba(75,42,173,0.26)]',
      ].join(' ')}
    >
      {/* Subtle violet corner glow — intensifies slightly on hover */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#4B2AAD] opacity-[0.06] blur-2xl transition-opacity duration-200 ease-out group-hover:opacity-[0.1]"
      />

      <div className="relative flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#F5F1FB] to-[#E7E1F2] text-[#4B2AAD]">
          <CategoryIcon id={categoryId} className="h-4 w-4" />
        </div>
        <p className="text-base font-bold tracking-tight text-[#14102B]">
          {label}
        </p>
      </div>

      {/* Compact listing preview — top 2 listings, or an understated empty state */}
      <div className="relative mt-4 flex flex-col gap-2.5">
        {previewListings.length > 0 ? (
          previewListings.map((listing) => (
            <div
              key={listing.rank}
              className="flex items-center justify-between gap-2"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className={[
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold tabular-nums',
                    listing.rank === 1
                      ? 'bg-[#D4A73A] text-white'
                      : 'bg-[#F5F1FB] text-[#5B5468]',
                  ].join(' ')}
                >
                  {listing.rank}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium leading-tight text-[#14102B]">
                    {listing.name}
                  </p>
                  <p className="truncate text-[11px] leading-tight text-[#9B94A8]">
                    {listing.domain}
                  </p>
                </div>
              </div>
              <p className="shrink-0 text-[13px] font-bold tabular-nums text-[#14102B]">
                ${listing.amount.toLocaleString()}
              </p>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-[#E7E1F2] px-3 py-3">
            <p className="text-[13px] font-medium text-[#9B94A8]">
              No listings yet
            </p>
            <p className="mt-0.5 text-[13px] text-[#9B94A8]">
              Be the first to claim a rank →
            </p>
          </div>
        )}
      </div>

      <div className="relative mt-auto flex items-center justify-between border-t border-[#E7E1F2] pt-3">
        <span className="text-xs text-[#9B94A8]">
          {listingCount} {listingCount === 1 ? 'listing' : 'listings'}
        </span>

        <button
          type="button"
          className="flex items-center gap-1 text-sm font-medium text-[#4B2AAD] transition-colors duration-150 hover:text-[#3D2189]"
        >
          View category
          <span
            aria-hidden="true"
            className="inline-block transition-transform duration-150 ease-out group-hover:translate-x-1"
          >
            →
          </span>
        </button>
      </div>
    </div>
  )
}
