// Test for T11.2 Admin TopBar.
// Run:     pnpm test:e2e tests/e2e/admin/top-bar.spec.ts
// Update:  pnpm test:e2e:update tests/e2e/admin/top-bar.spec.ts
//
// Covers:
//   Visual — default state and with-unread state (from a showcase page, no auth).
//   Functional — breadcrumbs reflect current route; ⌘K opens the command
//   palette; Escape closes it; the search button also opens the palette;
//   palette items navigate; the avatar dropdown opens, shows user identity,
//   navigates to Settings, and closes on Escape.

import { expect, test } from '@playwright/test';

import { loginAs } from '../fixtures/auth';
import { resetDb, seedUser } from '../fixtures/seed';

const SHOWCASE_URL = '/test/components/top-bar';

// The app defaults to Georgian (`ka`). Force English via the NEXT_LOCALE
// cookie so assertions match translated strings in admin.json/en.
const LOCALE_COOKIE = {
  name: 'NEXT_LOCALE',
  value: 'en',
  domain: 'localhost',
  path: '/',
};

test.describe('admin top bar (T11.2)', () => {
  test.beforeEach(async ({ page, context }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop',
      'Desktop-only topbar for now; mobile variant lands in T17.x',
    );
    await context.addCookies([LOCALE_COOKIE]);
  });

  // ── Visual baselines (showcase page, no auth required) ─────────────────

  test.describe('visual', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(SHOWCASE_URL, { waitUntil: 'domcontentloaded' });
      await expect(page.getByTestId('admin-topbar-showcase')).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      await page.addStyleTag({
        content:
          '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }',
      });
    });

    test('visual: default TopBar (no unread dot)', async ({ page }, testInfo) => {
      const frame = page.getByTestId('topbar-default-frame');
      await expect(frame).toBeVisible();
      // The unread dot must be absent in the default variant.
      await expect(
        frame.getByTestId('topbar-notifications-dot'),
      ).toHaveCount(0);
      await expect(frame).toHaveScreenshot(
        `top-bar-default-${testInfo.project.name}.png`,
        { maxDiffPixelRatio: 0.05 },
      );
    });

    test('visual: TopBar with unread notifications dot', async ({ page }, testInfo) => {
      const frame = page.getByTestId('topbar-unread-frame');
      await expect(frame).toBeVisible();
      await expect(
        frame.getByTestId('topbar-notifications-dot'),
      ).toBeVisible();
      await expect(frame).toHaveScreenshot(
        `top-bar-with-unread-${testInfo.project.name}.png`,
        { maxDiffPixelRatio: 0.05 },
      );
    });
  });

  // ── Functional (real admin route, authenticated) ───────────────────────

  test.describe('authenticated admin', () => {
    test.describe.configure({ mode: 'serial' });

    test.beforeEach(async ({ page, context }) => {
      await resetDb();
      await page.context().clearCookies();
      // clearCookies() wipes the locale cookie set by the outer beforeEach;
      // put it back so /admin renders English strings.
      await context.addCookies([LOCALE_COOKIE]);
      await seedUser({
        plan: 'STARTER',
        name: 'Nino Kapanadze',
        email: 'nino@cafelinville.ge',
      });
      await loginAs(page, 'nino@cafelinville.ge');
    });

    test('functional: topbar renders on /admin/dashboard with correct crumbs', async ({
      page,
    }) => {
      await page.goto('/admin/dashboard');
      await expect(page.getByTestId('admin-topbar')).toBeVisible();

      const crumbs = page.getByTestId('topbar-breadcrumbs');
      await expect(crumbs).toContainText('Dashboard');
    });

    test('functional: breadcrumbs update when navigating to /admin/menus', async ({
      page,
    }) => {
      await page.goto('/admin/dashboard');
      await expect(page.getByTestId('topbar-breadcrumbs')).toContainText(
        'Dashboard',
      );

      await page.goto('/admin/menus');
      const crumbs = page.getByTestId('topbar-breadcrumbs');
      await expect(crumbs).toContainText('Dashboard');
      await expect(crumbs).toContainText('Menus');
    });

    test('functional: ⌘K opens the command palette, Escape closes it', async ({
      page,
    }) => {
      await page.goto('/admin/dashboard');

      // Palette is closed → portal content is not in the DOM.
      await expect(page.getByTestId('command-palette-list')).toHaveCount(0);

      // Ctrl+K works cross-platform (the hook checks both ctrlKey and metaKey).
      await page.keyboard.press('Control+k');
      await expect(page.getByTestId('command-palette-list')).toBeVisible();

      await page.keyboard.press('Escape');
      await expect(page.getByTestId('command-palette-list')).toHaveCount(0);
    });

    test('functional: clicking the search button opens the palette', async ({
      page,
    }) => {
      await page.goto('/admin/dashboard');

      await expect(page.getByTestId('command-palette-list')).toHaveCount(0);
      await page.getByTestId('topbar-search').click();
      await expect(page.getByTestId('command-palette-list')).toBeVisible();

      // Input is auto-focused on open so the user can start typing.
      await expect(page.getByTestId('command-palette-input')).toBeFocused();
    });

    test('functional: palette "Menus" item navigates to /admin/menus', async ({
      page,
    }) => {
      await page.goto('/admin/dashboard');
      await page.getByTestId('topbar-search').click();
      await expect(page.getByTestId('command-palette-list')).toBeVisible();

      await page.getByTestId('command-palette-nav-menus').click();
      await expect(page).toHaveURL(/\/admin\/menus(\/|$)/);
      // Palette closes on select.
      await expect(page.getByTestId('command-palette-list')).toHaveCount(0);
    });

    test('functional: avatar dropdown opens, shows identity, navigates to Settings', async ({
      page,
    }) => {
      await page.goto('/admin/dashboard');

      // Menu content is rendered via Radix Portal only while open.
      await expect(page.getByTestId('topbar-user-menu')).toHaveCount(0);

      await page.getByTestId('topbar-user-trigger').click();
      const menu = page.getByTestId('topbar-user-menu');
      await expect(menu).toBeVisible();
      await expect(menu).toContainText('Nino Kapanadze');
      await expect(menu).toContainText('nino@cafelinville.ge');
      await expect(menu).toContainText('STARTER');

      await page.getByTestId('topbar-user-menu-settings').click();
      await expect(page).toHaveURL(/\/admin\/settings(\/|$)/);
      await expect(page.getByTestId('topbar-user-menu')).toHaveCount(0);
    });

    test('functional: avatar dropdown closes on Escape', async ({ page }) => {
      await page.goto('/admin/dashboard');

      await page.getByTestId('topbar-user-trigger').click();
      await expect(page.getByTestId('topbar-user-menu')).toBeVisible();

      await page.keyboard.press('Escape');
      await expect(page.getByTestId('topbar-user-menu')).toHaveCount(0);
    });

    test('functional: avatar shows user initials (NK for Nino Kapanadze)', async ({
      page,
    }) => {
      await page.goto('/admin/dashboard');
      await expect(page.getByTestId('topbar-user-trigger')).toHaveText('NK');
    });
  });
});
