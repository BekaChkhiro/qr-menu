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
import bcrypt from 'bcryptjs';

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
    await page.getByTestId('promotion-title-input').fill('Happy Hour');

    // Fill description (KA)
    await page.getByTestId('promotion-description-input').fill(
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
    // Category select should appear — and a category must actually be picked:
    // applyTo=CATEGORY without categoryId is rejected by the schema, which would
    // silently keep the drawer open on Save.
    await expect(page.getByTestId('promotion-category-select')).toBeVisible();
    await page.getByTestId('promotion-category-select').click();
    await page.getByRole('option').first().click();

    // Enable time restrictions
    await page.getByTestId('promotion-time-restrictions-toggle').click();
    await expect(page.getByTestId('promotion-day-windows')).toBeVisible();

    // Enable Monday and Friday, each with its own window (T22.21 per-day)
    await page.getByTestId('promotion-day-toggle-mon').click();
    await page.getByTestId('promotion-day-toggle-fri').click();

    // Set Monday's window with native time inputs (canonical 24h HH:MM).
    await page.getByTestId('promotion-day-start-mon').fill('09:30');
    await expect(page.getByTestId('promotion-day-start-mon')).toHaveValue('09:30');
    await page.getByTestId('promotion-day-end-mon').fill('18:00');
    await expect(page.getByTestId('promotion-day-end-mon')).toHaveValue('18:00');

    // Break start/end use the same native inputs.
    await page.getByTestId('promotion-day-add-break-mon').click();
    await page.getByTestId('promotion-day-break-start-mon').fill('13:00');
    await expect(page.getByTestId('promotion-day-break-start-mon')).toHaveValue('13:00');
    await page.getByTestId('promotion-day-break-end-mon').fill('14:00');
    await expect(page.getByTestId('promotion-day-break-end-mon')).toHaveValue('14:00');

    // Switch to Appearance tab and upload is skipped in test (complex)
    await page.getByTestId('promotion-drawer-tab-appearance').click();
    await expect(page.getByTestId('promotion-drawer-banner-upload')).toBeVisible();

    // Switch to Schedule tab, turn the date range on (off by default) and set dates
    await page.getByTestId('promotion-drawer-tab-schedule').click();
    await page.getByTestId('promotion-date-range-toggle').click();
    await expect(page.getByTestId('promotion-drawer-date-range')).toBeVisible();
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
    const saved = await prismaTest.promotion.findFirst({ where: { menuId: menu.id } });
    await expect(
      page.getByTestId('editor-promotions-card-' + saved!.id + '-title'),
    ).toHaveText('Happy Hour');

    // The typed times are stored as canonical 24h HH:MM.
    const restrictions = saved!.timeRestrictions as {
      windows?: Record<string, { start: string; end: string; breakStart?: string; breakEnd?: string }>;
    };
    expect(restrictions.windows?.mon).toMatchObject({
      start: '09:30',
      end: '18:00',
      breakStart: '13:00',
      breakEnd: '14:00',
    });
  });

  // ── Functional: combo promotion generates an Offers product (T22.24) ──────

  test('functional: saving a combo promotion creates an Offers-category product', async ({
    page,
  }) => {
    const { menu } = await seedStarterScenario(page);

    await page.getByTestId('editor-promotions-new').click();
    await expect(page.getByTestId('promotion-drawer')).toBeVisible();

    await page.getByTestId('promotion-title-input').fill('Lunch Break');
    await page.getByTestId('promotion-type-combo').click();

    // Pick the first two products from the combo picker
    const comboProducts = page.locator('[data-testid^="promotion-combo-product-"]');
    await comboProducts.nth(0).click();
    await comboProducts.nth(1).click();

    await page.getByTestId('promotion-combo-price-input').fill('12');

    // Set the schedule dates (the date range switch must be on first)
    await page.getByTestId('promotion-drawer-tab-schedule').click();
    await page.getByTestId('promotion-date-range-toggle').click();
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
    await expect(page.getByTestId('promotion-title-input')).toHaveValue(
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

    // A promotion that already has dates opens with the date range switch on.
    await page.getByTestId('promotion-drawer-tab-schedule').click();
    await expect(page.getByTestId('promotion-date-range-toggle')).toBeChecked();
    await expect(page.getByTestId('promotion-start-date')).toBeVisible();
  });
});

// ── T1.5 — Date range switch: toggle, save, reopen ──────────────────────────
//
// Additive seeds only (no resetDb / TRUNCATE): the user and menu are created
// here and removed by id in afterAll, so this block runs against any DB the
// other specs in this file cannot reset.

const RUN_ID = `t15-daterange-${Date.now()}`;
const cleanupUserIds: string[] = [];

