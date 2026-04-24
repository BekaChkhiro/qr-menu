// Test for T13.1 Editor Shell + 7-Tab Bar.
// Run:     pnpm test:e2e tests/e2e/admin/editor-shell.spec.ts
// Update:  pnpm test:e2e:update tests/e2e/admin/editor-shell.spec.ts
//
// Covers:
//   Visual — /admin/menus/[id]?tab=content with EditorHeader + EditorTabBar
//   (7 tabs visible in the canonical Content · Branding · Languages · Analytics
//   · Promotions · QR · Settings order).
//
//   Functional — clicking each tab swaps URL ?tab= and active tab visual;
//   ArrowRight / ArrowLeft cycle the focused tab; the Draft → Published toggle
//   calls POST /api/menus/[id]/publish and flips "Last published"; the inline
//   name-edit flow calls PUT /api/menus/[id] and updates the rendered H1.

import { expect, test, type Page } from '@playwright/test';

import { loginAs } from '../fixtures/auth';
import { prismaTest, resetDb, seedMenu, seedUser } from '../fixtures/seed';

const TAB_ORDER = [
  'content',
  'branding',
  'languages',
  'analytics',
  'promotions',
  'qr',
  'settings',
] as const;

const TAB_LABELS_EN: Record<(typeof TAB_ORDER)[number], string> = {
  content: 'Content',
  branding: 'Branding',
  languages: 'Languages',
  analytics: 'Analytics',
  promotions: 'Promotions',
  qr: 'QR',
  settings: 'Settings',
};

