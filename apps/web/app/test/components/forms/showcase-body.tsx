"use client"

import { Search, Mail } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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

import { InteractiveSection } from "./interactive-section"

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

function Sample({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-start gap-2 w-full max-w-[280px]">
      <div className="w-full">{children}</div>
      <span className="text-[11px] text-text-subtle">{label}</span>
    </div>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap gap-4 bg-card border border-border rounded-card p-4">
      {children}
    </div>
  )
}

// ── Input / Textarea ──────────────────────────────────────────────────────

function InputsSection() {
  return (
    <div className="space-y-8">
      <div>
        <SubHeading>Text input — states</SubHeading>
        <Row>
          <Sample label="default">
            <Input placeholder="Menu name" />
          </Sample>
          <Sample label="filled">
            <Input defaultValue="Main menu — All day" />
          </Sample>
          <Sample label="error + helper">
            <div className="flex flex-col gap-[4px]">
              <Input placeholder="Required" error />
              <span className="text-[11.5px] text-danger">Please enter a menu name.</span>
            </div>
          </Sample>
          <Sample label="disabled">
            <Input defaultValue="Read-only value" disabled />
          </Sample>
        </Row>
      </div>

      <div>
        <SubHeading>Text input — sizes</SubHeading>
        <Row>
          <Sample label="sm">
            <Input size="sm" defaultValue="Small" />
          </Sample>
          <Sample label="md">
            <Input size="md" defaultValue="Medium" />
          </Sample>
          <Sample label="lg">
            <Input size="lg" defaultValue="Large" />
          </Sample>
        </Row>
      </div>

      <div>
        <SubHeading>Text input — icon, prefix, suffix, clearable</SubHeading>
        <Row>
          <Sample label="leading icon">
            <Input icon={Search} placeholder="Search menu items" />
          </Sample>
          <Sample label="leading icon (mail)">
            <Input icon={Mail} defaultValue="nino@cafelinville.ge" />
          </Sample>
          <Sample label="prefix">
            <Input prefix="cafelinville.ge/" defaultValue="main" />
          </Sample>
          <Sample label="suffix (₾)">
            <Input suffix="₾" defaultValue="14" numeric />
          </Sample>
          <Sample label="clearable">
            <Input clearable defaultValue="khachapuri" />
          </Sample>
        </Row>
      </div>

      <div>
        <SubHeading>Textarea</SubHeading>
        <Row>
          <Sample label="default">
            <Textarea defaultValue="Small-batch coffee, khachapuri, and seasonal brunch on Rustaveli Avenue." />
          </Sample>
          <Sample label="with counter">
            <Textarea
              defaultValue="Small-batch coffee, khachapuri, and seasonal brunch."
              maxLength={140}
              showCount
            />
          </Sample>
          <Sample label="error">
            <Textarea
              defaultValue=""
              placeholder="Required"
              error
            />
          </Sample>
          <Sample label="disabled">
            <Textarea defaultValue="Read-only" disabled />
          </Sample>
        </Row>
      </div>

      <div>
        <SubHeading>Price input (₾, tabular-nums)</SubHeading>
        <Row>
          <Sample label="default">
            <PriceInput defaultValue="14.50" />
          </Sample>
          <Sample label="error">
            <PriceInput defaultValue="-1" error />
          </Sample>
          <Sample label="disabled">
            <PriceInput defaultValue="9.00" disabled />
          </Sample>
        </Row>
      </div>
    </div>
  )
}

// ── Select / Combobox / Multi-select ──────────────────────────────────────

