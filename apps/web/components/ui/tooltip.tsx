"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipArrow = TooltipPrimitive.Arrow

// ── Section H variants ───────────────────────────────────────────────────
// `dark`  — default: #18181B bg, white text (matches CLTooltip artboard)
// `light` — for use on dark surfaces (card-on-black admin chrome)

interface TooltipContentProps
  extends React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> {
  /** Visual tone. Default is `dark` per the Section H artboard. */
  tone?: "dark" | "light"
  /** Render the Radix arrow element. Default `true`. */
  withArrow?: boolean
}

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  TooltipContentProps
>(
  (
    { className, tone = "dark", withArrow = true, sideOffset = 6, children, ...props },
    ref
  ) => {
    const isDark = tone === "dark"
    return (
      <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          // ── Layout (Section H: 5px radius, 5/9 padding, 11.5px / 500) ────
          "z-50 inline-flex items-center",
          "rounded-[5px] px-[9px] py-[5px]",
          "text-[11.5px] font-medium",
          "shadow-md",
          // ── Tone ──────────────────────────────────────────────────────────
          isDark
            ? "bg-text-default text-white"
            : "bg-card text-text-default border border-border",
          // ── Animations ────────────────────────────────────────────────────
          "animate-in fade-in-0 zoom-in-95",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          "data-[side=bottom]:slide-in-from-top-1 data-[side=left]:slide-in-from-right-1",
          "data-[side=right]:slide-in-from-left-1 data-[side=top]:slide-in-from-bottom-1",
          "origin-[--radix-tooltip-content-transform-origin]",
          className
        )}
        {...props}
      >
        {children}
        {withArrow && (
          <TooltipPrimitive.Arrow
            width={10}
            height={5}
            className={isDark ? "fill-text-default" : "fill-card"}
          />
        )}
      </TooltipPrimitive.Content>
    )
  }
)
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, TooltipArrow }
