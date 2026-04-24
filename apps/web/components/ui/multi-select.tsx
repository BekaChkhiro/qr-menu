"use client"

import * as React from "react"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

// ── Multi-select tag input ───────────────────────────────────────────────────
// Section H pattern: a single field displaying each selected value as a chip
// with an inline remove button. A free-text input lives at the tail so the
// user can keep typing. New chips are added on Enter (or on commitDelimiters
// such as a comma) and removed via the X or Backspace on an empty input.
//
// Consumers pass either:
//   - `value` + `onValueChange` (controlled)
//   - `defaultValue` (uncontrolled)
// plus optional `suggestions` to autocomplete against.

export interface MultiSelectProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Controlled selected values. */
  value?: string[]
  /** Initial selected values (uncontrolled). */
  defaultValue?: string[]
  /** Fires whenever the selected values change. */
  onValueChange?: (values: string[]) => void
  /** Placeholder shown inside the input when empty. */
  placeholder?: string
  /** Delimiters that commit the current input into a new chip. Default `["Enter", ","]`. */
  commitKeys?: string[]
  /** Mark the wrapper as invalid. */
  error?: boolean
  /** Disable all interaction. */
  disabled?: boolean
  /** Called when Backspace on empty input removes the last chip. */
  onLastChipRemove?: () => void
}

const MultiSelect = React.forwardRef<HTMLDivElement, MultiSelectProps>(
  (
    {
      className,
      value,
      defaultValue,
      onValueChange,
      placeholder,
      commitKeys = ["Enter", ","],
      error,
      disabled,
      onLastChipRemove,
      ...props
    },
    ref,
  ) => {
    const isControlled = value !== undefined
    const [internal, setInternal] = React.useState<string[]>(defaultValue ?? [])
    const values = isControlled ? value! : internal

    const [query, setQuery] = React.useState("")

    const setValues = (next: string[]) => {
      if (!isControlled) setInternal(next)
      onValueChange?.(next)
    }

    const addChip = (raw: string) => {
      const v = raw.trim()
      if (!v) return
      if (values.includes(v)) {
        setQuery("")
        return
      }
      setValues([...values, v])
      setQuery("")
    }

    const removeChip = (v: string) => {
      setValues(values.filter((x) => x !== v))
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (disabled) return
      if (commitKeys.includes(e.key)) {
        e.preventDefault()
        addChip(query)
      } else if (e.key === "Backspace" && query === "" && values.length > 0) {
        e.preventDefault()
        const last = values[values.length - 1]
        removeChip(last)
        onLastChipRemove?.()
      }
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-wrap items-center gap-[6px] min-h-[34px] px-[8px] py-[4px]",
          "rounded-[7px] border bg-card font-sans text-[13px]",
          "transition-shadow duration-150",
          "has-[input:focus]:border-text-default has-[input:focus]:shadow-[0_0_0_3px_rgba(24,24,27,0.1)]",
          error
            ? "border-danger has-[input:focus]:border-danger has-[input:focus]:shadow-[0_0_0_3px_rgba(184,66,61,0.13)]"
            : "border-border",
          disabled && "bg-[#F7F6F1] cursor-not-allowed",
          className,
        )}
        onClick={(e) => {
          // Clicking blank space in the wrapper focuses the inline input.
          const input = (e.currentTarget.querySelector("input") as HTMLInputElement | null)
          input?.focus()
        }}
        {...props}
      >
        {values.map((v) => (
          <span
            key={v}
            className={cn(
              "inline-flex items-center gap-[4px] max-w-full",
              "pl-[8px] pr-[4px] py-[2px] rounded-[12px]",
              "bg-chip text-text-default text-[12px] font-medium",
            )}
          >
            <span className="truncate">{v}</span>
            {!disabled ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  removeChip(v)
                }}
                aria-label={`Remove ${v}`}
                className="shrink-0 rounded-full p-[1px] text-text-muted hover:text-text-default focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
              >
                <X size={11} strokeWidth={2} aria-hidden="true" />
              </button>
            ) : null}
          </span>
        ))}

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={values.length === 0 ? placeholder : undefined}
          disabled={disabled}
          aria-invalid={error || undefined}
          className={cn(
            "flex-1 min-w-[80px] bg-transparent outline-none border-0 p-0",
            "text-text-default placeholder:text-text-subtle",
            "disabled:cursor-not-allowed disabled:text-text-subtle",
          )}
        />
      </div>
    )
  },
)
MultiSelect.displayName = "MultiSelect"

export { MultiSelect }
