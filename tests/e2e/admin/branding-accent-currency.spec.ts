// T20.1 — Branding tab · accent color + currency.
//
// Run:     pnpm test:e2e tests/e2e/admin/branding-accent-currency.spec.ts
// Update:  pnpm test:e2e:update tests/e2e/admin/branding-accent-currency.spec.ts
//
// Covers:
//   Visual    — Branding tab on STARTER showing the new "Accent color" sub-card
//               in the upper card and the "Currency" select in the lower card.
//   Functional — Picking an accent swatch PUTs `/api/menus/[id]` with
//               `accentColor` and the public menu's `--accent-color` CSS var
//               reflects the new value. Switching currency to `$` PUTs
//               `currencySymbol` and the public menu renders prices with the
//               new symbol.
//
// **No `resetDb()`** — this spec is additive: it seeds a unique-email user,
// creates one menu, and deletes that user (cascading the menu) in afterAll.
// The dev/test database is preserved.

import { expect, test, type Page } from '@playwright/test';

import { loginAs } from '../fixtures/auth';
import { prismaTest, seedMenu, seedUser } from '../fixtures/seed';

const RUN_ID = `t20-1-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const EMAIL = `${RUN_ID}@test.local`;

let userId = '';
let menuId = '';
let menuSlug = '';

test.describe('branding tab · accent color + currency (T20.1)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    const user = await seedUser({
      plan: 'STARTER',
      email: EMAIL,
      name: `T20.1 Run ${RUN_ID}`,
    });
    userId = user.id;

    const menu = await seedMenu({
      userId: user.id,
      status: 'PUBLISHED',
      categoryCount: 1,
      productCount: 1,
      name: `T20.1 Menu ${RUN_ID}`,
      slug: `t20-1-${RUN_ID}`,
    });
    menuId = menu.id;
    menuSlug = menu.slug;
  });

  test.afterAll(async () => {
    // Cascade: User → Menu → Category → Product → ProductVariation → MenuView.
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
  });

  // ── Visual ─────────────────────────────────────────────────────────────────

  test('visual: branding tab shows accent color + currency cards', async ({
    page,
  }, testInfo) => {
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({
      content:
        '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }',
    });

    // Both new sub-cards must be in the DOM.
    await expect(
      page.getByTestId('branding-accent-swatch-b8633d'),
    ).toBeVisible();
    await expect(page.getByTestId('branding-accent-hex-input')).toBeVisible();
    await expect(page.getByTestId('branding-currency-select')).toBeVisible();

    const shell = page.getByTestId('editor-shell');
    await expect(shell).toHaveScreenshot(
      `branding-accent-currency-${testInfo.project.name}.png`,
      { maxDiffPixelRatio: 0.05 },
    );
  });

  // ── Functional: accent color swatch ────────────────────────────────────────

  test('functional: picking an accent swatch persists + public CSS var updates', async ({
    page,
  }) => {
    const targetHex = '#3F7E3F'; // olive green — distinct from default #F59E0B
    const expectedLower = targetHex.toLowerCase();

    const putResponse = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/menus/${menuId}`) &&
        response.request().method() === 'PUT' &&
        response.ok(),
    );

    await page.getByTestId('branding-accent-swatch-3f7e3f').click();

    const res = await putResponse;
    const body = (await res.json()) as {
      data?: { accentColor: string | null };
    };
    expect(body.data?.accentColor?.toLowerCase()).toBe(expectedLower);

    // aria-checked toggled.
    await expect(
      page.getByTestId('branding-accent-swatch-3f7e3f'),
    ).toHaveAttribute('aria-checked', 'true');

    // DB is the source of truth.
    const row = await prismaTest.menu.findFirst({
      where: { id: menuId },
      select: { accentColor: true },
    });
    expect(row?.accentColor?.toLowerCase()).toBe(expectedLower);

    // Public menu reflects the change via the CSS var.
    await page.goto(`/m/${menuSlug}`);
    const accentVar = await page.evaluate(() =>
      getComputedStyle(document.documentElement)
        .getPropertyValue('--accent-color')
        .trim()
        .toLowerCase(),
    );
    expect(accentVar).toBe(expectedLower);
  });

  // ── Functional: hex input commits via Enter ────────────────────────────────

  test('functional: typing a hex into the accent input persists', async ({
    page,
  }) => {
    const newHex = '#7A5A8C'; // purple — palette swatch but committed via input

    const putResponse = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/menus/${menuId}`) &&
        response.request().method() === 'PUT' &&
        response.ok(),
    );

    const input = page.getByTestId('branding-accent-hex-input');
    await input.fill(newHex.replace('#', ''));
    await input.press('Enter');

    const res = await putResponse;
    const body = (await res.json()) as {
      data?: { accentColor: string | null };
    };
    expect(body.data?.accentColor?.toLowerCase()).toBe(newHex.toLowerCase());

    const row = await prismaTest.menu.findFirst({
      where: { id: menuId },
      select: { accentColor: true },
    });
    expect(row?.accentColor?.toLowerCase()).toBe(newHex.toLowerCase());
  });

  // ── Functional: currency select ────────────────────────────────────────────

  test('functional: switching currency to $ persists + public menu shows $', async ({
    page,
  }) => {
    const putResponse = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/menus/${menuId}`) &&
        response.request().method() === 'PUT' &&
        response.ok(),
    );

    await page.getByTestId('branding-currency-select').click();
    await page.getByTestId('branding-currency-option-usd').click();

    const res = await putResponse;
    const body = (await res.json()) as {
      data?: { currencySymbol: string | null };
    };
    expect(body.data?.currencySymbol).toBe('$');

    // Trigger button now displays the new symbol.
    await expect(page.getByTestId('branding-currency-symbol')).toHaveText('$');

    // DB is the source of truth.
    const row = await prismaTest.menu.findFirst({
      where: { id: menuId },
      select: { currencySymbol: true },
    });
    expect(row?.currencySymbol).toBe('$');

    // Public menu uses the new symbol next to product prices.
    await page.goto(`/m/${menuSlug}`);
    // PriceTag renders the symbol in its own <span>; at least one such span
    // with content "$" must be present once a product is rendered.
    const dollarSpans = page.locator('span', { hasText: /^\$$/ });
    await expect(dollarSpans.first()).toBeVisible();
  });

  // ── Functional: switching back to ₾ ────────────────────────────────────────

  test('functional: switching currency back to ₾ persists', async ({
    page,
  }) => {
    // Reset state first.
    await prismaTest.menu.update({
      where: { id: menuId },
      data: { currencySymbol: '$' },
    });
    await page.reload();

    const putResponse = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/menus/${menuId}`) &&
        response.request().method() === 'PUT' &&
        response.ok(),
    );

    await page.getByTestId('branding-currency-select').click();
    await page.getByTestId('branding-currency-option-gel').click();

    const res = await putResponse;
    const body = (await res.json()) as {
      data?: { currencySymbol: string | null };
    };
    expect(body.data?.currencySymbol).toBe('₾');

    const row = await prismaTest.menu.findFirst({
      where: { id: menuId },
      select: { currencySymbol: true },
    });
    expect(row?.currencySymbol).toBe('₾');
  });
});
