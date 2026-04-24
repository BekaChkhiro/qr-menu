// Test for T14.3 Product Drawer — Variations Tab.
// Run:     pnpm test:e2e tests/e2e/admin/product-drawer-variations.spec.ts
// Update:  pnpm test:e2e:update tests/e2e/admin/product-drawer-variations.spec.ts
//
// Covers:
//   Visual — variations table with drag-handle column, name, price-modifier
//   (+N/-N₾), default radio, kebab; helper line below; "+ Add variation"
//   dashed CTA.
//   Functional — add a variation (POST + row appears), set default (PATCH
//   with isDefault flipping the flag and demoting any other), drag reorder
//   (POST /variations/reorder persists sortOrder).

import { expect, test, type Page } from '@playwright/test';

import { loginAs } from '../fixtures/auth';
import { prismaTest, resetDb, seedMenu, seedUser } from '../fixtures/seed';

test.describe('product drawer — variations tab (T14.3)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ context }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop',
      'Desktop-only; mobile variant lands in T17.4',
    );
    await resetDb();
    await context.clearCookies();
    await context.addCookies([
      { name: 'NEXT_LOCALE', value: 'en', domain: 'localhost', path: '/' },
    ]);
  });

  async function seedScenario(
    page: Page,
    opts: { variations?: boolean } = {},
  ): Promise<{ menuId: string; productId: string; basePrice: number }> {
    const email = 'nino@cafelinville.ge';
    const user = await seedUser({
      plan: 'STARTER',
      name: 'Nino Kapanadze',
      email,
    });
    const menu = await seedMenu({
      userId: user.id,
      status: 'PUBLISHED',
      categoryCount: 1,
      productCount: 1,
      name: 'Café Linville — Dinner',
    });
    // Find the single seeded product.
    const product = await prismaTest.product.findFirst({
      where: { category: { menuId: menu.id } },
      orderBy: { createdAt: 'asc' },
    });
    if (!product) throw new Error('seed failed: no product found');

    if (opts.variations) {
      // Small (-2), Medium (default, +0), Large (+3). Base is product.price.
      const base = Number(product.price);
      await prismaTest.productVariation.createMany({
        data: [
          {
            productId: product.id,
            nameKa: 'Small',
            price: base - 2,
            isDefault: false,
            sortOrder: 0,
          },
          {
            productId: product.id,
            nameKa: 'Medium',
            price: base,
            isDefault: true,
            sortOrder: 1,
          },
          {
            productId: product.id,
            nameKa: 'Large',
            price: base + 3,
            isDefault: false,
            sortOrder: 2,
          },
        ],
      });
    }

    await loginAs(page, email);
    await page.goto(`/admin/menus/${menu.id}?tab=content`);
    return {
      menuId: menu.id,
      productId: product.id,
      basePrice: Number(product.price),
    };
  }

  async function openEditDrawerForFirstProduct(page: Page) {
    const firstCategory = page.getByTestId('category-row').first();
    await firstCategory.getByTestId('category-row-toggle').click();
    await expect(firstCategory).toHaveAttribute('data-expanded', 'true');
    await page
      .getByTestId('product-row')
      .first()
      .getByTestId('product-kebab-trigger')
      .click();
    await page.getByTestId('product-kebab-edit').click();
    await expect(page.getByTestId('product-drawer')).toBeVisible();
    // Switch to Variations tab.
    await page.getByTestId('product-drawer-tab-variations').click();
    await expect(
      page.getByTestId('product-drawer-variations'),
    ).toBeVisible();
  }

  // ── Visual ────────────────────────────────────────────────────────────────

  test('visual: variations table with 3 rows (STARTER)', async ({ page }, testInfo) => {
    await seedScenario(page, { variations: true });
    await openEditDrawerForFirstProduct(page);

    // Wait for the 3 rows to render.
    await expect(page.getByTestId('product-drawer-variations-row')).toHaveCount(
      3,
    );

    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({
      content:
        '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }',
    });

    const drawer = page.getByTestId('product-drawer');
    await expect(drawer).toHaveScreenshot(
      `product-drawer-variations-${testInfo.project.name}.png`,
      { maxDiffPixelRatio: 0.05 },
    );
  });

  // ── Functional ────────────────────────────────────────────────────────────

  test('functional: add variation → POST creates row in DB and renders in table', async ({
    page,
  }) => {
    const { productId, basePrice } = await seedScenario(page);
    await openEditDrawerForFirstProduct(page);

    // Empty state visible before any variations exist.
    await expect(
      page.getByTestId('product-drawer-variations-empty'),
    ).toBeVisible();

    // Trigger the add form.
    await page.getByTestId('product-drawer-variations-add').click();

    const addRow = page.getByTestId('product-drawer-variations-add-row');
    await expect(addRow).toBeVisible();

    await page.getByTestId('product-drawer-variations-add-name').fill('Medium');
    await page
      .getByTestId('product-drawer-variations-add-modifier')
      .fill('3');

    const [postResponse] = await Promise.all([
      page.waitForResponse(
        (res) =>
          /\/variations(?:\?|$)/.test(res.url()) &&
          res.request().method() === 'POST',
      ),
      page.getByTestId('product-drawer-variations-add-save').click(),
    ]);
    expect(postResponse.ok()).toBe(true);
    const postBody = await postResponse.json();
    expect(postBody.success).toBe(true);
    expect(postBody.data.nameKa).toBe('Medium');
    // Price saved as absolute (base + modifier).
    expect(Number(postBody.data.price)).toBeCloseTo(basePrice + 3, 2);

    // Row appears in the UI.
    await expect(page.getByTestId('product-drawer-variations-row')).toHaveCount(
      1,
    );

    // DB confirms the write landed.
    const rows = await prismaTest.productVariation.findMany({
      where: { productId },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].nameKa).toBe('Medium');
    expect(Number(rows[0].price)).toBeCloseTo(basePrice + 3, 2);
  });

  test('functional: clicking default radio promotes this variation and demotes the previous default', async ({
    page,
  }) => {
    const { productId } = await seedScenario(page, { variations: true });
    await openEditDrawerForFirstProduct(page);

    const rows = page.getByTestId('product-drawer-variations-row');
    await expect(rows).toHaveCount(3);

    // Medium (row index 1) is the seeded default.
    const medium = rows.nth(1);
    await expect(medium).toHaveAttribute('data-is-default', 'true');

    // Promote Large (row index 2) to default.
    const large = rows.nth(2);
    const largeRadio = large.getByTestId(
      'product-drawer-variations-default-radio',
    );

    const [putResponse] = await Promise.all([
      page.waitForResponse(
        (res) =>
          res.url().includes(`/variations/`) &&
          res.request().method() === 'PUT',
      ),
      largeRadio.click(),
    ]);
    expect(putResponse.ok()).toBe(true);
    const putBody = await putResponse.json();
    expect(putBody.data.isDefault).toBe(true);

    // DB: exactly one default, and it is Large.
    const defaults = await prismaTest.productVariation.findMany({
      where: { productId, isDefault: true },
    });
    expect(defaults).toHaveLength(1);
    expect(defaults[0].nameKa).toBe('Large');

    // UI reflects the flip.
    await expect(large).toHaveAttribute('data-is-default', 'true');
    await expect(medium).toHaveAttribute('data-is-default', 'false');
  });

  test('functional: drag reorder persists sortOrder via POST /variations/reorder', async ({
    page,
  }) => {
    const { productId } = await seedScenario(page, { variations: true });
    await openEditDrawerForFirstProduct(page);

    const rows = page.getByTestId('product-drawer-variations-row');
    await expect(rows).toHaveCount(3);

    // Baseline order: Small (0), Medium (1), Large (2).
    const initial = await prismaTest.productVariation.findMany({
      where: { productId },
      orderBy: { sortOrder: 'asc' },
      select: { nameKa: true },
    });
    expect(initial.map((v) => v.nameKa)).toEqual(['Small', 'Medium', 'Large']);

    const smallHandle = rows
      .nth(0)
      .getByTestId('product-drawer-variations-drag-handle');
    const largeHandle = rows
      .nth(2)
      .getByTestId('product-drawer-variations-drag-handle');

    // Drag Small past Large using pointer steps (dnd-kit needs movement).
    const sBox = await smallHandle.boundingBox();
    const lBox = await largeHandle.boundingBox();
    if (!sBox || !lBox) throw new Error('handles not measurable');

    const [reorderResponse] = await Promise.all([
      page.waitForResponse(
        (res) =>
          res.url().includes('/variations/reorder') &&
          res.request().method() === 'POST',
      ),
      (async () => {
        await page.mouse.move(
          sBox.x + sBox.width / 2,
          sBox.y + sBox.height / 2,
        );
        await page.mouse.down();
        // Small nudge to trigger PointerSensor activation (distance: 8).
        await page.mouse.move(
          sBox.x + sBox.width / 2 + 10,
          sBox.y + sBox.height / 2,
          { steps: 4 },
        );
        await page.mouse.move(
          lBox.x + lBox.width / 2,
          lBox.y + lBox.height / 2 + 4,
          { steps: 10 },
        );
        await page.mouse.up();
      })(),
    ]);
    expect(reorderResponse.ok()).toBe(true);

    // DB: Small is now at sortOrder 2 (moved to the end).
    const after = await prismaTest.productVariation.findMany({
      where: { productId },
      orderBy: { sortOrder: 'asc' },
      select: { nameKa: true },
    });
    expect(after.map((v) => v.nameKa)).toEqual(['Medium', 'Large', 'Small']);
  });

  test('functional: helper text references the base price', async ({
    page,
  }) => {
    const { basePrice } = await seedScenario(page);
    await openEditDrawerForFirstProduct(page);

    const helper = page.getByTestId('product-drawer-variations-helper');
    await expect(helper).toBeVisible();
    await expect(helper).toContainText(basePrice.toFixed(2));
    await expect(helper).toContainText('₾');
  });
});
