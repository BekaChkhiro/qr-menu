"use client"

import * as React from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Pagination } from "@/components/ui/pagination"
import { SortHeader, type SortDirection } from "@/components/ui/sort-header"

/**
 * Client-side interactive region used exclusively by Playwright functional
 * tests for T10.4. Covers:
 *   - Tabs keyboard navigation (arrow keys) via the underline Tabs variant
 *   - Pagination prev/next buttons updating page state
 *   - Sort header click cycling unsorted → asc → desc → unsorted
 */
export function InteractiveSection() {
  const [tabValue, setTabValue] = React.useState("content")
  const [page, setPage] = React.useState(1)
  const [sortDir, setSortDir] = React.useState<SortDirection>(null)

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

      {/* ── Tabs (keyboard navigation) ───────────────────────────────────── */}
      <div className="space-y-3">
        <h3 className="text-caption font-semibold text-text-muted uppercase tracking-wider">
          Tabs — keyboard nav
        </h3>
        <p data-testid="tabs-active-value" className="text-caption text-text-muted">
          Active: {tabValue}
        </p>
        <Tabs value={tabValue} onValueChange={setTabValue} className="w-full">
          <TabsList variant="underline" data-testid="tabs-list">
            <TabsTrigger value="content" data-testid="tab-content">
              Content
            </TabsTrigger>
            <TabsTrigger value="branding" data-testid="tab-branding">
              Branding
            </TabsTrigger>
            <TabsTrigger value="languages" data-testid="tab-languages">
              Languages
            </TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics">
              Analytics
            </TabsTrigger>
          </TabsList>
          <TabsContent value="content">Content panel</TabsContent>
          <TabsContent value="branding">Branding panel</TabsContent>
          <TabsContent value="languages">Languages panel</TabsContent>
          <TabsContent value="analytics">Analytics panel</TabsContent>
        </Tabs>
      </div>

      {/* ── Pagination (prev/next click) ────────────────────────────────── */}
      <div className="space-y-3">
        <h3 className="text-caption font-semibold text-text-muted uppercase tracking-wider">
          Pagination — prev / next
        </h3>
        <p data-testid="pagination-page" className="text-caption text-text-muted">
          Current page: {page}
        </p>
        <Pagination total={12} page={page} onPageChange={setPage} />
      </div>

      {/* ── Sort header (click cycles direction) ─────────────────────────── */}
      <div className="space-y-3">
        <h3 className="text-caption font-semibold text-text-muted uppercase tracking-wider">
          Sort header — click to cycle
        </h3>
        <p data-testid="sort-direction" className="text-caption text-text-muted">
          Direction: {sortDir ?? "none"}
        </p>
        <SortHeader
          label="Name"
          direction={sortDir}
          onSortChange={setSortDir}
          data-testid="sort-name"
        />
      </div>
    </section>
  )
}
