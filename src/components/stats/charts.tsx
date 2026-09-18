'use client'

import { useRef, useState } from 'react'

export type ActivityBucket = {
  key: string
  axis: string
  title: string
  value: number
  count: number
  extra?: string | null
  isNow?: boolean
}

type HoverState = { index: number; x: number; width: number } | null

/**
 * Shared hover tracking for the charts: maps pointer x to a bucket
 * index (bar slots for bar/histogram charts, nearest point for the
 * line chart) and keeps the pixel position for tooltip placement.
 */
function useChartHover(bucketCount: number, mode: 'slots' | 'points') {
  const containerRef = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<HoverState>(null)

  function handleMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect || bucketCount === 0) return

    const x = event.clientX - rect.left
    const fraction = Math.min(Math.max(x / rect.width, 0), 0.9999)
    const index =
      mode === 'slots'
        ? Math.floor(fraction * bucketCount)
        : Math.round(fraction * (bucketCount - 1))

    setHover({ index, x, width: rect.width })
  }

  return {
    containerRef,
    hover,
    handleMove,
    handleLeave: () => setHover(null),
  }
}

function niceCeil(value: number) {
  if (value <= 5) return 5
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)))
  const half = magnitude / 2
  return Math.ceil(value / half) * half
}

function ChartTooltip({
  hover,
  title,
  lines,
}: {
  hover: NonNullable<HoverState>
  title: string
  lines: string[]
}) {
  const clampedX = Math.min(
    Math.max(hover.x, 72),
    Math.max(hover.width - 72, 72),
  )

  return (
    <div
      className="pointer-events-none absolute top-1 z-10 max-w-[220px] -translate-x-1/2 whitespace-nowrap rounded-lg border border-border bg-surface px-2.5 py-1.5 shadow-[0_8px_24px_-8px_rgba(20,16,43,0.2)]"
      style={{ left: clampedX }}
    >
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
        {title}
      </p>
      {lines.map((line, index) => (
        <p
          key={line}
          className={
            index === 0
              ? 'text-xs font-bold tabular-nums text-ink'
              : 'text-[11px] tabular-nums text-secondary'
          }
        >
          {line}
        </p>
      ))}
    </div>
  )
}

function Gridlines() {
  return (
    <>
      {[0, 50, 100].map((top) => (
        <div
          key={top}
          className="absolute inset-x-0 border-t border-border/60"
          style={{ top: `${top}%` }}
          aria-hidden="true"
        />
      ))}
    </>
  )
}

function YAxisLabels({
  max,
  format,
}: {
  max: number
  format: (value: number) => string
}) {
  return (
    <>
      {[1, 0.5, 0].map((fraction) => (
        <span
          key={fraction}
          className="absolute left-0 -translate-y-1/2 bg-surface pr-1 text-[10px] tabular-nums text-muted"
          style={{ top: `${(1 - fraction) * 100}%` }}
        >
          {format(max * fraction)}
        </span>
      ))}
    </>
  )
}

function axisLabelVisibility(index: number, total: number) {
  if (total <= 8) return ''
  if (index % 4 === 0) return ''
  if (index % 2 === 0) return 'hidden sm:inline'
  return 'hidden'
}

function XAxisLabels({
  buckets,
  points = false,
}: {
  buckets: ActivityBucket[]
  points?: boolean
}) {
  const n = buckets.length
  if (n === 0) return null

  const position = (i: number) =>
    points ? (n === 1 ? 50 : (i / (n - 1)) * 100) : ((i + 0.5) / n) * 100

  return (
    <div className="relative mt-1.5 h-4">
      {buckets.map((bucket, i) => (
        <span
          key={bucket.key}
          className={`absolute -translate-x-1/2 text-[10px] text-muted ${axisLabelVisibility(i, n)}`}
          style={{ left: `${position(i)}%` }}
        >
          {bucket.axis}
        </span>
      ))}
    </div>
  )
}

export function ActivityBarChart({
  buckets,
  formatY,
  tooltipLines,
  emptyMessage,
}: {
  buckets: ActivityBucket[]
  formatY: (value: number) => string
  tooltipLines: (bucket: ActivityBucket) => string[]
  emptyMessage: string
}) {
  const { containerRef, hover, handleMove, handleLeave } = useChartHover(
    buckets.length,
    'slots',
  )
  const isEmpty = buckets.length > 0 && buckets.every((b) => b.value === 0)
  const max = niceCeil(Math.max(1, ...buckets.map((b) => b.value)))
  const hoveredBucket = hover ? buckets[hover.index] : undefined

  return (
    <div>
      <div
        ref={containerRef}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        className="relative h-[200px] sm:h-[260px]"
      >
        <Gridlines />
        <YAxisLabels max={max} format={formatY} />

        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 1000 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {buckets.map((bucket, i) => {
            const step = 1000 / buckets.length
            const height =
              bucket.value === 0
                ? 0.7
                : Math.max((bucket.value / max) * 100, 1.2)

            return (
              <rect
                key={bucket.key}
                x={i * step + step * 0.2}
                y={100 - height}
                width={step * 0.6}
                height={height}
                className={`fill-primary ${
                  hover?.index === i
                    ? 'opacity-100'
                    : bucket.value === 0
                      ? 'opacity-30'
                      : 'opacity-85'
                }`}
              />
            )
          })}
        </svg>

        {hover && (
          <div
            className="pointer-events-none absolute inset-y-0 w-px bg-border"
            style={{
              left: `${((hover.index + 0.5) / buckets.length) * 100}%`,
            }}
            aria-hidden="true"
          />
        )}

        {/* Gold tick under the bucket containing "now" */}
        {buckets.map((bucket, i) =>
          bucket.isNow ? (
            <span
              key={`${bucket.key}-now`}
              className="absolute bottom-0 h-1 w-1 -translate-x-1/2 rounded-full bg-gold"
              style={{ left: `${((i + 0.5) / buckets.length) * 100}%` }}
              aria-hidden="true"
            />
          ) : null,
        )}

        {isEmpty && (
          <p className="absolute inset-0 flex items-center justify-center px-4 text-center text-xs text-muted">
            {emptyMessage}
          </p>
        )}

        {hover && hoveredBucket && (
          <ChartTooltip
            hover={hover}
            title={hoveredBucket.title}
            lines={tooltipLines(hoveredBucket)}
          />
        )}
      </div>

      <XAxisLabels buckets={buckets} />
    </div>
  )
}

