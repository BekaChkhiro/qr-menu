import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// ── Section H StatusPill (T10.4) ─────────────────────────────────────────────
//
// Colored-dot + label pill used in menu tables, product rows, promotion rows,
// and the editor header. Status set matches the admin domain:
//   Published / Draft / Archived / Scheduled / Active / Ended
//
// The dot color maps to the tone; the background is the `*-soft` variant of
// that tone; text uses the solid tone value. Shape is always fully rounded.

const statusPillVariants = cva(
  [
    "inline-flex items-center gap-[6px]",
    "rounded-pill px-[10px] py-[3px]",
    "text-[11.5px] font-medium",
    "whitespace-nowrap",
  ],
  {
    variants: {
      status: {
        published: "bg-success-soft text-success",
        active: "bg-success-soft text-success",
        draft: "bg-warning-soft text-warning",
        scheduled: "bg-accent-soft text-accent",
        archived: "bg-chip text-text-muted",
        ended: "bg-chip text-text-muted",
      },
    },
    defaultVariants: {
      status: "draft",
    },
  }
)

const dotVariants = cva("inline-block size-[6px] rounded-pill", {
  variants: {
    status: {
      published: "bg-success",
      active: "bg-success",
      draft: "bg-warning",
      scheduled: "bg-accent",
      archived: "bg-text-subtle",
      ended: "bg-text-subtle",
    },
  },
  defaultVariants: {
    status: "draft",
  },
})

export type StatusPillStatus =
  | "published"
  | "active"
  | "draft"
  | "scheduled"
  | "archived"
  | "ended"

export interface StatusPillProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children">,
    VariantProps<typeof statusPillVariants> {
  /** Status key controlling color + default label */
  status: StatusPillStatus
  /** Override the default capitalised status label */
  label?: React.ReactNode
}

const DEFAULT_LABELS: Record<StatusPillStatus, string> = {
  published: "Published",
  active: "Active",
  draft: "Draft",
  scheduled: "Scheduled",
  archived: "Archived",
  ended: "Ended",
}

function StatusPill({ className, status, label, ...props }: StatusPillProps) {
  return (
    <span
      className={cn(statusPillVariants({ status }), className)}
      {...props}
    >
      <span className={dotVariants({ status })} aria-hidden="true" />
      {label ?? DEFAULT_LABELS[status]}
    </span>
  )
}

export { StatusPill, statusPillVariants }
