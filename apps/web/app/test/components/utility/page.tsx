import type { Metadata } from "next"

import { CodeBlock, InlineCode } from "@/components/ui/code-block"
import { Divider } from "@/components/ui/divider"
import { Kbd, KbdCombo } from "@/components/ui/kbd"

export const metadata: Metadata = {
  title: "Utility Primitives — T10.7",
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 border-b border-border pb-2 text-h2 text-text-default">
      {children}
    </h2>
  )
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-3 text-caption font-semibold uppercase tracking-wider text-text-muted">
      {children}
    </h3>
  )
}

function Sample({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex min-h-[28px] items-center justify-center">
        {children}
      </div>
      <span className="whitespace-nowrap text-[11px] text-text-subtle">
        {label}
      </span>
    </div>
  )
}

// ── Kbd samples (matches component-library-b.jsx lines 402-418) ────────────

function KbdSection() {
  return (
    <div className="space-y-4">
      <SubHeading>Kbd — single key, long key, combo</SubHeading>
      <div className="flex flex-wrap items-end gap-6 rounded-card border border-border bg-card p-4">
        <Sample label="single key">
          <Kbd>⌘</Kbd>
        </Sample>
        <Sample label="key">
          <Kbd>K</Kbd>
        </Sample>
        <Sample label="shortcut">
          <KbdCombo keys={["⌘", "S"]} />
        </Sample>
        <Sample label="long key">
          <Kbd>esc</Kbd>
        </Sample>
        <Sample label="shortcut row">
          <KbdCombo keys={["⇧", "⌘", "P"]} />
        </Sample>
        <Sample label="small variant">
          <KbdCombo keys={["⌘", "K"]} small />
        </Sample>
      </div>

      <div className="rounded-card border border-border bg-card p-4">
        <SubHeading>Kbd in context — command palette footer</SubHeading>
        <div className="flex flex-wrap items-center gap-5 text-[12px] text-text-muted">
          <span className="flex items-center gap-1.5">
            <Kbd small>↑↓</Kbd>
            navigate
          </span>
          <span className="flex items-center gap-1.5">
            <Kbd small>↵</Kbd>
            open
          </span>
          <span className="flex items-center gap-1.5">
            <Kbd small>esc</Kbd>
            close
          </span>
          <span className="ml-auto flex items-center gap-1.5">
            <span className="text-text-subtle">quick open</span>
            <KbdCombo keys={["⌘", "K"]} small />
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Divider samples ────────────────────────────────────────────────────────

function DividerSection() {
  return (
    <div className="space-y-4">
      <SubHeading>Divider — horizontal, with label, vertical</SubHeading>
      <div className="space-y-6 rounded-card border border-border bg-card p-6">
        <div className="w-[300px]">
          <div className="mb-2 text-[11px] text-text-subtle">horizontal</div>
          <Divider />
        </div>

        <div className="w-[300px]">
          <div className="mb-2 text-[11px] text-text-subtle">
            with centered label
          </div>
          <Divider label="or" />
        </div>

        <div>
          <div className="mb-2 text-[11px] text-text-subtle">vertical</div>
          <div className="flex h-8 items-center gap-3.5 text-[13px] text-text-default">
            <span>Left</span>
            <Divider orientation="vertical" />
            <span>Right</span>
            <Divider orientation="vertical" />
            <span>End</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── CodeBlock samples ──────────────────────────────────────────────────────

const EMBED_SNIPPET = `<script>
  window.DigitalMenu.init({
    slug: "cafelinville",
    theme: "warm"
  });
</script>`

const TS_SNIPPET = `import { prisma } from "@/lib/db"

export async function getMenu(slug: string) {
  return prisma.menu.findUnique({
    where: { slug, status: "PUBLISHED" },
  })
}`

function CodeBlockSection() {
  return (
    <div className="space-y-6">
      <SubHeading>Code block — with language label and copy</SubHeading>
      <div className="max-w-[520px]">
        <CodeBlock code={EMBED_SNIPPET} language="html" />
      </div>

      <SubHeading>Code block — typescript snippet</SubHeading>
      <div className="max-w-[520px]">
        <CodeBlock code={TS_SNIPPET} language="ts" />
      </div>

      <SubHeading>Code block — no language, no copy</SubHeading>
      <div className="max-w-[520px]">
        <CodeBlock code={`npm install @digital-menu/sdk`} hideCopy />
      </div>

      <SubHeading>Inline code</SubHeading>
      <p className="max-w-[520px] text-body text-text-muted">
        Mount the menu onto any DOM node by passing the{" "}
        <InlineCode>window.DigitalMenu</InlineCode> global. Use{" "}
        <InlineCode>init()</InlineCode> to provide the slug and theme.
      </p>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function UtilityShowcasePage() {
  return (
    <main
      data-testid="utility-showcase"
      className="min-h-screen bg-bg px-6 py-12 font-sans text-text-default"
    >
      <div className="mx-auto max-w-5xl space-y-16">
        <header>
          <p className="mb-2 text-overline uppercase tracking-widest text-text-muted">
            T10.7 Component Library
          </p>
          <h1 className="text-display text-text-default">Utility Primitives</h1>
          <p className="mt-2 text-body text-text-muted">
            Kbd, Divider, CodeBlock. Not linked from navigation — used for
            visual baselines and functional tests.
          </p>
        </header>

        <section aria-labelledby="kbd-heading">
          <SectionHeading>
            <span id="kbd-heading">Kbd</span>
          </SectionHeading>
          <KbdSection />
        </section>

        <section aria-labelledby="dividers-heading">
          <SectionHeading>
            <span id="dividers-heading">Dividers</span>
          </SectionHeading>
          <DividerSection />
        </section>

        <section aria-labelledby="code-heading">
          <SectionHeading>
            <span id="code-heading">Code block</span>
          </SectionHeading>
          <CodeBlockSection />
        </section>
      </div>
    </main>
  )
}
