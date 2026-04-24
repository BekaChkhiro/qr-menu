// Test for T13.5 Editor — Branding Tab.
// Run:     pnpm test:e2e tests/e2e/admin/editor-branding.spec.ts
// Update:  pnpm test:e2e:update tests/e2e/admin/editor-branding.spec.ts
//
// Covers:
//   Visual  — /admin/menus/[id]?tab=branding on STARTER (form visible) and
//             on FREE (form blurred behind locked overlay with upgrade CTA).
//   Functional — picking a swatch PUTs /api/menus/[id] with the new
//             `primaryColor`; dragging the corner-radius slider commits the
//             new value to the DB; changing the font family writes both
//             `headingFont` and `bodyFont`; FREE plan cannot interact with
//             swatches and the upgrade CTA links to /admin/settings/billing.

import { expect, test, type Page } from '@playwright/test';

import { loginAs } from '../fixtures/auth';
import { prismaTest, resetDb, seedMenu, seedUser } from '../fixtures/seed';

async function seedStarterAndOpenBranding(page: Page) {
  const email = 'nino@cafelinville.ge';
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
    name: 'Café Linville — Dinner',
  });
  await loginAs(page, email);
  await page.goto(`/admin/menus/${menu.id}?tab=branding`);
  await expect(page.getByTestId('editor-branding-tab')).toBeVisible();
  return { user, menu };
}

async function seedFreeAndOpenBranding(page: Page) {
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
  await page.goto(`/admin/menus/${menu.id}?tab=branding`);
  await expect(page.getByTestId('editor-branding-tab')).toBeVisible();
  return { user, menu };
}

