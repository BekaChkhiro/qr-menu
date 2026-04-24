import * as React from "react"

import { cn } from "@/lib/utils"

// ── Tones ────────────────────────────────────────────────────────────────────
// default = slate text, success/warning/danger = semantic fills.
// accent used for brand-driven progress (onboarding, stepper).
type ProgressTone = "default" | "success" | "warning" | "danger" | "accent"

const TONE_BG: Record<ProgressTone, string> = {
  default: "bg-text-default",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  accent: "bg-accent",
}

// ── Determinate / Indeterminate Progress Bar ─────────────────────────────────

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Progress value between 0 and 100. Leave `undefined` for an indeterminate
   * bar (pulsing).
   */
  value?: number
  tone?: ProgressTone
  /** Show `{value}%` label below the bar. */
  showLabel?: boolean
  /** Custom accessible label. Defaults to "Progress {value}%". */
  label?: string
}

export function Progress({
  value,
  tone = "default",
  showLabel = false,
  label,
  className,
  ...props
}: ProgressProps) {
  const isIndeterminate = value === undefined || value === null
  const clamped = isIndeterminate ? 0 : Math.max(0, Math.min(100, value))

  const accessibleLabel =
    label ?? (isIndeterminate ? "Loading" : `Progress ${clamped}%`)

  return (
    <div className={cn("w-full", className)} {...props}>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={isIndeterminate ? undefined : clamped}
        aria-busy={isIndeterminate || undefined}
        aria-label={accessibleLabel}
        className="h-1.5 w-full overflow-hidden rounded-pill bg-border"
      >
        {isIndeterminate ? (
          <div
            className={cn(
              TONE_BG[tone],
              "h-full rounded-pill animate-pulse-urgent"
            )}
            style={{ width: "40%" }}
          />
        ) : (
          <div
            data-testid="progress-fill"
            className={cn(
              TONE_BG[tone],
              "h-full rounded-pill transition-[width] duration-300 ease-out"
            )}
            style={{ width: `${clamped}%` }}
          />
        )}
      </div>
      {showLabel && (
        <div className="mt-[5px] text-[11px] text-text-muted tabular-nums">
          {isIndeterminate ? "Loading…" : `${clamped}%`}
        </div>
      )}
    </div>
  )
}

// ── Segmented Stepper ────────────────────────────────────────────────────────
// Discrete-step progress (e.g. wizard: "Step 2 of 4"). Active segments fill
// with the tone colour; inactive segments use the neutral border colour.

export interface ProgressStepperProps
  extends React.HTMLAttributes<HTMLDivElement> {
  totalSteps: number
  /** 1-based current step. 0 = none active, totalSteps = all active. */
  currentStep: number
  tone?: ProgressTone
  /** Custom accessible label. Defaults to "Step {n} of {total}". */
  label?: string
}

export function ProgressStepper({
  totalSteps,
  currentStep,
  tone = "accent",
  label,
  className,
  ...props
}: ProgressStepperProps) {
  const clamped = Math.max(0, Math.min(totalSteps, currentStep))
  const accessibleLabel = label ?? `Step ${clamped} of ${totalSteps}`

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={totalSteps}
      aria-valuenow={clamped}
      aria-label={accessibleLabel}
      className={cn("flex w-full gap-1.5", className)}
      {...props}
    >
      {Array.from({ length: totalSteps }, (_, i) => {
        const active = i < clamped
        return (
          <div
            key={i}
            data-active={active || undefined}
            className={cn(
              "h-1.5 flex-1 rounded-pill transition-colors duration-200",
              active ? TONE_BG[tone] : "bg-border"
            )}
          />
        )
      })}
    </div>
  )
}
