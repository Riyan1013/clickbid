'use client'

import { useState } from 'react'

const TOTAL_ITEMS = 100
const ITEMS_PER_PAGE = 10
const TOTAL_PAGES = Math.ceil(TOTAL_ITEMS / ITEMS_PER_PAGE)

type PageEntry = number | 'ellipsis'

/**
 * Pagination
 *
 * Frontend-only leaderboard pagination control. Tracks the active
 * page number purely for visual state — no real page switching, data
 * fetching, or backend logic (the underlying demo listings don't
 * change when a page is selected). Renders a Prev arrow, numbered
 * pages (with an ellipsis for the gap), a Next arrow, and a small
 * "range of total" summary line beneath it.
 */
export function Pagination() {
  const [currentPage, setCurrentPage] = useState(1)

  const rangeStart = (currentPage - 1) * ITEMS_PER_PAGE + 1
  const rangeEnd = Math.min(currentPage * ITEMS_PER_PAGE, TOTAL_ITEMS)
  const pageNumbers = getPageNumbers(currentPage, TOTAL_PAGES)

  return (
    <div className="mt-8 flex flex-col items-center gap-3">
      <nav
        className="flex flex-wrap items-center justify-center gap-1"
        aria-label="Leaderboard pagination"
      >
        <PageArrowButton
          direction="prev"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
        />

        {pageNumbers.map((page, index) =>
          page === 'ellipsis' ? (
            <span
              key={`ellipsis-${index}`}
              className="flex h-8 w-8 shrink-0 items-center justify-center text-sm text-[#9B94A8]"
            >
              …
            </span>
          ) : (
            <button
              key={page}
              type="button"
              onClick={() => setCurrentPage(page)}
              aria-current={page === currentPage ? 'page' : undefined}
              className={[
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium tabular-nums transition-colors duration-150',
                page === currentPage
                  ? 'bg-[#4B2AAD] text-white'
                  : 'text-[#5B5468] hover:bg-[#F5F1FB] hover:text-[#4B2AAD]',
              ].join(' ')}
            >
              {page}
            </button>
          ),
        )}

        <PageArrowButton
          direction="next"
          disabled={currentPage === TOTAL_PAGES}
          onClick={() =>
            setCurrentPage((page) => Math.min(TOTAL_PAGES, page + 1))
          }
        />
      </nav>

      <p className="text-xs text-[#9B94A8]">
        {rangeStart}–{rangeEnd} of {TOTAL_ITEMS}
      </p>
    </div>
  )
}

function PageArrowButton({
  direction,
  disabled,
  onClick,
}: {
  direction: 'prev' | 'next'
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === 'prev' ? 'Previous page' : 'Next page'}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#5B5468] transition-colors duration-150 hover:bg-[#F5F1FB] hover:text-[#4B2AAD] disabled:pointer-events-none disabled:opacity-30"
    >
      {direction === 'prev' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
    </button>
  )
}

function ChevronLeftIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M8.5 3L5 7L8.5 11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M5.5 3L9 7L5.5 11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * Returns the page entries to render, e.g. [1, 2, 3, 4, "ellipsis", 10].
 * Keeps the first `maxLeading` pages always visible, collapses the
 * middle into a single ellipsis, and always keeps the last page
 * visible — surfacing the current page explicitly if it falls outside
 * both of those ranges.
 */
function getPageNumbers(currentPage: number, totalPages: number): PageEntry[] {
  const maxLeading = 4

  if (totalPages <= maxLeading + 1) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const leading: PageEntry[] = Array.from(
    { length: maxLeading },
    (_, i) => i + 1,
  )

  if (currentPage <= maxLeading || currentPage === totalPages) {
    return [...leading, 'ellipsis', totalPages]
  }

  return [...leading, 'ellipsis', currentPage, 'ellipsis', totalPages]
}
