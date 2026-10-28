// T3.3 (client #3) — the product drawer's "Show in Offers" switch and order
// input save Product.offerRank.
//
// Run:     pnpm test:e2e tests/e2e/admin/product-drawer-offer.spec.ts
//
// **No `resetDb()`** — additive: a unique-email STARTER user with one menu,
// deleted (cascading the menu) in afterAll.

import { expect, test } from '@playwright/test';

import { loginAs } from '../fixtures/auth';
import { prismaTest, seedMenu, seedUser } from '../fixtures/seed';

const RUN_ID = `t3-3-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const EMAIL = `${RUN_ID}@test.local`;

let userId = '';
let menuId = '';

test.describe('product drawer · Offers rail pick (T3.3)', () => {
  test.beforeAll(async () => {
    const user = await seedUser({ plan: 'STARTER', email: EMAIL, name: 'Nino Kapanadze' });
    userId = user.id;
    const menu = await seedMenu({
      userId: user.id,
      status: 'PUBLISHED',
      categoryCount: 1,
      productCount: 1,
      name: `T3.3 Menu ${RUN_ID}`,
      slug: `t3-3-${RUN_ID}`,
    });
    menuId = menu.id;
  });

  test.afterAll(async () => {
    if (userId) {
      await prismaTest.user.delete({ where: { id: userId } }).catch(() => {});
    }
  });

  test('functional: switch on, order 2, save → offerRank = 2', async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'Desktop drawer only');
    await context.clearCookies();
    await context.addCookies([{ name: 'NEXT_LOCALE', value: 'en', domain: 'localhost', path: '/' }]);
    await loginAs(page, EMAIL);
    await page.goto(`/admin/menus/${menuId}?tab=content`);

    const firstRow = page.getByTestId('category-row').first();
    if ((await firstRow.getAttribute('data-expanded')) !== 'true') {
      await firstRow.getByTestId('category-row-toggle').click();
    }
    await expect(firstRow).toHaveAttribute('data-expanded', 'true');
    await page.getByTestId('product-row').first().getByTestId('product-action-edit').click();
    await expect(page.getByTestId('product-drawer')).toBeVisible();

    const toggle = page.getByTestId('product-basics-offer-toggle');
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
    await expect(page.getByTestId('product-basics-offer-rank-input')).toHaveCount(0);

    await toggle.click();
    const rank = page.getByTestId('product-basics-offer-rank-input');
    await expect(rank).toBeVisible();

    // Switch on with no order → the order is required, nothing saved.
    await page.getByTestId('product-drawer-save').click();
    await expect(page.getByTestId('product-basics-offer-rank-error')).toBeVisible();

    await rank.fill('2');
    const put = page.waitForResponse(
      (r) => r.url().includes(`/api/menus/${menuId}/products/`) && r.request().method() === 'PUT',
    );
    await page.getByTestId('product-drawer-save').click();
    const response = await put;
    expect(response.status()).toBe(200);
    expect((await response.json()).data.offerRank).toBe(2);

    const product = await prismaTest.product.findFirstOrThrow({
      where: { category: { menuId } },
      select: { offerRank: true, featuredRank: true },
    });
    expect(product).toEqual({ offerRank: 2, featuredRank: null });

    // Reopening after a reload prefills the switch and the order from the API.
    await expect(page.getByTestId('product-drawer')).toBeHidden();
    await page.reload();
    const row = page.getByTestId('category-row').first();
    if ((await row.getAttribute('data-expanded')) !== 'true') {
      await row.getByTestId('category-row-toggle').click();
    }
    await page.getByTestId('product-row').first().getByTestId('product-action-edit').click();
    await expect(page.getByTestId('product-basics-offer-toggle')).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await expect(page.getByTestId('product-basics-offer-rank-input')).toHaveValue('2');
  });
});
