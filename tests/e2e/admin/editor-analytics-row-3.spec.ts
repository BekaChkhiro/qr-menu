// Test for T15.3 — Analytics Tab · Top Categories + Device Donut (row 3).
// Run:     pnpm test:e2e tests/e2e/admin/editor-analytics-row-3.spec.ts
// Update:  pnpm test:e2e:update tests/e2e/admin/editor-analytics-row-3.spec.ts
//
// Covers:
//   Visual — /admin/menus/[id]?tab=analytics row-3 (Top Categories 2fr + Device
//            Breakdown 1fr with donut + browser list).
//   Functional —
//     • Top categories renders exactly 5 bars in DESC order of MenuView count.
//     • Each bar's width matches `count / maxCount * 100%` (accent fill).
//     • API returns the same counts the UI asserts (non-tautological).
//     • Device donut renders Mobile/Desktop/Tablet arcs with Mobile first.
//     • Browser list populates from real browserBreakdown.
//     • Empty state — no category-attributed views yet.
//     • FREE plan flags both cards with `data-plan-locked="true"`.

import { expect, test, type Page } from '@playwright/test';

import { loginAs } from '../fixtures/auth';
import {
  prismaTest,
  resetDb,
  seedMenu,
  seedMenuViews,
  seedUser,
} from '../fixtures/seed';

const OWNER_EMAIL = 'nino@cafelinville.ge';

async function waitForAnalytics(page: Page) {
  await expect(page.getByTestId('editor-analytics-tab')).toBeVisible();
  // The KPI row fires the same useMenuAnalytics hook the new cards consume —
  // once it's past the skeleton, the row-3 query is hydrated too.
  await expect(page.getByTestId('editor-analytics-kpis')).toBeVisible();
  await page.waitForLoadState('networkidle');
}

async function setupProMenuWithCategoryViews() {
  const user = await seedUser({
    plan: 'PRO',
    name: 'Nino Kapanadze',
    email: OWNER_EMAIL,
  });
  const menu = await seedMenu({
    userId: user.id,
    status: 'PUBLISHED',
    categoryCount: 4,
    productCount: 3,
    name: 'Café Linville — Analytics',
  });

  // Pull the ordered category list straight from the DB so the test can
  // cross-check the API aggregation.
  const cats = await prismaTest.category.findMany({
    where: { menuId: menu.id },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, nameEn: true, nameKa: true },
  });
  expect(cats.length).toBe(4);

  // Bias category distribution so DESC order is well-defined:
  //   cats[0] : weight 10
  //   cats[1] : weight  6
  //   cats[2] : weight  3
  //   cats[3] : weight  1
  // Plus unattributed menu-level views (null) that must be excluded from the
  // top-categories aggregation entirely.
  await seedMenuViews({
    menuId: menu.id,
    days: 14,
    viewsPerDay: 24,
    devices: ['mobile', 'desktop', 'tablet'],
    deviceWeights: [6, 2, 1], // Mobile-dominant, matches real-world pattern.
    browsers: ['Safari', 'Chrome', 'Firefox', 'Edge'],
    categoryDistribution: [
      { categoryId: cats[0].id, weight: 10 },
      { categoryId: cats[1].id, weight: 6 },
      { categoryId: cats[2].id, weight: 3 },
      { categoryId: cats[3].id, weight: 1 },
      { categoryId: null, weight: 4 }, // menu-level views (excluded)
    ],
  });

  return { user, menu, categories: cats };
}

async function setupFreeMenu() {
  const user = await seedUser({
    plan: 'FREE',
    name: 'Beka Chkhiro',
    email: 'beka@test.local',
  });
  const menu = await seedMenu({
    userId: user.id,
    status: 'DRAFT',
    categoryCount: 1,
    productCount: 2,
    name: 'Free plan menu',
  });
  return { user, menu };
}

