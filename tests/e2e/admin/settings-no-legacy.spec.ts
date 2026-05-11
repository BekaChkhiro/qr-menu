// Test for T20.6 — Remove Legacy MenuSettingsForm.
// Run:     pnpm test:e2e tests/e2e/admin/settings-no-legacy.spec.ts
// Update:  pnpm test:e2e:update tests/e2e/admin/settings-no-legacy.spec.ts
//
// Asserts that the legacy `<MenuSettingsForm>` shell (the wrapping Card +
// CardContent space-y-6 block) no longer renders on the settings tab, and
// that its collapsible section triggers (Layout & Style, Typography,
// Languages, Display) are absent from the DOM.

import { expect, test, type Page } from '@playwright/test';

import { loginAs } from '../fixtures/auth';
import { resetDb, seedMenu, seedUser } from '../fixtures/seed';

const SLUG_BASE = `linville-t206`;

async function seedAndOpenSettings(page: Page) {
  const email = 'nino-nolegacy@cafelinville.ge';
  const user = await seedUser({
    plan: 'STARTER',
    name: 'Nino Kapanadze',
    email,
  });
  const menu = await seedMenu({
    userId: user.id,
    status: 'PUBLISHED',
    categoryCount: 2,
    productCount: 3,
    name: 'Café Linville — Dinner',
    slug: SLUG_BASE,
  });
  await loginAs(page, email);
  await page.goto(`/admin/menus/${menu.id}?tab=settings`);
  await expect(page.getByTestId('settings-tab')).toBeVisible();
  return { user, menu };
}

test.describe('editor settings tab · legacy form removed (T20.6)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ context }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop',
      'Desktop-only tab; mobile variant lands in T17.3',
    );
    await resetDb();
    await context.clearCookies();
    await context.addCookies([
      { name: 'NEXT_LOCALE', value: 'en', domain: 'localhost', path: '/' },
    ]);
  });

  test('functional: legacy form shell and section triggers are absent', async ({
    page,
  }) => {
    await seedAndOpenSettings(page);

    // The legacy MenuSettingsForm rendered a `<form>` whose immediate
    // FormProvider child used `space-y-3` for vertical rhythm. The form
    // element should no longer exist anywhere under the settings tab.
    const settingsTab = page.getByTestId('settings-tab');
    await expect(settingsTab.locator('form.space-y-3')).toHaveCount(0);

    // The collapsible section triggers from the legacy form must not
    // appear in the DOM. They were buttons whose accessible name matched
    // these titles.
    for (const title of ['Layout & Style', 'Typography', 'Languages', 'Display']) {
      await expect(
        settingsTab.getByRole('button', { name: title, exact: true }),
      ).toHaveCount(0);
    }

    // The sections we *do* expect to remain on the settings tab still render.
    await expect(page.getByTestId('settings-url-visibility')).toBeVisible();
    await expect(page.getByTestId('settings-advanced')).toBeVisible();
  });

  test('functional: legacy /admin/menus/[id]/edit route is gone (T20.8)', async ({
    page,
  }) => {
    const { menu } = await seedAndOpenSettings(page);

    const response = await page.goto(`/admin/menus/${menu.id}/edit`, {
      waitUntil: 'domcontentloaded',
    });

    expect(response?.status()).toBe(404);
  });
});