function SelectSection() {
  return (
    <div className="space-y-8">
      <div>
        <SubHeading>Select (closed)</SubHeading>
        <Row>
          <Sample label="default">
            <Select defaultValue="GEL">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GEL">Georgian Lari (₾)</SelectItem>
                <SelectItem value="USD">US Dollar ($)</SelectItem>
                <SelectItem value="EUR">Euro (€)</SelectItem>
              </SelectContent>
            </Select>
          </Sample>
          <Sample label="disabled">
            <Select defaultValue="USD" disabled>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">US Dollar ($)</SelectItem>
              </SelectContent>
            </Select>
          </Sample>
        </Row>
      </div>

      <div>
        <SubHeading>Combobox (searchable)</SubHeading>
        <Row>
          <Sample label="default">
            <Combobox
              placeholder="Pick a category"
              options={[
                { value: "breakfast", label: "Breakfast" },
                { value: "mains", label: "Mains" },
                { value: "drinks", label: "Drinks" },
                { value: "desserts", label: "Desserts" },
              ]}
            />
          </Sample>
          <Sample label="with value">
            <Combobox
              value="mains"
              onValueChange={() => {}}
              options={[
                { value: "breakfast", label: "Breakfast" },
                { value: "mains", label: "Mains" },
                { value: "drinks", label: "Drinks" },
              ]}
            />
          </Sample>
        </Row>
      </div>

      <div>
        <SubHeading>Multi-select (chips)</SubHeading>
        <Row>
          <Sample label="empty">
            <MultiSelect placeholder="Add a tag, press Enter" />
          </Sample>
          <Sample label="with chips">
            <MultiSelect defaultValue={["khachapuri", "badrijani", "chakapuli"]} />
          </Sample>
          <Sample label="error">
            <MultiSelect defaultValue={["bad-tag"]} error />
          </Sample>
        </Row>
      </div>
    </div>
  )
}

// ── Toggle primitives ─────────────────────────────────────────────────────

function TogglesSection() {
  return (
    <div className="space-y-8">
      <div>
        <SubHeading>Switch</SubHeading>
        <Row>
          <Sample label="off">
            <Switch />
          </Sample>
          <Sample label="on">
            <Switch defaultChecked />
          </Sample>
          <Sample label="disabled off">
            <Switch disabled />
          </Sample>
          <Sample label="disabled on">
            <Switch disabled defaultChecked />
          </Sample>
        </Row>
      </div>

      <div>
        <SubHeading>Checkbox</SubHeading>
        <Row>
          <Sample label="default">
            <Checkbox />
          </Sample>
          <Sample label="checked">
            <Checkbox defaultChecked />
          </Sample>
          <Sample label="indeterminate">
            <Checkbox checked="indeterminate" />
          </Sample>
          <Sample label="disabled">
            <Checkbox disabled />
          </Sample>
          <Sample label="disabled checked">
            <Checkbox disabled defaultChecked />
          </Sample>
        </Row>
      </div>

      <div>
        <SubHeading>Radio</SubHeading>
        <Row>
          <Sample label="group">
            <RadioGroup defaultValue="ka" className="flex-row gap-[14px]">
              <label className="inline-flex items-center gap-[6px]">
                <RadioGroupItem value="ka" /> <span className="text-caption">KA</span>
              </label>
              <label className="inline-flex items-center gap-[6px]">
                <RadioGroupItem value="en" /> <span className="text-caption">EN</span>
              </label>
              <label className="inline-flex items-center gap-[6px]">
                <RadioGroupItem value="ru" /> <span className="text-caption">RU</span>
              </label>
            </RadioGroup>
          </Sample>
          <Sample label="disabled">
            <RadioGroup defaultValue="ka" className="flex-row gap-[14px]" disabled>
              <label className="inline-flex items-center gap-[6px] opacity-60">
                <RadioGroupItem value="ka" disabled /> <span className="text-caption">KA</span>
              </label>
              <label className="inline-flex items-center gap-[6px] opacity-60">
                <RadioGroupItem value="en" disabled /> <span className="text-caption">EN</span>
              </label>
            </RadioGroup>
          </Sample>
        </Row>
      </div>

      <div>
        <SubHeading>Segmented control</SubHeading>
        <Row>
          <Sample label="3-way">
            <Segmented value="week" onValueChange={() => {}} ariaLabel="Range">
              <SegmentedItem value="day">Day</SegmentedItem>
              <SegmentedItem value="week">Week</SegmentedItem>
              <SegmentedItem value="month">Month</SegmentedItem>
            </Segmented>
          </Sample>
          <Sample label="2-way">
            <Segmented value="grid" onValueChange={() => {}} ariaLabel="View">
              <SegmentedItem value="grid">Grid</SegmentedItem>
              <SegmentedItem value="table">Table</SegmentedItem>
            </Segmented>
          </Sample>
          <Sample label="4-way">
            <Segmented value="lg" onValueChange={() => {}} ariaLabel="Size">
              <SegmentedItem value="xs">XS</SegmentedItem>
              <SegmentedItem value="sm">SM</SegmentedItem>
              <SegmentedItem value="md">MD</SegmentedItem>
              <SegmentedItem value="lg">LG</SegmentedItem>
            </Segmented>
          </Sample>
        </Row>
      </div>

      <div>
        <SubHeading>Slider</SubHeading>
        <Row>
          <Sample label="single — 40">
            <div className="w-[200px]">
              <Slider defaultValue={[40]} />
            </div>
          </Sample>
          <Sample label="single — 80">
            <div className="w-[200px]">
              <Slider defaultValue={[80]} />
            </div>
          </Sample>
          <Sample label="range — 20 / 75">
            <div className="w-[220px]">
              <Slider defaultValue={[20, 75]} />
            </div>
          </Sample>
        </Row>
      </div>
    </div>
  )
}

