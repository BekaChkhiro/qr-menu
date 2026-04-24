// Test for T15.4 — Analytics Tab · Advanced Sections (Coming Soon placeholders).
// Run:     pnpm test:e2e tests/e2e/admin/editor-analytics-advanced.spec.ts
// Update:  pnpm test:e2e:update tests/e2e/admin/editor-analytics-advanced.spec.ts
//
// Covers:
//   Visual — /admin/menus/[id]?tab=analytics on PRO (four preview cards rendered
//            below the KPIs + views-over-time chart).
//   Functional —
//     • Heatmap renders 7 day rows × 24 hour cells + flags the Sat 13:00 peak.
//     • Geography preview shows 5 deterministic city rows (Tbilisi primary).
//     • Traffic source stacked bar renders 3 segments (78/15/7) + 5 QR rows.
//     • Top products preview ranks this menu's products by price DESC, top
//       three rows flagged `data-rank=1..3` with the accent border treatment.
//     • Every preview card shows its "Coming soon" banner (4 testids).
//     • FREE plan flags all four cards with data-plan-locked="true".

import { expect, test, type Page } from '@playwright/test';

import { loginAs } from '../fixtures/auth';
import { prismaTest, resetDb, seedMenu, seedUser } from '../fixtures/seed';

async function seedProAndOpenAnalytics(page: Page) {
  const email = 'nino@cafelinville.ge';
  const user = await seedUser({
    plan: 'PRO',
    name: 'Nino Kapanadze',
    email,
  });
  const menu = await seedMenu({
    userId: user.id,
    status: 'PUBLISHED',
    categoryCount: 3,
    productCount: 4,
    name: 'Café Linville — Dinner',
  });
  await loginAs(page, email);
  await page.goto(`/admin/menus/${menu.id}?tab=analytics`);
  await expect(page.getByTestId('editor-analytics-tab')).toBeVisible();
  return { user, menu };
}

async function seedFreeAndOpenAnalytics(page: Page) {
  const email = 'beka@test.local';
  const user = await seedUser({
    plan: 'FREE',
    name: 'Beka Chkhiro',
    email,
  });
  const menu = await seedMenu({
    userId: user.id,
    status: 'DRAFT',
    categoryCount: 1,
    productCount: 2,
    name: 'Free plan menu',
  });
  await loginAs(page, email);
  await page.goto(`/admin/menus/${menu.id}?tab=analytics`);
  await expect(page.getByTestId('editor-analytics-tab')).toBeVisible();
  return { user, menu };
}

