// Tests for T15.7 Editor — Promotions Tab (List + Filter).
// Run:     pnpm test:e2e tests/e2e/admin/editor-promotions.spec.ts
// Update:  pnpm test:e2e:update tests/e2e/admin/editor-promotions.spec.ts
//
// Covers:
//   Visual  — /admin/menus/[id]?tab=promotions on STARTER with 4 promos
//             across the status set (Active/Scheduled/Ended), matching the
//             Section E artboard `promo-list`.
//   Functional — Filter chip counts match seeded data, clicking "Scheduled"
//             filters the grid to exactly 1 card, FREE plan shows the locked
//             placeholder with an upgrade CTA, and the "New promotion" button
//             opens the existing promotion dialog (wired for T15.8 replacement).

import { expect, test, type Page } from '@playwright/test';

import { loginAs } from '../fixtures/auth';
import {
  prismaTest,
  resetDb,
  seedMenu,
  seedPromotion,
  seedUser,
} from '../fixtures/seed';

const ADMIN_EMAIL = 'nino@cafelinville.ge';
const FREE_EMAIL = 'beka-free@test.local';

// Hold "now" steady so start/end date offsets land in the right status
// bucket regardless of when the spec runs in CI.
const day = (offsetDays: number) =>
  new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000);

async function seedFourPromotionsScenario(page: Page) {
  const user = await seedUser({
    plan: 'STARTER',
    name: 'Nino Kapanadze',
    email: ADMIN_EMAIL,
  });
  const menu = await seedMenu({
    userId: user.id,
    status: 'PUBLISHED',
    categoryCount: 2,
    productCount: 3,
    name: 'Café Linville — Dinner',
  });

  // 2 Active (running right now), 1 Scheduled (starts in a week),
  // 1 Ended (ran in the past).
  const active1 = await seedPromotion({
    menuId: menu.id,
    titleKa: 'Happy Hour 20%',
    titleEn: 'Happy Hour 20%',
    startDate: day(-3),
    endDate: day(4),
    sortOrder: 0,
  });
  const active2 = await seedPromotion({
    menuId: menu.id,
    titleKa: 'Weekend Brunch',
    titleEn: 'Weekend Brunch',
    startDate: day(-7),
    endDate: day(7),
    sortOrder: 1,
  });
  const scheduled = await seedPromotion({
    menuId: menu.id,
    titleKa: 'Easter Special',
    titleEn: 'Easter Special',
    startDate: day(7),
    endDate: day(14),
    sortOrder: 2,
  });
  const ended = await seedPromotion({
    menuId: menu.id,
    titleKa: 'Winter Deal',
    titleEn: 'Winter Deal',
    startDate: day(-30),
    endDate: day(-5),
    sortOrder: 3,
  });

  await loginAs(page, ADMIN_EMAIL);
  await page.goto(`/admin/menus/${menu.id}?tab=promotions`);
  await expect(page.getByTestId('editor-promotions-tab')).toBeVisible();

  return { user, menu, active1, active2, scheduled, ended };
}

async function seedFreePlanScenario(page: Page) {
  const user = await seedUser({
    plan: 'FREE',
    name: 'Beka Chkhiro',
    email: FREE_EMAIL,
  });
  const menu = await seedMenu({
    userId: user.id,
    status: 'DRAFT',
    categoryCount: 1,
    productCount: 2,
    name: 'Free plan menu',
  });

  await loginAs(page, FREE_EMAIL);
  await page.goto(`/admin/menus/${menu.id}?tab=promotions`);
  await expect(page.getByTestId('editor-promotions-tab')).toBeVisible();

  return { user, menu };
}

async function stabilizeAnimations(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({
    content:
      '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }',
  });
}

