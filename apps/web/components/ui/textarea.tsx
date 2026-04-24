"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

// ── Section H Textarea spec (component-library-a.jsx, lines 379-396) ─────────
// Same chrome as Input: 1px border, 7px radius, focus → text border + ring.
// Typography: 13px / line-height 1.5. Min-height ~68px matches the design.

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Mark the textarea as invalid (red border + ring). */
  error?: boolean
  /** Show a "X / max" counter below the field. */
  maxLength?: number
  /** Show character count helper below the field when `maxLength` is set. */
  showCount?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, maxLength, showCount, value, defaultValue, onChange, ...props }, ref) => {
    // Track character count for the counter footer.
    const [count, setCount] = React.useState(() => {
      if (typeof value === "string") return value.length
      if (typeof defaultValue === "string") return defaultValue.length
      return 0
    })

    React.useEffect(() => {
      if (typeof value === "string") setCount(value.length)
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (typeof value !== "string") setCount(e.target.value.length)
      onChange?.(e)
    }

    const counterVisible = showCount && typeof maxLength === "number"

    return (
      <div className="w-full">
        <textarea
          ref={ref}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          maxLength={maxLength}
          aria-invalid={error || undefined}
          className={cn(
            "flex min-h-[68px] w-full px-[12px] py-[9px] rounded-[7px]",
            "border bg-card font-sans text-[13px] leading-[1.5] text-text-default",
            "placeholder:text-text-subtle",
            "transition-shadow duration-150",
            "focus:outline-none focus:border-text-default focus:shadow-[0_0_0_3px_rgba(24,24,27,0.1)]",
            "disabled:cursor-not-allowed disabled:bg-[#F7F6F1] disabled:text-text-subtle",
            error
              ? "border-danger focus:border-danger focus:shadow-[0_0_0_3px_rgba(184,66,61,0.13)]"
              : "border-border",
            "resize-y",
            className,
          )}
          {...props}
        />
        {counterVisible ? (
          <div className="mt-[4px] text-right text-[11px] tabular-nums text-text-subtle">
            <span data-testid="textarea-count">{count}</span>
            <span aria-hidden="true"> / </span>
            <span>{maxLength}</span>
          </div>
        ) : null}
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
