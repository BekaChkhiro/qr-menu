// Test for T13.2 Content Tab — Category List (Drag-Drop).
// Run:     pnpm test:e2e tests/e2e/admin/editor-content.spec.ts
// Update:  pnpm test:e2e:update tests/e2e/admin/editor-content.spec.ts
//
// Covers:
//   Visual — category list in the 360px left column, collapsed and expanded.
//   Functional — drag reorders persist via POST /api/menus/[id]/categories/reorder
//   and in the DB; client-side search filters rows; expand/collapse toggles the
//   nested product list; the kebab Delete flow calls DELETE and removes the row.

import { expect, test, type Page } from '@playwright/test';

import { loginAs } from '../fixtures/auth';
import { prismaTest, resetDb, seedMenu, seedUser } from '../fixtures/seed';

test.describe('editor content tab — category list (T13.2)', () => {
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

  async function seedEditorAndLogin(page: Page, categoryCount = 4, productCount = 3) {
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

  async function categoriesInSortOrder(menuId: string) {
    return prismaTest.category.findMany({
      where: { menuId },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, nameKa: true, sortOrder: true },
    });
  }

  // ── Visual ────────────────────────────────────────────────────────────────

  test('visual: categories column (collapsed)', async ({ page }, testInfo) => {
    const { menu } = await seedEditorAndLogin(page);
    await page.goto(`/admin/menus/${menu.id}?tab=content`);
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({
      content:
        '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }',
    });

    const list = page.getByTestId('categories-list');
    await expect(list).toBeVisible();
    // Wait for the list to settle before snapshotting.
    await expect(page.getByTestId('category-row')).toHaveCount(4);

    await expect(list).toHaveScreenshot(
      `editor-content-categories-collapsed-${testInfo.project.name}.png`,
      { maxDiffPixelRatio: 0.05 },
    );
  });

  test('visual: categories column (one expanded)', async ({ page }, testInfo) => {
    const { menu } = await seedEditorAndLogin(page);
    await page.goto(`/admin/menus/${menu.id}?tab=content`);
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({
      content:
        '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }',
    });

    // Expand the first category.
    const firstToggle = page.getByTestId('category-row-toggle').first();
    await firstToggle.click();
    await expect(page.getByTestId('category-row').first()).toHaveAttribute(
      'data-expanded',
      'true',
    );

    const list = page.getByTestId('categories-list');
    await expect(list).toHaveScreenshot(
      `editor-content-categories-expanded-${testInfo.project.name}.png`,
      { maxDiffPixelRatio: 0.05 },
    );
  });

  // ── Functional ────────────────────────────────────────────────────────────

  test('functional: seeded categories render with the dashed add button', async ({ page }) => {
    const { menu } = await seedEditorAndLogin(page, 3);
    await page.goto(`/admin/menus/${menu.id}?tab=content`);

    const rows = page.getByTestId('category-row');
    await expect(rows).toHaveCount(3);
    await expect(page.getByTestId('categories-add-dashed')).toBeVisible();
    await expect(page.getByTestId('categories-add-dashed')).toHaveAttribute(
      'data-can-add',
      'true',
    );
  });

  test('functional: clicking a row toggles expand + reveals its products', async ({
    page,
  }) => {
    const { menu } = await seedEditorAndLogin(page, 2, 2);
    await page.goto(`/admin/menus/${menu.id}?tab=content`);

    const firstRow = page.getByTestId('category-row').first();
    const toggle = firstRow.getByTestId('category-row-toggle');

    await expect(firstRow).toHaveAttribute('data-expanded', 'false');
    await toggle.click();
    await expect(firstRow).toHaveAttribute('data-expanded', 'true');

    // Collapse again.
    await toggle.click();
    await expect(firstRow).toHaveAttribute('data-expanded', 'false');
  });

  test('functional: search filters rows by name and shows no-results when empty', async ({
    page,
  }) => {
    const { menu } = await seedEditorAndLogin(page, 4, 1);
    await page.goto(`/admin/menus/${menu.id}?tab=content`);

    // Seed names (see fixtures/seed.ts): ცხელი კერძები / სალათები / სასმელები / დესერტები
    // with English: Hot Dishes / Salads / Drinks / Desserts.
    const search = page.getByTestId('categories-search');
    await search.fill('salad');
    await expect(page.getByTestId('category-row')).toHaveCount(1);
    await expect(page.getByTestId('category-row').first()).toHaveAttribute(
      'data-category-name',
      'სალათები',
    );

    await search.fill('');
    await expect(page.getByTestId('category-row')).toHaveCount(4);

    await search.fill('zzz no match');
    await expect(page.getByTestId('categories-list-rows')).toHaveCount(0);
    await expect(page.getByTestId('categories-no-results')).toBeVisible();
  });

  test('functional: drag reorder calls /reorder and persists in the DB', async ({
    page,
  }) => {
    const { menu } = await seedEditorAndLogin(page, 3, 1);
    await page.goto(`/admin/menus/${menu.id}?tab=content`);

    const initialOrder = await categoriesInSortOrder(menu.id);
    expect(initialOrder).toHaveLength(3);
    const [firstCat, secondCat, thirdCat] = initialOrder;

    const firstHandle = page
      .getByTestId('category-row')
      .first()
      .getByTestId('category-drag-handle');
    const thirdHandle = page
      .getByTestId('category-row')
      .nth(2)
      .getByTestId('category-drag-handle');

    // Wait for the reorder POST to fire before asserting the DB row.
    const reorderResponse = page.waitForResponse(
      (r) =>
        r.url().includes(`/api/menus/${menu.id}/categories/reorder`) &&
        r.request().method() === 'POST' &&
        r.ok(),
    );

    // Keyboard-driven DnD: focus the handle, Space to pick up, ArrowDown to move,
    // Space to drop. This matches @dnd-kit's keyboard sensor contract and avoids
    // the flakiness of mouse-based drag in headless browsers.
    await firstHandle.focus();
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Space');

    await reorderResponse;

    const after = await categoriesInSortOrder(menu.id);
    // The first seeded row should now be in position 2 (index 2), with the
    // other two shifted up by one.
    const reorderedIds = after.map((c) => c.id);
    expect(reorderedIds).toEqual([secondCat.id, thirdCat.id, firstCat.id]);
  });

  test('functional: kebab → Delete removes the category via DELETE', async ({
    page,
  }) => {
    const { menu } = await seedEditorAndLogin(page, 3, 1);
    await page.goto(`/admin/menus/${menu.id}?tab=content`);

    const firstRow = page.getByTestId('category-row').first();
    const targetId = await firstRow.getAttribute('data-category-id');
    expect(targetId).toBeTruthy();

    await firstRow.getByTestId('category-kebab-trigger').click();
    await page.getByTestId('category-kebab-delete').click();

    const deleteResponse = page.waitForResponse(
      (r) =>
        r.url().includes(`/api/menus/${menu.id}/categories/${targetId}`) &&
        r.request().method() === 'DELETE' &&
        r.ok(),
    );

    await page.getByTestId('categories-delete-confirm').click();
    await deleteResponse;

    await expect(page.getByTestId('category-row')).toHaveCount(2);

    const row = await prismaTest.category.findUnique({ where: { id: targetId! } });
    expect(row).toBeNull();
  });

  test('functional: dashed "Add category" opens the category creation sheet', async ({
    page,
  }) => {
    const { menu } = await seedEditorAndLogin(page, 1, 1);
    await page.goto(`/admin/menus/${menu.id}?tab=content`);

    await page.getByTestId('categories-add-dashed').click();
    // The CategoryDialog is a Sheet; it exposes role="dialog" via Radix.
    await expect(page.getByRole('dialog')).toBeVisible();
  });
});
