'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { CATEGORIES, type CategoryId } from '@/lib/categories'
import { CategoryIcon } from '@/lib/CategoryIcon'
import { formatTimeAgo } from '@/lib/listings'
import {
  ActivityBarChart,
  ActivityLineChart,
  HistogramStrip,
  Sparkline,
  type ActivityBucket,
} from './charts'

export type RangeKey = '24h' | '7d' | '30d' | 'all'

const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: '24h', label: '24H' },
  { key: '7d', label: '7D' },
  { key: '30d', label: '30D' },
  { key: 'all', label: 'All time' },
]

const RANGE_HINTS: Record<RangeKey, string> = {
  '24h': 'last 24 hours',
  '7d': 'last 7 days',
  '30d': 'last 30 days',
  all: 'all time',
}

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS
const RANGE_MS: Record<Exclude<RangeKey, 'all'>, number> = {
  '24h': 24 * HOUR_MS,
  '7d': 7 * DAY_MS,
  '30d': 30 * DAY_MS,
}

type StatsListing = {
  id: string
  name: string
  domain: string
  categoryId: CategoryId
  amount: number
  logoUrl?: string
  createdAt: string
  clickCount: number
}

type StatsListingRow = {
  id: string
  name: string
  domain: string
  category_id: string
  amount: number
  logo_url: string | null
  created_at: string
  clicks?: { count: number }[]
}

type BidRow = {
  id: string
  listing_id: string
  amount: number
  created_at: string
}
type ClickRow = { id: string; listing_id: string; created_at: string }

type RangeData = {
  bids: BidRow[]
  clicks: ClickRow[]
  rangeStartTs: number | null
  prevBidCount: number | null
  prevClickCount: number | null
  visitsInRange: number | null
  visitorsToday: number | null
  onlineNow: number | null
}

type FeedEvent = {
  id: string
  type: 'bid' | 'click' | 'listing'
  domain: string
  amount?: number
  ts: number
}

type SectionState<T> = {
  data: T | null
  error: boolean
  refreshing: boolean
}

const FEED_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'bids', label: 'Bids' },
  { key: 'clicks', label: 'Clicks' },
  { key: 'listings', label: 'Listings' },
] as const

type FeedFilter = (typeof FEED_FILTERS)[number]['key']

/** Current-state snapshot: one query feeds every standings section. */
async function fetchListingsSnapshot(): Promise<StatsListing[]> {
  const { data, error } = await supabase
    .from('listings')
    .select(
      'id, name, domain, category_id, amount, logo_url, created_at, clicks(count)',
    )
    .order('amount', { ascending: false })

  if (error) {
    throw error
  }

  return ((data ?? []) as StatsListingRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    domain: row.domain,
    categoryId: row.category_id as CategoryId,
    amount: Number(row.amount),
    logoUrl: row.logo_url ?? undefined,
    createdAt: row.created_at,
    clickCount: row.clicks?.[0]?.count ?? 0,
  }))
}

/**
 * Range-scoped data: bids/clicks rows (fetching one extra window back
 * so Overview deltas are real comparisons, never fabricated), plus
 * count-only visits/online queries.
 *
 * OPTIMIZATION PATH (later): replace the row fetches with an RPC that
 * groups by date_trunc server-side once volumes grow. The bucket
 * aggregation below is deliberately isolated so only this function
 * and the memos change.
 */
async function fetchRangeData(range: RangeKey): Promise<RangeData> {
  const now = Date.now()
  const rangeStartTs =
    range === 'all' ? null : now - RANGE_MS[range as Exclude<RangeKey, 'all'>]
  const fetchStart =
    range === 'all'
      ? null
      : now - RANGE_MS[range as Exclude<RangeKey, 'all'>] * 2

  const bidsQuery = supabase
    .from('bids')
    .select('id, listing_id, amount, created_at')
  const clicksQuery = supabase
    .from('clicks')
    .select('id, listing_id, created_at')
  const visitsQuery = supabase
    .from('visits')
    .select('*', { count: 'exact', head: true })
  const visitorsQuery = supabase
    .from('visits')
    .select('*', { count: 'exact', head: true })
  const onlineQuery = supabase
    .from('online_visitors')
    .select('*', { count: 'exact', head: true })
    .gte('last_seen', new Date(now - 4 * 60 * 1000).toISOString())

  if (fetchStart !== null) {
    const fetchStartIso = new Date(fetchStart).toISOString()
    bidsQuery.gte('created_at', fetchStartIso)
    clicksQuery.gte('created_at', fetchStartIso)
  }
  if (rangeStartTs !== null) {
    const rangeStartIso = new Date(rangeStartTs).toISOString()
    visitsQuery.gte('created_at', rangeStartIso)
  }
  const midnight = new Date()
  midnight.setHours(0, 0, 0, 0)
  visitorsQuery.gte('created_at', midnight.toISOString())

  const [bidsRes, clicksRes, visitsRes, visitorsRes, onlineRes] =
    await Promise.all([
      bidsQuery,
      clicksQuery,
      visitsQuery,
      visitorsQuery,
      onlineQuery,
    ])

  if (bidsRes.error) throw bidsRes.error
  if (clicksRes.error) throw clicksRes.error
  if (visitsRes.error) throw visitsRes.error
  if (visitorsRes.error) throw visitorsRes.error
  if (onlineRes.error) throw onlineRes.error

  const bids = (bidsRes.data ?? []) as BidRow[]
  const clicks = (clicksRes.data ?? []) as ClickRow[]

  let prevBidCount: number | null = null
  let prevClickCount: number | null = null

  if (rangeStartTs !== null) {
    const rangeStartIso = new Date(rangeStartTs).toISOString()
    prevBidCount = bids.filter((bid) => bid.created_at < rangeStartIso).length
    prevClickCount = clicks.filter(
      (click) => click.created_at < rangeStartIso,
    ).length
  }

  return {
    bids,
    clicks,
    rangeStartTs,
    prevBidCount,
    prevClickCount,
    visitsInRange: visitsRes.count ?? 0,
    visitorsToday: visitorsRes.count ?? 0,
    onlineNow: onlineRes.count ?? 0,
  }
}

type BucketSpec = {
  start: number
  end: number
  axis: string
  title: string
  isNow: boolean
}

function hourLabel(ts: number) {
  return new Date(ts).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })
}

