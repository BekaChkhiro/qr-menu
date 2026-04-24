"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "@/lib/utils"

const Popover = PopoverPrimitive.Root

const PopoverTrigger = PopoverPrimitive.Trigger

const PopoverAnchor = PopoverPrimitive.Anchor

const PopoverClose = PopoverPrimitive.Close

// ── Section H popover spec (component-library-b.jsx lines 77-96) ─────────
// - 240px default width
// - 1px border, 10px radius, md shadow
// - 14px padding
// - Optional arrow (12px diamond, `rotate(45deg)` with border-left/top)
// - sm variant = tighter padding for compact popovers (e.g. filter chip)

interface PopoverContentProps
  extends React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> {
  /**
   * Render the Radix arrow element. Default `true`.
   * Uses `Arrow` which is a rotated square matching the design.
   */
  withArrow?: boolean
  /** Visual density. `md` (default, 14px padding) or `sm` (10px padding). */
  size?: "sm" | "md"
}

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  PopoverContentProps
>(
  (
    {
      className,
      align = "center",
      sideOffset = 8,
      withArrow = true,
      size = "md",
      children,
      ...props
    },
    ref
  ) => (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          // ── Layout ──────────────────────────────────────────────────────
          "z-50 w-60 outline-none",
          size === "sm" ? "p-[10px]" : "p-[14px]",
          // ── Chrome ──────────────────────────────────────────────────────
          "bg-card text-text-default",
          "rounded-[10px] border border-border shadow-md",
          // ── Animations ──────────────────────────────────────────────────
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
          "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          "origin-[--radix-popover-content-transform-origin]",
          className
        )}
        {...props}
      >
        {children}
        {withArrow && (
          <PopoverPrimitive.Arrow
            width={12}
            height={6}
            className="fill-card drop-shadow-[0_-1px_0_hsl(var(--border))]"
          />
        )}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  )
)
PopoverContent.displayName = PopoverPrimitive.Content.displayName

/**
 * Overline header — 11.5/600 text, 4px bottom margin. Matches the
 * "Price range" header in the artboard.
 */
const PopoverTitle = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "text-[12.5px] font-semibold text-text-default mb-1",
      className
    )}
    {...props}
  />
)
PopoverTitle.displayName = "PopoverTitle"

/**
 * Body text for popover descriptions — 11.5/400, muted, 1.45 line height.
 */
const PopoverDescription = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p
    className={cn(
      "text-[11.5px] leading-[1.45] text-text-muted",
      className
    )}
    {...props}
  />
)
PopoverDescription.displayName = "PopoverDescription"

export {
  Popover,
  PopoverTrigger,
  PopoverAnchor,
  PopoverClose,
  PopoverContent,
  PopoverTitle,
  PopoverDescription,
}
