// T22.18 — Promotion Apply-To: Fix Category Scope + Drop "Specific Items".
//
// Run:    pnpm test:e2e tests/e2e/admin/promotion-category-scope.spec.ts
// Update: pnpm test:e2e:update tests/e2e/admin/promotion-category-scope.spec.ts
//
// Bug:
//   A promotion scoped to a category (applyTo=CATEGORY + categoryId) — or to
//   the whole menu — was stored but never affected the prices shown on the
//   public menu. It only appeared as a carousel banner. The category's product
//   prices did not change, so the owner's "announce a category discount" flow
//   produced nothing visible.
//
// Fix (lib/public-menu.ts → applyPromotionPricing):
//   - Public menu fetch now selects discountType / discountValue / applyTo /
//     categoryId on active promotions.
//   - Active PERCENTAGE / FIXED_AMOUNT promotions scoped to ENTIRE_MENU or a
//     CATEGORY lower the affected products' prices (oldPrice = original,
//     price = discounted), so the card renders strikethrough + −N% ribbon.
//   - "Last wins": a product that already carries a manual oldPrice (a per-dish
//     discount) is left untouched — the dish-level discount wins.
//   - The drawer no longer offers the "specific items" scope (whole-menu /
//     category only); the schema rejects SPECIFIC_ITEMS on write.
//
// Phase-21 constraint: NO resetDb / NO TRUNCATE. Seed additive rows directly
// via `prismaTest`, clean up by user id in `afterAll`.

import { expect, test, type Locator, type Page } from '@playwright/test';
import bcrypt from 'bcryptjs';

import { loginAs } from '../fixtures/auth';
import { prismaTest } from '../fixtures/seed';

const RUN_ID = `t22-18-${Date.now()}`;
const cleanupUserIds: string[] = [];

async function seedStarterUserAndMenu(slugSuffix: string) {
  const email = `promo-scope-${RUN_ID}-${slugSuffix}@test.local`;
  const user = await prismaTest.user.create({
    data: {
      email: email.toLowerCase(),
      name: 'Nino Kapanadze',
      plan: 'STARTER',
      password: await bcrypt.hash('password-not-used', 10),
      emailVerified: new Date(),
    },
  });
  cleanupUserIds.push(user.id);

  const menu = await prismaTest.menu.create({
    data: {
      userId: user.id,
      name: 'Café Linville',
      nameKa: 'Café Linville',
      slug: `linville-${RUN_ID}-${slugSuffix}`,
      status: 'PUBLISHED',
      publishedAt: new Date(),
      enabledLanguages: ['KA'],
    },
  });

  return { email, user, menu };
}

/** Locate the public product card whose title matches `name`. */
function cardByName(page: Page, name: string): Locator {
  return page
    .getByTestId('public-product-card')
    .filter({ has: page.getByRole('heading', { name, exact: true }) });
}

test.afterAll(async () => {
  for (const userId of cleanupUserIds) {
    // Cascades delete menus → categories → products → promotions.
    await prismaTest.user.delete({ where: { id: userId } }).catch(() => {});
  }
});

