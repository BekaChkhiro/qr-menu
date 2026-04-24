// Test for T13.6 Editor — Languages Tab (KA/EN/RU matrix).
// Run:     pnpm test:e2e tests/e2e/admin/editor-languages.spec.ts
// Update:  pnpm test:e2e:update tests/e2e/admin/editor-languages.spec.ts
//
// Covers:
//   Visual     — /admin/menus/[id]?tab=languages on PRO (matrix visible with
//                live coverage) and on STARTER (whole tab blurred with a
//                PRO-locked upgrade overlay).
//   Functional — toggling EN off persists `enabledLanguages` through
//                PUT /api/menus/[id] and the DB row matches; coverage %
//                recalculates after a translation is written directly to the
//                DB and the page is reloaded; STARTER cannot interact with
//                the switches (pointer-events: none on wrapper) and the
//                upgrade CTA links to /admin/settings/billing; the filter
//                toggle narrows the matrix to rows with missing translations.
//
// Note: the Languages tab replaces the phone preview column (full-width
// matrix), so `editor-shell` is the right screenshot target and tests do not
// assert on any `phone-preview-*` selectors.

import { expect, test, type Page } from '@playwright/test';

import { loginAs } from '../fixtures/auth';
import { prismaTest, resetDb, seedMenu, seedUser } from '../fixtures/seed';

async function seedProAndOpenLanguages(
  page: Page,
  opts: { categoryCount?: number; productCount?: number } = {},
) {
  const email = 'nino-pro@cafelinville.ge';
  const user = await seedUser({ plan: 'PRO', name: 'Nino Kapanadze', email });
  const menu = await seedMenu({
    userId: user.id,
    status: 'DRAFT',
    categoryCount: opts.categoryCount ?? 2,
    productCount: opts.productCount ?? 3,
    name: 'Café Linville — Brunch',
  });
  // seedMenu defaults enabledLanguages to ['KA']; Languages tab is most
  // meaningful when EN + RU are also enabled so the matrix shows all 3 columns
  // with partial coverage (seeder fills nameEn but leaves nameRu null).
  await prismaTest.menu.update({
    where: { id: menu.id },
    data: { enabledLanguages: ['KA', 'EN', 'RU'] },
  });
  await loginAs(page, email);
  await page.goto(`/admin/menus/${menu.id}?tab=languages`);
  await expect(page.getByTestId('editor-languages-tab')).toBeVisible();
  return { user, menu };
}

async function seedStarterAndOpenLanguages(page: Page) {
  const email = 'starter@cafelinville.ge';
  const user = await seedUser({
    plan: 'STARTER',
    name: 'Nino Kapanadze',
    email,
  });
  const menu = await seedMenu({
    userId: user.id,
    status: 'DRAFT',
    categoryCount: 2,
    productCount: 3,
    name: 'Café Linville — Brunch',
  });
  await loginAs(page, email);
  await page.goto(`/admin/menus/${menu.id}?tab=languages`);
  await expect(page.getByTestId('editor-languages-tab')).toBeVisible();
  return { user, menu };
}

