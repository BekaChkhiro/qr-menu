// Test for T12.2 — Menus List: Table View + View Toggle.
// Run:     pnpm test:e2e tests/e2e/admin/menus-table.spec.ts
// Update:  pnpm test:e2e:update tests/e2e/admin/menus-table.spec.ts
//
// Covers:
//   Visual — `menus-table.png` (1440px table with 6 rows, Views 7d column,
//            StatusPill, kebab icons).
//   Functional — view toggle switches grid ↔ table; the choice persists
//            across reloads via localStorage; sort by "Views 7d" reorders
//            the three published menus desc, then asc.

import { expect, test, type Page } from '@playwright/test';

import { loginAs } from '../fixtures/auth';
import {
  resetDb,
  seedMenu,
  seedMenuViews,
  seedUser,
} from '../fixtures/seed';

const OWNER_EMAIL = 'nino@cafelinville.ge';

// Deterministic view counts so the sort assertion is stable. We seed 1-day
// windows (all viewedAt inside the 7-day window) so viewsLast7Days maps 1:1
// to viewsPerDay.
const MENU_FIXTURES: Array<{
  name: string;
  slug: string;
  status: 'PUBLISHED' | 'DRAFT';
  categoryCount: number;
  productCount: number;
  views7d?: number;
}> = [
  { name: 'Main menu — All day',       slug: 'main',           status: 'PUBLISHED', categoryCount: 3, productCount: 4, views7d: 420 },
  { name: 'Brunch — Weekends',         slug: 'brunch',         status: 'PUBLISHED', categoryCount: 2, productCount: 3, views7d: 180 },
  { name: 'Wine & cocktails',          slug: 'drinks',         status: 'PUBLISHED', categoryCount: 2, productCount: 2, views7d: 60  },
  { name: 'Seasonal · Spring tasting', slug: 'spring-2026',    status: 'DRAFT',     categoryCount: 2, productCount: 2 },
  { name: 'Kids menu',                 slug: 'kids',           status: 'DRAFT',     categoryCount: 2, productCount: 2 },
  { name: 'Corporate lunch',           slug: 'corporate-2024', status: 'DRAFT',     categoryCount: 1, productCount: 3 },
];

async function seedSixMenus(userId: string) {
  for (const fixture of MENU_FIXTURES) {
    const menu = await seedMenu({
      userId,
      name: fixture.name,
      slug: fixture.slug,
      status: fixture.status,
      categoryCount: fixture.categoryCount,
      productCount: fixture.productCount,
    });
    if (fixture.views7d) {
      // Views spread across a single day keeps the whole count inside the
      // 7-day window the API filters by.
      await seedMenuViews({
        menuId: menu.id,
        days: 1,
        viewsPerDay: fixture.views7d,
      });
    }
  }
}

async function seedAndLogin(plan: 'FREE' | 'STARTER' | 'PRO', page: Page) {
  const user = await seedUser({ plan, name: 'Nino Kapanadze', email: OWNER_EMAIL });
  await seedSixMenus(user.id);
  await loginAs(page, OWNER_EMAIL);
  return user;
}

