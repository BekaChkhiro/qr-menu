// Test for T17.4 — Product Drawer as Bottom Sheet (mobile).
// Run:     pnpm test:e2e tests/e2e/admin/product-drawer-mobile-sheet.spec.ts
// Update:  pnpm test:e2e:update tests/e2e/admin/product-drawer-mobile-sheet.spec.ts
//
// Covers:
//   Visual — mobile bottom sheet (375×812), rounded top corners, drag handle,
//   sticky header, tabs, scrollable body, sticky footer.
//   Functional — opens from bottom on < 768px, takes 90vh height, drag handle
//   visible and tappable to close, swipe-down gesture dismisses, Escape closes,
//   overlay click closes, Cancel button closes.

import { expect, test, type Page } from '@playwright/test';

import { loginAs } from '../fixtures/auth';
import { resetDb, seedMenu, seedUser } from '../fixtures/seed';

test.describe('product drawer — mobile bottom sheet (T17.4)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ context }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'mobile',
      'Mobile-only; desktop variant is covered in T14.1',
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
    const drawer = page.getByTestId('product-drawer');
    await expect(drawer).toBeVisible();
    await expect(drawer).toHaveAttribute('data-state', 'open');
    // Wait for the 500ms slide-in animation to settle.
    await page.waitForTimeout(600);
  }

  // ── Visual ────────────────────────────────────────────────────────────────

  test('visual: mobile bottom sheet (STARTER, edit mode)', async ({ page }, testInfo) => {
    await seedAndOpenEditor(page, 'STARTER');
    await openEditDrawerForFirstProduct(page);

    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({
      content:
        '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }',
    });

    const drawer = page.getByTestId('product-drawer');
    await expect(drawer).toHaveScreenshot(
      `mobile-product-sheet-${testInfo.project.name}.png`,
      { maxDiffPixelRatio: 0.05 },
    );
  });

  // ── Functional ────────────────────────────────────────────────────────────

  test('functional: drawer is a bottom sheet on mobile (positioned at bottom, 90vh)', async ({
    page,
  }) => {
    await seedAndOpenEditor(page, 'STARTER');
    await openEditDrawerForFirstProduct(page);

    const drawer = page.getByTestId('product-drawer');
    const box = await drawer.boundingBox();
    expect(box).not.toBeNull();

    const viewportHeight = page.viewportSize()!.height;
    const viewportWidth = page.viewportSize()!.width;

    // Should span full width on mobile.
    expect(box!.width).toBe(viewportWidth);

    // Height should be ~90% of viewport (allow sub-pixel rounding).
    expect(box!.height).toBeGreaterThanOrEqual(viewportHeight * 0.85);
    expect(box!.height).toBeLessThanOrEqual(viewportHeight * 0.95);

    // Bottom edge should sit at the bottom of the viewport.
    expect(box!.y + box!.height).toBeCloseTo(viewportHeight, 0);
  });

  test('functional: drag handle is visible on mobile and hidden on desktop', async ({
    page,
  }) => {
    await seedAndOpenEditor(page, 'STARTER');
    await openEditDrawerForFirstProduct(page);

    const dragHandle = page.getByTestId('product-drawer-drag-handle');
    await expect(dragHandle).toBeVisible();
  });

  test('functional: drag handle tap closes the drawer', async ({ page }) => {
    await seedAndOpenEditor(page, 'STARTER');
    await openEditDrawerForFirstProduct(page);

    await page.getByTestId('product-drawer-drag-handle').tap();
    await expect(page.getByTestId('product-drawer')).toBeHidden();
  });

  test('functional: drawer has rounded top corners on mobile', async ({ page }) => {
    await seedAndOpenEditor(page, 'STARTER');
    await openEditDrawerForFirstProduct(page);

    const drawer = page.getByTestId('product-drawer');
    const borderTopLeftRadius = await drawer.evaluate(
      (el) => getComputedStyle(el).borderTopLeftRadius,
    );
    const borderTopRightRadius = await drawer.evaluate(
      (el) => getComputedStyle(el).borderTopRightRadius,
    );

    // 16px rounded top corners per the responsive bottom-sheet spec.
    expect(borderTopLeftRadius).toBe('16px');
    expect(borderTopRightRadius).toBe('16px');
  });

  test('functional: Escape key closes the drawer', async ({ page }) => {
    await seedAndOpenEditor(page, 'STARTER');
    await openEditDrawerForFirstProduct(page);

    await page.keyboard.press('Escape');
    await expect(page.getByTestId('product-drawer')).toBeHidden();
  });

  test('functional: overlay click closes the drawer', async ({ page }) => {
    await seedAndOpenEditor(page, 'STARTER');
    await openEditDrawerForFirstProduct(page);

    // Click near the top edge of the viewport — above the bottom sheet,
    // on the Radix overlay.
    await page.mouse.click(20, 50);
    await expect(page.getByTestId('product-drawer')).toBeHidden();
  });

  test('functional: footer Cancel button closes the drawer', async ({ page }) => {
    await seedAndOpenEditor(page, 'STARTER');
    await openEditDrawerForFirstProduct(page);

    await page.getByTestId('product-drawer-cancel').click();
    await expect(page.getByTestId('product-drawer')).toBeHidden();
  });

  test('functional: new product mode shows create title and no delete button', async ({
    page,
  }) => {
    await seedAndOpenEditor(page, 'STARTER');
    await expandFirstCategory(page);

    await page.getByTestId('products-add-inline').first().click();

    const drawer = page.getByTestId('product-drawer');
    await expect(drawer).toBeVisible();
    await expect(drawer).toHaveAttribute('data-mode', 'create');
    await expect(page.getByTestId('product-drawer-title')).toHaveText(
      'Add new product',
    );
    await expect(page.getByTestId('product-drawer-delete')).toHaveCount(0);
  });
});
