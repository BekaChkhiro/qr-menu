import * as React from "react"

import { cn } from "@/lib/utils"

// ── Sizes (Section H spec) ───────────────────────────────────────────────────
// xs = 12px (inline with caption text)
// sm = 14px (button leading-icon parity)
// md = 22px (standalone, loading card)
const SIZE_PX: Record<"xs" | "sm" | "md", number> = {
  xs: 12,
  sm: 14,
  md: 22,
}

// Border thickness scales with diameter so the ring reads proportionally.
const BORDER_PX: Record<"xs" | "sm" | "md", number> = {
  xs: 1.6,
  sm: 2,
  md: 2.5,
}

type SpinnerTone = "accent" | "slate" | "white"

function toneColors(tone: SpinnerTone) {
  if (tone === "white") {
    return { track: "rgba(255,255,255,0.3)", head: "#ffffff" }
  }
  if (tone === "accent") {
    return { track: "hsl(var(--border))", head: "hsl(var(--accent))" }
  }
  // slate (default) — matches Button dark spinner head
  return { track: "hsl(var(--border))", head: "hsl(var(--text))" }
}

export interface SpinnerProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  size?: "xs" | "sm" | "md"
  tone?: SpinnerTone
  /** Accessible label announced by screen readers. Defaults to "Loading". */
  label?: string
}

export function Spinner({
  size = "sm",
  tone = "slate",
  label = "Loading",
  className,
  style,
  ...props
}: SpinnerProps) {
  const px = SIZE_PX[size]
  const border = BORDER_PX[size]
  const { track, head } = toneColors(tone)

  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={label}
      className={cn("inline-block align-middle", className)}
      style={{
        width: px,
        height: px,
        borderRadius: "50%",
        border: `${border}px solid ${track}`,
        borderTopColor: head,
        animation: "cl-spin 0.7s linear infinite",
        flexShrink: 0,
        ...style,
      }}
      {...props}
    />
  )
}
