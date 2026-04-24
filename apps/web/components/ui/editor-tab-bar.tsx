"use client"

import * as React from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"

// ── Section H Editor Tab Bar (T10.6) ────────────────────────────────────────
//
// Page-level underlined tab bar for the menu editor (Content · Branding ·
// Languages · Analytics · Promotions · QR · Settings). Renders each item as
// a Next.js Link when `href` is set, otherwise as a button (useful for
// stateful, non-routed tab interfaces and for controlled showcase/tests).
// Overflows horizontally on narrow viewports; the native scrollbar is
// hidden so truncation reads as a clean edge fade.
//
// Design reference:
//   - qr-menu-design/components/menu-editor.jsx lines 4-71 (EditorHeader tabs)
//   - qr-menu-design/components/component-library-b.jsx lines 330-333 (showcase)

export interface EditorTab {
  id: string
  label: string
  href?: string
  disabled?: boolean
}

export interface EditorTabBarProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  items: EditorTab[]
  activeId: string
  onChange?: (id: string) => void
  "aria-label"?: string
}

const EditorTabBar = React.forwardRef<HTMLDivElement, EditorTabBarProps>(
  function EditorTabBar(
    {
      items,
      activeId,
      onChange,
      className,
      "aria-label": ariaLabel = "Editor sections",
      ...rest
    },
    ref,
  ) {
    const listRef = React.useRef<HTMLDivElement | null>(null)
    const triggerRefs = React.useRef<Array<HTMLElement | null>>([])

    const activeIndex = Math.max(
      0,
      items.findIndex((item) => item.id === activeId),
    )

    const focusAt = (index: number) => {
      const el = triggerRefs.current[index]
      el?.focus()
    }

    const handleKeyDown = (
      event: React.KeyboardEvent<HTMLDivElement>,
      currentIndex: number,
    ) => {
      if (event.key === "ArrowRight") {
        event.preventDefault()
        const next = (currentIndex + 1) % items.length
        focusAt(next)
      } else if (event.key === "ArrowLeft") {
        event.preventDefault()
        const prev = (currentIndex - 1 + items.length) % items.length
        focusAt(prev)
      } else if (event.key === "Home") {
        event.preventDefault()
        focusAt(0)
      } else if (event.key === "End") {
        event.preventDefault()
        focusAt(items.length - 1)
      }
    }

    return (
      <div
        ref={ref}
        className={cn(
          "border-b border-border",
          // Horizontal scroll with hidden scrollbar (truncates on overflow).
          "overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
          className,
        )}
        {...rest}
      >
        <div
          ref={listRef}
          role="tablist"
          aria-label={ariaLabel}
          className="flex min-w-max items-end gap-0"
        >
          {items.map((item, i) => {
            const isActive = item.id === activeId
            const triggerClass = cn(
              "relative -mb-px inline-flex items-center whitespace-nowrap px-[14px] py-[9px]",
              "text-[13px] font-medium border-b-[2px]",
              "transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:rounded-xs",
              isActive
                ? "border-text-default text-text-default font-semibold"
                : "border-transparent text-text-muted hover:text-text-default",
              item.disabled && "opacity-50 pointer-events-none",
            )
            const commonProps = {
              role: "tab" as const,
              "aria-selected": isActive,
              "aria-disabled": item.disabled || undefined,
              "data-state": isActive ? ("active" as const) : ("inactive" as const),
              "data-tab-id": item.id,
              tabIndex: isActive ? 0 : -1,
              onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) =>
                handleKeyDown(event, i),
              className: triggerClass,
              children: item.label,
            }

            if (item.href && !item.disabled) {
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  {...commonProps}
                  ref={(node) => {
                    triggerRefs.current[i] = node
                  }}
                  onClick={() => onChange?.(item.id)}
                />
              )
            }

            return (
              <button
                key={item.id}
                type="button"
                disabled={item.disabled}
                {...commonProps}
                ref={(node) => {
                  triggerRefs.current[i] = node
                }}
                onClick={() => onChange?.(item.id)}
              />
            )
          })}
        </div>
      </div>
    )
  },
)

export { EditorTabBar }
