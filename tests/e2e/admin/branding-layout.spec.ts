// T20.2 — Branding tab · Layout & Style sub-card.
//
// Run:     pnpm test:e2e tests/e2e/admin/branding-layout.spec.ts
// Update:  pnpm test:e2e:update tests/e2e/admin/branding-layout.spec.ts
//
// Covers:
//   Visual    — Branding tab on STARTER showing the new "Layout & Style"
//               sub-card (template radio cards + 2×2 selects + split switch).
//   Functional — Selecting MAGAZINE template PUTs `/api/menus/[id]` with
//               `menuTemplate: "MAGAZINE"` and the public menu renders
//               `<ProductCardMagazine>` instead of the classic card. Toggling
//               `splitByType` PUTs `splitByType: true` and the public menu
//               header shows Foods / Drinks tabs.
//
// **No `resetDb()`** — additive: seeds a unique-email user with one menu
// (one FOOD category + one DRINK category so splitByType has both tabs to
// show), and deletes the user (cascading the menu) in afterAll.

import { expect, test } from '@playwright/test';

import { loginAs } from '../fixtures/auth';
import { prismaTest, seedMenu, seedUser } from '../fixtures/seed';

const RUN_ID = `t20-2-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const EMAIL = `${RUN_ID}@test.local`;

let userId = '';
let menuId = '';
let menuSlug = '';

test.describe('branding tab · layout & style (T20.2)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    const user = await seedUser({
      plan: 'STARTER',
      email: EMAIL,
      name: `T20.2 Run ${RUN_ID}`,
    });
    userId = user.id;

    const menu = await seedMenu({
      userId: user.id,
      status: 'PUBLISHED',
      categoryCount: 1,
      productCount: 1,
      name: `T20.2 Menu ${RUN_ID}`,
      slug: `t20-2-${RUN_ID}`,
    });
    menuId = menu.id;
    menuSlug = menu.slug;

    // splitByType functional test needs at least one FOOD and one DRINK
    // category so both tabs render. seedMenu defaults to FOOD; add a
    // DRINK category with one product so the public menu has both types.
    await prismaTest.category.create({
      data: {
        menuId,
        type: 'DRINK',
        sortOrder: 99,
        nameKa: 'სასმელები',
        nameEn: 'Drinks',
        nameRu: 'Напитки',
        products: {
          create: {
            sortOrder: 0,
            nameKa: 'ლიმონათი',
            nameEn: 'Lemonade',
            nameRu: 'Лимонад',
            price: 9,
          },
        },
      },
    });
  });

  test.afterAll(async () => {
    if (userId) {
      await prismaTest.user.delete({ where: { id: userId } }).catch(() => {});
    }
  });

  test.beforeEach(async ({ page, context }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop',
      'Desktop-only — mobile variant lands in T17.3.',
    );
    await context.clearCookies();
    await context.addCookies([
      { name: 'NEXT_LOCALE', value: 'en', domain: 'localhost', path: '/' },
    ]);
    await loginAs(page, EMAIL);
    await page.goto(`/admin/menus/${menuId}?tab=branding`);
    await expect(page.getByTestId('editor-branding-tab')).toBeVisible();
    await expect(page.getByTestId('branding-layout-card')).toBeVisible();
  });

  // ── Visual ─────────────────────────────────────────────────────────────────

  test('visual: branding tab shows layout & style card', async ({
    page,
  }, testInfo) => {
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({
      content:
        '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }',
    });

    // All three template radios must be in the DOM.
    await expect(page.getByTestId('branding-template-classic')).toBeVisible();
    await expect(page.getByTestId('branding-template-magazine')).toBeVisible();
    await expect(page.getByTestId('branding-template-compact')).toBeVisible();
    await expect(page.getByTestId('branding-menu-layout-select')).toBeVisible();
    await expect(page.getByTestId('branding-card-style-select')).toBeVisible();
    await expect(page.getByTestId('branding-touch-effect-select')).toBeVisible();
    await expect(page.getByTestId('branding-split-by-type-switch')).toBeVisible();

    const card = page.getByTestId('branding-layout-card');
    await expect(card).toHaveScreenshot(
      `branding-layout-card-${testInfo.project.name}.png`,
      { maxDiffPixelRatio: 0.05 },
    );
  });

  // ── Functional: template picker → public menu uses Magazine card ──────────

  test('functional: selecting MAGAZINE persists and renders Magazine card on public menu', async ({
    page,
  }) => {
    // Reset to CLASSIC so test is deterministic regardless of prior runs.
    await prismaTest.menu.update({
      where: { id: menuId },
      data: { menuTemplate: 'CLASSIC' },
    });
    await page.reload();
    await expect(page.getByTestId('branding-template-classic')).toHaveAttribute(
      'aria-checked',
      'true',
    );

    const putResponse = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/menus/${menuId}`) &&
        response.request().method() === 'PUT' &&
        response.ok(),
    );

    await page.getByTestId('branding-template-magazine').click();

    const res = await putResponse;
    const body = (await res.json()) as {
      data?: { menuTemplate?: string | null };
    };
    expect(body.data?.menuTemplate).toBe('MAGAZINE');

    // aria-checked toggled on the right radio.
    await expect(
      page.getByTestId('branding-template-magazine'),
    ).toHaveAttribute('aria-checked', 'true');
    await expect(
      page.getByTestId('branding-template-classic'),
    ).toHaveAttribute('aria-checked', 'false');

    // DB is the source of truth.
    const row = await prismaTest.menu.findFirst({
      where: { id: menuId },
      select: { menuTemplate: true },
    });
    expect(row?.menuTemplate).toBe('MAGAZINE');

    // Public menu renders the Magazine variant of the product card.
    await page.goto(`/m/${menuSlug}`);
    await expect(
      page.locator('[data-testid="public-product-card-magazine"]').first(),
    ).toBeVisible();
  });

  // ── Functional: splitByType → Foods/Drinks tabs appear on public menu ────

  test('functional: toggling splitByType shows Foods/Drinks tabs on public menu', async ({
    page,
  }) => {
    // Reset off so we can assert the toggle-on transition.
    await prismaTest.menu.update({
      where: { id: menuId },
      data: { splitByType: false },
    });
    await page.reload();

    const switchEl = page.getByTestId('branding-split-by-type-switch');
    await expect(switchEl).toHaveAttribute('aria-checked', 'false');

    const putResponse = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/menus/${menuId}`) &&
        response.request().method() === 'PUT' &&
        response.ok(),
    );

    await switchEl.click();

    const res = await putResponse;
    const body = (await res.json()) as { data?: { splitByType?: boolean } };
    expect(body.data?.splitByType).toBe(true);

    await expect(switchEl).toHaveAttribute('aria-checked', 'true');

    const row = await prismaTest.menu.findFirst({
      where: { id: menuId },
      select: { splitByType: true },
    });
    expect(row?.splitByType).toBe(true);

    // Public menu now renders the Foods / Drinks tab strip in the header.
    await page.goto(`/m/${menuSlug}`);
    await expect(
      page.getByRole('button', { name: /^Foods$/ }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /^Drinks$/ }).first(),
    ).toBeVisible();
  });

  // ── Functional: card style + touch effect persist ─────────────────────────

  test('functional: card style + touch effect persist via PUT', async ({
    page,
  }) => {
    // Card style → ELEVATED.
    const putA = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/menus/${menuId}`) &&
        response.request().method() === 'PUT' &&
        response.ok(),
    );
    await page.getByTestId('branding-card-style-select').click();
    await page.getByRole('option', { name: /Elevated/ }).click();
    const resA = await putA;
    const bodyA = (await resA.json()) as {
      data?: { productCardStyle?: string | null };
    };
    expect(bodyA.data?.productCardStyle).toBe('ELEVATED');

    // Touch effect → GLOW.
    const putB = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/menus/${menuId}`) &&
        response.request().method() === 'PUT' &&
        response.ok(),
    );
    await page.getByTestId('branding-touch-effect-select').click();
    await page.getByRole('option', { name: /^Glow$/ }).click();
    const resB = await putB;
    const bodyB = (await resB.json()) as {
      data?: { productTouchEffect?: string | null };
    };
    expect(bodyB.data?.productTouchEffect).toBe('GLOW');

    const row = await prismaTest.menu.findFirst({
      where: { id: menuId },
      select: { productCardStyle: true, productTouchEffect: true },
    });
    expect(row?.productCardStyle).toBe('ELEVATED');
    expect(row?.productTouchEffect).toBe('GLOW');
  });
});
