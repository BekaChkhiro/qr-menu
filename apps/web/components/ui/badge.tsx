import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// ── Section H Badge (T10.4) ──────────────────────────────────────────────────
//
// Uppercase pill/rect badge used for plan tiers (FREE/STARTER/PRO), inline
// labels (NEW, 86'd), and status notes (LOW STOCK). Shape defaults to a 4px
// rect; pass `pill` for a fully-rounded pill.
//
// Typography is fixed at 10.5px / 700 / uppercase / letter-spacing 0.4 per
// Section H spec (`component-library-a.jsx` lines 619-637).
//
// Backwards-compat: the legacy `variant` prop (default / secondary /
// destructive / outline / success / warning — all used in the admin UI) is
// preserved and visually aligned to the new tone system so existing callers
// don't need to change.

const badgeVariants = cva(
  [
    "inline-flex items-center",
    "px-[7px] py-[2px]",
    "rounded-xs",
    "text-[10.5px] font-bold uppercase tracking-[0.4px]",
    "whitespace-nowrap",
  ],
  {
    variants: {
      variant: {
        // ── Section H tones ───────────────────────────────────────────────
        neutral: "bg-chip text-text-muted",
        success: "bg-success-soft text-success",
        warning: "bg-warning-soft text-warning",
        danger: "bg-danger-soft text-danger",
        accent: "bg-accent-soft text-accent",
        solid: "bg-text-default text-white",

        // ── Legacy shadcn variant aliases (kept for backward compat) ──────
        default: "bg-text-default text-white",
        secondary: "bg-chip text-text-muted",
        destructive: "bg-danger-soft text-danger",
        outline: "bg-card text-text-default border border-border",
      },
      pill: {
        true: "rounded-pill px-[10px]",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      pill: false,
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, pill, ...props }: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant, pill }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
