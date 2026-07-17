// T21.8 — Multilingual Form Sync (Product + Promotion drawers).
//
// Run:    pnpm test:e2e tests/e2e/admin/product-form-lang-sync.spec.ts
// Update: pnpm test:e2e:update tests/e2e/admin/product-form-lang-sync.spec.ts
//
// Bug: in the product/promotion drawers, the language switch was per-field —
// switching the name tab to EN did not move the description (or variation
// name) along with it. The fix lifts language scope to one switcher in the
// drawer header.
//
// Phase 21 constraint: additive seeds only. No resetDb / no TRUNCATE.

import { expect, test } from '@playwright/test';
import bcrypt from 'bcryptjs';

import { loginAs } from '../fixtures/auth';
import { prismaTest } from '../fixtures/seed';

const RUN_ID = `t21-8-${Date.now()}`;
const cleanupUserIds: string[] = [];

async function seedProDrawerScenario() {
  const email = `lang-sync-${RUN_ID}@test.local`;
  const user = await prismaTest.user.create({
    data: {
      email: email.toLowerCase(),
      name: 'Nino Kapanadze',
      plan: 'PRO',
      password: await bcrypt.hash('password-not-used', 10),
      emailVerified: new Date(),
    },
  });
  cleanupUserIds.push(user.id);

  const menu = await prismaTest.menu.create({
    data: {
      userId: user.id,
      name: 'Café Linville',
      nameKa: 'კაფე ლინვილი',
      nameEn: 'Café Linville',
      nameRu: 'Кафе Линвиль',
      slug: `linville-${RUN_ID}`,
      status: 'PUBLISHED',
      publishedAt: new Date(),
      enabledLanguages: ['KA', 'EN', 'RU'],
    },
  });

  const category = await prismaTest.category.create({
    data: {
      menuId: menu.id,
      nameKa: 'მთავარი კერძები',
      nameEn: 'Main dishes',
      nameRu: 'Основные блюда',
      type: 'FOOD',
      sortOrder: 0,
    },
  });

  const product = await prismaTest.product.create({
    data: {
      categoryId: category.id,
      nameKa: 'ხაჭაპური აჭარული',
      nameEn: 'Adjarian Khachapuri',
      nameRu: 'Аджарский Хачапури',
      descriptionKa: 'ცომი, ყველი, კვერცხი',
      descriptionEn: 'Dough, cheese, egg',
      descriptionRu: 'Тесто, сыр, яйцо',
      price: 16.0,
      sortOrder: 0,
    },
  });

  await prismaTest.productVariation.create({
    data: {
      productId: product.id,
      nameKa: 'პატარა',
      nameEn: 'Small',
      nameRu: 'Маленький',
      price: 14.0,
      sortOrder: 0,
      isDefault: true,
    },
  });

  return { user, menu, category, product, email };
}

