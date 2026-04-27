// Test for T16.4 Plan & Billing Tab (Display Only).
// Run:     pnpm test:e2e tests/e2e/admin/settings-billing.spec.ts
// Update:  pnpm test:e2e:update tests/e2e/admin/settings-billing.spec.ts
//
// Covers:
//   Visual — authenticated billing tab on STARTER plan.
//   Functional — current plan summary renders correct plan + usage;
//   PlanUsageStrip (T11.4 reuse) is visible;
//   plan comparison grid highlights current plan and shows correct badges/buttons;
//   upgrade/manage buttons trigger contact toast;
//   payment method card shows dashed-border empty state.

import { expect, test, type Page } from '@playwright/test';

import { loginAs } from '../fixtures/auth';
import { resetDb, seedMenu, seedUser } from '../fixtures/seed';

const PLACEHOLDER_EMAIL = 'nino@cafelinville.ge';

test.describe('admin settings billing tab (T16.4)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page, context }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop',
      'Desktop-only settings; mobile variant ships with T17.x',
    );
    await resetDb();
    await context.clearCookies();
    await context.addCookies([
      { name: 'NEXT_LOCALE', value: 'en', domain: 'localhost', path: '/' },
    ]);
  });

  async function seedAndLogin(plan: 'FREE' | 'STARTER' | 'PRO', page: Page) {
    const user = await seedUser({ plan, name: 'Nino Kapanadze', email: PLACEHOLDER_EMAIL });
    await seedMenu({
      userId: user.id,
      status: 'PUBLISHED',
      categoryCount: 2,
      productCount: 3,
    });
    await loginAs(page, PLACEHOLDER_EMAIL);
    return user;
  }

  // ── Visual ───────────────────────────────────────────────────────────────

  test('visual: billing tab (STARTER)', async ({ page }, testInfo) => {
    await seedAndLogin('STARTER', page);
    await page.goto('/admin/settings/billing');

    await expect(page.getByTestId('settings-tab-billing')).toBeVisible();

    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({
      content:
        '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }',
    });

    const shell = page.getByTestId('settings-shell');
    await expect(shell).toHaveScreenshot(`settings-billing-${testInfo.project.name}.png`, {
      maxDiffPixelRatio: 0.05,
    });
  });

  // ── Functional ───────────────────────────────────────────────────────────

  test('functional: current plan summary shows correct plan and data', async ({
    page,
  }) => {
    await seedAndLogin('STARTER', page);
    await page.goto('/admin/settings/billing');

    const summary = page.getByTestId('billing-current-plan-summary');
    await expect(summary).toBeVisible();
    await expect(summary).toHaveAttribute('data-current-plan', 'STARTER');

    // Plan name and price
    await expect(summary.getByText(/Starter · 29₾/)).toBeVisible();

    // Usage line: 1 of 3 menus (seed created 1 menu), 6 items (2 categories × 3 products)
    await expect(summary.getByText(/1 of 3 menus/)).toBeVisible();
    await expect(summary.getByText(/6 items/)).toBeVisible();
    await expect(summary.getByText(/Next invoice/)).toBeVisible();
  });

  test('functional: PlanUsageStrip is rendered with correct data', async ({ page }) => {
    await seedAndLogin('STARTER', page);
    await page.goto('/admin/settings/billing');

    const strip = page.getByTestId('plan-usage-strip');
    await expect(strip).toBeVisible();
    await expect(strip).toHaveAttribute('data-plan', 'STARTER');

    // Menus card
    const menusCard = page.getByTestId('usage-card-menus');
    await expect(menusCard).toBeVisible();
    await expect(menusCard).toHaveAttribute('data-unlimited', undefined);
  });

  test('functional: plan cards highlight current plan and show correct badges', async ({
    page,
  }) => {
    await seedAndLogin('STARTER', page);
    await page.goto('/admin/settings/billing');

    // FREE card — not current, no badge
    const freeCard = page.getByTestId('billing-plan-card-free');
    await expect(freeCard).toBeVisible();
    await expect(freeCard).toHaveAttribute('data-current', 'false');
    await expect(freeCard.getByText('0₾')).toBeVisible();

    // STARTER card — current, has badge
    const starterCard = page.getByTestId('billing-plan-card-starter');
    await expect(starterCard).toBeVisible();
    await expect(starterCard).toHaveAttribute('data-current', 'true');
    await expect(starterCard.getByText('CURRENT')).toBeVisible();
    await expect(starterCard.getByText('29₾')).toBeVisible();
    await expect(starterCard.getByTestId('billing-plan-manage')).toBeVisible();

    // PRO card — not current
    const proCard = page.getByTestId('billing-plan-card-pro');
    await expect(proCard).toBeVisible();
    await expect(proCard).toHaveAttribute('data-current', 'false');
    await expect(proCard.getByText('59₾')).toBeVisible();
    await expect(proCard.getByTestId('billing-plan-cta-pro')).toBeVisible();
  });

  test('functional: upgrade buttons trigger contact toast', async ({ page }) => {
    await seedAndLogin('STARTER', page);
    await page.goto('/admin/settings/billing');

    // Click Manage on current plan
    await page.getByTestId('billing-plan-manage').click();
    await expect(page.getByText('hello@cafelinville.ge')).toBeVisible();

    // Dismiss toast
    await page.keyboard.press('Escape');

    // Click Upgrade to Pro
    await page.getByTestId('billing-plan-cta-pro').click();
    await expect(page.getByText('hello@cafelinville.ge')).toBeVisible();
  });

  test('functional: payment method card shows empty state with dashed border', async ({
    page,
  }) => {
    await seedAndLogin('STARTER', page);
    await page.goto('/admin/settings/billing');

    const paymentCard = page.getByTestId('billing-payment-method');
    await expect(paymentCard).toBeVisible();

    // Dashed border style
    await expect(paymentCard).toHaveClass(/border-dashed/);

    // Copy
    await expect(paymentCard.getByText('No payment method on file')).toBeVisible();

    // Add card button is disabled
    const addCardBtn = page.getByTestId('billing-add-card');
    await expect(addCardBtn).toBeVisible();
    await expect(addCardBtn).toBeDisabled();
  });

  test('functional: FREE plan shows correct summary and cards', async ({ page }) => {
    await seedAndLogin('FREE', page);
    await page.goto('/admin/settings/billing');

    const summary = page.getByTestId('billing-current-plan-summary');
    await expect(summary).toHaveAttribute('data-current-plan', 'FREE');
    await expect(summary.getByText(/Free · 0₾/)).toBeVisible();
    await expect(summary.getByText(/1 of 1 menus/)).toBeVisible();

    const freeCard = page.getByTestId('billing-plan-card-free');
    await expect(freeCard).toHaveAttribute('data-current', 'true');
  });

  test('functional: PRO plan shows correct summary and cards', async ({ page }) => {
    await seedAndLogin('PRO', page);
    await page.goto('/admin/settings/billing');

    const summary = page.getByTestId('billing-current-plan-summary');
    await expect(summary).toHaveAttribute('data-current-plan', 'PRO');
    await expect(summary.getByText(/Pro · 59₾/)).toBeVisible();
    await expect(summary.getByText(/1 menus · unlimited/)).toBeVisible();

    const proCard = page.getByTestId('billing-plan-card-pro');
    await expect(proCard).toHaveAttribute('data-current', 'true');
  });
});