test.describe('editor branding tab (T13.5)', () => {
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

  // ── Visual: STARTER (form available) ──────────────────────────────────────

  test('visual: editor-branding on STARTER', async ({ page }, testInfo) => {
    await seedStarterAndOpenBranding(page);
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({
      content:
        '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }',
    });

    const shell = page.getByTestId('editor-shell');
    await expect(shell).toBeVisible();
    await expect(page.getByTestId('editor-branding-tab')).toBeVisible();
    await expect(
      page.getByTestId('editor-branding-tab').getByTestId('branding-radius-slider'),
    ).toBeVisible();

    await expect(shell).toHaveScreenshot(
      `editor-branding-${testInfo.project.name}.png`,
      { maxDiffPixelRatio: 0.05 },
    );
  });

  // ── Visual: FREE (locked overlay) ─────────────────────────────────────────

  test('visual: editor-branding on FREE shows locked overlay', async ({
    page,
  }, testInfo) => {
    await seedFreeAndOpenBranding(page);
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({
      content:
        '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }',
    });

    const shell = page.getByTestId('editor-shell');
    await expect(shell).toBeVisible();
    await expect(page.getByTestId('branding-locked-overlay')).toBeVisible();

    await expect(shell).toHaveScreenshot(
      `editor-branding-free-locked-${testInfo.project.name}.png`,
      { maxDiffPixelRatio: 0.05 },
    );
  });

  // ── Functional: STARTER can change primary color via swatch ───────────────

  test('functional: STARTER picks a swatch → PUT /api/menus and DB updates', async ({
    page,
  }) => {
    const { menu } = await seedStarterAndOpenBranding(page);

    const putResponse = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/menus/${menu.id}`) &&
        response.request().method() === 'PUT' &&
        response.ok(),
    );

    // #3F7E3F is the third swatch (green) — avoids matching the default.
    await page.getByTestId('branding-swatch-3f7e3f').click();

    const res = await putResponse;
    const body = (await res.json()) as {
      data?: { primaryColor: string | null };
    };
    expect(body.data?.primaryColor?.toLowerCase()).toBe('#3f7e3f');

    // Swatch is now the selected one (2px dark border).
    await expect(page.getByTestId('branding-swatch-3f7e3f')).toHaveAttribute(
      'aria-checked',
      'true',
    );

    // Database is source of truth.
    const row = await prismaTest.menu.findFirst({
      where: { id: menu.id },
      select: { primaryColor: true },
    });
    expect(row?.primaryColor?.toLowerCase()).toBe('#3f7e3f');
  });

  // ── Functional: STARTER can adjust corner radius ──────────────────────────

  test('functional: STARTER commits slider value → DB has new cornerRadius', async ({
    page,
  }) => {
    const { menu } = await seedStarterAndOpenBranding(page);

    const slider = page
      .getByTestId('branding-radius-slider')
      .getByRole('slider');
    await slider.focus();

    const putResponse = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/menus/${menu.id}`) &&
        response.request().method() === 'PUT' &&
        response.ok(),
    );

    // Keyboard ArrowRight moves by step=1 and fires onValueCommit
    // synchronously on key release in Radix Slider.
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');

    const res = await putResponse;
    const body = (await res.json()) as { data?: { cornerRadius: number } };
    expect(body.data?.cornerRadius).toBeGreaterThanOrEqual(13);

    // UI caption reflects new value.
    await expect(page.getByTestId('branding-radius-value')).toHaveText(
      /1[3-6]px/,
    );

    const row = await prismaTest.menu.findFirst({
      where: { id: menu.id },
      select: { cornerRadius: true },
    });
    expect(row?.cornerRadius).toBeGreaterThanOrEqual(13);
  });

  // ── Functional: STARTER can change font family ────────────────────────────

  test('functional: STARTER changes font → headingFont + bodyFont persist', async ({
    page,
  }) => {
    const { menu } = await seedStarterAndOpenBranding(page);

    const putResponse = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/menus/${menu.id}`) &&
        response.request().method() === 'PUT' &&
        response.ok(),
    );

    await page.getByTestId('branding-font-select').click();
    // Select "Playfair Display" option.
    await page.getByRole('option', { name: /Playfair Display/ }).click();

    const res = await putResponse;
    const body = (await res.json()) as {
      data?: { headingFont: string | null; bodyFont: string | null };
    };
    expect(body.data?.headingFont).toBe('Playfair Display');
    expect(body.data?.bodyFont).toBe('Playfair Display');

    const row = await prismaTest.menu.findFirst({
      where: { id: menu.id },
      select: { headingFont: true, bodyFont: true },
    });
    expect(row?.headingFont).toBe('Playfair Display');
    expect(row?.bodyFont).toBe('Playfair Display');
  });

  // ── Functional: FREE cannot edit; CTA links to billing ────────────────────

  test('functional: FREE cannot change color; upgrade CTA links to billing', async ({
    page,
  }) => {
    const { menu } = await seedFreeAndOpenBranding(page);

    // Locked overlay is visible.
    const overlay = page.getByTestId('branding-locked-overlay');
    await expect(overlay).toBeVisible();

    // Form behind the overlay is unreachable (pointer-events: none on parent
    // wrapper). Trying to click a swatch should NOT trigger a PUT.
    const requests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes(`/api/menus/${menu.id}`) && req.method() === 'PUT') {
        requests.push(req.url());
      }
    });

    // Force-click to bypass pointer-events intercept check — this simulates a
    // determined user trying to interact. The wrapper sets pointer-events:none
    // which causes the click to land on the overlay instead.
    await page
      .getByTestId('branding-swatch-3f7e3f')
      .click({ force: true })
      .catch(() => {
        /* intercepted by overlay — expected */
      });

    // Give any in-flight mutation a moment to surface.
    await page.waitForTimeout(300);
    expect(requests).toHaveLength(0);

    // DB unchanged (primaryColor is still the schema default or null).
    const row = await prismaTest.menu.findFirst({
      where: { id: menu.id },
      select: { primaryColor: true },
    });
    expect(row?.primaryColor).not.toBe('#3F7E3F');

    // Upgrade CTA navigates to the billing page.
    await expect(page.getByTestId('branding-upgrade-cta')).toHaveAttribute(
      'href',
      '/admin/settings/billing',
    );
  });

  // ── Functional: hex input commits on Enter ────────────────────────────────

  test('functional: STARTER typing hex and pressing Enter commits color', async ({
    page,
  }) => {
    const { menu } = await seedStarterAndOpenBranding(page);

    const hexInput = page.getByTestId('branding-hex-input');
    await hexInput.click();
    await hexInput.fill('7A5A8C');

    const putResponse = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/menus/${menu.id}`) &&
        response.request().method() === 'PUT' &&
        response.ok(),
    );

    await page.keyboard.press('Enter');

    const res = await putResponse;
    const body = (await res.json()) as { data?: { primaryColor: string | null } };
    expect(body.data?.primaryColor?.toLowerCase()).toBe('#7a5a8c');

    const row = await prismaTest.menu.findFirst({
      where: { id: menu.id },
      select: { primaryColor: true },
    });
    expect(row?.primaryColor?.toLowerCase()).toBe('#7a5a8c');
  });
});
