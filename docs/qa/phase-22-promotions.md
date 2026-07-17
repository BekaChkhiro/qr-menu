# QA — Phase 22: Promotions & Discounts (T22.18–T22.25)

Source spec: café-owner walkthrough `აქციები Rapport.pdf`.
Covers the whole promotions & discounts overhaul. Everything listed here is
implemented — there is no "not built yet" section.

## Prerequisites

- `pnpm db:push` applied (adds `Promotion.type/backgroundColor/showTitle/combo*`,
  `Product.discountType/discountValue/discountWindows`, `Category.isSystemOffers`,
  `Menu.promoPopupEnabled/timezone`).
- Test user on **STARTER or PRO** (promotions are locked on FREE).
- A **PUBLISHED** menu with ≥2 categories and ≥3 products at known prices.
- Café timezone is `Asia/Tbilisi` (the default) — time windows are judged
  against **café time**, not your laptop's clock.

Automated coverage:

```bash
pnpm test:e2e tests/e2e/admin/editor-promotions-drawer.spec.ts \
              tests/e2e/admin/product-drawer-basics.spec.ts \
              tests/e2e/admin/promotion-calendar.spec.ts \
              tests/e2e/admin/promotion-category-scope.spec.ts \
              tests/e2e/public/promotion-variants.spec.ts \
              tests/e2e/public/promotion-carousel-detail.spec.ts \
              tests/e2e/public/promotion-popup.spec.ts \
              tests/e2e/public/promotion-time-gating.spec.ts
```

---

## 1. Promotion type (T22.19)

Menu editor → **Promotions** → "+ New promotion" → **Details**.

| # | Action | Expected |
|---|--------|----------|
| 1.1 | Open the drawer | "Promotion type" shows **3** options: Percentage / Banner-Info / Combo. Default = Percentage |
| 1.2 | Select each | The hint text under the selector changes per type |
| 1.3 | **Percentage** | Discount value (with `%`) **and** "Apply to" are shown |
| 1.4 | **Banner-Info** | Discount value and Apply-to are **hidden** |
| 1.5 | **Combo** | Discount value hidden; product picker + combo price shown |
| 1.6 | Edit a legacy promotion | `FIXED_AMOUNT` opens as **Banner**; `FREE_ADDON` as **Combo**; `PERCENTAGE` as **Percentage** |

**Regression:** the old "Fixed amount (₾)" / "Free add-on" buttons must be gone.

## 2. Apply-to + category scope (T22.18) ⭐

| # | Action | Expected |
|---|--------|----------|
| 2.1 | Percentage → Apply to | Only **2** options: whole menu / specific category |
| 2.2 | — | **"Specific products" must not exist** |
| 2.3 | Pick "specific category" | Category select appears |
| 2.4 | Leave category empty → Save | Validation error |
| 2.5 | 20% on "Drinks" → public menu | Drinks products show new price, struck-through old price, red **−20%** badge |
| 2.6 | Products in other categories | Unchanged, no strikethrough |
| 2.7 | Whole menu | **All** products discounted |
| 2.8 | Dish already has its own discount, then announce a category promo | The dish keeps **its own** price ("last wins") |

## 3. Appearance — 3 variants (T22.20)

Drawer → **Appearance**.

