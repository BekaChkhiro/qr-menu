"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

// ── Section H Pagination (T10.4) ────────────────────────────────────────────
//
// Two layouts:
//   - <Pagination>        — numbered page buttons with prev/next, ellipsis
//                           for large ranges. 28×28 px squares per spec.
//   - <PaginationPrevNext> — simplified prev/next + "1–10 of 200" counter
//                           used in the menus table and analytics table.
//
// Design reference: `component-library-a.jsx` lines 710-733.

// ── Core item button used by all layouts ────────────────────────────────────

interface PageButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
  muted?: boolean
}

const PageButton = React.forwardRef<HTMLButtonElement, PageButtonProps>(
  ({ className, active, muted, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        aria-current={active ? "page" : undefined}
        className={cn(
          "inline-flex items-center justify-center",
          "min-w-[28px] h-[28px] px-2",
          "rounded-sm text-[12.5px] font-medium tabular-nums",
          "transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1",
          active &&
            "bg-text-default text-white border border-text-default",
          !active &&
            !muted &&
            "bg-card text-text-default border border-border hover:bg-chip",
          muted &&
            "bg-transparent text-text-subtle cursor-default pointer-events-none border border-transparent",
          disabled && "opacity-50 cursor-not-allowed pointer-events-none",
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)
PageButton.displayName = "PageButton"

// ── Build a compact page range with "…" for large totals ────────────────────
//
// Algorithm returns an array of page numbers and "…" string placeholders. At
// most 7 visible slots: 1, (…), current-1, current, current+1, (…), last.

export function buildPageRange(current: number, total: number): Array<number | "…"> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: Array<number | "…"> = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  if (start > 2) pages.push("…")
  for (let p = start; p <= end; p++) pages.push(p)
  if (end < total - 1) pages.push("…")

  pages.push(total)
  return pages
}

// ── Main numbered pagination ────────────────────────────────────────────────

export interface PaginationProps extends React.HTMLAttributes<HTMLElement> {
  /** Total number of pages. */
  total: number
  /** Currently selected page (1-based). */
  page: number
  /** Called when the user selects a new page. */
  onPageChange?: (page: number) => void
}

function Pagination({
  className,
  total,
  page,
  onPageChange,
  ...props
}: PaginationProps) {
  const items = buildPageRange(page, total)
  const prevDisabled = page <= 1
  const nextDisabled = page >= total

  return (
    <nav
      aria-label="Pagination"
      className={cn("inline-flex items-center gap-1", className)}
      {...props}
    >
      <PageButton
        aria-label="Previous page"
        disabled={prevDisabled}
        onClick={() => !prevDisabled && onPageChange?.(page - 1)}
        data-testid="pagination-prev"
      >
        <ChevronLeft size={14} strokeWidth={1.75} aria-hidden="true" />
      </PageButton>

      {items.map((item, i) =>
        item === "…" ? (
          <PageButton key={`ellipsis-${i}`} muted tabIndex={-1}>
            …
          </PageButton>
        ) : (
          <PageButton
            key={item}
            active={item === page}
            onClick={() => onPageChange?.(item)}
            aria-label={`Page ${item}`}
          >
            {item}
          </PageButton>
        )
      )}

      <PageButton
        aria-label="Next page"
        disabled={nextDisabled}
        onClick={() => !nextDisabled && onPageChange?.(page + 1)}
        data-testid="pagination-next"
      >
        <ChevronRight size={14} strokeWidth={1.75} aria-hidden="true" />
      </PageButton>
    </nav>
  )
}

// ── Simplified prev/next + counter ──────────────────────────────────────────

export interface PaginationPrevNextProps
  extends React.HTMLAttributes<HTMLElement> {
  /** Currently displayed page (1-based). */
  page: number
  /** Number of items per page. */
  pageSize: number
  /** Total number of items across all pages. */
  total: number
  onPageChange?: (page: number) => void
}

function PaginationPrevNext({
  className,
  page,
  pageSize,
  total,
  onPageChange,
  ...props
}: PaginationPrevNextProps) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const prevDisabled = page <= 1
  const nextDisabled = page >= totalPages

  return (
    <nav
      aria-label="Pagination"
      className={cn(
        "inline-flex items-center gap-3 text-[12.5px] text-text-muted tabular-nums",
        className
      )}
      {...props}
    >
      <span>
        {from}–{to} of {total}
      </span>
      <div className="inline-flex items-center gap-1">
        <PageButton
          aria-label="Previous page"
          disabled={prevDisabled}
          onClick={() => !prevDisabled && onPageChange?.(page - 1)}
          data-testid="pagination-prev"
        >
          <ChevronLeft size={14} strokeWidth={1.75} aria-hidden="true" />
        </PageButton>
        <PageButton
          aria-label="Next page"
          disabled={nextDisabled}
          onClick={() => !nextDisabled && onPageChange?.(page + 1)}
          data-testid="pagination-next"
        >
          <ChevronRight size={14} strokeWidth={1.75} aria-hidden="true" />
        </PageButton>
      </div>
    </nav>
  )
}

export { Pagination, PaginationPrevNext, PageButton }
