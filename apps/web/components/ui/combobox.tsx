"use client"

import * as React from "react"
import { Command as CommandPrimitive } from "cmdk"
import { Check, ChevronDown, Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"

// ── Section H Combobox ───────────────────────────────────────────────────────
// Same trigger visuals as Select, but opens a Popover with a cmdk-driven
// searchable list. Built so that it can be controlled (value/onValueChange)
// or uncontrolled.

export interface ComboboxOption {
  value: string
  label: string
  disabled?: boolean
}

export interface ComboboxProps {
  /** List of selectable options. */
  options: ComboboxOption[]
  /** Controlled selected value. */
  value?: string
  /** Fires when a user picks an option. */
  onValueChange?: (value: string) => void
  /** Placeholder shown when no value is selected. */
  placeholder?: string
  /** Placeholder for the search input inside the popover. */
  searchPlaceholder?: string
  /** Text shown when no option matches the current query. */
  emptyText?: string
  /** Disable the trigger. */
  disabled?: boolean
  /** Mark the trigger as invalid. */
  error?: boolean
  /** Extra classes on the trigger. */
  className?: string
  /** ID applied to the trigger for label association. */
  id?: string
  /** Test id for Playwright targeting. */
  "data-testid"?: string
}

const Combobox = React.forwardRef<HTMLButtonElement, ComboboxProps>(
  (
    {
      options,
      value,
      onValueChange,
      placeholder = "Select…",
      searchPlaceholder = "Search",
      emptyText = "No results",
      disabled,
      error,
      className,
      id,
      ...rest
    },
    ref,
  ) => {
    const [open, setOpen] = React.useState(false)
    const selected = options.find((o) => o.value === value)
    const listboxId = React.useId()

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            ref={ref}
            id={id}
            type="button"
            role="combobox"
            aria-expanded={open}
            aria-controls={listboxId}
            aria-invalid={error || undefined}
            disabled={disabled}
            data-testid={rest["data-testid"]}
            className={cn(
              "inline-flex items-center justify-between gap-[8px] whitespace-nowrap",
              "h-[34px] w-full min-w-[180px] px-[11px] py-0",
              "rounded-[7px] border border-border bg-card",
              "text-[13px] font-sans text-left transition-shadow duration-150",
              "focus:outline-none focus:border-text-default focus:shadow-[0_0_0_3px_rgba(24,24,27,0.1)]",
              "data-[state=open]:border-text-default",
              "disabled:cursor-not-allowed disabled:bg-[#F7F6F1] disabled:text-text-subtle",
              error &&
                "border-danger focus:border-danger focus:shadow-[0_0_0_3px_rgba(184,66,61,0.13)]",
              className,
            )}
          >
            <span
              className={cn(
                "flex-1 truncate",
                selected ? "text-text-default" : "text-text-subtle",
              )}
            >
              {selected ? selected.label : placeholder}
            </span>
            <ChevronDown
              size={13}
              strokeWidth={1.5}
              aria-hidden="true"
              className="shrink-0 text-text-muted"
            />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={6}
          withArrow={false}
          className="w-[var(--radix-popover-trigger-width)] min-w-[200px] p-0"
        >
          <CommandPrimitive className="overflow-hidden">
            <div className="flex items-center gap-[8px] border-b border-border-soft px-[10px] py-[8px]">
              <Search
                size={13}
                strokeWidth={1.5}
                aria-hidden="true"
                className="shrink-0 text-text-muted"
              />
              <CommandPrimitive.Input
                placeholder={searchPlaceholder}
                className="flex-1 bg-transparent outline-none text-[13px] text-text-default placeholder:text-text-subtle"
              />
            </div>
            <CommandPrimitive.List
              id={listboxId}
              className="max-h-[240px] overflow-y-auto p-[4px]"
            >
              <CommandPrimitive.Empty className="px-[10px] py-[8px] text-[12px] text-text-muted">
                {emptyText}
              </CommandPrimitive.Empty>
              {options.map((option) => (
                <CommandPrimitive.Item
                  key={option.value}
                  value={option.label}
                  disabled={option.disabled}
                  onSelect={() => {
                    if (option.disabled) return
                    onValueChange?.(option.value)
                    setOpen(false)
                  }}
                  className={cn(
                    "flex items-center justify-between gap-[8px]",
                    "px-[10px] py-[7px] rounded-[5px] text-[13px] text-text-default",
                    "cursor-pointer select-none outline-none",
                    "data-[selected=true]:bg-chip",
                    "data-[disabled=true]:opacity-50 data-[disabled=true]:cursor-not-allowed",
                  )}
                >
                  <span className="flex-1 truncate">{option.label}</span>
                  {option.value === value ? (
                    <Check
                      size={13}
                      strokeWidth={1.5}
                      aria-hidden="true"
                      className="text-text-default shrink-0"
                    />
                  ) : null}
                </CommandPrimitive.Item>
              ))}
            </CommandPrimitive.List>
          </CommandPrimitive>
        </PopoverContent>
      </Popover>
    )
  },
)
Combobox.displayName = "Combobox"

export { Combobox }
