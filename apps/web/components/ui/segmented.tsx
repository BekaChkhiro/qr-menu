"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

// ── Section H Segmented spec (component-library-a.jsx, lines 284-300) ────────
// Container: inline-flex, p=3, bg=chip, border 1px, radius 8
// Item:      px 12 py 5, fs 12.5, fw 550, radius 5
//   Active   — bg white, color text, shadow xs
//   Inactive — bg transparent, color text-muted
//
// Accessibility: follows the WAI-ARIA radiogroup pattern — arrow keys move
// between items, space/enter selects.

type SegmentedContextValue = {
  value: string
  setValue: (v: string) => void
  name: string
  iconOnly: boolean
}

const SegmentedContext = React.createContext<SegmentedContextValue | null>(null)

export interface SegmentedProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Controlled selected value. */
  value: string
  /** Fires when the user picks a different item. */
  onValueChange: (value: string) => void
  /** Optional aria-label for the radiogroup. */
  ariaLabel?: string
  /** When true, the child items are rendered as compact icon-only squares. */
  iconOnly?: boolean
}

const Segmented = React.forwardRef<HTMLDivElement, SegmentedProps>(
  ({ className, value, onValueChange, ariaLabel, iconOnly = false, children, ...props }, ref) => {
    const reactId = React.useId()
    const ctx = React.useMemo<SegmentedContextValue>(
      () => ({ value, setValue: onValueChange, name: reactId, iconOnly }),
      [value, onValueChange, reactId, iconOnly],
    )
    return (
      <SegmentedContext.Provider value={ctx}>
        <div
          ref={ref}
          role="radiogroup"
          aria-label={ariaLabel}
          className={cn(
            "inline-flex items-center gap-[2px] p-[3px]",
            "bg-chip border border-border rounded-[8px]",
            className,
          )}
          {...props}
        >
          {children}
        </div>
      </SegmentedContext.Provider>
    )
  },
)
Segmented.displayName = "Segmented"

export interface SegmentedItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Unique value for this segment. */
  value: string
}

const SegmentedItem = React.forwardRef<HTMLButtonElement, SegmentedItemProps>(
  ({ className, value, children, disabled, ...props }, ref) => {
    const ctx = React.useContext(SegmentedContext)
    if (!ctx) {
      throw new Error("SegmentedItem must be used within a <Segmented>")
    }
    const isActive = ctx.value === value
    const handleClick = () => {
      if (!disabled) ctx.setValue(value)
    }
    return (
      <button
        ref={ref}
        type="button"
        role="radio"
        aria-checked={isActive}
        tabIndex={isActive ? 0 : -1}
        disabled={disabled}
        onClick={handleClick}
        onKeyDown={(e) => {
          // Left/Right arrow navigation — move focus and select within the group.
          if (e.key === "ArrowRight" || e.key === "ArrowDown") {
            e.preventDefault()
            const next = (e.currentTarget.nextElementSibling as HTMLButtonElement | null)
            next?.focus()
            next?.click()
          } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            e.preventDefault()
            const prev = (e.currentTarget.previousElementSibling as HTMLButtonElement | null)
            prev?.focus()
            prev?.click()
          }
        }}
        data-active={isActive ? 'true' : 'false'}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap",
          "text-[12.5px] font-medium rounded-[5px] transition-colors duration-150",
          ctx.iconOnly ? "h-[26px] w-[26px]" : "h-[26px] px-[12px]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-chip",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          isActive
            ? "bg-card text-text-default shadow-xs"
            : "bg-transparent text-text-muted hover:text-text-default",
          className,
        )}
        {...props}
      >
        {children}
      </button>
    )
  },
)
SegmentedItem.displayName = "SegmentedItem"

export { Segmented, SegmentedItem }
