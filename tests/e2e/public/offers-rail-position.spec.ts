// T1.12 — the Offers rail on /m/[slug]: ON + TOP (today's layout), ON + BOTTOM
// (rail after the menu body) and OFF (no rail; Offers listed as a normal category).
//
// Run:     pnpm test:e2e tests/e2e/public/offers-rail-position.spec.ts
// Update:  pnpm test:e2e:update tests/e2e/public/offers-rail-position.spec.ts
//
// Phase-21 constraint: NO resetDb / NO TRUNCATE. Additive seeds, cleanup by id.
// The Offers category is only shown while a live COMBO promotion points at its
// product, so each menu gets one.

import { expect, test, type Page } from '@playwright/test';
import type { OffersRailPosition } from '@prisma/client';
import bcrypt from 'bcryptjs';

import { prismaTest } from '../fixtures/seed';

const RUN_ID = `t112-${Date.now()}`;
const cleanupUserIds: string[] = [];

async function seedMenuWithOffers(
  suffix: string,
  rail: { offersRailEnabled: boolean; offersRailPosition: OffersRailPosition },
) {
  const user = await prismaTest.user.create({
    data: {
      email: `offers-${RUN_ID}-${suffix}@test.local`.toLowerCase(),
      name: 'Nino Kapanadze',
      plan: 'STARTER',
      password: await bcrypt.hash('x', 10),
      emailVerified: new Date(),
    },
  });
  cleanupUserIds.push(user.id);

  const menu = await prismaTest.menu.create({
    data: {
      userId: user.id,
      name: 'Café Linville',
      nameKa: 'Café Linville',
      slug: `linville-${RUN_ID}-${suffix}`,
      status: 'PUBLISHED',
      publishedAt: new Date(),
      enabledLanguages: ['KA'],
      ...rail,
    },
  });

  const regular = await prismaTest.category.create({
    data: { menuId: menu.id, nameKa: 'ცხელი სასმელები', type: 'DRINK', sortOrder: 0 },
  });
  const dish = await prismaTest.product.create({
    data: { categoryId: regular.id, nameKa: 'ყავა', price: 5, sortOrder: 0 },
  });

  const offers = await prismaTest.category.create({
    data: {
      menuId: menu.id,
      nameKa: 'შეთავაზება',
      nameEn: 'Offers',
      nameRu: 'Предложения',
      type: 'OTHER',
      isSystemOffers: true,
      sortOrder: 1,
    },
  });
  const combo = await prismaTest.product.create({
    data: { categoryId: offers.id, nameKa: 'ყავა + ჩაი', price: 7, sortOrder: 0 },
  });
  await prismaTest.promotion.create({
    data: {
      menuId: menu.id,
      titleKa: 'კომბო',
      type: 'COMBO',
      comboPrice: 7,
      comboProductIds: [dish.id],
      comboProductId: combo.id,
      isActive: true,
    },
  });

  return { menu, offers, regular };
}

async function openMenu(page: Page, slug: string) {
  await page.goto(`/m/${slug}`);
  await expect(page.getByTestId('offers-carousel').or(page.locator('[id^="category-"]').first())).toBeVisible();
}

// Vertical position of the rail relative to the Offers category's own body
// section (the rail, when present, sits above or below the whole body).
async function railOrder(page: Page, categoryId: string) {
  const rail = page.getByTestId('offers-carousel');
  const body = page.locator(`#category-${categoryId}`);
  const railBox = await rail.boundingBox();
  const bodyBox = await body.boundingBox();
  return { railAboveBody: !!railBox && !!bodyBox && railBox.y < bodyBox.y };
}

test.afterAll(async () => {
  for (const id of cleanupUserIds) {
    await prismaTest.user.delete({ where: { id } }).catch(() => {});
  }
});

test.describe('Offers rail position (T1.12)', () => {
  test('ON + TOP: rail above the menu body', async ({ page }) => {
    const { menu, offers } = await seedMenuWithOffers('top', {
      offersRailEnabled: true,
      offersRailPosition: 'TOP',
    });
    await openMenu(page, menu.slug);
    await expect(page.getByTestId('offers-carousel')).toBeVisible();
    expect((await railOrder(page, offers.id)).railAboveBody).toBe(true);
    await expect(page).toHaveScreenshot('offers-rail-on-top.png', { fullPage: true });
  });

  test('ON + BOTTOM: rail after the menu body', async ({ page }) => {
    const { menu, offers } = await seedMenuWithOffers('bottom', {
      offersRailEnabled: true,
      offersRailPosition: 'BOTTOM',
    });
    await openMenu(page, menu.slug);
    await expect(page.getByTestId('offers-carousel')).toBeVisible();
    expect((await railOrder(page, offers.id)).railAboveBody).toBe(false);
    await expect(page).toHaveScreenshot('offers-rail-on-bottom.png', { fullPage: true });
  });

  test('OFF: no rail; Offers listed in the body as a normal category', async ({ page }) => {
    const { menu, offers } = await seedMenuWithOffers('off', {
      offersRailEnabled: false,
      offersRailPosition: 'TOP',
    });
    await openMenu(page, menu.slug);
    await expect(page.getByTestId('offers-carousel')).toHaveCount(0);
    await expect(page.locator(`#category-${offers.id}`)).toBeVisible();
    await expect(page).toHaveScreenshot('offers-rail-off.png', { fullPage: true });
  });
});
