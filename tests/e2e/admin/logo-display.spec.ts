// T21.4 — Logo size, centering & display controls.
//
// Run:     pnpm test:e2e tests/e2e/admin/logo-display.spec.ts
// Update:  pnpm test:e2e:update tests/e2e/admin/logo-display.spec.ts
//
// Covers the fix for T21.4: operators can now control logo Size (SMALL /
// MEDIUM / LARGE) and Alignment (LEFT / CENTER / RIGHT) from the Branding tab,
// and the public menu header respects both.
//
// Visual:    `branding-logo-controls.png` — Branding tab on STARTER showing
//            the new segmented controls under the logo uploader.
// Functional: set Size=LARGE + Alignment=CENTER → the public menu logo
//            renders at ≥ 128px height and its parent row is `justify-center`.
//
// **No `resetDb()`** — additive: seeds a unique-email STARTER user with one
// published menu (+ a Cloudinary demo logo), deletes the user (cascading
// the menu) in afterAll.

import { expect, test } from '@playwright/test';

import { invalidateMenuCache } from '@/lib/cache/redis';
import { loginAs } from '../fixtures/auth';
import { prismaTest, seedMenu, seedUser } from '../fixtures/seed';

const RUN_ID = `t21-4-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const EMAIL = `${RUN_ID}@test.local`;
const LOGO_URL =
  'https://res.cloudinary.com/demo/image/upload/w_400,h_400/sample.png';

let userId = '';
let menuId = '';
let menuSlug = '';

test.describe('branding tab · logo size + alignment (T21.4)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    const user = await seedUser({
      plan: 'STARTER',
      email: EMAIL,
      name: `T21.4 Run ${RUN_ID}`,
    });
    userId = user.id;

    const menu = await seedMenu({
      userId: user.id,
      status: 'PUBLISHED',
      categoryCount: 1,
      productCount: 1,
      name: `T21.4 Menu ${RUN_ID}`,
      slug: `t21-4-${RUN_ID}`,
    });
    menuId = menu.id;
    menuSlug = menu.slug;

    // Branding-tab logo controls only make sense once a logo exists; seed one.
    await prismaTest.menu.update({
      where: { id: menuId },
      data: { logoUrl: LOGO_URL },
    });
  });

  test.afterAll(async () => {
    if (userId) {
      await prismaTest.user.delete({ where: { id: userId } }).catch(() => {});
    }
  });

  test.beforeEach(async ({ page, context }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop',
      'Desktop-only — mobile variant covered by editor-mobile.spec.ts.',
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

  test('visual: branding tab shows logo size + alignment segmented controls', async ({
    page,
  }, testInfo) => {
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({
      content:
        '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }',
    });

    await expect(page.getByTestId('branding-logo-size')).toBeVisible();
    await expect(page.getByTestId('branding-logo-alignment')).toBeVisible();
    await expect(page.getByTestId('branding-logo-size-medium')).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await expect(
      page.getByTestId('branding-logo-alignment-center'),
    ).toHaveAttribute('aria-checked', 'true');

    const shell = page.getByTestId('editor-shell');
    await expect(shell).toHaveScreenshot(
      `branding-logo-controls-${testInfo.project.name}.png`,
      { maxDiffPixelRatio: 0.05 },
    );
  });

  // ── Functional: size LARGE persists via PUT ────────────────────────────────

  test('functional: picking size LARGE persists + public logo height ≥ 128px', async ({
    page,
  }) => {
    const putResponse = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/menus/${menuId}`) &&
        response.request().method() === 'PUT' &&
        response.ok(),
    );

    await page.getByTestId('branding-logo-size-large').click();

    const res = await putResponse;
    const body = (await res.json()) as {
      data?: { logoSize: 'SMALL' | 'MEDIUM' | 'LARGE' | null };
    };
    expect(body.data?.logoSize).toBe('LARGE');

    await expect(page.getByTestId('branding-logo-size-large')).toHaveAttribute(
      'aria-checked',
      'true',
    );

    const row = await prismaTest.menu.findFirst({
      where: { id: menuId },
      select: { logoSize: true },
    });
    expect(row?.logoSize).toBe('LARGE');

    // The seeded default for alignment is CENTER — assert both took effect on
    // the public menu in a single navigation.
    await invalidateMenuCache(menuId, menuSlug);
    await page.goto(`/m/${menuSlug}`);

    const logoRow = page.getByTestId('public-menu-logo-row');
    await expect(logoRow).toBeVisible();
    await expect(logoRow).toHaveCSS('justify-content', 'center');

    const logo = page.getByTestId('public-menu-logo');
    await expect(logo).toBeVisible();
    const logoHeight = await logo.evaluate(
      (el) => (el as HTMLImageElement).getBoundingClientRect().height,
    );
    expect(logoHeight).toBeGreaterThanOrEqual(128);
  });

  // ── Functional: alignment LEFT persists + public row becomes flex-start ───

  test('functional: picking alignment LEFT persists + public row is flex-start', async ({
    page,
  }) => {
    // Reset to known baseline so this test can run independently of order.
    await prismaTest.menu.update({
      where: { id: menuId },
      data: { logoAlignment: 'CENTER' },
    });
    await page.reload();

    const putResponse = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/menus/${menuId}`) &&
        response.request().method() === 'PUT' &&
        response.ok(),
    );

    await page.getByTestId('branding-logo-alignment-left').click();

    const res = await putResponse;
    const body = (await res.json()) as {
      data?: { logoAlignment: 'LEFT' | 'CENTER' | 'RIGHT' | null };
    };
    expect(body.data?.logoAlignment).toBe('LEFT');

    await expect(
      page.getByTestId('branding-logo-alignment-left'),
    ).toHaveAttribute('aria-checked', 'true');

    const row = await prismaTest.menu.findFirst({
      where: { id: menuId },
      select: { logoAlignment: true },
    });
    expect(row?.logoAlignment).toBe('LEFT');

    await invalidateMenuCache(menuId, menuSlug);
    await page.goto(`/m/${menuSlug}`);
    const logoRow = page.getByTestId('public-menu-logo-row');
    await expect(logoRow).toBeVisible();
    await expect(logoRow).toHaveCSS('justify-content', 'flex-start');
  });
});
