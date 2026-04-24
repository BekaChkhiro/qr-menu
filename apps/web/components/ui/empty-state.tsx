import * as React from "react"
import { type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

// ── Empty State ──────────────────────────────────────────────────────────────
// Two sizes per Section H spec:
//   - sm : inline message for empty table bodies, search results, filtered lists
//   - lg : dashed card with icon tile + title + description + optional CTA
//
// Size defaults to `lg` because that is the canonical empty-state in the
// redesign (menus-empty, promo-list empty, analytics empty).

type EmptyStateSize = "sm" | "lg"

export interface EmptyStateProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  icon?: LucideIcon
  title: string
  description?: string
  /**
   * CTA node (usually a `<Button>`). Rendered below the description. Kept as
   * a React node so callers can pass any variant/icon combination.
   */
  action?: React.ReactNode
  size?: EmptyStateSize
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  size = "lg",
  className,
  ...props
}: EmptyStateProps) {
  if (size === "sm") {
    return (
      <div
        role="status"
        className={cn(
          "flex flex-col items-center justify-center gap-2 px-4 py-6 text-center",
          className
        )}
        {...props}
      >
        {Icon && (
          <Icon
            size={16}
            strokeWidth={1.5}
            aria-hidden="true"
            className="text-text-subtle"
          />
        )}
        <div className="text-[13px] font-medium text-text-default">{title}</div>
        {description && (
          <div className="text-[12px] leading-[1.45] text-text-muted">
            {description}
          </div>
        )}
        {action && <div className="mt-1">{action}</div>}
      </div>
    )
  }

  // Large (default) — dashed-border card
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-card px-6 py-9 text-center",
        className
      )}
      {...props}
    >
      {Icon && (
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-chip text-text-muted">
          <Icon size={20} strokeWidth={1.5} aria-hidden="true" />
        </div>
      )}
      <div className="space-y-1">
        <div className="text-[14px] font-semibold text-text-default">
          {title}
        </div>
        {description && (
          <div className="mx-auto max-w-[320px] text-[12.5px] leading-[1.5] text-text-muted">
            {description}
          </div>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}
