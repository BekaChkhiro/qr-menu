"use client"

import * as React from "react"
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"

// ── Tones ────────────────────────────────────────────────────────────────────
// info    — neutral warm chip
// success — muted green (success-soft)
// warning — amber tint (warning-soft)
// error   — muted red (danger-soft)
type BannerTone = "info" | "success" | "warning" | "error"

interface ToneStyle {
  bg: string
  border: string
  icon: string
  Icon: LucideIcon
}

const TONE_STYLES: Record<BannerTone, ToneStyle> = {
  info: {
    bg: "bg-chip",
    border: "border-border",
    icon: "text-text-default",
    Icon: Info,
  },
  success: {
    bg: "bg-success-soft",
    border: "border-success/25",
    icon: "text-success",
    Icon: CheckCircle2,
  },
  warning: {
    bg: "bg-warning-soft",
    border: "border-warning/25",
    icon: "text-warning",
    Icon: AlertTriangle,
  },
  error: {
    bg: "bg-danger-soft",
    border: "border-danger/25",
    icon: "text-danger",
    Icon: AlertCircle,
  },
}

export interface BannerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  tone?: BannerTone
  title: string
  description?: string
  /**
   * Optional CTA node (usually a `<Button variant="secondary" size="sm">`).
   * Rendered right-aligned inside the banner.
   */
  action?: React.ReactNode
  /** Render a close (X) button. */
  dismissible?: boolean
  /** Callback fired when the close button is clicked. */
  onDismiss?: () => void
}

export function Banner({
  tone = "info",
  title,
  description,
  action,
  dismissible = false,
  onDismiss,
  className,
  ...props
}: BannerProps) {
  const [dismissed, setDismissed] = React.useState(false)
  if (dismissed) return null

  const { bg, border, icon, Icon } = TONE_STYLES[tone]
  const role = tone === "error" || tone === "warning" ? "alert" : "status"

  const handleDismiss = () => {
    onDismiss?.()
    setDismissed(true)
  }

  return (
    <div
      role={role}
      data-tone={tone}
      className={cn(
        "flex items-start gap-[11px] rounded-md border px-[14px] py-3",
        bg,
        border,
        className
      )}
      {...props}
    >
      <Icon
        size={15}
        strokeWidth={1.5}
        aria-hidden="true"
        className={cn("mt-0.5 shrink-0", icon)}
      />
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-semibold text-text-default">
          {title}
        </div>
        {description && (
          <div className="mt-0.5 text-[12.5px] leading-[1.45] text-text-muted">
            {description}
          </div>
        )}
      </div>
      {action && <div className="shrink-0 self-center">{action}</div>}
      {dismissible && (
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="shrink-0 self-start rounded-xs p-0.5 text-text-muted transition-colors hover:text-text-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <X size={13} strokeWidth={1.5} aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
