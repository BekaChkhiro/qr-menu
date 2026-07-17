// Tests for T15.8 — Promotions Tab · Drawer (Details/Appearance/Schedule).
// Run:     pnpm test:e2e tests/e2e/admin/editor-promotions-drawer.spec.ts
// Update:  pnpm test:e2e:update tests/e2e/admin/editor-promotions-drawer.spec.ts
//
// Covers:
//   Visual   — drawer open on Details tab matching artboard `promo-drawer`.
//   Functional — create promotion with all fields, discount type switching,
//                apply-to category select, time restrictions toggle,
//                edit mode pre-population.

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

const day = (offsetDays: number) =>
  new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000);

async function seedStarterScenario(page: Page) {
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

  await loginAs(page, ADMIN_EMAIL);
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

test.describe('promotion drawer (T15.8)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ context }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop',
      'Desktop-only drawer; mobile variant lands in T17.3',
    );
    await resetDb();
    await context.clearCookies();
    await context.addCookies([
      { name: 'NEXT_LOCALE', value: 'en', domain: 'localhost', path: '/' },
    ]);
  });

  // ── Visual: drawer open on Details tab ────────────────────────────────────

  test('visual: promotion drawer — Details tab', async ({ page }, testInfo) => {
    const { menu } = await seedStarterScenario(page);

    // Click "New promotion" to open the drawer
    await page.getByTestId('editor-promotions-new').click();
    await expect(page.getByTestId('promotion-drawer')).toBeVisible();
    await expect(page.getByTestId('promotion-drawer-tab-details')).toHaveAttribute(
      'data-state',
      'active',
    );

    await stabilizeAnimations(page);

    await expect(page.getByTestId('promotion-drawer')).toHaveScreenshot(
      `editor-promotions-drawer-${testInfo.project.name}.png`,
      { maxDiffPixelRatio: 0.05 },
    );
  });

  // ── Functional: create promotion with all fields ──────────────────────────

  test('functional: create promotion with all fields', async ({ page }) => {
    const { menu } = await seedStarterScenario(page);

    await page.getByTestId('editor-promotions-new').click();
    await expect(page.getByTestId('promotion-drawer')).toBeVisible();

    // Fill title (KA)
    await page.getByTestId('promotion-title-ka-input').fill('Happy Hour');

    // Fill description (KA)
    await page.getByTestId('promotion-description-ka-input').fill(
      'Every evening 18:00–20:00 — cocktails 20% off.',
    );

    // Select promotion type: Percentage (T22.19)
    await page.getByTestId('promotion-type-percentage').click();
    await expect(
      page.getByTestId('promotion-type-percentage'),
    ).toHaveAttribute('data-active', 'true');

    // Enter discount value
    await page.getByTestId('promotion-discount-value-input').fill('20');

    // Apply to: Category
    await page.getByTestId('promotion-apply-to-category').click();
    // Category select should appear
    await expect(page.getByTestId('promotion-category-select')).toBeVisible();

    // Enable time restrictions
    await page.getByTestId('promotion-time-restrictions-toggle').click();
    await expect(page.getByTestId('promotion-day-windows')).toBeVisible();

    // Enable Monday and Friday, each with its own window (T22.21 per-day)
    await page.getByTestId('promotion-day-toggle-mon').click();
    await page.getByTestId('promotion-day-toggle-fri').click();

    // Set Monday's window
    await page.getByTestId('promotion-day-start-mon').fill('18:00');
    await page.getByTestId('promotion-day-end-mon').fill('20:00');

    // Switch to Appearance tab and upload is skipped in test (complex)
    await page.getByTestId('promotion-drawer-tab-appearance').click();
    await expect(page.getByTestId('promotion-drawer-banner-upload')).toBeVisible();

    // Switch to Schedule tab and set dates
    await page.getByTestId('promotion-drawer-tab-schedule').click();
    const startStr = day(0).toISOString().split('T')[0];
    const endStr = day(14).toISOString().split('T')[0];
    await page.getByTestId('promotion-start-date').fill(startStr);
    await page.getByTestId('promotion-end-date').fill(endStr);

    // Save
    await page.getByTestId('promotion-drawer-save').click();

    // Drawer should close
    await expect(page.getByTestId('promotion-drawer')).toHaveCount(0);

    // Promo should appear in the list
    await expect(
      page.getByTestId('editor-promotions-grid').locator('article'),
    ).toHaveCount(1);
    await expect(
      page.getByTestId('editor-promotions-card-' + (await prismaTest.promotion.findFirst({ where: { menuId: menu.id } }))!.id + '-title'),
    ).toHaveText('Happy Hour');
  });

  // ── Functional: combo promotion generates an Offers product (T22.24) ──────

  test('functional: saving a combo promotion creates an Offers-category product', async ({
    page,
  }) => {
    const { menu } = await seedStarterScenario(page);

    await page.getByTestId('editor-promotions-new').click();
    await expect(page.getByTestId('promotion-drawer')).toBeVisible();

    await page.getByTestId('promotion-title-ka-input').fill('Lunch Break');
    await page.getByTestId('promotion-type-combo').click();

    // Pick the first two products from the combo picker
    const comboProducts = page.locator('[data-testid^="promotion-combo-product-"]');
    await comboProducts.nth(0).click();
    await comboProducts.nth(1).click();

    await page.getByTestId('promotion-combo-price-input').fill('12');

    // Set the schedule dates
    await page.getByTestId('promotion-drawer-tab-schedule').click();
    await page.getByTestId('promotion-start-date').fill(day(0).toISOString().split('T')[0]);
    await page.getByTestId('promotion-end-date').fill(day(14).toISOString().split('T')[0]);

    await page.getByTestId('promotion-drawer-save').click();
    await expect(page.getByTestId('promotion-drawer')).toHaveCount(0);

    // The combo materializes an "Offers" category + a product at the combo price.
    const offers = await prismaTest.category.findFirst({
      where: { menuId: menu.id, isSystemOffers: true },
      include: { products: true },
    });
    expect(offers).not.toBeNull();
    expect(offers!.nameKa).toBe('შეთავაზება');
    const combo = offers!.products.find((p) => p.nameKa === 'Lunch Break');
    expect(combo).toBeTruthy();
    expect(Number(combo!.price)).toBe(12);
  });

  // ── Functional: promotion type switching (T22.19) ─────────────────────────

  test('functional: promotion type Percentage/Banner/Combo switches fields', async ({
    page,
  }) => {
    await seedStarterScenario(page);

    await page.getByTestId('editor-promotions-new').click();

    // Percentage → discount value (%) + apply-to both visible
    await page.getByTestId('promotion-type-percentage').click();
    await expect(page.getByTestId('promotion-drawer-discount-value')).toBeVisible();
    await expect(
      page.locator('[data-testid="promotion-drawer-discount-value"] span'),
    ).toHaveText('%');
    await expect(page.getByTestId('promotion-drawer-apply-to')).toBeVisible();

    // Banner → no discount value, no apply-to (pure announcement)
    await page.getByTestId('promotion-type-banner').click();
    await expect(page.getByTestId('promotion-drawer-discount-value')).toHaveCount(0);
    await expect(page.getByTestId('promotion-drawer-apply-to')).toHaveCount(0);

    // Combo → no percentage discount value either
    await page.getByTestId('promotion-type-combo').click();
    await expect(page.getByTestId('promotion-drawer-discount-value')).toHaveCount(0);
  });

  // ── Functional: edit mode pre-populates fields ────────────────────────────

  test('functional: edit mode pre-populates drawer fields', async ({ page }) => {
    const { menu } = await seedStarterScenario(page);

    const promo = await seedPromotion({
      menuId: menu.id,
      titleKa: 'Weekend Brunch',
      titleEn: 'Weekend Brunch',
      startDate: day(-7),
      endDate: day(7),
      discountType: 'PERCENTAGE',
      discountValue: 15,
      applyTo: 'ENTIRE_MENU',
      timeRestrictions: {
        enabled: true,
        days: ['sat', 'sun'],
        startTime: '09:00',
        endTime: '13:00',
      },
    });

    await page.goto(`/admin/menus/${menu.id}?tab=promotions`);
    await expect(page.getByTestId('editor-promotions-grid')).toBeVisible();

    // Open kebab on the promo card and click Edit
    const card = page.getByTestId(`editor-promotions-card-${promo.id}`);
    await card.getByTestId(`editor-promotions-card-${promo.id}-kebab`).click();
    await page.getByRole('menuitem', { name: 'Edit' }).click();

    await expect(page.getByTestId('promotion-drawer')).toBeVisible();
    await expect(page.getByTestId('promotion-drawer-title')).toHaveText(
      'Edit promotion',
    );

    // Verify pre-populated values
    await expect(page.getByTestId('promotion-title-ka-input')).toHaveValue(
      'Weekend Brunch',
    );
    await expect(
      page.getByTestId('promotion-type-percentage'),
    ).toHaveAttribute('data-active', 'true');
    await expect(
      page.getByTestId('promotion-discount-value-input'),
    ).toHaveValue('15');

    // Time restrictions enabled; legacy days+time migrated to per-day windows
    // (T22.21 back-compat via toWindows).
    await expect(page.getByTestId('promotion-time-restrictions-toggle')).toBeChecked();
    await expect(page.getByTestId('promotion-day-toggle-sat')).toHaveAttribute(
      'data-active',
      'true',
    );
    await expect(page.getByTestId('promotion-day-toggle-sun')).toHaveAttribute(
      'data-active',
      'true',
    );
    await expect(page.getByTestId('promotion-day-start-sat')).toHaveValue('09:00');
    await expect(page.getByTestId('promotion-day-end-sat')).toHaveValue('13:00');
  });
});
