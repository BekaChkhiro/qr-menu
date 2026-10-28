// T1.12 / T3.2 (client #2) — the Offers rail on /m/[slug] always sits above the
// menu body when ON and is absent when OFF. Menu.offersRailPosition places the
// Offers CATEGORY in the body: TOP = first section, BOTTOM = last — rail ON or OFF.
// The seed stores Offers between two regular categories (a stale sortOrder), so
// first/last can only come from the setting.
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

const RUN_ID = `t32-${Date.now()}`;
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

  const desserts = await prismaTest.category.create({
    data: { menuId: menu.id, nameKa: 'დესერტები', type: 'FOOD', sortOrder: 2 },
  });
  await prismaTest.product.create({
    data: { categoryId: desserts.id, nameKa: 'ჩურჩხელა', price: 4, sortOrder: 0 },
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

  return { menu, offers, regular, desserts, dish };
}

async function openMenu(page: Page, slug: string) {
  await page.goto(`/m/${slug}`);
  // Wait for the menu body only: with the rail on, `.or()` matched two elements.
  await expect(page.locator('[id^="category-"]').first()).toBeVisible();
}

// The rail is above the whole body when it sits above its first section.
async function railAboveBody(page: Page) {
  const railBox = await page.getByTestId('offers-carousel').boundingBox();
  const bodyBox = await page.locator('[id^="category-"]').first().boundingBox();
  return !!railBox && !!bodyBox && railBox.y < bodyBox.y;
}

// Body section ids, top to bottom, limited to the seeded categories.
async function sectionOrder(page: Page, ids: string[]) {
  const domIds = await page
    .locator('[id^="category-"]')
    .evaluateAll((els) => els.map((el) => el.id.replace(/^category-/, '')));
  return domIds.filter((id) => ids.includes(id));
}

test.afterAll(async () => {
  for (const id of cleanupUserIds) {
    await prismaTest.user.delete({ where: { id } }).catch(() => {});
  }
});

test.describe('Offers rail and Offers category position (T3.2)', () => {
  test('ON + TOP: rail above the body, Offers section first', async ({ page }) => {
    const { menu, offers, regular, desserts } = await seedMenuWithOffers('top', {
      offersRailEnabled: true,
      offersRailPosition: 'TOP',
    });
    await openMenu(page, menu.slug);
    await expect(page.getByTestId('offers-carousel')).toBeVisible();
    expect(await railAboveBody(page)).toBe(true);
    expect(await sectionOrder(page, [offers.id, regular.id, desserts.id])).toEqual([
      offers.id,
      regular.id,
      desserts.id,
    ]);
    await expect(page).toHaveScreenshot('offers-rail-on-top.png', { fullPage: true });
  });

  test('ON + BOTTOM: rail still above the body, Offers section last', async ({ page }) => {
    const { menu, offers, regular, desserts } = await seedMenuWithOffers('bottom', {
      offersRailEnabled: true,
      offersRailPosition: 'BOTTOM',
    });
    await openMenu(page, menu.slug);
    await expect(page.getByTestId('offers-carousel')).toBeVisible();
    expect(await railAboveBody(page)).toBe(true);
    expect(await sectionOrder(page, [offers.id, regular.id, desserts.id])).toEqual([
      regular.id,
      desserts.id,
      offers.id,
    ]);
    await expect(page).toHaveScreenshot('offers-rail-on-bottom.png', { fullPage: true });
  });

  test('OFF + BOTTOM: no rail, Offers section last', async ({ page }) => {
    const { menu, offers, regular, desserts } = await seedMenuWithOffers('off', {
      offersRailEnabled: false,
      offersRailPosition: 'BOTTOM',
    });
    await openMenu(page, menu.slug);
    await expect(page.getByTestId('offers-carousel')).toHaveCount(0);
    await expect(page.locator(`#category-${offers.id}`)).toBeVisible();
    expect(await sectionOrder(page, [offers.id, regular.id, desserts.id])).toEqual([
      regular.id,
      desserts.id,
      offers.id,
    ]);
    await expect(page).toHaveScreenshot('offers-rail-off.png', { fullPage: true });
  });

  // T2.7 (#12c) — a kind=COMBO product made in Content is not mirrored in the rail.
  test('the rail lists Offers products only; a Content combo stays in its category', async ({
    page,
  }) => {
    const { menu, regular, dish } = await seedMenuWithOffers('content-combo', {
      offersRailEnabled: true,
      offersRailPosition: 'TOP',
    });
    const tea = await prismaTest.product.create({
      data: { categoryId: regular.id, nameKa: 'ჩაი', price: 3, sortOrder: 1 },
    });
    await prismaTest.product.create({
      data: {
        categoryId: regular.id,
        kind: 'COMBO',
        nameKa: 'საუზმის სეტი',
        price: 7.5,
        sortOrder: 2,
        comboItems: {
          create: [
            { componentId: dish.id, quantity: 1, sortOrder: 0 },
            { componentId: tea.id, quantity: 1, sortOrder: 1 },
          ],
        },
      },
    });

    await openMenu(page, menu.slug);
    const rail = page.getByTestId('offers-carousel');
    await expect(rail).toBeVisible();
    await expect(rail.getByText('ყავა + ჩაი').first()).toBeVisible();
    await expect(rail.getByText('საუზმის სეტი')).toHaveCount(0);
    await expect(
      page.locator(`#category-${regular.id}`).getByText('საუზმის სეტი').first(),
    ).toBeVisible();
  });
});
