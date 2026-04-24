// Test for T13.3 Content Tab — Nested Product Rows.
// Run:     pnpm test:e2e tests/e2e/admin/editor-content-products.spec.ts
// Update:  pnpm test:e2e:update tests/e2e/admin/editor-content-products.spec.ts
//
// Covers:
//   Visual — expanded category with nested product rows (thumbnail + name +
//   price + drag handle + kebab) and the inline "+ Add item to {category}"
//   link.
//   Functional — drag reorders products within a category via POST
//   /api/menus/[id]/products/reorder (DB sortOrder reflects the new order);
//   kebab Edit opens the Product dialog; kebab "Move to {target}" fires PUT
//   /api/menus/[id]/products/[pid] with the new categoryId (DB reassigns);
//   kebab Delete → confirm hits DELETE and removes the row.

import { expect, test, type Page } from '@playwright/test';

import { loginAs } from '../fixtures/auth';
import { prismaTest, resetDb, seedMenu, seedUser } from '../fixtures/seed';

test.describe('editor content tab — nested product rows (T13.3)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ context }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop',
      'Desktop-only; mobile variant lands in T17.3',
    );
    await resetDb();
    await context.clearCookies();
    await context.addCookies([
      { name: 'NEXT_LOCALE', value: 'en', domain: 'localhost', path: '/' },
    ]);
  });

  async function seedEditorAndLogin(
    page: Page,
    categoryCount = 3,
    productCount = 3,
  ) {
    const email = 'nino@cafelinville.ge';
    const user = await seedUser({
      plan: 'STARTER',
      name: 'Nino Kapanadze',
      email,
    });
    const menu = await seedMenu({
      userId: user.id,
      status: 'PUBLISHED',
      categoryCount,
      productCount,
      name: 'Café Linville — Dinner',
    });
    await loginAs(page, email);
    return { user, menu };
  }

  async function productsInCategoryByOrder(menuId: string, categoryIndex: number) {
    const categories = await prismaTest.category.findMany({
      where: { menuId },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, nameKa: true },
    });
    const categoryId = categories[categoryIndex]?.id;
    if (!categoryId) throw new Error(`No category at index ${categoryIndex}`);
    return prismaTest.product.findMany({
      where: { categoryId },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, nameKa: true, sortOrder: true, categoryId: true },
    });
  }

  async function expandFirstCategory(page: Page) {
    const firstRow = page.getByTestId('category-row').first();
    const toggle = firstRow.getByTestId('category-row-toggle');
    await toggle.click();
    await expect(firstRow).toHaveAttribute('data-expanded', 'true');
  }

  // ── Visual ────────────────────────────────────────────────────────────────

  test('visual: expanded category with nested product rows', async ({ page }, testInfo) => {
    const { menu } = await seedEditorAndLogin(page, 3, 3);
    await page.goto(`/admin/menus/${menu.id}?tab=content`);
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({
      content:
        '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }',
    });

    await expandFirstCategory(page);
    await expect(page.getByTestId('product-row')).toHaveCount(3);

    const list = page.getByTestId('categories-list');
    await expect(list).toHaveScreenshot(
      `editor-content-products-${testInfo.project.name}.png`,
      { maxDiffPixelRatio: 0.05 },
    );
  });

  // ── Functional ────────────────────────────────────────────────────────────

  test('functional: expanded category renders 3 product rows with name, price, drag handle, kebab', async ({
    page,
  }) => {
    const { menu } = await seedEditorAndLogin(page, 2, 3);
    await page.goto(`/admin/menus/${menu.id}?tab=content`);
    await expandFirstCategory(page);

    const rows = page.getByTestId('product-row');
    await expect(rows).toHaveCount(3);

    const firstRow = rows.first();
    await expect(firstRow.getByTestId('product-name')).toBeVisible();
    await expect(firstRow.getByTestId('product-price')).toBeVisible();
    await expect(firstRow.getByTestId('product-drag-handle')).toBeVisible();
    await expect(firstRow.getByTestId('product-kebab-trigger')).toBeVisible();

    // Inline add button visible and enabled on STARTER.
    const add = page.getByTestId('products-add-inline');
    await expect(add).toBeVisible();
    await expect(add).toHaveAttribute('data-can-add', 'true');
  });

  test('functional: drag product within category persists new sortOrder via /reorder', async ({
    page,
  }) => {
    const { menu } = await seedEditorAndLogin(page, 2, 3);
    await page.goto(`/admin/menus/${menu.id}?tab=content`);
    await expandFirstCategory(page);

    const initial = await productsInCategoryByOrder(menu.id, 0);
    expect(initial).toHaveLength(3);
    const [p1, p2, p3] = initial;

    const rows = page.getByTestId('product-row');
    const sourceHandle = rows.first().getByTestId('product-drag-handle');
    const targetRow = rows.nth(2);

    const reorderResponse = page.waitForResponse(
      (r) =>
        r.url().includes(`/api/menus/${menu.id}/products/reorder`) &&
        r.request().method() === 'POST' &&
        r.ok(),
    );

    // Mouse-driven drag: pick up the first handle and drop it over the third
    // row. We use low-level pointer ops (not dragTo) because @dnd-kit's
    // PointerSensor listens on pointerdown/pointermove/pointerup, which
    // Playwright's mouse APIs faithfully emit.
    const srcBox = (await sourceHandle.boundingBox())!;
    const tgtBox = (await targetRow.boundingBox())!;
    const srcX = srcBox.x + srcBox.width / 2;
    const srcY = srcBox.y + srcBox.height / 2;
    const tgtX = tgtBox.x + tgtBox.width / 2;
    const tgtY = tgtBox.y + tgtBox.height / 2;

    await page.mouse.move(srcX, srcY);
    await page.mouse.down();
    // Multiple small moves help @dnd-kit clear its activationConstraint.
    await page.mouse.move(srcX, srcY + 4, { steps: 3 });
    await page.mouse.move(tgtX, tgtY, { steps: 10 });
    await page.mouse.up();

    await reorderResponse;

    const after = await productsInCategoryByOrder(menu.id, 0);
    expect(after.map((p) => p.id)).toEqual([p2.id, p3.id, p1.id]);
  });

  test('functional: kebab Edit opens the product dialog', async ({ page }) => {
    const { menu } = await seedEditorAndLogin(page, 2, 2);
    await page.goto(`/admin/menus/${menu.id}?tab=content`);
    await expandFirstCategory(page);

    await page.getByTestId('product-row').first().getByTestId('product-kebab-trigger').click();
    await page.getByTestId('product-kebab-edit').click();

    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('functional: kebab Move-to reassigns categoryId via PUT', async ({ page }) => {
    const { menu } = await seedEditorAndLogin(page, 3, 2);
    await page.goto(`/admin/menus/${menu.id}?tab=content`);
    await expandFirstCategory(page);

    const initial = await productsInCategoryByOrder(menu.id, 0);
    const [firstProduct] = initial;

    // Target the second category as the move destination.
    const allCategories = await prismaTest.category.findMany({
      where: { menuId: menu.id },
      orderBy: { sortOrder: 'asc' },
      select: { id: true },
    });
    const targetCategoryId = allCategories[1].id;

    await page
      .getByTestId('product-row')
      .first()
      .getByTestId('product-kebab-trigger')
      .click();

    const moveResponse = page.waitForResponse(
      (r) =>
        r.url().includes(`/api/menus/${menu.id}/products/${firstProduct.id}`) &&
        r.request().method() === 'PUT' &&
        r.ok(),
    );

    await page
      .locator(`[data-testid="product-kebab-move-to"][data-target-category-id="${targetCategoryId}"]`)
      .click();

    await moveResponse;

    const moved = await prismaTest.product.findUnique({
      where: { id: firstProduct.id },
      select: { categoryId: true },
    });
    expect(moved?.categoryId).toBe(targetCategoryId);

    // First category now has 1 product (from original 2).
    const remaining = await productsInCategoryByOrder(menu.id, 0);
    expect(remaining).toHaveLength(1);
  });

  test('functional: kebab Delete → confirm removes the product via DELETE', async ({
    page,
  }) => {
    const { menu } = await seedEditorAndLogin(page, 2, 3);
    await page.goto(`/admin/menus/${menu.id}?tab=content`);
    await expandFirstCategory(page);

    const firstRow = page.getByTestId('product-row').first();
    const targetId = await firstRow.getAttribute('data-product-id');
    expect(targetId).toBeTruthy();

    await firstRow.getByTestId('product-kebab-trigger').click();
    await page.getByTestId('product-kebab-delete').click();

    const deleteResponse = page.waitForResponse(
      (r) =>
        r.url().includes(`/api/menus/${menu.id}/products/${targetId}`) &&
        r.request().method() === 'DELETE' &&
        r.ok(),
    );

    await page.getByTestId('products-delete-confirm').click();
    await deleteResponse;

    await expect(page.getByTestId('product-row')).toHaveCount(2);

    const row = await prismaTest.product.findUnique({ where: { id: targetId! } });
    expect(row).toBeNull();
  });

  test('functional: inline "+ Add item to {category}" opens the product dialog', async ({
    page,
  }) => {
    const { menu } = await seedEditorAndLogin(page, 2, 1);
    await page.goto(`/admin/menus/${menu.id}?tab=content`);
    await expandFirstCategory(page);

    await page.getByTestId('products-add-inline').click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });
});
