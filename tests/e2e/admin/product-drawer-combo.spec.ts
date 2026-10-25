// Test for T1.9 — combo as a normal product type (kind = COMBO).
// Run:     pnpm test:e2e tests/e2e/admin/product-drawer-combo.spec.ts
//
// Covers:
//   Functional — the drawer's type switch (Dish / Combo) and component picker;
//   fewer than two dishes shows a message and nothing is saved; a combo with its
//   own price saves with its dishes; reopening it shows the dishes checked; the
//   public menu lists the included dishes on the combo's card.
//   API — the server refuses a combo with one dish, a dish of another owner, and
//   a combo that lists itself.

import { expect, test, type Page } from '@playwright/test';

import { loginAs } from '../fixtures/auth';
import { prismaTest, resetDb, seedMenu, seedUser } from '../fixtures/seed';

test.describe('product drawer — combo product (T1.9)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ context }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop',
      'Desktop-only; the combo picker is exercised in the desktop drawer'
    );
    await resetDb();
    await context.clearCookies();
    await context.addCookies([
      { name: 'NEXT_LOCALE', value: 'en', domain: 'localhost', path: '/' },
    ]);
  });

  async function seedPublishedMenu() {
    const user = await seedUser({
      plan: 'STARTER',
      name: 'Nino Kapanadze',
      email: 'nino@cafelinville.ge',
    });
    const menu = await seedMenu({
      userId: user.id,
      status: 'PUBLISHED',
      categoryCount: 2,
      productCount: 2,
      name: 'Café Linville — Dinner',
    });
    return { user, menu };
  }

  async function openCreateDrawerInFirstCategory(page: Page) {
    const firstRow = page.getByTestId('category-row').first();
    await firstRow.getByTestId('category-row-toggle').click();
    await expect(firstRow).toHaveAttribute('data-expanded', 'true');
    await page.getByTestId('products-add-inline').first().click();
    await expect(page.getByTestId('product-drawer')).toBeVisible();
  }

  async function pickDish(page: Page, nameKa: string) {
    await page
      .getByTestId('product-basics-combo')
      .locator('label', { hasText: nameKa })
      .first()
      .click();
  }

  test('functional: type switch shows the dish picker only for a combo', async ({ page }) => {
    const { menu } = await seedPublishedMenu();
    await loginAs(page, 'nino@cafelinville.ge');
    await page.goto(`/admin/menus/${menu.id}?tab=content`);
    await openCreateDrawerInFirstCategory(page);

    await expect(page.getByTestId('product-kind-standard')).toHaveAttribute('data-active', 'true');
    await expect(page.getByTestId('product-basics-combo')).toHaveCount(0);

    await page.getByTestId('product-kind-combo').click();
    await expect(page.getByTestId('product-kind-combo')).toHaveAttribute('data-active', 'true');
    await expect(page.getByTestId('product-basics-combo')).toBeVisible();

    await page.getByTestId('product-kind-standard').click();
    await expect(page.getByTestId('product-basics-combo')).toHaveCount(0);
  });

  test('functional: fewer than two dishes is refused; two dishes save with their own price and show publicly', async ({
    page,
  }) => {
    const { menu } = await seedPublishedMenu();
    await loginAs(page, 'nino@cafelinville.ge');
    await page.goto(`/admin/menus/${menu.id}?tab=content`);
    await openCreateDrawerInFirstCategory(page);

    await page.getByTestId('product-basics-name-input').fill('Khachapuri and lemonade');
    await page.getByTestId('product-basics-price-input').fill('21.00');
    await page.getByTestId('product-kind-combo').click();
    await pickDish(page, 'ხაჭაპური აჭარული');

    let postCount = 0;
    page.on('request', (req) => {
      if (req.method() === 'POST' && req.url().includes(`/api/menus/${menu.id}/products`))
        postCount++;
    });

    await page.getByTestId('product-drawer-save').click();
    await expect(page.getByTestId('product-combo-min-error')).toBeVisible();
    await expect(page.getByTestId('product-combo-min-error')).toHaveText('Pick at least 2 dishes');
    expect(postCount).toBe(0);

    await pickDish(page, 'ბადრიჯანი ნიგვზით');
    await expect(page.getByTestId('product-combo-min-error')).toHaveCount(0);

    // T2.2 — live summary: 18.00 + 14.50 = 32.50; the combo's 21.00 saves 11.50 (35%).
    await expect(page.getByTestId('combo-summary')).toHaveText(
      '2 dishes · Total 32.50 ₾ · Saves 11.50 ₾ / 35%'
    );
    await page.getByTestId('product-basics-price-input').fill('');
    await expect(page.getByTestId('combo-summary')).toHaveText('2 dishes · Total 32.50 ₾');
    await page.getByTestId('product-basics-price-input').fill('21.00');

    const responsePromise = page.waitForResponse(
      (res) =>
        res.url().includes(`/api/menus/${menu.id}/products`) && res.request().method() === 'POST'
    );
    await page.getByTestId('product-drawer-save').click();
    const response = await responsePromise;
    expect(response.status()).toBe(201);
    const created = (await response.json()).data as { id: string; kind: string; price: string };
    expect(created.kind).toBe('COMBO');
    expect(Number(created.price)).toBe(21);
    await expect(page.getByTestId('product-drawer')).toBeHidden();

    // The public menu lists the two included dishes on the combo's card.
    const combo = await prismaTest.comboItem.findMany({
      where: { comboId: created.id },
      orderBy: { sortOrder: 'asc' },
      include: { component: { select: { nameKa: true } } },
    });
    expect(combo.map((item) => item.component.nameKa)).toEqual([
      'ხაჭაპური აჭარული',
      'ბადრიჯანი ნიგვზით',
    ]);

    await page.goto(`/m/${menu.slug}`);
    const items = page.getByTestId('product-combo-items');
    await expect(items).toHaveCount(1);
    await expect(items).toHaveText('Adjarian Khachapuri + Eggplant with Walnuts');
  });

  test('functional: reopening a combo shows its dishes checked and can drop back to a dish', async ({
    page,
  }) => {
    const { menu } = await seedPublishedMenu();
    const category = await prismaTest.category.findFirstOrThrow({
      where: { menuId: menu.id },
      orderBy: { sortOrder: 'asc' },
    });
    const [dishA, dishB] = await prismaTest.product.findMany({
      where: { categoryId: category.id },
      orderBy: { sortOrder: 'asc' },
      take: 2,
    });
    const combo = await prismaTest.product.create({
      data: {
        categoryId: category.id,
        nameKa: 'კომბო',
        price: 20,
        kind: 'COMBO',
        comboItems: {
          create: [
            { componentId: dishA.id, sortOrder: 0 },
            { componentId: dishB.id, sortOrder: 1 },
          ],
        },
      },
    });

    await loginAs(page, 'nino@cafelinville.ge');
    await page.goto(`/admin/menus/${menu.id}?tab=content`);
    const firstRow = page.getByTestId('category-row').first();
    await firstRow.getByTestId('category-row-toggle').click();
    await page
      .getByTestId('products-list-rows')
      .locator(`[data-product-id="${combo.id}"]`)
      .getByTestId('product-action-edit')
      .click();
    await expect(page.getByTestId('product-drawer')).toBeVisible();

    await expect(page.getByTestId('product-kind-combo')).toHaveAttribute('data-active', 'true');
    await expect(page.getByTestId(`product-combo-component-${dishA.id}`)).toHaveAttribute(
      'data-checked',
      'true'
    );
    await expect(page.getByTestId(`product-combo-component-${dishB.id}`)).toHaveAttribute(
      'data-checked',
      'true'
    );

    // Unticking one dish leaves a single one: the drawer asks for a second.
    await page.getByTestId(`product-combo-component-${dishB.id}`).click();
    await expect(page.getByTestId('product-combo-min-error')).toBeVisible();
    await page.getByTestId('product-kind-standard').click();
    await expect(page.getByTestId('product-combo-min-error')).toHaveCount(0);

    const responsePromise = page.waitForResponse(
      (res) =>
        res.url().includes(`/api/menus/${menu.id}/products/${combo.id}`) &&
        res.request().method() === 'PUT'
    );
    await page.getByTestId('product-drawer-save').click();
    expect((await responsePromise).status()).toBe(200);

    const items = await prismaTest.comboItem.count({ where: { comboId: combo.id } });
    expect(items).toBe(0);
    const saved = await prismaTest.product.findUniqueOrThrow({ where: { id: combo.id } });
    expect(saved.kind).toBe('STANDARD');
  });

  test('API: a combo needs two owned dishes of its menu, never itself', async ({ page }) => {
    const { menu } = await seedPublishedMenu();
    const category = await prismaTest.category.findFirstOrThrow({
      where: { menuId: menu.id },
      orderBy: { sortOrder: 'asc' },
    });
    const [dishA, dishB] = await prismaTest.product.findMany({
      where: { categoryId: category.id },
      orderBy: { sortOrder: 'asc' },
      take: 2,
    });

    // Someone else's dish.
    const other = await seedUser({ email: 'other@test.local' });
    const otherMenu = await seedMenu({ userId: other.id, productCount: 1 });
    const foreign = await prismaTest.product.findFirstOrThrow({
      where: { category: { menuId: otherMenu.id } },
    });

    await loginAs(page, 'nino@cafelinville.ge');
    const url = `/api/menus/${menu.id}/products`;
    const body = (componentIds: string[]) => ({
      categoryId: category.id,
      nameKa: 'კომბო',
      price: 10,
      kind: 'COMBO',
      comboItems: componentIds.map((componentId) => ({ componentId })),
    });

    const one = await page.request.post(url, { data: body([dishA.id]) });
    expect(one.status()).toBe(400);

    const foreignPair = await page.request.post(url, { data: body([dishA.id, foreign.id]) });
    expect(foreignPair.status()).toBe(400);

    const duplicate = await page.request.post(url, { data: body([dishA.id, dishA.id]) });
    expect(duplicate.status()).toBe(400);

    const ok = await page.request.post(url, { data: body([dishA.id, dishB.id]) });
    expect(ok.status()).toBe(201);
    const created = (await ok.json()).data as { id: string };

    const selfRef = await page.request.put(`${url}/${created.id}`, {
      data: { comboItems: [{ componentId: created.id }, { componentId: dishA.id }] },
    });
    expect(selfRef.status()).toBe(400);
  });
});
