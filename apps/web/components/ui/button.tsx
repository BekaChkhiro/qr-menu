import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

// ── Icon sizes per button size (Section H spec: sm 12 / md 13 / lg 15 px) ────
const ICON_SIZE: Record<"sm" | "md" | "lg", number> = {
  sm: 12,
  md: 13,
  lg: 15,
}

// Spinner replaces the leading icon 1:1 — same pixel size.
const SPINNER_SIZE = ICON_SIZE

// ── CVA — base + variants ────────────────────────────────────────────────────
const buttonVariants = cva(
  // Base — layout, typography, transitions, accessibility
  [
    "inline-flex items-center justify-center whitespace-nowrap",
    "rounded-[7px] border font-medium",
    "transition-colors duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-40",
    "[&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        // ── Section H variants ────────────────────────────────────────────────
        primary:
          "bg-text-default text-white border-text-default hover:bg-text-default/90 active:bg-text-default/80",
        secondary:
          "bg-card text-text-default border-border hover:bg-chip active:bg-chip/80",
        ghost:
          "bg-transparent text-text-default border-transparent hover:bg-chip active:bg-chip/80",
        destructive:
          "bg-danger text-white border-danger hover:bg-[#9A3731] hover:border-[#9A3731] active:bg-[#8A2F2A] active:border-[#8A2F2A]",
        link:
          "bg-transparent text-accent border-transparent underline underline-offset-4 hover:text-[#8E4A2C] active:opacity-80",

        // ── Backwards-compat aliases (shadcn names → Section H equivalents) ──
        default:
          "bg-text-default text-white border-text-default hover:bg-text-default/90 active:bg-text-default/80",
        outline:
          "bg-card text-text-default border-border hover:bg-chip active:bg-chip/80",
      },
      size: {
        // ── Section H sizes (height / px-padding / font-size / icon-size) ────
        sm: "h-[26px] gap-[5px] px-[10px] text-[12px] [&_svg]:size-[12px]",
        md: "h-[32px] gap-[6px] px-[13px] text-[12.5px] [&_svg]:size-[13px]",
        lg: "h-[40px] gap-[7px] px-[18px] text-[14px] [&_svg]:size-[15px]",

        // ── Legacy shadcn icon size (32×32 square) ────────────────────────────
        icon: "h-[32px] w-[32px] p-0 gap-0 text-[12.5px] [&_svg]:size-[13px]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

// ── Props ─────────────────────────────────────────────────────────────────────

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Render as child element via Radix Slot (e.g. `<Button asChild><Link …/></Button>`) */
  asChild?: boolean
  /**
   * Lucide icon component rendered to the left of the label.
   * Stroke width is always 1.5 per design spec.
   */
  leadingIcon?: LucideIcon
  /**
   * When `true` the button renders as a square (width = height) and hides the
   * label. The size is controlled by the `size` prop. Always supply an
   * `aria-label` when using iconOnly.
   */
  iconOnly?: boolean
  /**
   * Show a spinner in place of the leading icon and disable interaction.
   * The text label remains visible so the user can see what is loading.
   */
  loading?: boolean
}

// ── Spinner ───────────────────────────────────────────────────────────────────

interface SpinnerProps {
  sizePx: number
  /** True for variants with a dark filled background (primary / default). */
  dark: boolean
}

function Spinner({ sizePx, dark }: SpinnerProps) {
  const trackColor = dark ? "rgba(255,255,255,0.3)" : "hsl(var(--border))"
  const headColor = dark ? "#ffffff" : "hsl(var(--text))"
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-block",
        flexShrink: 0,
        width: sizePx,
        height: sizePx,
        borderRadius: "50%",
        border: `1.8px solid ${trackColor}`,
        borderTopColor: headColor,
        animation: "cl-spin 0.7s linear infinite",
      }}
    />
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Variants whose background is dark (filled) — spinner + icons render white */
const DARK_VARIANTS = new Set(["primary", "default", "destructive"])

/** Normalise the CVA size key to one of the three canonical sizes. */
function canonicalSize(size: string | null | undefined): "sm" | "md" | "lg" {
  if (size === "sm") return "sm"
  if (size === "lg") return "lg"
  return "md"
}

// ── Button ────────────────────────────────────────────────────────────────────

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      leadingIcon: LeadingIcon,
      iconOnly = false,
      loading = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button"

    // Canonical size (sm/md/lg) used to look up pixel values.
    // When size="icon" the pixel metrics match "md".
    const sizeKey = canonicalSize(size === "icon" ? "md" : size)

    // ── CVA size arg ──────────────────────────────────────────────────────────
    // For iconOnly buttons we need a square, but "icon" in CVA hardcodes 32px.
    // Instead we use the matching non-square size and then override w/p with extra classes.
    const cvaSize: VariantProps<typeof buttonVariants>["size"] = size === "icon"
      ? "icon"
      : (size as VariantProps<typeof buttonVariants>["size"])

    // ── Icon-only overrides ───────────────────────────────────────────────────
    // When iconOnly=true we strip horizontal padding and set width = height.
    const iconOnlyClasses = iconOnly
      ? {
          sm: "w-[26px] p-0 gap-0",
          md: "w-[32px] p-0 gap-0",
          lg: "w-[40px] p-0 gap-0",
        }[sizeKey]
      : null

    const isDark = DARK_VARIANTS.has(variant ?? "primary")

    // When `asChild` is set, Radix Slot clones the single child and merges
    // props onto it.  Slot requires exactly one React element child, so we
    // cannot wrap in a fragment or inject a separate icon/spinner sibling.
    // Callers composing <Button asChild><Link/></Button> are expected to
    // author any icon inside the child themselves — `leadingIcon`, `loading`,
    // and `iconOnly` only apply to the rendered-as-button path.
    const renderedContent = asChild ? (
      children
    ) : (
      <>
        {loading ? (
          <Spinner sizePx={SPINNER_SIZE[sizeKey]} dark={isDark} />
        ) : LeadingIcon ? (
          <LeadingIcon
            size={ICON_SIZE[sizeKey]}
            strokeWidth={1.5}
            aria-hidden="true"
          />
        ) : null}
        {!iconOnly && children}
      </>
    )

    return (
      <Comp
        ref={ref}
        className={cn(
          buttonVariants({ variant, size: cvaSize }),
          iconOnlyClasses,
          className
        )}
        disabled={loading || disabled}
        aria-busy={loading ? true : undefined}
        {...props}
      >
        {renderedContent}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
