// T21.5 — Menu.cornerRadius propagates to public menu card surfaces.
// Run:    pnpm test:e2e tests/e2e/public/branding-radius.spec.ts
//
// Strategy: this spec NEVER resets the database. It creates a single
// uniquely-named user + published menu, asserts the wiring at two
// distinct radii, and deletes the user in afterAll (cascade removes
// the menu, categories, products).

import { expect, test } from '@playwright/test';

import { invalidateMenuCache } from '@/lib/cache/redis';
import { prismaTest, seedMenu, seedUser } from '../fixtures/seed';

const runId = Math.random().toString(36).slice(2, 8);
const slug = `t215-radius-${runId}`;
const email = `t215-radius-${runId}@test.local`;

let userId: string;
let menuId: string;

test.describe('T21.5 — public menu corner radius', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    const user = await seedUser({ plan: 'PRO', email, name: 'Nino Kapanadze' });
    userId = user.id;

    const menu = await seedMenu({
      userId,
      status: 'PUBLISHED',
      slug,
      categoryCount: 1,
      productCount: 1,
      name: 'Café Linville',
    });
    menuId = menu.id;
  });

  test.afterAll(async () => {
    if (userId) {
      await prismaTest.user.delete({ where: { id: userId } }).catch(() => {});
    }
  });

  test('CSS var + product card border-radius reflect Menu.cornerRadius', async ({ page }) => {
    // Case 1: cornerRadius = 24
    await prismaTest.menu.update({
      where: { id: menuId },
      data: { cornerRadius: 24, productCardStyle: 'BORDERED' },
    });
    await invalidateMenuCache(menuId, slug);
    await page.goto(`/m/${slug}`);

    const wrapper = page.locator('div.min-h-screen').first();
    await expect(wrapper).toBeVisible();

    const radiusVar24 = await wrapper.evaluate((el) =>
      getComputedStyle(el).getPropertyValue('--menu-radius-card').trim(),
    );
    expect(radiusVar24).toBe('24px');

    const productCard = page.locator('[data-testid="public-product-card"]').first();
    await expect(productCard).toBeVisible();
    await expect(productCard).toHaveCSS('border-radius', '24px');

    // Case 2: cornerRadius = 4 — same surfaces tighten visibly.
    await prismaTest.menu.update({
      where: { id: menuId },
      data: { cornerRadius: 4 },
    });
    await invalidateMenuCache(menuId, slug);
    await page.goto(`/m/${slug}`);

    const wrapperReloaded = page.locator('div.min-h-screen').first();
    await expect(wrapperReloaded).toBeVisible();

    const radiusVar4 = await wrapperReloaded.evaluate((el) =>
      getComputedStyle(el).getPropertyValue('--menu-radius-card').trim(),
    );
    expect(radiusVar4).toBe('4px');

    const productCard4 = page.locator('[data-testid="public-product-card"]').first();
    await expect(productCard4).toBeVisible();
    await expect(productCard4).toHaveCSS('border-radius', '4px');
  });
});
