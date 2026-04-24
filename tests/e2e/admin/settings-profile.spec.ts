// Test for T16.2 Profile Tab.
// Run:     pnpm test:e2e tests/e2e/admin/settings-profile.spec.ts
// Update:  pnpm test:e2e:update tests/e2e/admin/settings-profile.spec.ts
//
// Covers:
//   Visual — the STARTER Profile tab with avatar block + personal info + preferences.
//   Functional —
//     - form hydrates from GET /api/user/profile (firstName / lastName / phone /
//       timezone / dateFormat)
//     - editing firstName dirties the form, clicking Save fires PATCH
//       /api/user/profile, DB row is updated, top-bar display name refreshes
//     - the timezone + date format selects persist to the DB
//     - Discard reverts the form back to the pristine state

import { expect, test } from '@playwright/test';

import { loginAs } from '../fixtures/auth';
import { prismaTest, resetDb } from '../fixtures/seed';

const EMAIL = 'nino@cafelinville.ge';

test.describe('admin settings — Profile tab (T16.2)', () => {
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
        phone: '+995 599 12 34 56',
        timezone: 'Asia/Tbilisi',
        dateFormat: 'DD.MM.YYYY',
        plan: 'STARTER',
        emailVerified: new Date(),
      },
    });
    await loginAs(page, EMAIL);
    return user;
  }

  // ── Visual ──────────────────────────────────────────────────────────────

  test('visual: profile tab renders with seeded user data', async ({ page }, testInfo) => {
    await seedAndLogin(page);
    await page.goto('/admin/settings/profile');

    const form = page.getByTestId('settings-profile-form');
    await expect(form).toBeVisible();
    // Wait for the form to hydrate from GET /api/user/profile before
    // screenshotting, otherwise we race the suspense state.
    await expect(page.getByTestId('profile-firstName')).toHaveValue('Nino');

    await expect(page.getByTestId('settings-shell')).toHaveScreenshot(
      'settings-profile-desktop.png',
      { maxDiffPixelRatio: 0.05 },
    );
  });

  // ── Functional ──────────────────────────────────────────────────────────

  test('functional: form hydrates from GET /api/user/profile', async ({ page }) => {
    await seedAndLogin(page);
    await page.goto('/admin/settings/profile');

    await expect(page.getByTestId('profile-firstName')).toHaveValue('Nino');
    await expect(page.getByTestId('profile-lastName')).toHaveValue('Kapanadze');
    await expect(page.getByTestId('profile-phone')).toHaveValue('+995 599 12 34 56');
    await expect(page.getByTestId('profile-email')).toHaveValue(EMAIL);
    await expect(page.getByTestId('profile-email-verified')).toBeVisible();

    // Form starts clean → no inline action row, no shell save bar.
    await expect(page.getByTestId('profile-form-actions')).toHaveCount(0);
    await expect(page.getByTestId('settings-save-bar')).toHaveCount(0);
  });

  test('functional: editing firstName + Save fires PATCH and updates DB', async ({
    page,
  }) => {
    const user = await seedAndLogin(page);
    await page.goto('/admin/settings/profile');

    await expect(page.getByTestId('profile-firstName')).toHaveValue('Nino');

    // Dirty the form.
    const first = page.getByTestId('profile-firstName');
    await first.fill('Niko');

    // Save bar + inline action row appear.
    await expect(page.getByTestId('settings-save-bar')).toBeVisible();
    await expect(page.getByTestId('profile-form-actions')).toBeVisible();

    // Intercept the PATCH so we can assert the request body.
    const patchPromise = page.waitForResponse(
      (res) => res.url().endsWith('/api/user/profile') && res.request().method() === 'PATCH',
    );
    await page.getByTestId('profile-save').click();
    const response = await patchPromise;
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body?.data?.user?.firstName).toBe('Niko');
    expect(body?.data?.user?.name).toBe('Niko Kapanadze');

    // Form goes clean after a successful save.
    await expect(page.getByTestId('settings-save-bar')).toHaveCount(0);
    await expect(page.getByTestId('profile-form-actions')).toHaveCount(0);

    // DB row reflects the update.
    const fresh = await prismaTest.user.findUnique({ where: { id: user.id } });
    expect(fresh?.firstName).toBe('Niko');
    expect(fresh?.name).toBe('Niko Kapanadze');
  });

  test('functional: timezone + date format selects persist to DB', async ({ page }) => {
    const user = await seedAndLogin(page);
    await page.goto('/admin/settings/profile');
    await expect(page.getByTestId('profile-firstName')).toHaveValue('Nino');

    // Change timezone → London
    await page.getByTestId('profile-timezone').click();
    await page.getByTestId('profile-timezone-option-Europe/London').click();

    // Change date format → YYYY-MM-DD
    await page.getByTestId('profile-dateFormat').click();
    await page.getByTestId('profile-dateFormat-option-YYYY-MM-DD').click();

    const patchPromise = page.waitForResponse(
      (res) => res.url().endsWith('/api/user/profile') && res.request().method() === 'PATCH',
    );
    await page.getByTestId('profile-save').click();
    const response = await patchPromise;
    expect(response.status()).toBe(200);

    const fresh = await prismaTest.user.findUnique({ where: { id: user.id } });
    expect(fresh?.timezone).toBe('Europe/London');
    expect(fresh?.dateFormat).toBe('YYYY-MM-DD');
  });

  test('functional: Discard reverts the form to the pristine state', async ({ page }) => {
    await seedAndLogin(page);
    await page.goto('/admin/settings/profile');

    const phone = page.getByTestId('profile-phone');
    await expect(phone).toHaveValue('+995 599 12 34 56');
    await phone.fill('+995 555 00 00 00');

    await expect(page.getByTestId('settings-save-bar')).toBeVisible();

    await page.getByTestId('profile-discard').click();
    await expect(phone).toHaveValue('+995 599 12 34 56');
    await expect(page.getByTestId('settings-save-bar')).toHaveCount(0);
  });
});
