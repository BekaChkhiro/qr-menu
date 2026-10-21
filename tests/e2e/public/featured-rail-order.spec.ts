// T1.11 — the public "რეკომენდებული / Recommended" rail on /m/[slug].
//
// Run: pnpm test:e2e tests/e2e/public/featured-rail-order.spec.ts
//
// Manual picks (Product.featuredRank) decide what the rail shows and in what
// order; with no picks the ribbon fallback applies; Menu.featuredEnabled=false
// hides the rail altogether.
//
// Phase-21 constraint: NO resetDb / NO TRUNCATE. Additive seeds, cleanup by id.
// The "mark and publish" step is done straight in the DB here (no admin login);
// the admin drawer switch itself is covered by the product-form unit tests.

import { expect, test } from '@playwright/test';
import type { Ribbon } from '@prisma/client';
import bcrypt from 'bcryptjs';

import { prismaTest } from '../fixtures/seed';

const RUN_ID = `t111-${Date.now()}`;
const cleanupUserIds: string[] = [];

async function seedPublishedMenu(suffix: string, opts: { featuredEnabled?: boolean } = {}) {
  const user = await prismaTest.user.create({
    data: {
      email: `rail-${RUN_ID}-${suffix}@test.local`.toLowerCase(),
      name: 'Nino Kapanadze',
      plan: 'STARTER',
      password: await bcrypt.hash('x', 10),
      emailVerified: new Date(),
    },
  });
  cleanupUserIds.push(user.id);

  // DRAFT first, then flipped to PUBLISHED below — mirrors "mark, then publish".
  const menu = await prismaTest.menu.create({
    data: {
      userId: user.id,
      name: 'Café Linville',
      nameKa: 'Café Linville',
      slug: `linville-${RUN_ID}-${suffix}`,
      status: 'DRAFT',
      enabledLanguages: ['KA'],
      featuredEnabled: opts.featuredEnabled ?? true,
    },
  });
  const category = await prismaTest.category.create({
    data: { menuId: menu.id, nameKa: 'ცხელი სასმელები', type: 'DRINK', sortOrder: 0 },
  });
  return { menu, category };
}

async function addProduct(
  categoryId: string,
  sortOrder: number,
  data: { nameKa: string; featuredRank?: number | null; ribbons?: Ribbon[]; isAvailable?: boolean },
) {
  return prismaTest.product.create({
    data: {
      categoryId,
      nameKa: data.nameKa,
      price: 5,
      sortOrder,
      featuredRank: data.featuredRank ?? null,
      ribbons: data.ribbons ?? [],
      isAvailable: data.isAvailable ?? true,
    },
  });
}

async function publish(menuId: string) {
  await prismaTest.menu.update({
    where: { id: menuId },
    data: { status: 'PUBLISHED', publishedAt: new Date() },
  });
}

const railLinks = (page: import('@playwright/test').Page) =>
  page.getByTestId('featured-carousel').locator('a');

test.afterAll(async () => {
  for (const id of cleanupUserIds) {
    await prismaTest.user.delete({ where: { id } }).catch(() => {});
  }
});

test('marked dishes appear in the rail in the chosen order', async ({ page }) => {
  const { menu, category } = await seedPublishedMenu('order');

  const plain = await addProduct(category.id, 0, { nameKa: 'ყავა' });
  const second = await addProduct(category.id, 1, { nameKa: 'ჩაი', featuredRank: 2 });
  const first = await addProduct(category.id, 2, { nameKa: 'ლიმონათი', featuredRank: 1 });
  // Marked but unavailable: must not appear in the rail.
  const hidden = await addProduct(category.id, 3, {
    nameKa: 'სითბო',
    featuredRank: 0,
    isAvailable: false,
  });
  await publish(menu.id);

  await page.goto(`/m/${menu.slug}`);

  // Rail title is the KA "რეკომენდებული" (T1.11 rename).
  await expect(page.getByTestId('featured-carousel')).toHaveAttribute('aria-label', 'რეკომენდებული');

  const hrefs = await railLinks(page).evaluateAll((els) => els.map((el) => el.getAttribute('href')));
  expect(hrefs).toEqual([`#product-${first.id}`, `#product-${second.id}`]);
  expect(hrefs).not.toContain(`#product-${plain.id}`);
  expect(hrefs).not.toContain(`#product-${hidden.id}`);
});

test('with no manual picks the rail falls back to ribbon dishes', async ({ page }) => {
  const { menu, category } = await seedPublishedMenu('fallback');

  await addProduct(category.id, 0, { nameKa: 'ყავა' });
  const popular = await addProduct(category.id, 1, { nameKa: 'ჩაი', ribbons: ['POPULAR'] });
  await publish(menu.id);

  await page.goto(`/m/${menu.slug}`);

  await expect(railLinks(page)).toHaveCount(1);
  await expect(railLinks(page).first()).toHaveAttribute('href', `#product-${popular.id}`);
});

test('featuredEnabled=false hides the rail even when dishes are marked', async ({ page }) => {
  const { menu, category } = await seedPublishedMenu('disabled', { featuredEnabled: false });

  await addProduct(category.id, 0, { nameKa: 'ყავა', featuredRank: 1 });
  await publish(menu.id);

  await page.goto(`/m/${menu.slug}`);

  await expect(page.getByTestId('featured-carousel')).toHaveCount(0);
});
