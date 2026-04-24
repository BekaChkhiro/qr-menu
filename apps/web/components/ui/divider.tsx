import * as React from "react"

import { cn } from "@/lib/utils"

// ── Section H Divider spec (component-library-b.jsx lines 355-365) ─────────
// - horizontal: 1px full-width line, bg-border
// - vertical:   1px line, height set by parent (default 32px)
// - with label: two flex lines with an overline-style label between them

type DividerOrientation = "horizontal" | "vertical"

interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: DividerOrientation
  /** Optional centered label (uppercase overline style). Only valid for horizontal. */
  label?: string
}

const Divider = React.forwardRef<HTMLDivElement, DividerProps>(
  ({ className, orientation = "horizontal", label, ...props }, ref) => {
    if (orientation === "vertical") {
      return (
        <div
          ref={ref}
          role="separator"
          aria-orientation="vertical"
          className={cn("h-8 w-px shrink-0 bg-border", className)}
          {...props}
        />
      )
    }

    if (label) {
      return (
        <div
          ref={ref}
          role="separator"
          aria-orientation="horizontal"
          aria-label={label}
          className={cn("flex w-full items-center gap-3", className)}
          {...props}
        >
          <div className="h-px flex-1 bg-border" />
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.05em] text-text-subtle">
            {label}
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>
      )
    }

    return (
      <div
        ref={ref}
        role="separator"
        aria-orientation="horizontal"
        className={cn("h-px w-full shrink-0 bg-border", className)}
        {...props}
      />
    )
  }
)
Divider.displayName = "Divider"

export { Divider }
