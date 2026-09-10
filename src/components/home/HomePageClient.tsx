'use client'

import { useState } from 'react'
import { Hero } from '@/components/featured/Hero'
import { ClaimRank } from '@/components/featured/ClaimRank'
import { Leaderboard } from '@/components/leaderboard/Leaderboard'
import { Sidebar } from '@/components/sidebar/Sidebar'

export type TimeFilter = 'all-time' | 'today'

export function HomePageClient() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all-time')
  const [todayTotals, setTodayTotals] = useState<Map<string, number>>(new Map())

  return (
    <>
      <Hero timeFilter={timeFilter} todayTotals={todayTotals} />
      <ClaimRank />

      <section className="px-4 pb-16 sm:px-6 md:px-10 lg:px-16 lg:pb-24">
        <div className="mx-auto grid max-w-[1200px] gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-12">
          <Leaderboard
            timeFilter={timeFilter}
            onTimeFilterChange={setTimeFilter}
            todayTotals={todayTotals}
            onTodayTotalsChange={setTodayTotals}
          />

          <Sidebar />
        </div>
      </section>
    </>
  )
}
