// Test for T15.15 Editor — Menu Settings Tab · Advanced (Clone/Archive/Delete).
// Run:     pnpm test:e2e tests/e2e/admin/editor-settings-advanced.spec.ts
// Update:  pnpm test:e2e:update tests/e2e/admin/editor-settings-advanced.spec.ts
//
// Covers:
//   Visual     — /admin/menus/[id]?tab=settings with Advanced section
//                (Clone / Archive buttons + Danger zone card).
//   Functional —
//     - Clone creates a duplicate menu with "— Copy" suffix and redirects
//       to the new menu's settings tab;
//     - Archive changes menu status to ARCHIVED;
//     - Delete opens a confirmation dialog, confirming DELETEs the menu
//       and redirects to /admin/menus.

import { expect, test, type Page } from '@playwright/test';

import { loginAs } from '../fixtures/auth';
import { prismaTest, resetDb, seedMenu, seedUser } from '../fixtures/seed';

const SLUG_BASE = `linville-t1515`;

async function seedAndOpenSettings(page: Page) {
  const email = 'nino-advanced@cafelinville.ge';
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

test.describe('editor settings tab · Advanced (T15.15)', () => {
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

  // ── Visual ─────────────────────────────────────────────────────────────────

  test('visual: editor-settings-advanced', async ({ page }) => {
    await seedAndOpenSettings(page);
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({
      content:
        '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }',
    });

    const section = page.getByTestId('settings-advanced');
    await expect(section).toBeVisible();
    await expect(page.getByTestId('settings-advanced-danger-zone')).toBeVisible();

    await expect(section).toHaveScreenshot(
      'editor-settings-advanced-desktop.png',
      { maxDiffPixelRatio: 0.05 },
    );
  });

  // ── Functional: clone ──────────────────────────────────────────────────────

  test('functional: clone creates duplicate with Copy suffix', async ({ page }) => {
    const { menu } = await seedAndOpenSettings(page);

    const cloneButton = page.getByTestId('settings-advanced-clone');
    await expect(cloneButton).toBeVisible();
    await cloneButton.click();

    // Should redirect to new menu's settings tab
    await expect(page).toHaveURL(/\/admin\/menus\/.+\?tab=settings/);

    // Verify the cloned menu exists in DB
    const cloned = await prismaTest.menu.findFirst({
      where: { name: `${menu.name} — Copy` },
      include: {
        categories: {
          include: { products: { include: { variations: true } } },
        },
      },
    });

    expect(cloned).not.toBeNull();
    expect(cloned!.status).toBe('DRAFT');
    expect(cloned!.slug).toMatch(new RegExp(`^${SLUG_BASE}-copy`));

    // Verify categories and products were copied
    expect(cloned!.categories.length).toBe(2);
    expect(cloned!.categories[0].products.length).toBe(3);
  });

  // ── Functional: archive ────────────────────────────────────────────────────

  test('functional: archive changes status to ARCHIVED', async ({ page }) => {
    const { menu } = await seedAndOpenSettings(page);

    const archiveButton = page.getByTestId('settings-advanced-archive');
    await expect(archiveButton).toBeVisible();
    await archiveButton.click();

    // Wait for the mutation to complete
    await expect(page.getByText('Menu archived')).toBeVisible();

    const updated = await prismaTest.menu.findUnique({
      where: { id: menu.id },
      select: { status: true },
    });

    expect(updated!.status).toBe('ARCHIVED');
  });

  // ── Functional: delete ─────────────────────────────────────────────────────

  test('functional: delete opens dialog and removes menu', async ({ page }) => {
    const { menu } = await seedAndOpenSettings(page);

    const deleteButton = page.getByTestId('settings-advanced-delete');
    await expect(deleteButton).toBeVisible();
    await deleteButton.click();

    // Dialog should open
    const dialog = page.getByTestId('settings-advanced-delete-dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Are you sure?');

    // Confirm deletion
    const confirmButton = page.getByTestId('settings-advanced-delete-confirm');
    await confirmButton.click();

    // Should redirect to /admin/menus
    await expect(page).toHaveURL('/admin/menus');

    // Verify menu is gone
    const deleted = await prismaTest.menu.findUnique({
      where: { id: menu.id },
    });
    expect(deleted).toBeNull();
  });
});
