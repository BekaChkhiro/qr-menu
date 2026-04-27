// Test for T16.6 Notifications Tab.
// Run:     pnpm test:e2e tests/e2e/admin/settings-notifications.spec.ts
// Update:  pnpm test:e2e:update tests/e2e/admin/settings-notifications.spec.ts
//
// Covers:
//   Visual — the Notifications tab with delivery channels + menu activity +
//            billing & account cards.
//   Functional —
//     - form hydrates from GET /api/user/notifications (auto-creates defaults)
//     - toggling weekly digest off dirties the form; Save fires PATCH
//       /api/user/notifications and updates the DB row
//     - payment-failed toggles are locked (disabled + checked)
//     - Discard reverts the form back to pristine state

import { expect, test } from '@playwright/test';

import { loginAs } from '../fixtures/auth';
import { prismaTest, resetDb } from '../fixtures/seed';

const EMAIL = 'nino@cafelinville.ge';

test.describe('admin settings — Notifications tab (T16.6)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ context }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop',
      'Desktop-only; mobile variant ships with T17.5',
    );
    await resetDb();
    await context.clearCookies();
    await context.addCookies([
      { name: 'NEXT_LOCALE', value: 'en', domain: 'localhost', path: '/' },
    ]);
  });

  async function seedAndLogin(page: Parameters<typeof loginAs>[0]) {
    const user = await prismaTest.user.create({
      data: {
        email: EMAIL,
        name: 'Nino Kapanadze',
        firstName: 'Nino',
        lastName: 'Kapanadze',
        plan: 'STARTER',
        emailVerified: new Date(),
      },
    });
    await loginAs(page, EMAIL);
    return user;
  }

  // ── Visual ──────────────────────────────────────────────────────────────

  test('visual: notifications tab renders with default preferences', async ({ page }, testInfo) => {
    await seedAndLogin(page);
    await page.goto('/admin/settings/notifications');

    const form = page.getByTestId('settings-notifications-form');
    await expect(form).toBeVisible();
    // Wait for hydration before screenshotting.
    await expect(page.getByTestId('notif-email')).toHaveValue(EMAIL);

    await expect(page.getByTestId('settings-shell')).toHaveScreenshot(
      'settings-notifications-desktop.png',
      { maxDiffPixelRatio: 0.05 },
    );
  });

  // ── Functional ──────────────────────────────────────────────────────────

  test('functional: form hydrates from GET /api/user/notifications', async ({ page }) => {
    await seedAndLogin(page);
    await page.goto('/admin/settings/notifications');

    // Email field
    await expect(page.getByTestId('notif-email')).toHaveValue(EMAIL);

    // Menu activity defaults (from design spec)
    await expect(page.getByTestId('notif-menuEdit-email')).toHaveAttribute('data-state', 'checked');
    await expect(page.getByTestId('notif-menuEdit-push')).toHaveAttribute('data-state', 'unchecked');
    await expect(page.getByTestId('notif-outOfStock-email')).toHaveAttribute('data-state', 'unchecked');
    await expect(page.getByTestId('notif-outOfStock-push')).toHaveAttribute('data-state', 'checked');
    await expect(page.getByTestId('notif-weeklyDigest-email')).toHaveAttribute('data-state', 'checked');
    await expect(page.getByTestId('notif-weeklyDigest-push')).toHaveAttribute('data-state', 'unchecked');

    // Billing defaults
    await expect(page.getByTestId('notif-invoiceReady-email')).toHaveAttribute('data-state', 'checked');
    await expect(page.getByTestId('notif-invoiceReady-push')).toHaveAttribute('data-state', 'unchecked');
    await expect(page.getByTestId('notif-paymentFailed-email')).toHaveAttribute('data-state', 'checked');
    await expect(page.getByTestId('notif-paymentFailed-push')).toHaveAttribute('data-state', 'checked');
    await expect(page.getByTestId('notif-newSignIn-email')).toHaveAttribute('data-state', 'checked');
    await expect(page.getByTestId('notif-newSignIn-push')).toHaveAttribute('data-state', 'checked');

    // Form starts clean.
    await expect(page.getByTestId('notifications-form-actions')).toHaveCount(0);
    await expect(page.getByTestId('settings-save-bar')).toHaveCount(0);
  });

  test('functional: toggle digest off → PATCH and DB updated', async ({ page }) => {
    const user = await seedAndLogin(page);
    await page.goto('/admin/settings/notifications');

    await expect(page.getByTestId('notif-weeklyDigest-email')).toHaveAttribute('data-state', 'checked');

    // Toggle weekly digest email OFF.
    await page.getByTestId('notif-weeklyDigest-email').click();
    await expect(page.getByTestId('notif-weeklyDigest-email')).toHaveAttribute('data-state', 'unchecked');

    // Dirty indicators appear.
    await expect(page.getByTestId('settings-save-bar')).toBeVisible();
    await expect(page.getByTestId('notifications-form-actions')).toBeVisible();

    // Intercept PATCH.
    const patchPromise = page.waitForResponse(
      (res) => res.url().endsWith('/api/user/notifications') && res.request().method() === 'PATCH',
    );
    await page.getByTestId('notifications-save').click();
    const response = await patchPromise;
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body?.data?.preferences?.weeklyDigestEmail).toBe(false);

    // Form goes clean.
    await expect(page.getByTestId('settings-save-bar')).toHaveCount(0);
    await expect(page.getByTestId('notifications-form-actions')).toHaveCount(0);

    // DB reflects update.
    const fresh = await prismaTest.notificationPreference.findUnique({
      where: { userId: user.id },
    });
    expect(fresh?.weeklyDigestEmail).toBe(false);
    expect(fresh?.weeklyDigestPush).toBe(false); // default
  });

  test('functional: payment-failed toggle is locked visually', async ({ page }) => {
    await seedAndLogin(page);
    await page.goto('/admin/settings/notifications');

    const emailSwitch = page.getByTestId('notif-paymentFailed-email');
    const pushSwitch = page.getByTestId('notif-paymentFailed-push');

    // Both are checked (default) and disabled.
    await expect(emailSwitch).toHaveAttribute('data-state', 'checked');
    await expect(pushSwitch).toHaveAttribute('data-state', 'checked');
    await expect(emailSwitch).toBeDisabled();
    await expect(pushSwitch).toBeDisabled();
  });

  test('functional: Discard reverts the form to the pristine state', async ({ page }) => {
    await seedAndLogin(page);
    await page.goto('/admin/settings/notifications');

    await expect(page.getByTestId('notif-menuEdit-email')).toHaveAttribute('data-state', 'checked');
    await page.getByTestId('notif-menuEdit-email').click();
    await expect(page.getByTestId('notif-menuEdit-email')).toHaveAttribute('data-state', 'unchecked');

    await expect(page.getByTestId('settings-save-bar')).toBeVisible();

    await page.getByTestId('notifications-discard').click();
    await expect(page.getByTestId('notif-menuEdit-email')).toHaveAttribute('data-state', 'checked');
    await expect(page.getByTestId('settings-save-bar')).toHaveCount(0);
  });
});
