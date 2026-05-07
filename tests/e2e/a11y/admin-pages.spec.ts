// T17.6 — Accessibility Audit (WCAG AA).
// Run:     pnpm test:e2e tests/e2e/a11y/admin-pages.spec.ts
// Update:  not applicable — pure functional axe-core scans, no screenshots.
//
// Covers:
//   Every authenticated admin surface — dashboard, menus list, menu editor
//   (all 7 tabs), product drawer, and every settings tab — must report
//   ZERO axe-core violations at WCAG 2.1 Level AA.
//
//   The suite runs on the `desktop` Playwright project only. Mobile
//   variants reuse the same components and would re-test the same rules,
//   so we keep CI lean by skipping the iPhone 13 viewport.

import { expect, test, type Page } from '@playwright/test';

import { loginAs } from '../fixtures/auth';
import { resetDb, seedMenu, seedUser } from '../fixtures/seed';

import { axeCheck, stabilize } from './axe-helper';

const OWNER_EMAIL = 'nino@cafelinville.ge';

test.describe('a11y: admin pages (T17.6)', () => {
  // NOTE: deliberately NOT `serial`. Each test wipes + reseeds the DB in
  // beforeEach, so they're already isolated — and `serial` would skip
  // remaining audits as soon as one violation surfaces, defeating the
  // point of an audit sweep. Run with `--workers=1` to avoid the
  // resetDb() race parallel workers would create.

  test.beforeEach(async ({ context }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop',
      'Desktop-only sweep; mobile variants reuse the same components.',
    );
    await resetDb();
    await context.clearCookies();
    await context.addCookies([
      { name: 'NEXT_LOCALE', value: 'en', domain: 'localhost', path: '/' },
    ]);
  });

  async function seedAndLogin(
    page: Page,
    plan: 'FREE' | 'STARTER' | 'PRO' = 'STARTER',
  ) {
    const user = await seedUser({
      plan,
      name: 'Nino Kapanadze',
      email: OWNER_EMAIL,
    });
    const menu = await seedMenu({
      userId: user.id,
      status: 'PUBLISHED',
      categoryCount: 2,
      productCount: 2,
      name: 'Café Linville — Dinner',
    });
    await loginAs(page, OWNER_EMAIL);
    return { user, menu };
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────

  test('a11y: /admin/dashboard (STARTER)', async ({ page }) => {
    await seedAndLogin(page, 'STARTER');
    await page.goto('/admin/dashboard');
    await expect(page.getByTestId('admin-shell')).toBeVisible();
    await stabilize(page);
    await axeCheck(page, { context: '/admin/dashboard' });
  });

  test('a11y: /admin/dashboard (FREE empty)', async ({ page }) => {
    const user = await seedUser({
      plan: 'FREE',
      name: 'Nino Kapanadze',
      email: OWNER_EMAIL,
    });
    void user;
    await loginAs(page, OWNER_EMAIL);
    await page.goto('/admin/dashboard');
    await expect(page.getByTestId('admin-shell')).toBeVisible();
    await stabilize(page);
    await axeCheck(page, { context: '/admin/dashboard (FREE empty)' });
  });

  // ── Menus list ────────────────────────────────────────────────────────────

  test('a11y: /admin/menus (grid)', async ({ page }) => {
    await seedAndLogin(page, 'STARTER');
    await page.goto('/admin/menus');
    await expect(page.getByTestId('admin-shell')).toBeVisible();
    await stabilize(page);
    await axeCheck(page, { context: '/admin/menus' });
  });

  // ── Menu editor — every tab ──────────────────────────────────────────────

  const EDITOR_TABS = [
    'content',
    'branding',
    'languages',
    'analytics',
    'promotions',
    'qr',
    'settings',
  ] as const;

  for (const tab of EDITOR_TABS) {
    test(`a11y: /admin/menus/[id]?tab=${tab}`, async ({ page }) => {
      const { menu } = await seedAndLogin(page, 'STARTER');
      await page.goto(`/admin/menus/${menu.id}?tab=${tab}`);
      await expect(page.getByTestId('admin-shell')).toBeVisible();
      await stabilize(page);
      await axeCheck(page, { context: `editor tab=${tab}` });
    });
  }

  // PRO unlocks Analytics + Allergens, which removes the locked overlay
  // and exposes additional interactive controls. Re-scan those tabs on
  // PRO so we cover the unlocked branches too.
  test('a11y: editor analytics tab (PRO unlocked)', async ({ page }) => {
    const { menu } = await seedAndLogin(page, 'PRO');
    await page.goto(`/admin/menus/${menu.id}?tab=analytics`);
    await expect(page.getByTestId('admin-shell')).toBeVisible();
    await stabilize(page);
    await axeCheck(page, { context: 'editor analytics (PRO)' });
  });

  // ── Product drawer ───────────────────────────────────────────────────────

  test('a11y: product drawer (edit, STARTER)', async ({ page }) => {
    const { menu } = await seedAndLogin(page, 'STARTER');
    await page.goto(`/admin/menus/${menu.id}?tab=content`);
    await expect(page.getByTestId('admin-shell')).toBeVisible();

    // Expand first category and open the edit drawer for the first product.
    const firstRow = page.getByTestId('category-row').first();
    await firstRow.getByTestId('category-row-toggle').click();
    await expect(firstRow).toHaveAttribute('data-expanded', 'true');
    await page
      .getByTestId('product-row')
      .first()
      .getByTestId('product-action-edit')
      .click();

    const drawer = page.getByTestId('product-drawer');
    await expect(drawer).toBeVisible();
    await stabilize(page);

    // Scan the entire page so axe can see both the drawer AND the
    // editor underneath (overlay/focus-trap rules need both).
    await axeCheck(page, { context: 'product drawer (edit)' });
  });

  test('a11y: product drawer (new, PRO)', async ({ page }) => {
    const { menu } = await seedAndLogin(page, 'PRO');
    await page.goto(`/admin/menus/${menu.id}?tab=content`);
    await expect(page.getByTestId('admin-shell')).toBeVisible();

    const firstRow = page.getByTestId('category-row').first();
    await firstRow.getByTestId('category-row-toggle').click();
    await expect(firstRow).toHaveAttribute('data-expanded', 'true');

    // The inline "+ Add item" button at the bottom of an expanded category
    // opens the drawer in `data-mode="create"` (vs. edit). Scanning this
    // mode is important because the form renders different default values
    // and the SelectValue placeholder is visible (no preselected category).
    await page.getByTestId('products-add-inline').first().click();
    const drawer = page.getByTestId('product-drawer');
    await expect(drawer).toBeVisible();
    await expect(drawer).toHaveAttribute('data-mode', 'create');
    await stabilize(page);
    await axeCheck(page, { context: 'product drawer (new, PRO)' });
  });

  // ── Settings — every section ─────────────────────────────────────────────

  const SETTINGS_PATHS = [
    { path: '/admin/settings', label: 'settings index' },
    { path: '/admin/settings/profile', label: 'settings/profile' },
    { path: '/admin/settings/business-info', label: 'settings/business-info' },
    { path: '/admin/settings/billing', label: 'settings/billing' },
    { path: '/admin/settings/team', label: 'settings/team' },
    { path: '/admin/settings/notifications', label: 'settings/notifications' },
    { path: '/admin/settings/security', label: 'settings/security' },
    { path: '/admin/settings/language', label: 'settings/language' },
  ] as const;

  for (const { path, label } of SETTINGS_PATHS) {
    test(`a11y: ${path}`, async ({ page }) => {
      await seedAndLogin(page, 'STARTER');
      await page.goto(path);
      await expect(page.getByTestId('admin-shell')).toBeVisible();
      await stabilize(page);
      await axeCheck(page, { context: label });
    });
  }
});
