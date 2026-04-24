"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px]",
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  /**
   * Hide the default top-right close (X) button. Use this for destructive
   * confirms where dismissal should only happen via explicit Cancel/Confirm
   * buttons, per the Section H design spec.
   */
  hideClose?: boolean
}

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, hideClose = false, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        // ── Layout ────────────────────────────────────────────────────────
        "fixed left-[50%] top-[50%] z-50 w-full max-w-[440px]",
        "translate-x-[-50%] translate-y-[-50%]",
        // ── Section H chrome ──────────────────────────────────────────────
        "bg-card text-text-default",
        "rounded-[12px] border border-border shadow-xl",
        "overflow-hidden",
        // ── Default body layout (back-compat; override with p-0 when using
        //    DialogHeader/DialogFooter bars) ────────────────────────────────
        "grid gap-4 p-6",
        // ── Animations ────────────────────────────────────────────────────
        "duration-200",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
        "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
        className
      )}
      {...props}
    >
      {children}
      {!hideClose && (
        <DialogPrimitive.Close
          className={cn(
            "absolute right-3 top-3 rounded-sm p-1",
            "text-text-muted transition-colors",
            "hover:bg-chip hover:text-text-default",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            "disabled:pointer-events-none"
          )}
        >
          <X className="h-4 w-4" strokeWidth={1.5} />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

// ── Section H compound primitives ────────────────────────────────────────
// Opinionated bars to match the destructive-confirm artboard in
// component-library-b.jsx lines 6-37. Use together with
// <DialogContent className="p-0 gap-0"> to opt into the banded layout.

/**
 * Header band with padding 20/22/14 matching the destructive-confirm
 * artboard. Pair with <DialogContent className="p-0 gap-0">.
 */
const DialogHeaderBar = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("px-[22px] pt-[20px] pb-[14px]", className)} {...props} />
)
DialogHeaderBar.displayName = "DialogHeaderBar"

/**
 * Footer band — #FCFBF8 bg, 1px top border, right-aligned gap-2 actions.
 * Matches the destructive-confirm footer row.
 */
const DialogFooterBar = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex items-center justify-end gap-2",
      "bg-[#FCFBF8] border-t border-border",
      "px-[22px] py-3",
      className
    )}
    {...props}
  />
)
DialogFooterBar.displayName = "DialogFooterBar"

const DIALOG_ICON_TILE_VARIANTS = {
  danger: "bg-danger-soft text-danger",
  warning: "bg-warning-soft text-warning",
  success: "bg-success-soft text-success",
  accent: "bg-accent-soft text-accent",
} as const

type DialogIconTileVariant = keyof typeof DIALOG_ICON_TILE_VARIANTS

/**
 * 36×36 icon tile with soft semantic bg — used in destructive / warning
 * confirm dialogs. Matches the CLDialog artboard's warning tile.
 */
const DialogIconTile = ({
  variant = "danger",
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: DialogIconTileVariant }) => (
  <div
    className={cn(
      "flex h-9 w-9 items-center justify-center rounded-md mb-3",
      "[&_svg]:h-4 [&_svg]:w-4",
      DIALOG_ICON_TILE_VARIANTS[variant],
      className
    )}
    {...props}
  />
)
DialogIconTile.displayName = "DialogIconTile"

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogHeaderBar,
  DialogFooterBar,
  DialogIconTile,
}
