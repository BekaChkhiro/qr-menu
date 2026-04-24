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
import { toast as sonnerToast, type ExternalToast } from "sonner"

import { cn } from "@/lib/utils"

// ── Tones ────────────────────────────────────────────────────────────────────

type ToastTone = "success" | "info" | "warning" | "error"

interface ToneMeta {
  iconColor: string
  stripe: string
  Icon: LucideIcon
}

const TONE_META: Record<ToastTone, ToneMeta> = {
  success: {
    iconColor: "text-success",
    stripe: "bg-success",
    Icon: CheckCircle2,
  },
  info: {
    iconColor: "text-text-default",
    stripe: "bg-text-default",
    Icon: Info,
  },
  warning: {
    iconColor: "text-warning",
    stripe: "bg-warning",
    Icon: AlertTriangle,
  },
  error: {
    iconColor: "text-danger",
    stripe: "bg-danger",
    Icon: AlertCircle,
  },
}

// ── Body (rendered inside Sonner's `toast.custom` container) ─────────────────

interface ToastBodyProps {
  id: string | number
  tone: ToastTone
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
}

function ToastBody({ id, tone, title, description, action }: ToastBodyProps) {
  const { iconColor, stripe, Icon } = TONE_META[tone]
  const role = tone === "error" || tone === "warning" ? "alert" : "status"

  return (
    <div
      role={role}
      data-tone={tone}
      data-testid={`toast-${tone}`}
      className="relative flex w-[340px] gap-3 overflow-hidden rounded-md border border-border bg-card p-[14px] pl-[17px] shadow-md"
    >
      <span
        aria-hidden="true"
        className={cn("absolute inset-y-0 left-0 w-[3px]", stripe)}
      />
      <Icon
        size={15}
        strokeWidth={1.5}
        aria-hidden="true"
        className={cn("mt-0.5 shrink-0", iconColor)}
      />
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-semibold text-text-default">
          {title}
        </div>
        {description && (
          <div className="mt-0.5 text-[12px] leading-[1.45] text-text-muted">
            {description}
          </div>
        )}
        {action && (
          <button
            type="button"
            data-testid={`toast-${tone}-action`}
            onClick={() => {
              action.onClick()
              sonnerToast.dismiss(id)
            }}
            className="mt-2 inline-flex items-center rounded-sm border border-border bg-card px-2.5 py-1 text-[12px] font-medium text-text-default transition-colors hover:bg-chip focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {action.label}
          </button>
        )}
      </div>
      <button
        type="button"
        aria-label="Dismiss notification"
        data-testid={`toast-${tone}-close`}
        onClick={() => sonnerToast.dismiss(id)}
        className="shrink-0 self-start rounded-xs p-0.5 text-text-muted transition-colors hover:text-text-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <X size={13} strokeWidth={1.5} aria-hidden="true" />
      </button>
    </div>
  )
}

// ── Public API ───────────────────────────────────────────────────────────────

export interface ShowToastOptions {
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
  /** ms before auto-dismiss. Default 5000. Pass `Infinity` to require manual close. */
  duration?: number
}

function show(tone: ToastTone, opts: ShowToastOptions): string | number {
  const base: ExternalToast = {
    duration: opts.duration ?? 5000,
  }
  return sonnerToast.custom(
    (id) => (
      <ToastBody
        id={id}
        tone={tone}
        title={opts.title}
        description={opts.description}
        action={opts.action}
      />
    ),
    base
  )
}

/**
 * Typed toast helpers. Each returns the toast id so callers can dismiss
 * programmatically.
 */
export const toast = {
  success: (opts: ShowToastOptions) => show("success", opts),
  info: (opts: ShowToastOptions) => show("info", opts),
  warning: (opts: ShowToastOptions) => show("warning", opts),
  error: (opts: ShowToastOptions) => show("error", opts),
  dismiss: (id?: string | number) => sonnerToast.dismiss(id),
}
