// T19.2 — Backend table lifecycle (create / join / get / close / extend).
// Run:     pnpm test:e2e tests/e2e/api/table-lifecycle.spec.ts
// Notes:
//   - API-only: no UI navigation. Uses Playwright `request` fixture so each
//     suite manages its own cookie jar (host vs guest A vs guest B).
//   - Truncates tables in `beforeEach` via the shared seed helpers, which
//     refuse to run against any non-localhost database (see
//     `assertSafeTestDatabase` in tests/e2e/fixtures/seed.ts).

import { expect, request, test, type APIRequestContext } from '@playwright/test';
import { prismaTest, resetDb, seedMenu, seedUser } from '../fixtures/seed';

interface SeedResult {
  menuSlug: string;
  menuId: string;
  productId: string;
}

async function seedSharedTableMenu(
  opts: {
    slug?: string;
    plan?: 'FREE' | 'STARTER' | 'PRO';
    sharedTableEnabled?: boolean;
  } = {},
): Promise<SeedResult> {
  const slug = opts.slug ?? `tbl-${Math.random().toString(36).slice(2, 10)}`;
  const user = await seedUser({ plan: opts.plan ?? 'PRO' });
  const menu = await seedMenu({
    userId: user.id,
    status: 'PUBLISHED',
    slug,
    categoryCount: 1,
    productCount: 1,
  });

  await prismaTest.menu.update({
    where: { id: menu.id },
    data: { sharedTableEnabled: opts.sharedTableEnabled ?? true },
  });

  const product = await prismaTest.product.findFirst({
    where: { category: { menuId: menu.id } },
  });
  if (!product) throw new Error('Seeded product missing');

  return { menuSlug: slug, menuId: menu.id, productId: product.id };
}

async function newClient(): Promise<APIRequestContext> {
  // Each call returns a fresh cookie jar — perfect for "host" vs "guest" actors.
  return request.newContext();
}

const HOST_BODY = { hostName: 'Nino', pin: '1234', maxGuests: 4 };

// ---------------------------------------------------------------------------

