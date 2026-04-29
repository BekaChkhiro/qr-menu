// Test for T18.3 — Product Drawer AR Tab (PRO unlocked).
// Run:     pnpm test:e2e tests/e2e/admin/product-drawer-ar.spec.ts
// Update:  pnpm test:e2e:update tests/e2e/admin/product-drawer-ar.spec.ts
//
// Covers:
//   Visual — AR tab on a PRO product before any model is uploaded (empty
//   preview + GLB & USDZ drop-zones).
//   Functional — tab is unlocked for PRO; uploading a GLB persists
//   product.arModelUrl in the DB and replaces the dropzone with a file
//   summary; toggling Enable persists product.arEnabled.
//
// STARTER/FREE locked variant lands in T18.4 (product-drawer-ar-locked).

import { expect, test, type Page } from '@playwright/test';

import { loginAs } from '../fixtures/auth';
import { prismaTest, resetDb, seedMenu, seedUser } from '../fixtures/seed';

const GLB_MAGIC = [0x67, 0x6c, 0x54, 0x46]; // "glTF"

function makeMinimalGlbBuffer(extraBytes = 64): Buffer {
  const buf = Buffer.alloc(4 + extraBytes);
  buf.writeUInt8(GLB_MAGIC[0], 0);
  buf.writeUInt8(GLB_MAGIC[1], 1);
  buf.writeUInt8(GLB_MAGIC[2], 2);
  buf.writeUInt8(GLB_MAGIC[3], 3);
  return buf;
}

