// Animated GIF promotion banners keep their animation through upload.
//
// Bug: the promotion drawer ran every file through the canvas cropper, which
// re-encodes it as one JPEG frame, so GIFs lost their animation on upload.
// Fix: GIFs skip the cropper. The upload API and Cloudinary keep every frame.
//
// Run:    pnpm test:e2e tests/e2e/admin/promotion-gif-upload.spec.ts
//
// Phase-21 constraint: NO resetDb / NO TRUNCATE. Seed additive rows directly
// via `prismaTest`, clean up by user id in `afterAll`.

import { expect, test, type Page } from '@playwright/test';
import bcrypt from 'bcryptjs';

import { loginAs } from '../fixtures/auth';
import { prismaTest } from '../fixtures/seed';
import { TWO_FRAME_GIF, countGifFrames, destroyCloudinaryImage } from '../fixtures/gif';

const RUN_ID = `gif-upload-${Date.now()}`;
const cleanupUserIds: string[] = [];
const cleanupPublicIds: string[] = [];

async function seedStarterUserAndMenu(slugSuffix: string) {
  const email = `promo-gif-${RUN_ID}-${slugSuffix}@test.local`;
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

async function openPromotionDrawerAppearance(page: Page, menuId: string) {
  await page.goto(`/admin/menus/${menuId}?tab=promotions`);
  await expect(page.getByTestId('editor-promotions-tab')).toBeVisible();
  await page.getByTestId('editor-promotions-new').click();
  await expect(page.getByTestId('promotion-drawer')).toBeVisible();

  // Same saveable baseline as promotion-upload-async.spec.ts: a KA title and a
  // Banner type, so the drawer's save guards do not get in the way.
  await page.getByTestId('promotion-title-input').fill('ბედნიერი საათი');
  await page.getByTestId('promotion-type-banner').click();

  await page.getByTestId('promotion-drawer-tab-appearance').click();
  await expect(page.getByTestId('promotion-image-dropzone')).toBeVisible();
}

test.describe('animated GIF promotion upload', () => {
  test.beforeEach(async ({ context }) => {
    // Pin the admin locale so the drawer copy is stable (see promotion-upload-async).
    await context.addCookies([
      { name: 'NEXT_LOCALE', value: 'en', domain: 'localhost', path: '/' },
    ]);
  });

  test.afterAll(async () => {
    for (const publicId of cleanupPublicIds) {
      await destroyCloudinaryImage(publicId);
    }
    if (cleanupUserIds.length === 0) return;
    // Cascade-deletes menus / promotions / sessions for these users only.
    await prismaTest.user
      .deleteMany({ where: { id: { in: cleanupUserIds } } })
      .catch(() => undefined);
  });

  test('upload API stores a 2+ frame GIF as an animated image/gif', async ({ page }) => {
    const { email, user } = await seedStarterUserAndMenu('api');
    await loginAs(page, email);

    const upload = await page.request.post('/api/upload', {
      multipart: {
        file: { name: 'banner.gif', mimeType: 'image/gif', buffer: TWO_FRAME_GIF },
        preset: 'promotion',
        folder: `digital-menu/${user.id}`,
      },
    });
    expect(upload.status()).toBe(201);
    const body = await upload.json();
    cleanupPublicIds.push(body.data.publicId);

    // The public carousel only sees this URL, so its `.gif` check relies on the
    // stored extension being `.gif`.
    expect(new URL(body.data.url).pathname.toLowerCase()).toMatch(/\.gif$/);

    const delivered = await page.request.get(body.data.url);
    expect(delivered.status()).toBe(200);
    expect(delivered.headers()['content-type']).toMatch(/^image\/gif/);
    expect(countGifFrames(await delivered.body())).toBeGreaterThanOrEqual(2);
  });

  test('promotion drawer: a GIF skips the cropper and uploads straight away', async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop',
      'Promotion drawer is desktop-only — mobile variant lands in a later phase.',
    );
    const { email, menu } = await seedStarterUserAndMenu('drawer');
    await loginAs(page, email);
    await openPromotionDrawerAppearance(page, menu.id);

    const uploadResponse = page.waitForResponse(
      (res) => res.url().includes('/api/upload') && res.request().method() === 'POST',
      { timeout: 15_000 },
    );
    await page
      .getByTestId('promotion-image-dropzone')
      .locator('input[type="file"]')
      .setInputFiles({ name: 'banner.gif', mimeType: 'image/gif', buffer: TWO_FRAME_GIF });

    const res = await uploadResponse;
    expect(res.status()).toBe(201);
    const body = await res.json();
    cleanupPublicIds.push(body.data.publicId);

    // The stored file is still the animated GIF, not a cropped JPEG frame.
    const delivered = await page.request.get(body.data.url);
    expect(delivered.headers()['content-type']).toMatch(/^image\/gif/);
    expect(countGifFrames(await delivered.body())).toBeGreaterThanOrEqual(2);
    await expect(page.getByTestId('promotion-image-url')).toHaveValue(body.data.url);
    await expect(page.getByTestId('image-cropper')).toHaveCount(0);
    // Recrop would flatten the stored GIF, so it is not offered.
    await expect(page.getByRole('button', { name: 'Recrop' })).toHaveCount(0);
  });
});