test.describe('promotion date range switch (T1.5)', () => {
  test.describe.configure({ mode: 'serial' });

  test.afterAll(async () => {
    for (const id of cleanupUserIds) {
      await prismaTest.user.delete({ where: { id } }).catch(() => {});
    }
  });

  test.beforeEach(async ({ context }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'Desktop-only drawer');
    await context.clearCookies();
    await context.addCookies([
      { name: 'NEXT_LOCALE', value: 'en', domain: 'localhost', path: '/' },
    ]);
  });

  test('toggle, save, reopen: the switch and the card show permanent vs dated', async ({
    page,
  }) => {
    const email = `t15-daterange-${RUN_ID}@test.local`;
    const user = await prismaTest.user.create({
      data: {
        email: email.toLowerCase(),
        name: 'Nino Kapanadze',
        plan: 'STARTER',
        password: await bcrypt.hash('password-not-used', 10),
        emailVerified: new Date(),
      },
    });
    cleanupUserIds.push(user.id);
    const menu = await prismaTest.menu.create({
      data: {
        userId: user.id,
        name: 'Café Linville',
        nameKa: 'Café Linville',
        slug: `linville-${RUN_ID}`,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        enabledLanguages: ['KA'],
      },
    });
    const title = 'Date range flow';

    await loginAs(page, email);
    await page.goto(`/admin/menus/${menu.id}?tab=promotions`);
    await expect(page.getByTestId('editor-promotions-tab')).toBeVisible();

    // New promotion: the switch starts off, so there are no date inputs and the
    // status reads "Always on" (the permanent copy).
    await page.getByTestId('editor-promotions-new').click();
    await expect(page.getByTestId('promotion-drawer')).toBeVisible();
    await page.getByTestId('promotion-title-input').fill(title);
    await page.getByTestId('promotion-type-banner').click();
    await page.getByTestId('promotion-drawer-tab-schedule').click();
    await expect(page.getByTestId('promotion-date-range-toggle')).not.toBeChecked();
    await expect(page.getByTestId('promotion-start-date')).toHaveCount(0);
    await expect(page.getByTestId('promotion-date-range-status')).toHaveText('Always on');

    // Toggle on, pick a range, and save.
    await page.getByTestId('promotion-date-range-toggle').click();
    await page.getByTestId('promotion-start-date').fill(day(0).toISOString().split('T')[0]);
    await page.getByTestId('promotion-end-date').fill(day(14).toISOString().split('T')[0]);
    await expect(page.getByTestId('promotion-date-range-status')).toContainText(/\d{4}/);
    await page.getByTestId('promotion-drawer-save').click();
    await expect(page.getByTestId('promotion-drawer')).toHaveCount(0);

    const saved = await prismaTest.promotion.findFirst({ where: { menuId: menu.id, titleKa: title } });
    expect(saved!.startDate).not.toBeNull();
    expect(saved!.endDate).not.toBeNull();
    const card = page.getByTestId(`editor-promotions-card-${saved!.id}`);
    await expect(card.getByTestId(`editor-promotions-card-${saved!.id}-dates`)).toContainText(/\d{4}/);

    // Reopen: the switch is on because the promotion has dates. Turn it off and save.
    await card.getByTestId(`editor-promotions-card-${saved!.id}-kebab`).click();
    await page.getByRole('menuitem', { name: 'Edit' }).click();
    await expect(page.getByTestId('promotion-drawer')).toBeVisible();
    await page.getByTestId('promotion-drawer-tab-schedule').click();
    await expect(page.getByTestId('promotion-date-range-toggle')).toBeChecked();
    await page.getByTestId('promotion-date-range-toggle').click();
    await expect(page.getByTestId('promotion-date-range-status')).toHaveText('Always on');
    await page.getByTestId('promotion-drawer-save').click();
    await expect(page.getByTestId('promotion-drawer')).toHaveCount(0);

    // Stored as open-ended, and the card now reads "Always on".
    const reopened = await prismaTest.promotion.findUnique({ where: { id: saved!.id } });
    expect(reopened!.startDate).toBeNull();
    expect(reopened!.endDate).toBeNull();
    await expect(card.getByTestId(`editor-promotions-card-${saved!.id}-dates`)).toHaveText(
      'Always on',
    );

    // Reopen once more: the switch stays off.
    await card.getByTestId(`editor-promotions-card-${saved!.id}-kebab`).click();
    await page.getByRole('menuitem', { name: 'Edit' }).click();
    await expect(page.getByTestId('promotion-drawer')).toBeVisible();
    await page.getByTestId('promotion-drawer-tab-schedule').click();
    await expect(page.getByTestId('promotion-date-range-toggle')).not.toBeChecked();
    await expect(page.getByTestId('promotion-date-range-status')).toHaveText('Always on');
  });
});
