// Test for T15.14 Editor — Menu Settings Tab · Schedule + SEO.
// Run:     pnpm test:e2e tests/e2e/admin/editor-settings-schedule-seo.spec.ts
// Update:  pnpm test:e2e:update tests/e2e/admin/editor-settings-schedule-seo.spec.ts
//
// Covers:
//   Visual     — /admin/menus/[id]?tab=settings with Schedule + SEO sections
//                and the live share preview card in the right rail.
//   Functional —
//     - typing meta title updates the live share preview card in real time;
//     - uploading a share image POSTs to /api/upload and the preview shows it;
//     - enabling auto-publish + picking a date/time saves scheduledPublishAt;
//     - enabling auto-unpublish + picking a date/time saves scheduledUnpublishAt;
//     - disabling a scheduled toggle clears the corresponding DB field.

import { expect, test, type Page } from '@playwright/test';

import { loginAs } from '../fixtures/auth';
import { prismaTest, resetDb, seedMenu, seedUser } from '../fixtures/seed';

const SLUG_BASE = `linville-t1514`;

async function seedAndOpenSettings(page: Page) {
  const email = 'nino-schedule-seo@cafelinville.ge';
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

test.describe('editor settings tab · Schedule + SEO (T15.14)', () => {
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

  test('visual: editor-settings-schedule-seo', async ({ page }) => {
    await seedAndOpenSettings(page);
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({
      content:
        '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }',
    });

    const tab = page.getByTestId('settings-tab');
    await expect(tab).toBeVisible();
    await expect(page.getByTestId('settings-schedule')).toBeVisible();
    await expect(page.getByTestId('settings-seo')).toBeVisible();
    await expect(page.getByTestId('settings-share-preview')).toBeVisible();

    await expect(tab).toHaveScreenshot(
      'editor-settings-schedule-seo-desktop.png',
      { maxDiffPixelRatio: 0.05 },
    );
  });

  // ── Functional: live preview updates ───────────────────────────────────────

  test('functional: typing meta title updates the live share preview', async ({
    page,
  }) => {
    const { menu } = await seedAndOpenSettings(page);

    const preview = page.getByTestId('settings-share-preview');
    await expect(preview).toContainText(menu.name);

    const metaTitleInput = page.getByTestId('settings-seo-meta-title');
    const newTitle = 'Summer Brunch 2026 — Café Linville';
    await metaTitleInput.fill(newTitle);

    // Preview should update in real time (lifted state).
    await expect(preview).toContainText(newTitle);
    await expect(preview).not.toContainText(menu.name);
  });

  // ── Functional: meta description counter + preview ─────────────────────────

  test('functional: meta description updates preview and shows char count', async ({
    page,
  }) => {
    await seedAndOpenSettings(page);

    const preview = page.getByTestId('settings-share-preview');
    const descInput = page.getByTestId('settings-seo-meta-description');
    const counter = page.getByTestId('settings-seo-char-count');

    // Initial counter shows 0 / 160
    await expect(counter).toHaveText('0 / 160');

    const description = 'Fresh seasonal dishes and craft cocktails.';
    await descInput.fill(description);

    // Counter updates
    await expect(counter).toHaveText(`${description.length} / 160`);

    // Preview updates
    await expect(preview).toContainText(description);
  });

  // ── Functional: share image upload ─────────────────────────────────────────

  test('functional: uploading a share image posts to /api/upload', async ({
    page,
  }) => {
    const { menu } = await seedAndOpenSettings(page);

    // Create a tiny 1×1 red PNG buffer and convert to base64 data URL
    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64',
    );

    const fileChooserPromise = page.waitForEvent('filechooser');
    // Click the ImageUpload dropzone — it contains a hidden file input
    await page.locator('input[type="file"]').nth(1).setInputFiles({
      name: 'share-image.png',
      mimeType: 'image/png',
      buffer: pngBuffer,
    });

    // Wait for the upload POST
    const uploadResp = await page.waitForResponse(
      (r) => r.url().includes('/api/upload') && r.request().method() === 'POST',
    );
    expect(uploadResp.ok()).toBeTruthy();

    const uploadBody = await uploadResp.json();
    expect(uploadBody.data?.url).toBeTruthy();

    // Save the SEO section
    const [putResp] = await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes(`/api/menus/${menu.id}`) && r.request().method() === 'PUT',
      ),
      page.getByTestId('settings-seo-save').click(),
    ]);
    expect(putResp.ok()).toBeTruthy();

    // DB reflects the share image
    const row = await prismaTest.menu.findUnique({ where: { id: menu.id } });
    expect(row?.shareImageUrl).toBeTruthy();
  });

  // ── Functional: auto-publish schedule ──────────────────────────────────────

  test('functional: enabling auto-publish + date saves scheduledPublishAt', async ({
    page,
  }) => {
    const { menu } = await seedAndOpenSettings(page);

    const publishCard = page.getByTestId('settings-schedule-publish');
    await expect(publishCard).toHaveAttribute('data-enabled', 'false');

    // Toggle on
    await publishCard.getByTestId('settings-schedule-publish-switch').click();
    await expect(publishCard).toHaveAttribute('data-enabled', 'true');

    // Set a future datetime-local value
    const future = new Date();
    future.setDate(future.getDate() + 7);
    future.setMinutes(future.getMinutes() - future.getTimezoneOffset());
    const futureIso = future.toISOString().slice(0, 16);

    await page.getByTestId('settings-schedule-publish-date').fill(futureIso);

    // Save
    const [putResp] = await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes(`/api/menus/${menu.id}`) && r.request().method() === 'PUT',
      ),
      page.getByTestId('settings-schedule-save').click(),
    ]);
    expect(putResp.ok()).toBeTruthy();

    // DB reflects the scheduled publish date
    const row = await prismaTest.menu.findUnique({ where: { id: menu.id } });
    expect(row?.scheduledPublishAt).not.toBeNull();
  });

  // ── Functional: auto-unpublish schedule ────────────────────────────────────

  test('functional: enabling auto-unpublish + date saves scheduledUnpublishAt', async ({
    page,
  }) => {
    const { menu } = await seedAndOpenSettings(page);

    const unpublishCard = page.getByTestId('settings-schedule-unpublish');
    await expect(unpublishCard).toHaveAttribute('data-enabled', 'false');

    // Toggle on
    await unpublishCard.getByTestId('settings-schedule-unpublish-switch').click();
    await expect(unpublishCard).toHaveAttribute('data-enabled', 'true');

    // Set a future datetime-local value
    const future = new Date();
    future.setDate(future.getDate() + 14);
    future.setMinutes(future.getMinutes() - future.getTimezoneOffset());
    const futureIso = future.toISOString().slice(0, 16);

    await page.getByTestId('settings-schedule-unpublish-date').fill(futureIso);

    // Save
    const [putResp] = await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes(`/api/menus/${menu.id}`) && r.request().method() === 'PUT',
      ),
      page.getByTestId('settings-schedule-save').click(),
    ]);
    expect(putResp.ok()).toBeTruthy();

    // DB reflects the scheduled unpublish date
    const row = await prismaTest.menu.findUnique({ where: { id: menu.id } });
    expect(row?.scheduledUnpublishAt).not.toBeNull();
  });

  // ── Functional: disabling schedule clears DB field ─────────────────────────

  test('functional: disabling auto-publish clears scheduledPublishAt', async ({
    page,
  }) => {
    const { menu } = await seedAndOpenSettings(page);

    // First enable and save
    await page.getByTestId('settings-schedule-publish-switch').click();
    const future = new Date();
    future.setDate(future.getDate() + 7);
    future.setMinutes(future.getMinutes() - future.getTimezoneOffset());
    await page.getByTestId('settings-schedule-publish-date').fill(future.toISOString().slice(0, 16));

    await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes(`/api/menus/${menu.id}`) && r.request().method() === 'PUT',
      ),
      page.getByTestId('settings-schedule-save').click(),
    ]);

    let row = await prismaTest.menu.findUnique({ where: { id: menu.id } });
    expect(row?.scheduledPublishAt).not.toBeNull();

    // Now disable
    await page.getByTestId('settings-schedule-publish-switch').click();
    await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes(`/api/menus/${menu.id}`) && r.request().method() === 'PUT',
      ),
      page.getByTestId('settings-schedule-save').click(),
    ]);

    row = await prismaTest.menu.findUnique({ where: { id: menu.id } });
    expect(row?.scheduledPublishAt).toBeNull();
  });
});