test.describe('product drawer — AR tab (T18.3)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ context }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop',
      'Desktop-only; mobile bottom-sheet variant is part of T17 mobile sweep',
    );
    await resetDb();
    await context.clearCookies();
    await context.addCookies([
      { name: 'NEXT_LOCALE', value: 'en', domain: 'localhost', path: '/' },
    ]);
  });

  async function seedAndOpenEditor(page: Page, plan: 'FREE' | 'STARTER' | 'PRO' = 'PRO') {
    const email = 'nino@cafelinville.ge';
    const user = await seedUser({ plan, name: 'Nino Kapanadze', email });
    const menu = await seedMenu({
      userId: user.id,
      status: 'PUBLISHED',
      categoryCount: 2,
      productCount: 2,
      name: 'Café Linville — Dinner',
    });
    await loginAs(page, email);
    await page.goto(`/admin/menus/${menu.id}?tab=content`);
    return { user, menu };
  }

  async function expandFirstCategory(page: Page) {
    const firstRow = page.getByTestId('category-row').first();
    await firstRow.getByTestId('category-row-toggle').click();
    await expect(firstRow).toHaveAttribute('data-expanded', 'true');
  }

  async function openEditDrawerForFirstProduct(page: Page) {
    await expandFirstCategory(page);
    await page
      .getByTestId('product-row')
      .first()
      .getByTestId('product-kebab-trigger')
      .click();
    await page.getByTestId('product-kebab-edit').click();
    await expect(page.getByTestId('product-drawer')).toBeVisible();
  }

  async function goToArTab(page: Page) {
    await page.getByTestId('product-drawer-tab-arModel').click();
    await expect(page.getByTestId('product-drawer-tab-arModel')).toHaveAttribute(
      'data-state',
      'active',
    );
  }

  async function suppressAnimations(page: Page) {
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({
      content:
        '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }',
    });
  }

  async function getFirstProductId(menuId: string): Promise<string> {
    const product = await prismaTest.product.findFirst({
      where: { category: { menuId } },
      orderBy: [{ category: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
      select: { id: true },
    });
    if (!product) throw new Error('Seeded product not found');
    return product.id;
  }

  // ── Visual baseline ────────────────────────────────────────────────────────

  test('visual: AR tab (PRO, empty state)', async ({ page }, testInfo) => {
    await seedAndOpenEditor(page, 'PRO');
    await openEditDrawerForFirstProduct(page);
    await goToArTab(page);
    await suppressAnimations(page);

    // Wait for both drop-zones to render
    await expect(page.getByTestId('product-drawer-ar-glb-dropzone')).toBeVisible();
    await expect(page.getByTestId('product-drawer-ar-usdz-dropzone')).toBeVisible();

    const drawer = page.getByTestId('product-drawer');
    await expect(drawer).toHaveScreenshot(
      `product-drawer-ar-tab-${testInfo.project.name}.png`,
      { maxDiffPixelRatio: 0.05 },
    );
  });

  // ── Functional ─────────────────────────────────────────────────────────────

  test('functional: AR tab is unlocked for PRO (no lock badge on trigger)', async ({
    page,
  }) => {
    await seedAndOpenEditor(page, 'PRO');
    await openEditDrawerForFirstProduct(page);

    const trigger = page.getByTestId('product-drawer-tab-arModel');
    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveAttribute('data-pro-locked', 'false');
    await expect(
      page.getByTestId('product-drawer-tab-arModel-lock'),
    ).toHaveCount(0);
  });

  test('functional: uploading a .glb persists arModelUrl and shows the file summary', async ({
    page,
  }) => {
    const { menu } = await seedAndOpenEditor(page, 'PRO');
    const productId = await getFirstProductId(menu.id);

    // Sanity: starts empty
    const before = await prismaTest.product.findUnique({
      where: { id: productId },
      select: { arModelUrl: true, arEnabled: true },
    });
    expect(before?.arModelUrl).toBeNull();
    expect(before?.arEnabled).toBe(false);

    await openEditDrawerForFirstProduct(page);
    await goToArTab(page);

    // Stub Cloudinary by intercepting the upload endpoint — we don't want the
    // real cloud here. Local validation (magic bytes, MIME, size) still runs
    // before the cloud call, so a real GLB buffer is required.
    await page.route('**/api/upload/3d', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            url: 'https://res.cloudinary.com/demo/raw/upload/v1/digital-menu/test.glb',
            publicId: 'digital-menu/test',
            kind: 'glb',
          },
        }),
      });
    });

    // Wait for the PUT /products/:id call that persists arModelUrl
    const putPromise = page.waitForResponse(
      (res) =>
        res.url().includes(`/api/menus/${menu.id}/products/${productId}`) &&
        res.request().method() === 'PUT' &&
        res.status() === 200,
    );

    // Drive the hidden file input directly — Playwright supports this on any
    // <input type="file"> regardless of visibility.
    const glbInput = page.getByTestId('product-drawer-ar-glb-input');
    await glbInput.setInputFiles({
      name: 'demo.glb',
      mimeType: 'model/gltf-binary',
      buffer: makeMinimalGlbBuffer(),
    });

    await putPromise;

    // UI flips from dropzone to summary
    await expect(page.getByTestId('product-drawer-ar-glb-summary')).toBeVisible();
    await expect(
      page.getByTestId('product-drawer-ar-glb-filename'),
    ).toContainText('test.glb');

    // DB reflects the change
    const after = await prismaTest.product.findUnique({
      where: { id: productId },
      select: { arModelUrl: true },
    });
    expect(after?.arModelUrl).toBe(
      'https://res.cloudinary.com/demo/raw/upload/v1/digital-menu/test.glb',
    );
  });

  test('functional: enable toggle persists arEnabled once a GLB is uploaded', async ({
    page,
  }) => {
    const { menu } = await seedAndOpenEditor(page, 'PRO');
    const productId = await getFirstProductId(menu.id);

    // Seed the GLB URL directly so we can focus on the toggle.
    await prismaTest.product.update({
      where: { id: productId },
      data: {
        arModelUrl:
          'https://res.cloudinary.com/demo/raw/upload/v1/digital-menu/test.glb',
      },
    });

    await openEditDrawerForFirstProduct(page);
    await goToArTab(page);

    const toggle = page.getByTestId('product-drawer-ar-enable-toggle');
    await expect(toggle).toBeEnabled();

    const putPromise = page.waitForResponse(
      (res) =>
        res.url().includes(`/api/menus/${menu.id}/products/${productId}`) &&
        res.request().method() === 'PUT' &&
        res.status() === 200,
    );

    await toggle.click();
    await putPromise;

    const after = await prismaTest.product.findUnique({
      where: { id: productId },
      select: { arEnabled: true },
    });
    expect(after?.arEnabled).toBe(true);

    // Preview switches from empty state to active
    await expect(page.getByTestId('product-drawer-ar-preview')).toHaveAttribute(
      'data-state',
      'active',
    );
  });
});
