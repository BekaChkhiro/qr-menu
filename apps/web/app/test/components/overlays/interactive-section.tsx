"use client"

import * as React from "react"
import {
  AlertTriangle,
  Copy,
  Edit3,
  MoveRight,
  Plus,
  Save,
  Trash2,
  Utensils,
  Settings,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogHeaderBar,
  DialogFooterBar,
  DialogIconTile,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  KebabMenu,
  KebabMenuContent,
  KebabMenuIconTrigger,
  KebabMenuItem,
  KebabMenuSeparator,
} from "@/components/ui/kebab-menu"
import {
  CommandPalette,
  CommandPaletteEmpty,
  CommandPaletteFooter,
  CommandPaletteGroup,
  CommandPaletteInput,
  CommandPaletteItem,
  CommandPaletteList,
  useCommandPaletteHotkey,
} from "@/components/ui/command-palette"
import { Kbd } from "@/components/ui/kbd"

// Keep outer-section heading styles consistent with the button showcase.
function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-caption font-semibold text-text-muted uppercase tracking-wider mb-3">
      {children}
    </h3>
  )
}

// ── Interactive section — each overlay with a trigger + state read-out ───

export function InteractiveSection() {
  const [actionLog, setActionLog] = React.useState<string[]>([])
  const log = React.useCallback((msg: string) => {
    setActionLog((prev) => [msg, ...prev].slice(0, 8))
  }, [])

  const [paletteOpen, setPaletteOpen] = React.useState(false)

  useCommandPaletteHotkey(() => setPaletteOpen((o) => !o))

  return (
    <section
      aria-labelledby="interactive-heading"
      data-testid="interactive-section"
      className="space-y-6"
    >
      <h2
        id="interactive-heading"
        className="text-h2 text-text-default mb-4 pb-2 border-b border-border"
      >
        Interactive tests
      </h2>

      {/* ── Action log — visible so Playwright can read it ──────────── */}
      <div
        data-testid="action-log"
        className="text-caption text-text-muted min-h-[40px] bg-chip/60 rounded-card border border-border p-3"
      >
        {actionLog.length === 0 ? (
          <span className="text-text-subtle">
            No actions yet. Open an overlay to begin.
          </span>
        ) : (
          <ul className="space-y-0.5 font-mono text-[11px]">
            {actionLog.map((m, i) => (
              <li key={`${m}-${i}`}>&gt; {m}</li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Dialog — destructive confirm ─────────────────────────────── */}
      <div className="space-y-3">
        <SubHeading>Dialog · destructive confirm</SubHeading>
        <div className="flex flex-wrap gap-3 bg-card border border-border rounded-card p-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="destructive"
                size="md"
                leadingIcon={Trash2}
                data-testid="open-destructive-dialog"
                onClick={() => log("open:destructive-dialog")}
              >
                Delete menu…
              </Button>
            </DialogTrigger>
            <DialogContent
              hideClose
              className="p-0 gap-0"
              data-testid="destructive-dialog"
              onEscapeKeyDown={() => log("dialog:escape")}
              onPointerDownOutside={() => log("dialog:backdrop-click")}
            >
              <DialogHeaderBar>
                <DialogIconTile variant="danger">
                  <AlertTriangle strokeWidth={1.5} />
                </DialogIconTile>
                <DialogHeader>
                  <DialogTitle className="text-h2">
                    Delete this menu?
                  </DialogTitle>
                  <DialogDescription className="text-body text-text-muted mt-1.5">
                    All 28 items, categories, and QR-code history will be
                    deleted immediately. This can&apos;t be undone.
                  </DialogDescription>
                </DialogHeader>
              </DialogHeaderBar>
              <DialogFooterBar>
                <DialogClose asChild>
                  <Button
                    variant="secondary"
                    data-testid="destructive-dialog-cancel"
                    onClick={() => log("dialog:cancel")}
                  >
                    Cancel
                  </Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button
                    variant="destructive"
                    data-testid="destructive-dialog-confirm"
                    onClick={() => log("dialog:confirm-delete")}
                  >
                    Delete menu
                  </Button>
                </DialogClose>
              </DialogFooterBar>
            </DialogContent>
          </Dialog>

          {/* Info variant — standard dialog with X close ──────────────── */}
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="secondary"
                size="md"
                data-testid="open-info-dialog"
                onClick={() => log("open:info-dialog")}
              >
                What&apos;s new?
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="info-dialog">
              <DialogHeader>
                <DialogTitle>Real-time analytics</DialogTitle>
                <DialogDescription>
                  Your dashboard now updates live as customers scan your QR
                  code. No more refreshing to see today&apos;s numbers.
                </DialogDescription>
              </DialogHeader>
              <DialogClose asChild>
                <Button variant="primary" className="justify-self-end">
                  Got it
                </Button>
              </DialogClose>
            </DialogContent>
          </Dialog>

          {/* Form variant — with body form ────────────────────────────── */}
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="secondary"
                size="md"
                leadingIcon={Edit3}
                data-testid="open-form-dialog"
                onClick={() => log("open:form-dialog")}
              >
                Rename menu…
              </Button>
            </DialogTrigger>
            <DialogContent className="p-0 gap-0" data-testid="form-dialog">
              <DialogHeaderBar>
                <DialogHeader>
                  <DialogTitle className="text-h2">Rename menu</DialogTitle>
                  <DialogDescription className="text-body text-text-muted mt-1.5">
                    The URL stays the same. Only the display name changes.
                  </DialogDescription>
                </DialogHeader>
                <label className="block mt-4">
                  <span className="text-caption font-semibold text-text-muted mb-1.5 block">
                    Menu name
                  </span>
                  <input
                    data-testid="form-dialog-input"
                    type="text"
                    defaultValue="Main menu"
                    className="w-full h-9 rounded-md border border-border bg-card px-3 text-body text-text-default focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </label>
              </DialogHeaderBar>
              <DialogFooterBar>
                <DialogClose asChild>
                  <Button variant="secondary">Cancel</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button variant="primary" leadingIcon={Save}>
                    Save
                  </Button>
                </DialogClose>
              </DialogFooterBar>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ── Sheet / Drawer (right 540px) ─────────────────────────────── */}
      <div className="space-y-3">
        <SubHeading>Sheet · right drawer (540px)</SubHeading>
        <div className="flex flex-wrap gap-3 bg-card border border-border rounded-card p-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="primary"
                size="md"
                leadingIcon={Edit3}
                data-testid="open-drawer"
                onClick={() => log("open:drawer")}
              >
                Edit item…
              </Button>
            </SheetTrigger>
            <SheetContent data-testid="drawer" className="flex flex-col p-0">
              <div className="px-[22px] py-4 border-b border-border">
                <div className="text-overline uppercase tracking-wider text-text-subtle">
                  Editing item
                </div>
                <SheetHeader className="mt-1">
                  <SheetTitle className="text-h2">
                    Khachapuri Adjaruli
                  </SheetTitle>
                  <SheetDescription>
                    Main menu · Breads · Hot starters
                  </SheetDescription>
                </SheetHeader>
              </div>
              <div className="flex-1 px-[22px] py-5 space-y-4 overflow-y-auto">
                <label className="block">
                  <span className="text-caption font-semibold text-text-muted mb-1.5 block">
                    Name
                  </span>
                  <input
                    type="text"
                    defaultValue="Khachapuri Adjaruli"
                    className="w-full h-9 rounded-md border border-border bg-card px-3 text-body text-text-default focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </label>
                <label className="block">
                  <span className="text-caption font-semibold text-text-muted mb-1.5 block">
                    Price (₾)
                  </span>
                  <input
                    type="text"
                    defaultValue="18.00"
                    className="w-full h-9 rounded-md border border-border bg-card px-3 text-body text-text-default tabular-nums focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </label>
              </div>
              <SheetFooter className="px-[22px] py-3 border-t border-border bg-[#FCFBF8] flex-row justify-end gap-2 sm:space-x-0">
                <SheetClose asChild>
                  <Button variant="secondary" size="sm">
                    Cancel
                  </Button>
                </SheetClose>
                <SheetClose asChild>
                  <Button
                    variant="primary"
                    size="sm"
                    leadingIcon={Save}
                    onClick={() => log("drawer:save")}
                  >
                    Save
                  </Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* ── Popover with arrow ──────────────────────────────────────── */}
      <div className="space-y-3">
        <SubHeading>Popover · with arrow</SubHeading>
        <div className="flex flex-wrap gap-3 bg-card border border-border rounded-card p-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="secondary"
                size="md"
                data-testid="open-popover"
                onClick={() => log("open:popover")}
              >
                Price range…
              </Button>
            </PopoverTrigger>
            <PopoverContent
              data-testid="popover"
              align="start"
              sideOffset={8}
            >
              <PopoverTitle>Price range</PopoverTitle>
              <PopoverDescription>
                Shown on your menu as dollar signs. Customers use this to set
                expectations.
              </PopoverDescription>
              <div className="mt-2.5 flex gap-1.5" data-testid="popover-options">
                {["$", "$$", "$$$", "$$$$"].map((p) => (
                  <button
                    key={p}
                    onClick={() => log(`popover:select:${p}`)}
                    className="h-7 px-3 rounded-sm text-caption font-semibold border border-border bg-chip text-text-default hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* ── Tooltip (dark default + light on dark surface) ──────────── */}
      <div className="space-y-3">
        <SubHeading>Tooltip · dark default · light on dark</SubHeading>
        <TooltipProvider delayDuration={100}>
          <div className="flex flex-wrap items-center gap-6 bg-card border border-border rounded-card p-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="md"
                  leadingIcon={Save}
                  data-testid="tooltip-trigger-dark"
                  onFocus={() => log("tooltip:focus-dark")}
                >
                  Save
                </Button>
              </TooltipTrigger>
              <TooltipContent
                data-testid="tooltip-content-dark"
                side="top"
                tone="dark"
              >
                Save · <Kbd small className="ml-1 border-white/20 text-white">⌘S</Kbd>
              </TooltipContent>
            </Tooltip>

            {/* Light variant on dark background */}
            <div className="bg-text-default rounded-card p-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="primary"
                    size="md"
                    className="bg-white text-text-default border-white hover:bg-white/90"
                    data-testid="tooltip-trigger-light"
                    onFocus={() => log("tooltip:focus-light")}
                  >
                    Preview menu
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  data-testid="tooltip-content-light"
                  side="top"
                  tone="light"
                >
                  Opens in a new tab
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </TooltipProvider>
      </div>

      {/* ── KebabMenu (contextual actions with destructive at bottom) ── */}
      <div className="space-y-3">
        <SubHeading>Kebab / contextual menu</SubHeading>
        <div className="flex flex-wrap items-center gap-3 bg-card border border-border rounded-card p-4">
          <span className="text-caption text-text-muted">
            Row actions (click the ⋯ trigger):
          </span>
          <KebabMenu>
            <KebabMenuIconTrigger
              data-testid="kebab-trigger"
              label="Menu actions"
              onClick={() => log("open:kebab")}
            />
            <KebabMenuContent data-testid="kebab-content">
              <KebabMenuItem
                icon={Edit3}
                data-testid="kebab-item-edit"
                onSelect={() => log("kebab:edit")}
              >
                Edit
              </KebabMenuItem>
              <KebabMenuItem
                icon={Copy}
                data-testid="kebab-item-duplicate"
                onSelect={() => log("kebab:duplicate")}
              >
                Duplicate
              </KebabMenuItem>
              <KebabMenuItem
                icon={MoveRight}
                data-testid="kebab-item-move"
                onSelect={() => log("kebab:move")}
              >
                Move to…
              </KebabMenuItem>
              <KebabMenuSeparator />
              <KebabMenuItem
                icon={Trash2}
                tone="destructive"
                data-testid="kebab-item-delete"
                onSelect={() => log("kebab:delete")}
              >
                Delete
              </KebabMenuItem>
            </KebabMenuContent>
          </KebabMenu>
        </div>
      </div>

      {/* ── Command Palette ⌘K ───────────────────────────────────────── */}
      <div className="space-y-3">
        <SubHeading>Command palette · ⌘K</SubHeading>
        <div className="flex flex-wrap items-center gap-3 bg-card border border-border rounded-card p-4">
          <Button
            variant="secondary"
            size="md"
            leadingIcon={Settings}
            data-testid="open-palette"
            onClick={() => {
              setPaletteOpen(true)
              log("open:palette")
            }}
          >
            Open palette (⌘K)
          </Button>
          <span className="text-caption text-text-muted">
            Or press <Kbd small>⌘</Kbd> <Kbd small>K</Kbd> anywhere on the
            page.
          </span>
        </div>

        <CommandPalette
          open={paletteOpen}
          onOpenChange={setPaletteOpen}
          label="Command palette"
        >
          <CommandPaletteInput
            placeholder="Search menus, items, or settings…"
            data-testid="palette-input"
          />
          <CommandPaletteList data-testid="palette-list">
            <CommandPaletteEmpty data-testid="palette-empty">
              No results found.
            </CommandPaletteEmpty>
            <CommandPaletteGroup heading="Items">
              <CommandPaletteItem
                icon={Utensils}
                title="Khachapuri Adjaruli"
                subtitle="Main menu · Breads"
                // Narrow `value` to just the title — cmdk's default fuzzy
                // filter searches the `value`, and including the subtitle
                // ("Cold starters" → has 'r') would cause "adjar" to
                // spuriously match the Badrijani row too.
                value="khachapuri adjaruli"
                data-testid="palette-item-khachapuri-adjaruli"
                onSelect={() => {
                  log("palette:select:khachapuri-adjaruli")
                  setPaletteOpen(false)
                }}
              />
              <CommandPaletteItem
                icon={Utensils}
                title="Khachapuri Imeruli"
                subtitle="Main menu · Breads"
                value="khachapuri imeruli"
                data-testid="palette-item-khachapuri-imeruli"
                onSelect={() => {
                  log("palette:select:khachapuri-imeruli")
                  setPaletteOpen(false)
                }}
              />
              <CommandPaletteItem
                icon={Utensils}
                title="Badrijani nigvzit"
                subtitle="Main menu · Cold starters"
                value="badrijani nigvzit"
                data-testid="palette-item-badrijani"
                onSelect={() => {
                  log("palette:select:badrijani")
                  setPaletteOpen(false)
                }}
              />
            </CommandPaletteGroup>
            <CommandPaletteGroup heading="Actions">
              <CommandPaletteItem
                icon={Plus}
                title='Create item "khacha"…'
                value="create item"
                data-testid="palette-action-create"
                onSelect={() => {
                  log("palette:select:create-item")
                  setPaletteOpen(false)
                }}
              />
            </CommandPaletteGroup>
          </CommandPaletteList>
          <CommandPaletteFooter />
        </CommandPalette>
      </div>
    </section>
  )
}
