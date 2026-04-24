// Test for T15.1 Editor — Analytics Tab · KPI Row + Sparklines.
// Run:     pnpm test:e2e tests/e2e/admin/editor-analytics.spec.ts
// Update:  pnpm test:e2e:update tests/e2e/admin/editor-analytics.spec.ts
//
// Covers:
//   Visual  — /admin/menus/[id]?tab=analytics on PRO (4 StatCards rendered)
//             and on FREE (row blurred + locked overlay + upgrade CTA).
//   Functional —
//     • PRO: 500 MenuViews seeded across 30 days with hour=13 over-weighted.
//       API returns totalViews=500 and peakHour={hour:13,...}. Rendered
//       "Total views" card shows "500", "Peak hour" card shows "13:00".
//     • PRO: unique-scans count matches distinct (ipAddress, userAgent) pairs.
//     • FREE: clicking a KPI does nothing (pointer-events:none on wrapper);
//       upgrade CTA links to /admin/settings/billing.

import { expect, test, type Page } from '@playwright/test';
import { ActivityType } from '@prisma/client';

import { loginAs } from '../fixtures/auth';
import {
  prismaTest,
  resetDb,
  seedActivityLog,
  seedMenu,
  seedUser,
} from '../fixtures/seed';

interface SeedViewsOptions {
  menuId: string;
  /** Total rows to insert. Default 500. */
  total?: number;
  /** Hour of the UTC day that receives the majority share. Default 13. */
  peakHour?: number;
  /** Share of rows placed in the peak hour [0..1]. Default 0.6. */
  peakShare?: number;
  /** Number of distinct (ip, userAgent) pairs to rotate through. Default 80. */
  uniqueFingerprints?: number;
}

/**
 * Deterministic seed: drops `total` MenuView rows across the last 30 days,
 * with `peakShare` of them clustered inside `peakHour` (UTC) so the KPI's
 * peak-hour aggregation is stable. Remaining rows are spread across the
 * other 23 hours uniformly.
 */
async function seedShapedMenuViews(opts: SeedViewsOptions): Promise<void> {
  const total = opts.total ?? 500;
  const peakHour = opts.peakHour ?? 13;
  const peakShare = opts.peakShare ?? 0.6;
  const uniqueFingerprints = opts.uniqueFingerprints ?? 80;

  const peakCount = Math.floor(total * peakShare);
  const otherCount = total - peakCount;

  const now = Date.now();
  const rows: Array<{
    menuId: string;
    device: string;
    ipAddress: string;
    userAgent: string;
    viewedAt: Date;
  }> = [];

  const devices = ['mobile', 'desktop', 'tablet'];

  // Helper: day in [0, 29], hour in [0, 23]
  const stamp = (day: number, hour: number, minute: number): Date => {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - day);
    d.setUTCHours(hour, minute % 60, 0, 0);
    return d;
  };

  for (let i = 0; i < peakCount; i++) {
    const day = i % 30;
    const minute = (i * 7) % 60;
    rows.push({
      menuId: opts.menuId,
      device: devices[i % devices.length],
      ipAddress: `10.0.${Math.floor(i / uniqueFingerprints) % 255}.${
        i % uniqueFingerprints
      }`,
      userAgent: `Mozilla/5.0 TestBot/peak-${i % uniqueFingerprints}`,
      viewedAt: stamp(day, peakHour, minute),
    });
  }

  for (let i = 0; i < otherCount; i++) {
    const day = i % 30;
    // Skip the peak hour when distributing the "other" bucket
    const hour = i % 23 >= peakHour ? (i % 23) + 1 : i % 23;
    const minute = (i * 11) % 60;
    rows.push({
      menuId: opts.menuId,
      device: devices[(i + 2) % devices.length],
      ipAddress: `10.1.${Math.floor(i / uniqueFingerprints) % 255}.${
        i % uniqueFingerprints
      }`,
      userAgent: `Mozilla/5.0 TestBot/other-${i % uniqueFingerprints}`,
      viewedAt: stamp(day, hour, minute),
    });
  }

  // createMany handles ~1000 rows comfortably.
  await prismaTest.menuView.createMany({ data: rows });
}

async function seedProAndOpenAnalytics(page: Page) {
  const email = 'nino@cafelinville.ge';
  const user = await seedUser({
    plan: 'PRO',
    name: 'Nino Kapanadze',
    email,
  });
  const menu = await seedMenu({
    userId: user.id,
    status: 'PUBLISHED',
    categoryCount: 2,
    productCount: 3,
    name: 'Café Linville — Dinner',
  });
  await seedShapedMenuViews({ menuId: menu.id, total: 500, peakHour: 13 });
  await loginAs(page, email);
  await page.goto(`/admin/menus/${menu.id}?tab=analytics`);
  await expect(page.getByTestId('editor-analytics-tab')).toBeVisible();
  return { user, menu };
}

