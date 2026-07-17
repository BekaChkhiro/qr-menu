// T21.11 — Category section header renders as a full-width banner.
// Run:  pnpm test:e2e tests/e2e/public/category-section-header.spec.ts
//
// Strategy: never resets the database — creates a unique user + menu per run,
// deletes via afterAll cascade.

import { expect, test } from '@playwright/test';
import { prismaTest, seedMenu, seedUser } from '../fixtures/seed';

const ACCENT_HEX = '#e07000';
const ICON_URL =
  'https://res.cloudinary.com/demo/image/upload/w_400,h_400,c_fill/sample.jpg';

const runId = Math.random().toString(36).slice(2, 8);
const slug = `t2111-catbanner-${runId}`;
const email = `t2111-catbanner-${runId}@test.local`;

let userId: string;
let catWithImageId: string;
let catNoImageId: string;

test.describe('T21.11 — public category section banner', () => {
  test.beforeAll(async () => {
    const user = await seedUser({ plan: 'STARTER', email, name: 'Nino Kapanadze' });
    userId = user.id;

    const menu = await seedMenu({
      userId,
      status: 'PUBLISHED',
      slug,
      categoryCount: 0,
      productCount: 0,
      name: 'Café Linville',
    });

    // Category WITH an iconUrl
    const catWithImage = await prismaTest.category.create({
      data: {
        menuId: menu.id,
        nameKa: 'ცხელი კერძები',
        nameEn: 'Hot Dishes',
        type: 'FOOD',
        sortOrder: 0,
        iconUrl: ICON_URL,
      },
    });
    catWithImageId = catWithImage.id;

    // Category WITHOUT an iconUrl (gradient fallback)
    const catNoImage = await prismaTest.category.create({
      data: {
        menuId: menu.id,
        nameKa: 'სასმელები',
        nameEn: 'Drinks',
        type: 'DRINK',
        sortOrder: 1,
        iconUrl: null,
      },
    });
    catNoImageId = catNoImage.id;

    for (const categoryId of [catWithImage.id, catNoImage.id]) {
      await prismaTest.product.create({
        data: {
          categoryId,
          nameKa: 'ხაჭაპური',
          price: 12,
          sortOrder: 0,
        },
      });
    }

    await prismaTest.menu.update({
      where: { id: menu.id },
      data: { accentColor: ACCENT_HEX },
    });
  });

  test.afterAll(async () => {
    if (userId) {
      await prismaTest.user.delete({ where: { id: userId } }).catch(() => {});
    }
  });

  test('category with iconUrl — banner contains an img element and is ≥ 120px tall', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/m/${slug}`);

    const section = page.locator(`#category-${catWithImageId}`);
    await expect(section).toBeVisible();

    const banner = section.locator('[data-testid="category-banner"]');
    await expect(banner).toBeVisible();

    // Should contain an img whose src points to the iconUrl
    const img = banner.locator('img').first();
    await expect(img).toBeVisible();

    const box = await banner.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(120);
  });

  test('category without iconUrl — banner shows gradient fallback with initial letter', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/m/${slug}`);

    const section = page.locator(`#category-${catNoImageId}`);
    const banner = section.locator('[data-testid="category-banner"]');
    await expect(banner).toBeVisible();

    // No <img> in a fallback banner
    await expect(banner.locator('img')).toHaveCount(0);

    // Initial span shows the first Unicode character of "სასმელები"
    const initial = banner.locator('[data-testid="category-banner-initial"]');
    await expect(initial).toContainText('ს');

    const box = await banner.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(120);
  });

  test('category name overlay is visible on top of the banner', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/m/${slug}`);

    const section = page.locator(`#category-${catWithImageId}`);
    const heading = section.locator('h2').first();
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('ცხელი კერძები');
  });

  test('visual: public-category-header', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/m/${slug}`);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('public-category-header.png', { fullPage: false });
  });
});