test.describe('editor shell + 7-tab bar (T13.1)', () => {
  // Serial so resetDb() in one test can't race another's seed.
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ context }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop',
      'Desktop-only shell; mobile variant lands in T17.3',
    );
    await resetDb();
    await context.clearCookies();
    // Force English so tab labels match our assertions.
    await context.addCookies([
      { name: 'NEXT_LOCALE', value: 'en', domain: 'localhost', path: '/' },
    ]);
  });

  async function seedDraftAndLogin(page: Page) {
    const email = 'nino@cafelinville.ge';
    const user = await seedUser({
      plan: 'STARTER',
      name: 'Nino Kapanadze',
      email,
    });
    const menu = await seedMenu({
      userId: user.id,
      status: 'DRAFT',
      categoryCount: 2,
      productCount: 3,
      name: 'Main menu — All day',
    });
    await loginAs(page, email);
    return { user, menu };
  }

  async function seedPublishedAndLogin(page: Page) {
    const email = 'nino@cafelinville.ge';
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
    });
    await loginAs(page, email);
    return { user, menu };
  }

  // ── Visual ────────────────────────────────────────────────────────────────

  test('visual: editor shell with 7 tabs on Content', async ({ page }, testInfo) => {
    const { menu } = await seedPublishedAndLogin(page);

    await page.goto(`/admin/menus/${menu.id}?tab=content`);
    await page.evaluate(() => document.fonts.ready);
    // Freeze animations so repeat-runs are deterministic.
    await page.addStyleTag({
      content:
        '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }',
    });

    const shell = page.getByTestId('editor-shell');
    await expect(shell).toBeVisible();
    await expect(page.getByTestId('editor-header')).toBeVisible();
    await expect(page.getByTestId('editor-tab-bar')).toBeVisible();

    // All 7 tabs are in DOM in canonical order.
    const tabs = page.getByTestId('editor-tab-bar').getByRole('tab');
    await expect(tabs).toHaveCount(7);
    for (let i = 0; i < TAB_ORDER.length; i++) {
      await expect(tabs.nth(i)).toHaveText(
        TAB_LABELS_EN[TAB_ORDER[i]],
      );
    }

    await expect(shell).toHaveScreenshot(
      `editor-shell-${testInfo.project.name}.png`,
      { maxDiffPixelRatio: 0.05 },
    );
  });

  // ── Functional: tab navigation ────────────────────────────────────────────

  test('functional: clicking each tab updates URL ?tab= and active state', async ({
    page,
  }) => {
    const { menu } = await seedPublishedAndLogin(page);
    await page.goto(`/admin/menus/${menu.id}?tab=content`);

    await expect(
      page.getByTestId('editor-tab-bar').getByRole('tab', { name: 'Content' }),
    ).toHaveAttribute('data-state', 'active');

    for (const id of TAB_ORDER) {
      await page
        .getByTestId('editor-tab-bar')
        .getByRole('tab', { name: TAB_LABELS_EN[id] })
        .click();

      await expect(page).toHaveURL(new RegExp(`[?&]tab=${id}(&|$)`));
      await expect(
        page
          .getByTestId('editor-tab-bar')
          .getByRole('tab', { name: TAB_LABELS_EN[id] }),
      ).toHaveAttribute('data-state', 'active');
    }
  });

  test('functional: ArrowRight / ArrowLeft move focus between tabs', async ({
    page,
  }) => {
    const { menu } = await seedPublishedAndLogin(page);
    await page.goto(`/admin/menus/${menu.id}?tab=content`);

    const contentTab = page
      .getByTestId('editor-tab-bar')
      .getByRole('tab', { name: 'Content' });
    await contentTab.focus();
    await expect(contentTab).toBeFocused();

    await page.keyboard.press('ArrowRight');
    await expect(
      page.getByTestId('editor-tab-bar').getByRole('tab', { name: 'Branding' }),
    ).toBeFocused();

    await page.keyboard.press('ArrowRight');
    await expect(
      page.getByTestId('editor-tab-bar').getByRole('tab', { name: 'Languages' }),
    ).toBeFocused();

    await page.keyboard.press('ArrowLeft');
    await expect(
      page.getByTestId('editor-tab-bar').getByRole('tab', { name: 'Branding' }),
    ).toBeFocused();

    // End key → last tab.
    await page.keyboard.press('End');
    await expect(
      page.getByTestId('editor-tab-bar').getByRole('tab', { name: 'Settings' }),
    ).toBeFocused();

    // Home key → first tab.
    await page.keyboard.press('Home');
    await expect(
      page.getByTestId('editor-tab-bar').getByRole('tab', { name: 'Content' }),
    ).toBeFocused();
  });

  test('functional: defaults to Content tab when ?tab is missing', async ({
    page,
  }) => {
    const { menu } = await seedPublishedAndLogin(page);
    await page.goto(`/admin/menus/${menu.id}`);
    await expect(
      page.getByTestId('editor-tab-bar').getByRole('tab', { name: 'Content' }),
    ).toHaveAttribute('data-state', 'active');
  });

  test('functional: unknown ?tab value falls back to Content', async ({ page }) => {
    const { menu } = await seedPublishedAndLogin(page);
    await page.goto(`/admin/menus/${menu.id}?tab=bogus`);
    await expect(
      page.getByTestId('editor-tab-bar').getByRole('tab', { name: 'Content' }),
    ).toHaveAttribute('data-state', 'active');
  });

  // ── Functional: publish toggle ────────────────────────────────────────────

  test('functional: Draft → Published calls /publish and flips indicator', async ({
    page,
  }) => {
    const { menu } = await seedDraftAndLogin(page);
    await page.goto(`/admin/menus/${menu.id}?tab=content`);

    // Initially Draft — "Not yet published" label.
    await expect(page.getByTestId('editor-last-published')).toHaveText(
      /not yet published/i,
    );

    const publishedRadio = page
      .getByTestId('editor-publish-toggle')
      .getByRole('radio', { name: /published/i });

    // Listen for the publish request completing before asserting UI.
    const publishResponse = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/menus/${menu.id}/publish`) &&
        response.request().method() === 'POST' &&
        response.ok(),
    );

    await publishedRadio.click();
    const res = await publishResponse;
    const body = (await res.json()) as { data?: { status: string; publishedAt: string | null } };

    // API returned the updated record with PUBLISHED + a real timestamp.
    expect(body.data?.status).toBe('PUBLISHED');
    expect(body.data?.publishedAt).not.toBeNull();

    // UI reflects the new state.
    await expect(publishedRadio).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByTestId('editor-last-published')).toHaveText(
      /last published/i,
    );

    // Database is the source of truth — refetched via the test client.
    const row = await prismaTest.menu.findFirst({
      where: { id: menu.id },
      select: { status: true, publishedAt: true },
    });
    expect(row).not.toBeNull();
    expect(row!.status).toBe('PUBLISHED');
    expect(row!.publishedAt).not.toBeNull();
  });

  // ── Functional: inline name edit ──────────────────────────────────────────

  test('functional: inline name edit persists via PUT /api/menus/[id]', async ({
    page,
  }) => {
    const { menu } = await seedPublishedAndLogin(page);
    await page.goto(`/admin/menus/${menu.id}?tab=content`);

    await expect(page.getByTestId('editor-name')).toHaveText(menu.name);

    await page.getByTestId('editor-name-edit').click();
    const input = page.getByTestId('editor-name-input');
    await expect(input).toBeFocused();

    await input.fill('Brunch menu');

    const putResponse = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/menus/${menu.id}`) &&
        response.request().method() === 'PUT' &&
        response.ok(),
    );

    await page.getByTestId('editor-name-save').click();
    await putResponse;

    // The edit form closes and the H1 shows the new name.
    await expect(page.getByTestId('editor-name')).toHaveText('Brunch menu');
    await expect(page.getByTestId('editor-name-input')).toHaveCount(0);

    // Database row updated.
    const row = await prismaTest.menu.findUnique({ where: { id: menu.id } });
    expect(row?.name).toBe('Brunch menu');
  });

  test('functional: name-edit Cancel discards changes', async ({ page }) => {
    const { menu } = await seedPublishedAndLogin(page);
    await page.goto(`/admin/menus/${menu.id}?tab=content`);

    await page.getByTestId('editor-name-edit').click();
    await page.getByTestId('editor-name-input').fill('Temporary name');
    await page.getByTestId('editor-name-cancel').click();

    await expect(page.getByTestId('editor-name')).toHaveText(menu.name);
    await expect(page.getByTestId('editor-name-input')).toHaveCount(0);

    // Database unchanged.
    const row = await prismaTest.menu.findUnique({ where: { id: menu.id } });
    expect(row?.name).toBe(menu.name);
  });

  // ── Functional: header actions ────────────────────────────────────────────

  test('functional: View public link points to /m/[slug] with target=_blank', async ({
    page,
  }) => {
    const { menu } = await seedPublishedAndLogin(page);
    await page.goto(`/admin/menus/${menu.id}?tab=content`);

    const viewPublic = page.getByTestId('editor-view-public');
    await expect(viewPublic).toHaveAttribute('href', `/m/${menu.slug}`);
    await expect(viewPublic).toHaveAttribute('target', '_blank');
  });

  test('functional: Save changes button is disabled when the shell has no dirty tabs', async ({
    page,
  }) => {
    const { menu } = await seedPublishedAndLogin(page);
    await page.goto(`/admin/menus/${menu.id}?tab=content`);
    await expect(page.getByTestId('editor-save-changes')).toBeDisabled();
  });
});