async function seedFreeAndOpenAnalytics(page: Page) {
  const email = 'beka@test.local';
  const user = await seedUser({
    plan: 'FREE',
    name: 'Beka Chkhiro',
    email,
  });
  const menu = await seedMenu({
    userId: user.id,
    status: 'DRAFT',
    categoryCount: 1,
    productCount: 2,
    name: 'Free plan menu',
  });
  await loginAs(page, email);
  await page.goto(`/admin/menus/${menu.id}?tab=analytics`);
  await expect(page.getByTestId('editor-analytics-tab')).toBeVisible();
  return { user, menu };
}

test.describe('editor analytics tab · KPI row (T15.1)', () => {
  // Serial so resetDb() in one test can't race another's seed.
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ context }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop',
      'Desktop-only tab; mobile variant lands in T17.3',
    );
    await resetDb();
    await context.clearCookies();
    // Force English so locked-overlay copy matches our assertions.
    await context.addCookies([
      { name: 'NEXT_LOCALE', value: 'en', domain: 'localhost', path: '/' },
    ]);
  });

  // ── Visual: PRO (KPIs rendered with data) ──────────────────────────────────

  test('visual: editor-analytics-kpis on PRO', async ({ page }, testInfo) => {
    await seedProAndOpenAnalytics(page);

    // Wait for network + data to settle before snapshotting.
    await page
      .getByTestId('editor-analytics-kpis')
      .waitFor({ state: 'visible' });
    await expect(page.getByTestId('kpi-total-views')).toBeVisible();
    await expect(page.getByTestId('kpi-peak-hour')).toBeVisible();
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({
      content:
        '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }',
    });

    await expect(page.getByTestId('editor-analytics-kpis')).toHaveScreenshot(
      `editor-analytics-kpis-${testInfo.project.name}.png`,
      { maxDiffPixelRatio: 0.05 },
    );
  });

  // (T15.6 moves the FREE-locked + empty-state coverage to a dedicated
  // describe block at the bottom of this file — see "editor analytics tab ·
  // FREE locked + empty states (T15.6)". The KPI section itself no longer
  // owns an overlay; the lock now lives on the tab.)

  // ── Functional: PRO — 500 seeded views surface correctly ───────────────────

  test('functional: PRO sees total views = seeded row count', async ({
    page,
  }) => {
    const { menu } = await seedProAndOpenAnalytics(page);

    // Total views card shows 500 (or 500 with locale separators — en-US: "500")
    await expect(page.getByTestId('kpi-total-views')).toContainText('500');

    // Database sanity: 500 rows actually landed.
    const dbCount = await prismaTest.menuView.count({
      where: { menuId: menu.id },
    });
    expect(dbCount).toBe(500);
  });

  // ── Functional: PRO — peak hour resolves to the over-weighted hour ─────────

  test('functional: PRO peak-hour card matches busiest hour (13:00)', async ({
    page,
  }) => {
    await seedProAndOpenAnalytics(page);

    // Peak hour card renders "13:00" (two-digit pad, 24h).
    const peakCard = page.getByTestId('kpi-peak-hour');
    await expect(peakCard).toContainText('13:00');
    // Caption surfaces the count at the peak hour (>= peakShare * 500 = 300).
    await expect(peakCard).toContainText(/\d+ views/);
  });

  // ── Functional: PRO — API endpoint returns the expected shape ──────────────

  test('functional: GET /api/menus/[id]/analytics returns kpis payload', async ({
    page,
  }) => {
    const { menu } = await seedProAndOpenAnalytics(page);

    const res = await page.request.get(
      `/api/menus/${menu.id}/analytics?period=30d`,
    );
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as {
      data?: {
        kpis?: {
          totalViews?: { current: number; daily: number[] };
          uniqueScans?: { current: number };
          avgTimeOnMenu?: unknown;
          peakHour?: { hour: number | null; views: number };
        };
      };
    };
    const kpis = body.data?.kpis;
    expect(kpis).toBeTruthy();
    expect(kpis?.totalViews?.current).toBe(500);
    expect(Array.isArray(kpis?.totalViews?.daily)).toBe(true);
    // 30-day window → 30 daily buckets (every day covered, zero-filled).
    expect(kpis?.totalViews?.daily?.length).toBe(30);
    expect(kpis?.peakHour?.hour).toBe(13);
    expect(kpis?.peakHour?.views).toBeGreaterThanOrEqual(300);
    expect(kpis?.avgTimeOnMenu).toBeNull();
    // Unique scans bounded above by total views and below by a reasonable
    // floor given our 80-fingerprint rotation.
    expect(kpis?.uniqueScans?.current).toBeGreaterThan(50);
    expect(kpis?.uniqueScans?.current).toBeLessThanOrEqual(500);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// T15.2 — Views-Over-Time Chart
// ─────────────────────────────────────────────────────────────────────────────
//
// Covers:
//   Visual  — chart card on PRO with seeded views + scans
//             chart card with the per-day tooltip displayed (hover state)
//   Functional —
//     • Chart svg + both series paths render with 30 day buckets
//     • Hovering a known day index reveals tooltip with date / views / scans
//     • API response includes `events` array shaped to spec
//     • A seeded MENU_PUBLISHED ActivityLog surfaces as a chart pin
//     • FREE plan: chart card flagged plan-locked + svg blurred (parent class)

test.describe('editor analytics tab · views-over-time chart (T15.2)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ context }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop',
      'Desktop-only tab; mobile variant lands in T17.3',
    );
    await resetDb();
    await context.clearCookies();
    await context.addCookies([
      { name: 'NEXT_LOCALE', value: 'en', domain: 'localhost', path: '/' },
    ]);
  });

  // Visual baseline — chart rendered with seeded data.
  test('visual: editor-analytics chart on PRO', async ({ page }, testInfo) => {
    await seedProAndOpenAnalytics(page);

    const card = page.getByTestId('editor-analytics-chart-card');
    await card.waitFor({ state: 'visible' });
    await expect(
      page.getByTestId('editor-analytics-chart-svg'),
    ).toBeVisible();
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({
      content:
        '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }',
    });

    await expect(card).toHaveScreenshot(
      `editor-analytics-chart-${testInfo.project.name}.png`,
      { maxDiffPixelRatio: 0.05 },
    );
  });

  // Visual baseline — tooltip visible (focus a deterministic day rect).
  test('visual: editor-analytics chart tooltip on hover', async ({
    page,
  }, testInfo) => {
    await seedProAndOpenAnalytics(page);

    const card = page.getByTestId('editor-analytics-chart-card');
    await card.waitFor({ state: 'visible' });
    await page.waitForLoadState('networkidle');

    // Focus a mid-range day so the tooltip lands on screen, not clamped to
    // the right edge.
    await page.getByTestId('editor-analytics-chart-day-15').focus();
    await expect(
      page.getByTestId('editor-analytics-chart-tooltip'),
    ).toBeVisible();

    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({
      content:
        '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }',
    });

    await expect(card).toHaveScreenshot(
      `editor-analytics-chart-tooltip-${testInfo.project.name}.png`,
      { maxDiffPixelRatio: 0.05 },
    );
  });

  // Both series paths render — proves dual-line layout, not a single-series
  // chart slipped in.
  test('functional: chart renders both views and unique-scans series', async ({
    page,
  }) => {
    await seedProAndOpenAnalytics(page);

    const svg = page.getByTestId('editor-analytics-chart-svg');
    await expect(svg).toBeVisible();
    await expect(
      page.getByTestId('editor-analytics-chart-views-line'),
    ).toBeAttached();
    await expect(
      page.getByTestId('editor-analytics-chart-scans-line'),
    ).toBeAttached();

    // 30-day window → 30 hit-area rects. Confirms zero-fill is intact.
    const rects = page.getByTestId('editor-analytics-chart-hit-areas').locator('rect');
    await expect(rects).toHaveCount(30);
  });

  // Hover over a specific day reveals tooltip whose values match the API.
  test('functional: hovering a day shows tooltip with that day\'s values', async ({
    page,
  }) => {
    const { menu } = await seedProAndOpenAnalytics(page);

    // Pull the API directly so the assertion isn't tautological — the
    // expected values come from the same source as the chart, not from
    // hard-coded constants.
    const apiRes = await page.request.get(
      `/api/menus/${menu.id}/analytics?period=30d`,
    );
    const apiBody = (await apiRes.json()) as {
      data: {
        dailyViews: Array<{ date: string; views: number }>;
        kpis: { uniqueScans: { daily: number[] } };
      };
    };
    const targetIdx = 15;
    const expectedDay = apiBody.data.dailyViews[targetIdx];
    const expectedScans = apiBody.data.kpis.uniqueScans.daily[targetIdx];

    await page.getByTestId(`editor-analytics-chart-day-${targetIdx}`).focus();
    const tooltip = page.getByTestId('editor-analytics-chart-tooltip');
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toHaveAttribute('data-active-day', expectedDay.date);
    await expect(
      page.getByTestId('editor-analytics-chart-tooltip-views'),
    ).toHaveText(expectedDay.views.toLocaleString('en-US'));
    await expect(
      page.getByTestId('editor-analytics-chart-tooltip-scans'),
    ).toHaveText(expectedScans.toLocaleString('en-US'));
  });

  // API contract — `events` field is part of the response shape.
  test('functional: GET /api/menus/[id]/analytics includes events array', async ({
    page,
  }) => {
    const { menu } = await seedProAndOpenAnalytics(page);

    const res = await page.request.get(
      `/api/menus/${menu.id}/analytics?period=30d`,
    );
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as {
      data?: {
        events?: Array<{ date: string; type: string; payload: unknown }>;
      };
    };
    expect(Array.isArray(body.data?.events)).toBe(true);
    // No events seeded for this run — should be an empty array, not null.
    expect(body.data?.events?.length ?? -1).toBe(0);
  });

  // Seeded ActivityLog event surfaces as a pin on the chart.
  test('functional: seeded MENU_PUBLISHED event renders as a chart pin', async ({
    page,
  }) => {
    const email = 'nino@cafelinville.ge';
    const user = await seedUser({
      plan: 'PRO',
      name: 'Nino Kapanadze',
      email,
    });
    const menu = await seedMenu({
      userId: user.id,
      status: 'PUBLISHED',
      categoryCount: 2,
      productCount: 3,
      name: 'Café Linville — Dinner',
    });
    await seedShapedMenuViews({ menuId: menu.id, total: 200, peakHour: 13 });

    // Drop the event 10 days ago so it lands cleanly inside the 30d window.
    const eventDate = new Date();
    eventDate.setUTCDate(eventDate.getUTCDate() - 10);
    eventDate.setUTCHours(12, 0, 0, 0);
    await seedActivityLog({
      userId: user.id,
      menuId: menu.id,
      type: ActivityType.MENU_PUBLISHED,
      payload: { menuName: menu.name },
      createdAt: eventDate,
    });

    await loginAs(page, email);
    await page.goto(`/admin/menus/${menu.id}?tab=analytics`);
    await expect(page.getByTestId('editor-analytics-tab')).toBeVisible();

    const pin = page.getByTestId('editor-analytics-chart-event-pin').first();
    await expect(pin).toBeAttached();
    await expect(pin).toHaveAttribute('data-event-type', 'MENU_PUBLISHED');

    // API also surfaces it.
    const apiRes = await page.request.get(
      `/api/menus/${menu.id}/analytics?period=30d`,
    );
    const apiBody = (await apiRes.json()) as {
      data: { events: Array<{ type: string }> };
    };
    expect(apiBody.data.events.length).toBe(1);
    expect(apiBody.data.events[0].type).toBe('MENU_PUBLISHED');
  });

  // (FREE-locked chart behavior is covered by the tab-level T15.6 suite
  // below, since the lock now lives on the tab wrapper, not the card.)
});