test.describe('T21.8 multilingual form sync — product drawer', () => {
  test.describe.configure({ mode: 'serial' });

  test.afterAll(async () => {
    if (cleanupUserIds.length === 0) return;
    await prismaTest.user
      .deleteMany({ where: { id: { in: cleanupUserIds } } })
      .catch(() => undefined);
  });

  test.beforeEach(async ({ context }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop',
      'Desktop-only; mobile bottom-sheet variant covered by T17.x.',
    );
    await context.clearCookies();
    await context.addCookies([
      { name: 'NEXT_LOCALE', value: 'en', domain: 'localhost', path: '/' },
    ]);
  });

  test('PRO — header lang switch updates name, description, and variation name in sync', async ({
    page,
  }) => {
    const { menu, email } = await seedProDrawerScenario();

    await loginAs(page, email);
    await page.goto(`/admin/menus/${menu.id}?tab=content`);

    // Open the first category, then the first product's drawer in edit mode.
    const firstCategory = page.getByTestId('category-row').first();
    await firstCategory.getByTestId('category-row-toggle').click();
    await expect(firstCategory).toHaveAttribute('data-expanded', 'true');

    await page
      .getByTestId('product-row')
      .first()
      .getByTestId('product-action-edit')
      .click();

    const drawer = page.getByTestId('product-drawer');
    await expect(drawer).toBeVisible();

    // Exactly ONE language switcher exists in the drawer.
    await expect(page.getByTestId('product-drawer-lang-tabs')).toHaveCount(1);
    // None of the legacy per-field strips are rendered.
    await expect(page.getByTestId('product-basics-name-tabs')).toHaveCount(0);
    await expect(page.getByTestId('product-basics-description-tabs')).toHaveCount(0);

    // Defaults to KA.
    const langScope = page.getByTestId('product-drawer-lang-scope');
    await expect(langScope).toHaveAttribute('data-active-lang', 'KA');

    const nameInput = page.getByTestId('product-basics-name-input');
    const descTextarea = page.getByTestId('product-basics-description-textarea');

    await expect(nameInput).toHaveValue('ხაჭაპური აჭარული');
    await expect(descTextarea).toHaveValue('ცომი, ყველი, კვერცხი');

    // Variations tab shows the KA variation name.
    await page.getByTestId('product-drawer-tab-variations').click();
    const variationName = page.getByTestId('product-drawer-variations-row-name');
    await expect(variationName).toHaveText('პატარა');
    await expect(variationName).toHaveAttribute('data-active-lang', 'KA');

    // Click EN in the drawer header — title, description, and variation name
    // must all switch to their EN values together.
    await page.getByTestId('product-drawer-lang-tab-EN').click();
    await expect(langScope).toHaveAttribute('data-active-lang', 'EN');
    await expect(variationName).toHaveText('Small');
    await expect(variationName).toHaveAttribute('data-active-lang', 'EN');

    // Cross to basics — same activeLang carried across tabs.
    await page.getByTestId('product-drawer-tab-basics').click();
    await expect(nameInput).toHaveValue('Adjarian Khachapuri');
    await expect(descTextarea).toHaveValue('Dough, cheese, egg');
    await expect(nameInput).toHaveAttribute('data-active-lang', 'EN');
    await expect(descTextarea).toHaveAttribute('data-active-lang', 'EN');

    // RU — all three switch together again.
    await page.getByTestId('product-drawer-lang-tab-RU').click();
    await expect(langScope).toHaveAttribute('data-active-lang', 'RU');
    await expect(nameInput).toHaveValue('Аджарский Хачапури');
    await expect(descTextarea).toHaveValue('Тесто, сыр, яйцо');

    await page.getByTestId('product-drawer-tab-variations').click();
    await expect(variationName).toHaveText('Маленький');
  });

  test('STARTER — EN and RU are locked in the drawer header switcher', async ({
    page,
  }) => {
    const email = `lang-sync-starter-${RUN_ID}@test.local`;
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
        nameKa: 'კაფე ლინვილი',
        slug: `linville-starter-${RUN_ID}`,
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });
    const category = await prismaTest.category.create({
      data: {
        menuId: menu.id,
        nameKa: 'მთავარი კერძები',
        type: 'FOOD',
        sortOrder: 0,
      },
    });
    await prismaTest.product.create({
      data: {
        categoryId: category.id,
        nameKa: 'ხაჭაპური',
        price: 12.0,
        sortOrder: 0,
      },
    });

    await loginAs(page, email);
    await page.goto(`/admin/menus/${menu.id}?tab=content`);

    const firstCategory = page.getByTestId('category-row').first();
    await firstCategory.getByTestId('category-row-toggle').click();
    await page
      .getByTestId('product-row')
      .first()
      .getByTestId('product-action-edit')
      .click();

    await expect(page.getByTestId('product-drawer')).toBeVisible();

    const enTab = page.getByTestId('product-drawer-lang-tab-EN');
    const ruTab = page.getByTestId('product-drawer-lang-tab-RU');
    const kaTab = page.getByTestId('product-drawer-lang-tab-KA');

    await expect(enTab).toHaveAttribute('data-locked', 'true');
    await expect(ruTab).toHaveAttribute('data-locked', 'true');
    await expect(kaTab).toHaveAttribute('data-locked', 'false');
  });
});

