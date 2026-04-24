import * as React from "react"

import { Input, type InputProps } from "./input"

// ── Price input ──────────────────────────────────────────────────────────────
// Section H spec: numeric input with ₾ suffix and tabular-nums. Accepts the
// full Input API (size, error, icon, etc.). Locks `type` to "number" and
// `numeric` to true so callers don't have to remember.

export interface PriceInputProps extends Omit<InputProps, "type" | "suffix" | "numeric"> {
  /** Currency symbol rendered as suffix. Defaults to ₾ (Georgian Lari). */
  currency?: string
}

const PriceInput = React.forwardRef<HTMLInputElement, PriceInputProps>(
  ({ currency = "₾", step = "0.01", inputMode = "decimal", ...props }, ref) => {
    return (
      <Input
        ref={ref}
        type="number"
        numeric
        suffix={currency}
        step={step}
        inputMode={inputMode}
        {...props}
      />
    )
  }
)
PriceInput.displayName = "PriceInput"

export { PriceInput }
