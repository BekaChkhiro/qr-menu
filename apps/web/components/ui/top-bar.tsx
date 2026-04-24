"use client"

import * as React from "react"
import { Bell, Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Breadcrumbs, type BreadcrumbItem } from "@/components/ui/breadcrumbs"

// ── Section H Top Bar (T10.6) ───────────────────────────────────────────────
//
// Admin shell header: breadcrumbs · search · notifications · user avatar.
// Height is fixed at 56px with a bottom border. Consumers pass breadcrumb
// items for the route trail and drop additional action slots through the
// `actions` prop (e.g. a "Save" primary button on the editor).
//
// Design reference:
//   - qr-menu-design/components/admin-shell.jsx lines 4-50 (AdminTopBar)
//   - qr-menu-design/components/component-library-b.jsx lines 268-284 (showcase)

export interface TopBarProps extends React.HTMLAttributes<HTMLElement> {
  crumbs?: BreadcrumbItem[]
  /** Arbitrary nodes rendered between the search and the notifications bell. */
  actions?: React.ReactNode
  searchPlaceholder?: string
  onSearchClick?: () => void
  hasUnreadNotifications?: boolean
  onNotificationsClick?: () => void
  userInitials?: string
  /** Accent background for the initials avatar. Defaults to `accent` token. */
  userAvatarColor?: string
  onUserClick?: () => void
}

const TopBar = React.forwardRef<HTMLElement, TopBarProps>(function TopBar(
  {
    crumbs,
    actions,
    searchPlaceholder = "Search…",
    onSearchClick,
    hasUnreadNotifications = false,
    onNotificationsClick,
    userInitials,
    userAvatarColor,
    onUserClick,
    className,
    ...rest
  },
  ref,
) {
  return (
    <header
      ref={ref}
      className={cn(
        "flex h-14 shrink-0 items-center gap-4 border-b border-border bg-bg px-6",
        className,
      )}
      {...rest}
    >
      {crumbs && crumbs.length > 0 ? (
        <Breadcrumbs items={crumbs} data-testid="topbar-breadcrumbs" />
      ) : (
        <div />
      )}

      <div className="flex-1" />

      {actions && (
        <div className="flex items-center gap-2" data-testid="topbar-actions">
          {actions}
        </div>
      )}

      <button
        type="button"
        onClick={onSearchClick}
        data-testid="topbar-search"
        className={cn(
          "hidden md:flex w-[240px] items-center gap-2 rounded-md border border-border bg-card px-[10px] py-[6px] text-left",
          "hover:border-text-subtle transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        )}
      >
        <Search
          size={14}
          strokeWidth={1.5}
          className="shrink-0 text-text-subtle"
          aria-hidden="true"
        />
        <span className="flex-1 truncate text-[13px] text-text-subtle">
          {searchPlaceholder}
        </span>
        <kbd
          className={cn(
            "shrink-0 rounded-xs border border-border px-[5px] py-[1px]",
            "font-mono text-[10px] leading-none text-text-subtle",
          )}
        >
          ⌘K
        </kbd>
      </button>

      <button
        type="button"
        onClick={onNotificationsClick}
        data-testid="topbar-notifications"
        aria-label={
          hasUnreadNotifications
            ? "Notifications (unread)"
            : "Notifications"
        }
        className={cn(
          "relative rounded-md p-2 text-text-default",
          "hover:bg-chip transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        )}
      >
        <Bell size={17} strokeWidth={1.5} aria-hidden="true" />
        {hasUnreadNotifications && (
          <span
            data-testid="topbar-notifications-dot"
            aria-hidden="true"
            className="absolute right-[5px] top-[5px] h-[7px] w-[7px] rounded-full bg-accent ring-[1.5px] ring-bg"
          />
        )}
      </button>

      {userInitials && (
        <button
          type="button"
          onClick={onUserClick}
          data-testid="topbar-user"
          aria-label={`User menu: ${userInitials}`}
          style={userAvatarColor ? { backgroundColor: userAvatarColor } : undefined}
          className={cn(
            "flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-md",
            "text-[11.5px] font-semibold text-white",
            !userAvatarColor && "bg-accent",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
          )}
        >
          {userInitials}
        </button>
      )}
    </header>
  )
})

export { TopBar }
