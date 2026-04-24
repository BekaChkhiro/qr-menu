// Tests for the admin menus list: T12.1 grid + T12.4 filter chips & search.
// Run:     pnpm test:e2e tests/e2e/admin/menus-list.spec.ts
// Update:  pnpm test:e2e:update tests/e2e/admin/menus-list.spec.ts
//
// Covers:
//   Visual — `menus-grid-desktop.png` (1440px, 3-column) and
//            `menus-grid-mobile.png` (iPhone 13, 1-column).
//   Functional — seeding 6 menus renders 6 cards in the grid; each card
//            exposes a link that navigates to `/admin/menus/[id]`; the
//            status pill reflects the menu's Draft/Published state; the
//            kebab opens without activating the card link.
//
//   T12.4 — filter pills show correct counts (All/Published/Draft/Archived)
//            for a seed of 3 Published + 2 Draft + 1 Archived menus; clicking
//            the Draft pill narrows the grid to 2 rows; the search input
//            filters by menu name.

import { expect, test, type Page } from '@playwright/test';

import { loginAs } from '../fixtures/auth';
import { resetDb, seedMenu, seedUser } from '../fixtures/seed';

const OWNER_EMAIL = 'nino@cafelinville.ge';

// Deterministic seed set: 6 menus with mixed Published/Draft statuses so the
// grid exercises both StatusPill tones and the footer "this week" branch.
const MENU_FIXTURES: Array<{
  name: string;
  slug: string;
  status: 'PUBLISHED' | 'DRAFT';
  categoryCount: number;
  productCount: number;
}> = [
  { name: 'Main menu — All day', slug: 'main', status: 'PUBLISHED', categoryCount: 3, productCount: 4 },
  { name: 'Brunch — Weekends', slug: 'brunch', status: 'PUBLISHED', categoryCount: 2, productCount: 3 },
  { name: 'Wine & cocktails', slug: 'drinks', status: 'PUBLISHED', categoryCount: 2, productCount: 2 },
  { name: 'Seasonal · Spring tasting', slug: 'spring-2026', status: 'DRAFT', categoryCount: 2, productCount: 2 },
  { name: 'Kids menu', slug: 'kids', status: 'DRAFT', categoryCount: 2, productCount: 2 },
  { name: 'Corporate lunch', slug: 'corporate-2024', status: 'DRAFT', categoryCount: 1, productCount: 3 },
];

// T12.4 filter/search fixtures: 3 Published + 2 Draft + 1 Archived with one
// menu ("Brunch — Weekends") whose name the search test matches on "brunch".
const T12_4_FIXTURES: Array<{
  name: string;
  slug: string;
  status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
  categoryCount: number;
  productCount: number;
}> = [
  { name: 'Main menu — All day', slug: 'main', status: 'PUBLISHED', categoryCount: 2, productCount: 2 },
  { name: 'Brunch — Weekends', slug: 'brunch', status: 'PUBLISHED', categoryCount: 2, productCount: 2 },
  { name: 'Wine & cocktails', slug: 'drinks', status: 'PUBLISHED', categoryCount: 2, productCount: 2 },
  { name: 'Seasonal · Spring tasting', slug: 'spring-2026', status: 'DRAFT', categoryCount: 1, productCount: 2 },
  { name: 'Kids menu', slug: 'kids', status: 'DRAFT', categoryCount: 1, productCount: 2 },
  { name: 'Corporate lunch', slug: 'corporate-2024', status: 'ARCHIVED', categoryCount: 1, productCount: 2 },
];

async function seedSixMenus(userId: string) {
  // Seed sequentially so slugs stay stable and createdAt ordering is predictable.
  for (const fixture of MENU_FIXTURES) {
    await seedMenu({
      userId,
      name: fixture.name,
      slug: fixture.slug,
      status: fixture.status,
      categoryCount: fixture.categoryCount,
      productCount: fixture.productCount,
    });
  }
}

async function seedAndLogin(plan: 'FREE' | 'STARTER' | 'PRO', page: Page) {
  const user = await seedUser({ plan, name: 'Nino Kapanadze', email: OWNER_EMAIL });
  await seedSixMenus(user.id);
  await loginAs(page, OWNER_EMAIL);
  return user;
}

