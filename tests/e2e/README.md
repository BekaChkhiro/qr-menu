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
  upstreams or seed the DB (see `fixtures/` — T9.3 delivered these).

### Fixtures & seeding (T9.3)

#### When to call `resetDb()`

Call it in `beforeEach` when tests need full isolation (slower but safe).
Use `beforeAll` + `test.describe.configure({ mode: 'serial' })` for speed
when tests in the same describe block build on shared state.

```ts
import { resetDb, seedUser, seedMenu } from './fixtures/seed';

test.beforeEach(async () => {
  await resetDb();
});
```

#### Seeding examples

```ts
// A PRO user with a published menu (3 categories, 5 products each)
const user = await seedUser({ plan: 'PRO', email: 'pro@test.local' });
const menu = await seedMenu({ userId: user.id, status: 'PUBLISHED', categoryCount: 3, productCount: 5 });

// A promotion expiring in 7 days
await seedPromotion({ menuId: menu.id, titleKa: 'ფასდაკლება', isActive: true });

// Spread 20 views/day over 30 days for analytics charts
await seedMenuViews({ menuId: menu.id, days: 30, viewsPerDay: 20 });
```

#### `loginAs(page, email)`

Calls `POST /api/test/session` to exchange an email for an encrypted
NextAuth session cookie, set directly on the page context — no UI login
flow, completes in <1 s.

Requires `ENABLE_TEST_AUTH=1` in the environment. This is already set in
`playwright.config.ts` `webServer.env`, so it's live for all `pnpm test:e2e`
runs but never active in normal `pnpm dev` or production.

```ts
import { loginAs } from './fixtures/auth';

const user = await seedUser({ email: 'demo@test.local', plan: 'STARTER' });
await loginAs(page, 'demo@test.local');
// page is now authenticated — navigate to /admin/dashboard
await page.goto('/admin/dashboard');
```

#### Full admin scenario pattern

```ts
import { seedCompleteScenario } from './fixtures/seed';
import { loginAs } from './fixtures/auth';

const { user, menu } = await seedCompleteScenario('PRO');
await loginAs(page, user.email);
await page.goto('/admin/dashboard');
```

`seedCompleteScenario` creates: 1 published menu, 3 categories, 15 products,
2 active promotions, 600 menu views spread over 30 days.

#### CI note

Seeding helpers connect to the same `DATABASE_URL` as the running app — make
sure both the `pnpm dev` process and the test process share the same
connection string. On CI (and locally via Docker), that's Postgres on 5433.

## Running against a dedicated Postgres (local parity with CI)

`docker-compose.test.yml` at the repo root spins up a Postgres 16 container on
port 5433 with ephemeral (`tmpfs`) storage. It matches what `.github/workflows/
e2e.yml` provisions via its `services:` block, so locally-passing tests should
also pass in CI.

```bash
docker compose -f docker-compose.test.yml up -d

export DATABASE_URL="postgresql://postgres:postgres@localhost:5433/digital_menu_test?schema=public"
pnpm db:push
pnpm test:e2e

docker compose -f docker-compose.test.yml down -v
```

## CI pipeline (GitHub Actions)

`.github/workflows/e2e.yml` runs on every PR to `master` and on pushes to
`master`. The job:

1. Provisions Postgres 16 on port 5433 via the native `services:` block.
2. Installs pnpm + Node 20 with dependency caching.
3. Runs `pnpm db:push` against the service to apply the Prisma schema.
4. Runs `pnpm build` (which also regenerates the Prisma client).
5. Caches `~/.cache/ms-playwright` keyed by `pnpm-lock.yaml` hash — browser
   downloads skip on cache hits, only OS deps reinstall.
6. Runs `pnpm test:e2e`.
7. Always uploads `playwright-report/` as an artifact (14-day retention).
8. On failure, also uploads `test-results/` (expected/actual/diff PNGs +
   traces + videos) and posts a comment on the PR linking to the run page with
   instructions for regenerating baselines via `pnpm test:e2e:update`.

**Visual regression actually blocks.** A PR that unintentionally changes a
rendered color in `apps/web/app/globals.css` will fail the smoke spec's
`landing-desktop.png` diff and turn the CI red. If the change is intentional,
regenerate baselines locally and commit them in the same PR.