export function ActivityLineChart({
  buckets,
  formatY,
  tooltipLines,
  emptyMessage,
}: {
  buckets: ActivityBucket[]
  formatY: (value: number) => string
  tooltipLines: (bucket: ActivityBucket) => string[]
  emptyMessage: string
}) {
  const { containerRef, hover, handleMove, handleLeave } = useChartHover(
    buckets.length,
    'points',
  )
  const isEmpty = buckets.length > 0 && buckets.every((b) => b.value === 0)
  const max = niceCeil(Math.max(1, ...buckets.map((b) => b.value)))

  // Single-bucket edge case: duplicate the point so a path exists.
  const points = buckets.length === 1 ? [buckets[0], buckets[0]] : buckets
  const count = points.length
  const xAt = (i: number) => (count <= 1 ? 500 : (i * 1000) / (count - 1))
  const yAt = (value: number) => 100 - (value / max) * 100
  const linePath = points
    .map(
      (b, i) =>
        `${i === 0 ? 'M' : 'L'} ${xAt(i).toFixed(2)} ${yAt(b.value).toFixed(2)}`,
    )
    .join(' ')
  const areaPath = `${linePath} L ${xAt(count - 1).toFixed(2)} 100 L ${xAt(0).toFixed(2)} 100 Z`
  const hoveredBucket = hover ? buckets[hover.index] : undefined

  return (
    <div>
      <div
        ref={containerRef}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        className="relative h-[200px] sm:h-[260px]"
      >
        <Gridlines />
        <YAxisLabels max={max} format={formatY} />

        {buckets.length > 0 && (
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 1000 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d={areaPath} className="fill-primary/10" />
            <path
              d={linePath}
              fill="none"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
              className="stroke-primary"
            />
          </svg>
        )}

        {hover && hoveredBucket && (
          <>
            <div
              className="pointer-events-none absolute inset-y-0 w-px bg-border"
              style={{
                left: `${buckets.length === 1 ? 50 : (hover.index / (buckets.length - 1)) * 100}%`,
              }}
              aria-hidden="true"
            />
            <span
              className="pointer-events-none absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary"
              style={{
                left: `${buckets.length === 1 ? 50 : (hover.index / (buckets.length - 1)) * 100}%`,
                top: `${yAt(hoveredBucket.value)}%`,
              }}
              aria-hidden="true"
            />
          </>
        )}

        {isEmpty && (
          <p className="absolute inset-0 flex items-center justify-center px-4 text-center text-xs text-muted">
            {emptyMessage}
          </p>
        )}

        {hover && hoveredBucket && (
          <ChartTooltip
            hover={hover}
            title={hoveredBucket.title}
            lines={tooltipLines(hoveredBucket)}
          />
        )}
      </div>

      <XAxisLabels buckets={buckets} points />
    </div>
  )
}

export function HistogramStrip({
  buckets,
  tooltipLines,
  emptyMessage,
}: {
  buckets: ActivityBucket[]
  tooltipLines: (bucket: ActivityBucket) => string[]
  emptyMessage: string
}) {
  const { containerRef, hover, handleMove, handleLeave } = useChartHover(
    buckets.length,
    'slots',
  )
  const isEmpty = buckets.length > 0 && buckets.every((b) => b.value === 0)
  const max = Math.max(1, ...buckets.map((b) => b.value))
  const hoveredBucket = hover ? buckets[hover.index] : undefined

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className="relative h-[90px] border-b border-border/60 sm:h-[110px]"
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1000 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {buckets.map((bucket, i) => {
          const step = 1000 / buckets.length
          const width = Math.max(step * 0.18, 2)
          const height =
            bucket.value === 0 ? 0.6 : Math.max((bucket.value / max) * 100, 1.5)

          return (
            <rect
              key={bucket.key}
              x={i * step + (step - width) / 2}
              y={100 - height}
              width={width}
              height={height}
              className={`fill-primary ${
                hover?.index === i
                  ? 'opacity-100'
                  : bucket.value === 0
                    ? 'opacity-25'
                    : 'opacity-70'
              }`}
            />
          )
        })}
      </svg>

      {isEmpty && (
        <p className="absolute inset-0 flex items-center justify-center px-4 text-center text-xs text-muted">
          {emptyMessage}
        </p>
      )}

      {hover && hoveredBucket && (
        <ChartTooltip
          hover={hover}
          title={hoveredBucket.title}
          lines={tooltipLines(hoveredBucket)}
        />
      )}
    </div>
  )
}

export function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null

  const max = Math.max(...values, 1)
  const step = 100 / (values.length - 1)
  const points = values
    .map(
      (value, i) =>
        `${(i * step).toFixed(1)},${(20 - (value / max) * 18 - 1).toFixed(1)}`,
    )
    .join(' ')

  return (
    <svg
      width="48"
      height="20"
      viewBox="0 0 100 20"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
        className="stroke-primary"
      />
    </svg>
  )
}
