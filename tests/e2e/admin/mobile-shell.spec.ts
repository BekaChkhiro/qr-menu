// Test for T17.1 — Mobile bottom tab bar + responsive admin shell.
// Run:     pnpm test:e2e tests/e2e/admin/mobile-shell.spec.ts
// Update:  pnpm test:e2e:update tests/e2e/admin/mobile-shell.spec.ts
//
// Covers:
//   Visual — authenticated admin shell on mobile (hidden sidebar, bottom tab bar,
//   collapsed top bar).
//   Functional — sidebar hidden on mobile; mobile tab bar visible with 4 tabs;
//   tapping tabs navigates; top bar shows back button + title on nested routes.

import { expect, test } from '@playwright/test';

import { loginAs } from '../fixtures/auth';
import { resetDb, seedMenu, seedUser } from '../fixtures/seed';

test.describe('admin mobile shell (T17.1)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page, context }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'mobile',
      'Mobile-only shell tests; desktop variant lives in shell.spec.ts + sidebar.spec.ts',
    );
    await resetDb();
    await context.clearCookies();
    // Force English so strings match our assertions.
    await context.addCookies([
      { name: 'NEXT_LOCALE', value: 'en', domain: 'localhost', path: '/' },
    ]);
    // Hide TanStack Query devtools button globally so it never intercepts clicks.
    await page.addStyleTag({
      content: '.tsqd-parent-container { display: none !important; }',
    });
  });

  async function seedAndLogin(
    plan: 'FREE' | 'STARTER' | 'PRO',
    page: Parameters<typeof loginAs>[0],
  ) {
    const email = 'nino@cafelinville.ge';
    const user = await seedUser({ plan, name: 'Nino Kapanadze', email });
    await seedMenu({
      userId: user.id,
      status: 'PUBLISHED',
      categoryCount: 2,
      productCount: 3,
    });
    await loginAs(page, email);
    return user;
  }

  // ── Visual ───────────────────────────────────────────────────────────────

  test('visual: admin shell on mobile (STARTER, dashboard)', async (
    { page },
    testInfo,
  ) => {
    await seedAndLogin('STARTER', page);
    await page.goto('/admin/dashboard');
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({
      content:
        '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }',
    });


    const shell = page.getByTestId('admin-shell');
    await expect(shell).toBeVisible();

    // Sidebar must be hidden on mobile.
    await expect(page.getByTestId('admin-sidebar')).toBeHidden();

    // Mobile tab bar must be visible.
    const tabBar = page.getByTestId('admin-mobile-tab-bar');
    await expect(tabBar).toBeVisible();

    // Top bar must be visible.
    await expect(page.getByTestId('admin-topbar')).toBeVisible();

    await expect(shell).toHaveScreenshot(
      `admin-shell-mobile-starter-${testInfo.project.name}.png`,
      { maxDiffPixelRatio: 0.05 },
    );
  });

  // ── Functional ───────────────────────────────────────────────────────────

  test('functional: sidebar hidden, mobile tab bar visible on mobile', async (
    { page },
  ) => {
    await seedAndLogin('STARTER', page);
    await page.goto('/admin/dashboard');

    await expect(page.getByTestId('admin-shell')).toBeVisible();
    await expect(page.getByTestId('admin-sidebar')).toBeHidden();

    const tabBar = page.getByTestId('admin-mobile-tab-bar');
    await expect(tabBar).toBeVisible();

    // Must have exactly 4 tabs.
    const tabs = tabBar.locator('[data-tab-id]');
    await expect(tabs).toHaveCount(4);

    // Verify tab labels and IDs.
    const expectedTabs = [
      { id: 'dashboard', label: 'Dashboard' },
      { id: 'menus', label: 'Menus' },
      { id: 'analytics', label: 'Analytics' },
      { id: 'settings', label: 'Settings' },
    ];
    for (const expected of expectedTabs) {
      const tab = tabBar.locator(`[data-tab-id="${expected.id}"]`);
      await expect(tab).toBeVisible();
      await expect(tab).toContainText(expected.label);
    }
  });

  test('functional: tapping tabs navigates and updates active state', async (
    { page },
  ) => {
    await seedAndLogin('STARTER', page);
    await page.goto('/admin/dashboard');

    const tabBar = page.getByTestId('admin-mobile-tab-bar');

    // Dashboard tab starts active.
    await expect(
      tabBar.locator('[data-tab-id="dashboard"][data-active="true"]'),
    ).toBeVisible();

    // Tap Menus.
    await tabBar.locator('[data-tab-id="menus"]').click();
    await expect(page).toHaveURL(/\/admin\/menus(\b|\/)/);
    await expect(
      tabBar.locator('[data-tab-id="menus"][data-active="true"]'),
    ).toBeVisible();
    await expect(
      tabBar.locator('[data-tab-id="dashboard"][data-active="true"]'),
    ).toHaveCount(0);

    // Tap Settings.
    // The TanStack Query devtools button sits in the bottom-right corner and can
    // overlay the Settings tab. Remove it before clicking.
    await page.evaluate(() =>
      document.querySelector('.tsqd-parent-container')?.remove(),
    );
    await tabBar.locator('[data-tab-id="settings"]').click();
    await expect(page).toHaveURL(/\/admin\/settings(\b|\/)/);
    await expect(
      tabBar.locator('[data-tab-id="settings"][data-active="true"]'),
    ).toBeVisible();
    await expect(
      tabBar.locator('[data-tab-id="menus"][data-active="true"]'),
    ).toHaveCount(0);

    // Tap Analytics (navigates to dashboard).
    await tabBar.locator('[data-tab-id="analytics"]').click();
    await expect(page).toHaveURL(/\/admin\/dashboard/);
    // Dashboard tab is active because Analytics lands on the same page.
    await expect(
      tabBar.locator('[data-tab-id="dashboard"][data-active="true"]'),
    ).toBeVisible();
  });

  test('functional: top bar on mobile shows title, not breadcrumbs', async (
    { page },
  ) => {
    await seedAndLogin('STARTER', page);
    await page.goto('/admin/dashboard');

    // Breadcrumbs must be hidden on mobile.
    await expect(page.getByTestId('topbar-breadcrumbs')).toBeHidden();

    // Current page title must be visible.
    const title = page.getByTestId('topbar-mobile-title');
    await expect(title).toBeVisible();
    await expect(title).toContainText('Dashboard');
  });

  test('functional: nested route shows back button linking to parent', async (
    { page },
  ) => {
    await seedAndLogin('STARTER', page);
    await page.goto('/admin/settings/profile');

    // Back button must be visible on nested routes.
    const backBtn = page.getByTestId('topbar-back');
    await expect(backBtn).toBeVisible();

    // Title shows current page.
    await expect(page.getByTestId('topbar-mobile-title')).toContainText(
      'Profile',
    );

    // Tapping back navigates to parent.
    await backBtn.click();
    await expect(page).toHaveURL(/\/admin\/settings(\b|\/)/);
  });

  test('functional: top-level route hides back button', async ({ page }) => {
    await seedAndLogin('STARTER', page);
    await page.goto('/admin/dashboard');

    // No back button on top-level routes.
    await expect(page.getByTestId('topbar-back')).toHaveCount(0);
    await expect(page.getByTestId('topbar-mobile-title')).toContainText(
      'Dashboard',
    );
  });

  test('functional: main content has bottom padding on mobile for tab bar', async (
    { page },
  ) => {
    await seedAndLogin('STARTER', page);
    await page.goto('/admin/dashboard');

    const main = page.getByTestId('admin-main');
    const styles = await main.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { pb: cs.paddingBottom };
    });

    // pb-24 = 96px on mobile to clear the fixed tab bar.
    expect(styles.pb).toBe('96px');
  });
});
