// Test for T17.2 — Dashboard Responsive (mobile).
// Run:     pnpm test:e2e tests/e2e/admin/dashboard-mobile.spec.ts
// Update:  pnpm test:e2e:update tests/e2e/admin/dashboard-mobile.spec.ts
//
// Covers:
//   Visual — full-page mobile dashboard on iPhone 13 viewport.
//   Functional — every widget renders without horizontal page scroll; plan
//   usage strip lays out as a 2×2 grid; YourMenusCard hides desktop column
//   headers and renders rows in a flex (non-grid) layout.

import { expect, test } from '@playwright/test';

import { loginAs } from '../fixtures/auth';
import { resetDb, seedMenu, seedUser } from '../fixtures/seed';

test.describe('admin dashboard mobile (T17.2)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page, context }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'mobile',
      'Mobile-only dashboard tests; desktop variant lives in dashboard.spec.ts',
    );
    await resetDb();
    await context.clearCookies();
    await context.addCookies([
      { name: 'NEXT_LOCALE', value: 'en', domain: 'localhost', path: '/' },
    ]);
    // Hide TanStack Query devtools button so it never overlays widgets.
    await page.addStyleTag({
      content: '.tsqd-parent-container { display: none !important; }',
    });
  });

  async function seedAndLogin(
    plan: 'FREE' | 'STARTER' | 'PRO',
    page: Parameters<typeof loginAs>[0],
    menus = 2,
  ) {
    const email = 'nino@cafelinville.ge';
    const user = await seedUser({ plan, name: 'Nino Kapanadze', email });
    for (let i = 0; i < menus; i++) {
      await seedMenu({
        userId: user.id,
        status: 'PUBLISHED',
        categoryCount: 2,
        productCount: 3,
        slug: `cafe-${plan.toLowerCase()}-${i}`,
      });
    }
    await loginAs(page, email);
    return user;
  }

  async function stabilize(page: import('@playwright/test').Page) {
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({
      content:
        '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }',
    });
  }

  // ── Visual ────────────────────────────────────────────────────────────────

  test('visual: dashboard on mobile (STARTER, 2 menus)', async (
    { page },
    testInfo,
  ) => {
    await seedAndLogin('STARTER', page, 2);
    await page.goto('/admin/dashboard');
    await stabilize(page);

    await expect(page.getByTestId('dashboard-welcome')).toBeVisible();
    await expect(page.getByTestId('plan-usage-strip')).toBeVisible();

    const main = page.getByTestId('admin-main');
    await expect(main).toHaveScreenshot(
      `dashboard-mobile-starter-${testInfo.project.name}.png`,
      { maxDiffPixelRatio: 0.05, fullPage: true },
    );
  });

  // ── Functional ────────────────────────────────────────────────────────────

  test('functional: page has no horizontal overflow', async ({ page }) => {
    await seedAndLogin('STARTER', page, 2);
    await page.goto('/admin/dashboard');
    await stabilize(page);

    // The body / main scroll container must not scroll horizontally on mobile.
    const overflow = await page.evaluate(() => {
      const main = document.querySelector(
        '[data-testid="admin-main"]',
      ) as HTMLElement | null;
      const body = document.body;
      return {
        bodyScroll: body.scrollWidth - body.clientWidth,
        mainScroll: main ? main.scrollWidth - main.clientWidth : 0,
      };
    });

    expect(overflow.bodyScroll).toBeLessThanOrEqual(1);
    expect(overflow.mainScroll).toBeLessThanOrEqual(1);
  });

  test('functional: plan usage strip uses 2×2 grid on mobile', async ({
    page,
  }) => {
    await seedAndLogin('STARTER', page, 1);
    await page.goto('/admin/dashboard');
    await stabilize(page);

    const strip = page.getByTestId('plan-usage-strip');
    await expect(strip).toBeVisible();

    const cards = strip.locator('[data-testid^="usage-card-"]');
    await expect(cards).toHaveCount(4);

    // Read the bounding box of all four cards. On a 2×2 grid we expect:
    //   menus + categories share top row (same y), products + storage share bottom row.
    const boxes = await cards.evaluateAll((els) =>
      (els as HTMLElement[]).map((el) => {
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width };
      }),
    );

    // Two distinct rows.
    const ys = [...new Set(boxes.map((b) => Math.round(b.y)))];
    expect(ys).toHaveLength(2);

    // Each row contains exactly two cards.
    const top = boxes.filter((b) => Math.round(b.y) === ys[0]);
    const bottom = boxes.filter((b) => Math.round(b.y) === ys[1]);
    expect(top).toHaveLength(2);
    expect(bottom).toHaveLength(2);
  });

  test('functional: your-menus card hides desktop column headers and uses simplified rows', async ({
    page,
  }) => {
    await seedAndLogin('STARTER', page, 2);
    await page.goto('/admin/dashboard');
    await stabilize(page);

    const section = page.getByTestId('dashboard-your-menus');
    await expect(section).toBeVisible();

    // Column header role="row" should be hidden on mobile.
    const colHeader = section.locator('[role="row"]').first();
    await expect(colHeader).toBeHidden();

    // Rows should render with flex layout (display !== "grid") on mobile.
    const firstRow = section.getByTestId('dashboard-menus-row').first();
    await expect(firstRow).toBeVisible();
    const display = await firstRow.evaluate(
      (el) => getComputedStyle(el).display,
    );
    expect(display).toBe('flex');
  });

  test('functional: all dashboard widgets are visible on mobile', async ({
    page,
  }) => {
    await seedAndLogin('STARTER', page, 2);
    await page.goto('/admin/dashboard');
    await stabilize(page);

    await expect(page.getByTestId('dashboard-welcome')).toBeVisible();
    await expect(page.getByTestId('plan-usage-strip')).toBeVisible();
    await expect(page.getByTestId('dashboard-analytics-card')).toBeVisible();
    await expect(page.getByTestId('dashboard-device-breakdown')).toBeVisible();
    await expect(page.getByTestId('dashboard-your-menus')).toBeVisible();
  });
});