test.describe('admin menus list grid (T12.1)', () => {
  // Serial — resetDb() in one test must not race another's seed.
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page, context }) => {
    await resetDb();
    await context.clearCookies();
    // Force English so translated strings in the card match assertions.
    await context.addCookies([
      { name: 'NEXT_LOCALE', value: 'en', domain: 'localhost', path: '/' },
    ]);
  });

  // ── Visual ───────────────────────────────────────────────────────────────

  test('visual: grid renders 6 cards on desktop (3-column at 1440px)', async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop',
      'Desktop-only snapshot; mobile snapshot covered separately',
    );

    await seedAndLogin('STARTER', page);
    await page.goto('/admin/menus');
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({
      content:
        '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }',
    });

    const grid = page.getByTestId('menus-grid');
    await expect(grid).toBeVisible();
    await expect(page.getByTestId('menu-card')).toHaveCount(6);

    await expect(grid).toHaveScreenshot('menus-grid-desktop.png', {
      maxDiffPixelRatio: 0.05,
    });
  });

  test('visual: grid collapses to 1 column on mobile', async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'mobile',
      'Mobile-only snapshot',
    );

    await seedAndLogin('STARTER', page);
    await page.goto('/admin/menus');
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({
      content:
        '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }',
    });

    const grid = page.getByTestId('menus-grid');
    await expect(grid).toBeVisible();
    await expect(page.getByTestId('menu-card')).toHaveCount(6);

    await expect(grid).toHaveScreenshot('menus-grid-mobile.png', {
      maxDiffPixelRatio: 0.05,
    });
  });

  // ── Functional ───────────────────────────────────────────────────────────

  test('functional: seeding 6 menus renders exactly 6 cards', async ({ page }) => {
    await seedAndLogin('STARTER', page);
    await page.goto('/admin/menus');

    await expect(page.getByTestId('menus-grid')).toBeVisible();
    await expect(page.getByTestId('menu-card')).toHaveCount(6);
  });

  test('functional: card click navigates to /admin/menus/[id]', async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop',
      'Desktop-only; mobile nav is covered by T17.x',
    );

    await seedAndLogin('STARTER', page);
    await page.goto('/admin/menus');

    const firstCard = page.getByTestId('menu-card').first();
    await expect(firstCard).toBeVisible();

    const href = await firstCard
      .getByTestId('menu-card-link')
      .getAttribute('href');
    expect(href).toMatch(/^\/admin\/menus\/[a-zA-Z0-9_-]+$/);

    await firstCard.getByTestId('menu-card-link').click();
    await page.waitForURL(/\/admin\/menus\/[a-zA-Z0-9_-]+(\/?|\?.*)?$/);
    expect(page.url()).toMatch(/\/admin\/menus\/[a-zA-Z0-9_-]+/);
    expect(page.url()).not.toMatch(/\/admin\/menus\/?$/);
  });

  test('functional: StatusPill reflects DRAFT vs PUBLISHED', async ({ page }) => {
    await seedAndLogin('STARTER', page);
    await page.goto('/admin/menus');

    const cards = page.getByTestId('menu-card');
    await expect(cards).toHaveCount(6);

    // We seeded 3 Published + 3 Draft; the StatusPill text is hardcoded
    // (not translated), so we can assert counts directly.
    await expect(page.getByText('Published', { exact: true })).toHaveCount(3);
    await expect(page.getByText('Draft', { exact: true })).toHaveCount(3);
  });

  test('functional: opening the kebab does not activate the card link', async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop',
      'Desktop-only; the mobile product drawer has its own test in T17.4',
    );

    await seedAndLogin('STARTER', page);
    await page.goto('/admin/menus');

    const firstCard = page.getByTestId('menu-card').first();
    const kebab = firstCard.getByTestId('menu-card-kebab');
    await expect(kebab).toBeVisible();

    const startingUrl = page.url();
    await kebab.click();

    // URL must be unchanged — the card link beneath the kebab should not fire.
    expect(page.url()).toBe(startingUrl);

    // The menu should be open (at least one Edit item is now visible).
    await expect(page.getByRole('menuitem').first()).toBeVisible();
  });
});

// ── T12.4 — Filter chips + search ────────────────────────────────────────────

async function seedT12_4AndLogin(page: Page) {
  const user = await seedUser({
    plan: 'STARTER',
    name: 'Nino Kapanadze',
    email: OWNER_EMAIL,
  });
  for (const fixture of T12_4_FIXTURES) {
    await seedMenu({
      userId: user.id,
      name: fixture.name,
      slug: fixture.slug,
      status: fixture.status,
      categoryCount: fixture.categoryCount,
      productCount: fixture.productCount,
    });
  }
  await loginAs(page, OWNER_EMAIL);
  return user;
}