test.describe('table lifecycle — create', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async () => {
    await resetDb();
  });

  test('non-PRO plan returns 403 PLAN_DOWNGRADED', async () => {
    const { menuSlug } = await seedSharedTableMenu({ plan: 'STARTER' });
    const ctx = await newClient();
    const res = await ctx.post(`/api/public/menus/${menuSlug}/tables`, {
      data: HOST_BODY,
    });
    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('PLAN_DOWNGRADED');
  });

  test('sharedTableEnabled=false returns 404', async () => {
    const { menuSlug } = await seedSharedTableMenu({
      plan: 'PRO',
      sharedTableEnabled: false,
    });
    const ctx = await newClient();
    const res = await ctx.post(`/api/public/menus/${menuSlug}/tables`, {
      data: HOST_BODY,
    });
    expect(res.status()).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe('MENU_NOT_FOUND');
  });

  test('bad PIN format returns 400 VALIDATION_ERROR', async () => {
    const { menuSlug } = await seedSharedTableMenu();
    const ctx = await newClient();
    const res = await ctx.post(`/api/public/menus/${menuSlug}/tables`, {
      data: { ...HOST_BODY, pin: 'abcd' },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  test('happy path returns code + sets cookie + creates host guest', async () => {
    const { menuSlug, menuId } = await seedSharedTableMenu();
    const ctx = await newClient();
    const res = await ctx.post(`/api/public/menus/${menuSlug}/tables`, {
      data: HOST_BODY,
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(typeof body.data.code).toBe('string');
    expect(body.data.code).toHaveLength(8);
    expect(typeof body.data.hostGuestId).toBe('string');

    const session = await prismaTest.tableSession.findUnique({
      where: { code: body.data.code },
      include: { guests: true },
    });
    expect(session).not.toBeNull();
    expect(session!.menuId).toBe(menuId);
    expect(session!.status).toBe('OPEN');
    expect(session!.guests).toHaveLength(1);
    expect(session!.guests[0].isHost).toBe(true);
    expect(session!.guests[0].id).toBe(body.data.hostGuestId);
  });
});

// ---------------------------------------------------------------------------

test.describe('table lifecycle — join', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async () => {
    await resetDb();
  });

  async function createOpenTable(maxGuests = 3) {
    const seed = await seedSharedTableMenu();
    const host = await newClient();
    const created = await host.post(
      `/api/public/menus/${seed.menuSlug}/tables`,
      { data: { hostName: 'Nino', pin: '1234', maxGuests } },
    );
    expect(created.status()).toBe(201);
    const body = await created.json();
    return { ...seed, host, code: body.data.code as string };
  }

  test('5 wrong PINs lock further attempts within window (right PIN still 429)', async () => {
    const { code } = await createOpenTable();
    const guest = await newClient();

    for (let i = 0; i < 5; i++) {
      const res = await guest.post(`/api/public/tables/${code}/join`, {
        data: { name: `Guest ${i}`, pin: '0000' },
      });
      expect(res.status()).toBe(401);
      const body = await res.json();
      expect(body.error.code).toBe('WRONG_PIN');
    }

    const locked = await guest.post(`/api/public/tables/${code}/join`, {
      data: { name: 'Right Guest', pin: '1234' },
    });
    expect(locked.status()).toBe(429);
    const body = await locked.json();
    expect(body.error.code).toBe('RATE_LIMITED');
    expect(locked.headers()['retry-after']).toBeTruthy();
  });

  test('table full returns 409 TABLE_FULL', async () => {
    const { code } = await createOpenTable(2); // host + 1 guest = full
    const a = await newClient();
    const b = await newClient();

    const okA = await a.post(`/api/public/tables/${code}/join`, {
      data: { name: 'Alice', pin: '1234' },
    });
    expect(okA.status()).toBe(200);

    const fullB = await b.post(`/api/public/tables/${code}/join`, {
      data: { name: 'Bob', pin: '1234' },
    });
    expect(fullB.status()).toBe(409);
    const body = await fullB.json();
    expect(body.error.code).toBe('TABLE_FULL');
  });

  test('rejoin path: same cookie + same code returns existing guest', async () => {
    const { code } = await createOpenTable();
    const guest = await newClient();

    const first = await guest.post(`/api/public/tables/${code}/join`, {
      data: { name: 'Alice', pin: '1234' },
    });
    expect(first.status()).toBe(200);
    const firstBody = await first.json();
    const guestId = firstBody.data.guestId as string;

    const again = await guest.post(`/api/public/tables/${code}/join`, {
      data: { name: 'Alice', pin: '1234' },
    });
    expect(again.status()).toBe(200);
    const againBody = await again.json();
    expect(againBody.data.guestId).toBe(guestId);
    expect(againBody.data.rejoined).toBe(true);
  });
});

// ---------------------------------------------------------------------------

test.describe('table lifecycle — get', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async () => {
    await resetDb();
  });

  async function setupHostAndTwoGuests() {
    const seed = await seedSharedTableMenu();
    const host = await newClient();
    const created = await host.post(
      `/api/public/menus/${seed.menuSlug}/tables`,
      { data: { hostName: 'Nino', pin: '1234', maxGuests: 5 } },
    );
    const code = (await created.json()).data.code as string;

    const a = await newClient();
    const b = await newClient();
    const ja = await a.post(`/api/public/tables/${code}/join`, {
      data: { name: 'Alice', pin: '1234' },
    });
    const jb = await b.post(`/api/public/tables/${code}/join`, {
      data: { name: 'Bob', pin: '1234' },
    });
    const aId = (await ja.json()).data.guestId as string;
    const bId = (await jb.json()).data.guestId as string;

    return { ...seed, code, host, a, b, aId, bId };
  }

  test('GET without cookie returns 401', async () => {
    const { code } = await setupHostAndTwoGuests();
    const stranger = await newClient();
    const res = await stranger.get(`/api/public/tables/${code}`);
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  test('guest sees own selections only; host sees all', async () => {
    const { code, host, a, b, aId, bId, productId } =
      await setupHostAndTwoGuests();

    // Insert selections directly via Prisma so this test stays focused on the
    // GET role-based shape (selections POST is owned by T19.3).
    const tableSession = await prismaTest.tableSession.findUnique({
      where: { code },
      select: { id: true },
    });
    if (!tableSession) throw new Error('Table missing');

    await prismaTest.tableSelection.createMany({
      data: [
        { tableId: tableSession.id, guestId: aId, productId, quantity: 1 },
        { tableId: tableSession.id, guestId: bId, productId, quantity: 2 },
      ],
    });

    const asA = await a.get(`/api/public/tables/${code}`);
    expect(asA.status()).toBe(200);
    const aBody = (await asA.json()).data;
    expect(aBody.role).toBe('guest');
    expect(aBody.selections.every((s: { guestId: string }) => s.guestId === aId)).toBe(true);
    expect(aBody.selections.some((s: { guestId: string }) => s.guestId === bId)).toBe(false);
    // Public guest list: names visible, no selection details for others.
    expect(aBody.guests.length).toBe(3);

    const asHost = await host.get(`/api/public/tables/${code}`);
    expect(asHost.status()).toBe(200);
    const hBody = (await asHost.json()).data;
    expect(hBody.role).toBe('host');
    const guestIds = new Set(hBody.selections.map((s: { guestId: string }) => s.guestId));
    expect(guestIds.has(aId)).toBe(true);
    expect(guestIds.has(bId)).toBe(true);

    // Host sees Bob's quantity=2 — proves it's not filtered to host's own.
    const bobSel = hBody.selections.find((s: { guestId: string }) => s.guestId === bId);
    expect(bobSel.quantity).toBe(2);
  });

  test('expired session is auto-marked EXPIRED on read', async () => {
    const { code, host } = await setupHostAndTwoGuests();
    await prismaTest.tableSession.update({
      where: { code },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    const res = await host.get(`/api/public/tables/${code}`);
    expect(res.status()).toBe(200);
    const body = (await res.json()).data;
    expect(body.status).toBe('EXPIRED');

    const dbRow = await prismaTest.tableSession.findUnique({ where: { code } });
    expect(dbRow!.status).toBe('EXPIRED');
  });
});

// ---------------------------------------------------------------------------

test.describe('table lifecycle — close & extend', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async () => {
    await resetDb();
  });

  async function setupHostAndGuest() {
    const seed = await seedSharedTableMenu();
    const host = await newClient();
    const created = await host.post(
      `/api/public/menus/${seed.menuSlug}/tables`,
      { data: { hostName: 'Nino', pin: '1234', maxGuests: 5 } },
    );
    const code = (await created.json()).data.code as string;

    const guest = await newClient();
    const j = await guest.post(`/api/public/tables/${code}/join`, {
      data: { name: 'Alice', pin: '1234' },
    });
    expect(j.status()).toBe(200);

    return { ...seed, code, host, guest };
  }

  test('close is host-only; subsequent ops return 410', async () => {
    const { code, host, guest } = await setupHostAndGuest();

    const guestClose = await guest.post(`/api/public/tables/${code}/close`);
    expect(guestClose.status()).toBe(403);

    const hostClose = await host.post(`/api/public/tables/${code}/close`);
    expect(hostClose.status()).toBe(200);

    const afterGet = await host.get(`/api/public/tables/${code}`);
    expect(afterGet.status()).toBe(200);
    const body = (await afterGet.json()).data;
    expect(body.status).toBe('CLOSED');

    const closeAgain = await host.post(`/api/public/tables/${code}/close`);
    expect(closeAgain.status()).toBe(410);

    const extendAfterClose = await host.post(`/api/public/tables/${code}/extend`);
    expect(extendAfterClose.status()).toBe(410);
  });

  test('extend twice: second call returns 409 EXTEND_ALREADY_USED', async () => {
    const { code, host } = await setupHostAndGuest();

    const original = await prismaTest.tableSession.findUnique({
      where: { code },
      select: { expiresAt: true },
    });

    const first = await host.post(`/api/public/tables/${code}/extend`);
    expect(first.status()).toBe(200);
    const firstBody = (await first.json()).data;
    const newExpiry = new Date(firstBody.expiresAt).getTime();
    expect(newExpiry).toBeGreaterThan(original!.expiresAt.getTime());

    const second = await host.post(`/api/public/tables/${code}/extend`);
    expect(second.status()).toBe(409);
    const secondBody = await second.json();
    expect(secondBody.error.code).toBe('EXTEND_ALREADY_USED');
  });

  test('extend is host-only', async () => {
    const { code, guest } = await setupHostAndGuest();
    const res = await guest.post(`/api/public/tables/${code}/extend`);
    expect(res.status()).toBe(403);
  });
});
