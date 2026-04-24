import * as React from "react"

import { cn } from "@/lib/utils"

// ── Field primitives ─────────────────────────────────────────────────────────
// Label + control + helper/error line. Reused by every form in the redesign.
//
// Usage:
//   <Field>
//     <Field.Label htmlFor="menu-name">Menu name</Field.Label>
//     <Input id="menu-name" />
//     <Field.Helper>Shown to customers on the public menu.</Field.Helper>
//   </Field>
//
//   <Field>
//     <Field.Label htmlFor="slug">URL slug</Field.Label>
//     <Input id="slug" error />
//     <Field.Error>Slug already in use.</Field.Error>
//   </Field>

function Field({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-[6px]", className)} {...props} />
}

function FieldLabel({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "text-[12px] font-medium text-text-default leading-none",
        className,
      )}
      {...props}
    />
  )
}
FieldLabel.displayName = "Field.Label"

function FieldHelper({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-[11.5px] text-text-muted leading-[1.4]", className)}
      {...props}
    />
  )
}
FieldHelper.displayName = "Field.Helper"

function FieldError({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      role="alert"
      className={cn("text-[11.5px] text-danger leading-[1.4]", className)}
      {...props}
    />
  )
}
FieldError.displayName = "Field.Error"

const FieldNamespace = Object.assign(Field, {
  Label: FieldLabel,
  Helper: FieldHelper,
  Error: FieldError,
})

export { FieldNamespace as Field, FieldLabel, FieldHelper, FieldError }
