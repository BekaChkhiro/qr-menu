# Design Tokens — Section H Reference

**Source**: Claude Design handoff bundle, Section H Component Library. Extracted from the `component-library-b.jsx` `TokensGroup` at the final design delivery.

This file is the **single source of truth** for the admin redesign (Phases 9-17). Do not invent new colors, radii, or shadows outside this system without updating this file first.

---

## Color Tokens (16)

### Surfaces & Text

| Name | Hex | HSL | Usage |
|---|---|---|---|
| `bg` | `#FAFAF9` | `40 14% 98%` | Page background (warm off-white) |
| `card` | `#FFFFFF` | `0 0% 100%` | Card / panel background |
| `chip` | `#F4F3EE` | `45 14% 94%` | Inactive pill / segmented bg |
| `border` | `#EAEAE6` | `48 9% 91%` | Primary 1px card borders |
| `borderSoft` | `#F0EFEA` | `45 12% 93%` | Subtle dividers inside cards |
| `text` | `#18181B` | `240 6% 10%` | Primary body + headings |
| `textMuted` | `#605F6B` | `240 5% 40%` | Helper text / labels (WCAG AA, T17.6) |
| `textSubtle` | `#6B6B73` | `240 5% 44%` | Placeholder / timestamps (WCAG AA, T17.6) |

### Semantic

| Name | Hex | HSL | Usage |
|---|---|---|---|
| `accent` | `#9A4F33` | `18 51% 40%` | Terracotta brand accent — darkened in T17.6 so white-on-accent and accent-on-soft clear 4.5:1 |
| `accentSoft` | `#F7EDE6` | `22 60% 94%` | Tinted backgrounds, lock overlays |
| `success` | `#306930` | `120 33% 28%` | Published / active states — darkened in T17.6 for AA on success-soft |
| `successSoft` | `#E8F0E8` | `120 21% 92%` | Success pills |
| `warning` | `#8A570B` | `37 80% 30%` | Draft / warning states — darkened in T17.6 for AA on warning-soft |
| `warningSoft` | `#F7EFE0` | `41 67% 92%` | Warning pill bg |
| `danger` | `#A53A36` | `3 51% 42%` | Destructive / error states — darkened in T17.6 for AA |
| `dangerSoft` | `#F7E6E5` | `4 63% 93%` | Error pill / danger zone bg |