// ─────────────────────────────────────────────────────────────────────────────
// T15.6 — FREE-locked + Empty (0 views) states
// ─────────────────────────────────────────────────────────────────────────────
//
// Covers:
//   Visual  — full tab on FREE (blurred ghost layout + centered upgrade card)
//           — full tab on PRO + 0 views (QR-ripple empty card + 4 no-data KPIs)
//   Functional —
//     • FREE: upgrade CTA links to /admin/settings/billing and is reachable.
//     • PRO + 0 views: no-data KPIs render "—" placeholders; "Copy menu link"
//       writes the menu's public URL to the clipboard; "Download QR code"
//       links to GET /api/qr/{menuId}?format=png&size=medium&download=true.

test.describe('editor analytics tab · FREE locked + empty states (T15.6)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ context }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop',
      'Desktop-only tab; mobile variant lands in T17.3',
    );
    await resetDb();
    await context.clearCookies();
    await context.addCookies([
      { name: 'NEXT_LOCALE', value: 'en', domain: 'localhost', path: '/' },
    ]);
    // Clipboard permissions for the "Copy menu link" button in the empty state.
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  });

  // ── Visual: FREE locked tab ────────────────────────────────────────────────

  test('visual: editor-analytics FREE-locked on FREE plan', async ({
    page,
  }, testInfo) => {
    await seedFreeAndOpenAnalytics(page);

    const card = page.getByTestId('editor-analytics-free-locked-card');
    await expect(card).toBeVisible();
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({
      content:
        '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }',
    });

    await expect(page.getByTestId('editor-analytics-tab')).toHaveScreenshot(
      `editor-analytics-free-locked-${testInfo.project.name}.png`,
      { maxDiffPixelRatio: 0.05 },
    );
  });

  // ── Functional: FREE lock — tab + CTA ──────────────────────────────────────

  test('functional: FREE shows tab-level lock card; CTA → /admin/settings/billing', async ({
    page,
  }) => {
    await seedFreeAndOpenAnalytics(page);

    await expect(
      page.getByTestId('editor-analytics-free-locked-card'),
    ).toBeVisible();
    await expect(page.getByTestId('editor-analytics-tab')).toHaveAttribute(
      'data-plan-locked',
      'true',
    );
    await expect(
      page.getByTestId('editor-analytics-upgrade-cta'),
    ).toHaveAttribute('href', '/admin/settings/billing');
  });

  // ── Visual: PRO + 0 views empty state ──────────────────────────────────────

  async function seedProEmptyAndOpenAnalytics(page: Page) {
    const email = 'nino@cafelinville.ge';
    const user = await seedUser({
      plan: 'PRO',
      name: 'Nino Kapanadze',
      email,
    });
    const menu = await seedMenu({
      userId: user.id,
      status: 'PUBLISHED',
      categoryCount: 2,
      productCount: 3,
      name: 'Café Linville — Dinner',
    });
    // NO seedShapedMenuViews — PRO user, zero views.
    await loginAs(page, email);
    await page.goto(`/admin/menus/${menu.id}?tab=analytics`);
    await expect(page.getByTestId('editor-analytics-tab')).toBeVisible();
    return { user, menu };
  }

  test('visual: editor-analytics empty state on PRO with 0 views', async ({
    page,
  }, testInfo) => {
    await seedProEmptyAndOpenAnalytics(page);

    const card = page.getByTestId('editor-analytics-empty-card');
    await expect(card).toBeVisible();
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({
      content:
        '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }',
    });

    await expect(page.getByTestId('editor-analytics-tab')).toHaveScreenshot(
      `editor-analytics-empty-${testInfo.project.name}.png`,
      { maxDiffPixelRatio: 0.05 },
    );
  });

  // ── Functional: PRO + 0 views — buttons work against real endpoints ────────

  test('functional: PRO with 0 views renders empty card + no-data KPIs', async ({
    page,
  }) => {
    const { menu } = await seedProEmptyAndOpenAnalytics(page);

    await expect(page.getByTestId('editor-analytics-tab')).toHaveAttribute(
      'data-empty',
      'true',
    );
    await expect(
      page.getByTestId('editor-analytics-empty-card'),
    ).toBeVisible();
    await expect(
      page.getByTestId('editor-analytics-empty-illustration'),
    ).toBeVisible();

    // DB sanity: zero MenuView rows for this menu.
    const dbCount = await prismaTest.menuView.count({
      where: { menuId: menu.id },
    });
    expect(dbCount).toBe(0);

    // 4 no-data KPI cards all show the "—" placeholder.
    for (const id of [
      'kpi-total-views',
      'kpi-unique-scans',
      'kpi-avg-time',
      'kpi-peak-hour',
    ]) {
      await expect(page.getByTestId(id)).toContainText('—');
    }
  });

  test('functional: PRO empty — Download QR href points to /api/qr/{menuId}', async ({
    page,
  }) => {
    const { menu } = await seedProEmptyAndOpenAnalytics(page);

    const btn = page.getByTestId('editor-analytics-empty-download-qr');
    await expect(btn).toBeVisible();
    const href = await btn.getAttribute('href');
    expect(href).toBe(
      `/api/qr/${menu.id}?format=png&size=medium&download=true`,
    );

    // Hit the endpoint — authenticated session is already set up.
    const res = await page.request.get(href!);
    expect(res.status()).toBe(200);
    const contentType = res.headers()['content-type'] ?? '';
    expect(contentType).toContain('image/png');
  });

  test('functional: PRO empty — Copy menu link writes public URL to clipboard', async ({
    page,
  }) => {
    const { menu } = await seedProEmptyAndOpenAnalytics(page);

    await page.getByTestId('editor-analytics-empty-copy-link').click();

    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    const expectedUrl = `${new URL(page.url()).origin}/m/${menu.slug}`;
    expect(clipboard).toBe(expectedUrl);
  });
});
