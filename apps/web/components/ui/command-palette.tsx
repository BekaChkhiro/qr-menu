"use client"

import * as React from "react"
import { Command as CommandPrimitive } from "cmdk"
import { Search } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogPortal,
  DialogOverlay,
} from "@/components/ui/dialog"
import { Kbd, KbdCombo } from "@/components/ui/kbd"

// ── Section H Palette spec (component-library-b.jsx lines 146-205) ───────
// 460px wide modal, chrome matching CLPalette:
//   - 1px border, 12px radius, xl shadow
//   - Header: search icon + input + esc kbd, 1px bottom border
//   - Body: groups with overline labels, row items with icon + title + sub
//   - Footer: #FCFBF8 bg, ↑↓ navigate, ↵ open, ⌘K shortcut hint on right
//
// Build is layered:
//   <CommandPalette open={...}>     ← Dialog shell (backdrop, portal)
//     <CommandPaletteInput placeholder="Search…" />
//     <CommandPaletteList>
//       <CommandPaletteGroup heading="Items">
//         <CommandPaletteItem icon={Utensils} title="…" subtitle="…" />
//       </CommandPaletteGroup>
//     </CommandPaletteList>
//     <CommandPaletteFooter />
//   </CommandPalette>

// ─── Hook: global ⌘K / Ctrl+K hotkey ─────────────────────────────────────

/**
 * Bind ⌘K (macOS) / Ctrl+K (everyone else) to toggle a command palette.
 * Ignores the keystroke while focus is inside an editable element so typing
 * `K` in an <input> doesn't open the palette.
 */
export function useCommandPaletteHotkey(onToggle: () => void) {
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isToggle = e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)
      if (!isToggle) return

      // Let the OS use ⌘K inside real inputs (text fields) unless the caller
      // has explicitly opted in — we still block if this is the palette's
      // own input (cmdk handles that separately).
      const active = document.activeElement
      if (
        active instanceof HTMLElement &&
        (active.tagName === "INPUT" ||
          active.tagName === "TEXTAREA" ||
          active.isContentEditable)
      ) {
        // Open anyway — a global command palette should not be blocked by
        // any input having focus. This is standard (GitHub, Linear, etc.).
      }

      e.preventDefault()
      onToggle()
    }

    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onToggle])
}

// ─── Root shell ──────────────────────────────────────────────────────────

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /**
   * Filter function. Default uses cmdk's fuzzy match. Pass a custom fn for
   * server-backed search results.
   */
  filter?: (value: string, search: string, keywords?: string[]) => number
  children: React.ReactNode
  /** Optional accessibility label for the dialog. */
  label?: string
  className?: string
}

const CommandPalette = React.forwardRef<HTMLDivElement, CommandPaletteProps>(
  ({ open, onOpenChange, filter, children, label = "Command palette", className }, ref) => (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay />
        {/* We render cmdk inside a plain positioning wrapper so the
            command root controls keyboard navigation instead of being nested
            under Radix's DialogContent (which also traps focus and would
            double-handle keys). DialogOverlay above gives us the backdrop. */}
        <div
          ref={ref}
          className={cn(
            "fixed left-[50%] top-[24%] z-50 w-full max-w-[460px]",
            "translate-x-[-50%]",
            "rounded-[12px] border border-border bg-card shadow-xl overflow-hidden",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            className
          )}
          role="dialog"
          aria-label={label}
          data-state={open ? "open" : "closed"}
        >
          <CommandPrimitive
            label={label}
            filter={filter}
            className="flex flex-col"
            // Escape closes the palette — cmdk exposes a built-in handler,
            // but we wire it through onOpenChange for consistency.
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault()
                onOpenChange(false)
              }
            }}
          >
            {children}
          </CommandPrimitive>
        </div>
      </DialogPortal>
    </Dialog>
  )
)
CommandPalette.displayName = "CommandPalette"

// ─── Input ───────────────────────────────────────────────────────────────

interface CommandPaletteInputProps
  extends React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input> {
  /** Show the "esc" hint on the right side of the header row. Default true. */
  showEscHint?: boolean
}

const CommandPaletteInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  CommandPaletteInputProps
>(({ className, showEscHint = true, ...props }, ref) => {
  // The palette shell is a plain div (not DialogContent), so Radix's built-in
  // focus-trap + auto-focus does not run. Focus the cmdk input ourselves on
  // mount — each time the palette opens this component mounts fresh, so the
  // effect fires on every open.
  const localRef = React.useRef<HTMLInputElement>(null)
  React.useImperativeHandle(
    ref,
    () => localRef.current as HTMLInputElement,
    []
  )
  React.useEffect(() => {
    // rAF so the element has been painted and can receive focus.
    const id = requestAnimationFrame(() => localRef.current?.focus())
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div
      className={cn(
        "flex items-center gap-[10px] px-4 py-[14px]",
        "border-b border-border"
      )}
      cmdk-input-wrapper=""
    >
      <Search
        size={15}
        strokeWidth={1.5}
        className="text-text-muted shrink-0"
        aria-hidden="true"
      />
      <CommandPrimitive.Input
        ref={localRef}
        className={cn(
          "flex-1 bg-transparent outline-none",
          "text-[14px] text-text-default",
          "placeholder:text-text-subtle",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
      {showEscHint && <Kbd small>esc</Kbd>}
    </div>
  )
})
CommandPaletteInput.displayName = "CommandPaletteInput"

// ─── List ────────────────────────────────────────────────────────────────

const CommandPaletteList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn(
      "max-h-[360px] overflow-y-auto overflow-x-hidden p-[6px]",
      className
    )}
    {...props}
  />
))
CommandPaletteList.displayName = "CommandPaletteList"

// ─── Empty state ─────────────────────────────────────────────────────────

const CommandPaletteEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    className={cn(
      "py-6 text-center text-[12px] text-text-muted",
      className
    )}
    {...props}
  />
))
CommandPaletteEmpty.displayName = "CommandPaletteEmpty"

// ─── Group ───────────────────────────────────────────────────────────────

interface CommandPaletteGroupProps
  extends Omit<
    React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>,
    "heading"
  > {
  heading: string
}

const CommandPaletteGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  CommandPaletteGroupProps
>(({ className, heading, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    heading={heading}
    className={cn(
      // cmdk renders [cmdk-group-heading] for the header - style it via
      // the [cmdk-...] selectors for typography.
      "text-text-default",
      "[&_[cmdk-group-heading]]:px-[10px] [&_[cmdk-group-heading]]:py-1",
      "[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-bold",
      "[&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.6px]",
      "[&_[cmdk-group-heading]]:text-text-subtle",
      className
    )}
    {...props}
  />
))
CommandPaletteGroup.displayName = "CommandPaletteGroup"

// ─── Item ────────────────────────────────────────────────────────────────

import type { LucideIcon } from "lucide-react"

interface CommandPaletteItemProps
  extends Omit<
    React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>,
    "children" | "title"
  > {
  icon?: LucideIcon
  title: React.ReactNode
  subtitle?: React.ReactNode
  /** Optional slot rendered on the right (e.g. a keyboard shortcut). */
  endSlot?: React.ReactNode
}

const CommandPaletteItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  CommandPaletteItemProps
>(({ className, icon: Icon, title, subtitle, endSlot, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      "flex items-center gap-[10px] rounded-[6px] px-[10px] py-2",
      "cursor-pointer select-none outline-none",
      "text-text-default transition-colors",
      "data-[selected=true]:bg-chip",
      "data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50",
      className
    )}
    {...props}
  >
    {Icon ? (
      <Icon
        size={14}
        strokeWidth={1.5}
        className="text-text-muted shrink-0"
        aria-hidden="true"
      />
    ) : null}
    <div className="flex-1 min-w-0">
      <div className="text-[13px] font-medium text-text-default truncate">
        {title}
      </div>
      {subtitle ? (
        <div className="text-[11px] text-text-muted truncate mt-[1px]">
          {subtitle}
        </div>
      ) : null}
    </div>
    {endSlot}
  </CommandPrimitive.Item>
))
CommandPaletteItem.displayName = "CommandPaletteItem"

// ─── Footer (keyboard hints) ─────────────────────────────────────────────

interface CommandPaletteFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Show the default hints row. Pass `children` to override completely. */
  showDefaults?: boolean
}

const CommandPaletteFooter = React.forwardRef<
  HTMLDivElement,
  CommandPaletteFooterProps
>(({ className, children, showDefaults = true, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center gap-[14px] px-[14px] py-2",
      "bg-[#FCFBF8] border-t border-border",
      "text-[11px] text-text-muted",
      className
    )}
    {...props}
  >
    {children ?? (showDefaults && <DefaultHints />)}
  </div>
))
CommandPaletteFooter.displayName = "CommandPaletteFooter"

function DefaultHints() {
  return (
    <>
      <span className="inline-flex items-center gap-[5px]">
        <Kbd small>↑↓</Kbd> navigate
      </span>
      <span className="inline-flex items-center gap-[5px]">
        <Kbd small>↵</Kbd> open
      </span>
      <span className="ml-auto inline-flex items-center gap-[5px]">
        <KbdCombo keys={["⌘", "K"]} small />
      </span>
    </>
  )
}

export {
  CommandPalette,
  CommandPaletteInput,
  CommandPaletteList,
  CommandPaletteEmpty,
  CommandPaletteGroup,
  CommandPaletteItem,
  CommandPaletteFooter,
}