test.describe('editor languages tab (T13.6)', () => {
  // Serial so resetDb() in one test can't race another's seed.
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ context }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop',
      'Desktop-only tab; mobile variant lands in T17.3',
    );
    await resetDb();
    await context.clearCookies();
    // Force English so locked-overlay + coverage copy matches assertions.
    await context.addCookies([
      { name: 'NEXT_LOCALE', value: 'en', domain: 'localhost', path: '/' },
    ]);
  });

  // ── Visual: PRO (matrix visible) ──────────────────────────────────────────

  test('visual: editor-languages on PRO', async ({ page }, testInfo) => {
    await seedProAndOpenLanguages(page);
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({
      content:
        '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }',
    });

    const shell = page.getByTestId('editor-shell');
    await expect(shell).toBeVisible();
    await expect(page.getByTestId('editor-languages-matrix')).toBeVisible();
    // Seeder fills nameEn for all rows but no nameRu → partial coverage.
    // 2 categories × (1 + 3) = 8 rows × 2 target langs (EN, RU) = 16 cells,
    // EN fills 8, RU fills 0 → 8 translated, 8 missing.
    const coverage = page.getByTestId('editor-languages-coverage');
    await expect(coverage).toHaveAttribute('data-translated', '8');
    await expect(coverage).toHaveAttribute('data-total', '16');
    await expect(coverage).toHaveAttribute('data-missing', '8');

    await expect(shell).toHaveScreenshot(
      `editor-languages-pro-${testInfo.project.name}.png`,
      { maxDiffPixelRatio: 0.05 },
    );
  });

  // ── Visual: STARTER (locked overlay) ──────────────────────────────────────

  test('visual: editor-languages on STARTER shows locked overlay', async ({
    page,
  }, testInfo) => {
    await seedStarterAndOpenLanguages(page);
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({
      content:
        '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }',
    });

    const shell = page.getByTestId('editor-shell');
    await expect(shell).toBeVisible();
    await expect(
      page.getByTestId('editor-languages-locked-overlay'),
    ).toBeVisible();
    // The inner content is still rendered (blurred) so the upgrade CTA is
    // reachable in the DOM even if visually obscured.
    await expect(page.getByTestId('editor-languages-upgrade-cta')).toHaveAttribute(
      'href',
      '/admin/settings/billing',
    );

    await expect(shell).toHaveScreenshot(
      `editor-languages-starter-locked-${testInfo.project.name}.png`,
      { maxDiffPixelRatio: 0.05 },
    );
  });

  // ── Functional: PRO toggles EN off → PUT + DB persisted ───────────────────

  test('functional: PRO toggles EN off → PUT /api/menus and DB updates', async ({
    page,
  }) => {
    const { menu } = await seedProAndOpenLanguages(page);

    // Sanity: EN switch starts checked.
    const enSwitch = page.getByTestId('editor-languages-switch-en');
    await expect(enSwitch).toHaveAttribute('data-state', 'checked');

    const putResponse = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/menus/${menu.id}`) &&
        response.request().method() === 'PUT' &&
        response.ok(),
    );

    await enSwitch.click();

    const res = await putResponse;
    const body = (await res.json()) as {
      data?: { enabledLanguages: Array<'KA' | 'EN' | 'RU'> };
    };
    expect(body.data?.enabledLanguages).toEqual(
      expect.arrayContaining(['KA', 'RU']),
    );
    expect(body.data?.enabledLanguages).not.toContain('EN');

    // UI reflects the change.
    await expect(enSwitch).toHaveAttribute('data-state', 'unchecked');

    // Database is source of truth.
    const row = await prismaTest.menu.findFirst({
      where: { id: menu.id },
      select: { enabledLanguages: true },
    });
    expect(row?.enabledLanguages).toEqual(
      expect.arrayContaining(['KA', 'RU']),
    );
    expect(row?.enabledLanguages).not.toContain('EN');
  });

  // ── Functional: coverage % updates after a translation is added ───────────

  test('functional: coverage recalculates after adding a translation', async ({
    page,
  }) => {
    const { menu } = await seedProAndOpenLanguages(page);

    const coverage = page.getByTestId('editor-languages-coverage');
    // 8 rows × 2 target langs = 16 cells; EN all filled (8), RU all empty (0).
    await expect(coverage).toHaveAttribute('data-translated', '8');
    await expect(coverage).toHaveAttribute('data-missing', '8');

    // Pick any seeded product and add its Russian name.
    const product = await prismaTest.product.findFirst({
      where: { category: { menuId: menu.id } },
      select: { id: true },
    });
    expect(product?.id).toBeTruthy();
    await prismaTest.product.update({
      where: { id: product!.id },
      data: { nameRu: 'Хачапури Аджарули' },
    });

    // Reload so the server component refetches the menu with its categories.
    await page.reload();
    await expect(page.getByTestId('editor-languages-tab')).toBeVisible();

    // One more cell translated → one fewer missing.
    const coverageAfter = page.getByTestId('editor-languages-coverage');
    await expect(coverageAfter).toHaveAttribute('data-translated', '9');
    await expect(coverageAfter).toHaveAttribute('data-missing', '7');
    await expect(coverageAfter).toHaveAttribute('data-total', '16');
  });

  // ── Functional: STARTER cannot toggle; CTA links to billing ───────────────

  test('functional: STARTER cannot toggle; upgrade CTA links to billing', async ({
    page,
  }) => {
    const { menu } = await seedStarterAndOpenLanguages(page);

    const overlay = page.getByTestId('editor-languages-locked-overlay');
    await expect(overlay).toBeVisible();

    // Trying to flip EN behind the blur should not trigger any PUT.
    const requests: string[] = [];
    page.on('request', (req) => {
      if (
        req.url().includes(`/api/menus/${menu.id}`) &&
        req.method() === 'PUT'
      ) {
        requests.push(req.url());
      }
    });

    await page
      .getByTestId('editor-languages-switch-en')
      .click({ force: true })
      .catch(() => {
        /* intercepted by overlay — expected */
      });

    await page.waitForTimeout(300);
    expect(requests).toHaveLength(0);

    // DB unchanged (still the default ['KA']).
    const row = await prismaTest.menu.findFirst({
      where: { id: menu.id },
      select: { enabledLanguages: true },
    });
    expect(row?.enabledLanguages).toEqual(['KA']);

    await expect(
      page.getByTestId('editor-languages-upgrade-cta'),
    ).toHaveAttribute('href', '/admin/settings/billing');
  });

  // ── Functional: "Show missing only" filters rows ──────────────────────────

  test('functional: "Show missing only" narrows matrix to rows missing a lang', async ({
    page,
  }) => {
    const { menu } = await seedProAndOpenLanguages(page);

    // Add both nameEn + nameRu to one product so it is fully translated and
    // should disappear when the filter is on.
    const fullyTranslated = await prismaTest.product.findFirst({
      where: { category: { menuId: menu.id } },
      select: { id: true, nameKa: true },
    });
    await prismaTest.product.update({
      where: { id: fullyTranslated!.id },
      data: { nameEn: 'Fully Translated', nameRu: 'Полностью переведено' },
    });

    await page.reload();
    await expect(page.getByTestId('editor-languages-tab')).toBeVisible();

    const rowsContainer = page.getByTestId('editor-languages-rows');
    const allRowsCount = await rowsContainer
      .locator('[data-testid^="editor-languages-row-"]')
      .count();
    expect(allRowsCount).toBe(8); // 2 categories × (1 cat + 3 products) = 8.

    // Turn on "Show missing only".
    const filterToggle = page.getByTestId('editor-languages-filter-toggle');
    await filterToggle.click();
    await expect(filterToggle).toHaveAttribute('data-pressed', 'true');

    // The fully-translated product row is no longer rendered.
    await expect(
      page.getByTestId(`editor-languages-row-prod-${fullyTranslated!.id}`),
    ).toHaveCount(0);

    const filteredRowsCount = await rowsContainer
      .locator('[data-testid^="editor-languages-row-"]')
      .count();
    expect(filteredRowsCount).toBe(allRowsCount - 1);
  });
});
