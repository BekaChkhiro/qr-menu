"use client"

import * as React from "react"
import {
  BarChart3,
  Home,
  LayoutDashboard,
  Menu as MenuIcon,
  QrCode,
  Settings,
  Tag,
  User,
} from "lucide-react"

import { SidebarItem } from "@/components/ui/sidebar-item"
import { TopBar } from "@/components/ui/top-bar"
import { EditorTabBar } from "@/components/ui/editor-tab-bar"
import { MobileTabBar } from "@/components/ui/mobile-tab-bar"
import { InteractiveSection } from "./interactive-section"

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-h2 text-text-default mb-4 pb-2 border-b border-border">
      {children}
    </h2>
  )
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-caption font-semibold text-text-muted uppercase tracking-wider mb-3">
      {children}
    </h3>
  )
}

function SidebarFrame({
  children,
  collapsed,
  width,
}: {
  children: React.ReactNode
  collapsed?: boolean
  width?: number
}) {
  return (
    <div
      className="rounded-card border border-border bg-[#FCFBF8] p-3"
      style={{ width: width ?? (collapsed ? 72 : 220) }}
    >
      <div className="flex flex-col gap-[2px]">{children}</div>
    </div>
  )
}

export function ShowcaseBody() {
  return (
    <main
      data-testid="navigation-showcase"
      className="min-h-screen bg-bg text-text-default px-6 py-12 font-sans"
    >
      <div className="max-w-6xl mx-auto space-y-16">
        {/* Header */}
        <header>
          <p className="text-overline uppercase tracking-widest text-text-muted mb-2">
            T10.6 Component Library
          </p>
          <h1 className="text-display text-text-default">Navigation</h1>
          <p className="text-body text-text-muted mt-2">
            Visual smoke-test for Playwright baselines. Sidebar item, top bar,
            editor tab bar (7 tabs), and mobile bottom tab bar (4 tabs). Not
            linked from navigation.
          </p>
        </header>

        {/* ── Sidebar item — states ──────────────────────────────────────── */}
        <section aria-labelledby="sidebaritem-heading">
          <SectionHeading>
            <span id="sidebaritem-heading">Sidebar item — states</span>
          </SectionHeading>

          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <SubHeading>Expanded (default / active / locked / with badge)</SubHeading>
              <SidebarFrame>
                <SidebarItem icon={LayoutDashboard} label="Dashboard" />
                <SidebarItem icon={MenuIcon} label="Menus" badge="3" />
                <SidebarItem icon={BarChart3} label="Analytics" active />
                <SidebarItem icon={Tag} label="Promotions" locked />
                <SidebarItem icon={Settings} label="Settings" />
              </SidebarFrame>
            </div>

            <div>
              <SubHeading>Collapsed (icon-only, 64px-wide rail)</SubHeading>
              <SidebarFrame collapsed width={72}>
                <SidebarItem icon={LayoutDashboard} label="Dashboard" collapsed />
                <SidebarItem icon={MenuIcon} label="Menus" collapsed />
                <SidebarItem icon={BarChart3} label="Analytics" collapsed active />
                <SidebarItem icon={Settings} label="Settings" collapsed />
              </SidebarFrame>
            </div>
          </div>
        </section>

        {/* ── Top bar ───────────────────────────────────────────────────── */}
        <section aria-labelledby="topbar-heading">
          <SectionHeading>
            <span id="topbar-heading">Top bar — shell header</span>
          </SectionHeading>

          <div className="space-y-6">
            <div>
              <SubHeading>Default (crumbs · search · notifications · user)</SubHeading>
              <div className="rounded-card border border-border overflow-hidden">
                <TopBar
                  crumbs={[
                    { label: "Café Linville", href: "/admin" },
                    { label: "Menus", href: "/admin/menus" },
                    { label: "Main menu" },
                  ]}
                  userInitials="NK"
                  hasUnreadNotifications
                />
              </div>
            </div>

            <div>
              <SubHeading>Without unread dot, with primary action slot</SubHeading>
              <div className="rounded-card border border-border overflow-hidden">
                <TopBar
                  crumbs={[
                    { label: "Menus", href: "/admin/menus" },
                    { label: "Summer menu" },
                  ]}
                  userInitials="NK"
                  actions={
                    <button
                      type="button"
                      className="rounded-md bg-text-default px-3 py-[6px] text-[13px] font-semibold text-white"
                    >
                      Save changes
                    </button>
                  }
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── Editor tab bar ─────────────────────────────────────────────── */}
        <section aria-labelledby="editortab-heading">
          <SectionHeading>
            <span id="editortab-heading">Editor tab bar — 7 tabs, underline</span>
          </SectionHeading>

          <div className="rounded-card border border-border bg-card px-[14px]">
            <EditorTabBar
              items={[
                { id: "content", label: "Content" },
                { id: "branding", label: "Branding" },
                { id: "languages", label: "Languages" },
                { id: "analytics", label: "Analytics" },
                { id: "promotions", label: "Promotions" },
                { id: "qr", label: "QR" },
                { id: "settings", label: "Settings" },
              ]}
              activeId="analytics"
              aria-label="Showcase editor tabs (analytics active)"
            />
          </div>

          <p className="mt-3 text-caption text-text-muted">
            Tab bar scrolls horizontally when the viewport cannot fit every
            item (scrollbar is hidden — edge fades to the card surface).
          </p>
        </section>

        {/* ── Mobile tab bar ─────────────────────────────────────────────── */}
        <section aria-labelledby="mobiletab-heading">
          <SectionHeading>
            <span id="mobiletab-heading">Mobile tab bar — 4 tabs, bottom</span>
          </SectionHeading>

          <div
            className="mx-auto rounded-[28px] border border-border bg-bg overflow-hidden"
            style={{ width: 375 }}
          >
            <div className="flex h-[160px] items-center justify-center text-caption text-text-subtle">
              (Mobile content area)
            </div>
            <MobileTabBar
              items={[
                { id: "home", label: "Home", icon: Home },
                { id: "menus", label: "Menus", icon: MenuIcon },
                { id: "qr", label: "QR", icon: QrCode },
                { id: "me", label: "Me", icon: User },
              ]}
              activeId="home"
              aria-label="Showcase mobile nav"
            />
          </div>
        </section>

        {/* Interactive region — used by Playwright functional tests only */}
        <InteractiveSection />
      </div>
    </main>
  )
}