test.describe('admin menus list table (T12.2)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page, context }) => {
    await resetDb();
    await context.clearCookies();
    await context.addCookies([
      { name: 'NEXT_LOCALE', value: 'en', domain: 'localhost', path: '/' },
    ]);
  });

  // ── Visual ───────────────────────────────────────────────────────────────

  test('visual: table renders 6 rows on desktop', async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop',
      'Desktop-only snapshot; table collapses to a mobile layout in T17.x',
    );

    await seedAndLogin('STARTER', page);
    await page.goto('/admin/menus');
    await page.getByTestId('menus-view-toggle-table').click();
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({
      content:
        '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }',
    });

    const table = page.getByTestId('menus-table');
    await expect(table).toBeVisible();
    await expect(page.getByTestId('menus-table-row')).toHaveCount(6);

    await expect(table).toHaveScreenshot('menus-table-desktop.png', {
      maxDiffPixelRatio: 0.05,
    });
  });

  // ── Functional ───────────────────────────────────────────────────────────

  test('functional: toggle switches view between grid and table', async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop',
      'Desktop-only; the mobile shell gets a dedicated view in T17.x',
    );

    await seedAndLogin('STARTER', page);
    await page.goto('/admin/menus');

    // Initial view is grid.
    await expect(page.getByTestId('menus-grid')).toBeVisible();
    await expect(page.getByTestId('menus-table')).toHaveCount(0);

    await page.getByTestId('menus-view-toggle-table').click();

    await expect(page.getByTestId('menus-table')).toBeVisible();
    await expect(page.getByTestId('menus-grid')).toHaveCount(0);
    await expect(page.getByTestId('menus-table-row')).toHaveCount(6);

    await page.getByTestId('menus-view-toggle-grid').click();
    await expect(page.getByTestId('menus-grid')).toBeVisible();
    await expect(page.getByTestId('menus-table')).toHaveCount(0);
  });

  test('functional: view preference persists to localStorage across reloads', async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop',
      'Desktop-only; see T17.x for the mobile equivalent',
    );

    await seedAndLogin('STARTER', page);
    await page.goto('/admin/menus');

    await page.getByTestId('menus-view-toggle-table').click();
    await expect(page.getByTestId('menus-table')).toBeVisible();

    const stored = await page.evaluate(() =>
      window.localStorage.getItem('dm.admin.menus.view'),
    );
    expect(stored).toBe('table');

    await page.reload();
    await expect(page.getByTestId('menus-table')).toBeVisible();
    await expect(page.getByTestId('menus-grid')).toHaveCount(0);
  });

  test('functional: sort by Views 7d reorders rows desc then asc', async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop',
      'Desktop-only; sort headers re-render as filter chips on mobile (T17.x)',
    );

    await seedAndLogin('STARTER', page);
    await page.goto('/admin/menus');
    await page.getByTestId('menus-view-toggle-table').click();
    await expect(page.getByTestId('menus-table-row')).toHaveCount(6);

    const sortBtn = page.getByTestId('menus-table-sort-views');
    // First click: asc (smallest views7d first → drafts with 0 views first,
    // then published menus ordered 60 → 180 → 420).
    await sortBtn.click();
    await expect(sortBtn).toHaveAttribute('aria-sort', 'ascending');

    const ascViews = await page
      .getByTestId('menus-table-views')
      .allTextContents();
    // Filter out placeholder ("—") rows and parse numeric values.
    const ascNumbers = ascViews
      .filter((v) => v.trim() !== '—')
      .map((v) => parseInt(v.replace(/[^0-9]/g, ''), 10));
    expect(ascNumbers).toEqual([60, 180, 420]);

    // Second click: desc — the three published menus flip to 420 → 180 → 60.
    await sortBtn.click();
    await expect(sortBtn).toHaveAttribute('aria-sort', 'descending');

    const descViews = await page
      .getByTestId('menus-table-views')
      .allTextContents();
    const descNumbers = descViews
      .filter((v) => v.trim() !== '—')
      .map((v) => parseInt(v.replace(/[^0-9]/g, ''), 10));
    expect(descNumbers).toEqual([420, 180, 60]);
  });

  test('functional: row click navigates to /admin/menus/[id]', async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop',
      'Desktop-only; mobile uses bottom-sheet navigation (T17.x)',
    );

    await seedAndLogin('STARTER', page);
    await page.goto('/admin/menus');
    await page.getByTestId('menus-view-toggle-table').click();

    const firstRow = page.getByTestId('menus-table-row').first();
    await expect(firstRow).toBeVisible();

    await firstRow.click();
    await page.waitForURL(/\/admin\/menus\/[a-zA-Z0-9_-]+(\/?|\?.*)?$/);
    expect(page.url()).toMatch(/\/admin\/menus\/[a-zA-Z0-9_-]+/);
    expect(page.url()).not.toMatch(/\/admin\/menus\/?$/);
  });

  test('functional: kebab opens without triggering row navigation', async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop',
      'Desktop-only; mobile kebab behavior is covered by T17.x',
    );

    await seedAndLogin('STARTER', page);
    await page.goto('/admin/menus');
    await page.getByTestId('menus-view-toggle-table').click();

    const firstRow = page.getByTestId('menus-table-row').first();
    const kebab = firstRow.getByTestId('menus-table-kebab');
    await expect(kebab).toBeVisible();

    const startingUrl = page.url();
    await kebab.click();

    // Stopped propagation → the row's navigation handler should not fire.
    expect(page.url()).toBe(startingUrl);
    await expect(page.getByRole('menuitem').first()).toBeVisible();
  });
});