test.describe('T22.18 promotion category scope — public pricing', () => {
  test('category-scoped percentage promotion discounts only that category', async ({ page }) => {
    const { menu } = await seedStarterUserAndMenu('pct');

    const drinks = await prismaTest.category.create({
      data: { menuId: menu.id, nameKa: 'სასმელები', type: 'DRINK', sortOrder: 0 },
    });
    const foods = await prismaTest.category.create({
      data: { menuId: menu.id, nameKa: 'საჭმელები', type: 'FOOD', sortOrder: 1 },
    });

    // Drinks: a plain product (should get the discount) and one that already
    // carries a manual per-dish discount (should be left untouched — dish wins).
    // The cocktail carries an image so the −N% ribbon renders — that badge is an
    // overlay on the product image, so image-less cards show only the
    // strikethrough + new price.
    await prismaTest.product.create({
      data: {
        categoryId: drinks.id,
        nameKa: 'საფირმო კოქტეილი',
        price: 20,
        imageUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        sortOrder: 0,
      },
    });
    await prismaTest.product.create({
      data: {
        categoryId: drinks.id,
        nameKa: 'ლუდი',
        price: 10,
        oldPrice: 12, // manual dish-level discount
        sortOrder: 1,
      },
    });
    // Foods: outside the promoted category — price must stay untouched.
    await prismaTest.product.create({
      data: { categoryId: foods.id, nameKa: 'ხაჭაპური აჭარული', price: 30, sortOrder: 0 },
    });

    await prismaTest.promotion.create({
      data: {
        menuId: menu.id,
        titleKa: 'სასმელებზე -20%',
        isActive: true,
        startDate: new Date(Date.now() - 60 * 60 * 1000),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        discountType: 'PERCENTAGE',
        discountValue: 20,
        applyTo: 'CATEGORY',
        categoryId: drinks.id,
      },
    });

    await page.goto(`/m/${menu.slug}`);

    // Cocktail (in promoted category, no manual discount): 20.00 → 16.00.
    const cocktail = cardByName(page, 'საფირმო კოქტეილი');
    await expect(cocktail).toBeVisible();
    await expect(cocktail).toContainText('16.00');
    await expect(cocktail.getByTestId('public-old-price')).toContainText('20.00');
    await expect(cocktail).toContainText('−20%');

    // Beer (manual dish discount): category promo must NOT override it.
    const beer = cardByName(page, 'ლუდი');
    await expect(beer).toContainText('10.00');
    await expect(beer.getByTestId('public-old-price')).toContainText('12.00');

    // Xachapuri (outside promoted category): unchanged, no strikethrough.
    const xachapuri = cardByName(page, 'ხაჭაპური აჭარული');
    await expect(xachapuri).toContainText('30.00');
    await expect(xachapuri.getByTestId('public-old-price')).toHaveCount(0);
  });

  test('menu-wide fixed-amount promotion discounts every category', async ({ page }) => {
    const { menu } = await seedStarterUserAndMenu('menuwide');

    const drinks = await prismaTest.category.create({
      data: { menuId: menu.id, nameKa: 'სასმელები', type: 'DRINK', sortOrder: 0 },
    });
    const foods = await prismaTest.category.create({
      data: { menuId: menu.id, nameKa: 'საჭმელები', type: 'FOOD', sortOrder: 1 },
    });
    await prismaTest.product.create({
      data: { categoryId: drinks.id, nameKa: 'თარხუნის ლიმონათი', price: 8, sortOrder: 0 },
    });
    await prismaTest.product.create({
      data: { categoryId: foods.id, nameKa: 'ხინკალი', price: 15, sortOrder: 0 },
    });

    await prismaTest.promotion.create({
      data: {
        menuId: menu.id,
        titleKa: 'მთელ მენიუზე -5₾',
        isActive: true,
        startDate: new Date(Date.now() - 60 * 60 * 1000),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        discountType: 'FIXED_AMOUNT',
        discountValue: 5,
        applyTo: 'ENTIRE_MENU',
      },
    });

    await page.goto(`/m/${menu.slug}`);

    const lemonade = cardByName(page, 'თარხუნის ლიმონათი');
    await expect(lemonade).toContainText('3.00'); // 8 − 5
    await expect(lemonade.getByTestId('public-old-price')).toContainText('8.00');

    const khinkali = cardByName(page, 'ხინკალი');
    await expect(khinkali).toContainText('10.00'); // 15 − 5
    await expect(khinkali.getByTestId('public-old-price')).toContainText('15.00');
  });
});

test.describe('T22.18 promotion drawer — apply-to options', () => {
  test('drawer offers whole-menu / category only (no specific items)', async ({ page }) => {
    const { email, menu } = await seedStarterUserAndMenu('drawer');
    await loginAs(page, email);

    await page.goto(`/admin/menus/${menu.id}?tab=promotions`);
    await page.getByTestId('editor-promotions-new').click();
    await expect(page.getByTestId('promotion-drawer')).toBeVisible();

    await expect(page.getByTestId('promotion-drawer-apply-to')).toBeVisible();
    await expect(page.getByTestId('promotion-apply-to-entire')).toBeVisible();
    await expect(page.getByTestId('promotion-apply-to-category')).toBeVisible();
    // The retired "specific items" scope must be gone.
    await expect(page.getByTestId('promotion-apply-to-items')).toHaveCount(0);
  });
});