> **T17.6 contrast pass.** The original Section H text-muted (#71717A),
> text-subtle (#A1A1AA), and the four semantic foregrounds all sat at
> ~3-4.4:1 contrast against their canonical backgrounds. The values
> above were nudged down 4-6 lightness points so axe-core reports zero
> WCAG AA violations across every admin surface while preserving the
> hue/saturation of the design system. Visual baselines for affected
> screenshots were regenerated in the same task.

---

## Typography

**Font family**: Inter (weights 400, 450, 500, 550, 600, 700)
**Font features**: `'cv11', 'ss01'`
**Antialiasing**: `-webkit-font-smoothing: antialiased`
**Numeric**: `font-variant-numeric: tabular-nums` on all metrics

### Type Scale

| Level | Size | Weight | Letter-spacing | Line-height | Usage |
|---|---|---|---|---|---|
| `display` | 32px | 600 | −0.6 | 1.15 | Hero / big numbers |
| `h1` | 22px | 600 | −0.3 | 1.2 | Page title |
| `h2` | 16px | 600 | −0.1 | 1.3 | Section heading |
| `body` | 13px | 400 | 0 | 1.5 | Paragraph text |
| `caption` | 12px | 500 | 0 | 1.45 | Helper / muted |
| `overline` | 10.5px | 700 | 0.6 | 1 | UPPERCASE section labels |
| `mono` | 12px | 500 | 0 | 1.5 | Code, URLs, keyboard |

Monospace family: `ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace`

---

## Border Radius

| Name | Value | Usage |
|---|---|---|
| `xs` | `4px` | Tags, micro chips |
| `sm` | `6px` | Small buttons, pills |
| `md` | `8px` | Inputs, default buttons |
| `lg` | `10px` | Small cards, dropzones |
| `xl` | `14px` | Large cards, modals |
| `pill` | `999px` | Fully rounded (avatars, stat bars) |

Default card border-radius is **12px** (between `lg` and `xl` — use a `card` alias in Tailwind).

---

## Spacing (4px base)

| Name | Value | Usage |
|---|---|---|
| `1` | `4px` | Tight inline gaps |
| `2` | `8px` | Small gaps |
| `3` | `12px` | Standard inline |
| `4` | `16px` | Card internal padding (compact) |
| `5` | `20px` | Card internal padding (default) |
| `6` | `24px` | Page padding, large gaps |
| `8` | `32px` | Section spacing |
| `10` | `40px` | Hero-level spacing |
| `12` | `48px` | Page-level sections |
| `16` | `64px` | Top-of-page breathing room |

---

## Shadows

Near-invisible by design — rely on 1px `border` for visual separation.

| Name | Value | Usage |
|---|---|---|
| `none` | `none` | Flat (default) |
| `xs` | `0 1px 2px rgba(0, 0, 0, 0.06)` | Subtle button raise |
| `sm` | `0 2px 6px rgba(0, 0, 0, 0.06)` | Active card hover |
| `md` | `0 6px 18px rgba(0, 0, 0, 0.08)` | Dropdown / popover |
| `lg` | `0 10px 30px rgba(0, 0, 0, 0.10)` | Modal dialog |
| `xl` | `0 20px 50px rgba(0, 0, 0, 0.12)` | Lock-overlay card |

---

## Implementation Notes

### `globals.css` CSS variables

Use HSL so Tailwind's `hsl(var(--token))` pattern works:

```css
:root {
  --bg: 40 14% 98%;
  --card: 0 0% 100%;
  --chip: 45 14% 94%;
  --border: 48 9% 91%;
  --border-soft: 45 12% 93%;
  --text: 240 6% 10%;
  --text-muted: 240 5% 40%;
  --text-subtle: 240 5% 44%;

  --accent: 18 51% 40%;
  --accent-soft: 22 60% 94%;
  --success: 120 33% 28%;
  --success-soft: 120 21% 92%;
  --warning: 37 80% 30%;
  --warning-soft: 41 67% 92%;
  --danger: 3 51% 42%;
  --danger-soft: 4 63% 93%;
}
```

### Tailwind color mapping

```ts
// tailwind.config.ts
colors: {
  bg: 'hsl(var(--bg))',
  card: 'hsl(var(--card))',
  chip: 'hsl(var(--chip))',
  'text-default': 'hsl(var(--text))',
  'text-muted': 'hsl(var(--text-muted))',
  'text-subtle': 'hsl(var(--text-subtle))',
  accent: {
    DEFAULT: 'hsl(var(--accent))',
    soft: 'hsl(var(--accent-soft))',
  },
  success: {
    DEFAULT: 'hsl(var(--success))',
    soft: 'hsl(var(--success-soft))',
  },
  warning: {
    DEFAULT: 'hsl(var(--warning))',
    soft: 'hsl(var(--warning-soft))',
  },
  danger: {
    DEFAULT: 'hsl(var(--danger))',
    soft: 'hsl(var(--danger-soft))',
  },
}
```

### Border + Shadow philosophy

Cards use **1px `border`** as their primary separation — shadows are decorative, not functional. A card with no shadow but 1px border looks intentional; a card with shadow but no border looks "floating" which the design avoids except for overlays (dialogs, drawers).

### Dark mode

Not required for MVP. The design system is explicitly warm-light. If needed later, invert `bg`/`card` pair and shift text tokens; accent/semantic colors can stay.

---

## Compatibility With Existing shadcn/ui Tokens

The current `globals.css` uses shadcn semantic names (`--background`, `--foreground`, `--primary`, etc.) with an olive-tinted palette. During Phase 9 (T9.1):

- **Replace** the old tokens with the 16 new ones above (adds new names, but we also alias back to shadcn names for library compatibility)
- **Preserve** shadcn semantic names as aliases so existing `<Button>`, `<Input>`, `<Card>` components don't break while we migrate them in Phase 10

Alias example:
```css
:root {
  /* New Section H tokens */
  --bg: 40 14% 98%;
  --text: 240 6% 10%;
  --accent: 18 51% 48%;
  /* ... */

  /* Legacy shadcn aliases (remove after Phase 10 migration) */
  --background: var(--bg);
  --foreground: var(--text);
  --primary: var(--text);          /* was slate-900, now matches */
  --primary-foreground: 0 0% 100%;
  --destructive: var(--danger);
  --border: var(--border);         /* same */
}
```

---

**Last Updated**: 2026-04-21
**Phase**: 9 (T9.1 Design Tokens Migration)

## Public Menu Branding (`primaryColor` / `accentColor`)

Owners set two brand colors in the Branding tab. They are emitted as CSS custom properties on the public menu root container in `apps/web/app/m/[slug]/page.tsx` and `apps/web/app/m/[slug]/t/[code]/page.tsx`:

```css
:root {
  --menu-primary: <menu.primaryColor>;  /* default: #000000 */
  --menu-accent:  <menu.accentColor>;   /* default: #666666 */
}
```

Public components consume them via Tailwind arbitrary values (`bg-[var(--menu-primary)]`, `text-[var(--menu-accent)]`, `border-[color-mix(in_srgb,var(--menu-primary)_30%,transparent)]`, etc.) — never via shadcn's `bg-primary` / `text-primary`, which are reserved for the admin panel.

### Surfaces driven by `--menu-primary`

| Surface | File |
|---|---|
| Active category pill (bg + ring) | `components/public/category-nav.tsx` |
| Active promotion carousel dot | `components/public/promotion-carousel.tsx` |
| Promotion banner border + gradient wash | `components/public/promotion-banner.tsx` |
| Category section divider (40% alpha) | `components/public/category-section.tsx` |
| Category quick-jump tile hover border | `components/public/menu-body.tsx` |
| Footer back-to-top hover fill | `components/public/menu-footer.tsx` |

### Surfaces driven by `--menu-accent`

| Surface | File |
|---|---|
| Promotion banner title + tag icon (non-urgent) | `components/public/promotion-banner.tsx` |
| Featured-carousel price | `components/public/featured-carousel.tsx` |
| Footer "Digital Menu" link | `components/public/menu-footer.tsx` |

Urgent promotions (≤1 day remaining) override accent with orange; the override is intentional.

When `bg-[var(--menu-primary)]` carries foreground text, pair it with `text-white` rather than `text-primary-foreground` — the menu primary is user-defined and white maximises contrast across the picker palette.

## Canonical Design Reference

The full Claude Design handoff bundle is committed to the repo at **`qr-menu-design/`** (root level, not `apps/web/`). Structure:

```
qr-menu-design/
├── Digital Menu Dashboard.html    ← main canvas entry point
├── design-canvas.jsx              ← canvas frame / viewport
└── components/
    ├── admin-shell.jsx            ← sidebar + topbar shell
    ├── analytics-page.jsx         ← Section D artboards
    ├── component-library-a.jsx    ← Section H (Buttons/Forms/Feedback/DataDisplay)
    ├── component-library-b.jsx    ← Section H (Overlays/Navigation/Utility/Tokens)
    ├── dashboard-bottom.jsx       ← dashboard: YourMenus / Activity / TopItems / Upgrade
    ├── dashboard-top.jsx          ← dashboard: Welcome / PlanUsage / Analytics / Device
    ├── icons.jsx                  ← lucide-style icon set (36 icons)
    ├── menu-editor.jsx            ← Section B editor shell + 7 tabs
    ├── menus-pages.jsx            ← Section A (grid/table/empty)
    ├── mobile.jsx                 ← mobile 375px variant
    ├── product-drawer.jsx         ← Section C drawer
    ├── promotions-page.jsx        ← Section E
    ├── qr-page.jsx                ← Section F
    ├── settings-artboards-a.jsx   ← Section G (Profile/Business/Billing)
    ├── settings-artboards-b.jsx   ← Section G (Team/Notifications/Security/Language/MenuSettings)
    ├── settings-shell.jsx         ← Section G nav rail + shell primitives
    └── sidebar.jsx                ← Sidebar + dmTheme token object (the source palette)
```

**Token values** are hard-coded as `dmTheme` in `qr-menu-design/components/sidebar.jsx` (lines 4-23) and re-listed in the Section H TokensGroup at `qr-menu-design/components/component-library-b.jsx` (lines 446-553). The values in this doc were extracted from there.

**Note**: These JSX files are **design prototypes**, not production code. They use inline styles and React-UMD (no bundler). When implementing, port the **visual output** into Tailwind + shadcn/ui — not the file structure.
