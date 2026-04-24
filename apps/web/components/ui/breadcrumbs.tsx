import * as React from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"

// ── Section H Breadcrumbs (T10.4) ───────────────────────────────────────────
//
// Lightweight route trail used in the admin top-bar. Supports 2-level,
// 3-level, and long-name truncation. The last item is the current page and
// renders without a link.
//
// Design: 12.5px body, muted text for ancestors, weight-semibold current
// item; slash separators in the `text-subtle` token.

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface BreadcrumbsProps extends React.HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[]
  /** Max width in pixels for each label before truncation. Defaults to 200. */
  maxLabelWidth?: number
}

function Breadcrumbs({
  items,
  className,
  maxLabelWidth = 200,
  ...props
}: BreadcrumbsProps) {
  if (items.length === 0) return null

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "flex items-center gap-[6px] text-[12.5px]",
        className
      )}
      {...props}
    >
      <ol className="flex items-center gap-[6px]">
        {items.map((item, i) => {
          const isLast = i === items.length - 1
          const truncateStyle: React.CSSProperties = {
            maxWidth: maxLabelWidth,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }

          return (
            <li key={i} className="flex items-center gap-[6px]">
              {isLast ? (
                <span
                  aria-current="page"
                  className="text-text-default font-semibold"
                  style={truncateStyle}
                  title={item.label}
                >
                  {item.label}
                </span>
              ) : item.href ? (
                <Link
                  href={item.href}
                  className={cn(
                    "text-text-muted hover:text-text-default transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:rounded-xs"
                  )}
                  style={truncateStyle}
                  title={item.label}
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className="text-text-muted"
                  style={truncateStyle}
                  title={item.label}
                >
                  {item.label}
                </span>
              )}

              {!isLast && (
                <span
                  aria-hidden="true"
                  className="text-text-subtle"
                >
                  /
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export { Breadcrumbs }
