'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { fetchLeaderboardListings } from '@/lib/listings'
import { supabase } from '@/lib/supabase'

type TopClickedSite = {
  id: string
  name: string
  domain: string
  clicks: number
  logoUrl?: string
}

const HOW_IT_WORKS_STEPS = [
  {
    number: '01',
    title: 'Choose your website',
    description: 'Submit the product or domain you want on the board.',
  },
  {
    number: '02',
    title: 'Place your bid',
    description: "Set the amount you're willing to bid for visibility.",
  },
  {
    number: '03',
    title: 'Get your rank',
    description: 'Your position is set automatically based on your bid.',
  },
]

/**
 * Sidebar
 *
 * Right-hand supporting column: "How ClickBid Works", "Top Clicked",
 * and "Why ClickBid?" cards. Top Clicked loads live click data from
 * Supabase on mount; the rest is presentational. Designed to sit as
 * the second column of the Leaderboard/Sidebar grid defined in
 * page.tsx, and to stack full-width below the leaderboard on smaller
 * screens (the stacking itself is handled by that parent grid).
 */
export function Sidebar() {
  return (
    <aside className="flex flex-col gap-6 lg:sticky lg:top-24">
      <HowItWorksCard />
      <StatisticsCard />
      <TopClickedCard />
      <WhyClickBidCard />
    </aside>
  )
}

function SidebarCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-[20px] border border-border bg-surface p-5 shadow-[0_4px_16px_-8px_rgba(20,16,43,0.08)] sm:p-6">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-secondary">
        {title}
      </h3>
      <div className="mt-4">{children}</div>
    </div>
  )
}

