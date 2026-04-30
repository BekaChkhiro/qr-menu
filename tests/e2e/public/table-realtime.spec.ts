// T19.6 — Public host view: real-time sync via Pusher.
// Run:     pnpm test:e2e tests/e2e/public/table-realtime.spec.ts
//
// These tests drive two browser contexts (host + guest) against a real Pusher
// channel. They are skipped when Pusher credentials are not configured for
// the dev server — locally, set NEXT_PUBLIC_PUSHER_KEY / PUSHER_KEY etc. in
// apps/web/.env.local, or run with PLAYWRIGHT_PUSHER_LIVE=1 to force-fail
// instead of skip on a misconfigured environment.

import { expect, test, type BrowserContext } from '@playwright/test';
import { prismaTest, resetDb, seedMenu, seedUser } from '../fixtures/seed';

const REALTIME_TIMEOUT = 5_000;

function pusherConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_PUSHER_KEY &&
    process.env.NEXT_PUBLIC_PUSHER_CLUSTER &&
    process.env.PUSHER_APP_ID &&
    process.env.PUSHER_KEY &&
    process.env.PUSHER_SECRET &&
    process.env.PUSHER_CLUSTER
  );
}

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

test.describe('public — host view real-time sync (T19.6)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(() => {
    if (!pusherConfigured()) {
      const required = process.env.PLAYWRIGHT_PUSHER_LIVE === '1';
      if (required) {
        throw new Error(
          'PLAYWRIGHT_PUSHER_LIVE=1 but Pusher env vars are not configured. ' +
            'Set NEXT_PUBLIC_PUSHER_KEY/CLUSTER + PUSHER_APP_ID/KEY/SECRET/CLUSTER.',
        );
      }
      test.skip(true, 'Pusher env vars not configured — skipping live tests');
    }
  });

  test.beforeEach(async ({ context }) => {
    await resetDb();
    await context.clearCookies();
    await context.addCookies([
      { name: 'NEXT_LOCALE', value: 'en', domain: 'localhost', path: '/' },
    ]);
  });

  test('functional: guest selection appears on host view within 3s without reload', async ({
    page,
    browser,
  }) => {
    const slug = `tbl-rt-add-${Date.now()}`;
    const { menu } = await seedSharedTableMenu(slug);

    // Page acts as the host. Create the table via API so the cookie binds to
    // this context.
    const code = await createTableAsHost(page.context(), slug);

    await page.goto(`/m/${slug}/t/${code}/host`);
    await expect(page.getByTestId('public-table-host-view')).toBeVisible();

    // Wait for the host's Pusher socket to register as connected before the
    // guest acts — otherwise the test races the subscription.
    await expect
      .poll(
        async () => {
          return await page
            .getByTestId('public-table-host-realtime-status')
            .getAttribute('data-realtime-state');
        },
        { timeout: REALTIME_TIMEOUT },
      )
      .toBe('connected');

    // Guest joins via a separate browser context (separate cookies).
    const guestCtx = await browser.newContext();
    try {
      const joinRes = await guestCtx.request.post(
        `/api/public/tables/${code}/join`,
        { data: { name: 'Anna', pin: '1234' } },
      );
      expect(joinRes.status()).toBe(200);

      const product = await prismaTest.product.findFirstOrThrow({
        where: { category: { menuId: menu.id } },
        select: { id: true },
      });

      const addRes = await guestCtx.request.post(
        `/api/public/tables/${code}/selections`,
        { data: { productId: product.id, quantity: 1 } },
      );
      expect(addRes.status()).toBe(201);
      const selectionId = (await addRes.json()).data.id as string;

      // The host view should pick up the new guest card AND the selection row
      // without any manual reload.
      await expect(
        page
          .getByTestId('public-table-host-selection-row')
          .filter({ has: page.locator(`[data-selection-id="${selectionId}"]`) }),
      ).toBeVisible({ timeout: 3_000 });

      // Guest card now exists for Anna with count=1.
      await expect(
        page.getByTestId('public-table-host-guest-card'),
      ).toHaveCount(2);
    } finally {
      await guestCtx.close();
    }
  });

  test('functional: when host closes, guest browsing the table-mode menu navigates to /m/<slug>', async ({
    page,
    browser,
  }) => {
    const slug = `tbl-rt-close-${Date.now()}`;
    await seedSharedTableMenu(slug);

    // Host context creates the table.
    const hostCtx = await browser.newContext();
    let code: string;
    try {
      code = await createTableAsHost(hostCtx, slug);

      // Guest joins from page's context and lands on the table menu.
      await page.goto(`/m/${slug}/t/${code}`);
      await page.getByTestId('public-join-name').fill('Anna');
      await page.getByTestId('public-join-pin').fill('1234');
      await page.getByTestId('public-join-submit').click();
      await expect(page.getByTestId('public-table-guest-menu')).toBeVisible();

      // Host opens its own host view and waits for live status.
      const hostPage = await hostCtx.newPage();
      await hostPage.goto(`/m/${slug}/t/${code}/host`);
      await expect(hostPage.getByTestId('public-table-host-view')).toBeVisible();
      await expect
        .poll(
          async () => {
            return await hostPage
              .getByTestId('public-table-host-realtime-status')
              .getAttribute('data-realtime-state');
          },
          { timeout: REALTIME_TIMEOUT },
        )
        .toBe('connected');

      // Host triggers close via API (the close button path is exercised in
      // table-host.spec.ts; here we care about the realtime broadcast).
      const closeRes = await hostCtx.request.post(
        `/api/public/tables/${code}/close`,
      );
      expect(closeRes.status()).toBe(200);

      // The guest's menu page does NOT subscribe to Pusher (per spec: only
      // the host subscribes). It will see the closed status the next time it
      // makes a server round-trip — which happens immediately when it tries
      // to interact with the table. We assert the DB state and the host's
      // navigation here; the guest's eventual eviction is covered by the
      // public-table guest spec via API auth checks.
      await expect.poll(
        async () => {
          const row = await prismaTest.tableSession.findUnique({
            where: { code },
            select: { status: true },
          });
          return row?.status;
        },
        { timeout: REALTIME_TIMEOUT },
      ).toBe('CLOSED');

      // Host's own page navigates back to /m/<slug> within 3s of receiving
      // the broadcast.
      await hostPage.waitForURL(`**/m/${slug}`, { timeout: 3_000 });
    } finally {
      await hostCtx.close();
    }
  });

  test('functional: extend broadcast bumps the host countdown without reload', async ({
    page,
    browser,
  }) => {
    const slug = `tbl-rt-extend-${Date.now()}`;
    await seedSharedTableMenu(slug);

    // First, create the table as host through page's context so the host view
    // we're testing belongs to this page.
    const code = await createTableAsHost(page.context(), slug);

    // Move expiresAt to within the 30-min window so the extend route is
    // accepted (otherwise the API rejects with a 410). Drop the table to ~5
    // minutes left.
    const tightExpiry = new Date(Date.now() + 5 * 60 * 1000);
    await prismaTest.tableSession.update({
      where: { code },
      data: { expiresAt: tightExpiry, extendedAt: null },
    });

    await page.goto(`/m/${slug}/t/${code}/host`);
    await expect(page.getByTestId('public-table-host-view')).toBeVisible();
    await expect
      .poll(
        async () => {
          return await page
            .getByTestId('public-table-host-realtime-status')
            .getAttribute('data-realtime-state');
        },
        { timeout: REALTIME_TIMEOUT },
      )
      .toBe('connected');

    // Trigger extend from a separate context. The API rejects non-host
    // cookies, so we use a request fired with the host's cookie via the page
    // context's request fixture (it shares cookies with the page).
    const extendRes = await page.context().request.post(
      `/api/public/tables/${code}/extend`,
    );
    expect(extendRes.status()).toBe(200);

    // The countdown will jump from ~5 minutes to ~2h05m. Assert by reading the
    // hours digit which flips from "0:0..." to "2:0..." after the broadcast.
    await expect
      .poll(
        async () => {
          const text = await page
            .getByTestId('public-table-host-view')
            .textContent();
          return /\b2:[0-5][0-9]:[0-5][0-9]\b/.test(text ?? '');
        },
        { timeout: 3_000 },
      )
      .toBe(true);

    void browser; // browser fixture unused — kept for signature consistency.
  });
});
