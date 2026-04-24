"use client"

import * as React from "react"
import Link from "next/link"
import { type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

// ── Section H Mobile Tab Bar (T10.6) ────────────────────────────────────────
//
// Fixed bottom navigation for the mobile admin variant. Renders 4 slots —
// Home · Menus · QR · Me — each with a lucide icon, a short label, and an
// active state (darker text + heavier weight + thicker icon stroke).
//
// Positioning is left to the caller: by default this renders as a relative
// block; add `sticky bottom-0` or `fixed inset-x-0 bottom-0` in the parent
// layout for the actual mobile chrome.
//
// Design reference:
//   - qr-menu-design/components/mobile.jsx lines 35-60 (MobileBottomTab)
//   - qr-menu-design/components/component-library-b.jsx lines 286-309 (showcase)

export interface MobileTab {
  id: string
  label: string
  icon: LucideIcon
  href?: string
}

export interface MobileTabBarProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "onChange"> {
  items: MobileTab[]
  activeId: string
  onChange?: (id: string) => void
  "aria-label"?: string
}

const MobileTabBar = React.forwardRef<HTMLElement, MobileTabBarProps>(
  function MobileTabBar(
    {
      items,
      activeId,
      onChange,
      className,
      "aria-label": ariaLabel = "Primary",
      ...rest
    },
    ref,
  ) {
    return (
      <nav
        ref={ref}
        aria-label={ariaLabel}
        className={cn(
          "flex border-t border-border bg-bg",
          // 8px top / 18px bottom matches the mobile artboard (safe-area room).
          "px-2 pb-[18px] pt-2",
          className,
        )}
        {...rest}
      >
        {items.map((item) => {
          const Icon = item.icon
          const isActive = item.id === activeId
          const itemClass = cn(
            "group flex flex-1 flex-col items-center justify-center gap-[3px] py-[6px]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:rounded-md",
            isActive ? "text-text-default" : "text-text-muted",
          )
          const iconStroke = isActive ? 1.8 : 1.5
          const labelClass = cn(
            "text-[10.5px]",
            isActive ? "font-semibold" : "font-medium",
          )

          const body = (
            <>
              <Icon
                size={19}
                strokeWidth={iconStroke}
                aria-hidden="true"
              />
              <span className={labelClass}>{item.label}</span>
            </>
          )

          const commonProps = {
            "aria-current": isActive ? ("page" as const) : undefined,
            "data-active": isActive ? "true" : undefined,
            "data-tab-id": item.id,
            className: itemClass,
          }

          if (item.href) {
            return (
              <Link
                key={item.id}
                href={item.href}
                {...commonProps}
                onClick={() => onChange?.(item.id)}
              >
                {body}
              </Link>
            )
          }

          return (
            <button
              key={item.id}
              type="button"
              {...commonProps}
              onClick={() => onChange?.(item.id)}
            >
              {body}
            </button>
          )
        })}
      </nav>
    )
  },
)

export { MobileTabBar }
