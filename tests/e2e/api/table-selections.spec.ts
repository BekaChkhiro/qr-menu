// T19.3 — Backend selections API (POST / DELETE) + Pusher broadcasts.
// Run:     pnpm test:e2e tests/e2e/api/table-selections.spec.ts
//
// Notes:
//   - API-only: uses Playwright `request` fixture so each actor (host, guest A,
//     guest B, stranger) owns its cookie jar.
//   - Does NOT call resetDb — every test seeds its own user/menu/table with
//     random identifiers so concurrent and serial runs stay independent.
//   - The Pusher functional test is gated on the same env vars as
//     tests/e2e/public/table-realtime.spec.ts: skipped when missing, force-
//     failed under PLAYWRIGHT_PUSHER_LIVE=1.

import { expect, request, test, type APIRequestContext } from '@playwright/test';
import { prismaTest, seedMenu, seedUser } from '../fixtures/seed';

interface SelectionsSeed {
  menuSlug: string;
  menuId: string;
  productId: string;
}

async function seedSelectionsMenu(): Promise<SelectionsSeed> {
  const slug = `sel-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const user = await seedUser({ plan: 'PRO' });
  const menu = await seedMenu({
    userId: user.id,
    status: 'PUBLISHED',
    slug,
    categoryCount: 1,
    productCount: 1,
  });
  await prismaTest.menu.update({
    where: { id: menu.id },
    data: { sharedTableEnabled: true },
  });
  const product = await prismaTest.product.findFirstOrThrow({
    where: { category: { menuId: menu.id } },
    select: { id: true },
  });
  return { menuSlug: slug, menuId: menu.id, productId: product.id };
}

async function newClient(): Promise<APIRequestContext> {
  return request.newContext();
}

async function createTable(
  client: APIRequestContext,
  slug: string,
  pin = '1234',
  maxGuests = 4,
): Promise<{ code: string; hostGuestId: string }> {
  const res = await client.post(`/api/public/menus/${slug}/tables`, {
    data: { hostName: 'Nino', pin, maxGuests },
  });
  expect(res.status()).toBe(201);
  const body = await res.json();
  return {
    code: body.data.code as string,
    hostGuestId: body.data.hostGuestId as string,
  };
}

async function joinTable(
  client: APIRequestContext,
  code: string,
  name: string,
  pin = '1234',
): Promise<string> {
  const res = await client.post(`/api/public/tables/${code}/join`, {
    data: { name, pin },
  });
  expect(res.status()).toBe(200);
  const body = await res.json();
  return body.data.guestId as string;
}

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

// ---------------------------------------------------------------------------

test.describe('selections — POST validation & authz', () => {
  test('rejects POST without cookie with 401', async () => {
    const seed = await seedSelectionsMenu();
    const host = await newClient();
    const { code } = await createTable(host, seed.menuSlug);

    const stranger = await newClient();
    const res = await stranger.post(`/api/public/tables/${code}/selections`, {
      data: { productId: seed.productId, quantity: 1 },
    });
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  test('rejects productId from another menu with 400 PRODUCT_NOT_IN_MENU', async () => {
    // Two independent menus seeded in the same test. The guest joins menu A's
    // table and tries to add menu B's product → defense-in-depth must reject.
    const a = await seedSelectionsMenu();
    const b = await seedSelectionsMenu();

    const host = await newClient();
    const { code } = await createTable(host, a.menuSlug);

    const guest = await newClient();
    await joinTable(guest, code, 'Alice');

    const res = await guest.post(`/api/public/tables/${code}/selections`, {
      data: { productId: b.productId, quantity: 1 },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('PRODUCT_NOT_IN_MENU');

    // Sanity: the foreign productId was never persisted under this table.
    const saved = await prismaTest.tableSelection.findFirst({
      where: { table: { code }, productId: b.productId },
    });
    expect(saved).toBeNull();
  });

  test('happy path: guest adds a selection (201) and it persists', async () => {
    const seed = await seedSelectionsMenu();
    const host = await newClient();
    const { code } = await createTable(host, seed.menuSlug);

    const guest = await newClient();
    const guestId = await joinTable(guest, code, 'Alice');

    const res = await guest.post(`/api/public/tables/${code}/selections`, {
      data: { productId: seed.productId, quantity: 2, note: 'no onions' },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.guestId).toBe(guestId);
    expect(body.data.productId).toBe(seed.productId);
    expect(body.data.quantity).toBe(2);
    expect(body.data.note).toBe('no onions');

    const persisted = await prismaTest.tableSelection.findUnique({
      where: { id: body.data.id as string },
    });
    expect(persisted).not.toBeNull();
    expect(persisted!.guestId).toBe(guestId);
  });
});

// ---------------------------------------------------------------------------

test.describe('selections — DELETE authz', () => {
  test('guest A cannot delete guest B\'s selection (403); host can (200)', async () => {
    const seed = await seedSelectionsMenu();
    const host = await newClient();
    const { code } = await createTable(host, seed.menuSlug);

    const a = await newClient();
    const b = await newClient();
    await joinTable(a, code, 'Alice');
    await joinTable(b, code, 'Bob');

    // Bob adds a selection.
    const addRes = await b.post(`/api/public/tables/${code}/selections`, {
      data: { productId: seed.productId, quantity: 1 },
    });
    expect(addRes.status()).toBe(201);
    const selectionId = (await addRes.json()).data.id as string;

    // Alice tries to delete Bob's selection → 403.
    const aliceDel = await a.delete(
      `/api/public/tables/${code}/selections/${selectionId}`,
    );
    expect(aliceDel.status()).toBe(403);
    const aliceBody = await aliceDel.json();
    expect(aliceBody.error.code).toBe('FORBIDDEN');

    // Selection still there.
    const stillThere = await prismaTest.tableSelection.findUnique({
      where: { id: selectionId },
    });
    expect(stillThere).not.toBeNull();

    // Host deletes Bob's selection → 200.
    const hostDel = await host.delete(
      `/api/public/tables/${code}/selections/${selectionId}`,
    );
    expect(hostDel.status()).toBe(200);
    const hostBody = await hostDel.json();
    expect(hostBody.data.deleted).toBe(true);

    const gone = await prismaTest.tableSelection.findUnique({
      where: { id: selectionId },
    });
    expect(gone).toBeNull();
  });

  test('guest can delete their own selection (200)', async () => {
    const seed = await seedSelectionsMenu();
    const host = await newClient();
    const { code } = await createTable(host, seed.menuSlug);

    const guest = await newClient();
    await joinTable(guest, code, 'Alice');

    const addRes = await guest.post(`/api/public/tables/${code}/selections`, {
      data: { productId: seed.productId, quantity: 1 },
    });
    expect(addRes.status()).toBe(201);
    const selectionId = (await addRes.json()).data.id as string;

    const delRes = await guest.delete(
      `/api/public/tables/${code}/selections/${selectionId}`,
    );
    expect(delRes.status()).toBe(200);

    const gone = await prismaTest.tableSelection.findUnique({
      where: { id: selectionId },
    });
    expect(gone).toBeNull();
  });
});

// ---------------------------------------------------------------------------

test.describe('selections — Pusher broadcast (functional)', () => {
  test('TABLE_SELECTION_ADDED arrives on table-{code} within 2s of POST', async () => {
    if (!pusherConfigured()) {
      const required = process.env.PLAYWRIGHT_PUSHER_LIVE === '1';
      if (required) {
        throw new Error(
          'PLAYWRIGHT_PUSHER_LIVE=1 but Pusher env vars are not configured. ' +
            'Set NEXT_PUBLIC_PUSHER_KEY/CLUSTER + PUSHER_APP_ID/KEY/SECRET/CLUSTER.',
        );
      }
      test.skip(true, 'Pusher env vars not configured — skipping live test');
      return;
    }

    // Lazy import so the rest of the suite never pulls pusher-js when env is
    // missing. Resolved from apps/web because pusher-js's node bundle lives
    // there in this monorepo (the root hoist may be empty under the project's
    // `--ignore-scripts` install workflow). The node entry is required —
    // Playwright runs specs in Node, where the default export targets a
    // browser bundle that fails on `window` access.
    const { createRequire } = await import('node:module');
    const path = await import('node:path');
    let PusherClient: typeof import('pusher-js').default;
    try {
      const webPkgRequire = createRequire(
        path.join(process.cwd(), 'apps/web/package.json'),
      );
      const mod = webPkgRequire('pusher-js') as
        | typeof import('pusher-js')
        | { default: typeof import('pusher-js').default };
      PusherClient = (mod as { default?: typeof import('pusher-js').default })
        .default ?? (mod as unknown as typeof import('pusher-js').default);
    } catch (err) {
      const required = process.env.PLAYWRIGHT_PUSHER_LIVE === '1';
      if (required) throw err;
      test.skip(
        true,
        `pusher-js could not be loaded (${(err as Error).message}) — skipping`,
      );
      return;
    }

    const seed = await seedSelectionsMenu();
    const host = await newClient();
    const { code } = await createTable(host, seed.menuSlug);

    const guest = await newClient();
    const guestId = await joinTable(guest, code, 'Alice');

    const client = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      forceTLS: true,
    });

    interface AddedPayload {
      guestId: string;
      guestName: string;
      selectionId: string;
      productId: string;
      quantity: number;
    }

    try {
      // Wait for socket connection before subscribing — otherwise the event
      // can fire before pusher-js has registered the binding.
      await new Promise<void>((resolve, reject) => {
        const onConnected = () => {
          client.connection.unbind('connected', onConnected);
          client.connection.unbind('error', onError);
          resolve();
        };
        const onError = (err: unknown) => {
          client.connection.unbind('connected', onConnected);
          client.connection.unbind('error', onError);
          reject(err instanceof Error ? err : new Error('Pusher connect error'));
        };
        client.connection.bind('connected', onConnected);
        client.connection.bind('error', onError);
        // Also resolve immediately if already connected (fast reuse).
        if (client.connection.state === 'connected') onConnected();
      });

      const channel = client.subscribe(`table-${code}`);
      await new Promise<void>((resolve, reject) => {
        const t = setTimeout(
          () => reject(new Error('Pusher subscription_succeeded timed out')),
          5_000,
        );
        channel.bind('pusher:subscription_succeeded', () => {
          clearTimeout(t);
          resolve();
        });
      });

      const eventPromise = new Promise<AddedPayload>((resolve, reject) => {
        const t = setTimeout(
          () => reject(new Error('TABLE_SELECTION_ADDED not received within 2s')),
          2_000,
        );
        channel.bind('table:selection_added', (data: AddedPayload) => {
          clearTimeout(t);
          resolve(data);
        });
      });

      const addRes = await guest.post(
        `/api/public/tables/${code}/selections`,
        { data: { productId: seed.productId, quantity: 3, note: 'spicy' } },
      );
      expect(addRes.status()).toBe(201);
      const addedId = (await addRes.json()).data.id as string;

      const payload = await eventPromise;
      expect(payload.selectionId).toBe(addedId);
      expect(payload.guestId).toBe(guestId);
      expect(payload.guestName).toBe('Alice');
      expect(payload.productId).toBe(seed.productId);
      expect(payload.quantity).toBe(3);
    } finally {
      client.unsubscribe(`table-${code}`);
      client.disconnect();
    }
  });
});