test.describe('editor analytics tab · advanced sections (T15.4)', () => {
  // Serial so resetDb() in one test can't race another's seed.
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ context }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop',
      'Desktop-only tab; mobile variant lands in T17.3',
    );
    await resetDb();
    await context.clearCookies();
    // Force English so "Coming soon" copy matches our assertions.
    await context.addCookies([
      { name: 'NEXT_LOCALE', value: 'en', domain: 'localhost', path: '/' },
    ]);
  });

  // ── Visual: PRO (all 4 cards render) ───────────────────────────────────────

  test('visual: editor-analytics-advanced on PRO', async ({ page }, testInfo) => {
    await seedProAndOpenAnalytics(page);

    await expect(page.getByTestId('editor-analytics-heatmap-card')).toBeVisible();
    await expect(
      page.getByTestId('editor-analytics-geography-card'),
    ).toBeVisible();
    await expect(
      page.getByTestId('editor-analytics-traffic-card'),
    ).toBeVisible();
    await expect(
      page.getByTestId('editor-analytics-top-products-card'),
    ).toBeVisible();
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({
      content:
        '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }',
    });

    // Crop to just the advanced region by screenshotting the parent tab and
    // masking the (already-tested) KPI row + chart above.
    await expect(page.getByTestId('editor-analytics-tab')).toHaveScreenshot(
      `editor-analytics-advanced-${testInfo.project.name}.png`,
      {
        maxDiffPixelRatio: 0.05,
        mask: [
          page.getByTestId('editor-analytics-kpis'),
          page.getByTestId('editor-analytics-chart-card'),
        ],
      },
    );
  });

  // ── Heatmap structure ──────────────────────────────────────────────────────

  test('functional: heatmap renders 7 day rows × 24 hour cells + Sat 13:00 peak', async ({
    page,
  }) => {
    await seedProAndOpenAnalytics(page);

    const grid = page.getByTestId('editor-analytics-heatmap-grid');
    await expect(grid).toBeVisible();

    // Seven day rows, each with one data-day attr from the canonical list.
    const rows = grid.locator('[data-day]');
    await expect(rows).toHaveCount(7);

    // Each row contains 24 hour cells.
    const monCells = grid.locator('[data-day="mon"] [data-hour]');
    await expect(monCells).toHaveCount(24);

    // The design's called-out peak (Saturday 13:00) is marked with data-peak.
    const peakCell = grid.locator('[data-day="sat"] [data-hour="13"]');
    await expect(peakCell).toHaveAttribute('data-peak', 'true');

    // Coming-soon banner renders with the right copy.
    const banner = page.getByTestId('editor-analytics-heatmap-coming-soon');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText(/Coming soon/i);
    await expect(banner).toContainText(/hour-by-hour/i);
  });

  // ── Geography rows ─────────────────────────────────────────────────────────

  test('functional: geography shows 5 deterministic city rows (Tbilisi primary)', async ({
    page,
  }) => {
    await seedProAndOpenAnalytics(page);

    const rows = page.getByTestId('editor-analytics-geography-rows');
    await expect(rows).toBeVisible();

    const cities = ['tbilisi', 'batumi', 'kutaisi', 'rustavi', 'other'];
    for (const city of cities) {
      await expect(rows.locator(`[data-city="${city}"]`)).toBeVisible();
    }

    // Only Tbilisi is flagged as the primary row (accent fill).
    await expect(
      rows.locator('[data-city="tbilisi"]'),
    ).toHaveAttribute('data-primary', 'true');
    await expect(
      rows.locator('[data-city="batumi"]'),
    ).toHaveAttribute('data-primary', 'false');

    // Coming-soon banner renders.
    await expect(
      page.getByTestId('editor-analytics-geography-coming-soon'),
    ).toBeVisible();
  });

  // ── Traffic source bar + QR locations ──────────────────────────────────────

  test('functional: traffic source bar renders 3 segments + 5 QR rows', async ({
    page,
  }) => {
    await seedProAndOpenAnalytics(page);

    const bar = page.getByTestId('editor-analytics-traffic-bar');
    await expect(bar).toBeVisible();

    const qrSeg = bar.locator('[data-source="qr"]');
    const directSeg = bar.locator('[data-source="direct"]');
    const socialSeg = bar.locator('[data-source="social"]');
    await expect(qrSeg).toBeVisible();
    await expect(directSeg).toBeVisible();
    await expect(socialSeg).toBeVisible();
    await expect(qrSeg).toContainText('78%');
    await expect(directSeg).toContainText('15%');

    // The 7% social slice is too narrow to print its label inside the bar, so
    // we don't assert copy — just presence + width.
    const socialWidth = await socialSeg.evaluate((el) =>
      (el as HTMLElement).style.width,
    );
    expect(socialWidth).toBe('7%');

    // QR locations list: 5 deterministic rows in design order.
    const locations = page.getByTestId('editor-analytics-traffic-locations');
    const locRows = locations.locator('[data-location]');
    await expect(locRows).toHaveCount(5);
    await expect(
      locations.locator('[data-location="table6"]'),
    ).toBeVisible();
    await expect(
      locations.locator('[data-location="receipt"]'),
    ).toBeVisible();

    await expect(
      page.getByTestId('editor-analytics-traffic-coming-soon'),
    ).toBeVisible();
  });

  // ── Top products preview ranks by price DESC + tooltip ─────────────────────

  test('functional: top products ranks this menu\'s products by price DESC', async ({
    page,
  }) => {
    const { menu } = await seedProAndOpenAnalytics(page);

    const rows = page.getByTestId('editor-analytics-top-products-rows');
    await expect(rows).toBeVisible();

    // Verify row count matches top-5 slice (we seeded 3 categories × 4
    // products = 12 total).
    const productRows = page.getByTestId('editor-analytics-top-products-row');
    await expect(productRows).toHaveCount(5);

    // Pull expected order from the DB directly, not hard-coded.
    const dbProducts = await prismaTest.product.findMany({
      where: { category: { menuId: menu.id } },
      orderBy: { price: 'desc' },
      take: 5,
      select: { nameKa: true, nameEn: true, price: true },
    });
    expect(dbProducts.length).toBe(5);

    // Row 1 must match the top-priced product (English seed name since we
    // forced the en locale).
    const topName = dbProducts[0].nameEn ?? dbProducts[0].nameKa;
    await expect(productRows.first()).toContainText(topName);

    // Top three rows carry accent-border treatment via data-rank 1..3.
    await expect(productRows.nth(0)).toHaveAttribute('data-rank', '1');
    await expect(productRows.nth(1)).toHaveAttribute('data-rank', '2');
    await expect(productRows.nth(2)).toHaveAttribute('data-rank', '3');
  });

  test('functional: top products preview badge reveals tooltip on focus', async ({
    page,
  }) => {
    await seedProAndOpenAnalytics(page);

    const badge = page.getByTestId('editor-analytics-top-products-preview-badge');
    await expect(badge).toBeVisible();
    await expect(badge).toContainText(/preview/i);

    // Focus the badge (accessible path — no hover needed).
    await badge.focus();
    const tooltip = page.getByTestId(
      'editor-analytics-top-products-preview-tooltip',
    );
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toContainText(/placeholder/i);
  });

  // ── FREE plan locks all 4 cards the same way the KPI + chart are locked ────

  test('functional: FREE plan flags all 4 preview cards as plan-locked', async ({
    page,
  }) => {
    await seedFreeAndOpenAnalytics(page);

    for (const testid of [
      'editor-analytics-heatmap-card',
      'editor-analytics-geography-card',
      'editor-analytics-traffic-card',
      'editor-analytics-top-products-card',
    ]) {
      await expect(page.getByTestId(testid)).toHaveAttribute(
        'data-plan-locked',
        'true',
      );
    }
  });
});
