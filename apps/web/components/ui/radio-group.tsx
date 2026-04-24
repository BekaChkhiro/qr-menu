"use client"

import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"

import { cn } from "@/lib/utils"

// ── Section H Radio spec (component-library-a.jsx, lines 264-282) ────────────
// 16×16 circle, 1.5px border
//   default   — border = border-token
//   hover     — border = text-muted
//   focused   — border = text, ring text/10 at 3px
//   selected  — border = text, inner 8×8 dot in text color
//   disabled  — border = border-token, opacity 0.5

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Root
    ref={ref}
    className={cn("flex flex-col gap-[8px]", className)}
    {...props}
  />
))
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Item
    ref={ref}
    className={cn(
      "peer relative inline-flex h-[16px] w-[16px] shrink-0 items-center justify-center",
      "rounded-full border-[1.5px] border-border bg-card transition-colors duration-150",
      "hover:border-text-muted",
      "focus-visible:outline-none focus-visible:border-text-default focus-visible:shadow-[0_0_0_3px_rgba(24,24,27,0.1)]",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "data-[state=checked]:border-text-default",
      className,
    )}
    {...props}
  >
    <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
      <span
        aria-hidden="true"
        className="block h-[8px] w-[8px] rounded-full bg-text-default"
      />
    </RadioGroupPrimitive.Indicator>
  </RadioGroupPrimitive.Item>
))
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName

export { RadioGroup, RadioGroupItem }
