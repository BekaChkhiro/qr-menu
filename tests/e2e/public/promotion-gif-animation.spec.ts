// Animated GIF promotions animate on the public menu.
//
// The carousel and the tap-to-expand detail sheet both load the stored GIF
// unoptimized: next/image's optimizer keeps only the first frame. This spec
// uploads a real two-frame GIF through /api/upload, then checks:
//   - the network serves the GIF itself (image/gif, 2+ frames), with no
//     /_next/image re-encode in between;
//   - the rendered <img> shows both frames over time (the screenshots differ);
//   - the detail sheet does the same.
//
// Run: pnpm test:e2e tests/e2e/public/promotion-gif-animation.spec.ts

import { expect, test, type Page, type Locator, type TestInfo } from '@playwright/test';
import bcrypt from 'bcryptjs';

import { loginAs } from '../fixtures/auth';
import { prismaTest } from '../fixtures/seed';
import { TWO_FRAME_GIF, countGifFrames, destroyCloudinaryImage } from '../fixtures/gif';

const RUN_ID = `gif-public-${Date.now()}`;
const cleanupUserIds: string[] = [];
const cleanupPublicIds: string[] = [];

// Windows gate visibility against café time, so the promotion must be live now.
const TZ = 'Asia/Tbilisi';
const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
function cafeWeekdayToday(): string {
  const short = new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short' }).format(
    new Date(),
  );
  const idx = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(short);
  return DAY_KEYS[idx < 0 ? 1 : idx];
}

/**
 * Upload the two-frame GIF as the owner (the real upload API), then seed a live
 * banner promotion that points at the delivered URL.
 */
async function seedGifPromotion(page: Page, suffix: string) {
  const email = `promo-gif-public-${RUN_ID}-${suffix}@test.local`;
  const user = await prismaTest.user.create({
    data: {
      email: email.toLowerCase(),
      name: 'Nino Kapanadze',
      plan: 'STARTER',
      password: await bcrypt.hash('x', 10),
      emailVerified: new Date(),
    },
  });
  cleanupUserIds.push(user.id);

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
  const gifUrl: string = body.data.url;

  const menu = await prismaTest.menu.create({
    data: {
      userId: user.id,
      name: 'Café Linville',
      nameKa: 'Café Linville',
      slug: `linville-${RUN_ID}-${suffix}`,
      status: 'PUBLISHED',
      publishedAt: new Date(),
      enabledLanguages: ['KA'],
    },
  });
  const promo = await prismaTest.promotion.create({
    data: {
      menuId: menu.id,
      titleKa: 'ბედნიერი საათი',
      descriptionKa: 'ყოველ საღამოს კოქტეილებზე -20%.',
      type: 'BANNER',
      imageUrl: gifUrl,
      showTitle: true,
      isActive: true,
      startDate: new Date(Date.now() - 3600_000),
      endDate: new Date(Date.now() + 7 * 86400_000),
      timeRestrictions: {
        enabled: true,
        windows: { [cafeWeekdayToday()]: { start: '00:00', end: '23:59' } },
      },
    },
  });

  return { menu, promo, gifUrl };
}

/**
 * The GIF runs 400ms per frame (800ms loop). Sample the element every 150ms
 * until two different screenshots appear, which proves the browser is showing
 * more than one frame. Returns the first screenshot for the attachment.
 */
async function expectRendersAnimated(page: Page, locator: Locator): Promise<Buffer> {
  const first = await locator.screenshot();
  let differs = false;
  for (let i = 0; i < 40 && !differs; i++) {
    await page.waitForTimeout(150);
    differs = !(await locator.screenshot()).equals(first);
  }
  expect(differs, 'the rendered GIF must change between frames').toBe(true);
  return first;
}

function gifImageRequests(page: Page, gifUrl: string): string[] {
  const seen: string[] = [];
  page.on('request', (req) => {
    const url = req.url();
    // A next/image optimizer request would carry the GIF URL, percent-encoded.
    if (url.includes('/_next/image') && decodeURIComponent(url).includes(gifUrl)) {
      seen.push(url);
    }
  });
  return seen;
}

test.describe('animated GIF promotions on the public menu', () => {
  test.afterAll(async () => {
    for (const publicId of cleanupPublicIds) {
      await destroyCloudinaryImage(publicId);
    }
    for (const id of cleanupUserIds) {
      await prismaTest.user.delete({ where: { id } }).catch(() => undefined);
    }
  });

  test('carousel serves and renders the GIF animated', async ({ page }, testInfo: TestInfo) => {
    const { menu, promo, gifUrl } = await seedGifPromotion(page, `carousel-${testInfo.project.name}`);
    const optimizerRequests = gifImageRequests(page, gifUrl);

    const gifResponse = page.waitForResponse((res) => res.url() === gifUrl);
    await page.goto(`/m/${menu.slug}`);

    // Network: the GIF itself is delivered, with every frame intact.
    const response = await gifResponse;
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toMatch(/^image\/gif/);
    expect(countGifFrames(await response.body())).toBeGreaterThanOrEqual(2);

    const img = page.getByTestId(`promotion-slide-${promo.id}`).locator('img');
    await expect(img).toHaveAttribute('src', gifUrl);
    await expect
      .poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth))
      .toBeGreaterThan(0);

    const shot = await expectRendersAnimated(page, img);
    await testInfo.attach('promotion-gif-carousel', { body: shot, contentType: 'image/png' });

    expect(optimizerRequests, 'the GIF must not go through /_next/image').toEqual([]);
  });

  test('detail sheet renders the same GIF animated', async ({ page }, testInfo: TestInfo) => {
    const { menu, promo, gifUrl } = await seedGifPromotion(page, `sheet-${testInfo.project.name}`);
    const optimizerRequests = gifImageRequests(page, gifUrl);

    await page.goto(`/m/${menu.slug}`);
    await page.getByTestId(`promotion-slide-${promo.id}`).click();

    const sheet = page.getByTestId('promotion-detail-sheet');
    await expect(sheet).toBeVisible();
    const img = sheet.locator('img');
    await expect(img).toHaveAttribute('src', gifUrl);
    await expect
      .poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth))
      .toBeGreaterThan(0);

    const shot = await expectRendersAnimated(page, img);
    await testInfo.attach('promotion-gif-detail-sheet', { body: shot, contentType: 'image/png' });

    expect(optimizerRequests, 'the GIF must not go through /_next/image').toEqual([]);
  });
});