test.describe('T21.8 multilingual form sync — promotion drawer', () => {
  test.describe.configure({ mode: 'serial' });

  test.afterAll(async () => {
    if (cleanupUserIds.length === 0) return;
    await prismaTest.user
      .deleteMany({ where: { id: { in: cleanupUserIds } } })
      .catch(() => undefined);
  });

  test.beforeEach(async ({ context }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop',
      'Desktop-only; mobile bottom-sheet variant covered by T17.x.',
    );
    await context.clearCookies();
    await context.addCookies([
      { name: 'NEXT_LOCALE', value: 'en', domain: 'localhost', path: '/' },
    ]);
  });

  test('PRO — header lang switch updates title and description together', async ({
    page,
  }) => {
    const email = `promo-lang-pro-${RUN_ID}@test.local`;
    const user = await prismaTest.user.create({
      data: {
        email: email.toLowerCase(),
        name: 'Nino Kapanadze',
        plan: 'PRO',
        password: await bcrypt.hash('password-not-used', 10),
        emailVerified: new Date(),
      },
    });
    cleanupUserIds.push(user.id);

    const menu = await prismaTest.menu.create({
      data: {
        userId: user.id,
        name: 'Café Linville',
        nameKa: 'კაფე ლინვილი',
        slug: `promo-pro-${RUN_ID}`,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        enabledLanguages: ['KA', 'EN', 'RU'],
      },
    });
    const promo = await prismaTest.promotion.create({
      data: {
        menuId: menu.id,
        titleKa: 'ზამთრის შეთავაზება',
        titleEn: 'Winter Offer',
        titleRu: 'Зимнее предложение',
        descriptionKa: 'მინუს 20% ხაჭაპურზე.',
        descriptionEn: 'Minus 20% on Khachapuri.',
        descriptionRu: 'Минус 20% на хачапури.',
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
    });

    await loginAs(page, email);
    await page.goto(`/admin/menus/${menu.id}?tab=promotions`);

    const card = page.getByTestId(`editor-promotions-card-${promo.id}`);
    await expect(card).toBeVisible();
    await page.getByTestId(`editor-promotions-card-${promo.id}-kebab`).click();
    await page.getByRole('menuitem', { name: 'Edit' }).click();

    const drawer = page.getByTestId('promotion-drawer');
    await expect(drawer).toBeVisible();

    // Exactly ONE language switcher — old per-field tab strips are gone.
    await expect(page.getByTestId('promotion-drawer-lang-tabs')).toHaveCount(1);
    await expect(page.getByTestId('promotion-title-lang-tabs')).toHaveCount(0);
    await expect(page.getByTestId('promotion-description-lang-tabs')).toHaveCount(0);

    const langScope = page.getByTestId('promotion-drawer-lang-scope');
    const titleInput = page.getByTestId('promotion-title-input');
    const descInput = page.getByTestId('promotion-description-input');

    await expect(langScope).toHaveAttribute('data-active-lang', 'KA');
    await expect(titleInput).toHaveValue('ზამთრის შეთავაზება');
    await expect(descInput).toHaveValue('მინუს 20% ხაჭაპურზე.');
    await expect(titleInput).toHaveAttribute('data-active-lang', 'KA');

    await page.getByTestId('promotion-drawer-lang-tab-EN').click();
    await expect(langScope).toHaveAttribute('data-active-lang', 'EN');
    await expect(titleInput).toHaveAttribute('data-active-lang', 'EN');
    await expect(descInput).toHaveAttribute('data-active-lang', 'EN');
    await expect(titleInput).toHaveValue('Winter Offer');
    await expect(descInput).toHaveValue('Minus 20% on Khachapuri.');

    await page.getByTestId('promotion-drawer-lang-tab-RU').click();
    await expect(titleInput).toHaveValue('Зимнее предложение');
    await expect(descInput).toHaveValue('Минус 20% на хачапури.');
  });

  test('STARTER — EN and RU segments locked in the promotion drawer', async ({
    page,
  }) => {
    const email = `promo-lang-starter-${RUN_ID}@test.local`;
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
        nameKa: 'კაფე ლინვილი',
        slug: `promo-starter-${RUN_ID}`,
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });
    const promo = await prismaTest.promotion.create({
      data: {
        menuId: menu.id,
        titleKa: 'ზამთრის შეთავაზება',
        descriptionKa: 'მინუს 20%.',
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
    });

    await loginAs(page, email);
    await page.goto(`/admin/menus/${menu.id}?tab=promotions`);

    await page.getByTestId(`editor-promotions-card-${promo.id}-kebab`).click();
    await page.getByRole('menuitem', { name: 'Edit' }).click();
    await expect(page.getByTestId('promotion-drawer')).toBeVisible();

    const enTab = page.getByTestId('promotion-drawer-lang-tab-EN');
    const ruTab = page.getByTestId('promotion-drawer-lang-tab-RU');
    const kaTab = page.getByTestId('promotion-drawer-lang-tab-KA');

    await expect(enTab).toHaveAttribute('data-locked', 'true');
    await expect(ruTab).toHaveAttribute('data-locked', 'true');
    await expect(kaTab).toHaveAttribute('data-locked', 'false');
    await expect(enTab).toBeDisabled();
    await expect(ruTab).toBeDisabled();
  });
});
