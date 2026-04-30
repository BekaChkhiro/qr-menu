// T19.4 — Public host: create-table sheet + host view page.
// Run:     pnpm test:e2e tests/e2e/public/table-host.spec.ts
// Update:  pnpm test:e2e:update tests/e2e/public/table-host.spec.ts

import { expect, test } from '@playwright/test';
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

async function seedSharedTableDisabledMenu(slug: string) {
  const user = await seedUser({ plan: 'PRO' });
  const menu = await seedMenu({
    userId: user.id,
    status: 'PUBLISHED',
    categoryCount: 1,
    productCount: 1,
    name: 'Plain Menu',
    slug,
  });
  // sharedTableEnabled defaults to false — no patch needed.
  return { user, menu };
}

test.describe('public — host create-table + host view (T19.4)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ context }) => {
    await resetDb();
    await context.clearCookies();
    await context.addCookies([
      { name: 'NEXT_LOCALE', value: 'en', domain: 'localhost', path: '/' },
    ]);
  });

  // ── CTA visibility ─────────────────────────────────────────────────────

  test('functional: floating CTA is hidden when sharedTableEnabled=false', async ({
    page,
  }) => {
    const slug = `tbl-cta-off-${Date.now()}`;
    await seedSharedTableDisabledMenu(slug);

    await page.goto(`/m/${slug}`);
    await expect(
      page.getByTestId('public-create-table-cta'),
    ).toHaveCount(0);
  });

  test('functional: floating CTA shows when sharedTableEnabled=true', async ({
    page,
  }) => {
    const slug = `tbl-cta-on-${Date.now()}`;
    await seedSharedTableMenu(slug);

    await page.goto(`/m/${slug}`);
    await expect(
      page.getByTestId('public-create-table-cta'),
    ).toBeVisible();
  });

  // ── Visual baselines ───────────────────────────────────────────────────

  test('visual: create-table sheet (mobile 375×812)', async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'mobile',
      'Mobile-only baseline per T19.4 spec',
    );

    const slug = `tbl-visual-sheet-mob-${Date.now()}`;
    await seedSharedTableMenu(slug);

    await page.goto(`/m/${slug}`);
    await page.getByTestId('public-create-table-cta').click();

    const sheet = page.getByTestId('public-create-table-sheet');
    await expect(sheet).toBeVisible();

    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot(
      `public-menu-create-table-sheet-${testInfo.project.name}.png`,
      { fullPage: true, maxDiffPixelRatio: 0.05 },
    );
  });

  test('visual: create-table sheet (desktop 1280×800)', async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop',
      'Desktop-only baseline per T19.4 spec',
    );

    const slug = `tbl-visual-sheet-desk-${Date.now()}`;
    await seedSharedTableMenu(slug);

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`/m/${slug}`);
    await page.getByTestId('public-create-table-cta').click();

    const sheet = page.getByTestId('public-create-table-sheet');
    await expect(sheet).toBeVisible();

    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot(
      `public-menu-create-table-sheet-${testInfo.project.name}.png`,
      { fullPage: true, maxDiffPixelRatio: 0.05 },
    );
  });

  test('visual: host view with two guests + selections (desktop)', async ({
    page,
    context,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop',
      'Desktop visual baseline per T19.4 spec',
    );

    const slug = `tbl-visual-host-${Date.now()}`;
    const { menu } = await seedSharedTableMenu(slug);

    // Drive the create flow through the API so the cookie sticks to this
    // browser context (the host's session).
    const created = await context.request.post(
      `/api/public/menus/${slug}/tables`,
      { data: { hostName: 'Nino', pin: '1234', maxGuests: 6 } },
    );
    expect(created.status()).toBe(201);
    const code = (await created.json()).data.code as string;

    // Two extra guests + selections seeded directly via Prisma so the visual
    // doesn't depend on the join/selection APIs (those are owned by T19.5/T19.3).
    const session = await prismaTest.tableSession.findUnique({
      where: { code },
      select: { id: true },
    });
    if (!session) throw new Error('Seeded table missing');

    const product = await prismaTest.product.findFirst({
      where: { category: { menuId: menu.id } },
    });
    if (!product) throw new Error('Seeded product missing');

    const alice = await prismaTest.tableGuest.create({
      data: { tableId: session.id, name: 'Alice', isHost: false },
      select: { id: true },
    });
    const bob = await prismaTest.tableGuest.create({
      data: { tableId: session.id, name: 'Bob', isHost: false },
      select: { id: true },
    });
    await prismaTest.tableSelection.createMany({
      data: [
        { tableId: session.id, guestId: alice.id, productId: product.id, quantity: 1 },
        { tableId: session.id, guestId: alice.id, productId: product.id, quantity: 2, note: 'extra cheese' },
        { tableId: session.id, guestId: bob.id, productId: product.id, quantity: 1 },
      ],
    });

    await page.goto(`/m/${slug}/t/${code}/host`);
    await expect(
      page.getByTestId('public-table-host-view'),
    ).toBeVisible();
    // Wait for the QR data URL to render so the snapshot is stable.
    await expect(
      page.getByTestId('public-table-host-qr').locator('img'),
    ).toBeVisible();
    await page.evaluate(() => document.fonts.ready);

    await expect(page).toHaveScreenshot(
      `public-menu-host-view-with-2-guests-${testInfo.project.name}.png`,
      { fullPage: true, maxDiffPixelRatio: 0.05 },
    );
  });

  // ── Functional: full create-and-land journey ──────────────────────────

  test('functional: create form → URL becomes /host and QR renders', async ({
    page,
  }) => {
    const slug = `tbl-create-${Date.now()}`;
    await seedSharedTableMenu(slug);

    await page.goto(`/m/${slug}`);
    await page.getByTestId('public-create-table-cta').click();

    await page.getByTestId('public-create-table-name').fill('Nino');
    await page.getByTestId('public-create-table-pin').fill('1234');
    await page.getByTestId('public-create-table-submit').click();

    // Land on /m/<slug>/t/<code>/host
    await page.waitForURL(new RegExp(`/m/${slug}/t/[A-Za-z0-9_-]{8}/host$`));
    await expect(
      page.getByTestId('public-table-host-view'),
    ).toBeVisible();

    // QR renders inline.
    await expect(
      page.getByTestId('public-table-host-qr').locator('img'),
    ).toBeVisible();

    // The host's name lands as the only guest (host) for the freshly-created
    // table.
    await expect(
      page.getByTestId('public-table-host-guest-card'),
    ).toHaveCount(1);
  });

  test('functional: PIN reveal toggles between dots and the typed PIN', async ({
    page,
  }) => {
    const slug = `tbl-pin-${Date.now()}`;
    await seedSharedTableMenu(slug);

    await page.goto(`/m/${slug}`);
    await page.getByTestId('public-create-table-cta').click();
    await page.getByTestId('public-create-table-name').fill('Nino');
    await page.getByTestId('public-create-table-pin').fill('5678');
    await page.getByTestId('public-create-table-submit').click();

    await page.waitForURL(/\/host$/);

    const toggle = page.getByTestId('public-table-host-pin-toggle');
    await expect(toggle).toContainText('• • • •');
    await toggle.click();
    await expect(toggle).toContainText('5678');
  });

  test('functional: copy-link button writes the table URL to the clipboard', async ({
    page,
    browserName,
  }) => {
    test.skip(
      browserName === 'webkit',
      'WebKit denies clipboard reads by default in Playwright',
    );

    const slug = `tbl-copy-${Date.now()}`;
    await seedSharedTableMenu(slug);

    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    await page.goto(`/m/${slug}`);
    await page.getByTestId('public-create-table-cta').click();
    await page.getByTestId('public-create-table-name').fill('Nino');
    await page.getByTestId('public-create-table-pin').fill('1234');
    await page.getByTestId('public-create-table-submit').click();

    await page.waitForURL(/\/host$/);
    const url = page.url().replace(/\/host$/, '');

    await page.getByTestId('public-table-host-copy-link').click();

    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard).toBe(url);
  });

  test('functional: close button requires confirmation; second click confirms', async ({
    page,
  }) => {
    const slug = `tbl-close-${Date.now()}`;
    await seedSharedTableMenu(slug);

    await page.goto(`/m/${slug}`);
    await page.getByTestId('public-create-table-cta').click();
    await page.getByTestId('public-create-table-name').fill('Nino');
    await page.getByTestId('public-create-table-pin').fill('1234');
    await page.getByTestId('public-create-table-submit').click();

    await page.waitForURL(/\/host$/);
    const code = page.url().match(/\/t\/([A-Za-z0-9_-]{8})\//)?.[1];
    expect(code).toBeTruthy();

    // First click opens confirm dialog — does NOT close yet.
    await page.getByTestId('public-table-host-close').click();
    const confirm = page.getByTestId('public-table-host-close-confirm');
    await expect(confirm).toBeVisible();

    // Confirm — table flips to CLOSED in DB.
    await confirm.getByRole('button', { name: /yes, close it/i }).click();

    await expect.poll(async () => {
      const row = await prismaTest.tableSession.findUnique({
        where: { code: code! },
        select: { status: true },
      });
      return row?.status;
    }, { timeout: 5_000 }).toBe('CLOSED');
  });

  test('functional: extend button is disabled when more than 30 minutes remain', async ({
    page,
  }) => {
    const slug = `tbl-extend-${Date.now()}`;
    await seedSharedTableMenu(slug);

    await page.goto(`/m/${slug}`);
    await page.getByTestId('public-create-table-cta').click();
    await page.getByTestId('public-create-table-name').fill('Nino');
    await page.getByTestId('public-create-table-pin').fill('1234');
    await page.getByTestId('public-create-table-submit').click();

    await page.waitForURL(/\/host$/);

    // Fresh table has 4h on the clock — extend stays disabled per spec
    // (only flips on inside the last 30 min window).
    const extend = page.getByTestId('public-table-host-extend');
    await expect(extend).toBeDisabled();
  });
});
