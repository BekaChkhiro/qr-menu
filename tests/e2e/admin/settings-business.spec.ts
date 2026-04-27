// Test for T16.3 Business Info Tab.
// Run:     pnpm test:e2e tests/e2e/admin/settings-business.spec.ts
// Update:  pnpm test:e2e:update tests/e2e/admin/settings-business.spec.ts
//
// Covers:
//   Visual — the STARTER Business info tab with logo, details, address,
//     contact, and opening hours sections.
//   Functional —
//     - form hydrates from GET /api/user/business (auto-creates blank row)
//     - cuisine chip add + Save fires PATCH /api/user/business and persists
//     - opening hours toggle closed hides time inputs and shows "Closed"
//     - "Copy to all" copies the source day's hours to every other day

import { expect, test } from '@playwright/test';

import { loginAs } from '../fixtures/auth';
import { prismaTest, resetDb } from '../fixtures/seed';

const EMAIL = 'nino@cafelinville.ge';

test.describe('admin settings — Business info tab (T16.3)', () => {
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

  test('visual: business info tab renders with auto-created blank data', async ({ page }, testInfo) => {
    await seedAndLogin(page);
    await page.goto('/admin/settings/business-info');

    const form = page.getByTestId('settings-business-form');
    await expect(form).toBeVisible();
    // Wait for hydration from GET /api/user/business
    await expect(page.getByTestId('business-name')).toHaveValue('');

    await expect(page.getByTestId('settings-shell')).toHaveScreenshot(
      `settings-business-${testInfo.project.name}.png`,
      { maxDiffPixelRatio: 0.05 },
    );
  });

  // ── Functional ──────────────────────────────────────────────────────────

  test('functional: form hydrates from GET /api/user/business', async ({ page }) => {
    await seedAndLogin(page);
    await page.goto('/admin/settings/business-info');

    await expect(page.getByTestId('business-name')).toHaveValue('');
    await expect(page.getByTestId('business-taxId')).toHaveValue('');
    await expect(page.getByTestId('business-description')).toHaveValue('');

    // Opening hours table has 7 rows, all open by default.
    const rows = page.locator('[data-testid^="business-hours-row-"]');
    await expect(rows).toHaveCount(7);

    // Monday row is open by default → time inputs are visible.
    const mondayRow = page.getByTestId('business-hours-row-monday');
    await expect(mondayRow).toHaveAttribute('data-closed', 'false');
    await expect(page.getByTestId('business-hours-open-monday')).toBeVisible();
    await expect(page.getByTestId('business-hours-close-monday')).toBeVisible();

    // Form starts clean.
    await expect(page.getByTestId('business-form-actions')).toHaveCount(0);
    await expect(page.getByTestId('settings-save-bar')).toHaveCount(0);
  });

  test('functional: cuisine chip + Save fires PATCH and persists', async ({ page }) => {
    const user = await seedAndLogin(page);
    await page.goto('/admin/settings/business-info');

    // Add a cuisine chip.
    const cuisineInput = page.getByTestId('business-cuisine-input');
    await cuisineInput.fill('Georgian');
    await cuisineInput.press('Enter');

    // Chip appears.
    await expect(page.getByTestId('business-cuisine-chip-Georgian')).toBeVisible();

    // Save.
    const patchPromise = page.waitForResponse(
      (res) => res.url().endsWith('/api/user/business') && res.request().method() === 'PATCH',
    );
    await page.getByTestId('business-save').click();
    const response = await patchPromise;
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body?.data?.business?.cuisines).toContain('Georgian');

    // DB reflects the update.
    const fresh = await prismaTest.business.findUnique({ where: { userId: user.id } });
    expect(fresh?.cuisines).toContain('Georgian');

    // Form goes clean.
    await expect(page.getByTestId('settings-save-bar')).toHaveCount(0);
    await expect(page.getByTestId('business-form-actions')).toHaveCount(0);
  });

  test('functional: opening hours toggle closed disables times and shows Closed', async ({ page }) => {
    const user = await seedAndLogin(page);
    await page.goto('/admin/settings/business-info');

    const mondayRow = page.getByTestId('business-hours-row-monday');
    const toggle = page.getByTestId('business-hours-toggle-monday');

    // Toggle Monday off (closed).
    await toggle.click();
    await expect(mondayRow).toHaveAttribute('data-closed', 'true');
    await expect(page.getByTestId('business-hours-open-monday')).toHaveCount(0);
    await expect(page.getByTestId('business-hours-close-monday')).toHaveCount(0);

    // Save the change.
    const patchPromise = page.waitForResponse(
      (res) => res.url().endsWith('/api/user/business') && res.request().method() === 'PATCH',
    );
    await page.getByTestId('business-save').click();
    const response = await patchPromise;
    expect(response.status()).toBe(200);

    // DB row has Monday closed.
    const fresh = await prismaTest.business.findUnique({ where: { userId: user.id } });
    const monday = fresh?.openingHours ? (fresh.openingHours as unknown as Array<{ day: string; closed: boolean }>).find((h) => h.day === 'Monday') : null;
    expect(monday?.closed).toBe(true);
  });

  test('functional: Copy to all applies source day hours to all days', async ({ page }) => {
    const user = await seedAndLogin(page);
    await page.goto('/admin/settings/business-info');

    // Change Monday's open time to a unique value so we can verify propagation.
    const mondayOpen = page.getByTestId('business-hours-open-monday');
    await mondayOpen.fill('07:30');

    const mondayClose = page.getByTestId('business-hours-close-monday');
    await mondayClose.fill('21:00');

    // Click "Copy to all" on Monday (first open day).
    await page.getByTestId('business-hours-copy-monday').click();

    // All other days should now have 07:30 / 21:00.
    for (const day of ['tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']) {
      await expect(page.getByTestId(`business-hours-open-${day}`)).toHaveValue('07:30');
      await expect(page.getByTestId(`business-hours-close-${day}`)).toHaveValue('21:00');
    }

    // Save.
    const patchPromise = page.waitForResponse(
      (res) => res.url().endsWith('/api/user/business') && res.request().method() === 'PATCH',
    );
    await page.getByTestId('business-save').click();
    const response = await patchPromise;
    expect(response.status()).toBe(200);

    // DB verification.
    const fresh = await prismaTest.business.findUnique({ where: { userId: user.id } });
    const hours = fresh?.openingHours as unknown as Array<{ day: string; open: string; close: string; closed: boolean }>;
    for (const h of hours) {
      if (h.day === 'Monday') continue;
      expect(h.open).toBe('07:30');
      expect(h.close).toBe('21:00');
      expect(h.closed).toBe(false);
    }
  });
});