| # | Action | Expected |
|---|--------|----------|
| 3.1 | Banner uploaded | "Title over banner" switch shown (no color picker) |
| 3.2 | No banner | Background-color picker with a live preview card, color input + hex input |
| 3.3 | Change the hex | Preview updates immediately |
| 3.4 | **Var 1:** banner + title OFF | Public: image only, no title |
| 3.5 | **Var 2:** banner + title ON | Public: title over a gradient at the bottom |
| 3.6 | **Var 3:** no banner + color | Public: **title-only card on that color must appear** ⭐ |
| 3.7 | GIF banner | Animates (doesn't freeze) |

## 4. Time windows (T22.21) ⭐

Drawer → Details → "Time restriction".

| # | Action | Expected |
|---|--------|----------|
| 4.1 | Toggle ON | **7 day rows**, each with its own toggle |
| 4.2 | Enable Monday | Monday gets **its own** start/end (default 09:00–18:00) |
| 4.3 | Mon 12:00–14:00, Tue 09:00–11:00 | Stored **independently** — one doesn't overwrite the other |
| 4.4 | Disabled day | Reads "Off" |
| 4.5 | **24h / AM/PM** switch | Toggles the input style; the choice **persists** across reloads (per operator) |
| 4.6 | Focus hour, press ↑/↓ | Value steps. In AM/PM mode ↑/↓ on the AM/PM chip flips it |
| 4.7 | Type 2 digits in the hour | Focus **auto-advances** to minutes |
| 4.8 | Open an old promotion (legacy days + one time) | Migrated: those days active with the same window |
| 4.9 | Toggle OFF | No restriction — active all day within the date range |
| 4.10 | **Gating:** set a window that excludes café-time *now* → public menu | Promotion is **absent from the carousel AND prices are not discounted** ⭐ |
| 4.11 | Set a window that includes now | Promotion visible and prices discounted |

> Windows use **café time (Asia/Tbilisi)**. To test, compute the window against
> Tbilisi time, not your machine's — a window "excluding now" for you may include
> now for the café.

## 5. Public carousel (T22.22)

| # | Action | Expected |
|---|--------|----------|
| 5.1 | ≥2 promotions | Auto-advances every ~4.5s |
| 5.2 | Swipe / tap an arrow | Auto-advance **pauses** ~8s |
| 5.3 | Slide corner | Shows a "Details ›" chip |
| 5.4 | Tap a slide | Detail sheet: title, description, hours (e.g. `Mon 18:00–20:00`) |
| 5.5 | Dismiss | Works via **X**, **backdrop click**, and **Escape** |

## 6. Dish-level discount (T22.23)

Product drawer → Basics → "Add discount".

| # | Action | Expected |
|---|--------|----------|
| 6.1 | Toggle ON | Mode switch: **By amount / By percent** (default = amount) |
| 6.2 | **Amount:** original 20, sale 15 | Badge **−25%** (unchanged legacy behavior) |
| 6.3 | **Percent:** original 20, % = 10 | Sale **auto-computes to 18** ⭐, readout shows it, badge −10% |
| 6.4 | Change % to 25 | Price becomes 15 immediately |
| 6.5 | Save → reopen | A percentage discount reopens in **percent** mode |
| 6.6 | "Discount only on certain days & hours" ON | Same 7-day editor as promotions |
| 6.7 | Window excludes café-time now → public | Dish shows the **original price, no strikethrough** ⭐ |
| 6.8 | Window includes now | Discounted price + strikethrough |

## 7. Combo (T22.24)

| # | Action | Expected |
|---|--------|----------|
| 7.1 | Type = Combo | Product list (name + price) with checkboxes + combo price |
| 7.2 | <2 products or no price | **Save disabled** |
| 7.3 | KA title + ≥2 products + price 12 | Save enabled |
| 7.4 | Save → public menu | An **"შეთავაზება" (Offers)** category holds a product named after the promotion, priced **12 ₾** ⭐ |
| 7.5 | No description written | The combo card lists its parts: "Coffee + Sandwich + Cup" |
| 7.6 | Edit the promotion title/price | The combo product updates |
| 7.7 | Delete the promotion | The combo product is removed |
| 7.8 | Switch type Combo → Banner, save | The combo product is removed |
| 7.9 | Admin Content tab | The **"შეთავაზება" category must NOT appear** (it's managed by the combo flow) |
| 7.10 | Plan limits | Combo products/category **don't count** against category/product limits; the menus list "N categories · M products" excludes them |

## 8. Pop-up (T22.25)

Editor → **Content** → Display card → "Promotions pop-up".

| # | Action | Expected |
|---|--------|----------|
| 8.1 | ON → open public menu | Pop-up with the carousel + **X** top-right |
| 8.2 | Dismiss → reload **same session** | Does **not** reappear |
| 8.3 | New session (incognito) | Appears again |
| 8.4 | OFF | No pop-up; inline carousel still shows |
| 8.5 | Preview mode (`?preview=true`) | No pop-up |

## 9. Calendar (T22.25)

Promotions tab, above the list.

| # | Action | Expected |
|---|--------|----------|
| 9.1 | With promotions | Month grid; each promotion is a **bar spanning its dates** |
| 9.2 | Two overlapping promotions | Bars **stack on separate rows**, they don't collide ⭐ |
| 9.3 | A promotion crossing a week boundary | Bar is clipped per week with squared-off continuation edges |
| 9.4 | ‹ / › / Today | Month navigation works and returns to the current month |

## 10. Save gating + regression

| # | Case | Expected |
|---|------|----------|
| 10.1 | Empty KA title | Save disabled (all types) |
| 10.2 | Percentage with empty/0 % | Save disabled |
| 10.3 | Banner with only a KA title | Save **enabled** |
| 10.4 | **T21.10:** image upload | Instant preview, progress bar, Save disabled while uploading, fast save |
| 10.5 | **FREE** plan | Promotions locked |
| 10.6 | Drawer language switcher | Switching to EN moves **title and description together** |
| 10.7 | Clone a menu that has combos | The clone has **no orphaned Offers category** (combos regenerate from promotions) |
