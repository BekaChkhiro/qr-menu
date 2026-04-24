"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// ── Tabs (shadcn pill + Section H underline/vertical variants — T10.4) ──────
//
// The default "pill" variant preserves the existing shadcn look used in the
// admin menu editor. Section H adds "underline" (horizontal underline, used
// by the Phase 13 menu-editor tab bar and Phase 15 editor sub-tabs) and
// "vertical" (left-side nav rail, used by Phase 16 account settings).
//
// Design reference: `component-library-a.jsx` lines 680-692 for underline,
// `settings-shell.jsx` for the vertical nav rail.

type TabsVariant = "pill" | "underline" | "vertical"

interface TabsVariantContextValue {
  variant: TabsVariant
}

const TabsVariantContext = React.createContext<TabsVariantContextValue>({
  variant: "pill",
})

const Tabs = TabsPrimitive.Root

// ── TabsList ─────────────────────────────────────────────────────────────────

const tabsListVariants = cva("", {
  variants: {
    variant: {
      pill:
        "flex h-10 items-center gap-2 rounded-full bg-secondary p-1 text-muted-foreground",
      underline: "flex items-end gap-0 border-b border-border",
      vertical: "flex flex-col gap-[2px] w-full",
    },
  },
  defaultVariants: {
    variant: "pill",
  },
})

export interface TabsListProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>,
    VariantProps<typeof tabsListVariants> {}

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, variant = "pill", ...props }, ref) => {
  const resolved = (variant ?? "pill") as TabsVariant
  return (
    <TabsVariantContext.Provider value={{ variant: resolved }}>
      <TabsPrimitive.List
        ref={ref}
        className={cn(tabsListVariants({ variant: resolved }), className)}
        {...props}
      />
    </TabsVariantContext.Provider>
  )
})
TabsList.displayName = TabsPrimitive.List.displayName

// ── TabsTrigger ──────────────────────────────────────────────────────────────

const tabsTriggerVariants = cva(
  [
    "inline-flex items-center whitespace-nowrap",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
    "disabled:pointer-events-none disabled:opacity-50",
    "transition-colors",
  ],
  {
    variants: {
      variant: {
        pill: [
          "justify-center rounded-full px-3 py-1.5 text-sm font-medium ring-offset-background",
          "data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm",
          "hover:text-foreground/80",
        ],
        underline: [
          "px-4 py-[10px] -mb-px border-b-[2px] text-[13px]",
          "border-transparent text-text-muted font-medium",
          "data-[state=active]:border-text-default data-[state=active]:text-text-default data-[state=active]:font-semibold",
          "hover:text-text-default",
        ],
        vertical: [
          "justify-start w-full px-3 py-[8px] rounded-md text-[13px] font-medium",
          "text-text-muted",
          "data-[state=active]:bg-chip data-[state=active]:text-text-default data-[state=active]:font-semibold",
          "hover:bg-chip/60 hover:text-text-default",
        ],
      },
    },
    defaultVariants: {
      variant: "pill",
    },
  }
)

export interface TabsTriggerProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>,
    VariantProps<typeof tabsTriggerVariants> {}

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ className, variant, ...props }, ref) => {
  const ctx = React.useContext(TabsVariantContext)
  const resolved = (variant ?? ctx.variant) as TabsVariant
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(tabsTriggerVariants({ variant: resolved }), className)}
      {...props}
    />
  )
})
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

// ── TabsContent ──────────────────────────────────────────────────────────────

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants, tabsTriggerVariants }
