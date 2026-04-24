import * as React from "react"
import { X } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// ── Section H Tag / Chip (T10.4) ────────────────────────────────────────────
//
// Pill-shaped chip used inside multi-select inputs, allergen pickers, filter
// bars, and category tags on public menus. Three visual flavours:
//   - default: card bg + 1px border
//   - tonal:  accent/success/warning/danger soft-bg, no border
//   - suggest: dashed border, muted text (for "add tag" affordances)

const tagVariants = cva(
  [
    "inline-flex items-center gap-[5px]",
    "rounded-pill text-[11.5px] font-medium",
    "py-[3px]",
    "whitespace-nowrap",
  ],
  {
    variants: {
      tone: {
        default: "bg-card border border-border text-text-default",
        accent: "bg-accent-soft text-accent",
        success: "bg-success-soft text-success",
        warning: "bg-warning-soft text-warning",
        danger: "bg-danger-soft text-danger",
        suggest:
          "bg-transparent border border-dashed border-border text-text-muted",
      },
      removable: {
        true: "pl-[10px] pr-[6px]",
        false: "px-[10px]",
      },
    },
    defaultVariants: {
      tone: "default",
      removable: false,
    },
  }
)

export interface TagProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "onRemove">,
    VariantProps<typeof tagVariants> {
  /** Show a trailing ✕ button; fires `onRemove` when clicked. */
  removable?: boolean
  /** Called when the ✕ button is activated (click or Enter/Space). */
  onRemove?: () => void
}

const Tag = React.forwardRef<HTMLSpanElement, TagProps>(
  (
    { className, tone, removable = false, onRemove, children, ...props },
    ref
  ) => {
    return (
      <span
        ref={ref}
        className={cn(tagVariants({ tone, removable }), className)}
        {...props}
      >
        {children}
        {removable && (
          <button
            type="button"
            aria-label="Remove"
            onClick={onRemove}
            className={cn(
              "inline-flex items-center justify-center",
              "size-[14px] rounded-pill",
              "text-text-muted hover:bg-chip hover:text-text-default",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            )}
          >
            <X size={10} strokeWidth={1.75} aria-hidden="true" />
          </button>
        )}
      </span>
    )
  }
)
Tag.displayName = "Tag"

export { Tag, tagVariants }
