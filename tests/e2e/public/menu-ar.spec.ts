// T18.5 — Public Product Card AR button + viewer dialog.
// Run:     pnpm test:e2e tests/e2e/public/menu-ar.spec.ts
// Update:  pnpm test:e2e:update tests/e2e/public/menu-ar.spec.ts

import { expect, test } from '@playwright/test';

import { prismaTest, resetDb, seedMenu, seedUser } from '../fixtures/seed';

const FAKE_GLB =
  'https://res.cloudinary.com/demo/raw/upload/v1/digital-menu/test.glb';
const FAKE_USDZ =
  'https://res.cloudinary.com/demo/raw/upload/v1/digital-menu/test.usdz';

async function seedMenuWithArProduct(slug: string) {
  const user = await seedUser({
    plan: 'PRO',
    name: 'Nino Kapanadze',
    email: 'nino@cafelinville.ge',
  });
  const menu = await seedMenu({
    userId: user.id,
    status: 'PUBLISHED',
    categoryCount: 1,
    productCount: 3,
    name: 'Café Linville',
    slug,
  });

  // Flip AR fields on for the FIRST product in the FIRST category.
  // The other two seeded products keep arEnabled=false → no chip should render
  // for them (covered by the count assertion below).
  const firstCategory = await prismaTest.category.findFirst({
    where: { menuId: menu.id },
    orderBy: { sortOrder: 'asc' },
  });
  if (!firstCategory) throw new Error('Seeded category missing');

  const firstProduct = await prismaTest.product.findFirst({
    where: { categoryId: firstCategory.id },
    orderBy: { sortOrder: 'asc' },
  });
  if (!firstProduct) throw new Error('Seeded product missing');

  await prismaTest.product.update({
    where: { id: firstProduct.id },
    data: {
      arEnabled: true,
      arModelUrl: FAKE_GLB,
      arModelUrlIos: FAKE_USDZ,
    },
  });

  return { user, menu, productId: firstProduct.id };
}

test.describe('public menu — AR button + viewer (T18.5)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ context }) => {
    await resetDb();
    await context.clearCookies();
    await context.addCookies([
      { name: 'NEXT_LOCALE', value: 'en', domain: 'localhost', path: '/' },
    ]);
  });

  // ── Visual baseline ────────────────────────────────────────────────────────

  test('visual: public menu with AR-enabled product (mobile 375×812)', async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'mobile',
      'Visual baseline is mobile-only per T18.5 spec',
    );

    const slug = `ar-visual-${Date.now()}`;
    await seedMenuWithArProduct(slug);

    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`/m/${slug}`);
    await expect(page.getByTestId('public-product-ar-chip')).toBeVisible();

    // Settle fonts + image load before snapshotting
    await page.evaluate(() => document.fonts.ready);
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot(
      `public-product-with-ar-${testInfo.project.name}.png`,
      { fullPage: true, maxDiffPixelRatio: 0.05 },
    );
  });

  // ── Functional ─────────────────────────────────────────────────────────────

  test('functional: AR chip only renders for products with arEnabled=true', async ({
    page,
  }) => {
    const slug = `ar-chip-${Date.now()}`;
    await seedMenuWithArProduct(slug);

    await page.goto(`/m/${slug}`);

    const chips = page.getByTestId('public-product-ar-chip');
    await expect(chips).toHaveCount(1);
  });

  test('functional: clicking the AR chip opens the viewer dialog with <model-viewer>', async ({
    page,
  }) => {
    const slug = `ar-open-${Date.now()}`;
    await seedMenuWithArProduct(slug);

    await page.goto(`/m/${slug}`);

    const chip = page.getByTestId('public-product-ar-chip');
    await expect(chip).toBeVisible();
    await chip.click();

    const dialog = page.getByTestId('ar-viewer-dialog');
    await expect(dialog).toBeVisible();

    // The dialog renders a <model-viewer> only after @google/model-viewer
    // finishes its dynamic import — give it room to load over the LAN.
    await expect(dialog.locator('model-viewer')).toBeVisible({ timeout: 10_000 });

    // The element should carry the spec-mandated AR routing attributes.
    const modelViewer = dialog.locator('model-viewer');
    await expect(modelViewer).toHaveAttribute('src', FAKE_GLB);
    await expect(modelViewer).toHaveAttribute('ios-src', FAKE_USDZ);
    await expect(modelViewer).toHaveAttribute(
      'ar-modes',
      'scene-viewer quick-look webxr',
    );
  });

  test('functional: dialog closes on Escape', async ({ page }) => {
    // Backdrop click is unreliable on some Radix Dialog setups (overlay sits
    // under the centered content); Escape exercises the same close path
    // shadcn wires up by default and is a stable assertion.
    const slug = `ar-close-${Date.now()}`;
    await seedMenuWithArProduct(slug);

    await page.goto(`/m/${slug}`);

    await page.getByTestId('public-product-ar-chip').click();
    const dialog = page.getByTestId('ar-viewer-dialog');
    await expect(dialog).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });
});
