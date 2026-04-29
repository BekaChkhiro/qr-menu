// Test for T18.4 — Product Drawer AR Tab (STARTER/FREE locked).
// Run:     pnpm test:e2e tests/e2e/admin/product-drawer-ar-locked.spec.ts
// Update:  pnpm test:e2e:update tests/e2e/admin/product-drawer-ar-locked.spec.ts
//
// Covers:
//   Visual — STARTER user sees blurred AR preview pad behind a centered
//            340px upgrade card with lock icon, title, body, and "Upgrade
//            to PRO" CTA (mirrors the allergens-locked treatment).
//   Functional — STARTER/FREE: PRO lock badge on the tab; opening the tab
//                shows the upgrade screen instead of the upload UI;
//                direct POST /api/upload/3d returns 403.

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

test.describe('product drawer — AR locked (T18.4)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ context }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop',
      'Desktop-only; mobile bottom-sheet variant lands in T17 mobile sweep',
    );
    await resetDb();
    await context.clearCookies();
    await context.addCookies([
      { name: 'NEXT_LOCALE', value: 'en', domain: 'localhost', path: '/' },
    ]);
  });

  async function seedAndOpenEditor(
    page: Page,
    plan: 'FREE' | 'STARTER' | 'PRO' = 'STARTER',
  ) {
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

  // ── Visual baseline ────────────────────────────────────────────────────────

  test('visual: STARTER user sees blurred AR pad + centered upgrade overlay', async ({
    page,
  }, testInfo) => {
    await seedAndOpenEditor(page, 'STARTER');
    await openEditDrawerForFirstProduct(page);
    await goToArTab(page);
    await suppressAnimations(page);

    const overlay = page.getByTestId('product-drawer-ar-locked-overlay');
    await expect(overlay).toBeVisible();

    const drawer = page.getByTestId('product-drawer');
    await expect(drawer).toHaveScreenshot(
      `product-drawer-ar-locked-${testInfo.project.name}.png`,
      { maxDiffPixelRatio: 0.05 },
    );
  });

  // ── Functional: STARTER tab shows PRO lock badge + upgrade screen ──────────

  test('functional: STARTER tab shows PRO lock badge and upgrade screen, not upload UI', async ({
    page,
  }) => {
    await seedAndOpenEditor(page, 'STARTER');
    await openEditDrawerForFirstProduct(page);

    const tab = page.getByTestId('product-drawer-tab-arModel');
    await expect(tab).toHaveAttribute('data-pro-locked', 'true');
    await expect(page.getByTestId('product-drawer-tab-arModel-lock')).toBeVisible();

    await goToArTab(page);

    // Locked overlay visible, upload UI absent.
    const locked = page.getByTestId('product-drawer-ar-locked');
    await expect(locked).toBeVisible();
    await expect(
      page.getByTestId('product-drawer-ar-locked-overlay'),
    ).toBeVisible();
    await expect(page.getByTestId('product-drawer-ar')).toHaveCount(0);
    await expect(page.getByTestId('product-drawer-ar-glb-dropzone')).toHaveCount(
      0,
    );
    await expect(
      page.getByTestId('product-drawer-ar-usdz-dropzone'),
    ).toHaveCount(0);
    await expect(
      page.getByTestId('product-drawer-ar-enable-toggle'),
    ).toHaveCount(0);
  });

  // ── Functional: blurred preview is non-interactive ─────────────────────────

  test('functional: blurred preview pad is non-interactive (pointer-events none, aria-hidden)', async ({
    page,
  }) => {
    await seedAndOpenEditor(page, 'STARTER');
    await openEditDrawerForFirstProduct(page);
    await goToArTab(page);

    const preview = page.getByTestId('product-drawer-ar-locked-preview');
    await expect(preview).toBeVisible();
    await expect(preview).toHaveAttribute('aria-hidden', 'true');

    // pointer-events: none — clicking the preview must not trigger a product
    // PUT request. Force-click bypasses actionability checks so we can verify
    // the CSS truly lets the click pass through.
    let sawMutation = false;
    page.on('request', (req) => {
      if (
        req.method() === 'PUT' &&
        /\/api\/menus\/[^/]+\/products\/[^/]+/.test(req.url())
      ) {
        sawMutation = true;
      }
    });

    await preview.click({ force: true, position: { x: 20, y: 20 } });
    await page.waitForTimeout(400);
    expect(sawMutation).toBe(false);
  });

  // ── Functional: CTA navigates to /admin/settings/billing ───────────────────

  test('functional: Upgrade to PRO CTA navigates to /admin/settings/billing', async ({
    page,
  }) => {
    await seedAndOpenEditor(page, 'STARTER');
    await openEditDrawerForFirstProduct(page);
    await goToArTab(page);

    const cta = page.getByTestId('product-drawer-ar-locked-cta');
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', '/admin/settings/billing');

    await cta.click();
    await expect(page).toHaveURL(/\/admin\/settings\/billing(\b|\?|$)/);
  });

  // ── Functional: FREE plan also sees the locked state ───────────────────────

  test('functional: FREE plan also shows the locked overlay (AR is PRO-only)', async ({
    page,
  }) => {
    await seedAndOpenEditor(page, 'FREE');
    await openEditDrawerForFirstProduct(page);
    await goToArTab(page);

    await expect(page.getByTestId('product-drawer-ar-locked')).toBeVisible();
    await expect(
      page.getByTestId('product-drawer-ar-locked-overlay'),
    ).toBeVisible();
    await expect(page.getByTestId('product-drawer-ar-glb-dropzone')).toHaveCount(
      0,
    );
  });

  // ── Functional: direct API call to /api/upload/3d returns 403 ──────────────

  test('functional: STARTER session POST /api/upload/3d returns 403', async ({
    page,
  }) => {
    await seedAndOpenEditor(page, 'STARTER');

    const response = await page.request.post('/api/upload/3d', {
      multipart: {
        file: {
          name: 'demo.glb',
          mimeType: 'model/gltf-binary',
          buffer: makeMinimalGlbBuffer(),
        },
      },
    });

    expect(response.status()).toBe(403);
    const body = (await response.json()) as {
      success: boolean;
      error?: { code?: string };
    };
    expect(body.success).toBe(false);
    expect(body.error?.code).toBe('FEATURE_NOT_AVAILABLE');
  });

  // ── Functional: direct PUT toggling arEnabled also returns 403 ─────────────

  test('functional: STARTER PUT /api/menus/:id/products/:pid with arEnabled returns 403', async ({
    page,
  }) => {
    const { menu } = await seedAndOpenEditor(page, 'STARTER');

    const product = await prismaTest.product.findFirst({
      where: { category: { menuId: menu.id } },
      orderBy: [{ category: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
      select: { id: true },
    });
    if (!product) throw new Error('Seeded product not found');

    const response = await page.request.fetch(
      `/api/menus/${menu.id}/products/${product.id}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify({ arEnabled: true }),
      },
    );

    expect(response.status()).toBe(403);
    const body = (await response.json()) as {
      success: boolean;
      error?: { code?: string };
    };
    expect(body.success).toBe(false);
    expect(body.error?.code).toBe('FEATURE_NOT_AVAILABLE');

    // arEnabled stayed false on disk.
    const after = await prismaTest.product.findUnique({
      where: { id: product.id },
      select: { arEnabled: true },
    });
    expect(after?.arEnabled).toBe(false);
  });
});
