"use client"

import * as React from "react"
import { Check, Copy } from "lucide-react"

import { cn } from "@/lib/utils"

// ── Section H CodeBlock spec (component-library-b.jsx lines 367-379) ────────
// - Dark surface: #1A1A1A bg, #E8E8E4 text
// - 14px 16px padding, 8px radius, 12px mono text, 1.65 line-height
// - Copy button (top-right), optional language label (top-left overline)
// - After copy: icon swaps to Check for ~1.5s

interface CodeBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Code to render and copy. Indentation/newlines preserved. */
  code: string
  /** Language tag shown in the header (e.g. "html", "ts"). */
  language?: string
  /** Hide the copy button entirely. */
  hideCopy?: boolean
}

const CodeBlock = React.forwardRef<HTMLDivElement, CodeBlockProps>(
  ({ className, code, language, hideCopy = false, ...props }, ref) => {
    const [copied, setCopied] = React.useState(false)
    const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

    React.useEffect(() => {
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
      }
    }, [])

    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(code)
        setCopied(true)
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        timeoutRef.current = setTimeout(() => setCopied(false), 1500)
      } catch {
        // Clipboard may be unavailable (insecure context, permission denied) —
        // fail silently; the visual state simply won't flip.
      }
    }

    const hasHeader = Boolean(language) || !hideCopy

    return (
      <div
        ref={ref}
        data-testid="code-block"
        className={cn(
          "relative overflow-hidden rounded-md bg-[#1A1A1A] text-[#E8E8E4]",
          className
        )}
        {...props}
      >
        {hasHeader && (
          <div className="flex items-center justify-between border-b border-white/5 px-4 py-2">
            {language ? (
              <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.05em] text-white/50">
                {language}
              </span>
            ) : (
              <span aria-hidden="true" />
            )}
            {!hideCopy && (
              <button
                type="button"
                onClick={handleCopy}
                aria-label={copied ? "Copied" : "Copy code"}
                data-testid="code-block-copy"
                data-copied={copied ? "true" : "false"}
                className={cn(
                  "inline-flex h-6 items-center gap-1.5 rounded-xs px-1.5",
                  "text-[11px] font-medium text-white/70 transition-colors",
                  "hover:bg-white/10 hover:text-white",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[#1A1A1A]"
                )}
              >
                {copied ? (
                  <>
                    <Check size={13} strokeWidth={2} aria-hidden="true" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy size={13} strokeWidth={1.5} aria-hidden="true" />
                    Copy
                  </>
                )}
              </button>
            )}
          </div>
        )}
        <pre className="overflow-x-auto px-4 py-3.5 font-mono text-[12px] leading-[1.65]">
          <code>{code}</code>
        </pre>
      </div>
    )
  }
)
CodeBlock.displayName = "CodeBlock"

// ── Inline code (used alongside CodeBlock in the showcase) ───────────────────

type InlineCodeProps = React.HTMLAttributes<HTMLElement>

const InlineCode = React.forwardRef<HTMLElement, InlineCodeProps>(
  ({ className, ...props }, ref) => (
    <code
      ref={ref}
      className={cn(
        "rounded-xs border border-border bg-chip px-1.5 py-px font-mono text-[12px] text-accent",
        className
      )}
      {...props}
    />
  )
)
InlineCode.displayName = "InlineCode"

export { CodeBlock, InlineCode }
