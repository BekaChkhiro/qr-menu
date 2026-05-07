// T20.3 — Content tab · Display sub-card.
//
// Run:     pnpm test:e2e tests/e2e/admin/content-display.spec.ts
// Update:  pnpm test:e2e:update tests/e2e/admin/content-display.spec.ts
//
// Covers:
//   Visual    — Content tab on STARTER showing the new "Display" sub-card
//               (allergen + calories selects, nutrition + discount switches).
//   Functional — Switching allergenDisplay → ICON PUTs `/api/menus/[id]` with
//               `allergenDisplay: "ICON"` and the public product card renders
//               an icon-mode allergen badge instead of the text-label badge.
//               Toggling showDiscount off PUTs `showDiscount: false` and the
//               crossed-out `<OldPriceTag>` disappears on `/m/{slug}`.
//
// **No `resetDb()`** — additive: seeds a unique-email STARTER user with one
// menu (one product carrying allergens + oldPrice so both functional tests
// have something concrete to assert), and deletes the user (cascading the
// menu) in afterAll.

import { expect, test } from '@playwright/test';

import { loginAs } from '../fixtures/auth';
import { prismaTest, seedMenu, seedUser } from '../fixtures/seed';

const RUN_ID = `t20-3-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const EMAIL = `${RUN_ID}@test.local`;

let userId = '';
let menuId = '';
let menuSlug = '';
let productId = '';

test.describe('content tab · display sub-card (T20.3)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    const user = await seedUser({
      plan: 'STARTER',
      email: EMAIL,
      name: `T20.3 Run ${RUN_ID}`,
    });
    userId = user.id;

    const menu = await seedMenu({
      userId: user.id,
      status: 'PUBLISHED',
      categoryCount: 1,
      productCount: 1,
      name: `T20.3 Menu ${RUN_ID}`,
      slug: `t20-3-${RUN_ID}`,
    });
    menuId = menu.id;
    menuSlug = menu.slug;

    // The functional assertions need:
    //   - At least one allergen on the product so AllergenBadge renders.
    //   - oldPrice > price so the strikethrough OldPriceTag renders when
    //     showDiscount is true.
    const product = await prismaTest.product.findFirstOrThrow({
      where: { category: { menuId } },
      select: { id: true, price: true },
    });
    productId = product.id;

    await prismaTest.product.update({
      where: { id: productId },
      data: {
        allergens: ['GLUTEN'],
        oldPrice: Number(product.price) + 5,
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
    await page.goto(`/admin/menus/${menuId}?tab=content`);
    await expect(page.getByTestId('editor-content')).toBeVisible();
    await expect(page.getByTestId('content-display-card')).toBeVisible();
  });

  // ── Visual ─────────────────────────────────────────────────────────────────

  test('visual: content tab shows display card', async ({
    page,
  }, testInfo) => {
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({
      content:
        '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }',
    });

    await expect(
      page.getByTestId('content-allergen-display-select'),
    ).toBeVisible();
    await expect(
      page.getByTestId('content-calories-display-select'),
    ).toBeVisible();
    await expect(
      page.getByTestId('content-show-nutrition-switch'),
    ).toBeVisible();
    await expect(
      page.getByTestId('content-show-discount-switch'),
    ).toBeVisible();

    const card = page.getByTestId('content-display-card');
    await expect(card).toHaveScreenshot(
      `content-display-card-${testInfo.project.name}.png`,
      { maxDiffPixelRatio: 0.05 },
    );
  });

  // ── Functional: allergenDisplay → ICON renders icon badge on public menu ──

  test('functional: switching allergenDisplay to ICON renders an icon allergen badge on public menu', async ({
    page,
  }) => {
    // Reset to TEXT so the toggle target is deterministic across re-runs.
    await prismaTest.menu.update({
      where: { id: menuId },
      data: { allergenDisplay: 'TEXT' },
    });
    await page.reload();

    const putResponse = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/menus/${menuId}`) &&
        response.request().method() === 'PUT' &&
        response.ok(),
    );

    await page.getByTestId('content-allergen-display-select').click();
    await page.getByRole('option', { name: /Icon only/ }).click();

    const res = await putResponse;
    const body = (await res.json()) as {
      data?: { allergenDisplay?: string | null };
    };
    expect(body.data?.allergenDisplay).toBe('ICON');

    const row = await prismaTest.menu.findFirst({
      where: { id: menuId },
      select: { allergenDisplay: true },
    });
    expect(row?.allergenDisplay).toBe('ICON');

    // Public menu now renders the ICON variant of the allergen badge.
    await page.goto(`/m/${menuSlug}`);
    const badge = page.getByTestId('public-allergen-badge').first();
    await expect(badge).toBeVisible();
    await expect(badge).toHaveAttribute('data-mode', 'ICON');
  });

  // ── Functional: showDiscount off hides the crossed-out old price ─────────

  test('functional: toggling showDiscount off hides the strikethrough old price on public menu', async ({
    page,
  }) => {
    // Make sure showDiscount starts ON so we can assert the off transition.
    await prismaTest.menu.update({
      where: { id: menuId },
      data: { showDiscount: true },
    });
    await page.reload();

    const switchEl = page.getByTestId('content-show-discount-switch');
    await expect(switchEl).toHaveAttribute('aria-checked', 'true');

    // Confirm the public menu currently shows the old-price tag (sanity).
    const publicTab = await page.context().newPage();
    await publicTab.goto(`/m/${menuSlug}`);
    await expect(
      publicTab.getByTestId('public-old-price').first(),
    ).toBeVisible();
    await publicTab.close();

    const putResponse = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/menus/${menuId}`) &&
        response.request().method() === 'PUT' &&
        response.ok(),
    );

    await switchEl.click();

    const res = await putResponse;
    const body = (await res.json()) as { data?: { showDiscount?: boolean } };
    expect(body.data?.showDiscount).toBe(false);
    await expect(switchEl).toHaveAttribute('aria-checked', 'false');

    const row = await prismaTest.menu.findFirst({
      where: { id: menuId },
      select: { showDiscount: true },
    });
    expect(row?.showDiscount).toBe(false);

    // Public menu no longer renders the strikethrough OldPriceTag.
    await page.goto(`/m/${menuSlug}`);
    await expect(page.getByTestId('public-old-price')).toHaveCount(0);
  });

  // ── Functional: calories + nutrition selects/switches persist via PUT ─────

  test('functional: caloriesDisplay select + showNutrition switch persist via PUT', async ({
    page,
  }) => {
    // Calories → HIDDEN.
    const putA = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/menus/${menuId}`) &&
        response.request().method() === 'PUT' &&
        response.ok(),
    );
    await page.getByTestId('content-calories-display-select').click();
    await page.getByRole('option', { name: /Hidden/ }).click();
    const resA = await putA;
    const bodyA = (await resA.json()) as {
      data?: { caloriesDisplay?: string | null };
    };
    expect(bodyA.data?.caloriesDisplay).toBe('HIDDEN');

    // Nutrition switch → on.
    const putB = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/menus/${menuId}`) &&
        response.request().method() === 'PUT' &&
        response.ok(),
    );
    await page.getByTestId('content-show-nutrition-switch').click();
    const resB = await putB;
    const bodyB = (await resB.json()) as {
      data?: { showNutrition?: boolean };
    };
    expect(bodyB.data?.showNutrition).toBe(true);

    const row = await prismaTest.menu.findFirst({
      where: { id: menuId },
      select: { caloriesDisplay: true, showNutrition: true },
    });
    expect(row?.caloriesDisplay).toBe('HIDDEN');
    expect(row?.showNutrition).toBe(true);
  });
});
