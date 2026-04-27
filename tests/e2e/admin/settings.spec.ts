// Test for T16.1 Settings Shell + Left Nav Rail.
// Run:     pnpm test:e2e tests/e2e/admin/settings.spec.ts
// Update:  pnpm test:e2e:update tests/e2e/admin/settings.spec.ts
//
// Covers:
//   Visual — authenticated settings shell on STARTER plan, at /admin/settings/profile
//   (220px nav rail + content area; Team item shows a PRO badge).
//   Functional — /admin/settings redirects to /admin/settings/profile; nav clicks
//   navigate between all 7 tabs and update the active-state attribute; Team PRO
//   badge is shown for non-PRO users and hidden for PRO; the sticky save bar is
//   absent when the form is clean and appears the moment the user dirties the
//   placeholder input.

import { expect, test, type Page } from '@playwright/test';

import { loginAs } from '../fixtures/auth';
import { resetDb, seedMenu, seedUser } from '../fixtures/seed';

const PLACEHOLDER_EMAIL = 'nino@cafelinville.ge';

test.describe('admin settings shell (T16.1)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page, context }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop',
      'Desktop-only shell; mobile settings variant ships with T17.5',
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

  test('visual: settings shell (STARTER, profile tab)', async ({ page }, testInfo) => {
    await seedAndLogin('STARTER', page);
    await page.goto('/admin/settings/profile');

    await expect(page.getByTestId('settings-shell')).toBeVisible();
    await expect(page.getByTestId('settings-nav-rail')).toBeVisible();
    await expect(page.getByTestId('settings-tab-profile')).toBeVisible();

    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({
      content:
        '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }',
    });

    const shell = page.getByTestId('settings-shell');
    await expect(shell).toHaveScreenshot(`settings-shell-${testInfo.project.name}.png`, {
      maxDiffPixelRatio: 0.05,
    });
  });

  // ── Functional ───────────────────────────────────────────────────────────

  test('functional: /admin/settings redirects to /admin/settings/profile', async ({
    page,
  }) => {
    await seedAndLogin('STARTER', page);
    await page.goto('/admin/settings');
    await expect(page).toHaveURL(/\/admin\/settings\/profile$/);
    await expect(page.getByTestId('settings-tab-profile')).toBeVisible();
  });

  test('functional: nav rail renders all 7 tabs grouped into Personal + Business', async ({
    page,
  }) => {
    await seedAndLogin('STARTER', page);
    await page.goto('/admin/settings/profile');

    const rail = page.getByTestId('settings-nav-rail');
    await expect(rail).toBeVisible();

    // Rail width is 220px by design.
    const width = await rail.evaluate((el) => Math.round(el.getBoundingClientRect().width));
    expect(width).toBe(220);

    // All 7 items present.
    for (const key of [
      'profile',
      'notifications',
      'security',
      'language',
      'business-info',
      'billing',
      'team',
    ]) {
      await expect(page.getByTestId(`settings-nav-${key}`)).toBeVisible();
    }

    // Group labels render in English.
    await expect(rail.getByText('Personal', { exact: true })).toBeVisible();
    await expect(rail.getByText('Business', { exact: true })).toBeVisible();

    // Profile is active by default.
    await expect(page.getByTestId('settings-nav-profile')).toHaveAttribute('data-active', 'true');
    await expect(page.getByTestId('settings-nav-profile')).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  test('functional: clicking each nav item navigates and updates active state', async ({
    page,
  }) => {
    await seedAndLogin('STARTER', page);
    await page.goto('/admin/settings/profile');

    const tabs: Array<{ key: string; path: string; testid: string }> = [
      { key: 'notifications', path: '/admin/settings/notifications', testid: 'settings-tab-notifications' },
      { key: 'security', path: '/admin/settings/security', testid: 'settings-tab-security' },
      { key: 'language', path: '/admin/settings/language', testid: 'settings-tab-language' },
      { key: 'business-info', path: '/admin/settings/business-info', testid: 'settings-tab-business-info' },
      { key: 'billing', path: '/admin/settings/billing', testid: 'settings-tab-billing' },
      { key: 'team', path: '/admin/settings/team', testid: 'settings-tab-team' },
      { key: 'profile', path: '/admin/settings/profile', testid: 'settings-tab-profile' },
    ];

    for (const tab of tabs) {
      await page.getByTestId(`settings-nav-${tab.key}`).click();
      await expect(page).toHaveURL(new RegExp(`${tab.path.replace(/\//g, '\\/')}$`));
      await expect(page.getByTestId(tab.testid)).toBeVisible();
      await expect(page.getByTestId(`settings-nav-${tab.key}`)).toHaveAttribute(
        'data-active',
        'true',
      );
    }
  });

  test('functional: Team item shows PRO badge for FREE/STARTER and hides it for PRO', async ({
    page,
  }) => {
    // STARTER → badge visible
    await seedAndLogin('STARTER', page);
    await page.goto('/admin/settings/profile');
    await expect(page.getByTestId('settings-nav-team-pro-badge')).toBeVisible();
    await expect(page.getByTestId('settings-nav-team-pro-badge')).toHaveText('PRO');

    // FREE → badge visible
    await resetDb();
    await seedAndLogin('FREE', page);
    await page.goto('/admin/settings/profile');
    await expect(page.getByTestId('settings-nav-team-pro-badge')).toBeVisible();

    // PRO → badge absent
    await resetDb();
    await seedAndLogin('PRO', page);
    await page.goto('/admin/settings/profile');
    await expect(page.getByTestId('settings-nav-team-pro-badge')).toHaveCount(0);
  });

  test('functional: save bar is hidden when form is clean and appears when dirty', async ({
    page,
  }) => {
    await seedAndLogin('STARTER', page);
    await page.goto('/admin/settings/profile');

    // Clean form → no save bar.
    await expect(page.getByTestId('settings-save-bar')).toHaveCount(0);

    // Dirty the first-name input.
    const input = page.getByTestId('profile-firstName');
    await input.fill('hello');

    // Save bar appears with the unsaved-changes copy.
    const bar = page.getByTestId('settings-save-bar');
    await expect(bar).toBeVisible();
    await expect(bar).toHaveAttribute('data-dirty', 'true');
    await expect(bar.getByText('You have unsaved changes')).toBeVisible();
    await expect(page.getByTestId('settings-save-bar-save')).toBeVisible();
    await expect(page.getByTestId('settings-save-bar-discard')).toBeVisible();

    // Discard → save bar is removed again.
    await page.getByTestId('settings-save-bar-discard').click();
    await expect(page.getByTestId('settings-save-bar')).toHaveCount(0);
  });
});
