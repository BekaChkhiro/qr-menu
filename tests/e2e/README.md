# End-to-End Tests (Playwright)

Visual regression + functional E2E test suite. Set up by T9.2.

## Quick start

```bash
# Install browsers once (chromium, firefox, webkit)
pnpm test:e2e:install

# Run all E2E tests
pnpm test:e2e

# Run tests and regenerate screenshot baselines (after intentional UI change)
pnpm test:e2e:update

# Interactive UI runner
pnpm test:e2e:ui

# Debug a single test
pnpm test:e2e:debug
```

The runner auto-starts `pnpm dev` on `http://localhost:3000`. Point it at a
deployed preview instead by setting `PLAYWRIGHT_BASE_URL`.

## Layout

```
tests/e2e/
├── smoke.spec.ts           Landing page sanity + visual baseline
├── components/             UI primitive + component library specs
├── admin/                  Admin panel specs (dashboard, editor, settings)
├── public/                 Public menu / customer-facing specs
├── design-system/          Design token + Section H showcase specs
├── fixtures/               Shared auth, seed helpers (T9.3 delivers these)
└── __screenshots__/        Committed baseline images (per-project subdirs)
```

## Projects

Every spec runs against both `desktop` (1440×900 Chromium) and `mobile`
(iPhone 13, webkit). Screenshots are stored under
`__screenshots__/<spec>-<project>.png`. Each redesign task (T9.x–T17.x) ships
specs for both projects unless the feature is desktop-only.

## Visual regression rules

- Baselines are committed. Never delete a baseline without a matching UI change
  in the same PR.
- Default `maxDiffPixelRatio` is `0.05` (5%). Override per-run via
  `PLAYWRIGHT_MAX_DIFF_RATIO=0.02 pnpm test:e2e` for tighter checks.
- Disable animations + cursor caret globally via `expect.toHaveScreenshot`
  config — don't re-specify per test unless you need something different.
- Wait for `document.fonts.ready` before taking screenshots that include
  Inter/other web fonts, otherwise the first paint uses fallback metrics.

## When a baseline changes

1. Make the UI change.
2. Run `pnpm test:e2e:update` locally — this rewrites every diffed baseline.
3. Review the diffs in `tests/e2e/__screenshots__/` via git diff (images show
   as binary; use a visual diff tool).
4. Commit the updated baselines in the SAME commit as the UI change.

## Conventions

- Functional assertions live alongside visual ones — one without the other is
  a smell. A passing visual diff with broken logic still ships the bug.
- Use `page.getByRole` / `page.getByTestId` over raw CSS selectors. Selectors
  break on refactors; roles survive.
- Keep tests hermetic. No network calls to third-party services; mock
  upstreams or seed the DB (see `fixtures/` once T9.3 lands).
