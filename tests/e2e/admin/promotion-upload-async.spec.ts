// T21.10 — Promotion Upload Performance.
//
// Run:    pnpm test:e2e tests/e2e/admin/promotion-upload-async.spec.ts
// Update: pnpm test:e2e:update tests/e2e/admin/promotion-upload-async.spec.ts
//
// Bug:
//   Saving a promotion with an image took 10+ seconds because Cloudinary
//   upload was bundled into the form submit handler. The UI was blocked
//   while the file streamed to the server during Save.
//
// Fix:
//   - Upload starts the moment a file is selected (decoupled from Save).
//   - Optimistic blob preview shows within ~500ms.
//   - Progress bar reports the byte-level upload progress (XHR).
//   - Save button is disabled while the upload is in flight, with
//     "Uploading image…" copy.
//   - Save click only persists the resolved Cloudinary URL, so the
//     PATCH/POST is a fast DB write.
//
// Phase-21 constraint: NO resetDb / NO TRUNCATE. Seed additive rows directly
// via `prismaTest`, clean up by user id in `afterAll`.

import { expect, test, type Page } from '@playwright/test';
import bcrypt from 'bcryptjs';

import { loginAs } from '../fixtures/auth';
import { prismaTest } from '../fixtures/seed';

const RUN_ID = `t21-10-${Date.now()}`;
const cleanupUserIds: string[] = [];

// 1×1 transparent PNG — smallest possible image that still passes MIME
// validation. The promotion ImageUpload uses object-cover at video aspect,
// so the visible size is decoupled from the source size.
const TINY_PNG_BUFFER = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

async function seedStarterUserAndMenu(slugSuffix: string) {
  const email = `promo-upload-${RUN_ID}-${slugSuffix}@test.local`;
  const user = await prismaTest.user.create({
    data: {
      email: email.toLowerCase(),
      name: 'Nino Kapanadze',
      plan: 'STARTER',
      password: await bcrypt.hash('password-not-used', 10),
      emailVerified: new Date(),
    },
  });
  cleanupUserIds.push(user.id);

  const menu = await prismaTest.menu.create({
    data: {
      userId: user.id,
      name: 'Café Linville',
      nameKa: 'Café Linville',
      slug: `linville-${RUN_ID}-${slugSuffix}`,
      status: 'PUBLISHED',
      enabledLanguages: ['KA'],
    },
  });

  return { email, user, menu };
}

async function openPromotionsTabAndDrawer(page: Page, menuId: string) {
  await page.goto(`/admin/menus/${menuId}?tab=promotions`);
  await expect(page.getByTestId('editor-promotions-tab')).toBeVisible();
  await page.getByTestId('editor-promotions-new').click();
  await expect(page.getByTestId('promotion-drawer')).toBeVisible();

  // Bring the drawer to a saveable baseline so these specs isolate UPLOAD
  // behavior rather than the save guards: a KA title is always required, and a
  // Banner promotion needs nothing else (a Percentage one would also demand a
  // discount value — see T22.19).
  await page.getByTestId('promotion-title-input').fill('ბედნიერი საათი');
  await page.getByTestId('promotion-type-banner').click();

  // The banner uploader lives on the Appearance tab.
  await page.getByTestId('promotion-drawer-tab-appearance').click();
  await expect(page.getByTestId('promotion-image-dropzone')).toBeVisible();
}

