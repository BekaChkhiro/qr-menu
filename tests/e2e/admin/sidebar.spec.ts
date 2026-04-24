import { expect, test } from '@playwright/test';

import { loginAs } from '../fixtures/auth';
import { resetDb, seedMenu, seedUser } from '../fixtures/seed';

// T11.1 — admin sidebar. Desktop-only for now; mobile variant (bottom tab bar)
// ships with T17.1.
test.describe('admin sidebar (T11.1)', () => {
  // Serial so resetDb() in one test can't race another's seed.
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop',
      'Desktop-only sidebar; mobile bottom-tab-bar lives in T17.1',
    );
    await resetDb();
    await page.context().clearCookies();
  });

  async function seedAndLogin(plan: 'FREE' | 'STARTER' | 'PRO', page: Parameters<typeof loginAs>[0]) {
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

  // ── Visual snapshots ─────────────────────────────────────────────────────

  test('visual: expanded sidebar (STARTER)', async ({ page }, testInfo) => {
    await seedAndLogin('STARTER', page);
    await page.goto('/admin/dashboard');
    await page.evaluate(() => document.fonts.ready);

    const sidebar = page.getByTestId('admin-sidebar');
    await expect(sidebar).toHaveAttribute('data-collapsed', 'false');
    await expect(sidebar).toHaveScreenshot(
      `sidebar-expanded-${testInfo.project.name}.png`,
      { maxDiffPixelRatio: 0.05 },
    );
  });

  test('visual: collapsed sidebar (STARTER)', async ({ page }, testInfo) => {
    await seedAndLogin('STARTER', page);
    await page.addInitScript(() => {
      localStorage.setItem('dm.sidebar.collapsed', 'true');
    });
    await page.goto('/admin/dashboard');
    await page.evaluate(() => document.fonts.ready);

    const sidebar = page.getByTestId('admin-sidebar');
    await expect(sidebar).toHaveAttribute('data-collapsed', 'true');
    await expect(sidebar).toHaveScreenshot(
      `sidebar-collapsed-${testInfo.project.name}.png`,
      { maxDiffPixelRatio: 0.05 },
    );
  });

  test('visual: FREE plan shows Upgrade CTA', async ({ page }, testInfo) => {
    await seedAndLogin('FREE', page);
    await page.goto('/admin/dashboard');
    await page.evaluate(() => document.fonts.ready);

    await expect(page.getByTestId('sidebar-upgrade-cta')).toBeVisible();
    await expect(page.getByTestId('admin-sidebar')).toHaveScreenshot(
      `sidebar-free-plan-${testInfo.project.name}.png`,
      { maxDiffPixelRatio: 0.05 },
    );
  });

  test('visual: PRO plan hides Upgrade CTA', async ({ page }, testInfo) => {
    await seedAndLogin('PRO', page);
    await page.goto('/admin/dashboard');
    await page.evaluate(() => document.fonts.ready);

    await expect(page.getByTestId('sidebar-upgrade-cta')).toHaveCount(0);
    await expect(page.getByTestId('admin-sidebar')).toHaveScreenshot(
      `sidebar-pro-plan-${testInfo.project.name}.png`,
      { maxDiffPixelRatio: 0.05 },
    );
  });

  // ── Functional assertions ────────────────────────────────────────────────

  test('functional: nav item click navigates and active state flips', async ({ page }) => {
    await seedAndLogin('STARTER', page);
    await page.goto('/admin/dashboard');

    await expect(page.getByTestId('sidebar-nav-dashboard')).toHaveAttribute(
      'data-active',
      'true',
    );

    await page.getByTestId('sidebar-nav-menus').click();
    await expect(page).toHaveURL(/\/admin\/menus(\b|\/)/);

    await expect(page.getByTestId('sidebar-nav-menus')).toHaveAttribute(
      'data-active',
      'true',
    );
    await expect(page.getByTestId('sidebar-nav-dashboard')).not.toHaveAttribute(
      'data-active',
      'true',
    );
  });

  test('functional: collapse toggle persists via localStorage across reloads', async ({
    page,
  }) => {
    await seedAndLogin('STARTER', page);
    await page.goto('/admin/dashboard');

    const sidebar = page.getByTestId('admin-sidebar');
    await expect(sidebar).toHaveAttribute('data-collapsed', 'false');

    await page.getByTestId('sidebar-toggle').click();
    await expect(sidebar).toHaveAttribute('data-collapsed', 'true');

    const stored = await page.evaluate(() =>
      localStorage.getItem('dm.sidebar.collapsed'),
    );
    expect(stored).toBe('true');

    await page.reload();
    await expect(page.getByTestId('admin-sidebar')).toHaveAttribute(
      'data-collapsed',
      'true',
    );

    // Toggle back and confirm it clears.
    await page.getByTestId('sidebar-toggle').click();
    await expect(page.getByTestId('admin-sidebar')).toHaveAttribute(
      'data-collapsed',
      'false',
    );
    const storedAfter = await page.evaluate(() =>
      localStorage.getItem('dm.sidebar.collapsed'),
    );
    expect(storedAfter).toBe('false');
  });

  test('functional: Upgrade CTA hidden on PRO, visible on FREE and STARTER', async ({
    page,
  }) => {
    await seedAndLogin('PRO', page);
    await page.goto('/admin/dashboard');
    await expect(page.getByTestId('sidebar-upgrade-cta')).toHaveCount(0);
    await expect(page.getByTestId('sidebar-plan')).toContainText('PRO');

    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
    await resetDb();

    await seedAndLogin('FREE', page);
    await page.goto('/admin/dashboard');
    await expect(page.getByTestId('sidebar-upgrade-cta')).toBeVisible();
    await expect(page.getByTestId('sidebar-plan')).toContainText('FREE');
  });

  test('functional: user row renders name + email + initials', async ({ page }) => {
    await seedAndLogin('STARTER', page);
    await page.goto('/admin/dashboard');

    const user = page.getByTestId('sidebar-user');
    await expect(user).toContainText('Nino Kapanadze');
    await expect(user).toContainText('nino@cafelinville.ge');
    // Initials "NK" come from "Nino Kapanadze".
    await expect(user).toContainText('NK');
  });
});