// ── Dropzone ──────────────────────────────────────────────────────────────

function DropzoneSection() {
  return (
    <div className="space-y-4">
      <SubHeading>File dropzone</SubHeading>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Sample label="empty">
          <Dropzone accept="image/*" />
        </Sample>
        <Sample label="filled (thumbnail)">
          <Dropzone
            thumbnailUrl="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><rect width='40' height='40' fill='%238B6F3A'/></svg>"
            filename="hero.jpg"
            fileSize="1.2 MB"
          />
        </Sample>
        <Sample label="error">
          <Dropzone error="File too large (max 2MB)" />
        </Sample>
        <Sample label="disabled">
          <Dropzone disabled />
        </Sample>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────

export function ShowcaseBody() {
  return (
    <main
      data-testid="forms-showcase"
      className="min-h-screen bg-bg text-text-default px-6 py-12 font-sans"
    >
      <div className="max-w-6xl mx-auto space-y-16">
        <header>
          <p className="text-overline uppercase tracking-widest text-text-muted mb-2">
            T10.2 Component Library
          </p>
          <h1 className="text-display text-text-default">Form Controls</h1>
          <p className="text-body text-text-muted mt-2">
            Visual smoke-test for Playwright baselines. Section H form primitives:
            Input, Textarea, Price, Select, Combobox, Multi-select, Switch,
            Checkbox (+ indeterminate), Radio, Segmented, Slider, Dropzone.
          </p>
        </header>

        <section aria-labelledby="inputs-heading">
          <SectionHeading>
            <span id="inputs-heading">Inputs &amp; Textarea</span>
          </SectionHeading>
          <InputsSection />
        </section>

        <section aria-labelledby="selects-heading">
          <SectionHeading>
            <span id="selects-heading">Select, Combobox, Multi-select</span>
          </SectionHeading>
          <SelectSection />
        </section>

        <section aria-labelledby="toggles-heading">
          <SectionHeading>
            <span id="toggles-heading">Toggle primitives</span>
          </SectionHeading>
          <TogglesSection />
        </section>

        <section aria-labelledby="dropzone-heading">
          <SectionHeading>
            <span id="dropzone-heading">Dropzone</span>
          </SectionHeading>
          <DropzoneSection />
        </section>

        <section aria-labelledby="interactive-heading">
          <InteractiveSection />
        </section>
      </div>
    </main>
  )
}
