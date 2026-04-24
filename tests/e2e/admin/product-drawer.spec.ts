// Test for T14.1 Product Drawer — Sheet Shell + Sticky Header/Footer.
// Run:     pnpm test:e2e tests/e2e/admin/product-drawer.spec.ts
// Update:  pnpm test:e2e:update tests/e2e/admin/product-drawer.spec.ts
//
// Covers:
//   Visual — 540px slide-over with sticky header (thumbnail + title + close X),
//   tab strip (Basics · Variations · Allergens [PRO lock] · Nutrition ·
//   Visibility), scrollable body, and sticky footer (Delete left, Cancel +
//   Save right).
//   Functional — opens from kebab → Edit, Escape closes, outside click
//   closes, tab keyboard navigation works, lock badge visible on STARTER
//   and absent on PRO, footer Cancel button closes, header Close button
//   closes, default active tab is Basics.

import { expect, test, type Page } from '@playwright/test';

import { loginAs } from '../fixtures/auth';
import { resetDb, seedMenu, seedUser } from '../fixtures/seed';

test.describe('product drawer — sheet shell (T14.1)', () => {
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
    plan: 'FREE' | 'STARTER' | 'PRO' = 'STARTER',
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

  // ── Visual ────────────────────────────────────────────────────────────────

  test('visual: edit drawer (STARTER, allergens locked)', async ({ page }, testInfo) => {
    await seedAndOpenEditor(page, 'STARTER');
    await openEditDrawerForFirstProduct(page);

    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({
      content:
        '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }',
    });

    const drawer = page.getByTestId('product-drawer');
    await expect(drawer).toHaveScreenshot(
      `product-drawer-shell-${testInfo.project.name}.png`,
      { maxDiffPixelRatio: 0.05 },
    );
  });

  // ── Functional ────────────────────────────────────────────────────────────

  test('functional: opens from kebab → Edit with edit mode', async ({ page }) => {
    await seedAndOpenEditor(page, 'STARTER');
    await openEditDrawerForFirstProduct(page);

    const drawer = page.getByTestId('product-drawer');
    await expect(drawer).toHaveAttribute('data-mode', 'edit');
    await expect(page.getByTestId('product-drawer-title')).toHaveText(
      'Edit product',
    );
    // Subtitle should include the product name and its category.
    await expect(page.getByTestId('product-drawer-subtitle')).toBeVisible();
  });

  test('functional: structure — sticky header, tab strip, body, sticky footer', async ({
    page,
  }) => {
    await seedAndOpenEditor(page, 'STARTER');
    await openEditDrawerForFirstProduct(page);

    await expect(page.getByTestId('product-drawer-header')).toBeVisible();
    await expect(page.getByTestId('product-drawer-tabs')).toBeVisible();
    await expect(page.getByTestId('product-drawer-body')).toBeVisible();
    await expect(page.getByTestId('product-drawer-footer')).toBeVisible();

    // Footer actions: Cancel + Save (and Delete in edit mode).
    await expect(page.getByTestId('product-drawer-cancel')).toBeVisible();
    await expect(page.getByTestId('product-drawer-save')).toBeVisible();
    await expect(page.getByTestId('product-drawer-delete')).toBeVisible();

    // Default active tab is Basics.
    await expect(page.getByTestId('product-drawer-tab-basics')).toHaveAttribute(
      'data-state',
      'active',
    );
  });

  test('functional: drawer is exactly 540px wide on desktop', async ({ page }) => {
    await seedAndOpenEditor(page, 'STARTER');
    await openEditDrawerForFirstProduct(page);

    const drawer = page.getByTestId('product-drawer');
    const box = await drawer.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBe(540);
  });

  test('functional: Escape key closes the drawer', async ({ page }) => {
    await seedAndOpenEditor(page, 'STARTER');
    await openEditDrawerForFirstProduct(page);

    await page.keyboard.press('Escape');
    await expect(page.getByTestId('product-drawer')).toBeHidden();
  });

  test('functional: outside click (overlay) closes the drawer', async ({ page }) => {
    await seedAndOpenEditor(page, 'STARTER');
    await openEditDrawerForFirstProduct(page);

    // Click the leftmost edge of the viewport — outside the 540px right-side
    // drawer, on the Radix overlay.
    await page.mouse.click(20, 200);
    await expect(page.getByTestId('product-drawer')).toBeHidden();
  });

  test('functional: header Close (X) button closes the drawer', async ({ page }) => {
    await seedAndOpenEditor(page, 'STARTER');
    await openEditDrawerForFirstProduct(page);

    await page.getByTestId('product-drawer-close').click();
    await expect(page.getByTestId('product-drawer')).toBeHidden();
  });

  test('functional: footer Cancel button closes the drawer', async ({ page }) => {
    await seedAndOpenEditor(page, 'STARTER');
    await openEditDrawerForFirstProduct(page);

    await page.getByTestId('product-drawer-cancel').click();
    await expect(page.getByTestId('product-drawer')).toBeHidden();
  });

  test('functional: tab keyboard navigation works (Arrow keys cycle Basics → Variations)', async ({
    page,
  }) => {
    await seedAndOpenEditor(page, 'STARTER');
    await openEditDrawerForFirstProduct(page);

    const basicsTab = page.getByTestId('product-drawer-tab-basics');
    const variationsTab = page.getByTestId('product-drawer-tab-variations');

    await basicsTab.focus();
    await expect(basicsTab).toBeFocused();

    await page.keyboard.press('ArrowRight');
    await expect(variationsTab).toBeFocused();
    await expect(variationsTab).toHaveAttribute('data-state', 'active');

    // Body should now show the Variations placeholder.
    await expect(
      page.getByTestId('product-drawer-placeholder-variations'),
    ).toBeVisible();
  });

  test('functional: STARTER plan shows Allergens lock badge', async ({ page }) => {
    await seedAndOpenEditor(page, 'STARTER');
    await openEditDrawerForFirstProduct(page);

    const allergensTab = page.getByTestId('product-drawer-tab-allergens');
    await expect(allergensTab).toHaveAttribute('data-pro-locked', 'true');
    await expect(
      page.getByTestId('product-drawer-tab-allergens-lock'),
    ).toBeVisible();
  });

  test('functional: PRO plan does NOT show Allergens lock badge', async ({ page }) => {
    await seedAndOpenEditor(page, 'PRO');
    await openEditDrawerForFirstProduct(page);

    const allergensTab = page.getByTestId('product-drawer-tab-allergens');
    await expect(allergensTab).toHaveAttribute('data-pro-locked', 'false');
    await expect(
      page.getByTestId('product-drawer-tab-allergens-lock'),
    ).toHaveCount(0);
  });

  test('functional: New product mode — header shows "Add new product", no Delete in footer, no subtitle', async ({
    page,
  }) => {
    await seedAndOpenEditor(page, 'STARTER');
    await expandFirstCategory(page);

    // Inline "+ Add item to {category}" opens the create-mode drawer.
    await page.getByTestId('products-add-inline').first().click();

    const drawer = page.getByTestId('product-drawer');
    await expect(drawer).toBeVisible();
    await expect(drawer).toHaveAttribute('data-mode', 'create');
    await expect(page.getByTestId('product-drawer-title')).toHaveText(
      'Add new product',
    );
    await expect(page.getByTestId('product-drawer-subtitle')).toHaveCount(0);
    await expect(page.getByTestId('product-drawer-delete')).toHaveCount(0);
  });
});
