import type { Metadata } from "next"
import {
  AlertTriangle,
  Copy,
  Edit3,
  MoreHorizontal,
  MoveRight,
  Save,
  Search,
  Trash2,
  Utensils,
  Plus,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Kbd, KbdCombo } from "@/components/ui/kbd"
import { InteractiveSection } from "./interactive-section"

export const metadata: Metadata = {
  title: "Overlays Showcase — T10.5",
}

// ── Shared heading primitives ──────────────────────────────────────────────

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

// ── Static visual baselines (no trigger clicks — we render the chrome
//    directly so the Playwright screenshot captures it deterministically). ──

function DialogBaselineCard() {
  return (
    <div
      className="w-[440px] bg-card border border-border rounded-[12px] shadow-xl overflow-hidden"
      role="img"
      aria-label="Dialog baseline"
    >
      <div className="px-[22px] pt-[20px] pb-[14px]">
        <div className="flex h-9 w-9 items-center justify-center rounded-md mb-3 bg-danger-soft text-danger">
          <AlertTriangle size={16} strokeWidth={1.5} />
        </div>
        <div className="text-[16px] font-semibold text-text-default">
          Delete this menu?
        </div>
        <p className="text-body text-text-muted mt-1.5">
          All 28 items, categories, and QR-code history will be deleted
          immediately. This can&apos;t be undone.
        </p>
      </div>
      <div className="flex items-center justify-end gap-2 bg-[#FCFBF8] border-t border-border px-[22px] py-3">
        <Button variant="secondary">Cancel</Button>
        <Button variant="destructive">Delete menu</Button>
      </div>
    </div>
  )
}

function DrawerBaselineCard() {
  return (
    <div
      className="w-[360px] h-[320px] bg-card border border-border rounded-[10px] shadow-lg overflow-hidden flex flex-col"
      role="img"
      aria-label="Drawer baseline"
    >
      <div className="px-[18px] py-[14px] border-b border-border flex items-center justify-between">
        <div>
          <div className="text-overline uppercase tracking-[0.6px] text-text-subtle">
            Editing item
          </div>
          <div className="text-[14px] font-semibold text-text-default mt-0.5">
            Khachapuri Adjaruli
          </div>
        </div>
        <span className="text-text-muted" aria-hidden="true">
          ✕
        </span>
      </div>
      <div className="flex-1 p-[18px] flex flex-col gap-3">
        <div>
          <div className="text-[11px] font-semibold text-text-muted mb-1.5">
            Name
          </div>
          <div className="h-9 rounded-md border border-border bg-card px-3 flex items-center text-body">
            Khachapuri Adjaruli
          </div>
        </div>
        <div>
          <div className="text-[11px] font-semibold text-text-muted mb-1.5">
            Price
          </div>
          <div className="h-9 rounded-md border border-border bg-card px-3 flex items-center text-body tabular-nums">
            18 ₾
          </div>
        </div>
      </div>
      <div className="px-[18px] py-3 bg-[#FCFBF8] border-t border-border flex items-center justify-end gap-2">
        <Button variant="secondary" size="sm">
          Cancel
        </Button>
        <Button variant="primary" size="sm">
          Save
        </Button>
      </div>
    </div>
  )
}

function PopoverBaselineCard() {
  return (
    <div
      className="relative w-[240px] bg-card border border-border rounded-[10px] shadow-md p-[14px] mt-4"
      role="img"
      aria-label="Popover baseline"
    >
      {/* Arrow — 12px square rotated 45° with border-left/top */}
      <div
        className="absolute -top-[7px] left-6 w-3 h-3 bg-card border-l border-t border-border"
        style={{ transform: "rotate(45deg)" }}
      />
      <div className="text-[12.5px] font-semibold text-text-default mb-1">
        Price range
      </div>
      <p className="text-[11.5px] leading-[1.45] text-text-muted">
        Shown on your menu as dollar signs. Customers use this to set
        expectations.
      </p>
      <div className="mt-2.5 flex gap-1.5">
        {["$", "$$", "$$$", "$$$$"].map((p, i) => (
          <div
            key={p}
            className={`h-7 px-3 rounded-sm text-caption font-semibold border border-border inline-flex items-center ${
              i === 1
                ? "bg-card text-text-default"
                : "bg-chip text-text-muted"
            }`}
          >
            {p}
          </div>
        ))}
      </div>
    </div>
  )
}

