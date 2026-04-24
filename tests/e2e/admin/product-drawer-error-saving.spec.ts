// Test for T14.6 Product Drawer — Error + Saving States.
// Run:     pnpm test:e2e tests/e2e/admin/product-drawer-error-saving.spec.ts
// Update:  pnpm test:e2e:update tests/e2e/admin/product-drawer-error-saving.spec.ts
//
// Covers:
//   Visual — drawer with "Couldn't save product" banner + drawer with
//   Save button in saving state (spinner + "Saving…").
//   Functional — empty-name submit shows inline error; valid edit submit
//   shows loading state → success toast → drawer closes; failed submit
//   keeps drawer open + shows banner + preserves form state.

import { expect, test, type Page } from '@playwright/test';

import { loginAs } from '../fixtures/auth';
import { resetDb, seedMenu, seedUser } from '../fixtures/seed';

test.describe('product drawer — error + saving states (T14.6)', () => {
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

  async function seedAndOpenEditor(page: Page) {
    const email = 'nino@cafelinville.ge';
    const user = await seedUser({
      plan: 'STARTER',
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

  async function suppressAnimations(page: Page) {
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({
      content:
        '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }',
    });
  }

  // ── Visual baselines ───────────────────────────────────────────────────────

  test('visual: save error banner visible after mocked 500 response', async ({
    page,
  }, testInfo) => {
    const { menu } = await seedAndOpenEditor(page);
    await openEditDrawerForFirstProduct(page);
    await suppressAnimations(page);

    // Intercept the PATCH to the product endpoint with a 500
    await page.route(
      (url) =>
        url.pathname.startsWith(`/api/menus/${menu.id}/products/`) &&
        !url.pathname.endsWith('/variations'),
      async (route) => {
        if (route.request().method() === 'PATCH') {
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              error: {
                code: 'INTERNAL_ERROR',
                message: 'Database write timed out — please retry.',
              },
            }),
          });
          return;
        }
        await route.continue();
      },
    );

    await page.getByTestId('product-drawer-save').click();

    const banner = page.getByTestId('product-drawer-save-error');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText("Couldn't save product");

    const drawer = page.getByTestId('product-drawer');
    await expect(drawer).toHaveScreenshot(
      `product-drawer-error-${testInfo.project.name}.png`,
      { maxDiffPixelRatio: 0.05 },
    );
  });

  test('visual: save button in saving state (in-flight)', async ({
    page,
  }, testInfo) => {
    const { menu } = await seedAndOpenEditor(page);
    await openEditDrawerForFirstProduct(page);
    await suppressAnimations(page);

    // Delay the PATCH so we can screenshot the saving state mid-flight
    await page.route(
      (url) =>
        url.pathname.startsWith(`/api/menus/${menu.id}/products/`) &&
        !url.pathname.endsWith('/variations'),
      async (route) => {
        if (route.request().method() === 'PATCH') {
          await new Promise((r) => setTimeout(r, 1500));
          await route.continue();
          return;
        }
        await route.continue();
      },
    );

    // Fire save without awaiting; the request will sit pending during the delay
    const savePromise = page.getByTestId('product-drawer-save').click();

    const saveBtn = page.getByTestId('product-drawer-save');
    await expect(saveBtn).toHaveAttribute('data-saving', 'true');
    await expect(saveBtn).toContainText('Saving…');

    const drawer = page.getByTestId('product-drawer');
    await expect(drawer).toHaveScreenshot(
      `product-drawer-saving-${testInfo.project.name}.png`,
      { maxDiffPixelRatio: 0.05 },
    );

    await savePromise;
  });

  // ── Functional: empty name submit ──────────────────────────────────────────

  test('functional: submit with empty name shows inline name error', async ({
    page,
  }) => {
    await seedAndOpenEditor(page);
    await openEditDrawerForFirstProduct(page);

    // Clear the name input
    const nameInput = page.getByTestId('product-basics-name-input');
    await nameInput.fill('');

    // Submit
    await page.getByTestId('product-drawer-save').click();

    // Input should gain error-ring styling
    await expect(nameInput).toHaveClass(/ring-danger-soft/);

    // Drawer should remain open (Zod validation blocks submit)
    await expect(page.getByTestId('product-drawer')).toBeVisible();

    // No API call fired — no save-error banner either
    await expect(page.getByTestId('product-drawer-save-error')).toHaveCount(0);
  });

  // ── Functional: valid submit → saving state → success toast → close ───────

  test('functional: valid submit shows saving state then success toast and closes drawer', async ({
    page,
  }) => {
    const { menu } = await seedAndOpenEditor(page);
    await openEditDrawerForFirstProduct(page);

    // Delay the PATCH so we can observe the saving state
    await page.route(
      (url) =>
        url.pathname.startsWith(`/api/menus/${menu.id}/products/`) &&
        !url.pathname.endsWith('/variations'),
      async (route) => {
        if (route.request().method() === 'PATCH') {
          await new Promise((r) => setTimeout(r, 500));
          await route.continue();
          return;
        }
        await route.continue();
      },
    );

    const responsePromise = page.waitForResponse(
      (res) =>
        res.url().includes(`/api/menus/${menu.id}/products/`) &&
        res.request().method() === 'PATCH',
    );

    await page.getByTestId('product-drawer-save').click();

    // Saving state is observable while the request is in-flight
    const saveBtn = page.getByTestId('product-drawer-save');
    await expect(saveBtn).toHaveAttribute('data-saving', 'true');
    await expect(saveBtn).toContainText('Saving…');

    const response = await responsePromise;
    expect(response.status()).toBe(200);

    // Success toast surfaces
    await expect(
      page.getByText('Product updated successfully'),
    ).toBeVisible();

    // Drawer closes
    await expect(page.getByTestId('product-drawer')).toBeHidden();
  });

  // ── Functional: failed submit keeps drawer open + shows banner ────────────

  test('functional: failed submit keeps drawer open and shows error banner with server message', async ({
    page,
  }) => {
    const { menu } = await seedAndOpenEditor(page);
    await openEditDrawerForFirstProduct(page);

    // Intercept the PATCH with a 500 + server-provided message
    await page.route(
      (url) =>
        url.pathname.startsWith(`/api/menus/${menu.id}/products/`) &&
        !url.pathname.endsWith('/variations'),
      async (route) => {
        if (route.request().method() === 'PATCH') {
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              error: {
                code: 'INTERNAL_ERROR',
                message: 'Database write timed out — please retry.',
              },
            }),
          });
          return;
        }
        await route.continue();
      },
    );

    const nameInput = page.getByTestId('product-basics-name-input');
    const valueBeforeSubmit = await nameInput.inputValue();

    await page.getByTestId('product-drawer-save').click();

    // Banner appears with title + the server-supplied message
    const banner = page.getByTestId('product-drawer-save-error');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText("Couldn't save product");
    await expect(banner).toContainText('Database write timed out');

    // Drawer stays open
    await expect(page.getByTestId('product-drawer')).toBeVisible();

    // Save button returned to default state (no longer saving)
    const saveBtn = page.getByTestId('product-drawer-save');
    await expect(saveBtn).toHaveAttribute('data-saving', 'false');

    // Form values preserved
    await expect(nameInput).toHaveValue(valueBeforeSubmit);
  });
});
