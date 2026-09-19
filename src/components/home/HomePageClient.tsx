'use client'

import { useEffect, useState } from 'react'

import { Hero } from '@/components/featured/Hero'
import { ClaimRank } from '@/components/featured/ClaimRank'
import {
  Leaderboard,
  type OutbidTarget,
} from '@/components/leaderboard/Leaderboard'
import { OutbidDialog } from '@/components/leaderboard/OutbidDialog'
import { Sidebar } from '@/components/sidebar/Sidebar'
import { ClaimRankDialog } from '@/components/featured/ClaimRankDialog'
import {
  fetchLeaderboardListings,
  fetchTodayBidTotals,
  type LeaderboardListing,
} from '@/lib/listings'
import { supabase } from '@/lib/supabase'

export type TimeFilter = 'all-time' | 'today'

export function HomePageClient() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all-time')
  const [todayTotals, setTodayTotals] = useState<Map<string, number>>(new Map())
  const [outbidTarget, setOutbidTarget] = useState<OutbidTarget | null>(null)
  const [isClaimRankOpen, setIsClaimRankOpen] = useState(false)

  const [listings, setListings] = useState<LeaderboardListing[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState(0)

  useEffect(() => {
    let isMounted = true

    async function fetchSharedData() {
      const [data, totals] = await Promise.all([
        fetchLeaderboardListings(),
        fetchTodayBidTotals(),
      ])

      return { data, totals }
    }

    // Initial load and manual retries — full loading/error handling.
    async function loadSharedListings() {
      setIsLoading(true)
      setError(null)

      try {
        const { data, totals } = await fetchSharedData()

        if (isMounted) {
          setListings(data)
          setTodayTotals(totals)
        }
      } catch {
        if (isMounted) {
          setError("Couldn't load the leaderboard. Please try again.")
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    async function refreshSharedListings() {
      try {
        const { data, totals } = await fetchSharedData()

        if (isMounted) {
          setListings(data)
          setTodayTotals(totals)
        }
      } catch (error) {
        console.error('[home] background listings refresh failed', error)
      }
    }

    loadSharedListings()

    const intervalId = setInterval(refreshSharedListings, 60_000)

    return () => {
      isMounted = false
      clearInterval(intervalId)
    }
  }, [refreshToken])

  useEffect(() => {
    function handleOpenClaimRank() {
      setIsClaimRankOpen(true)
    }

    window.addEventListener('clickbid:open-claim-rank', handleOpenClaimRank)

    return () => {
      window.removeEventListener(
        'clickbid:open-claim-rank',
        handleOpenClaimRank,
      )
    }
  }, [])

  // ── Realtime clicks — Step 2 ──
  useEffect(() => {
    const channel = supabase
      .channel('leaderboard-clicks')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'clicks',
        },
        (payload) => {
          const listingId = payload.new.listing_id as string

          setListings((currentListings) =>
            currentListings.map((listing) =>
              listing.id === listingId
                ? {
                    ...listing,
                    clickCount: (listing.clickCount ?? 0) + 1,
                  }
                : listing,
            ),
          )
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Shared retry — will drive the Leaderboard's "Try again" button
  // once its own fetch is removed (Step 3).
  function retrySharedListings() {
    setRefreshToken((token) => token + 1)
  }

  function handleOutbid(target: OutbidTarget) {
    setOutbidTarget(target)
  }

  return (
    <>
      <Hero
        listings={listings}
        timeFilter={timeFilter}
        todayTotals={todayTotals}
      />

      <ClaimRank listings={listings} isLoading={isLoading} />

      <section className="px-4 pb-16 sm:px-6 md:px-10 lg:px-16 lg:pb-24">
        <div className="mx-auto grid max-w-[1200px] gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-12">
          <Leaderboard
            listings={listings}
            timeFilter={timeFilter}
            onTimeFilterChange={setTimeFilter}
            todayTotals={todayTotals}
            isLoading={isLoading}
            error={error}
            onRetry={retrySharedListings}
            onOutbid={handleOutbid}
            onClaimRank={() => setIsClaimRankOpen(true)}
          />

          <Sidebar listings={listings} />
        </div>
      </section>

      <OutbidDialog
        target={outbidTarget}
        timeFilter={timeFilter}
        listings={listings}
        todayTotals={todayTotals}
        isLoading={isLoading}
        onClose={() => setOutbidTarget(null)}
      />

      <ClaimRankDialog
        listings={listings}
        isLoading={isLoading}
        isOpen={isClaimRankOpen}
        onClose={() => setIsClaimRankOpen(false)}
      />
    </>
  )
}
