"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check, Minus } from "lucide-react"

import { cn } from "@/lib/utils"

// ── Section H Checkbox spec (component-library-a.jsx, lines 240-262) ─────────
// Box: 16×16, rounded 4px, 1.5px border
//   default   — border = border-token, bg white
//   hover     — border = text-muted,   bg #F7F6F1 (applied via hover:)
//   focused   — border = text,         ring text/10 at 3px (focus-visible)
//   checked   — bg text,   border text, white check
//   indeterm  — bg text,   border text, white dash
//   disabled  — bg #F0EFEA, border = border-token, opacity 0.5

export type CheckboxProps = React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
// Note: when `checked === "indeterminate"` the component renders a dash
// instead of a check. Otherwise the API matches Radix exactly.

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, checked, ...props }, ref) => {
  const isIndeterminate = checked === "indeterminate"
  return (
    <CheckboxPrimitive.Root
      ref={ref}
      checked={checked}
      className={cn(
        "peer relative inline-flex h-[16px] w-[16px] shrink-0 items-center justify-center",
        "rounded-[4px] border-[1.5px] border-border bg-card transition-colors duration-150",
        "hover:border-text-muted hover:bg-[#F7F6F1]",
        "focus-visible:outline-none focus-visible:border-text-default focus-visible:shadow-[0_0_0_3px_rgba(24,24,27,0.1)]",
        "disabled:cursor-not-allowed disabled:bg-[#F0EFEA] disabled:border-border disabled:opacity-50",
        "data-[state=checked]:bg-text-default data-[state=checked]:border-text-default",
        "data-[state=indeterminate]:bg-text-default data-[state=indeterminate]:border-text-default",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-white">
        {isIndeterminate ? (
          <Minus size={10} strokeWidth={2.5} aria-hidden="true" />
        ) : (
          <Check size={10} strokeWidth={2.5} aria-hidden="true" />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
})
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
