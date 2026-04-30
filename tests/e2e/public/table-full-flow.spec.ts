// T19.10 — End-to-end happy-path covering admin toggle → host create →
// guest join → selections → host remove → host close.
//
// Run:     pnpm test:e2e tests/e2e/public/table-full-flow.spec.ts
//
// This spec walks the entire shared-table flow as one continuous scenario,
// using four browser contexts:
//   • admin   — PRO café owner toggling sharedTableEnabled.
//   • host    — public visitor creating + running the table.
//   • guest1  — "Nino"
//   • guest2  — "Sandro"
//
// Step 8 (host sees both guests' picks live) and step 11 (host page navigates
// after close) require Pusher. The test skips when Pusher env vars are not
// configured, mirroring tests/e2e/public/table-realtime.spec.ts. Set
// PLAYWRIGHT_PUSHER_LIVE=1 to force-fail instead of skip.
//
// Desktop project only — there is no mobile-specific behavior in this flow
// that isn't already covered by the per-step T19.4/T19.5/T19.6 specs.
import { expect, test } from '@playwright/test';

import { loginAs } from '../fixtures/auth';
import { prismaTest, resetDb, seedMenu, seedUser } from '../fixtures/seed';

const REALTIME_TIMEOUT = 5_000;
const HOST_NAME = 'Beka';
const GUEST_1_NAME = 'Nino';
const GUEST_2_NAME = 'Sandro';
const TABLE_PIN = '1234';
const MAX_GUESTS = 4;

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

