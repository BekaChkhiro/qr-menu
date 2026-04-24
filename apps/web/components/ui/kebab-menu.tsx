"use client"

import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { MoreHorizontal, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

// ── Section H Kebab spec (component-library-b.jsx lines 114-144) ─────────
// - 180px width, 1px border, 8px radius, md shadow, 4px inner padding
// - Items: 7/10 padding, 5px radius, gap-9 (px), 13px text, icon 13px muted
// - Destructive item: same chrome but `color: danger` with separator above
// - Dropdown-based (so right-click + click + keyboard all work)

// ─── Primitives (raw Radix exports) ──────────────────────────────────────

const KebabMenu = DropdownMenuPrimitive.Root

const KebabMenuTrigger = DropdownMenuPrimitive.Trigger

const KebabMenuPortal = DropdownMenuPrimitive.Portal

const KebabMenuGroup = DropdownMenuPrimitive.Group

// ─── Content ──────────────────────────────────────────────────────────────

const KebabMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 6, align = "end", ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      align={align}
      className={cn(
        // ── Layout ────────────────────────────────────────────────────────
        "z-50 w-[180px] p-1 outline-none",
        // ── Chrome ────────────────────────────────────────────────────────
        "bg-card text-text-default",
        "rounded-md border border-border shadow-md",
        // ── Animations ────────────────────────────────────────────────────
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        "data-[side=bottom]:slide-in-from-top-1 data-[side=left]:slide-in-from-right-1",
        "data-[side=right]:slide-in-from-left-1 data-[side=top]:slide-in-from-bottom-1",
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
))
KebabMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

// ─── Item ─────────────────────────────────────────────────────────────────

interface KebabMenuItemProps
  extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> {
  /** Tone. `destructive` uses the danger color per the artboard. */
  tone?: "default" | "destructive"
  /** Optional leading icon. Rendered at 13px, muted (or danger for destructive). */
  icon?: LucideIcon
}

const KebabMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  KebabMenuItemProps
>(({ className, tone = "default", icon: Icon, children, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      // ── Layout ──────────────────────────────────────────────────────────
      "relative flex cursor-pointer select-none items-center gap-[9px]",
      "rounded-[5px] px-[10px] py-[7px]",
      "text-[13px] leading-none outline-none",
      "transition-colors",
      // ── Tone ────────────────────────────────────────────────────────────
      tone === "destructive"
        ? "text-danger focus:bg-danger-soft data-[highlighted]:bg-danger-soft"
        : "text-text-default focus:bg-chip data-[highlighted]:bg-chip",
      // ── Disabled ────────────────────────────────────────────────────────
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      "[&_svg]:pointer-events-none [&_svg]:h-[13px] [&_svg]:w-[13px] [&_svg]:shrink-0",
      className
    )}
    {...props}
  >
    {Icon ? (
      <Icon
        strokeWidth={1.5}
        className={cn(
          tone === "destructive" ? "text-danger" : "text-text-muted"
        )}
      />
    ) : null}
    {children}
  </DropdownMenuPrimitive.Item>
))
KebabMenuItem.displayName = "KebabMenuItem"

// ─── Separator ────────────────────────────────────────────────────────────

const KebabMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-border", className)}
    {...props}
  />
))
KebabMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName

// ─── IconTrigger — convenience trigger rendering a MoreHorizontal icon ───
// For the common case: `<KebabMenuIconTrigger aria-label="Menu actions" />`

const KebabMenuIconTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Trigger>,
  Omit<
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Trigger>,
    "children"
  > & { label?: string }
>(({ className, label = "Open menu", ...props }, ref) => (
  <DropdownMenuPrimitive.Trigger
    ref={ref}
    aria-label={label}
    className={cn(
      "inline-flex h-8 w-8 items-center justify-center rounded-md",
      "text-text-muted transition-colors",
      "hover:bg-chip hover:text-text-default",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
      "data-[state=open]:bg-chip data-[state=open]:text-text-default",
      className
    )}
    {...props}
  >
    <MoreHorizontal strokeWidth={1.5} size={17} />
    <span className="sr-only">{label}</span>
  </DropdownMenuPrimitive.Trigger>
))
KebabMenuIconTrigger.displayName = "KebabMenuIconTrigger"

export {
  KebabMenu,
  KebabMenuTrigger,
  KebabMenuIconTrigger,
  KebabMenuPortal,
  KebabMenuContent,
  KebabMenuItem,
  KebabMenuSeparator,
  KebabMenuGroup,
}
