// T3.1 — client bug #1: a combo must keep its combo price under a menu-wide
// percentage promotion, struck against what its dishes cost on their own.
// Ordinary dishes still get the promotion.
//
// Run:     pnpm test:e2e tests/e2e/public/combo-pricing.spec.ts
//
// Phase-21 constraint: NO resetDb / NO TRUNCATE. Additive seeds, cleanup by id.

import { expect, test } from '@playwright/test';
import bcrypt from 'bcryptjs';

import { prismaTest } from '../fixtures/seed';

const RUN_ID = `t31-${Date.now()}`;
const cleanupUserIds: string[] = [];

async function seedComboMenu() {
  const user = await prismaTest.user.create({
    data: {
      email: `combo-pricing-${RUN_ID}@test.local`,
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
      slug: `linville-${RUN_ID}`,
      status: 'PUBLISHED',
      publishedAt: new Date(),
      enabledLanguages: ['KA'],
      offersRailEnabled: true,
      offersRailPosition: 'TOP',
    },
  });

  const breakfast = await prismaTest.category.create({
    data: { menuId: menu.id, nameKa: 'საუზმე', type: 'FOOD', sortOrder: 0 },
  });
  const dishes = await Promise.all(
    ['ხაჭაპური აჭარული', 'ბადრიჯანი ნიგვზით', 'თარხუნის ლიმონათი'].map((nameKa, sortOrder) =>
      prismaTest.product.create({
        data: { categoryId: breakfast.id, nameKa, price: 20, sortOrder },
      }),
    ),
  );

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
      nameKa: 'საუზმის სეტი',
      price: 50,
      sortOrder: 0,
      comboItems: {
        create: dishes.map((dish, sortOrder) => ({ componentId: dish.id, quantity: 1, sortOrder })),
      },
    },
  });

  await prismaTest.promotion.create({
    data: {
      menuId: menu.id,
      titleKa: 'საუზმის კომბო',
      type: 'COMBO',
      comboPrice: 50,
      comboProductIds: dishes.map((dish) => dish.id),
      comboProductId: combo.id,
      isActive: true,
      sortOrder: 0,
    },
  });
  await prismaTest.promotion.create({
    data: {
      menuId: menu.id,
      titleKa: '−22% მთელ მენიუზე',
      type: 'PERCENTAGE',
      discountType: 'PERCENTAGE',
      discountValue: 22,
      applyTo: 'ENTIRE_MENU',
      isActive: true,
      sortOrder: 1,
    },
  });

  return { menu, combo };
}

test.afterAll(async () => {
  for (const id of cleanupUserIds) {
    await prismaTest.user.delete({ where: { id } }).catch(() => {});
  }
});

test.describe('Combo pricing under a menu-wide promotion (T3.1)', () => {
  test('combo keeps 50.00 struck against 60.00; a dish shows 15.60 struck against 20.00', async ({
    page,
  }) => {
    const { menu, combo } = await seedComboMenu();
    await page.goto(`/m/${menu.slug}`);

    const comboCard = page
      .getByTestId('offers-carousel')
      .locator(`a[href="#product-${combo.id}"]`);
    await expect(comboCard).toBeVisible();
    await expect(comboCard).toContainText('50.00');
    await expect(comboCard.locator('.line-through')).toHaveText('60.00');
    await expect(comboCard).toContainText('-17%');
    await expect(comboCard).not.toContainText('39.00');

    // The combo card also names the dish in its included-dishes line, so skip it.
    const dishCard = page
      .getByTestId('public-product-card')
      .filter({ hasText: 'ხაჭაპური აჭარული' })
      .filter({ hasNotText: 'საუზმის სეტი' })
      .first();
    await expect(dishCard).toBeVisible();
    await expect(dishCard).toContainText('15.60');
    await expect(dishCard.getByTestId('public-old-price')).toContainText('20.00');
  });
});
