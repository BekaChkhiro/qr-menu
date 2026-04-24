"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

// ── Section H Sortable Table Header (T10.4) ─────────────────────────────────
//
// Uppercase column header with asc/desc/unsorted chevron stack. Clicking
// cycles: unsorted → asc → desc → unsorted. Controlled via `direction` +
// `onSortChange` for server-side sorting; uncontrolled defaults also work.
//
// Design reference: `component-library-a.jsx` lines 735-747.

export type SortDirection = "asc" | "desc" | null

export interface SortHeaderProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  /** Column label (rendered uppercase). */
  label: React.ReactNode
  /** Current sort direction. `null` / undefined = unsorted. */
  direction?: SortDirection
  /** Called with the next direction when user clicks. */
  onSortChange?: (next: SortDirection) => void
}

function nextDirection(current: SortDirection): SortDirection {
  if (current === null || current === undefined) return "asc"
  if (current === "asc") return "desc"
  return null
}

/** Up/down triangle stack — active arrow is dark-text, inactive is border-grey. */
function SortArrows({ direction }: { direction: SortDirection }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex flex-col items-center gap-[1px]"
    >
      {/* Up triangle (asc) */}
      <span
        className="block"
        style={{
          width: 0,
          height: 0,
          borderLeft: "3px solid transparent",
          borderRight: "3px solid transparent",
          borderBottom: `4px solid ${
            direction === "asc"
              ? "hsl(var(--text))"
              : "hsl(var(--border))"
          }`,
        }}
      />
      {/* Down triangle (desc) */}
      <span
        className="block"
        style={{
          width: 0,
          height: 0,
          borderLeft: "3px solid transparent",
          borderRight: "3px solid transparent",
          borderTop: `4px solid ${
            direction === "desc"
              ? "hsl(var(--text))"
              : "hsl(var(--border))"
          }`,
        }}
      />
    </span>
  )
}

const SortHeader = React.forwardRef<HTMLButtonElement, SortHeaderProps>(
  (
    {
      className,
      label,
      direction = null,
      onSortChange,
      onClick,
      ...props
    },
    ref
  ) => {
    const ariaSort =
      direction === "asc"
        ? "ascending"
        : direction === "desc"
        ? "descending"
        : "none"

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "inline-flex items-center gap-[5px]",
          "text-[11px] font-bold uppercase tracking-[0.6px]",
          "text-text-subtle hover:text-text-default transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:rounded-xs",
          direction !== null && "text-text-default",
          className
        )}
        aria-sort={ariaSort}
        onClick={(e) => {
          onSortChange?.(nextDirection(direction))
          onClick?.(e)
        }}
        {...props}
      >
        {label}
        <SortArrows direction={direction} />
      </button>
    )
  }
)
SortHeader.displayName = "SortHeader"

export { SortHeader, nextDirection as getNextSortDirection }
