// Test for T14.2 Product Drawer — Basics Tab.
// Run:     pnpm test:e2e tests/e2e/admin/product-drawer-basics.spec.ts
// Update:  pnpm test:e2e:update tests/e2e/admin/product-drawer-basics.spec.ts
//
// Covers:
//   Visual — Basics tab in filled/new/error states.
//   Functional — create product with Georgian name, invalid price error,
//   discount toggle, language tabs lock (STARTER) / unlock (PRO),
//   character counter, and tags chip interaction.

import { expect, test, type Page } from '@playwright/test';

import { loginAs } from '../fixtures/auth';
import { resetDb, seedMenu, seedUser } from '../fixtures/seed';

test.describe('product drawer — basics tab (T14.2)', () => {
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

  async function openCreateDrawer(page: Page) {
    await expandFirstCategory(page);
    await page.getByTestId('products-add-inline').first().click();
    await expect(page.getByTestId('product-drawer')).toBeVisible();
  }

  async function suppressAnimations(page: Page) {
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({
      content:
        '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }',
    });
  }

  // ── Visual baselines ───────────────────────────────────────────────────────

  test('visual: basics tab filled (STARTER edit mode)', async ({ page }, testInfo) => {
    await seedAndOpenEditor(page, 'STARTER');
    await openEditDrawerForFirstProduct(page);
    await suppressAnimations(page);

    // Ensure we're on the Basics tab
    await expect(page.getByTestId('product-drawer-tab-basics')).toHaveAttribute(
      'data-state',
      'active',
    );

    const drawer = page.getByTestId('product-drawer');
    await expect(drawer).toHaveScreenshot(
      `product-drawer-basics-filled-${testInfo.project.name}.png`,
      { maxDiffPixelRatio: 0.05 },
    );
  });

  test('visual: basics tab new/empty (create mode)', async ({ page }, testInfo) => {
    await seedAndOpenEditor(page, 'STARTER');
    await openCreateDrawer(page);
    await suppressAnimations(page);

    const drawer = page.getByTestId('product-drawer');
    await expect(drawer).toHaveScreenshot(
      `product-drawer-basics-new-${testInfo.project.name}.png`,
      { maxDiffPixelRatio: 0.05 },
    );
  });

  test('visual: basics tab error state (price cleared + submit)', async ({ page }, testInfo) => {
    await seedAndOpenEditor(page, 'STARTER');
    await openEditDrawerForFirstProduct(page);
    await suppressAnimations(page);

    // Clear the price field
    const priceInput = page.getByTestId('product-basics-price-input');
    await priceInput.fill('');

    // Click Save to trigger validation
    await page.getByTestId('product-drawer-save').click();
    await expect(page.getByTestId('product-basics-price-error')).toBeVisible();

    const drawer = page.getByTestId('product-drawer');
    await expect(drawer).toHaveScreenshot(
      `product-drawer-basics-error-${testInfo.project.name}.png`,
      { maxDiffPixelRatio: 0.05 },
    );
  });

  // ── Functional: create product ─────────────────────────────────────────────

  test('functional: create product with Georgian name fires POST and product appears', async ({
    page,
  }) => {
    const { menu } = await seedAndOpenEditor(page, 'STARTER');
    await openCreateDrawer(page);

    // Fill in Georgian name
    await page.getByTestId('product-basics-name-input').fill('ხაჭაპური აჭარული');

    // Fill in Georgian description
    await page.getByTestId('product-basics-description-textarea').fill('ტრადიციული ქართული კერძი');

    // Category is already pre-selected (defaultCategoryId passed from inline add button)
    // Fill in price
    await page.getByTestId('product-basics-price-input').fill('12.00');

    // Listen for the POST request
    const responsePromise = page.waitForResponse(
      (res) =>
        res.url().includes(`/api/menus/${menu.id}/products`) &&
        res.request().method() === 'POST',
    );

    // Submit
    await page.getByTestId('product-drawer-save').click();

    const response = await responsePromise;
    expect(response.status()).toBe(201);

    // Drawer should close
    await expect(page.getByTestId('product-drawer')).toBeHidden();

    // Expand category again and verify new product row appears
    await expandFirstCategory(page);
    await expect(
      page.getByTestId('products-list-rows').locator('[data-product-name="ხაჭაპური აჭარული"]'),
    ).toBeVisible();
  });

  // ── Functional: invalid price ──────────────────────────────────────────────

  test('functional: invalid price shows error on Price field', async ({ page }) => {
    await seedAndOpenEditor(page, 'STARTER');
    await openEditDrawerForFirstProduct(page);

    // Clear price
    await page.getByTestId('product-basics-price-input').fill('');

    // Submit
    await page.getByTestId('product-drawer-save').click();

    // Error message should appear
    const errorEl = page.getByTestId('product-basics-price-error');
    await expect(errorEl).toBeVisible();
    await expect(errorEl).toContainText('0');

    // Input should have error styling (ring-danger-soft class)
    const priceInput = page.getByTestId('product-basics-price-input');
    await expect(priceInput).toHaveClass(/ring-danger-soft/);
  });

  // ── Functional: discount toggle ─────────────────────────────────────────────

  test('functional: discount toggle reveals row; −25% pill shown for 20 → 15', async ({
    page,
  }) => {
    await seedAndOpenEditor(page, 'STARTER');
    await openEditDrawerForFirstProduct(page);

    // Discount row should initially be hidden
    await expect(page.getByTestId('product-basics-discount-row')).toHaveCount(0);

    // Toggle on
    await page.getByTestId('product-basics-discount-toggle').click();

    // Row revealed
    await expect(page.getByTestId('product-basics-discount-row')).toBeVisible();

    // Enter original price = 20
    await page.getByTestId('product-basics-discount-original').fill('20');

    // Enter sale price = 15
    await page.getByTestId('product-basics-discount-sale').fill('15');

    // Pill shows −25%
    const pill = page.getByTestId('product-basics-discount-pill');
    await expect(pill).toBeVisible();
    await expect(pill).toContainText('25%');
  });

  // ── Functional: language tabs STARTER (locked) ─────────────────────────────

  test('functional: STARTER — EN and RU tabs are locked', async ({ page }) => {
    await seedAndOpenEditor(page, 'STARTER');
    await openEditDrawerForFirstProduct(page);

    // EN tab should be locked
    const enTab = page.getByTestId('product-basics-name-tab-EN');
    await expect(enTab).toHaveAttribute('data-locked', 'true');
    await expect(enTab.locator('svg')).toBeVisible(); // lock icon

    // RU tab should be locked
    const ruTab = page.getByTestId('product-basics-name-tab-RU');
    await expect(ruTab).toHaveAttribute('data-locked', 'true');
    await expect(ruTab.locator('svg')).toBeVisible();

    // KA tab should NOT be locked
    const kaTab = page.getByTestId('product-basics-name-tab-KA');
    await expect(kaTab).toHaveAttribute('data-locked', 'false');
  });

  // ── Functional: language tabs PRO (unlocked) ───────────────────────────────

  test('functional: PRO — EN unlocked; switch preserves KA value', async ({ page }) => {
    await seedAndOpenEditor(page, 'PRO');
    await openEditDrawerForFirstProduct(page);

    // Both EN and RU should be unlocked
    const enTab = page.getByTestId('product-basics-name-tab-EN');
    await expect(enTab).toHaveAttribute('data-locked', 'false');

    const ruTab = page.getByTestId('product-basics-name-tab-RU');
    await expect(ruTab).toHaveAttribute('data-locked', 'false');

    // Note the current KA value
    const kaInput = page.getByTestId('product-basics-name-input');
    const kaValue = await kaInput.inputValue();
    expect(kaValue.length).toBeGreaterThan(0);

    // Switch to EN tab
    await enTab.click();
    await expect(enTab).not.toHaveAttribute('data-locked', 'true');

    // Type an English name
    const nameInput = page.getByTestId('product-basics-name-input');
    await nameInput.fill('Adjarian Khachapuri');

    // Switch back to KA — value should be preserved
    await page.getByTestId('product-basics-name-tab-KA').click();
    await expect(page.getByTestId('product-basics-name-input')).toHaveValue(kaValue);
  });

  // ── Functional: char counter ─────────────────────────────────────────────

  test('functional: description char counter updates as user types', async ({ page }) => {
    await seedAndOpenEditor(page, 'STARTER');
    await openCreateDrawer(page);

    const textarea = page.getByTestId('product-basics-description-textarea');
    const counter = page.getByTestId('product-basics-description-counter');

    // Initially empty
    await expect(counter).toContainText('0 / 500');

    // Type 10 chars
    await textarea.fill('1234567890');
    await expect(counter).toContainText('10 / 500');
  });

  // ── Functional: tags chip interaction ──────────────────────────────────────

  test('functional: clicking Vegan suggest chip activates it; X removes it', async ({
    page,
  }) => {
    await seedAndOpenEditor(page, 'STARTER');
    await openCreateDrawer(page);

    // Vegan chip should start in suggest row (not active)
    const suggestChip = page.getByTestId('product-basics-tag-suggest-vegan');
    await expect(suggestChip).toBeVisible();

    // Active chip should not be present yet
    await expect(page.getByTestId('product-basics-tag-vegan')).toHaveCount(0);

    // Click suggest chip to activate
    await suggestChip.click();

    // Vegan chip should now be in active row
    const activeChip = page.getByTestId('product-basics-tag-vegan');
    await expect(activeChip).toBeVisible();

    // Suggest chip should disappear
    await expect(suggestChip).toHaveCount(0);

    // Click X on active chip to remove
    await activeChip.getByRole('button').click();

    // Back to suggested
    await expect(page.getByTestId('product-basics-tag-vegan')).toHaveCount(0);
    await expect(page.getByTestId('product-basics-tag-suggest-vegan')).toBeVisible();
  });
});
