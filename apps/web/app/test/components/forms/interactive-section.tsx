"use client"

import * as React from "react"

import { Input } from "@/components/ui/input"
import { Field } from "@/components/ui/field"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Segmented, SegmentedItem } from "@/components/ui/segmented"
import { Slider } from "@/components/ui/slider"
import { Dropzone } from "@/components/ui/dropzone"
import { PriceInput } from "@/components/ui/price-input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Combobox } from "@/components/ui/combobox"
import { MultiSelect } from "@/components/ui/multi-select"

/**
 * Client-side interactive region exclusively used by Playwright functional
 * tests. Holds controlled state for every primitive so assertions can verify
 * value updates, toggling, etc.
 */
export function InteractiveSection() {
  // Controlled Input — tests that typing updates the value reactively.
  const [inputValue, setInputValue] = React.useState("")

  // Error input — test "Zod error → red border + helper" via a 2-char min rule.
  const [emailValue, setEmailValue] = React.useState("")
  const emailError =
    emailValue.length > 0 && !emailValue.includes("@")
      ? "Must be a valid email address"
      : null

  // Switch — tests toggle behavior.
  const [published, setPublished] = React.useState(false)

  // Checkbox tri-state: indeterminate → checked → unchecked → indeterminate.
  // Playwright asserts the data-state attribute changes through the cycle.
  const [checkboxState, setCheckboxState] = React.useState<
    boolean | "indeterminate"
  >("indeterminate")
  const cycleCheckbox = () => {
    setCheckboxState((prev) =>
      prev === "indeterminate" ? true : prev === true ? false : "indeterminate",
    )
  }

  // Segmented.
  const [segmentedValue, setSegmentedValue] = React.useState("week")

  // Slider.
  const [sliderValue, setSliderValue] = React.useState<number[]>([40])

  // Dropzone — holds the uploaded file so we can assert filename appears.
  const [droppedFile, setDroppedFile] = React.useState<File | null>(null)

  // Select.
  const [currency, setCurrency] = React.useState("GEL")

  // Combobox.
  const [category, setCategory] = React.useState("")

  // Multi-select.
  const [tags, setTags] = React.useState<string[]>(["khachapuri"])

  // Price.
  const [price, setPrice] = React.useState("14.50")

  return (
    <section
      aria-labelledby="interactive-heading"
      data-testid="interactive-section"
      className="space-y-6"
    >
      <h2
        id="interactive-heading"
        className="text-h2 text-text-default mb-4 pb-2 border-b border-border"
      >
        Interactive tests
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Controlled input */}
        <Field>
          <Field.Label htmlFor="it-name">Controlled input</Field.Label>
          <Input
            id="it-name"
            data-testid="it-input"
            placeholder="Type something"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            clearable
            onClear={() => setInputValue("")}
          />
          <Field.Helper>
            Current value:{" "}
            <span data-testid="it-input-value" className="font-mono">
              {inputValue}
            </span>
          </Field.Helper>
        </Field>

        {/* Error + helper */}
        <Field>
          <Field.Label htmlFor="it-email">Email (with validation)</Field.Label>
          <Input
            id="it-email"
            data-testid="it-email"
            type="email"
            placeholder="you@cafelinville.ge"
            value={emailValue}
            onChange={(e) => setEmailValue(e.target.value)}
            error={!!emailError}
          />
          {emailError ? (
            <Field.Error data-testid="it-email-error">{emailError}</Field.Error>
          ) : (
            <Field.Helper>Must contain an @.</Field.Helper>
          )}
        </Field>

        {/* Switch */}
        <Field>
          <Field.Label htmlFor="it-switch">Published</Field.Label>
          <div className="flex items-center gap-[10px]">
            <Switch
              id="it-switch"
              data-testid="it-switch"
              checked={published}
              onCheckedChange={setPublished}
            />
            <span className="text-caption text-text-muted" data-testid="it-switch-state">
              {published ? "on" : "off"}
            </span>
          </div>
        </Field>

        {/* Checkbox indeterminate */}
        <Field>
          <Field.Label>Checkbox (tri-state)</Field.Label>
          <div className="flex items-center gap-[10px]">
            <Checkbox
              data-testid="it-checkbox"
              checked={checkboxState}
              onCheckedChange={(v) =>
                // Sync the indeterminate state through the Radix callback too —
                // Radix sends `true | false`, and "indeterminate" is only set
                // imperatively from our cycle handler.
                setCheckboxState(v)
              }
            />
            <button
              type="button"
              data-testid="it-checkbox-cycle"
              onClick={cycleCheckbox}
              className="text-caption underline text-text-muted"
            >
              Cycle state
            </button>
            <span className="text-caption text-text-muted" data-testid="it-checkbox-state">
              {checkboxState === "indeterminate"
                ? "indeterminate"
                : checkboxState
                ? "checked"
                : "unchecked"}
            </span>
          </div>
        </Field>

        {/* Radio */}
        <Field>
          <Field.Label>Radio group</Field.Label>
          <RadioGroup
            data-testid="it-radio"
            defaultValue="ka"
            className="flex-row gap-[14px]"
          >
            {(["ka", "en", "ru"] as const).map((v) => (
              <label key={v} className="inline-flex items-center gap-[6px] cursor-pointer">
                <RadioGroupItem value={v} data-testid={`it-radio-${v}`} />
                <span className="text-caption text-text-default uppercase">{v}</span>
              </label>
            ))}
          </RadioGroup>
        </Field>

        {/* Segmented */}
        <Field>
          <Field.Label>Segmented</Field.Label>
          <Segmented
            data-testid="it-segmented"
            value={segmentedValue}
            onValueChange={setSegmentedValue}
            ariaLabel="Time range"
          >
            <SegmentedItem value="day" data-testid="it-seg-day">Day</SegmentedItem>
            <SegmentedItem value="week" data-testid="it-seg-week">Week</SegmentedItem>
            <SegmentedItem value="month" data-testid="it-seg-month">Month</SegmentedItem>
          </Segmented>
          <Field.Helper>
            Active:{" "}
            <span data-testid="it-seg-active" className="font-mono">
              {segmentedValue}
            </span>
          </Field.Helper>
        </Field>

        {/* Slider */}
        <Field>
          <Field.Label>Slider</Field.Label>
          <Slider
            data-testid="it-slider"
            value={sliderValue}
            onValueChange={setSliderValue}
            min={0}
            max={100}
            step={1}
            aria-label="Opacity"
          />
          <Field.Helper>
            Value:{" "}
            <span data-testid="it-slider-value" className="font-mono tabular-nums">
              {sliderValue[0]}
            </span>
          </Field.Helper>
        </Field>

        {/* Dropzone */}
        <Field>
          <Field.Label>Dropzone</Field.Label>
          <Dropzone
            data-testid="it-dropzone"
            file={droppedFile}
            accept="image/*"
            onFileSelect={setDroppedFile}
            onRemove={() => setDroppedFile(null)}
          />
          <Field.Helper>
            File:{" "}
            <span data-testid="it-dropzone-file" className="font-mono">
              {droppedFile?.name ?? "(none)"}
            </span>
          </Field.Helper>
        </Field>

        {/* Select */}
        <Field>
          <Field.Label>Currency</Field.Label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger data-testid="it-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GEL">Georgian Lari (₾)</SelectItem>
              <SelectItem value="USD">US Dollar ($)</SelectItem>
              <SelectItem value="EUR">Euro (€)</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        {/* Combobox */}
        <Field>
          <Field.Label>Category</Field.Label>
          <Combobox
            data-testid="it-combobox"
            value={category}
            onValueChange={setCategory}
            placeholder="Pick a category"
            options={[
              { value: "breakfast", label: "Breakfast" },
              { value: "mains", label: "Mains" },
              { value: "drinks", label: "Drinks" },
              { value: "desserts", label: "Desserts" },
            ]}
          />
        </Field>

        {/* MultiSelect */}
        <Field>
          <Field.Label>Tags</Field.Label>
          <MultiSelect
            data-testid="it-multi"
            value={tags}
            onValueChange={setTags}
            placeholder="Add a tag, press Enter"
          />
          <Field.Helper>
            Count:{" "}
            <span data-testid="it-multi-count" className="font-mono tabular-nums">
              {tags.length}
            </span>
          </Field.Helper>
        </Field>

        {/* Price */}
        <Field>
          <Field.Label>Price</Field.Label>
          <PriceInput
            data-testid="it-price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </Field>
      </div>
    </section>
  )
}
