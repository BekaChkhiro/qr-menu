// Test for T14.4 Product Drawer — Allergens Tab (PRO unlocked).
// Run:     pnpm test:e2e tests/e2e/admin/product-drawer-allergens.spec.ts
// Update:  pnpm test:e2e:update tests/e2e/admin/product-drawer-allergens.spec.ts
//
// Covers:
//   Visual — Allergens tab (PRO unlocked) with some tiles active.
//   Functional — toggle allergen persists to product.allergens; Gluten-free
//   auto-suggests when no gluten allergen is selected.
//
// STARTER-locked variant is covered in product-drawer-allergens-locked.spec.ts
// (T14.5).

import { expect, test, type Page } from '@playwright/test';

import { loginAs } from '../fixtures/auth';
import { prismaTest, resetDb, seedMenu, seedUser } from '../fixtures/seed';

test.describe('product drawer — allergens tab (T14.4)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ context }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop',
      'Desktop-only; mobile bottom-sheet variant lands in T17.4',
    );
    await resetDb();
    await context.clearCookies();
    await context.addCookies([
      { name: 'NEXT_LOCALE', value: 'en', domain: 'localhost', path: '/' },
    ]);
  });

  async function seedAndOpenEditor(
    page: Page,
    plan: 'FREE' | 'STARTER' | 'PRO' = 'PRO',
  ) {
    const email = 'nino@cafelinville.ge';
    const user = await seedUser({
      plan,
      name: 'Nino Kapanadze',
      email,
    });
    const menu = await seedMenu({
      userId: user.id,
      status: 'PUBLISHED',
      categoryCount: 2,
      productCount: 2,
      name: 'Café Linville — Dinner',
    });
    await loginAs(page, email);
    await page.goto(`/admin/menus/${menu.id}?tab=content`);
    return { user, menu };
  }

  async function expandFirstCategory(page: Page) {
    const firstRow = page.getByTestId('category-row').first();
    await firstRow.getByTestId('category-row-toggle').click();
    await expect(firstRow).toHaveAttribute('data-expanded', 'true');
  }

  async function openEditDrawerForFirstProduct(page: Page) {
    await expandFirstCategory(page);
    await page
      .getByTestId('product-row')
      .first()
      .getByTestId('product-kebab-trigger')
      .click();
    await page.getByTestId('product-kebab-edit').click();
    await expect(page.getByTestId('product-drawer')).toBeVisible();
  }

  async function goToAllergensTab(page: Page) {
    await page.getByTestId('product-drawer-tab-allergens').click();
    await expect(page.getByTestId('product-drawer-tab-allergens')).toHaveAttribute(
      'data-state',
      'active',
    );
  }

  async function suppressAnimations(page: Page) {
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({
      content:
        '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }',
    });
  }

  async function getFirstProductId(menuId: string): Promise<string> {
    const product = await prismaTest.product.findFirst({
      where: { category: { menuId } },
      orderBy: [{ category: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
      select: { id: true },
    });
    if (!product) throw new Error('Seeded product not found');
    return product.id;
  }

  // ── Visual baseline ────────────────────────────────────────────────────────

  test('visual: allergens tab with some tiles active (PRO edit mode)', async ({
    page,
  }, testInfo) => {
    const { menu } = await seedAndOpenEditor(page, 'PRO');

    // Pre-seed a couple of allergens on the first product so the baseline has
    // active + inactive tile states. Vegetarian dietary badge set explicitly.
    const productId = await getFirstProductId(menu.id);
    await prismaTest.product.update({
      where: { id: productId },
      data: {
        allergens: ['GLUTEN', 'DAIRY'],
        isVegetarian: true,
      },
    });

    await openEditDrawerForFirstProduct(page);
    await goToAllergensTab(page);
    await suppressAnimations(page);

    // Wait for tiles to render + reflect pre-seeded state
    await expect(
      page
        .getByTestId('product-drawer-allergens-tile')
        .filter({ hasText: 'Gluten' }),
    ).toHaveAttribute('data-active', 'true');

    const drawer = page.getByTestId('product-drawer');
    await expect(drawer).toHaveScreenshot(
      `product-drawer-allergens-pro-${testInfo.project.name}.png`,
      { maxDiffPixelRatio: 0.05 },
    );
  });

  // ── Functional: toggle allergen persists to product.allergens ──────────────

  test('functional: toggling Gluten on persists to product.allergens', async ({
    page,
  }) => {
    const { menu } = await seedAndOpenEditor(page, 'PRO');
    const productId = await getFirstProductId(menu.id);

    // Product starts with no allergens
    const before = await prismaTest.product.findUnique({
      where: { id: productId },
      select: { allergens: true },
    });
    expect(before?.allergens).toEqual([]);

    await openEditDrawerForFirstProduct(page);
    await goToAllergensTab(page);

    const glutenTile = page
      .getByTestId('product-drawer-allergens-tile')
      .filter({ hasText: 'Gluten' });

    await expect(glutenTile).toHaveAttribute('data-active', 'false');

    const responsePromise = page.waitForResponse(
      (res) =>
        res
          .url()
          .includes(`/api/menus/${menu.id}/products/${productId}`) &&
        res.request().method() === 'PUT' &&
        res.status() === 200,
    );

    await glutenTile.click();
    await responsePromise;

    await expect(glutenTile).toHaveAttribute('data-active', 'true');

    // DB reflects the change
    const after = await prismaTest.product.findUnique({
      where: { id: productId },
      select: { allergens: true },
    });
    expect(after?.allergens).toContain('GLUTEN');
  });

  // ── Functional: Gluten-free auto-suggests when no gluten allergen ──────────

  test('functional: Gluten-free checkbox auto-suggests when no GLUTEN allergen is set', async ({
    page,
  }) => {
    const { menu } = await seedAndOpenEditor(page, 'PRO');
    const productId = await getFirstProductId(menu.id);

    // Seed a non-gluten allergen so tiles have state but GLUTEN is off
    await prismaTest.product.update({
      where: { id: productId },
      data: { allergens: ['DAIRY'], isGlutenFree: false },
    });

    await openEditDrawerForFirstProduct(page);
    await goToAllergensTab(page);

    // Gluten-free label should be visually "suggested" + checked
    const glutenFreeLabel = page
      .getByTestId('product-drawer-allergens-dietary-label')
      .filter({ has: page.locator('[data-dietary="glutenFree"]') })
      .or(
        page.locator(
          '[data-testid="product-drawer-allergens-dietary-label"][data-dietary="glutenFree"]',
        ),
      );

    await expect(glutenFreeLabel).toHaveAttribute('data-checked', 'true');
    await expect(glutenFreeLabel).toHaveAttribute('data-suggested', 'true');

    // When we toggle GLUTEN on, Gluten-free stops being auto-suggested
    const glutenTile = page
      .getByTestId('product-drawer-allergens-tile')
      .filter({ hasText: 'Gluten' });

    const putPromise = page.waitForResponse(
      (res) =>
        res
          .url()
          .includes(`/api/menus/${menu.id}/products/${productId}`) &&
        res.request().method() === 'PUT' &&
        res.status() === 200,
    );
    await glutenTile.click();
    await putPromise;

    await expect(glutenFreeLabel).toHaveAttribute('data-suggested', 'false');
    await expect(glutenFreeLabel).toHaveAttribute('data-checked', 'false');
  });

  // ── Functional: Halal dietary checkbox persists ────────────────────────────

  test('functional: toggling Halal persists to product.isHalal', async ({
    page,
  }) => {
    const { menu } = await seedAndOpenEditor(page, 'PRO');
    const productId = await getFirstProductId(menu.id);

    await openEditDrawerForFirstProduct(page);
    await goToAllergensTab(page);

    const halalLabel = page.locator(
      '[data-testid="product-drawer-allergens-dietary-label"][data-dietary="halal"]',
    );
    await expect(halalLabel).toHaveAttribute('data-checked', 'false');

    const putPromise = page.waitForResponse(
      (res) =>
        res
          .url()
          .includes(`/api/menus/${menu.id}/products/${productId}`) &&
        res.request().method() === 'PUT' &&
        res.status() === 200,
    );
    // Click the checkbox primitive directly — Radix renders it as a button,
    // which isn't an input so clicking the wrapping <label> doesn't reliably
    // forward the click in all browsers.
    await halalLabel
      .getByTestId('product-drawer-allergens-dietary-input')
      .click();
    await putPromise;

    const after = await prismaTest.product.findUnique({
      where: { id: productId },
      select: { isHalal: true },
    });
    expect(after?.isHalal).toBe(true);
    await expect(halalLabel).toHaveAttribute('data-checked', 'true');
  });
});
