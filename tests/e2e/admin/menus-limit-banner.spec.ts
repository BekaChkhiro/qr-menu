// Tests for T12.5 Plan-Limit Banner on /admin/menus.
// Run:     pnpm test:e2e tests/e2e/admin/menus-limit-banner.spec.ts
// Update:  pnpm test:e2e:update tests/e2e/admin/menus-limit-banner.spec.ts
//
// Covers:
//   Visual — `menus-limit-banner.png` (FREE user at 1/1 menus → banner at
//            bottom of the list). Desktop project only.
//   Functional:
//     - FREE user with 1 menu renders the banner, "Create Menu" button is
//       disabled and points at no href, upgrade CTA links to
//       `/admin/settings/billing`.
//     - STARTER user at 3/3 menus renders the banner targeting PRO.
//     - FREE user with 0 menus (under the limit) does NOT render the banner
//       and the Create Menu button is an enabled link to /admin/menus/new.
//     - PRO user at 5 menus (no limit) does NOT render the banner.

import { expect, test } from '@playwright/test';

import { loginAs } from '../fixtures/auth';
import { resetDb, seedMenu, seedUser } from '../fixtures/seed';

const OWNER_EMAIL = 'nino@cafelinville.ge';

test.describe('admin menus list — plan limit banner (T12.5)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ context }) => {
    await resetDb();
    await context.clearCookies();
    await context.addCookies([
      { name: 'NEXT_LOCALE', value: 'en', domain: 'localhost', path: '/' },
    ]);
  });

  // ── Visual ────────────────────────────────────────────────────────────────

  test('visual: FREE user at 1/1 renders the limit banner', async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop',
      'Desktop-only snapshot; mobile variant covered in T17.x',
    );

    const user = await seedUser({
      plan: 'FREE',
      name: 'Nino Kapanadze',
      email: OWNER_EMAIL,
    });
    await seedMenu({
      userId: user.id,
      name: 'Main menu — All day',
      slug: 'main',
      status: 'PUBLISHED',
      categoryCount: 2,
      productCount: 3,
    });
    await loginAs(page, OWNER_EMAIL);
    await page.goto('/admin/menus');
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({
      content:
        '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }',
    });

    const banner = page.getByTestId('menus-plan-limit-banner');
    await expect(banner).toBeVisible();

    await expect(banner).toHaveScreenshot('menus-limit-banner.png', {
      maxDiffPixelRatio: 0.05,
    });
  });

  // ── Functional ────────────────────────────────────────────────────────────

  test('functional: FREE at 1/1 — banner renders, create button is disabled', async ({
    page,
  }) => {
    const user = await seedUser({
      plan: 'FREE',
      name: 'Nino Kapanadze',
      email: OWNER_EMAIL,
    });
    await seedMenu({
      userId: user.id,
      name: 'Main menu — All day',
      slug: 'main',
      status: 'PUBLISHED',
      categoryCount: 2,
      productCount: 3,
    });
    await loginAs(page, OWNER_EMAIL);
    await page.goto('/admin/menus');

    const banner = page.getByTestId('menus-plan-limit-banner');
    await expect(banner).toBeVisible();
    await expect(banner).toHaveAttribute('data-current-plan', 'FREE');
    await expect(banner).toHaveAttribute('data-target-plan', 'STARTER');
    await expect(banner).toContainText('FREE');

    // Banner CTA points at billing.
    const cta = page.getByTestId('menus-plan-limit-banner-cta');
    await expect(cta).toHaveAttribute('href', '/admin/settings/billing');

    // "Create Menu" button is disabled and does not render as a link.
    const createButton = page.getByTestId('menus-create-button');
    await expect(createButton).toBeDisabled();
    await expect(createButton).toHaveAttribute('data-create-disabled', 'true');
    // Disabled variant is a plain <button>, not an anchor.
    await expect(createButton).toHaveJSProperty('tagName', 'BUTTON');
  });

  test('functional: FREE banner CTA navigates to /admin/settings/billing', async ({
    page,
  }) => {
    const user = await seedUser({
      plan: 'FREE',
      name: 'Nino Kapanadze',
      email: OWNER_EMAIL,
    });
    await seedMenu({
      userId: user.id,
      name: 'Main menu',
      slug: 'main',
      status: 'DRAFT',
      categoryCount: 1,
      productCount: 1,
    });
    await loginAs(page, OWNER_EMAIL);
    await page.goto('/admin/menus');

    await page.getByTestId('menus-plan-limit-banner-cta').click();
    await page.waitForURL(/\/admin\/settings\/billing(\/|\?.*)?$/);
    expect(page.url()).toContain('/admin/settings/billing');
  });

  test('functional: STARTER at 3/3 — banner targets PRO', async ({ page }) => {
    const user = await seedUser({
      plan: 'STARTER',
      name: 'Nino Kapanadze',
      email: OWNER_EMAIL,
    });
    for (const slug of ['main', 'brunch', 'drinks']) {
      await seedMenu({
        userId: user.id,
        name: `${slug} menu`,
        slug,
        status: 'PUBLISHED',
        categoryCount: 1,
        productCount: 1,
      });
    }
    await loginAs(page, OWNER_EMAIL);
    await page.goto('/admin/menus');

    const banner = page.getByTestId('menus-plan-limit-banner');
    await expect(banner).toBeVisible();
    await expect(banner).toHaveAttribute('data-current-plan', 'STARTER');
    await expect(banner).toHaveAttribute('data-target-plan', 'PRO');
    await expect(banner).toContainText('STARTER');

    const createButton = page.getByTestId('menus-create-button');
    await expect(createButton).toBeDisabled();
  });

  test('functional: FREE under limit (0/1) — no banner, create enabled', async ({
    page,
  }) => {
    await seedUser({
      plan: 'FREE',
      name: 'Nino Kapanadze',
      email: OWNER_EMAIL,
    });
    await loginAs(page, OWNER_EMAIL);
    await page.goto('/admin/menus');

    await expect(page.getByTestId('menus-plan-limit-banner')).toHaveCount(0);

    const createButton = page.getByTestId('menus-create-button');
    await expect(createButton).toBeEnabled();
    // Enabled variant renders as an <a> (asChild + next/link).
    await expect(createButton).toHaveJSProperty('tagName', 'A');
    await expect(createButton).toHaveAttribute('href', '/admin/menus/new');
  });

  test('functional: PRO user with many menus — no banner', async ({
    page,
  }) => {
    const user = await seedUser({
      plan: 'PRO',
      name: 'Nino Kapanadze',
      email: OWNER_EMAIL,
    });
    for (const slug of ['main', 'brunch', 'drinks', 'kids', 'seasonal']) {
      await seedMenu({
        userId: user.id,
        name: `${slug} menu`,
        slug,
        status: 'PUBLISHED',
        categoryCount: 1,
        productCount: 1,
      });
    }
    await loginAs(page, OWNER_EMAIL);
    await page.goto('/admin/menus');

    await expect(page.getByTestId('menus-plan-limit-banner')).toHaveCount(0);
    await expect(page.getByTestId('menus-create-button')).toBeEnabled();
  });
});