test.describe('public — table full flow (T19.10)', () => {
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
      test.skip(true, 'Pusher env vars not configured — skipping live flow');
    }
  });

  test('functional: admin enables → host creates → 2 guests join → picks → host removes → host closes', async ({
    browser,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop',
      'Desktop-only: per-step mobile coverage lives in T19.4/T19.5 specs',
    );

    await resetDb();

    // ── Seed ───────────────────────────────────────────────────────────────
    const slug = `tbl-full-${Date.now()}`;
    const ownerEmail = 'nino-owner@cafelinville.ge';
    const owner = await seedUser({
      plan: 'PRO',
      name: 'Nino Kapanadze',
      email: ownerEmail,
    });
    const menu = await seedMenu({
      userId: owner.id,
      status: 'PUBLISHED',
      categoryCount: 1,
      productCount: 4, // 4 distinct products → 2 per guest
      name: 'Café Linville',
      slug,
    });
    // Default sharedTableEnabled is false — this is what step 1 flips ON.

    // ── Step 1: PRO admin toggles sharedTableEnabled ON via the settings tab.
    const adminCtx = await browser.newContext();
    await adminCtx.addCookies([
      { name: 'NEXT_LOCALE', value: 'en', domain: 'localhost', path: '/' },
    ]);
    const adminPage = await adminCtx.newPage();
    await loginAs(adminPage, ownerEmail);
    await adminPage.goto(`/admin/menus/${menu.id}?tab=settings`);

    const sharedTableSection = adminPage.getByTestId('settings-shared-table');
    await expect(sharedTableSection).toBeVisible();
    await expect(sharedTableSection).toHaveAttribute('data-enabled', 'false');
    await adminPage.getByTestId('settings-shared-table-switch').click();
    await expect(sharedTableSection).toHaveAttribute('data-enabled', 'true');

    // DB confirms the persistence — guards against optimistic-only updates.
    await expect
      .poll(
        async () => {
          const row = await prismaTest.menu.findUnique({
            where: { id: menu.id },
            select: { sharedTableEnabled: true },
          });
          return row?.sharedTableEnabled;
        },
        { timeout: 5_000 },
      )
      .toBe(true);

    // ── Step 2: fresh public context — Create-Shared-Table CTA visible. ───
    const hostCtx = await browser.newContext();
    await hostCtx.addCookies([
      { name: 'NEXT_LOCALE', value: 'en', domain: 'localhost', path: '/' },
    ]);
    const hostPage = await hostCtx.newPage();
    await hostPage.goto(`/m/${slug}`);
    await expect(hostPage.getByTestId('public-create-table-cta')).toBeVisible();

    // ── Step 3: host creates the table (name "Beka", PIN "1234", cap 4). ──
    await hostPage.getByTestId('public-create-table-cta').click();
    await hostPage.getByTestId('public-create-table-name').fill(HOST_NAME);
    await hostPage.getByTestId('public-create-table-pin').fill(TABLE_PIN);
    await hostPage
      .getByTestId('public-create-table-cap')
      .fill(String(MAX_GUESTS));
    await hostPage.getByTestId('public-create-table-submit').click();

    // ── Step 4: lands on /host with QR + only host as guest. ──────────────
    await hostPage.waitForURL(
      new RegExp(`/m/${slug}/t/[A-Za-z0-9_-]{8}/host$`),
    );
    await expect(hostPage.getByTestId('public-table-host-view')).toBeVisible();
    await expect(
      hostPage.getByTestId('public-table-host-qr').locator('img'),
    ).toBeVisible();

    const code = hostPage.url().match(/\/t\/([A-Za-z0-9_-]{8})\//)?.[1];
    if (!code) throw new Error('Failed to parse table code from /host URL');

    // Wait for the host's Pusher socket so subsequent guest actions actually
    // reach the host view in real time (steps 8 and 10).
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

    // Step 5: copy the table link via the host's button. The guests open the
    // link directly so the test doesn't depend on system clipboard plumbing
    // (already covered in table-host.spec.ts).
    const tableUrl = hostPage.url().replace(/\/host$/, '');

    // ── Step 6: guest #1 ("Nino") joins from a fresh context. ─────────────
    const guest1Ctx = await browser.newContext();
    await guest1Ctx.addCookies([
      { name: 'NEXT_LOCALE', value: 'en', domain: 'localhost', path: '/' },
    ]);
    const guest1Page = await guest1Ctx.newPage();
    await guest1Page.goto(tableUrl);
    await expect(guest1Page.getByTestId('public-join-table')).toBeVisible();
    await guest1Page.getByTestId('public-join-name').fill(GUEST_1_NAME);
    await guest1Page.getByTestId('public-join-pin').fill(TABLE_PIN);
    await guest1Page.getByTestId('public-join-submit').click();
    await expect(
      guest1Page.getByTestId('public-table-guest-menu'),
    ).toBeVisible();

    // ── Step 7: guest #2 ("Sandro") joins from a separate context. ────────
    const guest2Ctx = await browser.newContext();
    await guest2Ctx.addCookies([
      { name: 'NEXT_LOCALE', value: 'en', domain: 'localhost', path: '/' },
    ]);
    const guest2Page = await guest2Ctx.newPage();
    await guest2Page.goto(tableUrl);
    await expect(guest2Page.getByTestId('public-join-table')).toBeVisible();
    await guest2Page.getByTestId('public-join-name').fill(GUEST_2_NAME);
    await guest2Page.getByTestId('public-join-pin').fill(TABLE_PIN);
    await guest2Page.getByTestId('public-join-submit').click();
    await expect(
      guest2Page.getByTestId('public-table-guest-menu'),
    ).toBeVisible();

    // ── Step 8: each guest adds 2 different items. ────────────────────────
    // Guest 1 picks products[0] and products[1]; guest 2 picks products[2]
    // and products[3]. Different products per guest — no overlap.
    const guest1Adds = guest1Page.getByTestId('public-product-add');
    await expect(guest1Adds.first()).toBeVisible();
    await guest1Adds.nth(0).click();
    await expect(
      guest1Page.getByTestId('public-table-guest-tray-pill'),
    ).toContainText('My picks · 1');
    await guest1Adds.nth(1).click();
    await expect(
      guest1Page.getByTestId('public-table-guest-tray-pill'),
    ).toContainText('My picks · 2');

    const guest2Adds = guest2Page.getByTestId('public-product-add');
    await expect(guest2Adds.first()).toBeVisible();
    await guest2Adds.nth(2).click();
    await expect(
      guest2Page.getByTestId('public-table-guest-tray-pill'),
    ).toContainText('My picks · 1');
    await guest2Adds.nth(3).click();
    await expect(
      guest2Page.getByTestId('public-table-guest-tray-pill'),
    ).toContainText('My picks · 2');

    // ── Step 9: host view picks up both guests + 4 selections via Pusher. ──
    // Three guest cards: host (Beka) + Nino + Sandro.
    await expect(
      hostPage.getByTestId('public-table-host-guest-card'),
    ).toHaveCount(3, { timeout: 5_000 });
    await expect(
      hostPage.getByTestId('public-table-host-selection-row'),
    ).toHaveCount(4, { timeout: 5_000 });

    // Each guest card shows the right pick count.
    const ninoCard = hostPage
      .getByTestId('public-table-host-guest-card')
      .filter({ hasText: GUEST_1_NAME });
    const sandroCard = hostPage
      .getByTestId('public-table-host-guest-card')
      .filter({ hasText: GUEST_2_NAME });
    await expect(
      ninoCard.getByTestId('public-table-host-selection-row'),
    ).toHaveCount(2);
    await expect(
      sandroCard.getByTestId('public-table-host-selection-row'),
    ).toHaveCount(2);

    // ── Step 10: host removes one of Nino's items. ────────────────────────
    // Use the per-row Remove button (aria-label="Remove") inside Nino's card.
    const ninoRowBeforeRemove = ninoCard.getByTestId(
      'public-table-host-selection-row',
    );
    await ninoRowBeforeRemove
      .first()
      .getByRole('button', { name: 'Remove' })
      .click();

    await expect(
      ninoCard.getByTestId('public-table-host-selection-row'),
    ).toHaveCount(1, { timeout: 5_000 });

    // DB confirms the cascade: Nino now has exactly 1 selection.
    await expect
      .poll(
        async () => {
          const ninoGuest = await prismaTest.tableGuest.findFirst({
            where: { table: { code }, name: GUEST_1_NAME },
            select: { id: true },
          });
          if (!ninoGuest) return -1;
          return prismaTest.tableSelection.count({
            where: { guestId: ninoGuest.id },
          });
        },
        { timeout: 5_000 },
      )
      .toBe(1);

    // Nino's tray reflects the removal on next server round-trip — the guest
    // page does not subscribe to Pusher (per T19.6 spec), so we reload to pull
    // the fresh selection list. This mirrors the real refresh behavior.
    await guest1Page.reload();
    await expect(
      guest1Page.getByTestId('public-table-guest-tray-pill'),
    ).toContainText('My picks · 1');

    // Sandro is unaffected — still has 2 picks.
    await expect(
      guest2Page.getByTestId('public-table-guest-tray-pill'),
    ).toContainText('My picks · 2');

    // ── Step 11: host clicks Close → confirms → both guests fall out. ─────
    await hostPage.getByTestId('public-table-host-close').click();
    const closeConfirm = hostPage.getByTestId(
      'public-table-host-close-confirm',
    );
    await expect(closeConfirm).toBeVisible();
    await closeConfirm.getByRole('button', { name: /yes, close it/i }).click();

    // DB flips to CLOSED.
    await expect
      .poll(
        async () => {
          const row = await prismaTest.tableSession.findUnique({
            where: { code },
            select: { status: true },
          });
          return row?.status;
        },
        { timeout: 5_000 },
      )
      .toBe('CLOSED');

    // Host page navigates to /m/<slug> via the Pusher broadcast.
    await hostPage.waitForURL(`**/m/${slug}`, { timeout: 5_000 });

    // Each guest, on next server round-trip, falls back to the join form
    // (the table-mode page renders <JoinTableForm/> when status !== OPEN).
    // The guest page does not subscribe to Pusher, so a reload is the
    // realistic trigger — this matches the documented behavior in T19.6.
    await guest1Page.reload();
    await expect(guest1Page.getByTestId('public-join-table')).toBeVisible();

    await guest2Page.reload();
    await expect(guest2Page.getByTestId('public-join-table')).toBeVisible();

    // ── Cleanup ────────────────────────────────────────────────────────────
    await guest2Ctx.close();
    await guest1Ctx.close();
    await hostCtx.close();
    await adminCtx.close();
  });
});
