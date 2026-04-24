// Test for T12.3 — Menus List: Empty State with Templates.
// Run:     pnpm test:e2e tests/e2e/admin/menus-empty.spec.ts
// Update:  pnpm test:e2e:update tests/e2e/admin/menus-empty.spec.ts
//
// Covers:
//   Visual — `menus-empty.png` (desktop, 1440px) showing the illustration,
//            heading, 3 template cards, and Create-from-scratch button.
//   Functional —
//     1. A newly seeded user with 0 menus lands on /admin/menus and sees the
//        empty-state component with 3 template cards.
//     2. Clicking "Café & bakery" POSTs { template: 'cafe-bakery' } to
//        /api/menus, which seeds 3 categories + 4/4/3 products via transaction,
//        and redirects to /admin/menus/[id] (the editor).
//     3. Clicking "Full restaurant" produces 3 categories with preset products
//        matching the template's definition.

import { expect, test } from '@playwright/test';

import { loginAs } from '../fixtures/auth';
import { prismaTest, resetDb, seedUser } from '../fixtures/seed';

const OWNER_EMAIL = 'nino@cafelinville.ge';

test.describe('admin menus list — empty state (T12.3)', () => {
  // Serial because resetDb() in one test must not race another's seed.
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page, context }) => {
    await resetDb();
    await context.clearCookies();
    // Force English so the assertions on button/headline copy are stable.
    await context.addCookies([
      { name: 'NEXT_LOCALE', value: 'en', domain: 'localhost', path: '/' },
    ]);
    await seedUser({ plan: 'STARTER', name: 'Nino Kapanadze', email: OWNER_EMAIL });
    await loginAs(page, OWNER_EMAIL);
  });

  // ── Visual ────────────────────────────────────────────────────────────────

  test('visual: empty state on desktop (1440×900)', async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop',
      'Desktop-only snapshot; the mobile layout is covered by T17.x',
    );

    await page.goto('/admin/menus');
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({
      content:
        '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }',
    });

    const empty = page.getByTestId('menus-empty');
    await expect(empty).toBeVisible();
    await expect(page.getByTestId('menus-empty-templates')).toBeVisible();
    await expect(empty.getByRole('button')).toHaveCount(3);

    await expect(empty).toHaveScreenshot('menus-empty.png', {
      maxDiffPixelRatio: 0.05,
    });
  });

  // ── Functional ────────────────────────────────────────────────────────────

  test('functional: new user with 0 menus sees the empty state + 3 templates', async ({
    page,
  }) => {
    await page.goto('/admin/menus');

    await expect(page.getByTestId('menus-empty')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Create your first menu' }),
    ).toBeVisible();
    await expect(page.getByTestId('menus-empty-template-cafe-bakery')).toBeVisible();
    await expect(
      page.getByTestId('menus-empty-template-full-restaurant'),
    ).toBeVisible();
    await expect(
      page.getByTestId('menus-empty-template-bar-cocktails'),
    ).toBeVisible();
    await expect(page.getByTestId('menus-empty-from-scratch')).toBeVisible();

    // Grid should NOT be rendered while the empty state is up.
    await expect(page.getByTestId('menus-grid')).toHaveCount(0);
  });

  test('functional: "Café & bakery" creates 3 categories + 11 products and navigates to editor', async ({
    page,
  }) => {
    await page.goto('/admin/menus');

    // Click template → navigate once menu is created.
    await page.getByTestId('menus-empty-template-cafe-bakery').click();
    await page.waitForURL(/\/admin\/menus\/[a-zA-Z0-9_-]+(\?.*)?$/, {
      timeout: 10_000,
    });

    const menuId = page.url().match(/\/admin\/menus\/([a-zA-Z0-9_-]+)/)?.[1];
    expect(menuId).toBeTruthy();

    const menu = await prismaTest.menu.findUniqueOrThrow({
      where: { id: menuId! },
      include: {
        categories: {
          orderBy: { sortOrder: 'asc' },
          include: { products: { orderBy: { sortOrder: 'asc' } } },
        },
      },
    });

    // Default generated name/slug.
    expect(menu.name).toBe('Café & bakery');
    expect(menu.slug).toMatch(/^cafe-bakery(-\d+)?$/);

    // 3 categories, in order: Hot drinks → Pastries → Breakfast.
    expect(menu.categories.map((c: { nameEn: string | null }) => c.nameEn)).toEqual([
      'Hot drinks',
      'Pastries',
      'Breakfast',
    ]);

    // 4 + 4 + 3 = 11 products total.
    const totalProducts = menu.categories.reduce(
      (sum: number, c: { products: unknown[] }) => sum + c.products.length,
      0,
    );
    expect(totalProducts).toBe(11);

    // First hot drink is Espresso at 4 GEL.
    const espresso = menu.categories[0].products[0];
    expect(espresso.nameEn).toBe('Espresso');
    expect(Number(espresso.price)).toBe(4);

    // Pastries category contains Adjaruli Khachapuri (real Georgian content).
    const pastries = menu.categories[1];
    expect(
      pastries.products.some((p: { nameKa: string }) => p.nameKa === 'ხაჭაპური აჭარული'),
    ).toBe(true);
  });

  test('functional: "Full restaurant" creates 3 categories with Mains having 5 products', async ({
    page,
  }) => {
    await page.goto('/admin/menus');

    await page.getByTestId('menus-empty-template-full-restaurant').click();
    await page.waitForURL(/\/admin\/menus\/[a-zA-Z0-9_-]+(\?.*)?$/, {
      timeout: 10_000,
    });

    const menuId = page.url().match(/\/admin\/menus\/([a-zA-Z0-9_-]+)/)?.[1];
    const menu = await prismaTest.menu.findUniqueOrThrow({
      where: { id: menuId! },
      include: {
        categories: {
          orderBy: { sortOrder: 'asc' },
          include: { products: true },
        },
      },
    });

    expect(menu.categories).toHaveLength(3);
    const mains = menu.categories.find(
      (c: { nameEn: string | null }) => c.nameEn === 'Mains',
    );
    expect(mains).toBeTruthy();
    expect(mains!.products).toHaveLength(5);
    expect(
      mains!.products.some((p: { nameKa: string }) => p.nameKa === 'ხინკალი'),
    ).toBe(true);
    expect(
      mains!.products.some((p: { nameKa: string }) => p.nameKa === 'ჩაქაფული'),
    ).toBe(true);
  });

  test('functional: "Create from scratch" links to /admin/menus/new', async ({
    page,
  }) => {
    await page.goto('/admin/menus');

    const fromScratch = page.getByTestId('menus-empty-from-scratch');
    await expect(fromScratch).toHaveAttribute('href', '/admin/menus/new');
  });
});
