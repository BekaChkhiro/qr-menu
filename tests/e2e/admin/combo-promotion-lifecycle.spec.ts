// T2.6 (#12b) — a COMBO promotion made in the Promotions tab must be listed
// there afterwards, editable and deletable, with its generated product in the
// system Offers category following along.
//
// Run: pnpm exec playwright test tests/e2e/admin/combo-promotion-lifecycle.spec.ts --project=desktop
//
// Seeds are additive (own user + menu) and removed by id at the end.

import { expect, test } from '@playwright/test';

import { loginAs } from '../fixtures/auth';
import { prismaTest, seedMenu, seedUser } from '../fixtures/seed';

test.describe('COMBO promotion lifecycle (T2.6)', () => {
  let userId: string | undefined;

  test.beforeEach(async ({ context }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'Desktop drawer flow');
    await context.addCookies([
      { name: 'NEXT_LOCALE', value: 'ka', domain: 'localhost', path: '/' },
    ]);
  });

  test.afterEach(async () => {
    if (userId) await prismaTest.user.delete({ where: { id: userId } }).catch(() => {});
    userId = undefined;
  });

  test('create via drawer → listed → edit → delete removes the Offers product', async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(e.message));

    const user = await seedUser({
      plan: 'STARTER',
      email: `combo-lifecycle-${Date.now()}@test.local`,
    });
    userId = user.id;
    const menu = await seedMenu({
      userId: user.id,
      status: 'PUBLISHED',
      categoryCount: 1,
      productCount: 3,
    });
    const dishes = await prismaTest.product.findMany({
      where: { category: { menuId: menu.id } },
      orderBy: { sortOrder: 'asc' },
    });

    await loginAs(page, user.email);
    await page.goto(`/admin/menus/${menu.id}?tab=promotions`);
    await expect(page.getByTestId('editor-promotions-tab')).toBeVisible();

    // ── Create ────────────────────────────────────────────────────────────
    await page.getByTestId('editor-promotions-new').click();
    await expect(page.getByTestId('promotion-drawer')).toBeVisible();
    await page.getByTestId('promotion-title-input').fill('სადილის კომბო');
    await page.getByTestId('promotion-type-combo').click();
    await page.getByTestId(`promotion-combo-product-${dishes[0].id}`).click();
    await page.getByTestId(`promotion-combo-product-${dishes[1].id}`).click();
    await page.getByTestId('promotion-combo-price-input').fill('20');
    await page.getByTestId('promotion-drawer-save').click();
    await expect(page.getByTestId('promotion-drawer')).toHaveCount(0);

    const created = await prismaTest.promotion.findFirstOrThrow({
      where: { menuId: menu.id, type: 'COMBO' },
    });
    expect(created.comboProductId).not.toBeNull();

    const card = page.getByTestId(`editor-promotions-card-${created.id}`);
    await expect(card).toBeVisible();
    await expect(page.getByTestId(`editor-promotions-card-${created.id}-title`)).toHaveText(
      'სადილის კომბო',
    );
    // Permanent (no dates) → drawn in the calendar grid as a permanent bar (T2.8).
    const calendarBar = page.getByTestId(`promotion-calendar-bar-${created.id}`).first();
    await expect(calendarBar).toBeVisible();
    await expect(calendarBar).toHaveAttribute('data-permanent', 'true');

    const generated = await prismaTest.product.findUniqueOrThrow({
      where: { id: created.comboProductId! },
      include: { category: true },
    });
    expect(generated.kind).toBe('COMBO');
    expect(generated.category.isSystemOffers).toBe(true);
    expect(generated.nameKa).toBe('სადილის კომბო');

    // Survives a reload (the list is the server's, not the mutation cache).
    await page.reload();
    await expect(card).toBeVisible();

    // ── Edit title ────────────────────────────────────────────────────────
    await page.getByTestId(`editor-promotions-card-${created.id}-kebab`).click();
    await page.getByRole('menuitem').first().click();
    await expect(page.getByTestId('promotion-drawer')).toBeVisible();
    await expect(page.getByTestId('promotion-title-input')).toHaveValue('სადილის კომბო');
    await page.getByTestId('promotion-title-input').fill('ლანჩის კომბო');
    await page.getByTestId('promotion-drawer-save').click();
    await expect(page.getByTestId('promotion-drawer')).toHaveCount(0);
    await expect(page.getByTestId(`editor-promotions-card-${created.id}-title`)).toHaveText(
      'ლანჩის კომბო',
    );
    await expect
      .poll(async () =>
        (await prismaTest.product.findUnique({ where: { id: created.comboProductId! } }))?.nameKa,
      )
      .toBe('ლანჩის კომბო');

    // The generated product is the promotion's: direct product writes are refused.
    const productUrl = `/api/menus/${menu.id}/products/${created.comboProductId}`;
    const put = await page.request.put(productUrl, { data: { nameKa: 'სხვა სახელი' } });
    expect(put.status()).toBe(409);
    expect((await put.json()).error.code).toBe('PROMOTION_MANAGED');
    const del = await page.request.delete(productUrl);
    expect(del.status()).toBe(409);

    // ── Delete via kebab ──────────────────────────────────────────────────
    await page.getByTestId(`editor-promotions-card-${created.id}-kebab`).click();
    await page.getByRole('menuitem').last().click();
    await page.getByTestId('editor-promotions-delete-confirm').click();
    await expect(card).toHaveCount(0);
    await expect
      .poll(() => prismaTest.promotion.findUnique({ where: { id: created.id } }))
      .toBeNull();
    expect(
      await prismaTest.product.findUnique({ where: { id: created.comboProductId! } }),
    ).toBeNull();

    expect(pageErrors).toEqual([]);
  });

  test('phone width: a new undated promotion comes first and is scrolled into view', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const user = await seedUser({
      plan: 'STARTER',
      email: `combo-phone-${Date.now()}@test.local`,
    });
    userId = user.id;
    const menu = await seedMenu({
      userId: user.id,
      status: 'PUBLISHED',
      categoryCount: 1,
      productCount: 3,
    });
    // Older undated promotions: before T2.6 the new one could land among them anywhere.
    for (const titleKa of ['ბიზნეს ლანჩი', 'საუზმე', 'შაბათ-კვირა', 'ლოიალობა']) {
      await prismaTest.promotion.create({
        data: { menuId: menu.id, titleKa, type: 'BANNER', isActive: true },
      });
    }
    const dishes = await prismaTest.product.findMany({
      where: { category: { menuId: menu.id } },
      orderBy: { sortOrder: 'asc' },
    });

    await loginAs(page, user.email);
    await page.goto(`/admin/menus/${menu.id}?tab=promotions`);
    await expect(page.getByTestId('editor-promotions-grid').locator('article')).toHaveCount(4);

    await page.getByTestId('editor-promotions-new').click();
    await page.getByTestId('promotion-title-input').fill('სადა');
    await page.getByTestId('promotion-type-combo').click();
    await page.getByTestId(`promotion-combo-product-${dishes[0].id}`).click();
    await page.getByTestId(`promotion-combo-product-${dishes[2].id}`).click();
    await page.getByTestId('promotion-combo-price-input').fill('22');
    await page.getByTestId('promotion-drawer-save').click();
    await expect(page.getByTestId('promotion-drawer')).toHaveCount(0);

    const created = await prismaTest.promotion.findFirstOrThrow({
      where: { menuId: menu.id, type: 'COMBO' },
    });
    const cards = page.getByTestId('editor-promotions-grid').locator('article');
    await expect(cards).toHaveCount(5);
    await expect(cards.first()).toHaveAttribute(
      'data-testid',
      `editor-promotions-card-${created.id}`,
    );
    await expect(page.getByTestId(`editor-promotions-card-${created.id}`)).toBeInViewport();
  });
});
