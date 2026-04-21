# qr-menu-design — Claude Design Handoff Bundle

**What this is**: The complete visual design for the Digital Menu admin redesign, exported from [claude.ai/design](https://claude.ai/design). 36 artboards across 10 sections covering Dashboard, Menus, Menu Editor (7 tabs), Product Drawer, Analytics, Promotions, QR codes, Settings, Mobile, and a full component library (Section H).

**What this is NOT**:
- Not a Pencil `.pen` file
- Not production code — these are prototypes using inline styles + React-UMD + `@babel/standalone`
- Not executable as source — open `Digital Menu Dashboard.html` in a browser to render

## How to view the designs

```bash
# From repo root:
open qr-menu-design/Digital\ Menu\ Dashboard.html
# Or on Linux / WSL:
xdg-open qr-menu-design/Digital\ Menu\ Dashboard.html
```

The canvas supports pan/zoom. Each section is labeled; each artboard has an ID (e.g. `main`, `menus-grid`, `pd-basics`, `an-full`, `settings-profile`). Those IDs are what `PROJECT_PLAN.md` tasks reference.

## How to use this bundle when implementing a task

1. **Look up the artboard** in `CLAUDE.md` → "Design System & Redesign Implementation" → artboard-to-file mapping table
2. **Open the matching JSX file** in this folder for exact measurements, colors, structure
3. **Use `docs/design-tokens.md`** for all color / radius / shadow / type values — never eyeball from inline styles
4. **Port to Tailwind + shadcn/ui** — do not copy the inline-style patterns; rewrite using the real codebase's primitives

## File guide

| File | Contains |
|---|---|
| `Digital Menu Dashboard.html` | Canvas entry point; mounts `design-canvas.jsx` + all section components |
| `design-canvas.jsx` | Pan/zoom viewport + artboard frames |
| `components/sidebar.jsx` | **`dmTheme` object (lines 4-23) — the token source of truth**, plus the admin sidebar |
| `components/admin-shell.jsx` | Reusable admin frame (sidebar + top bar + breadcrumbs) |
| `components/icons.jsx` | 36 lucide-style inline SVG icons |
| `components/dashboard-top.jsx` | Dashboard upper half (Welcome, PlanUsage, Analytics, Device) |
| `components/dashboard-bottom.jsx` | Dashboard lower half (YourMenus, Activity, TopItems, Upgrade) |
| `components/menus-pages.jsx` | `/admin/menus` — grid view, table view, empty state |
| `components/menu-editor.jsx` | Menu editor shell + 7-tab bar + Content / Branding / Languages artboards |
| `components/product-drawer.jsx` | Product editor slide-over (540px): Basics, Variations, Allergens (PRO + STARTER-locked) |
| `components/analytics-page.jsx` | Analytics tab: KPIs, chart with tooltip + event pins, heatmap, geography, traffic source, FREE-locked, empty |
| `components/promotions-page.jsx` | Promotions tab: list, FREE-locked, new-promotion drawer |
| `components/qr-page.jsx` | QR tab: customize, PRO-branded, print template picker modal. Contains a real deterministic QR-code SVG generator |
| `components/settings-shell.jsx` | `/admin/settings` shell + left nav rail + shared primitives |
| `components/settings-artboards-a.jsx` | Settings: Profile, Business info, Plan & billing |
| `components/settings-artboards-b.jsx` | Settings: Team (locked + unlocked), Notifications, Security, Language, Menu settings tab |
| `components/component-library-a.jsx` | **Section H** primitives: Buttons, Form controls, Feedback, Data display |
| `components/component-library-b.jsx` | **Section H** primitives: Overlays, Navigation, Utility, **Tokens (lines 446-553)** |
| `components/mobile.jsx` | Mobile 375px variant (dashboard adapted) |

## Non-negotiables (before you start)

When you port anything from this bundle, these product rules are law:

- **Plan tiers**: FREE (0₾) / STARTER (29₾/mo) / PRO (59₾/mo). No "Business" tier. See `lib/auth/permissions.ts`.
- **Sidebar items**: exactly 3 — Dashboard · Menus · Settings. Analytics / Promotions / QR are editor tabs.
- **Menu editor tabs**: exactly 7 in order — Content · Branding · Languages · Analytics · Promotions · QR · Settings.
- **Identity for seed/demo**: Nino Kapanadze · nino@cafelinville.ge · Café Linville · cafelinville.ge. Never "Anna".
- **Georgian content**: real product names (ხაჭაპური აჭარული, ბადრიჯანი ნიგვზით, etc.) and cities (Tbilisi, Batumi, Kutaisi). Currency ₾ with tabular-nums.
- **Cards**: 12px radius, 1px `#EAEAE6` border, near-invisible shadows.
- **Multi-language content fields**: KA always on, EN/RU locked on STARTER / unlocked on PRO.

## Cross-references

- **Tokens**: `../docs/design-tokens.md`
- **Project plan**: `../PROJECT_PLAN.md` (Phases 9-17 map to this bundle)
- **Non-negotiables + mapping table**: `../CLAUDE.md` → "Design System & Redesign Implementation"
