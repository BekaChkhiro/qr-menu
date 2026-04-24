// Test for T11.3 AdminShell Layout.
// Run:     pnpm test:e2e tests/e2e/admin/shell.spec.ts
// Update:  pnpm test:e2e:update tests/e2e/admin/shell.spec.ts
//
// Covers:
//   Visual — authenticated admin shell on STARTER plan (sidebar + topbar + main).
//   Functional — unauthenticated users are redirected to /login; authenticated
//   users see the shell; the shell persists across admin routes (sidebar and
//   topbar stay mounted while main swaps); the content area uses the Section H
//   page bg (#FAFAF9) with 24px padding and exposes a skip-to-content target.

import { expect, test } from '@playwright/test';

import { loginAs } from '../fixtures/auth';
import { resetDb, seedMenu, seedUser } from '../fixtures/seed';

// Desktop-only for now; mobile bottom-tab-bar ships with T17.1.
test.describe('admin shell (T11.3)', () => {
  // Serial so resetDb() in one test can't race another's seed.
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page, context }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop',
      'Desktop-only shell; mobile variant lands in T17.x',
    );
    await resetDb();
    await context.clearCookies();
    // Force English so breadcrumb strings match our assertions.
    await context.addCookies([
      { name: 'NEXT_LOCALE', value: 'en', domain: 'localhost', path: '/' },
    ]);
  });

  async function seedAndLogin(
    plan: 'FREE' | 'STARTER' | 'PRO',
    page: Parameters<typeof loginAs>[0],
  ) {
    const email = 'nino@cafelinville.ge';
    const user = await seedUser({ plan, name: 'Nino Kapanadze', email });
    await seedMenu({
      userId: user.id,
      status: 'PUBLISHED',
      categoryCount: 2,
      productCount: 3,
    });
    await loginAs(page, email);
    return user;
  }

  // ── Visual ───────────────────────────────────────────────────────────────

  test('visual: admin shell (STARTER, dashboard)', async ({ page }, testInfo) => {
    await seedAndLogin('STARTER', page);
    await page.goto('/admin/dashboard');
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({
      content:
        '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }',
    });

    const shell = page.getByTestId('admin-shell');
    await expect(shell).toBeVisible();
    await expect(page.getByTestId('admin-sidebar')).toBeVisible();
    await expect(page.getByTestId('admin-topbar')).toBeVisible();
    await expect(page.getByTestId('admin-main')).toBeVisible();

    await expect(shell).toHaveScreenshot(
      `admin-shell-starter-${testInfo.project.name}.png`,
      { maxDiffPixelRatio: 0.05 },
    );
  });

  // ── Functional ───────────────────────────────────────────────────────────

  test('functional: unauthenticated user redirected to /login', async ({ page }) => {
    // No login — session cookie is absent.
    const response = await page.goto('/admin/dashboard');
    // The redirect may happen server-side (status 307) or client-side after
    // the RSC resolves. Either way the URL must settle on /login.
    await page.waitForURL(/\/login(\?|$)/);
    expect(page.url()).toMatch(/\/login/);
    // Shell must not have rendered.
    await expect(page.getByTestId('admin-shell')).toHaveCount(0);
    // Spread `response` use so TS doesn't warn about the unused binding.
    void response;
  });

  test('functional: authenticated user sees shell regions', async ({ page }) => {
    await seedAndLogin('STARTER', page);
    await page.goto('/admin/dashboard');

    await expect(page.getByTestId('admin-shell')).toBeVisible();
    await expect(page.getByTestId('admin-sidebar')).toBeVisible();
    await expect(page.getByTestId('admin-topbar')).toBeVisible();

    const main = page.getByTestId('admin-main');
    await expect(main).toBeVisible();
    // Skip-to-content target must exist and be a main landmark.
    await expect(main).toHaveAttribute('id', 'main-content');
    await expect(main).toHaveAttribute('tabindex', '-1');
    expect(await main.evaluate((el) => el.tagName.toLowerCase())).toBe('main');
  });

  test('functional: main area uses Section H page bg (#FAFAF9) + 24px padding', async ({
    page,
  }) => {
    await seedAndLogin('STARTER', page);
    await page.goto('/admin/dashboard');

    const main = page.getByTestId('admin-main');
    const styles = await main.evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        bg: cs.backgroundColor,
        pt: cs.paddingTop,
        pr: cs.paddingRight,
        pb: cs.paddingBottom,
        pl: cs.paddingLeft,
      };
    });

    // 24px padding on all sides (p-6 in Tailwind).
    expect(styles.pt).toBe('24px');
    expect(styles.pr).toBe('24px');
    expect(styles.pb).toBe('24px');
    expect(styles.pl).toBe('24px');

    // --bg = 40 14% 98% → rgb(251, 251, 249) / #FBFBF9 (close to #FAFAF9).
    // Accept a small rounding window from HSL→RGB conversion.
    const rgb = styles.bg.match(/\d+/g)?.map(Number) ?? [];
    expect(rgb).toHaveLength(3);
    for (const channel of rgb) {
      expect(channel).toBeGreaterThanOrEqual(247);
      expect(channel).toBeLessThanOrEqual(253);
    }
  });

  test('functional: shell persists across admin routes', async ({ page }) => {
    await seedAndLogin('STARTER', page);
    await page.goto('/admin/dashboard');

    const sidebar = page.getByTestId('admin-sidebar');
    const topbar = page.getByTestId('admin-topbar');
    await expect(sidebar).toBeVisible();
    await expect(topbar).toBeVisible();

    // Grab a stable handle to the sidebar root so we can confirm it is NOT
    // torn down during client-side navigation.
    const sidebarHandle = await sidebar.elementHandle();
    expect(sidebarHandle).not.toBeNull();

    await page.getByTestId('sidebar-nav-menus').click();
    await expect(page).toHaveURL(/\/admin\/menus(\b|\/)/);

    // Sidebar + topbar still mounted after navigating.
    await expect(page.getByTestId('admin-sidebar')).toBeVisible();
    await expect(page.getByTestId('admin-topbar')).toBeVisible();

    // Same DOM node — Next.js shared layout preserves the shell.
    const stillAttached = await sidebarHandle!.evaluate((el) =>
      document.body.contains(el),
    );
    expect(stillAttached).toBe(true);
  });
});
