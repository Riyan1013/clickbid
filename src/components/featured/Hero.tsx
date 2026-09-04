'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

/**
 * Hero
 *
 * Homepage hero: eyebrow + headline + supporting copy + CTA on the
 * left, a "Featured #1" leaderboard card on the right. Entrance
 * motion and hover elevation are done with plain Tailwind transition
 * utilities driven by a mount-state toggle — no animation library.
 */
export function Hero() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsMounted(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <section className="relative overflow-hidden px-4 py-14 sm:px-6 sm:py-16 md:px-10 lg:px-16 lg:py-20">
      <div className="mx-auto grid max-w-[1200px] items-center gap-12 lg:grid-cols-[6fr_5fr] lg:gap-10">
        {/* Left column: copy + CTA */}
        <div
          className={[
            'transition-all duration-700 ease-out',
            isMounted ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0',
          ].join(' ')}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#4B2AAD]">
            The internet&apos;s competitive leaderboard
          </p>

          <h1 className="mt-4 text-[40px] font-bold leading-[1.05] tracking-tight text-[#14102B] sm:text-5xl lg:text-[56px]">
            Claim your rank.
          </h1>

          <p className="mt-5 max-w-md text-base leading-relaxed text-[#5B5468] sm:text-lg">
            Put your product in the spotlight. Bid higher, climb the
            leaderboard, and claim your place.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link
              href="/claim"
              className="inline-flex items-center gap-2 rounded-xl bg-[#4B2AAD] px-5 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#3D2189]"
            >
              Claim your rank
              <span aria-hidden="true">→</span>
            </Link>

            <Link
              href="/how-it-works"
              className="text-sm font-medium text-[#5B5468] underline decoration-[#E7E1F2] underline-offset-4 transition-colors duration-150 hover:text-[#4B2AAD]"
            >
              See how it works
            </Link>
          </div>
        </div>

        {/* Right column: Featured #1 card */}
        <div
          className={[
            'relative transition-all duration-700 ease-out',
            isMounted ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0',
          ].join(' ')}
          style={{ transitionDelay: isMounted ? '120ms' : '0ms' }}
        >
          {/* Subtle gold ambient glow behind the card */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 translate-y-4 scale-95 rounded-[28px] bg-[#D4A73A] opacity-[0.08] blur-3xl"
          />
          {/* Subtle violet ambient glow behind the card */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 translate-y-8 scale-95 rounded-[28px] bg-[#4B2AAD] opacity-[0.06] blur-3xl"
          />

          <FeaturedCard />
        </div>
      </div>
    </section>
  )
}

function FeaturedCard() {
  return (
    <div className="mx-auto w-full max-w-[420px] rounded-[24px] border border-[#4B2AAD1F] bg-[#FCFBFA] p-6 shadow-[0_20px_48px_-16px_rgba(75,42,173,0.28)] transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_28px_60px_-16px_rgba(75,42,173,0.34)] sm:p-7">
      {/* Winner badge */}
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#D4A73A1A] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#8A6A22]">
          <CrownIcon />
          #1 Leader
        </span>
        <span className="text-xs font-medium text-[#9B94A8]">Current bid</span>
      </div>

      {/* Product identity */}
      <div className="mt-5 flex items-center gap-3">
        <ProductMark />
        <div>
          <p className="text-lg font-semibold leading-tight text-[#14102B]">
            Linear
          </p>
          <p className="text-sm text-[#9B94A8]">linear.app</p>
        </div>
      </div>

      {/* Category pill */}
      <div className="mt-4">
        <span className="inline-flex items-center rounded-full bg-[#4B2AAD14] px-3 py-1 text-xs font-medium text-[#4B2AAD]">
          Productivity
        </span>
      </div>

      {/* Amount */}
      <div className="mt-6 flex items-end justify-between border-t border-[#E7E1F2] pt-5">
        <div>
          <p className="text-[28px] font-bold tabular-nums leading-none text-[#14102B] sm:text-[32px]">
            $12,500
          </p>
          <p className="mt-1 text-xs text-[#9B94A8]">Minimum to reclaim #1</p>
        </div>

        <Link
          href="/claim"
          className="rounded-xl border border-[#14102B] px-4 py-2 text-sm font-medium text-[#14102B] transition-colors duration-150 hover:bg-[#14102B] hover:text-white"
        >
          Outbid
        </Link>
      </div>
    </div>
  )
}

function ProductMark() {
  return (
    <div
      aria-hidden="true"
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4B2AAD] to-[#14102B] text-base font-bold text-white"
    >
      L
    </div>
  )
}

function CrownIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M1.5 4.5L4 7L7 2.5L10 7L12.5 4.5L11.5 10.5H2.5L1.5 4.5Z"
        stroke="#8A6A22"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  )
}
