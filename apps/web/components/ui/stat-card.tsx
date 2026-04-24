import * as React from "react"
import { ArrowUp, ArrowDown, Minus, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

// ── Section H StatCard (T10.4) ──────────────────────────────────────────────
//
// Single-metric card used across the dashboard, analytics tab, and QR
// scan-stats panel. Three permutations per spec:
//   1. number-only               → label + value
//   2. number + delta + sparkline → label + value + trend + optional sparkline
//   3. number + icon              → label + value with leading icon chip
//
// Design reference: `component-library-a.jsx` lines 694-708.

export type StatCardTone = "up" | "down" | "flat"

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Small uppercase-style muted label, e.g. "Scans today". */
  label: string
  /** Primary metric value (string allows "1,284", "2:18", "Khachapuri"). */
  value: React.ReactNode
  /** Optional delta / trend string, e.g. "↑ 12% vs yesterday". */
  delta?: string
  /** Tone for the delta color + auto-picked trend icon. */
  tone?: StatCardTone
  /** Optional leading icon rendered in a soft accent chip on the right. */
  icon?: LucideIcon
  /** Optional inline sparkline data — small SVG polyline rendered under the value. */
  sparkline?: number[]
  /** Fixed min-width for visual grid alignment. */
  minWidth?: number
}

const TONE_TEXT: Record<StatCardTone, string> = {
  up: "text-success",
  down: "text-danger",
  flat: "text-text-muted",
}

const TONE_ICON: Record<StatCardTone, LucideIcon> = {
  up: ArrowUp,
  down: ArrowDown,
  flat: Minus,
}

/** Render a minimal sparkline inside a fixed 120×24 SVG. */
function Sparkline({
  data,
  tone = "flat",
}: {
  data: number[]
  tone?: StatCardTone
}) {
  const w = 120
  const h = 24
  if (data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const stepX = w / (data.length - 1)

  const points = data
    .map((v, i) => {
      const x = i * stepX
      const y = h - ((v - min) / range) * h
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(" ")

  const stroke =
    tone === "up"
      ? "hsl(var(--success))"
      : tone === "down"
      ? "hsl(var(--danger))"
      : "hsl(var(--text-muted))"

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden="true"
      className="mt-2"
    >
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
      />
    </svg>
  )
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  (
    {
      className,
      label,
      value,
      delta,
      tone = "flat",
      icon: Icon,
      sparkline,
      minWidth = 180,
      ...props
    },
    ref
  ) => {
    const TrendIcon = TONE_ICON[tone]

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-start justify-between gap-3",
          "rounded-lg bg-card border border-border",
          "p-4",
          className
        )}
        style={{ minWidth, ...props.style }}
        {...props}
      >
        <div className="flex-1 min-w-0">
          <div className="text-[11.5px] font-medium text-text-muted">
            {label}
          </div>
          <div
            className={cn(
              "mt-1 text-[24px] font-semibold text-text-default leading-none",
              "tabular-nums"
            )}
            style={{ letterSpacing: "-0.5px" }}
          >
            {value}
          </div>
          {delta && (
            <div
              className={cn(
                "mt-1 text-[11.5px] tabular-nums inline-flex items-center gap-[3px]",
                TONE_TEXT[tone]
              )}
            >
              {tone !== "flat" && (
                <TrendIcon size={11} strokeWidth={2} aria-hidden="true" />
              )}
              {delta}
            </div>
          )}
          {sparkline && sparkline.length >= 2 && (
            <Sparkline data={sparkline} tone={tone} />
          )}
        </div>

        {Icon && (
          <span
            className={cn(
              "inline-flex shrink-0 items-center justify-center",
              "size-8 rounded-md bg-accent-soft text-accent"
            )}
            aria-hidden="true"
          >
            <Icon size={16} strokeWidth={1.5} />
          </span>
        )}
      </div>
    )
  }
)
StatCard.displayName = "StatCard"

export { StatCard }