test.describe('admin menus list — filter chips + search (T12.4)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page, context }) => {
    test.skip(
      test.info().project.name !== 'desktop',
      'Filter + search is desktop-first; mobile layout is covered by T17.x.',
    );
    await resetDb();
    await context.clearCookies();
    await context.addCookies([
      { name: 'NEXT_LOCALE', value: 'en', domain: 'localhost', path: '/' },
    ]);
  });

  test('functional: filter pills show correct counts for 3P/2D/1A seed', async ({
    page,
  }) => {
    await seedT12_4AndLogin(page);
    await page.goto('/admin/menus');

    await expect(page.getByTestId('menus-grid')).toBeVisible();
    await expect(page.getByTestId('menu-card')).toHaveCount(6);

    await expect(page.getByTestId('menus-filter-all')).toContainText('6');
    await expect(page.getByTestId('menus-filter-published')).toContainText('3');
    await expect(page.getByTestId('menus-filter-draft')).toContainText('2');
    await expect(page.getByTestId('menus-filter-archived')).toContainText('1');

    // Default is "All" and it reflects aria-checked.
    await expect(page.getByTestId('menus-filter-all')).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  test('functional: clicking Draft filters the grid to the 2 draft menus', async ({
    page,
  }) => {
    await seedT12_4AndLogin(page);
    await page.goto('/admin/menus');

    await page.getByTestId('menus-filter-draft').click();

    const cards = page.getByTestId('menu-card');
    await expect(cards).toHaveCount(2);

    await expect(cards.filter({ hasText: 'Seasonal · Spring tasting' })).toHaveCount(1);
    await expect(cards.filter({ hasText: 'Kids menu' })).toHaveCount(1);

    await expect(page.getByTestId('menus-filter-draft')).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  test('functional: clicking Archived filters to the 1 archived menu', async ({
    page,
  }) => {
    await seedT12_4AndLogin(page);
    await page.goto('/admin/menus');

    await page.getByTestId('menus-filter-archived').click();

    const cards = page.getByTestId('menu-card');
    await expect(cards).toHaveCount(1);
    await expect(cards.first()).toContainText('Corporate lunch');
  });

  test('functional: search "brunch" narrows the grid to the matching menu', async ({
    page,
  }) => {
    await seedT12_4AndLogin(page);
    await page.goto('/admin/menus');

    const search = page.getByTestId('menus-search');
    await search.fill('brunch');

    const cards = page.getByTestId('menu-card');
    await expect(cards).toHaveCount(1);
    await expect(cards.first()).toContainText('Brunch — Weekends');
  });

  test('functional: search is case-insensitive and matches substrings', async ({
    page,
  }) => {
    await seedT12_4AndLogin(page);
    await page.goto('/admin/menus');

    const search = page.getByTestId('menus-search');
    await search.fill('MENU'); // Uppercase — should match "Main menu", "Kids menu".

    const cards = page.getByTestId('menu-card');
    await expect(cards).toHaveCount(2);
  });

  test('functional: filter + search compose — Draft pill + "kids" narrows to 1', async ({
    page,
  }) => {
    await seedT12_4AndLogin(page);
    await page.goto('/admin/menus');

    await page.getByTestId('menus-filter-draft').click();
    await page.getByTestId('menus-search').fill('kids');

    const cards = page.getByTestId('menu-card');
    await expect(cards).toHaveCount(1);
    await expect(cards.first()).toContainText('Kids menu');
  });

  test('functional: no-results state appears when filters exclude every menu', async ({
    page,
  }) => {
    await seedT12_4AndLogin(page);
    await page.goto('/admin/menus');

    await page.getByTestId('menus-search').fill('does-not-exist-xyz');

    await expect(page.getByTestId('menu-card')).toHaveCount(0);
    await expect(page.getByTestId('menus-no-results')).toBeVisible();
  });

  test('functional: filter carries over when switching to table view', async ({
    page,
  }) => {
    await seedT12_4AndLogin(page);
    await page.goto('/admin/menus');

    await page.getByTestId('menus-filter-draft').click();
    await page.getByTestId('menus-view-toggle-table').click();

    // Table view renders filtered menus — still 2 Draft rows.
    const rows = page.getByTestId('menus-table-row');
    await expect(rows).toHaveCount(2);
  });
});
