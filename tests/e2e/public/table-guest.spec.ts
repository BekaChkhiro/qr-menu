// T19.5 — Public guest: join flow + table-mode menu + personal tray.
// Run:     pnpm test:e2e tests/e2e/public/table-guest.spec.ts
// Update:  pnpm test:e2e:update tests/e2e/public/table-guest.spec.ts

import { expect, test, type BrowserContext } from '@playwright/test';
import { prismaTest, resetDb, seedMenu, seedUser } from '../fixtures/seed';

async function seedSharedTableMenu(slug: string) {
  const user = await seedUser({
    plan: 'PRO',
    name: 'Nino Kapanadze',
    email: 'nino@cafelinville.ge',
  });
  const menu = await seedMenu({
    userId: user.id,
    status: 'PUBLISHED',
    categoryCount: 1,
    productCount: 3,
    name: 'Café Linville',
    slug,
  });
  await prismaTest.menu.update({
    where: { id: menu.id },
    data: { sharedTableEnabled: true, enabledLanguages: ['KA', 'EN'] },
  });
  return { user, menu };
}

async function createTableAsHost(
  hostContext: BrowserContext,
  slug: string,
  pin = '1234',
  maxGuests = 6,
): Promise<string> {
  const created = await hostContext.request.post(
    `/api/public/menus/${slug}/tables`,
    { data: { hostName: 'Nino', pin, maxGuests } },
  );
  expect(created.status()).toBe(201);
  const code = (await created.json()).data.code as string;
  return code;
}

