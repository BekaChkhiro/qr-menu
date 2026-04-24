// Tests for T11.4 Dashboard Welcome Header + Plan Usage Strip,
// T11.5 Dashboard Analytics Card + Device Breakdown, and
// T11.9 Upgrade Card (Conditional).
// Run:     pnpm test:e2e tests/e2e/admin/dashboard.spec.ts
// Update:  pnpm test:e2e:update tests/e2e/admin/dashboard.spec.ts
//
// Covers:
//   T11.4 — welcome header, plan usage strip (already stable).
//   T11.5 — analytics card with real MenuView data, device donut, period
//           toggle refetches, FREE locked overlay + CTA to billing.
//   T11.9 — upgrade card: visible on FREE (→STARTER) and STARTER (→PRO),
//           hidden on PRO, CTA navigates to /admin/settings/billing.

import { expect, test } from '@playwright/test';

import { loginAs } from '../fixtures/auth';
import {
  prismaTest,
  resetDb,
  seedMenu,
  seedMenuViews,
  seedUser,
} from '../fixtures/seed';

test.describe('admin dashboard (T11.4)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page, context }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop',
      'Desktop-only dashboard; mobile variant lands with T17.2',
    );
    await resetDb();
    await context.clearCookies();
    await context.addCookies([
      { name: 'NEXT_LOCALE', value: 'en', domain: 'localhost', path: '/' },
    ]);
  });

  async function seedAndLogin(
    page: import('@playwright/test').Page,
    opts: {
      plan: 'FREE' | 'STARTER' | 'PRO';
      menus?: number;
      categoriesPerMenu?: number;
      productsPerCategory?: number;
      name?: string;
      email?: string;
    },
  ) {
    const email = opts.email ?? 'nino@cafelinville.ge';
    const user = await seedUser({
      plan: opts.plan,
      name: opts.name ?? 'Nino Kapanadze',
      email,
    });
    for (let i = 0; i < (opts.menus ?? 0); i++) {
      await seedMenu({
        userId: user.id,
        status: 'PUBLISHED',
        categoryCount: opts.categoriesPerMenu ?? 2,
        productCount: opts.productsPerCategory ?? 3,
        slug: `cafe-${opts.plan.toLowerCase()}-${i}`,
      });
    }
    await loginAs(page, email);
    return user;
  }

  async function stabilizeClockAnimations(page: import('@playwright/test').Page) {
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({
      content:
        '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }',
    });
  }

  // ── Visual ────────────────────────────────────────────────────────────────

  test('visual: dashboard (STARTER, 2 of 3 menus)', async ({ page }, testInfo) => {
    await seedAndLogin(page, { plan: 'STARTER', menus: 2 });
    await page.goto('/admin/dashboard');
    await stabilizeClockAnimations(page);

    const welcome = page.getByTestId('dashboard-welcome');
    const strip = page.getByTestId('plan-usage-strip');
    await expect(welcome).toBeVisible();
    await expect(strip).toBeVisible();

    // Capture the dashboard content region (welcome + strip combined).
    const main = page.getByTestId('admin-main');
    await expect(main).toHaveScreenshot(
      `dashboard-starter-${testInfo.project.name}.png`,
      { maxDiffPixelRatio: 0.05 },
    );
  });

  test('visual: dashboard (FREE, 0 menus)', async ({ page }, testInfo) => {
    await seedAndLogin(page, { plan: 'FREE', menus: 0 });
    await page.goto('/admin/dashboard');
    await stabilizeClockAnimations(page);

    const main = page.getByTestId('admin-main');
    await expect(main).toHaveScreenshot(
      `dashboard-free-${testInfo.project.name}.png`,
      { maxDiffPixelRatio: 0.05 },
    );
  });

  test('visual: dashboard (PRO, 5 menus)', async ({ page }, testInfo) => {
    await seedAndLogin(page, { plan: 'PRO', menus: 5 });
    await page.goto('/admin/dashboard');
    await stabilizeClockAnimations(page);

    const main = page.getByTestId('admin-main');
    await expect(main).toHaveScreenshot(
      `dashboard-pro-${testInfo.project.name}.png`,
      { maxDiffPixelRatio: 0.05 },
    );
  });

  // ── Functional ────────────────────────────────────────────────────────────

  test('functional: greeting uses first name only', async ({ page }) => {
    await seedAndLogin(page, { plan: 'STARTER', menus: 1, name: 'Nino Kapanadze' });
    await page.goto('/admin/dashboard');

    const greeting = page.getByTestId('dashboard-greeting');
    await expect(greeting).toBeVisible();
    const text = (await greeting.textContent())?.trim() ?? '';

    // First name appears, surname does not.
    expect(text).toContain('Nino');
    expect(text).not.toContain('Kapanadze');

    // Matches one of the three time-of-day variants.
    expect(text).toMatch(/Good (morning|afternoon|evening), Nino/);
  });

  test('functional: STARTER with 2 of 3 menus shows "2 / 3" + ~66% + default tone', async ({
    page,
  }) => {
    await seedAndLogin(page, { plan: 'STARTER', menus: 2 });
    await page.goto('/admin/dashboard');

    const card = page.getByTestId('usage-card-menus');
    await expect(card).toBeVisible();

    const cardText = (await card.textContent())?.replace(/\s+/g, ' ') ?? '';
    // Used value and total render as "2 / 3" (thin gap + slash).
    expect(cardText).toMatch(/2\s*\/\s*3/);
    // Percent label is rounded to 67 % (2/3 ≈ 66.67 → round → 67).
    expect(cardText).toMatch(/67%/);

    // Tone is default (not warning, not danger) because 67 < 80.
    await expect(card).toHaveAttribute('data-tone', 'default');

    // Progress fill width should be ~66.67 %.
    const fill = card.getByTestId('usage-progress-fill');
    const width = await fill.evaluate((el) => (el as HTMLElement).style.width);
    expect(width).toMatch(/^66\.66/);
  });

  test('functional: FREE at menu limit flips card to danger tone', async ({ page }) => {
    // FREE plan has maxMenus = 1, so seeding one menu hits the limit.
    await seedAndLogin(page, { plan: 'FREE', menus: 1 });
    await page.goto('/admin/dashboard');

    const card = page.getByTestId('usage-card-menus');
    await expect(card).toBeVisible();
    await expect(card).toHaveAttribute('data-tone', 'danger');

    const fill = card.getByTestId('usage-progress-fill');
    const width = await fill.evaluate((el) => (el as HTMLElement).style.width);
    expect(width).toBe('100%');
  });

  test('functional: PRO hides upgrade link; STARTER/FREE show it', async ({ page }) => {
    // STARTER first — upgrade link should be visible.
    await seedAndLogin(page, { plan: 'STARTER', menus: 1 });
    await page.goto('/admin/dashboard');
    await expect(page.getByTestId('plan-usage-upgrade')).toBeVisible();

    // Swap to PRO — upgrade link must disappear.
    await resetDb();
    await seedAndLogin(page, {
      plan: 'PRO',
      menus: 1,
      email: 'pro@cafelinville.ge',
      name: 'Nino Kapanadze',
    });
    await page.goto('/admin/dashboard');
    await expect(page.getByTestId('plan-usage-upgrade')).toHaveCount(0);
  });

  test('functional: STARTER shows ∞ for categories/products (unlimited)', async ({
    page,
  }) => {
    await seedAndLogin(page, { plan: 'STARTER', menus: 1 });
    await page.goto('/admin/dashboard');

    const cats = page.getByTestId('usage-card-categories');
    await expect(cats).toBeVisible();
    await expect(cats).toHaveAttribute('data-unlimited', 'true');
    const catsText = (await cats.textContent())?.replace(/\s+/g, ' ') ?? '';
    expect(catsText).toContain('∞');
    expect(catsText).toContain('Unlimited');

    const prods = page.getByTestId('usage-card-products');
    await expect(prods).toHaveAttribute('data-unlimited', 'true');
  });

  test('functional: "Create new menu" button navigates to /admin/menus/new', async ({
    page,
  }) => {
    await seedAndLogin(page, { plan: 'STARTER', menus: 1 });
    await page.goto('/admin/dashboard');

    await page.getByTestId('dashboard-create-menu').click();
    await expect(page).toHaveURL(/\/admin\/menus\/new(\b|\?|$)/);
  });

  // ── T11.9: Upgrade Card ───────────────────────────────────────────────────

  test('visual: upgrade card (FREE → STARTER)', async ({ page }, testInfo) => {
    await seedAndLogin(page, { plan: 'FREE', menus: 0 });
    await page.goto('/admin/dashboard');
    await stabilizeClockAnimations(page);

    const card = page.getByTestId('dashboard-upgrade-card');
    await expect(card).toBeVisible();
    await expect(card).toHaveAttribute('data-target-plan', 'STARTER');
    await expect(card).toHaveScreenshot(
      `dashboard-upgrade-free-${testInfo.project.name}.png`,
      { maxDiffPixelRatio: 0.05 },
    );
  });

  test('visual: upgrade card (STARTER → PRO)', async ({ page }, testInfo) => {
    await seedAndLogin(page, { plan: 'STARTER', menus: 1 });
    await page.goto('/admin/dashboard');
    await stabilizeClockAnimations(page);

    const card = page.getByTestId('dashboard-upgrade-card');
    await expect(card).toBeVisible();
    await expect(card).toHaveAttribute('data-target-plan', 'PRO');
    await expect(card).toHaveScreenshot(
      `dashboard-upgrade-starter-${testInfo.project.name}.png`,
      { maxDiffPixelRatio: 0.05 },
    );
  });

  test('functional: upgrade card hidden on PRO', async ({ page }) => {
    await seedAndLogin(page, { plan: 'PRO', menus: 1 });
    await page.goto('/admin/dashboard');

    await expect(page.getByTestId('dashboard-upgrade-card')).toHaveCount(0);
  });

  test('functional: FREE upgrade card targets STARTER with 29₾ price and 3 features', async ({
    page,
  }) => {
    await seedAndLogin(page, { plan: 'FREE', menus: 0 });
    await page.goto('/admin/dashboard');

    const card = page.getByTestId('dashboard-upgrade-card');
    await expect(card).toBeVisible();
    await expect(card).toHaveAttribute('data-current-plan', 'FREE');
    await expect(card).toHaveAttribute('data-target-plan', 'STARTER');

    const cardText = (await card.textContent())?.replace(/\s+/g, ' ') ?? '';
    expect(cardText).toContain('29');
    expect(cardText).toContain('₾');

    // Exactly 3 feature bullets.
    await expect(
      card.getByTestId('dashboard-upgrade-feature'),
    ).toHaveCount(3);

    const cta = card.getByTestId('dashboard-upgrade-cta');
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', '/admin/settings/billing');
  });

  test('functional: STARTER upgrade card targets PRO with 59₾ price', async ({
    page,
  }) => {
    await seedAndLogin(page, { plan: 'STARTER', menus: 1 });
    await page.goto('/admin/dashboard');

    const card = page.getByTestId('dashboard-upgrade-card');
    await expect(card).toBeVisible();
    await expect(card).toHaveAttribute('data-current-plan', 'STARTER');
    await expect(card).toHaveAttribute('data-target-plan', 'PRO');

    const cardText = (await card.textContent())?.replace(/\s+/g, ' ') ?? '';
    expect(cardText).toContain('59');
    expect(cardText).toContain('₾');
  });

  test('functional: upgrade CTA navigates to /admin/settings/billing', async ({
    page,
  }) => {
    await seedAndLogin(page, { plan: 'STARTER', menus: 1 });
    await page.goto('/admin/dashboard');

    await page.getByTestId('dashboard-upgrade-cta').click();
    await expect(page).toHaveURL(/\/admin\/settings\/billing(\b|\?|$)/);
  });

  // ── T11.5 Analytics Card + Device Breakdown ───────────────────────────────

  test.describe('T11.5 analytics + device breakdown', () => {
    test('visual: PRO with 600 views renders chart + donut', async ({
      page,
    }, testInfo) => {
      const user = await seedAndLogin(page, { plan: 'PRO', menus: 1 });
      const menu = await seedMenu({
        userId: user.id,
        status: 'PUBLISHED',
        slug: 'cafe-pro-views',
      });
      // 30 days × ~20 views/day, round-robin mobile/desktop/tablet.
      await seedMenuViews({ menuId: menu.id, days: 30, viewsPerDay: 20 });

      await page.goto('/admin/dashboard');
      await stabilizeClockAnimations(page);

      // Chart + donut must actually be in the DOM before the screenshot.
      await expect(page.getByTestId('analytics-area-chart')).toBeVisible();
      await expect(page.getByTestId('dashboard-device-breakdown')).toBeVisible();

      const analytics = page.getByTestId('dashboard-analytics-card');
      const devices = page.getByTestId('dashboard-device-breakdown');

      await expect(analytics).toHaveScreenshot(
        `dashboard-analytics-pro-${testInfo.project.name}.png`,
        { maxDiffPixelRatio: 0.05 },
      );
      await expect(devices).toHaveScreenshot(
        `dashboard-device-pro-${testInfo.project.name}.png`,
        { maxDiffPixelRatio: 0.05 },
      );
    });

    test('visual: FREE with views shows locked overlay + blurred chart', async ({
      page,
    }, testInfo) => {
      const user = await seedAndLogin(page, { plan: 'FREE', menus: 1 });
      // FREE can only own 1 menu — find it and seed views on it so the chart
      // has a silhouette behind the overlay.
      const menu = await seedMenu({
        userId: user.id,
        status: 'PUBLISHED',
        slug: 'cafe-free-views',
      });
      await seedMenuViews({ menuId: menu.id, days: 30, viewsPerDay: 10 });

      await page.goto('/admin/dashboard');
      await stabilizeClockAnimations(page);

      const overlay = page.getByTestId('analytics-locked-overlay');
      await expect(overlay).toBeVisible();
      const cta = page.getByTestId('analytics-upgrade-cta');
      await expect(cta).toBeVisible();

      const card = page.getByTestId('dashboard-analytics-card');
      await expect(card).toHaveScreenshot(
        `dashboard-analytics-free-locked-${testInfo.project.name}.png`,
        { maxDiffPixelRatio: 0.05 },
      );
    });

    test('functional: 30d total matches seeded MenuView count and delta renders', async ({
      page,
    }) => {
      const user = await seedAndLogin(page, { plan: 'PRO', menus: 0 });
      const menu = await seedMenu({
        userId: user.id,
        status: 'PUBLISHED',
        slug: 'cafe-pro-30d',
      });
      // 100 views spread across the last 30 days (5 days × 20 views).
      await seedMenuViews({ menuId: menu.id, days: 5, viewsPerDay: 20 });

      await page.goto('/admin/dashboard');

      const totalViews = page.getByTestId('analytics-total-views');
      await expect(totalViews).toBeVisible();
      const text = (await totalViews.textContent())?.replace(/\s+/g, ' ') ?? '';
      expect(text).toContain('100');

      // Previous 30d had 0 views → deltaPercent = 100, kind = up.
      const badge = page.getByTestId('analytics-delta-badge');
      await expect(badge).toHaveAttribute('data-delta-kind', 'up');
    });

    test('functional: period toggle 30d → 7d refetches and narrows the total', async ({
      page,
    }) => {
      const user = await seedAndLogin(page, { plan: 'PRO', menus: 0 });
      const menu = await seedMenu({
        userId: user.id,
        status: 'PUBLISHED',
        slug: 'cafe-pro-toggle',
      });
      // Heavy tail: 30 days at 10/day → 7d window should contain ~70 views,
      // 30d window ~300.
      await seedMenuViews({ menuId: menu.id, days: 30, viewsPerDay: 10 });

      await page.goto('/admin/dashboard');

      const totalLocator = page.getByTestId('analytics-total-views');
      // Wait for the 30d query to settle.
      await expect(totalLocator).toContainText(/3\d\d|300/);
      const total30d = Number(
        ((await totalLocator.textContent()) ?? '').match(/\d+/)?.[0] ?? '0',
      );

      await page.getByTestId('analytics-period-7d').click();

      // The number must drop once the 7d query resolves. We use
      // `toPass` polling because the fetch triggers a React re-render and
      // the DOM text updates after.
      await expect(async () => {
        const t = await totalLocator.textContent();
        const n = Number((t ?? '').match(/\d+/)?.[0] ?? '0');
        expect(n).toBeLessThan(total30d);
        expect(n).toBeGreaterThan(0);
      }).toPass({ timeout: 5000 });
    });

    test('functional: FREE upgrade CTA navigates to /admin/settings/billing', async ({
      page,
    }) => {
      await seedAndLogin(page, { plan: 'FREE', menus: 0 });
      await page.goto('/admin/dashboard');

      const cta = page.getByTestId('analytics-upgrade-cta');
      await expect(cta).toBeVisible();
      await cta.click();
      await expect(page).toHaveURL(/\/admin\/settings\/billing(\b|\?|$)/);
    });

    test('functional: FREE hides period selector; PRO shows it with 3 options', async ({
      page,
    }) => {
      // FREE path — selector hidden behind the overlay.
      const free = await seedAndLogin(page, { plan: 'FREE', menus: 0 });
      // (no explicit menu seed — published menu count is 0 on FREE default)
      void free;
      await page.goto('/admin/dashboard');
      await expect(page.getByTestId('analytics-period-selector')).toHaveCount(0);

      // PRO path — all three segments must render.
      await resetDb();
      const pro = await seedAndLogin(page, {
        plan: 'PRO',
        menus: 0,
        email: 'pro-segments@cafelinville.ge',
      });
      const proMenu = await seedMenu({
        userId: pro.id,
        status: 'PUBLISHED',
        slug: 'cafe-pro-segments',
      });
      await seedMenuViews({ menuId: proMenu.id, days: 7, viewsPerDay: 5 });
      await page.goto('/admin/dashboard');

      await expect(page.getByTestId('analytics-period-7d')).toBeVisible();
      await expect(page.getByTestId('analytics-period-30d')).toBeVisible();
      await expect(page.getByTestId('analytics-period-90d')).toBeVisible();
    });

    test('functional: device breakdown donut renders mobile/desktop/tablet legend rows', async ({
      page,
    }) => {
      const user = await seedAndLogin(page, { plan: 'PRO', menus: 0 });
      const menu = await seedMenu({
        userId: user.id,
        status: 'PUBLISHED',
        slug: 'cafe-pro-devices',
      });
      // seedMenuViews defaults to round-robin across mobile/desktop/tablet.
      await seedMenuViews({ menuId: menu.id, days: 10, viewsPerDay: 12 });

      await page.goto('/admin/dashboard');

      await expect(page.getByTestId('device-legend-mobile')).toBeVisible();
      await expect(page.getByTestId('device-legend-desktop')).toBeVisible();
      await expect(page.getByTestId('device-legend-tablet')).toBeVisible();

      // With even round-robin across 3 devices each row should be ~33.3 %.
      for (const d of ['mobile', 'desktop', 'tablet'] as const) {
        const row = page.getByTestId(`device-legend-${d}`);
        const text = (await row.textContent()) ?? '';
        expect(text).toMatch(/3[23]\.\d%|33\.3%/);
      }
    });

    test('functional: analytics endpoint returns totals matching seeded data', async ({
      page,
      request,
    }) => {
      const user = await seedAndLogin(page, { plan: 'PRO', menus: 0 });
      const menu = await seedMenu({
        userId: user.id,
        status: 'PUBLISHED',
        slug: 'cafe-pro-api',
      });
      const count = await seedMenuViews({
        menuId: menu.id,
        days: 7,
        viewsPerDay: 15,
      });
      expect(count).toBe(7 * 15);

      // `loginAs` stored the session cookie on `page.context()`, which
      // `request` shares. The API call authenticates automatically.
      const res = await request.get('/api/user/analytics?period=7d');
      expect(res.ok()).toBeTruthy();
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.overview.totalViews).toBe(7 * 15);
      expect(body.data.dailyViews).toHaveLength(7);
      expect(body.data.period.period).toBe('7d');
    });
  });

  // ── T11.6 Dashboard Your Menus Table ──────────────────────────────────────

  test.describe('T11.6 your menus table', () => {
    // Stable fixture: 3 PUBLISHED + 1 DRAFT so filter pills exercise both
    // branches and visual baselines have a consistent row count.
    const TABLE_MENUS: Array<{
      name: string;
      slug: string;
      status: 'PUBLISHED' | 'DRAFT';
    }> = [
      { name: 'Main menu — All day', slug: 'main-all-day', status: 'PUBLISHED' },
      { name: 'Brunch — Weekends', slug: 'brunch-weekends', status: 'PUBLISHED' },
      { name: 'Wine & cocktails', slug: 'wine-cocktails', status: 'PUBLISHED' },
      { name: 'Seasonal · Spring tasting', slug: 'spring-tasting', status: 'DRAFT' },
    ];

    async function seedTableScenario(
      page: import('@playwright/test').Page,
      opts: { plan: 'STARTER' | 'PRO'; seedViews?: boolean },
    ) {
      const email = 'nino@cafelinville.ge';
      const user = await seedUser({
        plan: opts.plan,
        name: 'Nino Kapanadze',
        email,
      });

      const menus: Awaited<ReturnType<typeof seedMenu>>[] = [];
      for (const m of TABLE_MENUS) {
        const menu = await seedMenu({
          userId: user.id,
          name: m.name,
          slug: m.slug,
          status: m.status,
          categoryCount: 2,
          productCount: 2,
        });
        menus.push(menu);
      }

      // Seed a small view history for 2 of the published menus so "today /
      // week" shows non-zero tabular numbers.
      if (opts.seedViews) {
        await seedMenuViews({ menuId: menus[0].id, days: 7, viewsPerDay: 5 });
        await seedMenuViews({ menuId: menus[1].id, days: 7, viewsPerDay: 2 });
      }

      await loginAs(page, email);
      return { user, menus };
    }

    async function stabilizeAnimations(
      page: import('@playwright/test').Page,
    ) {
      await page.evaluate(() => document.fonts.ready);
      await page.addStyleTag({
        content:
          '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }',
      });
    }

    test('visual: table with 4 menus (STARTER, counts + rows)', async ({
      page,
    }, testInfo) => {
      await seedTableScenario(page, { plan: 'STARTER', seedViews: true });
      await page.goto('/admin/dashboard');
      await stabilizeAnimations(page);

      const card = page.getByTestId('dashboard-your-menus');
      await expect(card).toBeVisible();
      await expect(page.getByTestId('dashboard-menus-row')).toHaveCount(4);

      // Mask the volatile "last edited" column + the analytics card above
      // so tiny time shifts don't tank the diff.
      await expect(card).toHaveScreenshot(
        `dashboard-menus-table-${testInfo.project.name}.png`,
        {
          maxDiffPixelRatio: 0.05,
          mask: [
            card.locator(
              '[data-testid="dashboard-menus-row"] > div:nth-child(5)',
            ),
          ],
        },
      );
    });

    test('visual: empty state with 3 starter templates', async ({
      page,
    }, testInfo) => {
      const user = await seedUser({
        plan: 'STARTER',
        name: 'Nino Kapanadze',
        email: 'empty@cafelinville.ge',
      });
      void user;
      await loginAs(page, 'empty@cafelinville.ge');
      await page.goto('/admin/dashboard');
      await stabilizeAnimations(page);

      const empty = page.getByTestId('dashboard-your-menus-empty');
      await expect(empty).toBeVisible();
      await expect(
        page.getByTestId('dashboard-menus-templates').locator('button'),
      ).toHaveCount(3);

      await expect(empty).toHaveScreenshot(
        `dashboard-menus-empty-${testInfo.project.name}.png`,
        { maxDiffPixelRatio: 0.05 },
      );
    });

    test('functional: filter pills filter rows by status', async ({ page }) => {
      await seedTableScenario(page, { plan: 'STARTER' });
      await page.goto('/admin/dashboard');

      // Default: All 4 rows visible.
      await expect(page.getByTestId('dashboard-menus-row')).toHaveCount(4);
      await expect(
        page.getByTestId('dashboard-menus-filter-all'),
      ).toHaveAttribute('data-active', 'true');

      // Click Published → 3 rows remain.
      await page.getByTestId('dashboard-menus-filter-published').click();
      await expect(page.getByTestId('dashboard-menus-row')).toHaveCount(3);
      await expect(
        page.getByTestId('dashboard-menus-filter-published'),
      ).toHaveAttribute('data-active', 'true');
      const publishedRows = page.getByTestId('dashboard-menus-row');
      const statuses = await publishedRows.evaluateAll((nodes) =>
        nodes.map((n) => n.getAttribute('data-menu-status')),
      );
      expect(statuses.every((s) => s === 'PUBLISHED')).toBe(true);

      // Click Draft → 1 row.
      await page.getByTestId('dashboard-menus-filter-draft').click();
      await expect(page.getByTestId('dashboard-menus-row')).toHaveCount(1);
      await expect(
        page.getByTestId('dashboard-menus-row').first(),
      ).toHaveAttribute('data-menu-status', 'DRAFT');

      // Back to All → 4 rows again.
      await page.getByTestId('dashboard-menus-filter-all').click();
      await expect(page.getByTestId('dashboard-menus-row')).toHaveCount(4);
    });

    test('functional: search filters rows by menu name', async ({ page }) => {
      await seedTableScenario(page, { plan: 'STARTER' });
      await page.goto('/admin/dashboard');

      const search = page.getByTestId('dashboard-menus-search');
      await search.fill('brunch');
      await expect(page.getByTestId('dashboard-menus-row')).toHaveCount(1);
      await expect(
        page.getByTestId('dashboard-menus-row').first(),
      ).toContainText('Brunch');

      // Clearing shows all again.
      await search.fill('');
      await expect(page.getByTestId('dashboard-menus-row')).toHaveCount(4);

      // Query with no match → no-results message.
      await search.fill('zzznothing');
      await expect(
        page.getByTestId('dashboard-menus-no-results'),
      ).toBeVisible();
      await expect(page.getByTestId('dashboard-menus-row')).toHaveCount(0);
    });

    test('functional: kebab Delete opens confirm dialog and DELETEs via /api/menus/[id]', async ({
      page,
    }) => {
      const { menus } = await seedTableScenario(page, { plan: 'STARTER' });
      await page.goto('/admin/dashboard');

      // 4 rows before deleting.
      await expect(page.getByTestId('dashboard-menus-row')).toHaveCount(4);

      // Open the first row's kebab and click Delete.
      await page
        .getByTestId('dashboard-menus-row-kebab')
        .first()
        .click();
      await page.getByTestId('dashboard-menus-row-delete').click();

      // Confirm dialog appears.
      const dialog = page.getByTestId('dashboard-menus-delete-dialog');
      await expect(dialog).toBeVisible();

      // Wait for the DELETE to fire and return 200/2xx.
      const [deleteResponse] = await Promise.all([
        page.waitForResponse((res) => {
          return (
            /\/api\/menus\/[^/?]+$/.test(res.url()) &&
            res.request().method() === 'DELETE'
          );
        }),
        page.getByTestId('dashboard-menus-delete-confirm').click(),
      ]);
      expect(deleteResponse.ok()).toBe(true);

      // Row is removed from the table.
      await expect(page.getByTestId('dashboard-menus-row')).toHaveCount(3);

      // And the menu is actually gone from the DB.
      const deletedId = menus[0].id;
      const row = await prismaTest.menu.findUnique({
        where: { id: deletedId },
        select: { id: true },
      });
      expect(row).toBeNull();
    });

    test('functional: template card navigates to /admin/menus/new?template=cafe', async ({
      page,
    }) => {
      const user = await seedUser({
        plan: 'STARTER',
        name: 'Nino Kapanadze',
        email: 'templates@cafelinville.ge',
      });
      void user;
      await loginAs(page, 'templates@cafelinville.ge');
      await page.goto('/admin/dashboard');

      await page.getByTestId('dashboard-menus-template-cafe').click();
      await expect(page).toHaveURL(/\/admin\/menus\/new\?template=cafe$/);
    });
  });

  // ── T11.8 Top Products Widget ─────────────────────────────────────────────

  test.describe('T11.8 top products widget', () => {
    async function seedTopProductsScenario(
      page: import('@playwright/test').Page,
      opts: { productsPerCategory?: number } = {},
    ) {
      const email = 'topproducts@cafelinville.ge';
      const user = await seedUser({
        plan: 'STARTER',
        name: 'Nino Kapanadze',
        email,
      });
      await seedMenu({
        userId: user.id,
        name: 'Café Linville — All Day',
        slug: 'cafe-linville-all-day',
        status: 'PUBLISHED',
        categoryCount: 2,
        // seed fixture cycles GEORGIAN_PRODUCTS, so 3 × 2 categories = 6
        // products with varied prices — enough to fill 5 rank rows.
        productCount: opts.productsPerCategory ?? 3,
      });
      await loginAs(page, email);
      return { user };
    }

    async function stabilizeAnimations(
      page: import('@playwright/test').Page,
    ) {
      await page.evaluate(() => document.fonts.ready);
      await page.addStyleTag({
        content:
          '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }',
      });
    }

    test('visual: 5 ranked rows with popularity bars', async ({
      page,
    }, testInfo) => {
      await seedTopProductsScenario(page);
      await page.goto('/admin/dashboard');
      await stabilizeAnimations(page);

      const card = page.getByTestId('dashboard-top-products');
      await expect(card).toBeVisible();
      await expect(page.getByTestId('dashboard-top-products-row')).toHaveCount(5);

      await expect(card).toHaveScreenshot(
        `dashboard-top-products-${testInfo.project.name}.png`,
        { maxDiffPixelRatio: 0.05 },
      );
    });

    test('functional: widget renders 5 rows with top-3 highlighted', async ({
      page,
    }) => {
      await seedTopProductsScenario(page);
      await page.goto('/admin/dashboard');

      const rows = page.getByTestId('dashboard-top-products-row');
      await expect(rows).toHaveCount(5);

      // Ranks 1-3 flagged as top-three for the accent-colored rank label.
      for (let i = 0; i < 3; i++) {
        await expect(rows.nth(i)).toHaveAttribute('data-top-three', 'true');
        await expect(rows.nth(i)).toHaveAttribute('data-rank', String(i + 1));
      }
      await expect(rows.nth(3)).toHaveAttribute('data-top-three', 'false');
      await expect(rows.nth(4)).toHaveAttribute('data-top-three', 'false');
    });

    test('functional: rows are ordered by price DESC and link to the menu editor', async ({
      page,
    }) => {
      const { user } = await seedTopProductsScenario(page);

      await page.goto('/admin/dashboard');

      // Fetch the product ordering we expect from the server (price DESC,
      // updatedAt DESC) so this test asserts against real DB state rather
      // than mirroring the heuristic hard-coded in the route.
      const expected = await prismaTest.product.findMany({
        where: { category: { menu: { userId: user.id } } },
        orderBy: [{ price: 'desc' }, { updatedAt: 'desc' }],
        take: 5,
        select: { id: true, nameKa: true, nameEn: true, price: true },
      });

      const rows = page.getByTestId('dashboard-top-products-row');
      await expect(rows).toHaveCount(5);

      // First row should be the highest-priced product in the user's menus,
      // rendered in the active locale. Test cookie is `en` so nameEn wins.
      const topText = (await rows.nth(0).textContent()) ?? '';
      const firstName = expected[0].nameEn ?? expected[0].nameKa;
      expect(topText).toContain(firstName);

      // Row link points at the owning menu's editor page.
      const firstLink = rows.nth(0).getByRole('link');
      const href = await firstLink.getAttribute('href');
      expect(href).toMatch(/^\/admin\/menus\/[^/]+$/);
    });

    test('functional: GET /api/user/top-products returns heuristic rows', async ({
      page,
    }) => {
      const { user } = await seedTopProductsScenario(page);

      const response = await page.request.get(
        '/api/user/top-products?limit=5&days=30',
      );
      expect(response.ok()).toBe(true);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.heuristic).toBe(true);
      expect(body.data.period.days).toBe(30);
      expect(body.data.rows).toHaveLength(5);

      // Every returned row is owned by this user (category → menu → userId).
      const rowIds = body.data.rows.map((r: { id: string }) => r.id);
      const ownership = await prismaTest.product.count({
        where: {
          id: { in: rowIds },
          category: { menu: { userId: user.id } },
        },
      });
      expect(ownership).toBe(rowIds.length);

      // Rank is 1-indexed and sequential; views are descending.
      const ranks = body.data.rows.map((r: { rank: number }) => r.rank);
      expect(ranks).toEqual([1, 2, 3, 4, 5]);
      const views = body.data.rows.map((r: { views: number }) => r.views);
      const sortedDesc = [...views].sort((a, b) => b - a);
      expect(views).toEqual(sortedDesc);
    });

    test('functional: empty state when user has no products', async ({
      page,
    }) => {
      const user = await seedUser({
        plan: 'STARTER',
        name: 'Nino Kapanadze',
        email: 'empty-products@cafelinville.ge',
      });
      void user;
      await loginAs(page, 'empty-products@cafelinville.ge');
      await page.goto('/admin/dashboard');

      await expect(page.getByTestId('dashboard-top-products')).toBeVisible();
      await expect(page.getByTestId('dashboard-top-products-empty')).toBeVisible();
      await expect(page.getByTestId('dashboard-top-products-row')).toHaveCount(0);
    });
  });
});
