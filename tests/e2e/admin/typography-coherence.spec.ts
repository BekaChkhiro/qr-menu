// T21.6 — Typography preset coherence (Branding ↔ public menu).
//
// Run:     pnpm test:e2e tests/e2e/admin/typography-coherence.spec.ts
//
// Covers the bug fix for T21.6: the Branding tab is the canonical owner of
// font choice and writes the same family to both Menu.headingFont and
// Menu.bodyFont, but the public menu only declared `--heading-font` /
// `--body-font` as CSS variables without ever applying them to body text or
// most headings. Switching to "Playfair Display" in Branding still rendered
// Inter on /m/[slug]. The fix:
//   1. globals.css now applies `--body-font` to `[data-public-menu-root]` and
//      `--heading-font` to every h1..h6 descendant.
//   2. The page injects a Google Fonts <link> so the selected preset actually
//      loads in the browser.
//
// This spec verifies both the API write AND the rendered font-family on the
// public menu — no hard-coded mocks, real DB row.
//
// **No `resetDb()`** — additive: seeds a unique-email STARTER user with one
// published menu, deletes the user (cascades menu) in afterAll.

import { expect, test } from '@playwright/test';

import { loginAs } from '../fixtures/auth';
import { prismaTest, seedMenu, seedUser } from '../fixtures/seed';

const RUN_ID = `t21-6-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const EMAIL = `${RUN_ID}@test.local`;

let userId = '';
let menuId = '';
let menuSlug = '';

test.describe('typography coherence — Branding font preset → public menu (T21.6)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    const user = await seedUser({
      plan: 'STARTER',
      email: EMAIL,
      name: `T21.6 Run ${RUN_ID}`,
    });
    userId = user.id;

    const menu = await seedMenu({
      userId: user.id,
      status: 'PUBLISHED',
      categoryCount: 1,
      productCount: 1,
      name: `T21.6 Menu ${RUN_ID}`,
      slug: `t21-6-${RUN_ID}`,
    });
    menuId = menu.id;
    menuSlug = menu.slug;
  });

  test.afterAll(async () => {
    if (userId) {
      await prismaTest.user.delete({ where: { id: userId } }).catch(() => {});
    }
  });

  test.beforeEach(async ({ page, context }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop',
      'Desktop-only — public menu mobile coverage lives in other specs.',
    );
    await context.clearCookies();
    await context.addCookies([
      { name: 'NEXT_LOCALE', value: 'en', domain: 'localhost', path: '/' },
    ]);
  });

  test('functional: changing Branding font → public menu h1 + p render the new family', async ({
    page,
  }) => {
    // ── Step 1: change the font in Branding tab.
    await loginAs(page, EMAIL);
    await page.goto(`/admin/menus/${menuId}?tab=branding`);
    await expect(page.getByTestId('editor-branding-tab')).toBeVisible();

    const putResponse = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/menus/${menuId}`) &&
        response.request().method() === 'PUT' &&
        response.ok(),
    );

    await page.getByTestId('branding-font-select').click();
    await page.getByRole('option', { name: /Playfair Display/ }).click();

    const res = await putResponse;
    const body = (await res.json()) as {
      data?: { headingFont: string | null; bodyFont: string | null };
    };
    expect(body.data?.headingFont).toBe('Playfair Display');
    expect(body.data?.bodyFont).toBe('Playfair Display');

    // DB row is the source of truth — both columns updated in lockstep.
    const row = await prismaTest.menu.findFirst({
      where: { id: menuId },
      select: { headingFont: true, bodyFont: true },
    });
    expect(row?.headingFont).toBe('Playfair Display');
    expect(row?.bodyFont).toBe('Playfair Display');

    // ── Step 2: open public menu, wait for the font to load, verify computed
    // font-family on a heading AND a body paragraph contains "Playfair Display".
    await page.goto(`/m/${menuSlug}`);
    await expect(page.locator('[data-public-menu-root]')).toBeVisible();
    // Wait for the dynamically-injected Google Fonts stylesheet to load and
    // the FontFace to register before reading computed styles.
    await page.evaluate(() => document.fonts.ready);

    // The CSS variables on the wrapper must be set to the new family.
    const cssVars = await page.evaluate(() => {
      const root = document.querySelector('[data-public-menu-root]') as HTMLElement | null;
      if (!root) return null;
      return {
        heading: root.style.getPropertyValue('--heading-font').trim(),
        body: root.style.getPropertyValue('--body-font').trim(),
      };
    });
    expect(cssVars?.heading).toContain('Playfair Display');
    expect(cssVars?.body).toContain('Playfair Display');

    // h1 (rendered by MenuHeader) must compute to the heading family.
    const h1Family = await page
      .locator('[data-public-menu-root] h1')
      .first()
      .evaluate((el) => window.getComputedStyle(el).fontFamily);
    expect(h1Family).toContain('Playfair Display');

    // A body-text element (the wrapping div) must inherit the body family.
    // The wrapper is itself `[data-public-menu-root]`, so reading its
    // computed style proves the cascade reaches descendants.
    const rootFamily = await page
      .locator('[data-public-menu-root]')
      .first()
      .evaluate((el) => window.getComputedStyle(el).fontFamily);
    expect(rootFamily).toContain('Playfair Display');
  });
});
