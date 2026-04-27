// Test for T17.5: Settings Mobile (accordion).
// Run:     pnpm test:e2e tests/e2e/admin/settings-mobile.spec.ts
// Update:  pnpm test:e2e:update tests/e2e/admin/settings-mobile.spec.ts
//
// Covers:
//   Visual — authenticated settings shell on mobile viewport at /admin/settings/profile
//   (accordion nav at top + content area + mobile tab bar visible).
//   Functional — accordion expand/collapse reveals tab content; save bar is fixed
//   and visible when form is dirty; clicking a nav item navigates and collapses.

import { expect, test } from '@playwright/test';

import { loginAs } from '../fixtures/auth';
import { resetDb, seedUser } from '../fixtures/seed';

const EMAIL = 'nino@cafelinville.ge';

test.describe('admin settings mobile (T17.5)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ context }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'mobile',
      'Mobile-only; desktop variant covered by T16.1',
    );
    await resetDb();
    await context.clearCookies();
    await context.addCookies([
      { name: 'NEXT_LOCALE', value: 'en', domain: 'localhost', path: '/' },
    ]);
  });

  async function seedAndLogin(page: Parameters<typeof loginAs>[0]) {
    await seedUser({
      email: EMAIL,
      name: 'Nino Kapanadze',
      plan: 'STARTER',
      emailVerified: new Date(),
    });
    await loginAs(page, EMAIL);
  }

  // ── Visual ───────────────────────────────────────────────────────────────

  test('visual: settings shell on mobile (STARTER, profile tab)', async ({ page }, testInfo) => {
    await seedAndLogin(page);
    await page.goto('/admin/settings/profile');

    await expect(page.getByTestId('settings-shell')).toBeVisible();
    await expect(page.getByTestId('settings-mobile-accordion')).toBeVisible();
    await expect(page.getByTestId('settings-tab-profile')).toBeVisible();
    await expect(page.getByTestId('admin-mobile-tab-bar')).toBeVisible();

    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({
      content:
        '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }',
    });

    const shell = page.getByTestId('settings-shell');
    await expect(shell).toHaveScreenshot(`mobile-settings-${testInfo.project.name}.png`, {
      maxDiffPixelRatio: 0.05,
    });
  });

  // ── Functional ───────────────────────────────────────────────────────────

  test('functional: accordion is visible on mobile and desktop rail is hidden', async ({
    page,
  }) => {
    await seedAndLogin(page);
    await page.goto('/admin/settings/profile');

    // Mobile accordion visible.
    await expect(page.getByTestId('settings-mobile-accordion')).toBeVisible();
    await expect(page.getByTestId('settings-mobile-accordion-trigger')).toBeVisible();

    // Desktop rail hidden (present in DOM but not visible on mobile viewport).
    await expect(page.getByTestId('settings-nav-rail')).toBeHidden();
  });

  test('functional: clicking trigger expands accordion and reveals all tab items', async ({
    page,
  }) => {
    await seedAndLogin(page);
    await page.goto('/admin/settings/profile');

    const trigger = page.getByTestId('settings-mobile-accordion-trigger');
    await trigger.click();

    const content = page.getByTestId('settings-mobile-accordion-content');
    await expect(content).toBeVisible();

    // All 7 items present inside the accordion content.
    for (const key of [
      'profile',
      'notifications',
      'security',
      'language',
      'business-info',
      'billing',
      'team',
    ]) {
      await expect(content.getByTestId(`settings-nav-${key}`)).toBeVisible();
    }

    // Group labels render inside accordion.
    await expect(content.getByText('Personal', { exact: true })).toBeVisible();
    await expect(content.getByText('Business', { exact: true })).toBeVisible();
  });

  test('functional: clicking a tab navigates and collapses accordion', async ({ page }) => {
    await seedAndLogin(page);
    await page.goto('/admin/settings/profile');

    // Expand accordion.
    await page.getByTestId('settings-mobile-accordion-trigger').click();
    await expect(page.getByTestId('settings-mobile-accordion-content')).toBeVisible();

    // Click Billing inside accordion.
    await page.getByTestId('settings-mobile-accordion-content').getByTestId('settings-nav-billing').click();
    await expect(page).toHaveURL(/\/admin\/settings\/billing$/);
    await expect(page.getByTestId('settings-tab-billing')).toBeVisible();

    // Accordion collapsed (content hidden).
    await expect(page.getByTestId('settings-mobile-accordion-content')).toBeHidden();

    // Trigger now shows Billing label.
    const trigger = page.getByTestId('settings-mobile-accordion-trigger');
    await expect(trigger).toContainText('Plan & billing');
  });

  test('functional: save bar is fixed and visible when form is dirty', async ({ page }) => {
    await seedAndLogin(page);
    await page.goto('/admin/settings/profile');

    // Clean form → no save bar.
    await expect(page.getByTestId('settings-save-bar')).toHaveCount(0);

    // Dirty the first-name input.
    const input = page.getByTestId('profile-firstName');
    await input.fill('hello');

    // Save bar appears.
    const bar = page.getByTestId('settings-save-bar');
    await expect(bar).toBeVisible();
    await expect(bar).toHaveAttribute('data-dirty', 'true');
    await expect(bar.getByText('You have unsaved changes')).toBeVisible();

    // Verify fixed positioning: bar should be above the mobile tab bar.
    const box = await bar.boundingBox();
    expect(box).not.toBeNull();
    const viewportHeight = page.viewportSize()?.height ?? 844;
    // bottom-24 = 96px from bottom → top of bar is viewportHeight - 96 - 64 = viewportHeight - 160
    expect(box!.y).toBeGreaterThan(viewportHeight - 180);

    // Discard → save bar removed.
    await page.getByTestId('settings-save-bar-discard').click();
    await expect(page.getByTestId('settings-save-bar')).toHaveCount(0);
  });
});
