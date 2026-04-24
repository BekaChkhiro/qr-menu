// Tests for T11.7 Dashboard Activity Feed.
// Run:     pnpm test:e2e tests/e2e/admin/dashboard-activity.spec.ts
// Update:  pnpm test:e2e:update tests/e2e/admin/dashboard-activity.spec.ts
//
// Covers:
//   - Visual baseline with 6 varied activity events (newest first).
//   - Empty-state copy when there are no events.
//   - Functional: seeded events render in newest-first order with the
//     correct testids and messages.
//   - Functional: POSTing a product via /api/menus/:id/products surfaces
//     a fresh PRODUCT_CREATED event on the dashboard after refresh.

import { expect, test } from '@playwright/test';

import { loginAs } from '../fixtures/auth';
import {
  prismaTest,
  resetDb,
  seedActivityLog,
  seedMenu,
  seedUser,
} from '../fixtures/seed';

test.describe('admin dashboard activity feed (T11.7)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page, context }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop',
      'Desktop-only; mobile variant lands with T17.2',
    );
    await resetDb();
    await context.clearCookies();
    await context.addCookies([
      { name: 'NEXT_LOCALE', value: 'en', domain: 'localhost', path: '/' },
    ]);
  });

  async function stabilizeAnimations(
    page: import('@playwright/test').Page,
  ) {
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({
      content:
        '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }',
    });
  }

  // ── Visual ────────────────────────────────────────────────────────────────

  test('visual: activity feed with 6 varied events', async ({
    page,
  }, testInfo) => {
    const user = await seedUser({
      plan: 'STARTER',
      email: 'activity-visual@cafelinville.ge',
      name: 'Nino Kapanadze',
    });
    const menu = await seedMenu({
      userId: user.id,
      status: 'PUBLISHED',
      slug: 'cafe-activity-visual',
      name: 'Main menu — All day',
    });

    // Seed 6 events spaced across time so the relative-time column reads
    // as a stable progression: "2 minutes ago", "1 hour ago", etc.
    const now = Date.now();
    const MIN = 60_000;
    const HOUR = 60 * MIN;
    const DAY = 24 * HOUR;

    const seed = [
      {
        type: 'PRODUCT_CREATED' as const,
        payload: { productName: 'Cappuccino (oat)', categoryName: 'Drinks' },
        createdAt: new Date(now - 2 * MIN),
      },
      {
        type: 'MENU_PUBLISHED' as const,
        payload: { menuName: 'Main menu — All day' },
        createdAt: new Date(now - 1 * HOUR),
      },
      {
        type: 'PRICE_CHANGED' as const,
        payload: { productName: 'Khachapuri Adjaruli', oldPrice: 18, newPrice: 22 },
        createdAt: new Date(now - 5 * HOUR),
      },
      {
        type: 'PROMOTION_ENDED' as const,
        payload: { promotionName: 'Happy Hour' },
        createdAt: new Date(now - 2 * DAY),
      },
      {
        type: 'PROMOTION_STARTED' as const,
        payload: { promotionName: 'Autumn -15%' },
        createdAt: new Date(now - 3 * DAY),
      },
      {
        type: 'CATEGORY_CREATED' as const,
        payload: { categoryName: 'Seasonal' },
        createdAt: new Date(now - 4 * DAY),
      },
    ];

    for (const event of seed) {
      await seedActivityLog({
        userId: user.id,
        menuId: menu.id,
        type: event.type,
        payload: event.payload,
        createdAt: event.createdAt,
      });
    }

    await loginAs(page, 'activity-visual@cafelinville.ge');
    await page.goto('/admin/dashboard');
    await stabilizeAnimations(page);

    const feed = page.getByTestId('dashboard-activity-feed');
    await expect(feed).toBeVisible();
    await expect(page.getByTestId('dashboard-activity-row')).toHaveCount(6);

    // Mask the relative-time meta row so small clock skew (minutes vs hours
    // boundary) doesn't flake the diff.
    await expect(feed).toHaveScreenshot(
      `dashboard-activity-feed-${testInfo.project.name}.png`,
      {
        maxDiffPixelRatio: 0.05,
        mask: [feed.locator('[data-testid="dashboard-activity-row"] p + p')],
      },
    );
  });

  // ── Functional ────────────────────────────────────────────────────────────

  test('functional: empty state renders when there are no events', async ({
    page,
  }) => {
    await seedUser({
      plan: 'STARTER',
      email: 'activity-empty@cafelinville.ge',
      name: 'Nino Kapanadze',
    });

    await loginAs(page, 'activity-empty@cafelinville.ge');
    await page.goto('/admin/dashboard');

    const feed = page.getByTestId('dashboard-activity-feed');
    await expect(feed).toBeVisible();
    await expect(page.getByTestId('dashboard-activity-row')).toHaveCount(0);
    await expect(
      page.getByTestId('dashboard-activity-empty'),
    ).toBeVisible();
  });

  test('functional: seeded events render newest-first with correct types', async ({
    page,
  }) => {
    const user = await seedUser({
      plan: 'STARTER',
      email: 'activity-order@cafelinville.ge',
      name: 'Nino Kapanadze',
    });
    const menu = await seedMenu({
      userId: user.id,
      status: 'PUBLISHED',
      slug: 'cafe-activity-order',
      name: 'Main menu',
    });

    // Seed 3 events with explicit distinct timestamps. We expect the rendered
    // order to be newest → oldest.
    const now = Date.now();
    await seedActivityLog({
      userId: user.id,
      menuId: menu.id,
      type: 'CATEGORY_CREATED',
      payload: { categoryName: 'Oldest' },
      createdAt: new Date(now - 3 * 24 * 60 * 60 * 1000),
    });
    await seedActivityLog({
      userId: user.id,
      menuId: menu.id,
      type: 'MENU_PUBLISHED',
      payload: { menuName: 'Middle' },
      createdAt: new Date(now - 1 * 60 * 60 * 1000),
    });
    await seedActivityLog({
      userId: user.id,
      menuId: menu.id,
      type: 'PRODUCT_CREATED',
      payload: { productName: 'Newest', categoryName: 'Drinks' },
      createdAt: new Date(now - 2 * 60 * 1000),
    });

    await loginAs(page, 'activity-order@cafelinville.ge');
    await page.goto('/admin/dashboard');

    const rows = page.getByTestId('dashboard-activity-row');
    await expect(rows).toHaveCount(3);

    // Newest first.
    await expect(rows.nth(0)).toHaveAttribute(
      'data-activity-type',
      'PRODUCT_CREATED',
    );
    await expect(rows.nth(0)).toContainText('Newest');
    await expect(rows.nth(0)).toContainText('Drinks');

    await expect(rows.nth(1)).toHaveAttribute(
      'data-activity-type',
      'MENU_PUBLISHED',
    );
    await expect(rows.nth(1)).toContainText('Middle');

    await expect(rows.nth(2)).toHaveAttribute(
      'data-activity-type',
      'CATEGORY_CREATED',
    );
    await expect(rows.nth(2)).toContainText('Oldest');
  });

  test('functional: creating a product via API surfaces a PRODUCT_CREATED event', async ({
    page,
    request,
  }) => {
    const user = await seedUser({
      plan: 'STARTER',
      email: 'activity-new-product@cafelinville.ge',
      name: 'Nino Kapanadze',
    });
    const menu = await seedMenu({
      userId: user.id,
      status: 'DRAFT',
      slug: 'cafe-activity-new-product',
      name: 'Main menu',
      categoryCount: 1,
      productCount: 1,
    });

    await loginAs(page, 'activity-new-product@cafelinville.ge');

    // Resolve the seeded category id directly from the DB (seedMenu creates
    // them but doesn't return them).
    const category = await prismaTest.category.findFirst({
      where: { menuId: menu.id },
      select: { id: true },
    });
    expect(category).not.toBeNull();

    // Start with a clean slate — the dashboard shows empty state.
    await page.goto('/admin/dashboard');
    await expect(page.getByTestId('dashboard-activity-empty')).toBeVisible();

    // POST a new product. We use the page's request context so the logged-in
    // cookies authenticate the call.
    const createResponse = await request.post(
      `/api/menus/${menu.id}/products`,
      {
        data: {
          categoryId: category!.id,
          nameKa: 'ხაჭაპური აჭარული',
          nameEn: 'Khachapuri Adjaruli',
          price: 22,
        },
      },
    );
    expect(createResponse.ok()).toBeTruthy();

    // The activity log row landed in the DB.
    const logs = await prismaTest.activityLog.findMany({
      where: { userId: user.id, type: 'PRODUCT_CREATED' },
    });
    expect(logs).toHaveLength(1);
    expect(logs[0].payload).toMatchObject({
      productName: 'ხაჭაპური აჭარული',
    });

    // And it surfaces on the dashboard after refresh.
    await page.reload();
    const rows = page.getByTestId('dashboard-activity-row');
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toHaveAttribute(
      'data-activity-type',
      'PRODUCT_CREATED',
    );
    await expect(rows.first()).toContainText('ხაჭაპური აჭარული');
  });

  test('functional: /api/activity returns the user events newest-first', async ({
    page,
    request,
  }) => {
    const user = await seedUser({
      plan: 'STARTER',
      email: 'activity-api@cafelinville.ge',
      name: 'Nino Kapanadze',
    });
    const menu = await seedMenu({
      userId: user.id,
      status: 'PUBLISHED',
      slug: 'cafe-activity-api',
      name: 'Main menu',
    });

    const now = Date.now();
    for (let i = 0; i < 3; i++) {
      await seedActivityLog({
        userId: user.id,
        menuId: menu.id,
        type: 'PRODUCT_CREATED',
        payload: { productName: `Item ${i}`, categoryName: 'Drinks' },
        createdAt: new Date(now - (3 - i) * 60_000),
      });
    }

    await loginAs(page, 'activity-api@cafelinville.ge');
    const res = await request.get('/api/activity?limit=10');
    expect(res.ok()).toBeTruthy();

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(3);
    // Newest first → Item 2, Item 1, Item 0.
    expect(body.data[0].payload.productName).toBe('Item 2');
    expect(body.data[2].payload.productName).toBe('Item 0');
  });
});
