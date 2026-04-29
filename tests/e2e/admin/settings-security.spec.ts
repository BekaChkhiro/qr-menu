// Test for T16.7 Security Tab.
// Run:     pnpm test:e2e tests/e2e/admin/settings-security.spec.ts
// Update:  pnpm test:e2e:update tests/e2e/admin/settings-security.spec.ts
//
// Covers:
//   Visual — Security tab with password card, 2FA toggles, sessions list,
//   danger zone (STARTER plan).
//   Functional —
//     - page hydrates with password status, sessions, danger zone
//     - change password dialog validates fields
//     - correct current password → PATCH /api/user/password succeeds,
//       sessionVersion increments in DB
//     - wrong current password → error toast
//     - delete account dialog requires DELETE confirmation

import { expect, test } from '@playwright/test';

import { loginAs } from '../fixtures/auth';
import { prismaTest, resetDb } from '../fixtures/seed';

const EMAIL = 'nino@cafelinville.ge';
const CURRENT_PASSWORD = 'OldPass123!';

async function seedUserWithPassword() {
  return prismaTest.user.create({
    data: {
      email: EMAIL,
      name: 'Nino Kapanadze',
      firstName: 'Nino',
      lastName: 'Kapanadze',
      plan: 'STARTER',
      emailVerified: new Date(),
      password: await import('bcryptjs').then((bc) =>
        bc.hash(CURRENT_PASSWORD, 10)
      ),
    },
  });
}

test.describe('admin settings — Security tab (T16.7)', () => {
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

  // ── Visual ──────────────────────────────────────────────────────────────

  test('visual: security tab renders all sections', async ({ page }, testInfo) => {
    await seedUserWithPassword();
    await loginAs(page, EMAIL);
    await page.goto('/admin/settings/security');

    await expect(page.getByTestId('settings-security-form')).toBeVisible();
    await expect(page.getByTestId('security-change-password-btn')).toBeVisible();
    await expect(page.getByTestId('security-session-row-current')).toBeVisible();
    await expect(page.getByTestId('security-delete-business-btn')).toBeVisible();

    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({
      content:
        '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }',
    });

    const tab = page.getByTestId('settings-tab-security');
    await expect(tab).toHaveScreenshot(`settings-security-${testInfo.project.name}.png`, {
      maxDiffPixelRatio: 0.05,
    });
  });

  // ── Functional ──────────────────────────────────────────────────────────

  test('functional: page hydrates with correct sections', async ({ page }) => {
    await seedUserWithPassword();
    await loginAs(page, EMAIL);
    await page.goto('/admin/settings/security');

    await expect(page.getByTestId('settings-security-form')).toBeVisible();
    await expect(page.getByTestId('security-change-password-btn')).toBeVisible();

    // 2FA toggles are present but disabled
    await expect(page.getByTestId('security-2fa-auth-toggle')).toBeDisabled();
    await expect(page.getByTestId('security-2fa-sms-toggle')).toBeDisabled();

    // Current session is shown
    await expect(page.getByTestId('security-session-row-current')).toBeVisible();

    // Danger zone delete button
    await expect(page.getByTestId('security-delete-business-btn')).toBeVisible();
  });

  test('functional: change password with wrong current shows error', async ({ page }) => {
    await seedUserWithPassword();
    await loginAs(page, EMAIL);
    await page.goto('/admin/settings/security');

    await page.getByTestId('security-change-password-btn').click();
    await expect(page.getByTestId('security-password-dialog')).toBeVisible();

    await page.getByTestId('security-password-current').fill('wrong-password');
    await page.getByTestId('security-password-new').fill('NewPass123!');
    await page.getByTestId('security-password-confirm').fill('NewPass123!');

    const patchPromise = page.waitForResponse(
      (res) => res.url().endsWith('/api/user/password') && res.request().method() === 'PATCH',
    );
    await page.getByTestId('security-password-save').click();
    const response = await patchPromise;
    expect(response.status()).toBe(401);

    await expect(page.getByTestId('security-password-dialog')).toBeVisible();
  });

  test('functional: change password with correct current succeeds and bumps sessionVersion', async ({ page }) => {
    const user = await seedUserWithPassword();
    await loginAs(page, EMAIL);
    await page.goto('/admin/settings/security');

    await page.getByTestId('security-change-password-btn').click();
    await expect(page.getByTestId('security-password-dialog')).toBeVisible();

    await page.getByTestId('security-password-current').fill(CURRENT_PASSWORD);
    await page.getByTestId('security-password-new').fill('NewPass456!');
    await page.getByTestId('security-password-confirm').fill('NewPass456!');

    const patchPromise = page.waitForResponse(
      (res) => res.url().endsWith('/api/user/password') && res.request().method() === 'PATCH',
    );
    await page.getByTestId('security-password-save').click();
    const response = await patchPromise;
    expect(response.status()).toBe(200);

    // DB reflects password change + sessionVersion bump
    const fresh = await prismaTest.user.findUnique({ where: { id: user.id } });
    expect(fresh?.sessionVersion).toBe(1);
    expect(
      await import('bcryptjs').then((bc) =>
        bc.compare('NewPass456!', fresh?.password ?? '')
      )
    ).toBe(true);
  });

  test('functional: password dialog validates empty fields', async ({ page }) => {
    await seedUserWithPassword();
    await loginAs(page, EMAIL);
    await page.goto('/admin/settings/security');

    await page.getByTestId('security-change-password-btn').click();
    await page.getByTestId('security-password-save').click();

    // Dialog should still be open because validation failed before API call
    await expect(page.getByTestId('security-password-dialog')).toBeVisible();
  });

  test('functional: delete account dialog requires DELETE confirmation', async ({ page }) => {
    const user = await seedUserWithPassword();
    await loginAs(page, EMAIL);
    await page.goto('/admin/settings/security');

    await page.getByTestId('security-delete-business-btn').click();
    await expect(page.getByTestId('security-delete-dialog')).toBeVisible();

    // Confirm button disabled without DELETE
    const confirmBtn = page.getByTestId('security-delete-confirm-btn');
    await expect(confirmBtn).toBeDisabled();

    // Type wrong text
    await page.getByTestId('security-delete-confirm-input').fill('delete');
    await expect(confirmBtn).toBeDisabled();

    // Type DELETE
    await page.getByTestId('security-delete-confirm-input').fill('DELETE');
    await expect(confirmBtn).toBeEnabled();

    const deletePromise = page.waitForResponse(
      (res) => res.url().endsWith('/api/user/account') && res.request().method() === 'DELETE',
    );
    await confirmBtn.click();
    const response = await deletePromise;
    expect(response.status()).toBe(200);

    // User is removed from DB
    const gone = await prismaTest.user.findUnique({ where: { id: user.id } });
    expect(gone).toBeNull();
  });
});