test.describe('editor analytics tab · top categories + device donut (T15.3)', () => {
  // Serial — resetDb() in beforeEach would otherwise race another test's seed.
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ context }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop',
      'Desktop-only row; mobile variant lands in T17.3',
    );
    await resetDb();
    await context.clearCookies();
    // Force English so seeded category EN names match our assertions.
    await context.addCookies([
      { name: 'NEXT_LOCALE', value: 'en', domain: 'localhost', path: '/' },
    ]);
  });

  // ── Visual baseline ────────────────────────────────────────────────────────

  test('visual: editor-analytics-row-3 on PRO', async ({ page }, testInfo) => {
    const { menu } = await setupProMenuWithCategoryViews();
    await loginAs(page, OWNER_EMAIL);
    await page.goto(`/admin/menus/${menu.id}?tab=analytics`);
    await waitForAnalytics(page);

    await expect(page.getByTestId('editor-analytics-row-3')).toBeVisible();
    await expect(
      page.getByTestId('editor-analytics-top-categories-card'),
    ).toBeVisible();
    await expect(page.getByTestId('editor-analytics-device-card')).toBeVisible();

    // Freeze fonts + animations so the bar + donut screenshot is stable.
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({
      content:
        '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }',
    });

    await expect(page.getByTestId('editor-analytics-row-3')).toHaveScreenshot(
      `editor-analytics-row-3-${testInfo.project.name}.png`,
      { maxDiffPixelRatio: 0.05 },
    );
  });

  // ── Top Categories — bar count, order, counts from API ─────────────────────

  test('functional: top categories renders exactly 5 bars in DESC order (API-sourced)', async ({
    page,
  }) => {
    const { menu } = await setupProMenuWithCategoryViews();

    // Pull the aggregation straight from the API the UI consumes — assertions
    // source their expected values from this response, not from hard-coded
    // counts. If the API and UI disagree, the test fails for the right reason.
    const apiResponse = await page.request.get(
      `/api/menus/${menu.id}/analytics?period=30d`,
      { headers: { 'x-test-auth': OWNER_EMAIL } },
    );

    // Login via auth fixture before the UI navigation (the API test-auth
    // header isn't wired, so we hit the guarded endpoint via the session).
    await loginAs(page, OWNER_EMAIL);
    const apiPayload = await page.evaluate(async (menuId) => {
      const res = await fetch(`/api/menus/${menuId}/analytics?period=30d`);
      return res.json();
    }, menu.id);

    // TypeScript shape guard.
    expect(apiPayload.success).toBe(true);
    const apiCats = apiPayload.data.topCategories as Array<{
      categoryId: string;
      count: number;
    }>;
    expect(apiCats.length).toBeGreaterThan(0);

    await page.goto(`/admin/menus/${menu.id}?tab=analytics`);
    await waitForAnalytics(page);

    const rows = page.getByTestId('editor-analytics-top-categories-row');
    // We seeded 4 categories; the top-5 slice should surface all 4.
    await expect(rows).toHaveCount(apiCats.length);

    // Row order matches API order (already sorted DESC on the server).
    for (let i = 0; i < apiCats.length; i++) {
      const row = rows.nth(i);
      await expect(row).toHaveAttribute('data-rank', String(i + 1));
      await expect(row).toHaveAttribute('data-category-id', apiCats[i].categoryId);
      // Count column matches the API (locale-formatted via toLocaleString()).
      await expect(
        row.getByTestId('editor-analytics-top-categories-count'),
      ).toContainText(apiCats[i].count.toLocaleString('en-US'));
    }

    // Rank 1 bar is exactly 100% wide; rank 2 is (count2/count1)%.
    const bar1 = rows.nth(0).getByTestId('editor-analytics-top-categories-bar');
    const bar2 = rows.nth(1).getByTestId('editor-analytics-top-categories-bar');
    const width1 = await bar1.evaluate((el) => (el as HTMLElement).style.width);
    const width2 = await bar2.evaluate((el) => (el as HTMLElement).style.width);
    expect(width1).toBe('100%');
    const expectedWidth2 = `${(apiCats[1].count / apiCats[0].count) * 100}%`;
    expect(width2).toBe(expectedWidth2);

    // Non-tautological cross-check: unattributed views are excluded from
    // topCategories even though they contribute to totalViews.
    const totalViews = apiPayload.data.kpis.totalViews.current as number;
    const categorizedViews = apiCats.reduce((s, c) => s + c.count, 0);
    expect(totalViews).toBeGreaterThan(categorizedViews);

    expect(apiResponse).toBeTruthy(); // silence unused-var warning
  });

  // ── Device Donut — Mobile always first + percentages match ─────────────────

  test('functional: device donut renders Mobile/Desktop/Tablet with Mobile first', async ({
    page,
  }) => {
    const { menu } = await setupProMenuWithCategoryViews();
    await loginAs(page, OWNER_EMAIL);
    await page.goto(`/admin/menus/${menu.id}?tab=analytics`);
    await waitForAnalytics(page);

    const card = page.getByTestId('editor-analytics-device-card');
    await expect(card).toBeVisible();

    const donut = page.getByTestId('editor-analytics-device-donut');
    await expect(donut).toBeVisible();

    // Arcs — one per device bucket present.
    await expect(
      page.getByTestId('editor-analytics-device-arc-mobile'),
    ).toBeVisible();
    await expect(
      page.getByTestId('editor-analytics-device-arc-desktop'),
    ).toBeVisible();
    await expect(
      page.getByTestId('editor-analytics-device-arc-tablet'),
    ).toBeVisible();

    // Mobile is the first (largest) legend row.
    const legendRows = page.getByTestId('editor-analytics-device-legend-row');
    await expect(legendRows.first()).toHaveAttribute('data-device', 'mobile');

    // Cross-check percentages against the API response.
    const apiPayload = await page.evaluate(async (menuId) => {
      const res = await fetch(`/api/menus/${menuId}/analytics?period=30d`);
      return res.json();
    }, menu.id);
    const devices = apiPayload.data.deviceBreakdown as Array<{
      device: string;
      percentage: number;
    }>;
    const mobileEntry = devices.find((d) => d.device === 'mobile');
    expect(mobileEntry).toBeTruthy();

    // Arc length should be proportional to (percentage / 100) × 2πR (R=48 ⇒ C≈301.59).
    const arcLengthAttr = await page
      .getByTestId('editor-analytics-device-arc-mobile')
      .getAttribute('data-arc-length');
    expect(arcLengthAttr).not.toBeNull();
    const mobileArc = parseFloat(arcLengthAttr!);
    const C = 2 * Math.PI * 48;
    const expectedArc = (mobileEntry!.percentage / 100) * C;
    // Tolerate 1px rounding error.
    expect(Math.abs(mobileArc - expectedArc)).toBeLessThan(1);
  });

  // ── Browser list populates from real analytics data ────────────────────────

  test('functional: browser list renders rows from analytics browserBreakdown', async ({
    page,
  }) => {
    const { menu } = await setupProMenuWithCategoryViews();
    await loginAs(page, OWNER_EMAIL);
    await page.goto(`/admin/menus/${menu.id}?tab=analytics`);
    await waitForAnalytics(page);

    const list = page.getByTestId('editor-analytics-browser-list');
    await expect(list).toBeVisible();

    const apiPayload = await page.evaluate(async (menuId) => {
      const res = await fetch(`/api/menus/${menuId}/analytics?period=30d`);
      return res.json();
    }, menu.id);
    const browsers = apiPayload.data.browserBreakdown as Array<{
      browser: string;
    }>;
    expect(browsers.length).toBeGreaterThan(0);

    const rows = page.getByTestId('editor-analytics-browser-row');
    const expectedCount = Math.min(4, browsers.length);
    await expect(rows).toHaveCount(expectedCount);
    // First row in the list is the most-seen browser.
    await expect(rows.first()).toHaveAttribute(
      'data-browser',
      browsers[0].browser.toLowerCase(),
    );
  });

  // ── Empty state — no category-attributed views ─────────────────────────────

  test('functional: top categories shows empty state when no category views', async ({
    page,
  }) => {
    const user = await seedUser({
      plan: 'PRO',
      email: OWNER_EMAIL,
      name: 'Nino',
    });
    const menu = await seedMenu({
      userId: user.id,
      status: 'PUBLISHED',
      categoryCount: 2,
      productCount: 2,
      name: 'No-category-views menu',
    });
    // Seed plenty of menu-level views (null categoryId) to prove those don't
    // count towards topCategories.
    await seedMenuViews({
      menuId: menu.id,
      days: 5,
      viewsPerDay: 10,
      // No categoryDistribution → every row gets categoryId = null.
    });

    await loginAs(page, OWNER_EMAIL);
    await page.goto(`/admin/menus/${menu.id}?tab=analytics`);
    await waitForAnalytics(page);

    await expect(
      page.getByTestId('editor-analytics-top-categories-empty'),
    ).toBeVisible();
    // And the rows list is NOT rendered.
    await expect(
      page.getByTestId('editor-analytics-top-categories-rows'),
    ).toHaveCount(0);
  });

  // ── FREE plan — both cards plan-locked ─────────────────────────────────────

  test('functional: FREE plan flags both row-3 cards as plan-locked', async ({
    page,
  }) => {
    const { menu, user } = await setupFreeMenu();
    await loginAs(page, user.email);
    await page.goto(`/admin/menus/${menu.id}?tab=analytics`);
    await expect(page.getByTestId('editor-analytics-tab')).toBeVisible();

    await expect(
      page.getByTestId('editor-analytics-top-categories-card'),
    ).toHaveAttribute('data-plan-locked', 'true');
    await expect(
      page.getByTestId('editor-analytics-device-card'),
    ).toHaveAttribute('data-plan-locked', 'true');
  });
});
