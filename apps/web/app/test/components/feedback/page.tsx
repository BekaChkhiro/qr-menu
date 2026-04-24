import type { Metadata } from "next"
import { FileText, Plus, Search } from "lucide-react"

import { Banner } from "@/components/ui/banner"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { Progress, ProgressStepper } from "@/components/ui/progress"
import {
  Skeleton,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonRow,
  SkeletonText,
} from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"

import { InteractiveSection } from "./interactive-section"

export const metadata: Metadata = {
  title: "Feedback Primitives — T10.3",
}

// ── Section headings ──────────────────────────────────────────────────────

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

function Cell({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex min-h-[48px] items-center justify-center">
        {children}
      </div>
      <span className="text-[11px] text-text-subtle whitespace-nowrap">
        {label}
      </span>
    </div>
  )
}

// ── Banners (static preview) ──────────────────────────────────────────────

function BannerSection() {
  return (
    <div className="space-y-4">
      <SubHeading>4 tones — with & without CTA, dismissible variant</SubHeading>
      <div className="flex max-w-[520px] flex-col gap-3">
        <Banner
          tone="info"
          title="Translation mode is on"
          description="Edits here update the Georgian source, not translations."
          action={
            <Button variant="secondary" size="sm">
              Learn more
            </Button>
          }
        />
        <Banner
          tone="success"
          title="You're on Pro"
          description="Enjoy unlimited menus, analytics, and custom QR codes."
        />
        <Banner
          tone="warning"
          title="You're near your plan limit"
          description="28/30 items used. Upgrade to Pro for unlimited items."
          action={
            <Button variant="secondary" size="sm">
              Upgrade
            </Button>
          }
        />
        <Banner
          tone="error"
          title="Payment failed"
          description="Your card ending in 4242 was declined. Update it to avoid downgrade."
          action={
            <Button variant="secondary" size="sm">
              Update card
            </Button>
          }
        />
      </div>
    </div>
  )
}

// ── Empty states ──────────────────────────────────────────────────────────

function EmptyStateSection() {
  return (
    <div className="space-y-4">
      <SubHeading>Small (inline) & large (dashed card with CTA)</SubHeading>
      <div className="grid grid-cols-[360px_1fr] gap-6 items-start">
        <EmptyState
          size="lg"
          icon={FileText}
          title="No menus yet"
          description="Create your first menu to start serving your customers."
          action={
            <Button variant="primary" size="md" leadingIcon={Plus}>
              Create menu
            </Button>
          }
        />
        <EmptyState
          size="sm"
          icon={Search}
          title="No results"
          description="Try a different keyword or clear filters."
        />
      </div>
    </div>
  )
}

// ── Skeletons ──────────────────────────────────────────────────────────────

