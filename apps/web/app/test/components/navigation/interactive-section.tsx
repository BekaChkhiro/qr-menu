"use client"

import * as React from "react"
import {
  BarChart3,
  Home,
  LayoutDashboard,
  Lock,
  Menu as MenuIcon,
  QrCode,
  Settings,
  Tag,
  User,
} from "lucide-react"

import { SidebarItem } from "@/components/ui/sidebar-item"
import { EditorTabBar } from "@/components/ui/editor-tab-bar"
import { MobileTabBar } from "@/components/ui/mobile-tab-bar"
import { TopBar } from "@/components/ui/top-bar"

/**
 * Client-side interactive region for T10.6 Playwright functional tests.
 *
 * Covers:
 *   - SidebarItem navigation (real anchor targets — click updates URL)
 *   - Active state reflects current "route" (via `?route=<id>` query param)
 *   - Locked SidebarItem opens an upgrade prompt (dialog-style element)
 *   - EditorTabBar keyboard nav + state change
 *   - MobileTabBar tap updates active state
 *   - TopBar search + notifications click handlers fire
 *
 * The "route" is modeled via a search param rather than real routes so the
 * whole suite can run against a single showcase page.
 */

type RouteId = "dashboard" | "menus" | "analytics" | "settings"

const SIDEBAR_ITEMS: Array<{
  id: RouteId
  label: string
  icon: typeof LayoutDashboard
}> = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "menus", label: "Menus", icon: MenuIcon },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
]

const EDITOR_TABS = [
  { id: "content", label: "Content" },
  { id: "branding", label: "Branding" },
  { id: "languages", label: "Languages" },
  { id: "analytics", label: "Analytics" },
  { id: "promotions", label: "Promotions" },
  { id: "qr", label: "QR" },
  { id: "settings", label: "Settings" },
]

const MOBILE_TABS = [
  { id: "home", label: "Home", icon: Home },
  { id: "menus", label: "Menus", icon: MenuIcon },
  { id: "qr", label: "QR", icon: QrCode },
  { id: "me", label: "Me", icon: User },
]

function useRouteParam(): RouteId {
  const [route, setRoute] = React.useState<RouteId>("dashboard")

  React.useEffect(() => {
    const read = () => {
      const params = new URLSearchParams(window.location.search)
      const r = (params.get("route") as RouteId | null) ?? "dashboard"
      setRoute(r)
    }
    read()
    window.addEventListener("popstate", read)
    // SidebarItem uses Link which fires its own navigation; listen for URL
    // changes via the `navigate` event Next.js dispatches.
    const original = window.history.pushState
    window.history.pushState = function patched(...args) {
      const result = original.apply(this, args)
      read()
      return result
    }
    return () => {
      window.removeEventListener("popstate", read)
      window.history.pushState = original
    }
  }, [])

  return route
}

