import * as React from "react"

import { cn } from "@/lib/utils"

// ── Section H Kbd spec (component-library-b.jsx lines 342-353) ───────────
// - min-w 22px (sm: 18px), height 22px (sm: 18px)
// - 11px font (sm: 10px), 600 weight
// - 1px border + 2px bottom border (pressed-key look)
// - 4px radius, mono font family, muted text

interface KbdProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Smaller variant used inside compact rows (command palette footer). */
  small?: boolean
}

const Kbd = React.forwardRef<HTMLSpanElement, KbdProps>(
  ({ className, small = false, children, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center",
        "text-text-muted bg-card",
        "border border-border border-b-[2px]",
        "rounded-[4px] font-mono font-semibold",
        small
          ? "min-w-[18px] h-[18px] px-1 text-[10px]"
          : "min-w-[22px] h-[22px] px-1.5 text-[11px]",
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
)
Kbd.displayName = "Kbd"

/**
 * Render multiple keys as a shortcut combo, e.g. `<KbdCombo keys={["⌘", "K"]} />`.
 * Keys get 3px gap between them.
 */
interface KbdComboProps extends React.HTMLAttributes<HTMLSpanElement> {
  keys: string[]
  small?: boolean
}

const KbdCombo = React.forwardRef<HTMLSpanElement, KbdComboProps>(
  ({ className, keys, small = false, ...props }, ref) => (
    <span
      ref={ref}
      className={cn("inline-flex items-center gap-[3px]", className)}
      {...props}
    >
      {keys.map((k, i) => (
        <Kbd key={`${k}-${i}`} small={small}>
          {k}
        </Kbd>
      ))}
    </span>
  )
)
KbdCombo.displayName = "KbdCombo"

export { Kbd, KbdCombo }
