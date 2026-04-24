"use client"

import * as React from "react"
import { Upload, X } from "lucide-react"

import { cn } from "@/lib/utils"

// ── Section H Dropzone spec (component-library-a.jsx, lines 320-354) ─────────
// Container: w 220 / h 88, padding 14, radius 8, dashed 1.5px border
//   default  — bg #FCFBF8, border border-token, icon + "Drop image, or browse"
//   hover    — bg accent-soft, border accent (terracotta), text accent
//   filled   — bg white, solid border, 40×40 thumbnail + filename + size + "replace"
//   error    — bg danger-soft, border danger, "File too large (max 2MB)"
//
// Behavior:
//   - click the zone opens the native file picker
//   - drag over → hover visual
//   - drop / pick a file → onFileSelect(file) callback
//   - when `file` prop is provided, renders filled state with thumbnail

export interface DropzoneProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** File currently held by the dropzone. When present, renders filled state. */
  file?: File | null
  /** Static thumbnail URL (for already-uploaded files). */
  thumbnailUrl?: string
  /** Static filename label (for already-uploaded files). */
  filename?: string
  /** Static size label (for already-uploaded files). */
  fileSize?: string
  /** Accepted MIME types / extensions (passed to the hidden input). */
  accept?: string
  /** Error message to display below (turns the dropzone red). */
  error?: string | null
  /** Fired when the user selects or drops a file. */
  onFileSelect?: (file: File) => void
  /** Fired when the user clicks the remove button on a filled dropzone. */
  onRemove?: () => void
  /** Disable interaction. */
  disabled?: boolean
}

const Dropzone = React.forwardRef<HTMLDivElement, DropzoneProps>(
  (
    {
      className,
      file,
      thumbnailUrl,
      filename,
      fileSize,
      accept,
      error,
      onFileSelect,
      onRemove,
      disabled,
      ...props
    },
    ref,
  ) => {
    const inputRef = React.useRef<HTMLInputElement>(null)
    const [isHover, setIsHover] = React.useState(false)

    const hasFile = !!file || !!thumbnailUrl
    const displayName = filename ?? file?.name ?? ""
    const displaySize = fileSize ?? (file ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : "")

    const openPicker = () => {
      if (!disabled) inputRef.current?.click()
    }

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsHover(false)
      if (disabled) return
      const dropped = e.dataTransfer.files?.[0]
      if (dropped && onFileSelect) onFileSelect(dropped)
    }

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      if (disabled) return
      if (!isHover) setIsHover(true)
    }

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsHover(false)
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const picked = e.target.files?.[0]
      if (picked && onFileSelect) onFileSelect(picked)
      // Reset the input so the same file can be re-selected.
      e.target.value = ""
    }

    // Which visual state to render?
    let state: "default" | "hover" | "filled" | "error"
    if (error) state = "error"
    else if (hasFile) state = "filled"
    else if (isHover) state = "hover"
    else state = "default"

    const stateClasses: Record<typeof state, string> = {
      default: "bg-[#FCFBF8] border-border text-text-muted border-dashed",
      hover: "bg-accent-soft border-accent text-accent border-dashed",
      filled: "bg-card border-border text-text-default border-solid",
      error: "bg-danger-soft border-danger text-danger border-dashed",
    }

    return (
      <div>
        <div
          ref={ref}
          data-state={state}
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label={hasFile ? "Replace image" : "Drop image or browse"}
          aria-disabled={disabled || undefined}
          onClick={openPicker}
          onKeyDown={(e) => {
            if (disabled) return
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              openPicker()
            }
          }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "flex w-full min-h-[88px] items-center justify-center gap-[10px]",
            "px-[14px] py-[14px] rounded-[8px] border-[1.5px]",
            "transition-colors duration-150 cursor-pointer",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            disabled && "cursor-not-allowed opacity-50",
            stateClasses[state],
            className,
          )}
          {...props}
        >
          {state === "filled" ? (
            <>
              {/* Thumbnail */}
              <div
                className="h-[40px] w-[40px] shrink-0 rounded-[6px] bg-[#8B6F3A] bg-cover bg-center"
                style={thumbnailUrl ? { backgroundImage: `url(${thumbnailUrl})` } : undefined}
                aria-hidden="true"
              />
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-medium truncate">
                  {displayName || "Uploaded file"}
                </div>
                <div className="text-[11px] text-text-muted">
                  {displaySize}
                  <span aria-hidden="true"> · </span>
                  <span className="underline underline-offset-2">replace</span>
                </div>
              </div>
              {onRemove ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemove()
                  }}
                  aria-label="Remove file"
                  className="shrink-0 rounded-xs p-[4px] text-text-muted hover:text-text-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <X size={14} strokeWidth={1.5} aria-hidden="true" />
                </button>
              ) : null}
            </>
          ) : (
            <>
              <Upload size={16} strokeWidth={1.5} aria-hidden="true" />
              <div className="text-[12px] leading-[1.4]">
                {state === "error" ? error : "Drop image, or browse"}
              </div>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleInputChange}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            disabled={disabled}
            // data-testid lets Playwright target the hidden input for setInputFiles().
            data-testid="dropzone-input"
          />
        </div>
      </div>
    )
  },
)
Dropzone.displayName = "Dropzone"

export { Dropzone }
