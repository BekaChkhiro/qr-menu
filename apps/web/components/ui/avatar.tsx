"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// ── Section H Avatar (T10.4) ────────────────────────────────────────────────
//
// Circular avatar with initials fallback, optional image, optional status dot,
// and a stack grouping primitive with "+N" overflow. Sizes match Section H:
// xs 24 / sm 32 / md 40 / lg 56 / xl 72 px.
//
// Background colour defaults to `accent`; pass `bg` to override (e.g. the
// amber `#8B6F3A` seen in the design showcase).

const SIZE_MAP = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 72,
} as const

type SizeKey = keyof typeof SIZE_MAP

// Font-size is ~40 % of the avatar diameter per the spec.
const FONT_SIZE: Record<SizeKey, number> = {
  xs: 10,
  sm: 13,
  md: 16,
  lg: 22,
  xl: 28,
}

const avatarVariants = cva(
  [
    "inline-flex items-center justify-center",
    "rounded-pill text-white font-semibold",
    "select-none overflow-hidden",
  ],
  {
    variants: {
      size: {
        xs: "",
        sm: "",
        md: "",
        lg: "",
        xl: "",
      },
    },
    defaultVariants: {
      size: "sm",
    },
  }
)

export interface AvatarProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "color">,
    VariantProps<typeof avatarVariants> {
  /** Display name. The first character of each word (max 2) is used as initials. */
  name?: string
  /** Image URL. Falls back to initials if missing or fails to load. */
  src?: string
  /** Alt text for the image, defaults to `name`. */
  alt?: string
  /** Background colour for the initials circle. Defaults to the accent token. */
  bg?: string
  /** Presence indicator rendered at the bottom-right corner. */
  status?: "online" | "offline"
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).slice(0, 2)
  return words.map((w) => w[0]?.toUpperCase() ?? "").join("")
}

const Avatar = React.forwardRef<HTMLSpanElement, AvatarProps>(
  (
    {
      className,
      size = "sm",
      name = "",
      src,
      alt,
      bg,
      status,
      style,
      ...props
    },
    ref
  ) => {
    const sizeKey = (size ?? "sm") as SizeKey
    const px = SIZE_MAP[sizeKey]
    const fontPx = FONT_SIZE[sizeKey]
    const initials = getInitials(name)

    const [imgFailed, setImgFailed] = React.useState(false)
    const showImage = !!src && !imgFailed

    return (
      <span
        ref={ref}
        className={cn(
          avatarVariants({ size }),
          "relative",
          className
        )}
        style={{
          width: px,
          height: px,
          fontSize: fontPx,
          background: showImage ? undefined : bg ?? "hsl(var(--accent))",
          ...style,
        }}
        role="img"
        aria-label={name || alt || "avatar"}
        {...props}
      >
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt ?? name}
            width={px}
            height={px}
            className="size-full rounded-pill object-cover"
            onError={() => setImgFailed(true)}
          />
        ) : (
          initials
        )}

        {status && (
          <span
            aria-hidden="true"
            className={cn(
              "absolute bottom-0 right-0",
              "rounded-pill border-2 border-card",
              status === "online" ? "bg-success" : "bg-text-subtle"
            )}
            style={{
              width: px * 0.3,
              height: px * 0.3,
            }}
          />
        )}
      </span>
    )
  }
)
Avatar.displayName = "Avatar"

// ── AvatarStack ──────────────────────────────────────────────────────────────
//
// Horizontal group with overlap and an optional "+N" overflow chip. Renders
// the first `max` children, then a count pill for the remainder.

export interface AvatarStackProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Pixel overlap between adjacent avatars (negative margin). Defaults to 8. */
  overlap?: number
  /** Max avatars to render before showing `+N`. Defaults to 3. */
  max?: number
  /** Size to apply to every child for consistency. */
  size?: SizeKey
}

function AvatarStack({
  className,
  overlap = 8,
  max = 3,
  size = "sm",
  children,
  ...props
}: AvatarStackProps) {
  const allChildren = React.Children.toArray(children)
  const visible = allChildren.slice(0, max)
  const overflow = allChildren.length - visible.length
  const px = SIZE_MAP[size]
  const fontPx = FONT_SIZE[size]

  return (
    <div
      className={cn("inline-flex items-center", className)}
      {...props}
    >
      {visible.map((child, i) => (
        <span
          key={i}
          className="relative inline-flex rounded-pill ring-2 ring-card"
          style={{ marginLeft: i === 0 ? 0 : -overlap }}
        >
          {child}
        </span>
      ))}
      {overflow > 0 && (
        <span
          className={cn(
            "relative inline-flex items-center justify-center",
            "rounded-pill ring-2 ring-card",
            "bg-chip text-text-muted font-semibold"
          )}
          style={{
            width: px,
            height: px,
            fontSize: fontPx,
            marginLeft: -overlap,
          }}
          aria-label={`${overflow} more`}
        >
          +{overflow}
        </span>
      )}
    </div>
  )
}
AvatarStack.displayName = "AvatarStack"

export { Avatar, AvatarStack, avatarVariants, SIZE_MAP as AVATAR_SIZES }