function HowItWorksCard() {
  return (
    <SidebarCard title="How ClickBid Works">
      <ol className="flex flex-col gap-4">
        {HOW_IT_WORKS_STEPS.map((step) => (
          <li key={step.number} className="flex items-start gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/8 text-xs font-bold tabular-nums text-primary">
              {step.number}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-tight text-ink">
                {step.title}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-secondary">
                {step.description}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </SidebarCard>
  )
}

type SidebarStats = {
  totalListings: number
  totalBidValue: number
  totalClicks: number
  activeCategories: number
}

/**
 * StatisticsCard
 *
 * Compact live analytics snapshot: marketplace totals derived from
 * the real listings data (one fetchLeaderboardListings call) plus the
 * current online-visitor count. Refreshed every 60s so the numbers
 * stay current without refetching on every event. Each value shows
 * "—" while loading or after a failed fetch — never demo numbers.
 */
function StatisticsCard() {
  const [stats, setStats] = useState<SidebarStats | null>(null)
  const [onlineNow, setOnlineNow] = useState<number | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadStats() {
      try {
        const listings = await fetchLeaderboardListings()

        if (isMounted) {
          setStats({
            totalListings: listings.length,
            totalBidValue: listings.reduce(
              (sum, listing) => sum + listing.amount,
              0,
            ),
            totalClicks: listings.reduce(
              (sum, listing) => sum + (listing.clickCount ?? 0),
              0,
            ),
            activeCategories: new Set(
              listings.map((listing) => listing.categoryId),
            ).size,
          })
        }
      } catch {
        // Fetch failed — keep "—" placeholders.
      }
    }

    // Same query + 5-minute window as the Header's online counter.
    async function loadOnlineNow() {
      const { count, error } = await supabase
        .from('online_visitors')
        .select('*', { count: 'exact', head: true })
        .gte('last_seen', new Date(Date.now() - 5 * 60 * 1000).toISOString())

      if (!isMounted || error) return
      setOnlineNow(count ?? 0)
    }

    loadStats()
    loadOnlineNow()

    const intervalId = setInterval(() => {
      loadStats()
      loadOnlineNow()
    }, 60_000)

    return () => {
      isMounted = false
      clearInterval(intervalId)
    }
  }, [])

  return (
    <SidebarCard title="Statistics">
      <div className="flex flex-col gap-3">
        {/* Online now — live indicator, same treatment as the Header pill */}
        <div className="flex items-center justify-between rounded-lg bg-inset px-3 py-2">
          <span className="flex items-center gap-2 text-xs font-medium text-secondary">
            <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:animate-none" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            Online now
          </span>
          <span className="text-sm font-bold leading-none tabular-nums text-ink">
            {onlineNow === null ? '—' : onlineNow.toLocaleString()}
          </span>
        </div>

        {/* Marketplace totals */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
          <StatValue label="Listings" value={stats?.totalListings} />
          <StatValue
            label="Bid value"
            value={stats?.totalBidValue}
            format="currency"
          />
          <StatValue label="Clicks" value={stats?.totalClicks} />
          <StatValue label="Active" value={stats?.activeCategories} />
        </div>

        <Link
          href="/stats"
          className="flex w-full items-center justify-center gap-1.5 rounded-full border border-border bg-surface px-5 py-2.5 text-xs font-semibold text-ink transition-colors duration-150 hover:bg-inset"
        >
          View full statistics
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </SidebarCard>
  )
}

function StatValue({
  label,
  value,
  format,
}: {
  label: string
  value?: number
  format?: 'currency'
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-bold leading-none tabular-nums text-ink">
        {value === undefined
          ? '—'
          : format === 'currency'
            ? `$${value.toLocaleString()}`
            : value.toLocaleString()}
      </p>
    </div>
  )
}

/**
 * TopClickedCard
 *
 * Shows the three most-clicked listings, loaded from Supabase on
 * mount and sorted by click count. Falls back to a short empty
 * message when the fetch fails or the board is empty, so the
 * sidebar always renders.
 */
function TopClickedCard() {
  const [sites, setSites] = useState<TopClickedSite[]>([])

  useEffect(() => {
    let isMounted = true

    async function loadTopClicked() {
      try {
        const listings = await fetchLeaderboardListings()

        if (!isMounted) {
          return
        }

        const topThree = [...listings]
          .sort((a, b) => (b.clickCount ?? 0) - (a.clickCount ?? 0))
          .slice(0, 3)
          .map((listing) => ({
            id: listing.id,
            name: listing.name,
            domain: listing.domain,
            clicks: listing.clickCount ?? 0,
            logoUrl: listing.logoUrl,
          }))

        setSites(topThree)
      } catch {
        // Fetch failed — keep the empty state.
      }
    }

    loadTopClicked()

    const channel = supabase
      .channel('sidebar-top-clicked')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'clicks',
        },
        () => {
          loadTopClicked()
        },
      )
      .subscribe()

    return () => {
      isMounted = false
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <SidebarCard title="Top Clicked">
      {sites.length > 0 ? (
        <ul className="flex flex-col gap-4">
          {sites.map((site) => (
            <li key={site.id} className="flex items-center gap-3">
              <ProductMark name={site.name} logoUrl={site.logoUrl} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold leading-tight text-ink">
                  {site.name}
                </p>
                <p className="truncate text-xs text-muted">{site.domain}</p>
              </div>
              <p className="shrink-0 text-xs font-medium tabular-nums text-secondary">
                {site.clicks.toLocaleString()} clicks
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted">No clicks tracked yet.</p>
      )}

      <Link
        href="/clicks"
        className="mt-6 flex w-full items-center justify-center rounded-full border border-border bg-surface px-5 py-3 text-sm font-semibold text-ink transition-colors duration-150 hover:bg-inset"
      >
        Show all clicks
      </Link>
    </SidebarCard>
  )
}

/**
 * ProductMark
 *
 * Same logo behavior as the leaderboard's ProductMark: renders the
 * real logo when one exists and loads, falls back to the initial
 * letter otherwise, and retries if a different URL arrives later.
 * Sizing/shape is the sidebar's own.
 */
function ProductMark({ name, logoUrl }: { name: string; logoUrl?: string }) {
  const [failedLogoUrl, setFailedLogoUrl] = useState<string | null>(null)

  const logo = logoUrl && logoUrl !== failedLogoUrl ? logoUrl : null
  const initial = name.charAt(0).toUpperCase()
  const needsDarkLogoTreatment =
    name.toLowerCase() === 'framer' || name.toLowerCase() === 'github'

  return (
    <div
      aria-hidden="true"
      className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-inset text-xs font-bold text-primary"
    >
      {logo ? (
        <img
          src={logo}
          alt=""
          onError={() => setFailedLogoUrl(logo)}
          referrerPolicy="no-referrer"
          className={[
            'h-full w-full object-contain',
            needsDarkLogoTreatment ? 'dark:brightness-0 dark:invert' : '',
          ].join(' ')}
        />
      ) : (
        initial
      )}
    </div>
  )
}

function WhyClickBidCard() {
  return (
    <div className="rounded-[20px] border border-border bg-inset p-5 sm:p-6">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-secondary">
        Why ClickBid?
      </h3>
      <div className="h-0.5 w-8 rounded-full bg-gold" aria-hidden="true" />
      <p className="mt-3 text-sm font-medium leading-relaxed text-ink">
        Bid for visibility. Get discovered. Track the clicks.
      </p>
    </div>
  )
}
