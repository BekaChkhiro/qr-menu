import type { Metadata } from "next"
import { TrendingUp, Coffee, QrCode, Users } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { StatusPill } from "@/components/ui/status-pill"
import { Tag } from "@/components/ui/tag"
import { Avatar, AvatarStack } from "@/components/ui/avatar"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { StatCard } from "@/components/ui/stat-card"
import { Pagination, PaginationPrevNext } from "@/components/ui/pagination"
import { SortHeader } from "@/components/ui/sort-header"
import { InteractiveSection } from "./interactive-section"

export const metadata: Metadata = {
  title: "Data Display Showcase — T10.4",
}

// ── Section headings ─────────────────────────────────────────────────────────

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

function Cell({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex items-center min-h-[44px]">{children}</div>
      <span className="text-[11px] text-text-subtle whitespace-nowrap">
        {label}
      </span>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function DataDisplayShowcasePage() {
  return (
    <main
      data-testid="data-display-showcase"
      className="min-h-screen bg-bg text-text-default px-6 py-12 font-sans"
    >
      <div className="max-w-6xl mx-auto space-y-16">
        {/* Header */}
        <header>
          <p className="text-overline uppercase tracking-widest text-text-muted mb-2">
            T10.4 Component Library
          </p>
          <h1 className="text-display text-text-default">Data Display</h1>
          <p className="text-body text-text-muted mt-2">
            Visual smoke-test for Playwright baselines. Badges, status pills,
            tags, avatars, breadcrumbs, tabs, stat cards, pagination, and
            sortable table headers. Not linked from navigation.
          </p>
        </header>

        {/* ── Badges ──────────────────────────────────────────────────── */}
        <section aria-labelledby="badges-heading">
          <SectionHeading>
            <span id="badges-heading">Badges — tones &amp; shapes</span>
          </SectionHeading>
          <div className="bg-card border border-border rounded-card p-6">
            <SubHeading>Tones</SubHeading>
            <div className="flex flex-wrap gap-6 mb-8">
              <Cell label="neutral">
                <Badge>Draft</Badge>
              </Cell>
              <Cell label="success">
                <Badge variant="success">Published</Badge>
              </Cell>
              <Cell label="warning">
                <Badge variant="warning">Low stock</Badge>
              </Cell>
              <Cell label="danger">
                <Badge variant="danger">86&apos;d</Badge>
              </Cell>
              <Cell label="accent">
                <Badge variant="accent">New</Badge>
              </Cell>
              <Cell label="solid">
                <Badge variant="solid">PRO</Badge>
              </Cell>
            </div>

            <SubHeading>Plan tiers (FREE / STARTER / PRO)</SubHeading>
            <div className="flex flex-wrap gap-6 mb-8">
              <Cell label="FREE">
                <Badge variant="neutral">FREE</Badge>
              </Cell>
              <Cell label="STARTER">
                <Badge variant="accent">STARTER</Badge>
              </Cell>
              <Cell label="PRO">
                <Badge variant="solid">PRO</Badge>
              </Cell>
            </div>

            <SubHeading>Shapes</SubHeading>
            <div className="flex flex-wrap gap-6">
              <Cell label="rect (default)">
                <Badge variant="success">Active</Badge>
              </Cell>
              <Cell label="pill">
                <Badge variant="success" pill>
                  Active
                </Badge>
              </Cell>
            </div>
          </div>
        </section>

        {/* ── Status pills ───────────────────────────────────────────── */}
        <section aria-labelledby="status-heading">
          <SectionHeading>
            <span id="status-heading">Status pills</span>
          </SectionHeading>
          <div className="flex flex-wrap gap-6 bg-card border border-border rounded-card p-6">
            <Cell label="published">
              <StatusPill status="published" />
            </Cell>
            <Cell label="active">
              <StatusPill status="active" />
            </Cell>
            <Cell label="draft">
              <StatusPill status="draft" />
            </Cell>
            <Cell label="scheduled">
              <StatusPill status="scheduled" />
            </Cell>
            <Cell label="archived">
              <StatusPill status="archived" />
            </Cell>
            <Cell label="ended">
              <StatusPill status="ended" />
            </Cell>
          </div>
        </section>

        {/* ── Tags / chips ───────────────────────────────────────────── */}
        <section aria-labelledby="tags-heading">
          <SectionHeading>
            <span id="tags-heading">Tags &amp; chips</span>
          </SectionHeading>
          <div className="flex flex-wrap gap-6 bg-card border border-border rounded-card p-6">
            <Cell label="default">
              <Tag>Vegan</Tag>
            </Cell>
            <Cell label="removable">
              <Tag removable>Gluten-free</Tag>
            </Cell>
            <Cell label="accent">
              <Tag tone="accent">Featured</Tag>
            </Cell>
            <Cell label="success">
              <Tag tone="success">In stock</Tag>
            </Cell>
            <Cell label="warning">
              <Tag tone="warning">Limited</Tag>
            </Cell>
            <Cell label="danger">
              <Tag tone="danger">Out of stock</Tag>
            </Cell>
            <Cell label="suggest">
              <Tag tone="suggest">+ Add tag</Tag>
            </Cell>
            <Cell label="group">
              <div className="flex items-center gap-2">
                <Tag>Georgian</Tag>
                <Tag>Brunch</Tag>
                <Tag>Coffee</Tag>
              </div>
            </Cell>
          </div>
        </section>

        {/* ── Avatars ────────────────────────────────────────────────── */}
        <section aria-labelledby="avatars-heading">
          <SectionHeading>
            <span id="avatars-heading">Avatars</span>
          </SectionHeading>
          <div className="bg-card border border-border rounded-card p-6 space-y-8">
            <div>
              <SubHeading>Sizes (xs 24 / sm 32 / md 40 / lg 56 / xl 72)</SubHeading>
              <div className="flex flex-wrap items-end gap-6">
                <Cell label="xs · 24px">
                  <Avatar size="xs" name="Nino Kapanadze" />
                </Cell>
                <Cell label="sm · 32px">
                  <Avatar size="sm" name="Nino Kapanadze" />
                </Cell>
                <Cell label="md · 40px">
                  <Avatar size="md" name="Giorgi Beridze" bg="#8B6F3A" />
                </Cell>
                <Cell label="lg · 56px">
                  <Avatar size="lg" name="Natia Tsereteli" bg="#3F7E3F" />
                </Cell>
                <Cell label="xl · 72px">
                  <Avatar size="xl" name="Nino Kapanadze" />
                </Cell>
              </div>
            </div>

            <div>
              <SubHeading>With status indicator</SubHeading>
              <div className="flex flex-wrap items-end gap-6">
                <Cell label="online">
                  <Avatar size="md" name="Nino Kapanadze" status="online" />
                </Cell>
                <Cell label="offline">
                  <Avatar size="md" name="Giorgi Beridze" bg="#8B6F3A" status="offline" />
                </Cell>
              </div>
            </div>

            <div>
              <SubHeading>Stack with +N overflow</SubHeading>
              <div className="flex flex-wrap items-end gap-6">
                <Cell label="3 of 3">
                  <AvatarStack size="sm">
                    <Avatar size="sm" name="Nino Kapanadze" />
                    <Avatar size="sm" name="Giorgi Beridze" bg="#8B6F3A" />
                    <Avatar size="sm" name="Natia Tsereteli" bg="#3F7E3F" />
                  </AvatarStack>
                </Cell>
                <Cell label="3 of 6 (+3)">
                  <AvatarStack size="sm" max={3}>
                    <Avatar size="sm" name="Nino Kapanadze" />
                    <Avatar size="sm" name="Giorgi Beridze" bg="#8B6F3A" />
                    <Avatar size="sm" name="Natia Tsereteli" bg="#3F7E3F" />
                    <Avatar size="sm" name="Tinatin K" bg="#B87A1D" />
                    <Avatar size="sm" name="Davit L" bg="#B8423D" />
                    <Avatar size="sm" name="Ana M" bg="#18181B" />
                  </AvatarStack>
                </Cell>
              </div>
            </div>
          </div>
        </section>

        {/* ── Breadcrumbs ─────────────────────────────────────────────── */}
        <section aria-labelledby="breadcrumbs-heading">
          <SectionHeading>
            <span id="breadcrumbs-heading">Breadcrumbs</span>
          </SectionHeading>
          <div className="bg-card border border-border rounded-card p-6 space-y-6">
            <div>
              <SubHeading>2-level</SubHeading>
              <Breadcrumbs
                items={[
                  { label: "Menus", href: "/admin/menus" },
                  { label: "Main menu" },
                ]}
              />
            </div>
            <div>
              <SubHeading>3-level</SubHeading>
              <Breadcrumbs
                items={[
                  { label: "Café Linville", href: "/admin" },
                  { label: "Menus", href: "/admin/menus" },
                  { label: "Main menu" },
                ]}
              />
            </div>
            <div>
              <SubHeading>Long-name truncation (maxLabelWidth=120)</SubHeading>
              <Breadcrumbs
                maxLabelWidth={120}
                items={[
                  { label: "Café Linville", href: "/admin" },
                  {
                    label:
                      "Main seasonal menu with a very long name that does not fit",
                  },
                ]}
              />
            </div>
          </div>
        </section>

        {/* ── Tabs ────────────────────────────────────────────────────── */}
        <section aria-labelledby="tabs-heading">
          <SectionHeading>
            <span id="tabs-heading">Tabs</span>
          </SectionHeading>
          <div className="bg-card border border-border rounded-card p-6 space-y-8">
            <div>
              <SubHeading>Underline (page-level editor tabs)</SubHeading>
              <Tabs defaultValue="analytics">
                <TabsList variant="underline">
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="branding">Branding</TabsTrigger>
                  <TabsTrigger value="languages">Languages</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  <TabsTrigger value="promotions">Promotions</TabsTrigger>
                  <TabsTrigger value="qr">QR</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div>
              <SubHeading>Pill (shadcn default, existing callers)</SubHeading>
              <Tabs defaultValue="overview">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div>
              <SubHeading>Vertical (settings nav rail)</SubHeading>
              <div className="max-w-[220px]">
                <Tabs defaultValue="profile">
                  <TabsList variant="vertical">
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    <TabsTrigger value="business">Business info</TabsTrigger>
                    <TabsTrigger value="billing">Plan &amp; billing</TabsTrigger>
                    <TabsTrigger value="team">Team</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stat cards ──────────────────────────────────────────────── */}
        <section aria-labelledby="statcards-heading">
          <SectionHeading>
            <span id="statcards-heading">Stat cards</span>
          </SectionHeading>
          <div className="bg-card border border-border rounded-card p-6 space-y-8">
            <div>
              <SubHeading>Number-only</SubHeading>
              <div className="flex flex-wrap gap-4">
                <StatCard label="Active menus" value="4" />
                <StatCard label="Top item" value="Khachapuri" />
              </div>
            </div>

            <div>
              <SubHeading>Number + delta + sparkline</SubHeading>
              <div className="flex flex-wrap gap-4">
                <StatCard
                  label="Scans today"
                  value="1,284"
                  delta="↑ 12% vs yesterday"
                  tone="up"
                  sparkline={[12, 18, 14, 22, 28, 24, 32, 38, 34, 42]}
                />
                <StatCard
                  label="Avg. time on menu"
                  value="2:18"
                  delta="↓ 4% vs last week"
                  tone="down"
                  sparkline={[42, 38, 40, 34, 30, 28, 24, 22, 20, 18]}
                />
                <StatCard
                  label="Revenue"
                  value="5,820 ₾"
                  delta="No change"
                  tone="flat"
                />
              </div>
            </div>

            <div>
              <SubHeading>Number + icon</SubHeading>
              <div className="flex flex-wrap gap-4">
                <StatCard label="Total scans" value="12,480" icon={QrCode} />
                <StatCard label="Team size" value="6" icon={Users} />
                <StatCard
                  label="Top category"
                  value="Coffee"
                  icon={Coffee}
                  delta="↑ 18%"
                  tone="up"
                />
                <StatCard
                  label="Growth"
                  value="+24%"
                  icon={TrendingUp}
                  delta="Week over week"
                  tone="up"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── Pagination ──────────────────────────────────────────────── */}
        <section aria-labelledby="pagination-heading">
          <SectionHeading>
            <span id="pagination-heading">Pagination</span>
          </SectionHeading>
          <div className="bg-card border border-border rounded-card p-6 space-y-8">
            <div>
              <SubHeading>Numbered (page 1 of 12)</SubHeading>
              <Pagination total={12} page={1} />
            </div>
            <div>
              <SubHeading>Numbered (page 5 of 12 — ellipsis both sides)</SubHeading>
              <Pagination total={12} page={5} />
            </div>
            <div>
              <SubHeading>Prev/next + counter</SubHeading>
              <PaginationPrevNext page={1} pageSize={10} total={200} />
            </div>
          </div>
        </section>

        {/* ── Sortable table headers ──────────────────────────────────── */}
        <section aria-labelledby="sort-heading">
          <SectionHeading>
            <span id="sort-heading">Sortable table headers</span>
          </SectionHeading>
          <div className="flex flex-wrap gap-8 bg-card border border-border rounded-card p-6">
            <Cell label="unsorted">
              <SortHeader label="Name" />
            </Cell>
            <Cell label="ascending">
              <SortHeader label="Name" direction="asc" />
            </Cell>
            <Cell label="descending">
              <SortHeader label="Price" direction="desc" />
            </Cell>
          </div>
        </section>

        {/* Interactive region — used by Playwright functional tests only */}
        <InteractiveSection />
      </div>
    </main>
  )
}
