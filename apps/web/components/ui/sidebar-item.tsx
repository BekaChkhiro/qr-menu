"use client"

import * as React from "react"
import Link from "next/link"
import { Lock, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

// ── Section H Sidebar Item (T10.6) ──────────────────────────────────────────
//
// Single row in the admin sidebar nav. States: default / hover / active /
// focused / locked / collapsed (icon-only). Renders as a Next.js Link when
// `href` is provided; otherwise as a button (useful for locked items where
// the click opens an upgrade prompt instead of navigating).
//
// Design reference:
//   - qr-menu-design/components/sidebar.jsx lines 25-53 (main sidebar)
//   - qr-menu-design/components/component-library-b.jsx lines 245-266 (states)

export interface SidebarItemProps {
  icon: LucideIcon
  label: string
  /** Target route. If omitted (or `locked` is true), renders as a button. */
  href?: string
  /** Explicit active state. Caller is responsible for computing from pathname. */
  active?: boolean
  /** Shows lock icon and blocks navigation. Invokes `onLockedClick` on press. */
  locked?: boolean
  /** Icon-only variant — hides the label, centers the icon. */
  collapsed?: boolean
  /** Optional trailing badge (e.g. count chip "3"). Hidden when collapsed. */
  badge?: React.ReactNode
  onClick?: (event: React.MouseEvent<HTMLElement>) => void
  onLockedClick?: () => void
  className?: string
  "data-testid"?: string
}

const SidebarItem = React.forwardRef<HTMLElement, SidebarItemProps>(
  function SidebarItem(
    {
      icon: Icon,
      label,
      href,
      active = false,
      locked = false,
      collapsed = false,
      badge,
      onClick,
      onLockedClick,
      className,
      ...rest
    },
    ref,
  ) {
    const shell = cn(
      "group relative flex items-center gap-3 rounded-md text-[13.5px]",
      "transition-colors",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
      collapsed ? "justify-center px-0 py-[9px]" : "px-3 py-[9px]",
      active
        ? "bg-text-default text-white font-semibold"
        : "text-text-muted font-medium hover:bg-chip hover:text-text-default",
      locked && !active && "cursor-pointer",
      className,
    )

    const iconStroke = active ? 1.8 : 1.5
    const iconEl = (
      <Icon
        size={17}
        strokeWidth={iconStroke}
        className="shrink-0"
        aria-hidden="true"
      />
    )

    const body = (
      <>
        {iconEl}
        {!collapsed && (
          <span className="flex-1 truncate text-left">{label}</span>
        )}
        {!collapsed && locked && (
          <Lock
            size={13}
            strokeWidth={1.5}
            className={cn(
              "shrink-0",
              active ? "text-white/70" : "text-text-subtle",
            )}
            aria-hidden="true"
          />
        )}
        {!collapsed && badge !== undefined && badge !== null && (
          <span
            className={cn(
              "shrink-0 rounded-xs px-[6px] py-[1px] text-[10.5px] font-semibold tracking-[0.2px] tabular-nums",
              active
                ? "bg-white/15 text-white"
                : "bg-chip text-text-muted",
            )}
          >
            {badge}
          </span>
        )}
      </>
    )

    const commonProps = {
      "aria-current": active ? ("page" as const) : undefined,
      "aria-disabled": locked && !onLockedClick ? true : undefined,
      "data-active": active ? "true" : undefined,
      "data-locked": locked ? "true" : undefined,
      "data-collapsed": collapsed ? "true" : undefined,
      title: collapsed ? label : undefined,
      ...rest,
    }

    // Locked → button that invokes the upgrade handler (prevents navigation).
    if (locked) {
      return (
        <button
          ref={ref as React.Ref<HTMLButtonElement>}
          type="button"
          className={shell}
          onClick={(event) => {
            onClick?.(event)
            onLockedClick?.()
          }}
          {...commonProps}
        >
          {body}
        </button>
      )
    }

    if (href) {
      return (
        <Link
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          className={shell}
          onClick={onClick}
          {...commonProps}
        >
          {body}
        </Link>
      )
    }

    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type="button"
        className={shell}
        onClick={onClick}
        {...commonProps}
      >
        {body}
      </button>
    )
  },
)

export { SidebarItem }