function TooltipBaselineCard() {
  return (
    <div
      className="relative inline-block px-[9px] py-[5px] bg-text-default text-white rounded-[5px] text-[11.5px] font-medium"
      role="img"
      aria-label="Tooltip baseline"
    >
      Save · ⌘S
      <div
        className="absolute -bottom-1 left-5 w-2 h-2 bg-text-default"
        style={{ transform: "rotate(45deg)" }}
      />
    </div>
  )
}

function KebabBaselineCard() {
  const items = [
    { l: "Edit", I: Edit3 },
    { l: "Duplicate", I: Copy },
    { l: "Move to…", I: MoveRight },
  ]
  return (
    <div
      className="w-[180px] bg-card border border-border rounded-md shadow-md p-1"
      role="img"
      aria-label="Kebab menu baseline"
    >
      {items.map((m) => (
        <div
          key={m.l}
          className="flex items-center gap-[9px] px-[10px] py-[7px] rounded-[5px] text-[13px] text-text-default"
        >
          <m.I size={13} strokeWidth={1.5} className="text-text-muted" />
          {m.l}
        </div>
      ))}
      <div className="-mx-1 my-1 h-px bg-border" />
      <div className="flex items-center gap-[9px] px-[10px] py-[7px] rounded-[5px] text-[13px] text-danger">
        <Trash2 size={13} strokeWidth={1.5} />
        Delete
      </div>
    </div>
  )
}

function PaletteBaselineCard() {
  return (
    <div
      className="w-[460px] bg-card border border-border rounded-[12px] shadow-xl overflow-hidden"
      role="img"
      aria-label="Command palette baseline"
    >
      <div className="flex items-center gap-[10px] px-4 py-[14px] border-b border-border">
        <Search size={15} strokeWidth={1.5} className="text-text-muted" />
        <div className="flex-1 text-[14px] text-text-default">khacha</div>
        <Kbd small>esc</Kbd>
      </div>
      <div className="p-[6px]">
        <div className="px-[10px] py-1 text-[10px] font-bold uppercase tracking-[0.6px] text-text-subtle">
          Items
        </div>
        <div className="flex items-center gap-[10px] rounded-[6px] px-[10px] py-2 bg-chip">
          <Utensils size={14} strokeWidth={1.5} className="text-text-muted" />
          <div className="flex-1">
            <div className="text-[13px] font-medium text-text-default">
              Khachapuri Adjaruli
            </div>
            <div className="text-[11px] text-text-muted mt-[1px]">
              Main menu · Breads
            </div>
          </div>
          <MoveRight size={12} className="text-text-muted" />
        </div>
        <div className="flex items-center gap-[10px] rounded-[6px] px-[10px] py-2">
          <Utensils size={14} strokeWidth={1.5} className="text-text-muted" />
          <div className="flex-1">
            <div className="text-[13px] font-medium text-text-default">
              Khachapuri Imeruli
            </div>
            <div className="text-[11px] text-text-muted mt-[1px]">
              Main menu · Breads
            </div>
          </div>
        </div>
        <div className="px-[10px] pt-1 pb-1 text-[10px] font-bold uppercase tracking-[0.6px] text-text-subtle">
          Actions
        </div>
        <div className="flex items-center gap-[10px] rounded-[6px] px-[10px] py-2">
          <Plus size={14} strokeWidth={1.5} className="text-text-muted" />
          <div className="flex-1 text-[13px] text-text-default">
            Create item &quot;khacha&quot;…
          </div>
        </div>
      </div>
      <div className="flex items-center gap-[14px] px-[14px] py-2 bg-[#FCFBF8] border-t border-border text-[11px] text-text-muted">
        <span className="inline-flex items-center gap-[5px]">
          <Kbd small>↑↓</Kbd> navigate
        </span>
        <span className="inline-flex items-center gap-[5px]">
          <Kbd small>↵</Kbd> open
        </span>
        <span className="ml-auto inline-flex items-center gap-[5px]">
          <KbdCombo keys={["⌘", "K"]} small />
        </span>
      </div>
    </div>
  )
}