function dayLabel(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Granularity per range: hourly (24H), daily (7D/30D), weekly for all
 * time capped at 26 buckets, monthly beyond that. Buckets are uniform,
 * so assignment is index math, not per-row scanning.
 */
function buildBucketSeries(
  range: RangeKey,
  earliestTs: number | null,
  now: number,
): BucketSpec[] {
  const mark = (specs: Omit<BucketSpec, 'isNow'>[]): BucketSpec[] =>
    specs.map((spec, i) => ({ ...spec, isNow: i === specs.length - 1 }))

  if (range === '24h') {
    const hourStart = new Date(now)
    hourStart.setMinutes(0, 0, 0)
    const start = hourStart.getTime() - 23 * HOUR_MS

    return mark(
      Array.from({ length: 24 }, (_, i) => {
        const s = start + i * HOUR_MS
        return {
          start: s,
          end: s + HOUR_MS,
          axis: hourLabel(s),
          title: `${new Date(s).toLocaleDateString(undefined, { weekday: 'short' })} ${hourLabel(s)}–${hourLabel(s + HOUR_MS)}`,
        }
      }),
    )
  }

  if (range === '7d' || range === '30d') {
    const days = range === '7d' ? 7 : 30
    const midnight = new Date(now)
    midnight.setHours(0, 0, 0, 0)
    const start = midnight.getTime() - (days - 1) * DAY_MS

    return mark(
      Array.from({ length: days }, (_, i) => {
        const s = start + i * DAY_MS
        return {
          start: s,
          end: s + DAY_MS,
          axis:
            range === '7d'
              ? new Date(s).toLocaleDateString(undefined, { weekday: 'short' })
              : new Date(s).toLocaleDateString(undefined, { day: 'numeric' }),
          title: dayLabel(s),
        }
      }),
    )
  }

  // All time — anchored to the earliest event that actually exists.
  const earliest = earliestTs ?? now - 7 * DAY_MS
  const spanMs = Math.max(now - earliest, DAY_MS)
  const weeks = Math.max(1, Math.ceil(spanMs / (7 * DAY_MS)))

  if (weeks <= 26) {
    const start = now - weeks * 7 * DAY_MS

    return mark(
      Array.from({ length: weeks }, (_, i) => {
        const s = start + i * 7 * DAY_MS
        return {
          start: s,
          end: s + 7 * DAY_MS,
          axis: new Date(s).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          }),
          title: `Week of ${dayLabel(s)}`,
        }
      }),
    )
  }

  const months = Math.min(36, Math.max(1, Math.ceil(spanMs / (30 * DAY_MS))))
  const start = now - months * 30 * DAY_MS

  return mark(
    Array.from({ length: months }, (_, i) => {
      const s = start + i * 30 * DAY_MS
      return {
        start: s,
        end: s + 30 * DAY_MS,
        axis: new Date(s).toLocaleDateString(undefined, { month: 'short' }),
        title: new Date(s).toLocaleDateString(undefined, {
          month: 'long',
          year: 'numeric',
        }),
      }
    }),
  )
}

function bucketIndexFor(specs: BucketSpec[], stepMs: number, ts: number) {
  const first = specs[0]?.start ?? 0
  return Math.min(
    specs.length - 1,
    Math.max(0, Math.floor((ts - first) / stepMs)),
  )
}

function stepMsFor(range: RangeKey, specs: BucketSpec[]) {
  if (range === '24h') return HOUR_MS
  if (range === '7d' || range === '30d') return DAY_MS
  return specs[1] ? specs[1].start - specs[0].start : DAY_MS
}

function deltaOf(
  current: number,
  previous: number | null,
): { text: string; up: boolean } | null {
  // No honest comparison exists for "all time" or a zero previous
  // period — omit rather than invent (per spec).
  if (previous === null || previous <= 0) return null

  const pct = ((current - previous) / previous) * 100
  if (!Number.isFinite(pct)) return null

  return {
    text: `${pct >= 0 ? '▲' : '▼'} ${Math.abs(pct).toFixed(1)}%`,
    up: pct >= 0,
  }
}

