// Test for T14.5 Product Drawer — Allergens Tab (STARTER locked).
// Run:     pnpm test:e2e tests/e2e/admin/product-drawer-allergens-locked.spec.ts
// Update:  pnpm test:e2e:update tests/e2e/admin/product-drawer-allergens-locked.spec.ts
//
// Covers the artboard `pd-allergens-locked` from
// `qr-menu-design/components/product-drawer.jsx` lines 543–579.
//
//   Visual — blurred 6-tile preview behind a centered 340px upgrade card with
//            lock icon, title, body, and primary "Upgrade to PRO" CTA.
//   Functional — STARTER user sees the PRO lock marker on the tab, cannot
//                interact with the tiles behind the overlay, and the Upgrade
//                CTA navigates to /admin/settings/billing.

import { expect, test, type Page } from '@playwright/test';

import { loginAs } from '../fixtures/auth';
import { resetDb, seedMenu, seedUser } from '../fixtures/seed';

test.describe('product drawer — allergens locked (T14.5)', () => {
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
    const user = await seedUser({ plan, name: 'Nino Kapanadze', email });
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

  // ── Visual baseline ────────────────────────────────────────────────────────

  test('visual: STARTER user sees blurred preview + centered upgrade overlay', async ({
    page,
  }, testInfo) => {
    await seedAndOpenEditor(page, 'STARTER');
    await openEditDrawerForFirstProduct(page);
    await goToAllergensTab(page);
    await suppressAnimations(page);

    const overlay = page.getByTestId('product-drawer-allergens-locked-overlay');
    await expect(overlay).toBeVisible();

    const drawer = page.getByTestId('product-drawer');
    await expect(drawer).toHaveScreenshot(
      `product-drawer-allergens-locked-${testInfo.project.name}.png`,
      { maxDiffPixelRatio: 0.05 },
    );
  });

  // ── Functional: STARTER user sees PRO lock marker on tab ───────────────────

  test('functional: STARTER tab shows PRO lock marker and no interactive tiles', async ({
    page,
  }) => {
    await seedAndOpenEditor(page, 'STARTER');
    await openEditDrawerForFirstProduct(page);

    const tab = page.getByTestId('product-drawer-tab-allergens');
    await expect(tab).toHaveAttribute('data-pro-locked', 'true');
    await expect(page.getByTestId('product-drawer-tab-allergens-lock')).toBeVisible();

    await goToAllergensTab(page);

    // Locked overlay visible, interactive tiles absent.
    const locked = page.getByTestId('product-drawer-allergens-locked');
    await expect(locked).toBeVisible();
    await expect(
      page.getByTestId('product-drawer-allergens-locked-overlay'),
    ).toBeVisible();
    await expect(page.getByTestId('product-drawer-allergens-tiles')).toHaveCount(0);
    await expect(page.getByTestId('product-drawer-allergens-tile')).toHaveCount(0);
  });

  // ── Functional: blurred preview is non-interactive ─────────────────────────

  test('functional: blurred preview is non-interactive (pointer-events none, aria-hidden)', async ({
    page,
  }) => {
    await seedAndOpenEditor(page, 'STARTER');
    await openEditDrawerForFirstProduct(page);
    await goToAllergensTab(page);

    const preview = page.getByTestId('product-drawer-allergens-locked-preview');
    await expect(preview).toBeVisible();
    await expect(preview).toHaveAttribute('aria-hidden', 'true');

    // pointer-events: none — attempting to click the preview should not trigger
    // a product PUT request. We fail the test if any /products/:pid PUT fires.
    let sawMutation = false;
    page.on('request', (req) => {
      if (
        req.method() === 'PUT' &&
        /\/api\/menus\/[^/]+\/products\/[^/]+/.test(req.url())
      ) {
        sawMutation = true;
      }
    });

    // Force-click at the center of the preview — force bypasses actionability
    // checks so we can verify the `pointer-events: none` CSS truly lets the
    // click pass through without triggering a mutation.
    await preview.click({ force: true, position: { x: 20, y: 20 } });
    await page.waitForTimeout(400);
    expect(sawMutation).toBe(false);
  });

  // ── Functional: CTA navigates to /admin/settings/billing ───────────────────

  test('functional: Upgrade to PRO CTA navigates to /admin/settings/billing', async ({
    page,
  }) => {
    await seedAndOpenEditor(page, 'STARTER');
    await openEditDrawerForFirstProduct(page);
    await goToAllergensTab(page);

    const cta = page.getByTestId('product-drawer-allergens-locked-cta');
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', '/admin/settings/billing');

    await cta.click();
    await expect(page).toHaveURL(/\/admin\/settings\/billing(\b|\?|$)/);
  });

  // ── Functional: FREE plan also sees the locked state ───────────────────────

  test('functional: FREE plan also shows the locked overlay (allergens is PRO-only)', async ({
    page,
  }) => {
    await seedAndOpenEditor(page, 'FREE');
    await openEditDrawerForFirstProduct(page);
    await goToAllergensTab(page);

    await expect(page.getByTestId('product-drawer-allergens-locked')).toBeVisible();
    await expect(
      page.getByTestId('product-drawer-allergens-locked-overlay'),
    ).toBeVisible();
    await expect(page.getByTestId('product-drawer-allergens-tiles')).toHaveCount(0);
  });
});
