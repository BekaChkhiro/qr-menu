"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

// ── Section H Switch spec (component-library-a.jsx, lines 223-238) ───────────
// Track:  32×18px, rounded-full, 2px inner padding
//         on → text color (#18181B), off → #D4D4D0
// Thumb:  14×14 white circle, translateX(14px) when on
// Disabled: opacity 0.4

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    ref={ref}
    className={cn(
      "peer relative inline-flex h-[18px] w-[32px] shrink-0 cursor-pointer items-center",
      "rounded-full p-[2px] transition-colors duration-150",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      "disabled:cursor-not-allowed disabled:opacity-40",
      "data-[state=checked]:bg-text-default data-[state=unchecked]:bg-[#D4D4D0]",
      className,
    )}
    {...props}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-[14px] w-[14px] rounded-full bg-white",
        "shadow-[0_1px_2px_rgba(0,0,0,0.15)]",
        "transition-transform duration-150",
        "data-[state=checked]:translate-x-[14px] data-[state=unchecked]:translate-x-0",
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
