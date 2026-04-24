import * as React from "react"
import { X, type LucideIcon } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// ── Section H Input spec (component-library-a.jsx, lines 155-180) ────────────
// Sizes:
//   sm  28px h / 10px px / 12px fs
//   md  34px h / 11px px / 13px fs (default)
//   lg  40px h / 14px px / 14px fs
// Border radius: 7px (same as Button)
// States:
//   default  — 1px border
//   focused  — border = text, ring text/10 at 3px (via :focus-within)
//   error    — border = danger, ring danger/13 at 3px
//   disabled — bg #F7F6F1, text subtle

const ICON_SIZE: Record<"sm" | "md" | "lg", number> = {
  sm: 12,
  md: 13,
  lg: 14,
}

const inputContainerVariants = cva(
  [
    "inline-flex items-center gap-[7px] w-full min-w-0",
    "rounded-[7px] border transition-shadow duration-150",
    "font-sans",
    "has-[input:focus]:shadow-[0_0_0_3px_rgba(24,24,27,0.1)]",
    "has-[input:focus]:border-text-default",
    "has-[input:disabled]:cursor-not-allowed has-[input:disabled]:bg-[#F7F6F1]",
  ],
  {
    variants: {
      size: {
        sm: "h-[28px] px-[10px] text-[12px]",
        md: "h-[34px] px-[11px] text-[13px]",
        lg: "h-[40px] px-[14px] text-[14px]",
      },
      error: {
        true: "border-danger has-[input:focus]:border-danger has-[input:focus]:shadow-[0_0_0_3px_rgba(184,66,61,0.13)]",
        false: "border-border bg-card",
      },
    },
    defaultVariants: {
      size: "md",
      error: false,
    },
  }
)

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "prefix">,
    VariantProps<typeof inputContainerVariants> {
  /** Lucide icon rendered at the leading edge. Stroke width 1.5. */
  icon?: LucideIcon
  /** Static text shown before the value (e.g. "cafelinville.ge/"). */
  prefix?: React.ReactNode
  /** Static text or node shown after the value (e.g. "₾" for price). */
  suffix?: React.ReactNode
  /** When true and value is non-empty, show a clear-X button. */
  clearable?: boolean
  /** Called when the clear button is clicked. */
  onClear?: () => void
  /** Mark the input as invalid (red border + ring). */
  error?: boolean
  /** Tabular-nums class for numeric inputs. Applies `font-variant-numeric`. */
  numeric?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      size,
      error,
      icon: Icon,
      prefix,
      suffix,
      clearable,
      onClear,
      numeric,
      type = "text",
      disabled,
      value,
      defaultValue,
      ...props
    },
    ref
  ) => {
    const sizeKey = (size ?? "md") as "sm" | "md" | "lg"
    const iconPx = ICON_SIZE[sizeKey]

    // A clear-X is only useful when the field has a value. Tracking only the
    // controlled value is enough here — for uncontrolled inputs the consumer
    // should wire onClear to reset a ref. We surface the button whenever the
    // consumer asked for it; the onClick calls onClear.
    const hasValue =
      (typeof value === "string" && value.length > 0) ||
      (typeof value === "number" && !Number.isNaN(value)) ||
      (value === undefined && typeof defaultValue === "string" && defaultValue.length > 0)

    const showClear = clearable && hasValue && !disabled

    return (
      <div
        className={cn(
          inputContainerVariants({ size: sizeKey, error: !!error }),
          className
        )}
      >
        {Icon ? (
          <Icon
            size={iconPx}
            strokeWidth={1.5}
            aria-hidden="true"
            className="shrink-0 text-text-muted"
          />
        ) : null}

        {prefix ? (
          <span className="text-text-muted shrink-0 select-none">{prefix}</span>
        ) : null}

        <input
          ref={ref}
          type={type}
          disabled={disabled}
          value={value}
          defaultValue={defaultValue}
          aria-invalid={error || undefined}
          className={cn(
            "flex-1 min-w-0 bg-transparent outline-none border-0 p-0",
            "placeholder:text-text-subtle text-text-default",
            "disabled:cursor-not-allowed disabled:text-text-subtle",
            numeric && "tabular-nums",
          )}
          {...props}
        />

        {showClear ? (
          <button
            type="button"
            onClick={onClear}
            aria-label="Clear"
            className="shrink-0 rounded-xs p-[2px] text-text-muted hover:text-text-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <X size={iconPx} strokeWidth={1.5} aria-hidden="true" />
          </button>
        ) : null}

        {suffix ? (
          <span className="text-text-muted shrink-0 select-none tabular-nums">
            {suffix}
          </span>
        ) : null}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input, inputContainerVariants }
