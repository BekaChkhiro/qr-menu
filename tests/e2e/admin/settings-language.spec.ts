// Test for T16.8 Language Tab.
// Run:     pnpm test:e2e tests/e2e/admin/settings-language.spec.ts
// Update:  pnpm test:e2e:update tests/e2e/admin/settings-language.spec.ts
//
// Covers:
//   Visual — the STARTER Language tab with interface lang, menu languages rows,
//   AI translate banner, and currency/formatting selects.
//   Functional —
//     - form hydrates from GET /api/user/profile (currency / priceFormat)
//     - changing interface language calls setLocale, reloads page, UI translates
//     - currency + price format selects persist to DB via PATCH /api/user/profile
//     - Discard reverts the form back to pristine state

import { expect, test } from '@playwright/test';

import { loginAs } from '../fixtures/auth';
import { prismaTest, resetDb } from '../fixtures/seed';

const EMAIL = 'nino@cafelinville.ge';

test.describe('admin settings — Language tab (T16.8)', () => {
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

  async function seedAndLogin(page: Parameters<typeof loginAs>[0], plan: 'FREE' | 'STARTER' | 'PRO' = 'STARTER') {
    const user = await prismaTest.user.create({
      data: {
        email: EMAIL,
        name: 'Nino Kapanadze',
        firstName: 'Nino',
        lastName: 'Kapanadze',
        currency: 'GEL',
        priceFormat: '12.50 ₾',
        plan,
        emailVerified: new Date(),
      },
    });

    // Seed 2 menus: one with KA+EN, one with KA+RU
    await prismaTest.menu.create({
      data: {
        userId: user.id,
        name: 'Main Menu',
        slug: 'main-menu',
        status: 'PUBLISHED',
        enabledLanguages: ['KA', 'EN'],
        publishedAt: new Date(),
      },
    });
    await prismaTest.menu.create({
      data: {
        userId: user.id,
        name: 'Weekend Menu',
        slug: 'weekend-menu',
        status: 'DRAFT',
        enabledLanguages: ['KA', 'RU'],
      },
    });

    await loginAs(page, EMAIL);
    return user;
  }

  // ── Visual ──────────────────────────────────────────────────────────────

  test('visual: language tab renders with seeded data', async ({ page }) => {
    await seedAndLogin(page);
    await page.goto('/admin/settings/language');

    const form = page.getByTestId('settings-language-form');
    await expect(form).toBeVisible();
    // Wait for menus to load before screenshotting
    await expect(page.getByTestId('language-row-en')).toBeVisible();

    await expect(page.getByTestId('settings-shell')).toHaveScreenshot(
      'settings-language-desktop.png',
      { maxDiffPixelRatio: 0.05 },
    );
  });

  // ── Functional ──────────────────────────────────────────────────────────

  test('functional: form hydrates from GET /api/user/profile', async ({ page }) => {
    await seedAndLogin(page);
    await page.goto('/admin/settings/language');

    await expect(page.getByTestId('language-currency')).toContainText('Georgian Lari');
    await expect(page.getByTestId('language-priceFormat')).toContainText('12.50 ₾');

    // Menu language rows reflect seeded menus
    const enRow = page.getByTestId('language-row-en');
    await expect(enRow).toContainText('Enabled on 1 of 2 menus');

    const ruRow = page.getByTestId('language-row-ru');
    await expect(ruRow).toContainText('Enabled on 1 of 2 menus');

    const kaRow = page.getByTestId('language-row-ka');
    await expect(kaRow).toContainText('PRIMARY');

    // Form starts clean
    await expect(page.getByTestId('language-form-actions')).toHaveCount(0);
    await expect(page.getByTestId('settings-save-bar')).toHaveCount(0);
  });

  test('functional: changing interface language reloads page with new locale', async ({ page }) => {
    await seedAndLogin(page);
    await page.goto('/admin/settings/language');

    // Wait for form to hydrate
    await expect(page.getByTestId('language-interface-select')).toBeVisible();

    // Change interface language to Georgian
    await page.getByTestId('language-interface-select').click();
    await page.getByTestId('language-option-ka').click();

    // Page should reload with ka locale — assert by checking Georgian text appears
    await expect(page.getByText('ენის პარამეტრები')).toBeVisible({ timeout: 10000 });

    // The NEXT_LOCALE cookie should now be 'ka'
    const cookies = await page.context().cookies();
    const localeCookie = cookies.find((c) => c.name === 'NEXT_LOCALE');
    expect(localeCookie?.value).toBe('ka');
  });

  test('functional: currency + price format selects persist to DB', async ({ page }) => {
    const user = await seedAndLogin(page);
    await page.goto('/admin/settings/language');
    await expect(page.getByTestId('language-currency')).toContainText('Georgian Lari');

    // Change currency → USD
    await page.getByTestId('language-currency').click();
    await page.getByTestId('language-currency-option-USD').click();

    // Change price format → ₾12.50
    await page.getByTestId('language-priceFormat').click();
    await page.getByTestId('language-priceFormat-option-leading').click();

    const patchPromise = page.waitForResponse(
      (res) => res.url().endsWith('/api/user/profile') && res.request().method() === 'PATCH',
    );
    await page.getByTestId('language-save').click();
    const response = await patchPromise;
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body?.data?.user?.currency).toBe('USD');
    expect(body?.data?.user?.priceFormat).toBe('₾12.50');

    // DB row reflects the update
    const fresh = await prismaTest.user.findUnique({ where: { id: user.id } });
    expect(fresh?.currency).toBe('USD');
    expect(fresh?.priceFormat).toBe('₾12.50');
  });

  test('functional: Discard reverts the form to the pristine state', async ({ page }) => {
    await seedAndLogin(page);
    await page.goto('/admin/settings/language');

    await expect(page.getByTestId('language-currency')).toContainText('Georgian Lari');

    // Change currency
    await page.getByTestId('language-currency').click();
    await page.getByTestId('language-currency-option-USD').click();

    await expect(page.getByTestId('settings-save-bar')).toBeVisible();

    await page.getByTestId('language-discard').click();
    await expect(page.getByTestId('language-currency')).toContainText('Georgian Lari');
    await expect(page.getByTestId('settings-save-bar')).toHaveCount(0);
  });

  test('functional: PRO user sees AI translate banner, FREE sees locked', async ({ page }) => {
    // PRO user
    await seedAndLogin(page, 'PRO');
    await page.goto('/admin/settings/language');
    await expect(page.getByTestId('language-ai-translate-banner')).toBeVisible();
    await expect(page.getByTestId('language-ai-translate-locked')).toHaveCount(0);

    // FREE user
    await resetDb();
    await page.context().clearCookies();
    await page.context().addCookies([
      { name: 'NEXT_LOCALE', value: 'en', domain: 'localhost', path: '/' },
    ]);

    const freeUser = await prismaTest.user.create({
      data: {
        email: 'free@cafelinville.ge',
        name: 'Free User',
        currency: 'GEL',
        priceFormat: '12.50 ₾',
        plan: 'FREE',
        emailVerified: new Date(),
      },
    });
    await prismaTest.menu.create({
      data: {
        userId: freeUser.id,
        name: 'Free Menu',
        slug: 'free-menu',
        status: 'DRAFT',
        enabledLanguages: ['KA'],
      },
    });
    await loginAs(page, 'free@cafelinville.ge');
    await page.goto('/admin/settings/language');
    await expect(page.getByTestId('language-ai-translate-locked')).toBeVisible();
    await expect(page.getByTestId('language-ai-translate-banner')).toHaveCount(0);
  });
});
