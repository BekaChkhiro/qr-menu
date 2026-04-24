"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"

/**
 * Client-side interactive region used exclusively by Playwright functional
 * tests.  It is intentionally kept minimal — the goal is to cover click
 * behaviour, disabled state, and loading state without coupling to the
 * visual-smoke grid above it.
 */
export function InteractiveSection() {
  const [count, setCount] = React.useState(0)

  return (
    <section
      aria-labelledby="interactive-heading"
      data-testid="interactive-section"
    >
      <h2
        id="interactive-heading"
        className="text-h2 text-text-default mb-4 pb-2 border-b border-border"
      >
        Interactive tests
      </h2>

      {/* Click counter — visible so Playwright can read it */}
      <p
        data-testid="click-count"
        className="text-caption text-text-muted mb-4"
      >
        Clicks: {count}
      </p>

      <div className="flex flex-wrap gap-4 bg-card border border-border rounded-card p-4">
        {/* Clickable primary md button */}
        <Button
          variant="primary"
          size="md"
          data-testid="btn-click"
          onClick={() => setCount((c) => c + 1)}
        >
          Click me
        </Button>

        {/* Disabled — pointer-events:none so clicks must never reach handler */}
        <Button
          variant="primary"
          size="md"
          disabled
          data-testid="btn-disabled"
          onClick={() => setCount((c) => c + 1)}
        >
          Disabled
        </Button>

        {/* Loading — aria-busy=true, spinner rendered, label stays */}
        <Button
          variant="primary"
          size="md"
          loading
          data-testid="btn-loading"
          onClick={() => setCount((c) => c + 1)}
        >
          Saving…
        </Button>
      </div>
    </section>
  )
}