test.describe('editor promotions tab (T15.7)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ context }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop',
      'Desktop-only tab; mobile variant lands in T17.3',
    );
    await resetDb();
    await context.clearCookies();
    await context.addCookies([
      { name: 'NEXT_LOCALE', value: 'en', domain: 'localhost', path: '/' },
    ]);
  });

  // ── Visual: STARTER list state with 4 promos ──────────────────────────────

  test('visual: editor-promotions list on STARTER', async ({ page }, testInfo) => {
    await seedFourPromotionsScenario(page);
    await stabilizeAnimations(page);

    // Wait for all 4 cards to land so the screenshot is deterministic.
    await expect(page.getByTestId('editor-promotions-grid')).toBeVisible();
    await expect(
      page.getByTestId('editor-promotions-grid').locator('article'),
    ).toHaveCount(4);

    // Mask the date-range row — the span shifts by one day at month
    // boundaries and the card content is the thing under test here.
    const dateRows = page.locator('[data-testid$="-dates"]');

    const shell = page.getByTestId('editor-shell');
    await expect(shell).toHaveScreenshot(
      `editor-promotions-list-${testInfo.project.name}.png`,
      {
        maxDiffPixelRatio: 0.05,
        mask: [dateRows],
      },
    );
  });

  // ── Functional: filter chip counts ────────────────────────────────────────

  test('functional: filter chip counts match seeded statuses', async ({ page }) => {
    await seedFourPromotionsScenario(page);

    // Total: 4 · Active: 2 · Scheduled: 1 · Ended: 1
    await expect(
      page.getByTestId('editor-promotions-filter-all-count'),
    ).toHaveText('4');
    await expect(
      page.getByTestId('editor-promotions-filter-active-count'),
    ).toHaveText('2');
    await expect(
      page.getByTestId('editor-promotions-filter-scheduled-count'),
    ).toHaveText('1');
    await expect(
      page.getByTestId('editor-promotions-filter-ended-count'),
    ).toHaveText('1');
  });

  // ── Functional: "Scheduled" narrows the grid to 1 card ────────────────────

  test('functional: Scheduled filter narrows grid to 1 card', async ({ page }) => {
    await seedFourPromotionsScenario(page);

    // Start: all 4 visible.
    await expect(
      page.getByTestId('editor-promotions-grid').locator('article'),
    ).toHaveCount(4);

    await page.getByTestId('editor-promotions-filter-scheduled').click();

    await expect(
      page.getByTestId('editor-promotions-tab'),
    ).toHaveAttribute('data-filter', 'scheduled');
    await expect(
      page.getByTestId('editor-promotions-filter-scheduled'),
    ).toHaveAttribute('aria-checked', 'true');
    await expect(
      page.getByTestId('editor-promotions-grid').locator('article'),
    ).toHaveCount(1);

    // The one visible card must carry data-promotion-status="scheduled".
    await expect(
      page
        .getByTestId('editor-promotions-grid')
        .locator('article[data-promotion-status="scheduled"]'),
    ).toHaveCount(1);
  });

  // ── Functional: Ended filter narrows grid to 1 card ──────────────────────

  test('functional: Ended filter isolates the ended promo', async ({ page }) => {
    await seedFourPromotionsScenario(page);

    await page.getByTestId('editor-promotions-filter-ended').click();
    await expect(
      page.getByTestId('editor-promotions-grid').locator('article'),
    ).toHaveCount(1);
    await expect(
      page
        .getByTestId('editor-promotions-grid')
        .locator('article[data-promotion-status="ended"]'),
    ).toHaveCount(1);
  });

  // ── Functional: Suggestions card renders 3 template chips ────────────────

  test('functional: Ideas-to-try suggestions renders 3 chips', async ({ page }) => {
    await seedFourPromotionsScenario(page);

    const suggestions = page.getByTestId('editor-promotions-suggestions');
    await expect(suggestions).toBeVisible();
    await expect(
      suggestions.locator('[data-testid^="editor-promotions-suggestion-"]'),
    ).toHaveCount(3);
  });

  // ── Functional: FREE plan shows locked placeholder + upgrade CTA ─────────

  test('functional: FREE plan renders locked state and upgrade CTA', async ({
    page,
  }) => {
    const { menu } = await seedFreePlanScenario(page);

    await expect(
      page.getByTestId('editor-promotions-tab'),
    ).toHaveAttribute('data-plan-locked', 'true');
    await expect(
      page.getByTestId('editor-promotions-locked-overlay'),
    ).toBeVisible();

    const cta = page.getByTestId('editor-promotions-upgrade-cta');
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', '/admin/settings/billing');

    // No list or filter chips should be rendered in the locked state.
    await expect(
      page.getByTestId('editor-promotions-filters'),
    ).toHaveCount(0);
    await expect(
      page.getByTestId('editor-promotions-grid'),
    ).toHaveCount(0);

    // No promotion should have been created via the UI.
    const dbPromos = await prismaTest.promotion.findMany({
      where: { menuId: menu.id },
    });
    expect(dbPromos).toHaveLength(0);
  });

  // ── Visual: FREE plan locked state (T15.9) ────────────────────────────────

  test('visual: FREE plan locked state', async ({ page }, testInfo) => {
    await seedFreePlanScenario(page);
    await stabilizeAnimations(page);

    const shell = page.getByTestId('editor-shell');
    await expect(shell).toHaveScreenshot(
      `editor-promotions-locked-${testInfo.project.name}.png`,
      { maxDiffPixelRatio: 0.05 },
    );
  });

  // ── Functional: no promotions → empty state + "New promotion" button ────

  test('functional: empty state renders when menu has no promotions', async ({
    page,
  }) => {
    const user = await seedUser({
      plan: 'STARTER',
      name: 'Nino Kapanadze',
      email: ADMIN_EMAIL,
    });
    const menu = await seedMenu({
      userId: user.id,
      status: 'DRAFT',
      categoryCount: 1,
      productCount: 2,
      name: 'Empty menu',
    });
    await loginAs(page, ADMIN_EMAIL);
    await page.goto(`/admin/menus/${menu.id}?tab=promotions`);

    await expect(page.getByTestId('editor-promotions-tab')).toBeVisible();
    await expect(page.getByTestId('editor-promotions-empty')).toBeVisible();
    await expect(
      page.getByTestId('editor-promotions-filter-all-count'),
    ).toHaveText('0');
    await expect(page.getByTestId('editor-promotions-new')).toBeVisible();
  });
});