test.describe('T21.10 promotion upload performance', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ context }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop',
      'Promotion drawer is desktop-only — mobile variant lands in a later phase.',
    );
    // Pin the admin locale so copy assertions ("Uploading image…") are stable —
    // the drawer otherwise renders Georgian by default.
    await context.addCookies([
      { name: 'NEXT_LOCALE', value: 'en', domain: 'localhost', path: '/' },
    ]);
  });

  test.afterAll(async () => {
    if (cleanupUserIds.length === 0) return;
    // Cascade-deletes menus / promotions / sessions for these users only.
    await prismaTest.user
      .deleteMany({ where: { id: { in: cleanupUserIds } } })
      .catch(() => undefined);
  });

  test('file select triggers immediate upload — preview, progress bar, hidden URL', async ({
    page,
  }) => {
    const { email, menu } = await seedStarterUserAndMenu('async');

    // Stub /api/upload with a deliberate delay so the progress bar is
    // observable from the test. The shape mirrors the real success body
    // from app/api/upload/route.ts.
    const stubCloudinaryUrl = `https://res.cloudinary.com/stub/image/upload/promo-${RUN_ID}.jpg`;
    await page.route('**/api/upload', async (route) => {
      // Hold the response long enough that the test can observe the
      // progress UI before completion.
      await new Promise((resolve) => setTimeout(resolve, 800));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            url: stubCloudinaryUrl,
            publicId: `promo-${RUN_ID}`,
            width: 1200,
            height: 600,
            format: 'jpg',
            bytes: TINY_PNG_BUFFER.length,
          },
        }),
      });
    });

    await loginAs(page, email);
    await openPromotionsTabAndDrawer(page, menu.id);

    // Save is enabled before any file activity.
    await expect(page.getByTestId('promotion-drawer-save')).toBeEnabled();

    const dropzone = page.getByTestId('promotion-image-dropzone');
    const fileInput = dropzone.locator('input[type="file"]');

    // Drive the hidden input directly — bypasses the dropzone click.
    const selectStart = Date.now();
    await fileInput.setInputFiles({
      name: 'banner.png',
      mimeType: 'image/png',
      buffer: TINY_PNG_BUFFER,
    });

    // ── Optimistic blob preview appears within 500ms ────────────────────────
    const preview = page.getByTestId('promotion-image-preview');
    await expect(preview).toBeVisible({ timeout: 500 });
    const previewSrc = await preview.getAttribute('src');
    expect(previewSrc, 'preview must use an in-memory blob URL').toMatch(/^blob:/);
    expect(
      Date.now() - selectStart,
      'preview must appear within ~500ms of file select',
    ).toBeLessThan(800);

    // ── Progress bar visible while upload is in flight ──────────────────────
    await expect(page.getByTestId('promotion-image-progress')).toBeVisible();
    // The dropzone exposes its uploading state for the test.
    await expect(dropzone).toHaveAttribute('data-uploading', 'true');

    // ── Save is disabled and shows the "Uploading image…" copy ──────────────
    const save = page.getByTestId('promotion-drawer-save');
    await expect(save).toBeDisabled();
    await expect(save).toHaveAttribute('data-uploading', 'true');
    await expect(save).toContainText(/uploading/i);

    // ── Upload resolves → hidden imageUrl input populated, Save re-enabled ──
    await expect(page.getByTestId('promotion-image-url')).toHaveValue(
      stubCloudinaryUrl,
    );
    await expect(save).toBeEnabled();
    await expect(save).toHaveAttribute('data-uploading', 'false');
    await expect(dropzone).toHaveAttribute('data-uploading', 'false');
    // Progress UI is gone once the upload finishes.
    await expect(page.getByTestId('promotion-image-progress')).toHaveCount(0);
  });

  test('Save click after upload completes resolves the POST quickly', async ({
    page,
  }) => {
    const { email, menu } = await seedStarterUserAndMenu('save');

    const stubCloudinaryUrl = `https://res.cloudinary.com/stub/image/upload/save-${RUN_ID}.jpg`;

    // Stub upload with the same delay so we can assert Save *unblocks* after.
    await page.route('**/api/upload', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 600));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            url: stubCloudinaryUrl,
            publicId: `save-${RUN_ID}`,
            width: 1200,
            height: 600,
            format: 'jpg',
            bytes: TINY_PNG_BUFFER.length,
          },
        }),
      });
    });

    await loginAs(page, email);
    await openPromotionsTabAndDrawer(page, menu.id);

    // Switch to Details to fill the title (the only required field).
    await page.getByTestId('promotion-drawer-tab-details').click();
    await page.getByTestId('promotion-title-input').fill('Happy Hour');

    // Upload the banner.
    await page.getByTestId('promotion-drawer-tab-appearance').click();
    const dropzone = page.getByTestId('promotion-image-dropzone');
    await dropzone.locator('input[type="file"]').setInputFiles({
      name: 'banner.png',
      mimeType: 'image/png',
      buffer: TINY_PNG_BUFFER,
    });

    // Wait for upload to finish (hidden input populated).
    await expect(page.getByTestId('promotion-image-url')).toHaveValue(
      stubCloudinaryUrl,
    );
    await expect(page.getByTestId('promotion-drawer-save')).toBeEnabled();

    // Click Save and time the network round-trip. Because the URL is already
    // resolved, this is just a DB write — no inline Cloudinary upload.
    const postPromise = page.waitForResponse(
      (res) =>
        res.url().includes(`/api/menus/${menu.id}/promotions`) &&
        res.request().method() === 'POST',
      { timeout: 3_000 },
    );

    const saveStart = Date.now();
    await page.getByTestId('promotion-drawer-save').click();
    const postResp = await postPromise;
    const saveDuration = Date.now() - saveStart;

    expect(postResp.ok()).toBeTruthy();
    const body = await postResp.json();
    expect(body.success).toBe(true);
    expect(body.data.imageUrl).toBe(stubCloudinaryUrl);
    expect(body.data.titleKa).toBe('Happy Hour');

    // Generous ceiling — locally this is well under 500ms. The point is that
    // Save is no longer paying the Cloudinary upload cost it used to.
    expect(saveDuration).toBeLessThan(2_000);

    // DB reflects the change with the stub URL (no real Cloudinary upload).
    const persisted = await prismaTest.promotion.findFirst({
      where: { menuId: menu.id, titleKa: 'Happy Hour' },
      select: { imageUrl: true },
    });
    expect(persisted?.imageUrl).toBe(stubCloudinaryUrl);
  });
});
