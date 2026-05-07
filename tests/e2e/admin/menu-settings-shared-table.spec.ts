// Test for T19.7 — Menu Settings Tab · Shared Table (PRO toggle, STARTER/FREE locked).
// Run:     pnpm test:e2e tests/e2e/admin/menu-settings-shared-table.spec.ts
// Update:  pnpm test:e2e:update tests/e2e/admin/menu-settings-shared-table.spec.ts
//
// Covers:
//   Visual     — /admin/menus/[id]?tab=settings with the Shared Table section
//                in two states: PRO (interactive switch) + STARTER (locked card).
//   Functional —
//     - PRO user toggles the switch ON → menu.sharedTableEnabled persists in DB;
//     - STARTER user sees the locked upgrade card (no switch rendered);
//     - STARTER user issues a direct PUT /api/menus/:id with
//       sharedTableEnabled:true → 403 + code "PLAN_REQUIRED" (defense in depth).

import { expect, test, type Page } from '@playwright/test';

import { loginAs } from '../fixtures/auth';
import { prismaTest, resetDb, seedMenu, seedUser } from '../fixtures/seed';

const SLUG_PRO = 'linville-t197-pro';
const SLUG_STARTER = 'linville-t197-starter';

async function seedAndOpenSettings(
  page: Page,
  plan: 'FREE' | 'STARTER' | 'PRO',
  slug: string,
) {
  const email = `nino-shared-table-${plan.toLowerCase()}@cafelinville.ge`;
  const user = await seedUser({
    plan,
    name: 'Nino Kapanadze',
    email,
  });
  const menu = await seedMenu({
    userId: user.id,
    status: 'PUBLISHED',
    categoryCount: 2,
    productCount: 3,
    name: 'Café Linville — Dinner',
    slug,
  });
  await loginAs(page, email);
  await page.goto(`/admin/menus/${menu.id}?tab=settings`);
  await expect(page.getByTestId('settings-tab')).toBeVisible();
  return { user, menu };
}

async function suppressAnimations(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({
    content:
      '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }',
  });
}

test.describe('editor settings tab · Shared Table (T19.7)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ context }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop',
      'Desktop-only tab; mobile variant covered by editor-mobile suite',
    );
    await resetDb();
    await context.clearCookies();
    await context.addCookies([
      { name: 'NEXT_LOCALE', value: 'en', domain: 'localhost', path: '/' },
    ]);
  });

  // ── Visual: PRO unlocked state ─────────────────────────────────────────────

  test('visual: PRO user sees the interactive Shared Table switch', async ({
    page,
  }) => {
    await seedAndOpenSettings(page, 'PRO', SLUG_PRO);
    await suppressAnimations(page);

    const section = page.getByTestId('settings-shared-table');
    await expect(section).toBeVisible();
    await expect(section).toHaveAttribute('data-enabled', 'false');
    await expect(page.getByTestId('settings-shared-table-switch')).toBeVisible();

    await expect(section).toHaveScreenshot(
      'admin-menu-settings-shared-table-pro.png',
      { maxDiffPixelRatio: 0.05 },
    );
  });

  // ── Visual: STARTER locked state ───────────────────────────────────────────

  test('visual: STARTER user sees the locked upgrade card', async ({ page }) => {
    await seedAndOpenSettings(page, 'STARTER', SLUG_STARTER);
    await suppressAnimations(page);

    const locked = page.getByTestId('settings-shared-table-locked');
    await expect(locked).toBeVisible();
    await expect(page.getByTestId('settings-shared-table')).toHaveCount(0);
    await expect(page.getByTestId('settings-shared-table-switch')).toHaveCount(0);

    await expect(locked).toHaveScreenshot(
      'admin-menu-settings-shared-table-locked-starter.png',
      { maxDiffPixelRatio: 0.05 },
    );
  });

  // ── Functional: PRO toggle ON persists to DB ───────────────────────────────

  test('functional: PRO toggle ON persists menu.sharedTableEnabled = true', async ({
    page,
  }) => {
    const { menu } = await seedAndOpenSettings(page, 'PRO', SLUG_PRO);

    const initial = await prismaTest.menu.findUnique({
      where: { id: menu.id },
      select: { sharedTableEnabled: true },
    });
    expect(initial?.sharedTableEnabled).toBe(false);

    const switchEl = page.getByTestId('settings-shared-table-switch');
    await expect(switchEl).toBeVisible();

    // Wait for the corresponding PUT to fly so we don't race the DB read.
    const updateRequest = page.waitForResponse(
      (res) =>
        res.url().includes(`/api/menus/${menu.id}`) &&
        res.request().method() === 'PUT' &&
        res.status() === 200,
    );
    await switchEl.click();
    await updateRequest;

    await expect(page.getByTestId('settings-shared-table')).toHaveAttribute(
      'data-enabled',
      'true',
    );

    const persisted = await prismaTest.menu.findUnique({
      where: { id: menu.id },
      select: { sharedTableEnabled: true },
    });
    expect(persisted?.sharedTableEnabled).toBe(true);
  });

  // ── Functional: STARTER cannot see the switch, sees the upgrade card ───────

  test('functional: STARTER plan hides the switch and shows the upgrade CTA', async ({
    page,
  }) => {
    await seedAndOpenSettings(page, 'STARTER', SLUG_STARTER);

    await expect(page.getByTestId('settings-shared-table')).toHaveCount(0);
    await expect(page.getByTestId('settings-shared-table-switch')).toHaveCount(0);

    const locked = page.getByTestId('settings-shared-table-locked');
    await expect(locked).toBeVisible();

    const cta = page.getByTestId('settings-shared-table-locked-cta');
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', '/admin/settings/billing');
  });

  // ── Functional: STARTER PUT with sharedTableEnabled:true → 403 ─────────────

  test('functional: STARTER direct PUT with sharedTableEnabled:true → 403 PLAN_REQUIRED', async ({
    page,
  }) => {
    const { menu } = await seedAndOpenSettings(page, 'STARTER', SLUG_STARTER);

    const res = await page.request.put(`/api/menus/${menu.id}`, {
      data: { sharedTableEnabled: true },
    });
    expect(res.status()).toBe(403);

    const body = (await res.json()) as {
      success: boolean;
      error?: { code?: string; message?: string };
    };
    expect(body.success).toBe(false);
    expect(body.error?.code).toBe('PLAN_REQUIRED');

    const persisted = await prismaTest.menu.findUnique({
      where: { id: menu.id },
      select: { sharedTableEnabled: true },
    });
    expect(persisted?.sharedTableEnabled).toBe(false);
  });

  // ── Functional: FREE plan also sees the locked card ────────────────────────

  test('functional: FREE plan also shows the locked upgrade card', async ({
    page,
  }) => {
    await seedAndOpenSettings(page, 'FREE', SLUG_STARTER);

    await expect(page.getByTestId('settings-shared-table')).toHaveCount(0);
    await expect(page.getByTestId('settings-shared-table-locked')).toBeVisible();
  });
});