test.describe('public — guest join + tray (T19.5)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ context }) => {
    await resetDb();
    await context.clearCookies();
    await context.addCookies([
      { name: 'NEXT_LOCALE', value: 'en', domain: 'localhost', path: '/' },
    ]);
  });

  // ── Visual baselines ───────────────────────────────────────────────────

  test('visual: join form (mobile 375×812)', async ({ page, browser }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'mobile',
      'Mobile-only baseline per T19.5 spec',
    );

    const slug = `tbl-guest-join-visual-${Date.now()}`;
    await seedSharedTableMenu(slug);

    // Host creates the table in a separate context so this page hits the join
    // form (no host cookie in this context).
    const hostCtx = await browser.newContext();
    const code = await createTableAsHost(hostCtx, slug);
    await hostCtx.close();

    await page.goto(`/m/${slug}/t/${code}`);
    await expect(page.getByTestId('public-join-table')).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot(
      `public-menu-join-form-${testInfo.project.name}.png`,
      { fullPage: true, maxDiffPixelRatio: 0.05 },
    );
  });

  test('visual: guest menu with tray open (mobile 375×812)', async ({
    page,
    browser,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'mobile',
      'Mobile-only baseline per T19.5 spec',
    );

    const slug = `tbl-guest-tray-visual-${Date.now()}`;
    const { menu } = await seedSharedTableMenu(slug);

    const hostCtx = await browser.newContext();
    const code = await createTableAsHost(hostCtx, slug);
    await hostCtx.close();

    // Guest joins through the form so the cookie sticks to this context.
    await page.goto(`/m/${slug}/t/${code}`);
    await page.getByTestId('public-join-name').fill('Anna');
    await page.getByTestId('public-join-pin').fill('1234');
    await page.getByTestId('public-join-submit').click();

    await expect(page.getByTestId('public-table-guest-menu')).toBeVisible();

    // Pre-seed two selections through the API so the tray is populated.
    const products = await prismaTest.product.findMany({
      where: { category: { menuId: menu.id } },
      select: { id: true },
      take: 2,
    });
    expect(products.length).toBe(2);
    for (const p of products) {
      const res = await page.request.post(
        `/api/public/tables/${code}/selections`,
        { data: { productId: p.id, quantity: 1 } },
      );
      expect(res.status()).toBe(201);
    }

    await page.reload();
    await expect(page.getByTestId('public-table-guest-tray-pill')).toContainText(
      'My picks · 2',
    );
    await page.getByTestId('public-table-guest-tray-pill').click();
    await expect(page.getByTestId('public-table-guest-tray')).toBeVisible();
    await expect(
      page.getByTestId('public-table-guest-tray-item'),
    ).toHaveCount(2);

    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot(
      `public-menu-guest-with-tray-open-${testInfo.project.name}.png`,
      { fullPage: true, maxDiffPixelRatio: 0.05 },
    );
  });

  // ── Functional: full guest journey ─────────────────────────────────────

  test('functional: host creates → guest joins → adds picks → refresh persists → leaves', async ({
    page,
    browser,
  }) => {
    const slug = `tbl-guest-journey-${Date.now()}`;
    const { menu } = await seedSharedTableMenu(slug);

    const hostCtx = await browser.newContext();
    const code = await createTableAsHost(hostCtx, slug);
    await hostCtx.close();

    // Land on the table-scoped URL — should render the join form.
    await page.goto(`/m/${slug}/t/${code}`);
    await expect(page.getByTestId('public-join-table')).toBeVisible();

    await page.getByTestId('public-join-name').fill('Anna');
    await page.getByTestId('public-join-pin').fill('1234');
    await page.getByTestId('public-join-submit').click();

    // After join, the page re-renders into the table-mode menu.
    await expect(page.getByTestId('public-table-guest-menu')).toBeVisible();
    await expect(page.getByTestId('public-table-guest-tray-pill')).toBeVisible();

    // Add two items via the per-card "+" button. The first non-variation
    // products on the menu both pass through the direct-add path.
    const addButtons = page.getByTestId('public-product-add');
    await expect(addButtons.first()).toBeVisible();
    await addButtons.nth(0).click();
    await expect(page.getByTestId('public-table-guest-tray-pill')).toContainText(
      'My picks · 1',
    );
    await addButtons.nth(1).click();
    await expect(page.getByTestId('public-table-guest-tray-pill')).toContainText(
      'My picks · 2',
    );

    // Drawer shows both selections.
    await page.getByTestId('public-table-guest-tray-pill').click();
    await expect(page.getByTestId('public-table-guest-tray')).toBeVisible();
    await expect(
      page.getByTestId('public-table-guest-tray-item'),
    ).toHaveCount(2);

    // DB confirms the persistence — exactly 2 selections for this guest row.
    const guestRow = await prismaTest.tableGuest.findFirstOrThrow({
      where: { table: { code }, name: 'Anna' },
      select: { id: true },
    });
    const dbSelections = await prismaTest.tableSelection.findMany({
      where: { guestId: guestRow.id },
    });
    expect(dbSelections).toHaveLength(2);

    // Refresh: cookie persists, items still there.
    await page.reload();
    await expect(page.getByTestId('public-table-guest-menu')).toBeVisible();
    await expect(page.getByTestId('public-table-guest-tray-pill')).toContainText(
      'My picks · 2',
    );

    // Leave the table from the tray.
    await page.getByTestId('public-table-guest-tray-pill').click();
    await page.getByTestId('public-table-guest-tray-leave').click();
    const confirm = page.getByTestId('public-table-guest-tray-leave-confirm');
    await expect(confirm).toBeVisible();
    await confirm.getByRole('button', { name: /yes, leave/i }).click();

    // Cookie should be gone — page rerenders the join form.
    await expect(page.getByTestId('public-join-table')).toBeVisible({
      timeout: 5000,
    });

    // DB confirms hard-delete of the guest row + cascade of selections.
    const guestStillThere = await prismaTest.tableGuest.findFirst({
      where: { table: { code }, name: 'Anna' },
    });
    expect(guestStillThere).toBeNull();

    void menu; // narrow lint scope; menu kept above for clarity in seed step.
  });

  // ── Functional: error states ───────────────────────────────────────────

  test('functional: wrong PIN surfaces "Wrong PIN — N attempts left"', async ({
    page,
    browser,
  }) => {
    const slug = `tbl-guest-wrongpin-${Date.now()}`;
    await seedSharedTableMenu(slug);

    const hostCtx = await browser.newContext();
    const code = await createTableAsHost(hostCtx, slug, '4242');
    await hostCtx.close();

    await page.goto(`/m/${slug}/t/${code}`);
    await page.getByTestId('public-join-name').fill('Anna');
    await page.getByTestId('public-join-pin').fill('0000');
    await page.getByTestId('public-join-submit').click();

    const error = page.getByTestId('public-join-error');
    await expect(error).toBeVisible();
    await expect(error).toContainText(/Wrong PIN/i);
    await expect(error).toContainText(/attempts left/i);
  });

  test('functional: full table surfaces "Table is full"', async ({
    page,
    browser,
  }) => {
    const slug = `tbl-guest-full-${Date.now()}`;
    await seedSharedTableMenu(slug);

    const hostCtx = await browser.newContext();
    // maxGuests=2 → after host (1) + one extra guest (2), the next join hits
    // TABLE_FULL.
    const code = await createTableAsHost(hostCtx, slug, '1234', 2);
    await hostCtx.close();

    const session = await prismaTest.tableSession.findUniqueOrThrow({
      where: { code },
      select: { id: true },
    });
    await prismaTest.tableGuest.create({
      data: { tableId: session.id, name: 'Bob', isHost: false },
    });

    await page.goto(`/m/${slug}/t/${code}`);
    await page.getByTestId('public-join-name').fill('Anna');
    await page.getByTestId('public-join-pin').fill('1234');
    await page.getByTestId('public-join-submit').click();

    const error = page.getByTestId('public-join-error');
    await expect(error).toBeVisible();
    await expect(error).toContainText(/Table is full/i);
  });
});
