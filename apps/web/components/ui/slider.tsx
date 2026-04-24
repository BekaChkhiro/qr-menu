"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

// ── Section H Slider spec (component-library-a.jsx, lines 302-318) ───────────
// Track:  4px height, rounded 2, bg=border
// Range:  bg=text-default (filled portion)
// Thumb:  14×14 circle, bg=white, 2px text border, subtle shadow
//
// For a range slider pass `defaultValue={[10, 80]}` (two values) — Radix
// automatically renders two thumbs.

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, defaultValue, value, ...props }, ref) => {
  // Radix renders one <Thumb/> per value. Determine the thumb count so we can
  // render the right number of accessible handles.
  const thumbCount = React.useMemo(() => {
    if (Array.isArray(value)) return value.length
    if (Array.isArray(defaultValue)) return defaultValue.length
    return 1
  }, [value, defaultValue])

  return (
    <SliderPrimitive.Root
      ref={ref}
      defaultValue={defaultValue}
      value={value}
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-[4px] w-full grow overflow-hidden rounded-[2px] bg-border">
        <SliderPrimitive.Range className="absolute h-full bg-text-default" />
      </SliderPrimitive.Track>
      {Array.from({ length: thumbCount }).map((_, i) => (
        <SliderPrimitive.Thumb
          key={i}
          className={cn(
            "block h-[14px] w-[14px] rounded-full bg-white",
            "border-2 border-text-default shadow-[0_1px_3px_rgba(0,0,0,0.15)]",
            "transition-[box-shadow]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            "disabled:pointer-events-none disabled:opacity-50",
          )}
        />
      ))}
    </SliderPrimitive.Root>
  )
})
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