function KbdBaselineCard() {
  return (
    <div className="flex flex-wrap items-center gap-5 bg-card border border-border rounded-card p-4">
      <span className="inline-flex items-center gap-2 text-caption text-text-muted">
        <span>single key</span>
        <Kbd>⌘</Kbd>
      </span>
      <span className="inline-flex items-center gap-2 text-caption text-text-muted">
        <span>letter</span>
        <Kbd>K</Kbd>
      </span>
      <span className="inline-flex items-center gap-2 text-caption text-text-muted">
        <span>long</span>
        <Kbd>esc</Kbd>
      </span>
      <span className="inline-flex items-center gap-2 text-caption text-text-muted">
        <span>shortcut</span>
        <KbdCombo keys={["⌘", "S"]} />
      </span>
      <span className="inline-flex items-center gap-2 text-caption text-text-muted">
        <span>3-key</span>
        <KbdCombo keys={["⇧", "⌘", "P"]} />
      </span>
      <span className="inline-flex items-center gap-2 text-caption text-text-muted">
        <span>small</span>
        <Kbd small>esc</Kbd>
      </span>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function OverlaysShowcasePage() {
  // Avoid unused-import lint noise — MoreHorizontal is rendered as a visual
  // hint below.
  void MoreHorizontal

  return (
    <main
      data-testid="overlays-showcase"
      className="min-h-screen bg-bg text-text-default px-6 py-12 font-sans"
    >
      <div className="max-w-6xl mx-auto space-y-16">
        {/* Header */}
        <header>
          <p className="text-overline uppercase tracking-widest text-text-muted mb-2">
            T10.5 Component Library · Overlays
          </p>
          <h1 className="text-display text-text-default">Overlays</h1>
          <p className="text-body text-text-muted mt-2 max-w-[720px]">
            Visual smoke-test for Dialog · Drawer · Popover · Tooltip · Kebab
            menu · Command palette. The top section renders static baselines
            (no interaction required) so the Playwright screenshot is stable;
            the bottom section has real triggers that the functional tests
            click, type into, and key-navigate.
          </p>
        </header>

        {/* ── Static visual baselines ─────────────────────────────────── */}
        <section aria-labelledby="baseline-heading">
          <SectionHeading>
            <span id="baseline-heading">Static baselines</span>
          </SectionHeading>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div>
              <SubHeading>Dialog · destructive confirm</SubHeading>
              <DialogBaselineCard />
            </div>
            <div>
              <SubHeading>Drawer · side panel</SubHeading>
              <DrawerBaselineCard />
            </div>
            <div>
              <SubHeading>Popover · with arrow</SubHeading>
              <PopoverBaselineCard />
            </div>
            <div>
              <SubHeading>Tooltip · dark default</SubHeading>
              <TooltipBaselineCard />
            </div>
            <div>
              <SubHeading>Kebab / contextual menu</SubHeading>
              <KebabBaselineCard />
            </div>
            <div>
              <SubHeading>⌘K command palette</SubHeading>
              <PaletteBaselineCard />
            </div>
          </div>
        </section>

        {/* ── Kbd primitive ──────────────────────────────────────────── */}
        <section aria-labelledby="kbd-heading">
          <SectionHeading>
            <span id="kbd-heading">Kbd primitive</span>
          </SectionHeading>
          <KbdBaselineCard />
        </section>

        {/* ── Interactive tests (client) ─────────────────────────────── */}
        <InteractiveSection />
      </div>
    </main>
  )
}
