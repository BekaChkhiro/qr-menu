import * as React from "react"

import { cn } from "@/lib/utils"

// ── Base Skeleton ────────────────────────────────────────────────────────────
// Shimmering placeholder using the `animate-shimmer` utility from globals.css
// (replaces the old `animate-pulse bg-muted` default). Consumers can override
// size and radius via Tailwind classes as they could before.
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-shimmer rounded-xs bg-chip", className)}
      {...props}
    />
  )
}

// ── Avatar Skeleton ──────────────────────────────────────────────────────────
// Circular placeholder for user avatars. Defaults to 40px (Section H `md`
// avatar size).
export interface SkeletonAvatarProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "style"> {
  size?: number
}

function SkeletonAvatar({
  size = 40,
  className,
  ...props
}: SkeletonAvatarProps) {
  return (
    <Skeleton
      className={cn("rounded-pill", className)}
      style={{ width: size, height: size }}
      {...props}
    />
  )
}

// ── Text Line Skeleton ───────────────────────────────────────────────────────
// Multi-line text placeholder. The last line is narrower so it reads as a
// paragraph end (matching Section H's inline-style skeleton recipe).
export interface SkeletonTextProps {
  lines?: number
  className?: string
}

function SkeletonText({ lines = 3, className }: SkeletonTextProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          className="h-2.5"
          style={{ width: i === lines - 1 ? "60%" : "100%" }}
        />
      ))}
    </div>
  )
}

// ── Row Skeleton ─────────────────────────────────────────────────────────────
// Avatar + two text lines in a horizontal layout. Useful for table rows or
// list items loading. Matches the Section H `CLSkeleton` composition.
function SkeletonRow({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 p-3", className)}>
      <SkeletonAvatar size={40} />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-2.5 w-[60%]" />
        <Skeleton className="h-2 w-[85%]" />
      </div>
    </div>
  )
}

// ── Card Skeleton ────────────────────────────────────────────────────────────
// Full card placeholder: overline + title + body paragraph + two action chips.
// Matches the stat/menu card shape in the redesign.
function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "space-y-3 rounded-card border border-border bg-card p-4",
        className
      )}
    >
      <Skeleton className="h-3 w-[40%]" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-[80%]" />
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-7 w-20 rounded-md" />
        <Skeleton className="h-7 w-24 rounded-md" />
      </div>
    </div>
  )
}

export { Skeleton, SkeletonAvatar, SkeletonText, SkeletonRow, SkeletonCard }