function SkeletonSection() {
  return (
    <div className="space-y-4">
      <SubHeading>Avatar · Text · Row · Card</SubHeading>
      <div className="grid grid-cols-2 gap-6">
        {/* Row layout (avatar + lines) */}
        <div className="bg-card border border-border rounded-card p-4">
          <div className="text-[11px] uppercase tracking-wider text-text-subtle mb-3">
            Row
          </div>
          <div className="flex items-center gap-3">
            <SkeletonAvatar size={40} />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-2.5 w-[55%]" />
              <Skeleton className="h-2 w-[85%]" />
            </div>
          </div>
          <div className="mt-3 border-t border-border pt-3">
            <SkeletonRow />
          </div>
        </div>

        {/* Text lines only */}
        <div className="bg-card border border-border rounded-card p-4">
          <div className="text-[11px] uppercase tracking-wider text-text-subtle mb-3">
            Text
          </div>
          <SkeletonText lines={3} />
          <div className="mt-4 flex items-center gap-3">
            <SkeletonAvatar size={24} />
            <SkeletonAvatar size={32} />
            <SkeletonAvatar size={40} />
            <SkeletonAvatar size={56} />
          </div>
        </div>

        {/* Full card */}
        <div className="col-span-2">
          <div className="text-[11px] uppercase tracking-wider text-text-subtle mb-3">
            Card
          </div>
          <div className="grid grid-cols-3 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Spinners ────────────────────────────────────────────────────────────────

function SpinnerSection() {
  return (
    <div className="space-y-4">
      <SubHeading>3 sizes × 3 tones</SubHeading>
      <div className="flex flex-wrap gap-6 bg-card border border-border rounded-card p-4">
        <Cell label="xs · slate">
          <Spinner size="xs" tone="slate" />
        </Cell>
        <Cell label="sm · slate">
          <Spinner size="sm" tone="slate" />
        </Cell>
        <Cell label="md · slate">
          <Spinner size="md" tone="slate" />
        </Cell>
        <Cell label="xs · accent">
          <Spinner size="xs" tone="accent" />
        </Cell>
        <Cell label="sm · accent">
          <Spinner size="sm" tone="accent" />
        </Cell>
        <Cell label="md · accent">
          <Spinner size="md" tone="accent" />
        </Cell>
        <div className="flex items-center gap-4 rounded-md bg-text-default px-4 py-3">
          <Cell label="sm · white">
            <Spinner size="sm" tone="white" />
          </Cell>
          <Cell label="md · white">
            <Spinner size="md" tone="white" />
          </Cell>
        </div>
      </div>
    </div>
  )
}

// ── Progress ───────────────────────────────────────────────────────────────

function ProgressSection() {
  return (
    <div className="space-y-4">
      <SubHeading>Determinate · indeterminate · segmented stepper</SubHeading>
      <div className="space-y-6 bg-card border border-border rounded-card p-6">
        <div className="max-w-[240px] space-y-4">
          <div>
            <div className="text-[11px] text-text-subtle mb-1">
              default · 35%
            </div>
            <Progress value={35} showLabel />
          </div>
          <div>
            <div className="text-[11px] text-text-subtle mb-1">
              success · 80%
            </div>
            <Progress value={80} tone="success" showLabel />
          </div>
          <div>
            <div className="text-[11px] text-text-subtle mb-1">
              warning · 95%
            </div>
            <Progress value={95} tone="warning" showLabel />
          </div>
          <div>
            <div className="text-[11px] text-text-subtle mb-1">danger · 12%</div>
            <Progress value={12} tone="danger" showLabel />
          </div>
          <div>
            <div className="text-[11px] text-text-subtle mb-1">
              indeterminate · accent
            </div>
            <Progress tone="accent" />
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <div className="text-[11px] text-text-subtle mb-2">
            Stepper · step 2 of 4
          </div>
          <div className="max-w-[320px]">
            <ProgressStepper totalSteps={4} currentStep={2} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function FeedbackShowcasePage() {
  return (
    <main
      data-testid="feedback-showcase"
      className="min-h-screen bg-bg text-text-default px-6 py-12 font-sans"
    >
      <div className="max-w-6xl mx-auto space-y-16">
        <header>
          <p className="text-overline uppercase tracking-widest text-text-muted mb-2">
            T10.3 Component Library
          </p>
          <h1 className="text-display text-text-default">Feedback Primitives</h1>
          <p className="text-body text-text-muted mt-2">
            Toast, Banner, Empty State, Skeleton, Spinner, Progress. Not linked
            from navigation — used for visual baselines and functional tests.
          </p>
        </header>

        <section aria-labelledby="toasts-heading">
          <SectionHeading>
            <span id="toasts-heading">Toasts</span>
          </SectionHeading>
          <p className="text-caption text-text-muted mb-3">
            Trigger toasts from the interactive section below. Toasts auto-dismiss
            after 5s, support an action button, and render in the top-right.
          </p>
        </section>

        <section aria-labelledby="banners-heading">
          <SectionHeading>
            <span id="banners-heading">Banners</span>
          </SectionHeading>
          <BannerSection />
        </section>

        <section aria-labelledby="empty-heading">
          <SectionHeading>
            <span id="empty-heading">Empty States</span>
          </SectionHeading>
          <EmptyStateSection />
        </section>

        <section aria-labelledby="skeleton-heading">
          <SectionHeading>
            <span id="skeleton-heading">Skeletons</span>
          </SectionHeading>
          <SkeletonSection />
        </section>

        <section aria-labelledby="spinners-heading">
          <SectionHeading>
            <span id="spinners-heading">Spinners</span>
          </SectionHeading>
          <SpinnerSection />
        </section>

        <section aria-labelledby="progress-heading">
          <SectionHeading>
            <span id="progress-heading">Progress</span>
          </SectionHeading>
          <ProgressSection />
        </section>

        <InteractiveSection />
      </div>
    </main>
  )
}
