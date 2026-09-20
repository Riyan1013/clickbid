'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

import { ThemeToggle } from '@/components/ui/ThemeToggle'

const NAV_LINKS = [
  { label: 'Leaderboard', href: '/' },
  { label: 'Categories', href: '/categories' },
  { label: 'Rules', href: '/rules' },
]

/**
 * Header
 *
 * ClickBid's primary site header: brand mark, primary navigation,
 * and the Submit / Claim Rank actions. Collapses navigation into a
 * simple toggled menu below the `lg` breakpoint so the brand and the
 * primary "Claim Rank" action always stay visible and never overflow.
 */
export function Header({ visitorsToday = 0 }: { visitorsToday?: number }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const [liveVisitorsToday, setLiveVisitorsToday] = useState(visitorsToday)
  const [onlineVisitors, setOnlineVisitors] = useState(0)

  function openClaimRank() {
    window.dispatchEvent(new Event('clickbid:open-claim-rank'))
  }

  useEffect(() => {
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    supabase
      .from('visits')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfToday.toISOString())
      .then(({ count, error }) => {
        if (error) {
          console.error("[visits] failed to count today's visitors", error)
          return
        }

        setLiveVisitorsToday(count ?? 0)
      })
  }, [])

  useEffect(() => {
    const countedVisits = new Set<string>()

    function recordVisit(sessionId: string | null) {
      if (!sessionId) return
      if (countedVisits.has(sessionId)) return
      countedVisits.add(sessionId)
      setLiveVisitorsToday((count) => count + 1)
    }

    function handleVisitRecorded(event: Event) {
      const detail = (event as CustomEvent<{ sessionId?: string }>).detail
      recordVisit(detail?.sessionId ?? null)
    }

    window.addEventListener('clickbid:visit-recorded', handleVisitRecorded)

    const channel = supabase
      .channel('visits-today-count')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'visits' },
        (payload) => {
          // The Supabase client is untyped, so realtime payloads are.
          recordVisit(payload.new.session_id as string)
        },
      )
      .subscribe()

    return () => {
      window.removeEventListener('clickbid:visit-recorded', handleVisitRecorded)
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    async function fetchOnlineVisitors() {
      const { count, error } = await supabase
        .from('online_visitors')
        .select('*', { count: 'exact', head: true })
        .gte('last_seen', new Date(Date.now() - 240_000).toISOString())

      if (error) {
        console.error('[online] failed to count online visitors', error)
        return
      }

      setOnlineVisitors(count ?? 0)
    }

    fetchOnlineVisitors()

    const intervalId = setInterval(fetchOnlineVisitors, 60_000)

    return () => clearInterval(intervalId)
  }, [])

  return (
    <header className="relative flex h-[76px] w-full items-center justify-between border-b border-border bg-surface px-4 sm:px-6 md:px-10 lg:h-20">
      {/* Brand */}
      <Link
        href="/"
        onClick={() => setIsMenuOpen(false)}
        className="flex shrink-0 items-center"
      >
        <div className="relative h-12 w-[120px] shrink-0 sm:w-[160px]">
          <img
            src="/clickbid-logo.svg"
            alt="ClickBid"
            className="absolute inset-0 h-full w-full scale-115 object-contain dark:hidden"
          />
          <img
            src="/ClickBid_logo_dark2.svg"
            alt="ClickBid"
            className="absolute inset-0 hidden h-full w-full scale-190 object-contain dark:block"
          />
        </div>
      </Link>

      {/* Desktop navigation */}
      <nav className="hidden items-center gap-8 lg:flex" aria-label="Primary">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm font-medium text-secondary transition-colors duration-150 hover:text-primary"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Desktop actions */}
      <div className="hidden items-center gap-3 lg:flex">
        {/* Visitor stats pill — desktop */}
        <div className="inline-flex items-center gap-3.5 rounded-full border border-border bg-surface py-1.5 pl-3.5 pr-4 shadow-[0_1px_2px_rgba(20,16,43,0.05)]">
          {/* Online — live indicator */}
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-semibold tabular-nums leading-none text-ink">
                {onlineVisitors.toLocaleString()}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
                online
              </span>
            </div>
          </div>

          {/* Divider */}
          <span aria-hidden="true" className="h-4 w-px bg-border" />

          {/* Visitors today */}
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-semibold tabular-nums leading-none text-ink">
              {liveVisitorsToday.toLocaleString()}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
              visitors today
            </span>
          </div>

          {/* Divider */}
          <span aria-hidden="true" className="h-4 w-px bg-border" />

          {/* Statistics */}
          <Link
            href="/stats"
            className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted transition-colors duration-150 hover:text-primary"
          >
            Statistics
          </Link>
        </div>

        <ThemeToggle />

        <button
          type="button"
          onClick={openClaimRank}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition-colors duration-150 hover:bg-primary-hover"
        >
          Claim Rank
        </button>
      </div>

      {/* Mobile / tablet actions: stats pill + theme toggle + primary CTA + menu toggle */}
      <div className="flex items-center gap-2 lg:hidden">
        {/* Compact visitor stats pill — mobile/tablet */}
        <div className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-surface py-1 pl-2.5 pr-3 shadow-[0_1px_2px_rgba(20,16,43,0.05)]">
          {/* Live status dot */}
          <span
            className="relative flex h-1.5 w-1.5 shrink-0"
            aria-hidden="true"
          >
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>

          {/* Online */}
          <div className="flex items-baseline gap-1">
            <span className="text-xs font-semibold tabular-nums leading-none text-ink">
              {onlineVisitors.toLocaleString()}
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-[0.08em] text-muted">
              online
            </span>
          </div>

          {/* Divider — visible only when the Today metric is shown */}
          <span
            aria-hidden="true"
            className="hidden h-3 w-px bg-border sm:inline-block"
          />

          {/* Visitors today — same responsive reveal as before */}
          <div className="hidden items-baseline gap-1 sm:flex">
            <span className="text-xs font-semibold tabular-nums leading-none text-ink">
              {liveVisitorsToday.toLocaleString()}
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-[0.08em] text-muted">
              today
            </span>
          </div>

          {/* Divider — visible only when the Today metric is shown */}
          <span
            aria-hidden="true"
            className="hidden h-3 w-px bg-border sm:inline-block"
          />

          {/* Divider — Statistics only appears in this pill from sm upward */}
          <span
            aria-hidden="true"
            className="hidden h-3 w-px bg-border sm:inline-block"
          />

          {/* Statistics */}
          <Link
            href="/stats"
            className="hidden text-[9px] font-semibold uppercase tracking-[0.08em] text-muted transition-colors duration-150 hover:text-primary sm:inline"
          >
            Statistics
          </Link>
        </div>

        <ThemeToggle />

        <button
          type="button"
          onClick={openClaimRank}
          className="rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-on-primary transition-colors duration-150 hover:bg-primary-hover sm:px-4"
        >
          <span className="sm:hidden">Claim</span>
          <span className="hidden sm:inline">Claim Rank</span>
        </button>
        <button
          type="button"
          onClick={() => setIsMenuOpen((open) => !open)}
          aria-expanded={isMenuOpen}
          aria-label="Toggle navigation menu"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-ink transition-colors duration-150 hover:bg-inset"
        >
          <MenuIcon isOpen={isMenuOpen} />
        </button>
      </div>

      {/* Collapsed navigation panel (mobile / tablet) */}
      {isMenuOpen && (
        <div className="absolute left-0 top-full z-20 w-full border-b border-border bg-surface px-4 py-4 shadow-[0_12px_24px_-8px_rgba(20,16,43,0.12)] lg:hidden">
          <nav className="flex flex-col gap-1" aria-label="Primary">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-secondary transition-colors duration-150 hover:bg-inset hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/stats"
              onClick={() => setIsMenuOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-secondary transition-colors duration-150 hover:bg-inset hover:text-primary sm:hidden"
            >
              Statistics
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}

function MenuIcon({ isOpen }: { isOpen: boolean }) {
  if (isOpen) {
    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M4 4L14 14M14 4L4 14"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    )
  }
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2.5 5H15.5M2.5 9H15.5M2.5 13H15.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