export function StatsDashboard({ initialRange }: { initialRange: RangeKey }) {
  const [range, setRange] = useState<RangeKey>(initialRange)
  const [refreshToken, setRefreshToken] = useState(0)
  const [listingsSection, setListingsSection] = useState<
    SectionState<StatsListing[]>
  >({
    data: null,
    error: false,
    refreshing: true,
  })
  const [rangeSection, setRangeSection] = useState<SectionState<RangeData>>({
    data: null,
    error: false,
    refreshing: true,
  })
  const [liveFeed, setLiveFeed] = useState<FeedEvent[]>([])
  const [liveCounters, setLiveCounters] = useState({
    bids: 0,
    clicks: 0,
    listings: 0,
  })
  const [feedFilter, setFeedFilter] = useState<FeedFilter>('all')
  const [categoryMode, setCategoryMode] = useState<'listings' | 'clicks'>(
    'listings',
  )
  const [bidMetric, setBidMetric] = useState<'value' | 'count'>('value')
  const [isStuck, setIsStuck] = useState(false)

  const listings = listingsSection.data
  const rangeData = rangeSection.data

  // ── Data loading ────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true

    setListingsSection((s) => ({ ...s, refreshing: true, error: false }))
    fetchListingsSnapshot()
      .then((data) => {
        if (isMounted)
          setListingsSection({ data, error: false, refreshing: false })
      })
      .catch((error) => {
        console.error('[stats] failed to load listings', error)
        if (isMounted)
          setListingsSection((s) => ({ ...s, error: true, refreshing: false }))
      })

    return () => {
      isMounted = false
    }
  }, [range, refreshToken])

  useEffect(() => {
    let isMounted = true

    setRangeSection((s) => ({ ...s, refreshing: true, error: false }))
    fetchRangeData(range)
      .then((data) => {
        if (!isMounted) return
        setRangeSection({ data, error: false, refreshing: false })
        // The refetched rows already include everything the realtime
        // layer captured — reset it so nothing is double-counted.
        setLiveFeed([])
        setLiveCounters({ bids: 0, clicks: 0, listings: 0 })
      })
      .catch((error) => {
        console.error('[stats] failed to load range data', error)
        if (isMounted)
          setRangeSection((s) => ({ ...s, error: true, refreshing: false }))
      })

    return () => {
      isMounted = false
    }
  }, [range, refreshToken])

  // Hairline under the sticky band appears only once scrolled.
  useEffect(() => {
    const onScroll = () => setIsStuck(window.scrollY > 4)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // ── Derivations ─────────────────────────────────────────────────
  const listingsById = useMemo(
    () => new Map((listings ?? []).map((l) => [l.id, l])),
    [listings],
  )

  const listingsRef = useRef(listingsById)
  useEffect(() => {
    listingsRef.current = listingsById
  }, [listingsById])

  const bidsNorm = useMemo(
    () =>
      (rangeData?.bids ?? [])
        .map((b) => ({
          ts: Date.parse(b.created_at),
          listingId: b.listing_id,
          amount: Number(b.amount),
        }))
        .filter((b) => !Number.isNaN(b.ts)),
    [rangeData],
  )
  const clicksNorm = useMemo(
    () =>
      (rangeData?.clicks ?? [])
        .map((c) => ({ ts: Date.parse(c.created_at), listingId: c.listing_id }))
        .filter((c) => !Number.isNaN(c.ts)),
    [rangeData],
  )
  const listingsCreatedNorm = useMemo(
    () =>
      (listings ?? [])
        .map((l) => ({
          ts: Date.parse(l.createdAt),
          id: l.id,
          domain: l.domain,
        }))
        .filter((l) => !Number.isNaN(l.ts)),
    [listings],
  )

  const rangeStartTs = rangeData?.rangeStartTs ?? null
  const inRangeBids = useMemo(
    () =>
      rangeStartTs === null
        ? bidsNorm
        : bidsNorm.filter((b) => b.ts >= rangeStartTs),
    [bidsNorm, rangeStartTs],
  )
  const inRangeClicks = useMemo(
    () =>
      rangeStartTs === null
        ? clicksNorm
        : clicksNorm.filter((c) => c.ts >= rangeStartTs),
    [clicksNorm, rangeStartTs],
  )
  const inRangeNewListings = useMemo(
    () =>
      rangeStartTs === null
        ? listingsCreatedNorm
        : listingsCreatedNorm.filter((l) => l.ts >= rangeStartTs),
    [listingsCreatedNorm, rangeStartTs],
  )

  const earliestTs = useMemo(() => {
    let min = Infinity
    for (const b of bidsNorm) min = Math.min(min, b.ts)
    for (const c of clicksNorm) min = Math.min(min, c.ts)
    for (const l of listingsCreatedNorm) min = Math.min(min, l.ts)
    return Number.isFinite(min) ? min : null
  }, [bidsNorm, clicksNorm, listingsCreatedNorm])

  const bucketSpecs = useMemo(
    () => buildBucketSeries(range, earliestTs, Date.now()),
    [range, earliestTs],
  )
  const bucketStepMs = useMemo(
    () => stepMsFor(range, bucketSpecs),
    [range, bucketSpecs],
  )

  const bidAgg = useMemo(() => {
    const agg = bucketSpecs.map(() => ({ sum: 0, count: 0 }))
    for (const b of inRangeBids) {
      const a = agg[bucketIndexFor(bucketSpecs, bucketStepMs, b.ts)]
      a.count += 1
      a.sum += b.amount
    }
    return agg
  }, [bucketSpecs, bucketStepMs, inRangeBids])

  const bidBuckets: ActivityBucket[] = useMemo(
    () =>
      bucketSpecs.map((spec, i) => ({
        key: `bid-${i}`,
        axis: spec.axis,
        title: spec.title,
        isNow: spec.isNow,
        value: bidMetric === 'value' ? bidAgg[i].sum : bidAgg[i].count,
        count: bidAgg[i].count,
        extra:
          bidAgg[i].count > 0
            ? `avg $${(bidAgg[i].sum / bidAgg[i].count).toLocaleString(
                undefined,
                {
                  maximumFractionDigits: 2,
                },
              )}/bid`
            : null,
      })),
    [bucketSpecs, bidAgg, bidMetric],
  )

  const clickAgg = useMemo(() => {
    const agg = bucketSpecs.map(() => ({
      count: 0,
      byListing: new Map<string, number>(),
    }))
    for (const c of inRangeClicks) {
      const a = agg[bucketIndexFor(bucketSpecs, bucketStepMs, c.ts)]
      a.count += 1
      a.byListing.set(c.listingId, (a.byListing.get(c.listingId) ?? 0) + 1)
    }
    return agg
  }, [bucketSpecs, bucketStepMs, inRangeClicks])

  const clickBuckets: ActivityBucket[] = useMemo(
    () =>
      bucketSpecs.map((spec, i) => {
        let topListingId: string | null = null
        let topCount = 0
        clickAgg[i].byListing.forEach((count, id) => {
          if (count > topCount) {
            topCount = count
            topListingId = id
          }
        })
        const top = topListingId ? listingsById.get(topListingId) : undefined

        return {
          key: `click-${i}`,
          axis: spec.axis,
          title: spec.title,
          isNow: spec.isNow,
          value: clickAgg[i].count,
          count: clickAgg[i].count,
          extra: top ? top.domain : null,
        }
      }),
    [bucketSpecs, clickAgg, listingsById],
  )

  const newListingsBuckets: ActivityBucket[] = useMemo(() => {
    const counts = bucketSpecs.map(() => 0)
    for (const l of inRangeNewListings) {
      counts[bucketIndexFor(bucketSpecs, bucketStepMs, l.ts)] += 1
    }
    return bucketSpecs.map((spec, i) => ({
      key: `new-${i}`,
      axis: spec.axis,
      title: spec.title,
      isNow: spec.isNow,
      value: counts[i],
      count: counts[i],
    }))
  }, [bucketSpecs, bucketStepMs, inRangeNewListings])

  // ── Overview metrics ───────────────────────────────────────────
  const rangeBidTotal = inRangeBids.length + liveCounters.bids
  const rangeClickTotal = inRangeClicks.length + liveCounters.clicks
  const totalListings = (listings?.length ?? 0) + liveCounters.listings
  const totalBidValue = (listings ?? []).reduce((sum, l) => sum + l.amount, 0)
  const activeCategories = new Set((listings ?? []).map((l) => l.categoryId))
    .size
  const bidsDelta = deltaOf(rangeBidTotal, rangeData?.prevBidCount ?? null)
  const clicksDelta = deltaOf(
    rangeClickTotal,
    rangeData?.prevClickCount ?? null,
  )

  // ── Bidding panel ───────────────────────────────────────────────
  const rangeBidValue = bidAgg.reduce((sum, a) => sum + a.sum, 0)
  const avgBidSize =
    inRangeBids.length > 0 ? rangeBidValue / inRangeBids.length : null
  const largestBid = useMemo(() => {
    let best: { amount: number; domain: string } | null = null
    for (const b of inRangeBids) {
      if (!best || b.amount > best.amount) {
        const listing = listingsById.get(b.listingId)
        best = { amount: b.amount, domain: listing?.domain ?? '' }
      }
    }
    return best
  }, [inRangeBids, listingsById])
  const top3Share = useMemo(() => {
    if (rangeBidValue <= 0) return null
    const perListing = new Map<string, number>()
    for (const b of inRangeBids) {
      perListing.set(b.listingId, (perListing.get(b.listingId) ?? 0) + b.amount)
    }
    const top3 = [...perListing.values()]
      .sort((a, b) => b - a)
      .slice(0, 3)
      .reduce((sum, v) => sum + v, 0)
    return (top3 / rangeBidValue) * 100
  }, [inRangeBids, rangeBidValue])

  // ── Click panel ────────────────────────────────────────────────
  const clicksPerListing =
    listings && listings.length > 0 ? rangeClickTotal / listings.length : null
  const peakBucket = useMemo(
    () =>
      clickBuckets.reduce<ActivityBucket | null>(
        (best, b) => (!best || b.value > best.value ? b : best),
        null,
      ),
    [clickBuckets],
  )
  const visitorToClickRate =
    rangeData && rangeData.visitsInRange !== null && rangeData.visitsInRange > 0
      ? (rangeClickTotal / rangeData.visitsInRange) * 100
      : null

  // ── Standings / categories / activity ──────────────────────────
  const topBids = (listings ?? []).slice(0, 10)
  const mostClicked = useMemo(
    () =>
      [...(listings ?? [])]
        .sort((a, b) => b.clickCount - a.clickCount)
        .slice(0, 10),
    [listings],
  )
  const topBidMax = Math.max(1, ...topBids.map((l) => l.amount))
  const topClickMax = Math.max(1, ...mostClicked.map((l) => l.clickCount))

  const leaderboardActivity = useMemo(
    () =>
      (listings ?? []).slice(0, 12).map((listing) => {
        let bidCount = 0
        let lastBidTs: number | null = null
        for (const b of inRangeBids) {
          if (b.listingId === listing.id) {
            bidCount += 1
            if (lastBidTs === null || b.ts > lastBidTs) lastBidTs = b.ts
          }
        }
        return { listing, bidCount, lastBidTs }
      }),
    [listings, inRangeBids],
  )

  const categoryRows = useMemo(
    () =>
      CATEGORIES.map((category) => {
        const catListings = (listings ?? []).filter(
          (l) => l.categoryId === category.id,
        )
        return {
          category,
          listingCount: catListings.length,
          clickCount: catListings.reduce((sum, l) => sum + l.clickCount, 0),
        }
      }),
    [listings],
  )
  const sortedCategoryRows = useMemo(
    () =>
      [...categoryRows].sort((a, b) =>
        categoryMode === 'listings'
          ? b.listingCount - a.listingCount
          : b.clickCount - a.clickCount,
      ),
    [categoryRows, categoryMode],
  )
  const categoryMax = Math.max(
    1,
    ...sortedCategoryRows.map((r) =>
      categoryMode === 'listings' ? r.listingCount : r.clickCount,
    ),
  )

  const derivedFeed = useMemo(() => {
    const events: FeedEvent[] = []
    inRangeBids.forEach((b, i) => {
      const listing = listingsById.get(b.listingId)
      if (listing)
        events.push({
          id: `bid-${b.ts}-${b.listingId}-${i}`,
          type: 'bid',
          domain: listing.domain,
          amount: b.amount,
          ts: b.ts,
        })
    })
    // Clicks can outnumber bids heavily — only the most recent are
    // ever visible in the feed, so cap before merging.
    ;[...inRangeClicks]
      .sort((a, b) => b.ts - a.ts)
      .slice(0, 60)
      .forEach((c, i) => {
        const listing = listingsById.get(c.listingId)
        if (listing)
          events.push({
            id: `click-${c.ts}-${c.listingId}-${i}`,
            type: 'click',
            domain: listing.domain,
            ts: c.ts,
          })
      })
    inRangeNewListings.forEach((l) => {
      events.push({
        id: `listing-${l.ts}-${l.id}`,
        type: 'listing',
        domain: l.domain,
        ts: l.ts,
      })
    })
    events.sort((a, b) => b.ts - a.ts)
    return events.slice(0, 60)
  }, [inRangeBids, inRangeClicks, inRangeNewListings, listingsById])

  const feed = useMemo(
    () =>
      [...liveFeed, ...derivedFeed].sort((a, b) => b.ts - a.ts).slice(0, 60),
    [liveFeed, derivedFeed],
  )
  const filteredFeed = feed.filter((event) =>
    feedFilter === 'all'
      ? true
      : feedFilter === 'bids'
        ? event.type === 'bid'
        : feedFilter === 'clicks'
          ? event.type === 'click'
          : event.type === 'listing',
  )

  // ── Realtime (feed + counters only — charts stay calm by design) ─
  useEffect(() => {
    function handleBidInsert(payload: {
      new: {
        listing_id?: unknown
        amount?: unknown
        created_at?: unknown
        id?: unknown
      }
    }) {
      const listing = listingsRef.current.get(
        String(payload.new.listing_id ?? ''),
      )
      const ts = Date.parse(String(payload.new.created_at ?? ''))
      if (!listing || Number.isNaN(ts)) return

      setLiveCounters((c) => ({ ...c, bids: c.bids + 1 }))
      setLiveFeed((f) =>
        [
          {
            id: `live-bid-${String(payload.new.id ?? ts)}`,
            type: 'bid' as const,
            domain: listing.domain,
            amount: Number(payload.new.amount ?? 0),
            ts,
          },
          ...f,
        ].slice(0, 60),
      )
    }

    function handleClickInsert(payload: {
      new: { listing_id?: unknown; created_at?: unknown; id?: unknown }
    }) {
      const listing = listingsRef.current.get(
        String(payload.new.listing_id ?? ''),
      )
      const ts = Date.parse(String(payload.new.created_at ?? ''))
      if (!listing || Number.isNaN(ts)) return

      setLiveCounters((c) => ({ ...c, clicks: c.clicks + 1 }))
      setLiveFeed((f) =>
        [
          {
            id: `live-click-${String(payload.new.id ?? ts)}`,
            type: 'click' as const,
            domain: listing.domain,
            ts,
          },
          ...f,
        ].slice(0, 60),
      )
    }

    function handleListingInsert(payload: {
      new: { domain?: unknown; created_at?: unknown; id?: unknown }
    }) {
      const domain = String(payload.new.domain ?? '')
      const ts = Date.parse(String(payload.new.created_at ?? ''))
      if (!domain || Number.isNaN(ts)) return

      setLiveCounters((c) => ({ ...c, listings: c.listings + 1 }))
      setLiveFeed((f) =>
        [
          {
            id: `live-listing-${String(payload.new.id ?? ts)}`,
            type: 'listing' as const,
            domain,
            ts,
          },
          ...f,
        ].slice(0, 60),
      )
    }

    const bidsChannel = supabase
      .channel('stats-bids-inserts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bids' },
        handleBidInsert,
      )
      .subscribe()
    const clicksChannel = supabase
      .channel('stats-clicks-inserts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'clicks' },
        handleClickInsert,
      )
      .subscribe()
    const listingsChannel = supabase
      .channel('stats-listings-inserts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'listings' },
        handleListingInsert,
      )
      .subscribe()

    return () => {
      supabase.removeChannel(bidsChannel)
      supabase.removeChannel(clicksChannel)
      supabase.removeChannel(listingsChannel)
    }
  }, [])

  // ── Section readiness ──────────────────────────────────────────
  const listingsInitial = listings === null && !listingsSection.error
  const listingsFailed = listingsSection.error && listings === null
  const rangeInitial = rangeData === null && !rangeSection.error
  const rangeFailed = rangeSection.error && rangeData === null
  const isRefreshing = listingsSection.refreshing || rangeSection.refreshing
  const dataDim = isRefreshing
    ? 'opacity-50 transition-opacity duration-150'
    : 'opacity-100 transition-opacity duration-150'

  function selectRange(next: RangeKey) {
    if (next === range) return
    setRange(next)
    const url = new URL(window.location.href)
    url.searchParams.set('range', next)
    window.history.replaceState(null, '', url)
  }

  const retry = () => setRefreshToken((token) => token + 1)

  const topListing = listings && listings.length > 0 ? listings[0] : null
  const cardShadow = 'shadow-[0_10px_28px_-16px_rgba(20,16,43,0.12)]'

  return (
    <main className="px-4 pb-16 sm:px-6 md:px-10 lg:px-16">
      {/* ── Sticky header band ─────────────────────────────────── */}
      <div
        className={`sticky top-0 z-30 -mx-4 bg-surface/90 px-4 backdrop-blur sm:-mx-6 sm:px-6 md:-mx-10 md:px-10 lg:-mx-16 lg:px-16 ${
          isStuck ? 'border-b border-border' : 'border-b border-transparent'
        }`}
      >
        <div className="mx-auto flex min-h-14 max-w-[1200px] flex-wrap items-center justify-between gap-x-4 gap-y-2 py-2">
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg font-bold tracking-tight text-ink">
              Statistics
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-inset px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-secondary">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#22C55E] motion-reduce:animate-none" />
              Live
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-border bg-inset p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {RANGE_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => selectRange(option.key)}
                  className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors duration-150 sm:px-3 ${
                    range === option.key
                      ? 'bg-surface text-ink shadow-[0_1px_2px_rgba(20,16,43,0.08)]'
                      : 'text-secondary hover:text-ink'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={retry}
              aria-label="Refresh data"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-secondary transition-colors duration-150 hover:text-primary"
            >
              <span
                className={
                  isRefreshing ? 'animate-spin motion-reduce:animate-none' : ''
                }
              >
                <RefreshIcon />
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] space-y-6 pt-6">
        {/* ── 1. Overview ──────────────────────────────────────── */}
        <section>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <MetricCard
              label="Total Listings"
              value={totalListings.toLocaleString()}
              loading={listingsInitial}
            />
            <MetricCard
              label="Total Bids"
              value={rangeBidTotal.toLocaleString()}
              rangeHint={RANGE_HINTS[range]}
              delta={bidsDelta}
              sparkline={<Sparkline values={bidAgg.map((a) => a.count)} />}
              loading={rangeInitial}
            />
            <MetricCard
              label="Total Bid Value"
              value={`$${totalBidValue.toLocaleString()}`}
              hero
              loading={listingsInitial}
            />
            <MetricCard
              label="Total Clicks"
              value={rangeClickTotal.toLocaleString()}
              hero
              rangeHint={RANGE_HINTS[range]}
              delta={clicksDelta}
              sparkline={<Sparkline values={clickAgg.map((a) => a.count)} />}
              loading={rangeInitial}
            />
            <MetricCard
              label="Active Categories"
              value={activeCategories.toLocaleString()}
              loading={listingsInitial}
            />
            <MetricCard
              label="Visitors Today"
              value={(rangeData?.visitorsToday ?? 0).toLocaleString()}
              loading={rangeInitial}
            />
            <MetricCard
              label="Online Now"
              value={(rangeData?.onlineNow ?? 0).toLocaleString()}
              loading={rangeInitial}
            />
          </div>
        </section>

        {/* ── Amount to #1 ─────────────────────────────────────── */}
        {topListing && (
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-[20px] border border-border bg-surface px-5 py-3">
            <p className="text-xs text-secondary sm:text-sm">
              <span className="font-bold text-gold">#1</span>{' '}
              <span className="font-semibold text-ink">{topListing.name}</span>{' '}
              is holding the top bid at{' '}
              <span className="font-bold tabular-nums text-ink">
                ${topListing.amount.toLocaleString()}
              </span>
            </p>
            <Link
              href="/claim"
              className="text-xs font-semibold text-primary transition-colors duration-150 hover:text-primary-hover sm:text-sm"
            >
              ${(topListing.amount + 1).toLocaleString()} takes the top spot →
            </Link>
          </div>
        )}

        {/* ── 2. Bidding Activity ──────────────────────────────── */}
        <section>
          <SectionHeading
            title="Bidding Activity"
            description={`When money enters the marketplace · ${RANGE_HINTS[range]}`}
            right={
              <SegmentedControl
                value={bidMetric}
                onChange={setBidMetric}
                options={[
                  { key: 'value', label: 'Bid Value $' },
                  { key: 'count', label: 'Bid Count #' },
                ]}
              />
            }
          />
          <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div
              className={`rounded-[20px] border border-border bg-surface p-4 sm:p-6 ${cardShadow}`}
            >
              {rangeInitial ? (
                <SkeletonBlock className="h-[236px] sm:h-[296px]" />
              ) : rangeFailed ? (
                <SectionError onRetry={retry} />
              ) : (
                <div className={dataDim}>
                  <ActivityBarChart
                    buckets={bidBuckets}
                    formatY={(v) =>
                      bidMetric === 'value'
                        ? v >= 1000
                          ? `$${Math.round(v / 100) / 10}k`
                          : `$${Math.round(v)}`
                        : `${Math.round(v)}`
                    }
                    tooltipLines={(b) =>
                      bidMetric === 'value'
                        ? [
                            `$${b.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                            `${b.count} ${b.count === 1 ? 'bid' : 'bids'}`,
                            ...(b.extra ? [b.extra] : []),
                          ]
                        : [`${b.count} ${b.count === 1 ? 'bid' : 'bids'}`]
                    }
                    emptyMessage="No bids in this period yet."
                  />
                </div>
              )}
            </div>

            <div className="rounded-[20px] border border-border bg-surface p-4 sm:p-6">
              {rangeInitial ? (
                <SkeletonBlock className="h-[236px] sm:h-[296px]" />
              ) : rangeFailed ? (
                <SectionError onRetry={retry} />
              ) : (
                <div className={dataDim}>
                  <StatPanel
                    rows={[
                      {
                        label: 'Average bid size',
                        value:
                          avgBidSize === null
                            ? '—'
                            : `$${avgBidSize.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
                      },
                      {
                        label: 'Largest single bid',
                        value: largestBid
                          ? `$${largestBid.amount.toLocaleString()}`
                          : '—',
                        hint: largestBid?.domain || undefined,
                      },
                      {
                        label: "Top 3 listings' share",
                        value:
                          top3Share === null ? '—' : `${top3Share.toFixed(1)}%`,
                        hint: 'of bid value in range',
                      },
                    ]}
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── 3. Click Activity ────────────────────────────────── */}
        <section>
          <SectionHeading
            title="Click Activity"
            description={`Attention over time · ${RANGE_HINTS[range]}`}
          />
          <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div
              className={`rounded-[20px] border border-border bg-surface p-4 sm:p-6 ${cardShadow}`}
            >
              {rangeInitial ? (
                <SkeletonBlock className="h-[236px] sm:h-[296px]" />
              ) : rangeFailed ? (
                <SectionError onRetry={retry} />
              ) : (
                <div className={dataDim}>
                  <ActivityLineChart
                    buckets={clickBuckets}
                    formatY={(v) => `${Math.round(v)}`}
                    tooltipLines={(b) => [
                      `${b.value.toLocaleString()} ${b.value === 1 ? 'click' : 'clicks'}`,
                      ...(b.extra ? [`Top: ${b.extra}`] : []),
                    ]}
                    emptyMessage="No clicks in this period yet."
                  />
                </div>
              )}
            </div>

            <div className="rounded-[20px] border border-border bg-surface p-4 sm:p-6">
              {rangeInitial ? (
                <SkeletonBlock className="h-[236px] sm:h-[296px]" />
              ) : rangeFailed ? (
                <SectionError onRetry={retry} />
              ) : (
                <div className={dataDim}>
                  <StatPanel
                    rows={[
                      {
                        label: 'Clicks per listing',
                        value:
                          clicksPerListing === null
                            ? '—'
                            : clicksPerListing.toLocaleString(undefined, {
                                maximumFractionDigits: 1,
                              }),
                      },
                      {
                        label: 'Peak activity',
                        value:
                          peakBucket && peakBucket.value > 0
                            ? `${peakBucket.value.toLocaleString()} clicks`
                            : '—',
                        hint:
                          peakBucket && peakBucket.value > 0
                            ? peakBucket.title
                            : undefined,
                      },
                      {
                        label: 'Visitor-to-click rate',
                        value:
                          visitorToClickRate === null
                            ? '—'
                            : `${visitorToClickRate.toFixed(1)}%`,
                        hint: 'clicks ÷ visitors in range',
                      },
                    ]}
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── 4. New Listings ──────────────────────────────────── */}
        <section>
          <SectionHeading
            title="New Listings"
            description={`Supply-side growth · ${RANGE_HINTS[range]}`}
            right={
              <span className="text-xs font-semibold text-primary">
                {inRangeNewListings.length.toLocaleString()} new{' '}
                {inRangeNewListings.length === 1 ? 'listing' : 'listings'}
              </span>
            }
          />
          <div className="rounded-[20px] border border-border bg-surface p-4 sm:p-6">
            {listingsInitial || rangeInitial ? (
              <SkeletonBlock className="h-[90px] sm:h-[110px]" />
            ) : listingsFailed || rangeFailed ? (
              <SectionError onRetry={retry} />
            ) : (
              <div className={dataDim}>
                <HistogramStrip
                  buckets={newListingsBuckets}
                  tooltipLines={(b) => [
                    `${b.value} new ${b.value === 1 ? 'listing' : 'listings'}`,
                  ]}
                  emptyMessage="No new listings in this period yet."
                />
              </div>
            )}
          </div>
        </section>

        {/* ── 5/6. Top Bids + Most Clicked ─────────────────────── */}
        <div className="grid gap-4 lg:grid-cols-2">
          <section>
            <SectionHeading
              title="Top Bids"
              description="Current standings · by accumulated bid amount"
            />
            <div
              className={`rounded-[20px] border border-border bg-surface p-4 sm:p-6 ${cardShadow}`}
            >
              {listingsInitial ? (
                <ListSkeleton />
              ) : listingsFailed ? (
                <SectionError onRetry={retry} />
              ) : topBids.length === 0 ? (
                <EmptyNote message="No listings yet." />
              ) : (
                <ol>
                  {topBids.map((listing, index) => (
                    <StandingRow
                      key={listing.id}
                      rank={index + 1}
                      listing={listing}
                      variant="bid"
                      share={(listing.amount / topBidMax) * 100}
                    />
                  ))}
                </ol>
              )}
            </div>
          </section>

          <section>
            <SectionHeading
              title="Most Clicked"
              description="Current standings · by clicks — attention never affects rank"
            />
            <div className="rounded-[20px] border border-border bg-surface p-4 sm:p-6">
              {listingsInitial ? (
                <ListSkeleton />
              ) : listingsFailed ? (
                <SectionError onRetry={retry} />
              ) : mostClicked.length === 0 ? (
                <EmptyNote message="No listings yet." />
              ) : (
                <ol>
                  {mostClicked.map((listing, index) => (
                    <StandingRow
                      key={listing.id}
                      rank={index + 1}
                      listing={listing}
                      variant="click"
                      share={(listing.clickCount / topClickMax) * 100}
                    />
                  ))}
                </ol>
              )}
            </div>
          </section>
        </div>

        {/* ── 7. Leaderboard Activity ──────────────────────────── */}
        <section>
          <SectionHeading
            title="Leaderboard Activity"
            description={`Current top listings and their bidding activity · ${RANGE_HINTS[range]}`}
            right={
              <span className="text-[10px] text-muted">
                Rank history coming soon
              </span>
            }
          />
          <div
            className={`rounded-[20px] border border-border bg-surface p-4 sm:p-6 ${cardShadow}`}
          >
            {listingsInitial || rangeInitial ? (
              <ListSkeleton rows={8} />
            ) : listingsFailed || rangeFailed ? (
              <SectionError onRetry={retry} />
            ) : leaderboardActivity.length === 0 ? (
              <EmptyNote message="No listings yet." />
            ) : (
              <div className={dataDim}>
                <div>
                  {leaderboardActivity.map((row, index) => (
                    <div
                      key={row.listing.id}
                      className="flex items-center gap-3 border-b border-border py-2.5 last:border-b-0"
                    >
                      <RankBadge rank={index + 1} podium />
                      <ProductMark
                        name={row.listing.name}
                        logoUrl={row.listing.logoUrl}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold leading-tight text-ink">
                          {row.listing.name}
                        </p>
                        <p className="truncate text-xs text-muted">
                          {row.listing.domain}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-bold tabular-nums text-ink">
                        ${row.listing.amount.toLocaleString()}
                      </p>
                      <div className="hidden w-32 shrink-0 text-right sm:block">
                        <p className="text-xs font-semibold tabular-nums text-secondary">
                          {row.bidCount} {row.bidCount === 1 ? 'bid' : 'bids'}
                        </p>
                        <p className="text-[11px] text-muted">
                          {row.lastBidTs !== null
                            ? `last ${formatTimeAgo(new Date(row.lastBidTs).toISOString())}`
                            : 'no bids in range'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── 8/9. Category Breakdown + Recent Activity ─────────── */}
        <div className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <section>
            <SectionHeading
              title="Category Breakdown"
              right={
                <SegmentedControl
                  value={categoryMode}
                  onChange={setCategoryMode}
                  options={[
                    { key: 'listings', label: 'By Listings' },
                    { key: 'clicks', label: 'By Clicks' },
                  ]}
                />
              }
            />
            <div className="rounded-[20px] border border-border bg-surface p-4 sm:p-6">
              {listingsInitial ? (
                <SkeletonBlock className="h-[420px]" />
              ) : listingsFailed ? (
                <SectionError onRetry={retry} />
              ) : (
                <div
                  className={`max-h-[420px] overflow-y-auto pr-1 ${dataDim}`}
                >
                  <div className="flex flex-col gap-2.5">
                    {sortedCategoryRows.map((row) => {
                      const value =
                        categoryMode === 'listings'
                          ? row.listingCount
                          : row.clickCount
                      const share = (value / categoryMax) * 100
                      const listingShare =
                        (row.listingCount /
                          Math.max(1, listings?.length ?? 0)) *
                        100

                      return (
                        <div
                          key={row.category.id}
                          className="flex items-center gap-2.5"
                          title={`${row.listingCount} ${row.listingCount === 1 ? 'listing' : 'listings'} · ${listingShare.toFixed(0)}% of board`}
                        >
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-inset text-primary">
                            <CategoryIcon
                              id={row.category.id}
                              className="h-4 w-4"
                            />
                          </span>
                          <span className="w-24 shrink-0 truncate text-xs font-medium text-secondary sm:w-32">
                            {row.category.label}
                          </span>
                          <div className="h-1.5 min-w-0 flex-1 rounded-full bg-inset">
                            <div
                              className="h-full rounded-full bg-primary transition-all duration-200"
                              style={{ width: `${share}%` }}
                            />
                          </div>
                          <span className="w-14 shrink-0 text-right text-xs font-bold tabular-nums text-ink">
                            {value.toLocaleString()}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </section>

          <section>
            <SectionHeading
              title="Recent Activity"
              description={`Latest events · ${RANGE_HINTS[range]}`}
            />
            <div className="rounded-[20px] border border-border bg-surface p-4 sm:p-6">
              {rangeInitial || listingsInitial ? (
                <SkeletonBlock className="h-[420px]" />
              ) : rangeFailed ? (
                <SectionError onRetry={retry} />
              ) : (
                <div className={dataDim}>
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {FEED_FILTERS.map((filter) => (
                      <button
                        key={filter.key}
                        type="button"
                        onClick={() => setFeedFilter(filter.key)}
                        className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors duration-150 ${
                          feedFilter === filter.key
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted hover:text-secondary'
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>

                  {filteredFeed.length === 0 ? (
                    <EmptyNote message="No activity in this period yet." />
                  ) : (
                    <ul className="max-h-[360px] overflow-y-auto pr-1">
                      {filteredFeed.slice(0, 8).map((event) => (
                        <li
                          key={event.id}
                          className="flex items-center gap-2.5 border-b border-border py-2 last:border-b-0"
                        >
                          <FeedEventIcon type={event.type} />
                          <p className="min-w-0 flex-1 truncate text-xs text-secondary">
                            <strong className="font-semibold text-ink">
                              {event.domain}
                            </strong>
                            {event.type === 'listing'
                              ? ' was listed'
                              : event.type === 'click'
                                ? ' received a click'
                                : ' received a '}
                            {event.type === 'bid' && (
                              <>
                                <strong className="font-semibold text-ink">
                                  ${event.amount?.toLocaleString()}
                                </strong>{' '}
                                bid
                              </>
                            )}
                          </p>
                          <span className="shrink-0 text-[10px] text-muted">
                            {formatTimeAgo(new Date(event.ts).toISOString())}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}

// ── Presentational pieces ─────────────────────────────────────────

function SectionHeading({
  title,
  description,
  right,
}: {
  title: string
  description?: string
  right?: ReactNode
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 className="text-[15px] font-bold leading-tight text-ink sm:text-base">
          {title}
        </h2>
        {description && (
          <p className="mt-0.5 text-xs text-muted">{description}</p>
        )}
      </div>
      {right}
    </div>
  )
}

function MetricCard({
  label,
  value,
  rangeHint,
  delta,
  sparkline,
  hero,
  loading,
}: {
  label: string
  value: string
  rangeHint?: string
  delta?: { text: string; up: boolean } | null
  sparkline?: ReactNode
  hero?: boolean
  loading?: boolean
}) {
  return (
    <div
      className={`relative min-h-[92px] overflow-hidden rounded-2xl border bg-surface p-4 ${
        hero ? 'border-primary/40' : 'border-border'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
          {label}
        </p>
        {rangeHint && !loading && (
          <span className="shrink-0 text-[10px] text-muted">{rangeHint}</span>
        )}
      </div>

      {loading ? (
        <div className="mt-3 h-6 w-20 animate-pulse rounded bg-inset motion-reduce:animate-none" />
      ) : (
        <>
          <p
            className={`mt-2 text-[22px] font-bold leading-none tabular-nums sm:text-2xl ${
              hero ? 'text-primary' : 'text-ink'
            }`}
          >
            {value}
          </p>
          {delta && (
            <p
              className={`mt-1.5 text-[11px] font-semibold ${
                delta.up ? 'text-[#16A34A]' : 'text-[#DC2626]'
              }`}
            >
              {delta.text}
              <span className="ml-1 font-normal text-muted">vs prev</span>
            </p>
          )}
        </>
      )}

      {sparkline && !loading && (
        <div className="absolute bottom-3 right-3 opacity-50">{sparkline}</div>
      )}
    </div>
  )
}

function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { key: T; label: string }[]
  onChange: (key: T) => void
}) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-inset p-0.5">
      {options.map((option) => (
        <button
          key={option.key}
          type="button"
          onClick={() => onChange(option.key)}
          className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors duration-150 ${
            value === option.key
              ? 'bg-surface text-ink shadow-[0_1px_2px_rgba(20,16,43,0.08)]'
              : 'text-muted hover:text-secondary'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

function StatPanel({
  rows,
}: {
  rows: { label: string; value: string; hint?: string }[]
}) {
  return (
    <dl className="grid grid-cols-3 gap-3 lg:flex lg:flex-col lg:gap-0">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex flex-col gap-0.5 border-border py-0 lg:flex-row lg:items-baseline lg:justify-between lg:gap-3 lg:border-b lg:py-2.5 lg:last:border-b-0"
        >
          <dt className="text-xs text-secondary">{row.label}</dt>
          <dd className="text-left text-sm font-bold tabular-nums text-ink lg:text-right">
            {row.value}
            {row.hint && (
              <span className="block truncate text-[10px] font-normal text-muted">
                {row.hint}
              </span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  )
}

function StandingRow({
  rank,
  listing,
  variant,
  share,
}: {
  rank: number
  listing: StatsListing
  variant: 'bid' | 'click'
  share: number
}) {
  const isGoldRow = variant === 'bid' && rank === 1

  return (
    <li
      className={`relative flex items-center gap-3 border-b border-border py-2.5 last:border-b-0 ${
        isGoldRow ? 'rounded-lg ring-1 ring-gold/40' : ''
      }`}
    >
      <RankBadge rank={rank} podium={variant === 'bid'} />
      <ProductMark name={listing.name} logoUrl={listing.logoUrl} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold leading-tight text-ink">
          {listing.name}
        </p>
        <p className="truncate text-xs text-muted">{listing.domain}</p>
      </div>
      <CategoryTag categoryId={listing.categoryId} />
      <div className="shrink-0 text-right">
        {variant === 'bid' ? (
          <p className="text-sm font-bold tabular-nums text-ink">
            ${listing.amount.toLocaleString()}
          </p>
        ) : (
          <p className="text-sm font-bold tabular-nums text-primary">
            {listing.clickCount.toLocaleString()}
            <span className="ml-1 text-[10px] font-medium text-muted">
              clicks
            </span>
          </p>
        )}
      </div>

      {/* Proportional magnitude bar vs #1 */}
      <span
        className="absolute inset-x-0 bottom-0 h-px bg-border/70"
        aria-hidden="true"
      />
      <span
        className={`absolute bottom-0 left-0 h-px ${variant === 'bid' ? 'bg-primary' : 'bg-muted'}`}
        style={{ width: `${Math.max(share, 0)}%` }}
        aria-hidden="true"
      />
    </li>
  )
}

function RankBadge({ rank, podium }: { rank: number; podium: boolean }) {
  const className = podium
    ? rank === 1
      ? 'bg-gold text-on-primary'
      : rank === 2
        ? 'bg-[#B9B4C4] text-white'
        : rank === 3
          ? 'bg-[#C08552] text-white'
          : 'bg-inset text-secondary'
    : 'bg-inset text-secondary'

  return (
    <span
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold tabular-nums ${className}`}
    >
      {rank}
    </span>
  )
}

function ProductMark({ name, logoUrl }: { name: string; logoUrl?: string }) {
  const [failedLogoUrl, setFailedLogoUrl] = useState<string | null>(null)
  const logo = logoUrl && logoUrl !== failedLogoUrl ? logoUrl : null

  return (
    <div
      aria-hidden="true"
      className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-surface text-xs font-bold text-primary"
    >
      {logo ? (
        <img
          src={logo}
          alt=""
          onError={() => setFailedLogoUrl(logo)}
          referrerPolicy="no-referrer"
          className="h-full w-full object-contain"
        />
      ) : (
        name.charAt(0).toUpperCase()
      )}
    </div>
  )
}

function CategoryTag({ categoryId }: { categoryId: CategoryId }) {
  const category = CATEGORIES.find((item) => item.id === categoryId)

  return (
    <span className="hidden shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary md:inline-flex">
      <CategoryIcon id={categoryId} className="h-3 w-3" />
      {category?.label ?? 'Other'}
    </span>
  )
}

function FeedEventIcon({ type }: { type: FeedEvent['type'] }) {
  if (type === 'click') {
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-inset text-secondary">
        <CategoryIcon id="attention-markets" className="h-3 w-3" />
      </span>
    )
  }

  if (type === 'listing') {
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gold/50 text-[10px] font-bold text-gold">
        +
      </span>
    )
  }

  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
      ${' '}
    </span>
  )
}

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-inset motion-reduce:animate-none ${className ?? 'h-40'}`}
    />
  )
}

function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="flex flex-col">
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 border-b border-border py-2.5 last:border-b-0"
        >
          <div className="h-6 w-6 animate-pulse rounded-full bg-inset motion-reduce:animate-none" />
          <div className="h-9 w-9 animate-pulse rounded-lg bg-inset motion-reduce:animate-none" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-inset motion-reduce:animate-none" />
        </div>
      ))}
    </div>
  )
}

function SectionError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <p className="text-sm text-secondary">
        Couldn&apos;t load this data right now.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium text-ink transition-colors duration-150 hover:bg-inset"
      >
        Try again
      </button>
    </div>
  )
}

function EmptyNote({ message }: { message: string }) {
  return <p className="py-8 text-center text-sm text-muted">{message}</p>
}

function RefreshIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M13.5 8a5.5 5.5 0 1 1-1.7-3.97"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M13.7 1.8v2.9h-2.9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
