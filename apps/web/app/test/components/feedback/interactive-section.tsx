"use client"

import * as React from "react"

import { Banner } from "@/components/ui/banner"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/components/ui/toast"

/**
 * Interactive region used by Playwright functional tests:
 * - Toast triggers (one per tone) + auto-dismiss + action-button handler
 * - Dismissible Banner
 * - Progress bar whose `aria-valuenow` changes with a +10/-10 stepper
 */
export function InteractiveSection() {
  const [bannerDismissed, setBannerDismissed] = React.useState(false)
  const [actionClicks, setActionClicks] = React.useState(0)
  const [progressValue, setProgressValue] = React.useState(40)

  const clampedProgress = Math.max(0, Math.min(100, progressValue))

  return (
    <section
      aria-labelledby="interactive-heading"
      data-testid="interactive-section"
    >
      <h2
        id="interactive-heading"
        className="text-h2 text-text-default mb-4 pb-2 border-b border-border"
      >
        Interactive tests
      </h2>

      {/* Toast triggers */}
      <div className="space-y-3 mb-8">
        <div className="text-caption font-semibold text-text-muted uppercase tracking-wider">
          Toasts
        </div>
        <p
          data-testid="toast-action-count"
          className="text-caption text-text-muted"
        >
          Action clicks: {actionClicks}
        </p>
        <div className="flex flex-wrap gap-3 bg-card border border-border rounded-card p-4">
          <Button
            variant="secondary"
            size="sm"
            data-testid="trigger-toast-success"
            onClick={() =>
              toast.success({
                title: "Menu saved",
                description: "Your changes are live. 3 items updated.",
              })
            }
          >
            Success toast
          </Button>
          <Button
            variant="secondary"
            size="sm"
            data-testid="trigger-toast-info"
            onClick={() =>
              toast.info({
                title: "Auto-translation ready",
                description: "Georgian → English finished in 12s.",
              })
            }
          >
            Info toast
          </Button>
          <Button
            variant="secondary"
            size="sm"
            data-testid="trigger-toast-warning"
            onClick={() =>
              toast.warning({
                title: "QR code changed",
                description:
                  "Printed QR codes pointing at the old URL will break.",
              })
            }
          >
            Warning toast
          </Button>
          <Button
            variant="secondary"
            size="sm"
            data-testid="trigger-toast-error"
            onClick={() =>
              toast.error({
                title: "Upload failed",
                description: "File too large (max 2MB). Try a smaller image.",
                action: {
                  label: "Retry",
                  onClick: () => setActionClicks((c) => c + 1),
                },
              })
            }
          >
            Error toast + action
          </Button>
          <Button
            variant="secondary"
            size="sm"
            data-testid="trigger-toast-short"
            onClick={() =>
              toast.info({
                title: "Quick ping",
                description: "Dismisses in 1s.",
                duration: 1000,
              })
            }
          >
            Short-lived toast (1s)
          </Button>
        </div>
      </div>

      {/* Dismissible banner */}
      <div className="space-y-3 mb-8">
        <div className="text-caption font-semibold text-text-muted uppercase tracking-wider">
          Dismissible banner
        </div>
        <div className="max-w-[520px]">
          {bannerDismissed ? (
            <p
              data-testid="banner-dismissed-marker"
              className="text-caption text-text-subtle italic"
            >
              Banner dismissed.
            </p>
          ) : (
            <Banner
              tone="info"
              title="You can dismiss this"
              description="Clicking the X hides the banner and calls onDismiss."
              dismissible
              onDismiss={() => setBannerDismissed(true)}
              data-testid="dismissible-banner"
            />
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          data-testid="banner-reset"
          onClick={() => setBannerDismissed(false)}
        >
          Reset banner
        </Button>
      </div>

      {/* Progress with changing value */}
      <div className="space-y-3">
        <div className="text-caption font-semibold text-text-muted uppercase tracking-wider">
          Progress aria-valuenow
        </div>
        <div className="flex items-center gap-4 bg-card border border-border rounded-card p-4">
          <Button
            variant="secondary"
            size="sm"
            data-testid="progress-dec"
            onClick={() => setProgressValue((v) => Math.max(0, v - 10))}
          >
            −10
          </Button>
          <div className="w-[240px]">
            <Progress
              value={clampedProgress}
              tone="accent"
              data-testid="interactive-progress"
            />
          </div>
          <Button
            variant="secondary"
            size="sm"
            data-testid="progress-inc"
            onClick={() => setProgressValue((v) => Math.min(100, v + 10))}
          >
            +10
          </Button>
          <span
            data-testid="progress-value-label"
            className="text-caption text-text-muted tabular-nums min-w-[40px]"
          >
            {clampedProgress}%
          </span>
        </div>
      </div>
    </section>
  )
}
