// Test for T17.3 — Menu Editor Mobile.
// Run:     pnpm test:e2e tests/e2e/admin/editor-mobile.spec.ts
// Update:  pnpm test:e2e:update tests/e2e/admin/editor-mobile.spec.ts
//
// Covers:
//   Visual — menu editor on mobile viewport (single column, hidden desktop
//   preview, floating preview button). Bottom sheet preview open state.
//
//   Functional — floating preview button opens bottom sheet; sheet contains
//   phone preview iframe; tab bar overflows and scrolls horizontally.

import { expect, test } from '@playwright/test';

import { loginAs } from '../fixtures/auth';
import { resetDb, seedMenu, seedUser } from '../fixtures/seed';

test.describe('menu editor mobile (T17.3)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page, context }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'mobile',
      'Mobile-only editor tests; desktop variant lives in editor-shell.spec.ts',
    );
    await resetDb();
    await context.clearCookies();
    await context.addCookies([
      { name: 'NEXT_LOCALE', value: 'en', domain: 'localhost', path: '/' },
    ]);
    await page.addStyleTag({
      content:
        '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }',
    });
  });

  async function seedEditorAndLogin(page: Parameters<typeof loginAs>[0]) {
    const email = 'nino@cafelinville.ge';
    const user = await seedUser({
      plan: 'STARTER',
      name: 'Nino Kapanadze',
      email,
    });
    const menu = await seedMenu({
      userId: user.id,
      status: 'PUBLISHED',
      categoryCount: 3,
      productCount: 2,
      name: 'Café Linville — Dinner',
    });
    await loginAs(page, email);
    return { user, menu };
  }

  // ── Visual ────────────────────────────────────────────────────────────────

  test('visual: editor on mobile (content tab, single column)', async (
    { page },
    testInfo,
  ) => {
    const { menu } = await seedEditorAndLogin(page);
    await page.goto(`/admin/menus/${menu.id}?tab=content`);
    await page.evaluate(() => document.fonts.ready);

    const shell = page.getByTestId('editor-shell');
    await expect(shell).toBeVisible();

    // Desktop preview column is hidden (display:none on mobile viewport).
    await expect(page.getByTestId('phone-preview-panel')).toBeHidden();

    // Mobile preview trigger is visible.
    await expect(page.getByTestId('mobile-preview-trigger')).toBeVisible();

    // Tab bar is visible.
    await expect(page.getByTestId('editor-tab-bar')).toBeVisible();

    await expect(shell).toHaveScreenshot(
      `mobile-editor-${testInfo.project.name}.png`,
      { maxDiffPixelRatio: 0.05 },
    );
  });

  test('visual: mobile preview bottom sheet open', async (
    { page },
    testInfo,
  ) => {
    const { menu } = await seedEditorAndLogin(page);
    await page.goto(`/admin/menus/${menu.id}?tab=content`);
    await page.evaluate(() => document.fonts.ready);

    // Open the preview sheet.
    await page.getByTestId('mobile-preview-trigger').click();

    const sheet = page.getByTestId('mobile-preview-sheet');
    await expect(sheet).toBeVisible();

    // Wait for iframe to settle.
    const iframe = sheet.locator('iframe[title="Menu preview"]');
    await expect(iframe).toHaveAttribute('src', /preview=true&draft=true/);
    await iframe.evaluate(
      (el: HTMLIFrameElement) =>
        new Promise<void>((resolve) => {
          if (el.contentWindow?.document.readyState === 'complete') {
            resolve();
            return;
          }
          el.addEventListener('load', () => resolve(), { once: true });
        }),
    );

    await expect(sheet).toHaveScreenshot(
      `mobile-editor-preview-open-${testInfo.project.name}.png`,
      { maxDiffPixelRatio: 0.05 },
    );
  });

  // ── Functional ────────────────────────────────────────────────────────────

  test('functional: preview button opens bottom sheet with phone preview', async (
    { page },
  ) => {
    const { menu } = await seedEditorAndLogin(page);
    await page.goto(`/admin/menus/${menu.id}?tab=content`);

    const trigger = page.getByTestId('mobile-preview-trigger');
    await expect(trigger).toBeVisible();
    await expect(trigger).toContainText('Preview');

    // Sheet is initially closed.
    await expect(page.getByTestId('mobile-preview-sheet')).toHaveCount(0);

    await trigger.click();

    const sheet = page.getByTestId('mobile-preview-sheet');
    await expect(sheet).toBeVisible();

    // Phone preview panel is rendered inside the sheet.
    const panel = sheet.locator('[data-testid="phone-preview-panel"]');
    await expect(panel).toBeVisible();

    // iframe loads with preview flags.
    const iframe = panel.locator('iframe[title="Menu preview"]');
    await expect(iframe).toHaveAttribute(
      'src',
      `/m/${menu.slug}?preview=true&draft=true&locale=ka`,
    );

    // Clicking overlay closes the sheet.
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('mobile-preview-sheet')).toHaveCount(0);
  });

  test('functional: tab bar overflows and scrolls horizontally on mobile', async (
    { page },
  ) => {
    const { menu } = await seedEditorAndLogin(page);
    await page.goto(`/admin/menus/${menu.id}?tab=content`);

    const tabBar = page.getByTestId('editor-tab-bar');
    await expect(tabBar).toBeVisible();

    // Tab bar should overflow (7 tabs don't fit on 390px viewport).
    const overflow = await tabBar.evaluate((el: HTMLElement) => {
      return el.scrollWidth > el.clientWidth;
    });
    expect(overflow).toBe(true);

    // All 7 tabs are in the DOM.
    const tabs = tabBar.getByRole('tab');
    await expect(tabs).toHaveCount(7);

    // Scroll to the right to reveal the last tab (Settings).
    await tabBar.evaluate((el: HTMLElement) => {
      el.scrollLeft = el.scrollWidth;
    });

    const settingsTab = tabBar.getByRole('tab', { name: 'Settings' });
    await expect(settingsTab).toBeVisible();
  });

  test('functional: desktop preview column is hidden on mobile', async (
    { page },
  ) => {
    const { menu } = await seedEditorAndLogin(page);
    await page.goto(`/admin/menus/${menu.id}?tab=content`);

    // The desktop preview panel is hidden on mobile viewport.
    await expect(page.getByTestId('phone-preview-panel')).toBeHidden();

    // Content tab should be full width (categories list is no longer fixed 360px).
    const categoriesList = page.getByTestId('categories-list');
    await expect(categoriesList).toBeVisible();

    const width = await categoriesList.evaluate((el: HTMLElement) =>
      el.getBoundingClientRect().width,
    );
    // On iPhone 13 (390px viewport), the list should be wider than 360px
    // because it now fills the column.
    expect(width).toBeGreaterThan(360);
  });
});