export function InteractiveSection() {
  const route = useRouteParam()
  const [activeTab, setActiveTab] = React.useState("content")
  const [mobileTab, setMobileTab] = React.useState("home")
  const [upgradeOpen, setUpgradeOpen] = React.useState(false)
  const [log, setLog] = React.useState<string[]>([])

  const append = (entry: string) =>
    setLog((prev) => [...prev, entry].slice(-20))

  return (
    <section
      aria-labelledby="interactive-heading"
      data-testid="interactive-section"
      className="space-y-10"
    >
      <h2
        id="interactive-heading"
        className="text-h2 text-text-default mb-4 pb-2 border-b border-border"
      >
        Interactive tests
      </h2>

      {/* ── Sidebar — routing + active state + locked upgrade ─────────── */}
      <div className="grid gap-6 md:grid-cols-[260px,1fr]">
        <div>
          <h3 className="text-caption font-semibold text-text-muted uppercase tracking-wider mb-3">
            Sidebar — click navigates (href updates URL)
          </h3>

          <div
            data-testid="sidebar-frame"
            className="flex flex-col gap-[2px] rounded-card border border-border bg-[#FCFBF8] p-3 w-[220px]"
          >
            {SIDEBAR_ITEMS.map((item) => (
              <SidebarItem
                key={item.id}
                icon={item.icon}
                label={item.label}
                href={`?route=${item.id}#interactive-heading`}
                active={route === item.id}
                data-testid={`sidebar-${item.id}`}
              />
            ))}

            {/* Locked item — clicking opens upgrade prompt instead of navigating */}
            <SidebarItem
              icon={Tag}
              label="Promotions"
              locked
              onLockedClick={() => {
                setUpgradeOpen(true)
                append("locked:promotions")
              }}
              data-testid="sidebar-promotions-locked"
            />
          </div>
        </div>

        <div>
          <h3 className="text-caption font-semibold text-text-muted uppercase tracking-wider mb-3">
            Current route (derived from `?route=` param)
          </h3>
          <p
            data-testid="active-route"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-body"
          >
            route = <code className="font-mono text-[12.5px]">{route}</code>
          </p>

          {upgradeOpen && (
            <div
              data-testid="upgrade-prompt"
              role="dialog"
              aria-modal="true"
              aria-labelledby="upgrade-title"
              className="mt-4 flex items-start gap-3 rounded-card border border-accent/40 bg-accent-soft p-4"
            >
              <Lock size={16} strokeWidth={1.5} className="text-accent mt-[2px]" />
              <div className="flex-1">
                <h4
                  id="upgrade-title"
                  className="text-[13px] font-semibold text-text-default"
                >
                  Upgrade to unlock Promotions
                </h4>
                <p className="mt-1 text-caption text-text-muted">
                  Promotions are available on the STARTER plan and above.
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    data-testid="upgrade-confirm"
                    className="rounded-md bg-text-default px-3 py-[6px] text-[12.5px] font-semibold text-white"
                    onClick={() => {
                      append("upgrade:confirm")
                      setUpgradeOpen(false)
                    }}
                  >
                    See plans
                  </button>
                  <button
                    type="button"
                    data-testid="upgrade-dismiss"
                    className="rounded-md border border-border bg-card px-3 py-[6px] text-[12.5px] font-medium text-text-default"
                    onClick={() => setUpgradeOpen(false)}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── TopBar — search + notification click wiring ───────────────── */}
      <div>
        <h3 className="text-caption font-semibold text-text-muted uppercase tracking-wider mb-3">
          TopBar — search / notifications click
        </h3>
        <div className="rounded-card border border-border overflow-hidden">
          <TopBar
            crumbs={[
              { label: "Menus", href: "/admin/menus" },
              { label: "Main menu" },
            ]}
            userInitials="NK"
            hasUnreadNotifications
            onSearchClick={() => append("topbar:search")}
            onNotificationsClick={() => append("topbar:notifications")}
            onUserClick={() => append("topbar:user")}
          />
        </div>
      </div>

      {/* ── EditorTabBar — change + keyboard nav ──────────────────────── */}
      <div>
        <h3 className="text-caption font-semibold text-text-muted uppercase tracking-wider mb-3">
          EditorTabBar — change active via click or ArrowRight/ArrowLeft
        </h3>
        <p
          data-testid="editor-active-tab"
          className="mb-2 text-caption text-text-muted"
        >
          Active tab: <code className="font-mono text-[12.5px]">{activeTab}</code>
        </p>
        <div className="rounded-card border border-border bg-card px-[14px]">
          <EditorTabBar
            items={EDITOR_TABS}
            activeId={activeTab}
            onChange={(id) => {
              setActiveTab(id)
              append(`editor:${id}`)
            }}
            aria-label="Interactive editor tabs"
          />
        </div>
      </div>

      {/* ── MobileTabBar — change active ──────────────────────────────── */}
      <div>
        <h3 className="text-caption font-semibold text-text-muted uppercase tracking-wider mb-3">
          MobileTabBar — tap updates active tab
        </h3>
        <p
          data-testid="mobile-active-tab"
          className="mb-2 text-caption text-text-muted"
        >
          Active mobile tab: <code className="font-mono text-[12.5px]">{mobileTab}</code>
        </p>
        <div
          className="mx-auto rounded-[28px] border border-border bg-bg overflow-hidden"
          style={{ width: 375 }}
        >
          <div className="flex h-[100px] items-center justify-center text-caption text-text-subtle">
            (Mobile content)
          </div>
          <MobileTabBar
            items={MOBILE_TABS}
            activeId={mobileTab}
            onChange={(id) => {
              setMobileTab(id)
              append(`mobile:${id}`)
            }}
            aria-label="Interactive mobile nav"
          />
        </div>
      </div>

      {/* ── Action log — consumed by Playwright assertions ────────────── */}
      <div>
        <h3 className="text-caption font-semibold text-text-muted uppercase tracking-wider mb-3">
          Action log
        </h3>
        <ul
          data-testid="action-log"
          className="rounded-card border border-border bg-card p-4 font-mono text-[12.5px] text-text-muted min-h-[60px]"
        >
          {log.length === 0 ? (
            <li className="text-text-subtle">(no actions yet)</li>
          ) : (
            log.map((entry, i) => (
              <li key={i} data-log-entry={entry}>
                &gt; {entry}
              </li>
            ))
          )}
        </ul>
      </div>
    </section>
  )
}
