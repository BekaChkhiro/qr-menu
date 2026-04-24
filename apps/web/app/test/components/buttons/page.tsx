import type { Metadata } from "next"
import {
  Plus,
  Download,
  Trash2,
  Pencil,
  MoreHorizontal,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { InteractiveSection } from "./interactive-section"

export const metadata: Metadata = {
  title: "Button Showcase — T10.1",
}

// ── Types ──────────────────────────────────────────────────────────────────

type Variant = "primary" | "secondary" | "ghost" | "destructive" | "link"
type Size = "sm" | "md" | "lg"
type State = "default" | "disabled" | "loading"

const variants: Variant[] = ["primary", "secondary", "ghost", "destructive", "link"]
const sizes: Size[] = ["sm", "md", "lg"]
const states: State[] = ["default", "disabled", "loading"]

// ── Section header ─────────────────────────────────────────────────────────

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

// ── Cell wrapper ───────────────────────────────────────────────────────────

function Cell({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center justify-center min-h-[48px]">
        {children}
      </div>
      <span className="text-[11px] text-text-subtle whitespace-nowrap">{label}</span>
    </div>
  )
}

// ── Variant × Size × State grid ────────────────────────────────────────────

function VariantSizeStateGrid() {
  return (
    <div className="space-y-10">
      {variants.map((variant) => (
        <div key={variant}>
          <SubHeading>{variant}</SubHeading>
          {/* Column headers */}
          <div className="grid grid-cols-[120px_repeat(9,1fr)] gap-3 items-center mb-2">
            <span />
            {sizes.map((sz) =>
              states.map((st) => (
                <span
                  key={`${sz}-${st}`}
                  className="text-[10px] text-center text-text-subtle leading-tight"
                >
                  {sz}
                  <br />
                  {st}
                </span>
              ))
            )}
          </div>
          {/* Single row per variant */}
          <div className="grid grid-cols-[120px_repeat(9,1fr)] gap-3 items-center bg-card border border-border rounded-card p-4">
            <span className="text-caption font-medium text-text-default">
              {variant}
            </span>
            {sizes.map((sz) =>
              states.map((st) => {
                const isDisabled = st === "disabled"
                const isLoading = st === "loading"
                const label =
                  variant === "link"
                    ? "Learn more"
                    : variant === "destructive"
                    ? "Delete"
                    : variant === "ghost"
                    ? "Dismiss"
                    : variant === "secondary"
                    ? "Cancel"
                    : "Save"
                return (
                  <div
                    key={`${sz}-${st}`}
                    className="flex items-center justify-center"
                  >
                    <Button
                      variant={variant}
                      size={sz}
                      disabled={isDisabled}
                      loading={isLoading}
                    >
                      {label}
                    </Button>
                  </div>
                )
              })
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Focus state row (keyboard-visible ring) ────────────────────────────────

function FocusRow() {
  return (
    <div className="space-y-3">
      <SubHeading>Focus-visible ring (shown via data-focus class)</SubHeading>
      <p className="text-caption text-text-muted mb-3">
        Tab into these buttons to see the accent focus ring. The styles below
        use{" "}
        <code className="bg-chip px-1 rounded-xs text-caption font-mono">
          focus-visible:ring-2 focus-visible:ring-accent
        </code>
        .
      </p>
      <div className="flex flex-wrap gap-4 bg-card border border-border rounded-card p-4">
        {variants.map((v) => (
          <Button key={v} variant={v} size="md">
            {v}
          </Button>
        ))}
      </div>
    </div>
  )
}

// ── Leading icon buttons ───────────────────────────────────────────────────

function LeadingIconSection() {
  return (
    <div className="space-y-4">
      <SubHeading>Leading icon</SubHeading>
      <div className="flex flex-wrap gap-4 bg-card border border-border rounded-card p-4">
        <Cell label="primary + Plus / sm">
          <Button variant="primary" size="sm" leadingIcon={Plus}>
            Add item
          </Button>
        </Cell>
        <Cell label="primary + Plus / md">
          <Button variant="primary" size="md" leadingIcon={Plus}>
            Add item
          </Button>
        </Cell>
        <Cell label="primary + Plus / lg">
          <Button variant="primary" size="lg" leadingIcon={Plus}>
            Add item
          </Button>
        </Cell>
        <Cell label="secondary + Download / md">
          <Button variant="secondary" size="md" leadingIcon={Download}>
            Export
          </Button>
        </Cell>
        <Cell label="destructive + Trash / md">
          <Button variant="destructive" size="md" leadingIcon={Trash2}>
            Delete menu
          </Button>
        </Cell>
        <Cell label="ghost + Pencil / md">
          <Button variant="ghost" size="md" leadingIcon={Pencil}>
            Edit
          </Button>
        </Cell>
      </div>
    </div>
  )
}

// ── Icon-only buttons ──────────────────────────────────────────────────────

function IconOnlySection() {
  return (
    <div className="space-y-4">
      <SubHeading>Icon-only (square, aspect-ratio 1:1)</SubHeading>
      <div className="flex flex-wrap gap-4 items-end bg-card border border-border rounded-card p-4">
        {(["sm", "md", "lg"] as Size[]).map((sz) => (
          <Cell key={`secondary-${sz}`} label={`secondary / ${sz}`}>
            <Button
              variant="secondary"
              size={sz}
              iconOnly
              leadingIcon={Pencil}
              aria-label="Edit"
            />
          </Cell>
        ))}
        <Cell label="ghost / md">
          <Button
            variant="ghost"
            size="md"
            iconOnly
            leadingIcon={MoreHorizontal}
            aria-label="More options"
          />
        </Cell>
        <Cell label="primary / md">
          <Button
            variant="primary"
            size="md"
            iconOnly
            leadingIcon={Plus}
            aria-label="Add"
          />
        </Cell>
        <Cell label="destructive / md">
          <Button
            variant="destructive"
            size="md"
            iconOnly
            leadingIcon={Trash2}
            aria-label="Delete"
          />
        </Cell>
        <Cell label="ghost / sm">
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            leadingIcon={MoreHorizontal}
            aria-label="More options"
          />
        </Cell>
        <Cell label="ghost / lg">
          <Button
            variant="ghost"
            size="lg"
            iconOnly
            leadingIcon={MoreHorizontal}
            aria-label="More options"
          />
        </Cell>
      </div>
    </div>
  )
}

// ── Loading states ─────────────────────────────────────────────────────────

function LoadingSection() {
  return (
    <div className="space-y-4">
      <SubHeading>Loading state (spinner replaces icon, label stays)</SubHeading>
      <div className="flex flex-wrap gap-4 bg-card border border-border rounded-card p-4">
        {variants.map((v) => (
          <Cell key={v} label={`${v} loading`}>
            <Button variant={v} size="md" loading>
              {v === "link"
                ? "Loading…"
                : v === "destructive"
                ? "Deleting…"
                : "Saving…"}
            </Button>
          </Cell>
        ))}
      </div>
    </div>
  )
}

// ── Backwards-compat check ─────────────────────────────────────────────────

function BackwardsCompatSection() {
  return (
    <div className="space-y-4">
      <SubHeading>
        Backwards-compat aliases (existing callers using old shadcn names)
      </SubHeading>
      <p className="text-caption text-text-muted mb-3">
        <code className="bg-chip px-1 rounded-xs font-mono">variant=&quot;default&quot;</code>{" "}
        → same as <code className="bg-chip px-1 rounded-xs font-mono">primary</code>
        {"   "}
        <code className="bg-chip px-1 rounded-xs font-mono">variant=&quot;outline&quot;</code>{" "}
        → same as <code className="bg-chip px-1 rounded-xs font-mono">secondary</code>
        {"   "}
        <code className="bg-chip px-1 rounded-xs font-mono">size=&quot;icon&quot;</code> →{" "}
        32×32px square
      </p>
      <div className="flex flex-wrap gap-4 bg-card border border-border rounded-card p-4">
        <Cell label='variant="default"'>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <Button variant={"default" as any}>Save changes</Button>
        </Cell>
        <Cell label='variant="outline"'>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <Button variant={"outline" as any}>Cancel</Button>
        </Cell>
        <Cell label='size="icon" (legacy)'>
          <Button variant="ghost" size="icon">
            <Plus size={16} strokeWidth={1.5} />
          </Button>
        </Cell>
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function ButtonsShowcasePage() {
  return (
    <main
      data-testid="buttons-showcase"
      className="min-h-screen bg-bg text-text-default px-6 py-12 font-sans"
    >
      <div className="max-w-6xl mx-auto space-y-16">
        {/* Header */}
        <header>
          <p className="text-overline uppercase tracking-widest text-text-muted mb-2">
            T10.1 Component Library
          </p>
          <h1 className="text-display text-text-default">Button &amp; Icon Button</h1>
          <p className="text-body text-text-muted mt-2">
            Visual smoke-test for Playwright baselines. 5 variants × 3 sizes × 3
            interactive states + loading + focus + icon-only. Not linked from
            navigation.
          </p>
        </header>

        {/* 5×3×3 grid */}
        <section aria-labelledby="grid-heading">
          <SectionHeading>
            <span id="grid-heading">
              Variants × Sizes × States{" "}
              <span className="text-caption text-text-muted font-normal ml-2">
                5 × 3 × 3
              </span>
            </span>
          </SectionHeading>
          <VariantSizeStateGrid />
        </section>

        {/* Focus ring */}
        <section aria-labelledby="focus-heading">
          <SectionHeading>
            <span id="focus-heading">Focus States</span>
          </SectionHeading>
          <FocusRow />
        </section>

        {/* Leading icon */}
        <section aria-labelledby="icon-heading">
          <SectionHeading>
            <span id="icon-heading">With Leading Icon</span>
          </SectionHeading>
          <LeadingIconSection />
        </section>

        {/* Icon-only */}
        <section aria-labelledby="icon-only-heading">
          <SectionHeading>
            <span id="icon-only-heading">Icon-Only Buttons</span>
          </SectionHeading>
          <IconOnlySection />
        </section>

        {/* Loading */}
        <section aria-labelledby="loading-heading">
          <SectionHeading>
            <span id="loading-heading">Loading State</span>
          </SectionHeading>
          <LoadingSection />
        </section>

        {/* Backwards compat */}
        <section aria-labelledby="compat-heading">
          <SectionHeading>
            <span id="compat-heading">Backwards Compatibility</span>
          </SectionHeading>
          <BackwardsCompatSection />
        </section>

        {/* Interactive region — used by Playwright functional tests only */}
        <InteractiveSection />
      </div>
    </main>
  )
}
