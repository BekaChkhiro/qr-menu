// T3.3 (client #3) — any dish picked with Product.offerRank joins the public
// Offers rail: alone (no COMBO promotion, no Offers category) and ahead of the
// system Offers category's combo products.
//
// Run:     pnpm test:e2e tests/e2e/public/offers-rail-pick.spec.ts
//
// Phase-21 constraint: NO resetDb / NO TRUNCATE. Additive seeds, cleanup by id.

import { expect, test } from '@playwright/test';
import bcrypt from 'bcryptjs';

import { prismaTest } from '../fixtures/seed';

const RUN_ID = `t33-${Date.now()}`;
const cleanupUserIds: string[] = [];

async function seedMenu(suffix: string) {
  const user = await prismaTest.user.create({
    data: {
      email: `offer-pick-${RUN_ID}-${suffix}@test.local`.toLowerCase(),
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
      offersRailEnabled: true,
      offersRailPosition: 'BOTTOM',
    },
  });

  const food = await prismaTest.category.create({
    data: { menuId: menu.id, nameKa: 'ცხელი კერძები', type: 'FOOD', sortOrder: 0 },
  });
  const khinkali = await prismaTest.product.create({
    data: { categoryId: food.id, nameKa: 'ხინკალი', price: 12, sortOrder: 0 },
  });
  const khachapuri = await prismaTest.product.create({
    data: { categoryId: food.id, nameKa: 'ხაჭაპური აჭარული', price: 18, sortOrder: 1, offerRank: 1 },
  });

  return { menu, khinkali, khachapuri };
}

test.afterAll(async () => {
  for (const id of cleanupUserIds) {
    await prismaTest.user.delete({ where: { id } }).catch(() => {});
  }
});

test.describe('Offers rail picks (T3.3)', () => {
  test('a picked dish fills the rail on a menu without a COMBO promotion', async ({ page }) => {
    const { menu } = await seedMenu('no-combo');

    await page.goto(`/m/${menu.slug}`);
    const rail = page.getByTestId('offers-carousel');
    await expect(rail).toBeVisible();
    await expect(rail.getByText('ხაჭაპური აჭარული').first()).toBeVisible();
    await expect(rail.getByText('ხინკალი')).toHaveCount(0);
  });

  test('the picked dish leads, the promotion combo follows', async ({ page }) => {
    const { menu, khinkali } = await seedMenu('with-combo');
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
      data: {
        categoryId: offers.id,
        kind: 'COMBO',
        nameKa: 'ხინკალი + ლიმონათი',
        price: 15,
        sortOrder: 0,
      },
    });
    await prismaTest.promotion.create({
      data: {
        menuId: menu.id,
        titleKa: 'კომბო',
        type: 'COMBO',
        comboPrice: 15,
        comboProductIds: [khinkali.id],
        comboProductId: combo.id,
        isActive: true,
      },
    });

    await page.goto(`/m/${menu.slug}`);
    const rail = page.getByTestId('offers-carousel');
    await expect(rail).toBeVisible();
    await expect(rail.getByText('ხინკალი + ლიმონათი').first()).toBeVisible();

    // Rail order: the pick first, then the combo.
    const text = (await rail.innerText()).replace(/\s+/g, ' ');
    const pickAt = text.indexOf('ხაჭაპური აჭარული');
    const comboAt = text.indexOf('ხინკალი + ლიმონათი');
    expect(pickAt).toBeGreaterThanOrEqual(0);
    expect(comboAt).toBeGreaterThan(pickAt);
  });
});
