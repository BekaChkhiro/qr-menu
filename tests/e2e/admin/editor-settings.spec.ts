// Test for T15.13 Editor — Menu Settings Tab · URL + Visibility.
// Run:     pnpm test:e2e tests/e2e/admin/editor-settings.spec.ts
// Update:  pnpm test:e2e:update tests/e2e/admin/editor-settings.spec.ts
//
// Covers:
//   Visual     — /admin/menus/[id]?tab=settings with the new URL + Visibility
//                section above the legacy MenuSettingsForm.
//   Functional —
//     - editing the slug and clicking Save PATCHes /api/menus/{id}, the public
//       menu page now resolves at the new slug;
//     - picking "Private draft" flips status → DRAFT, the public page returns
//       404 (Menu not available) and the admin UI reflects the change;
//     - picking "Password protected" + entering a password persists a bcrypt
//       hash and the public page shows the password gate;
//     - verifying the gate via POST /api/menus/public/{slug}/verify-password
//       sets an HMAC-signed cookie that lets the menu render;
//     - the Copy URL button writes `${origin}/m/{slug}` to the clipboard.
//
// The functional coverage exercises the whole admin → API → public flow so a
// change in any layer fails at least one assertion.

import { expect, test, type Page } from '@playwright/test';

import { loginAs } from '../fixtures/auth';
import { prismaTest, resetDb, seedMenu, seedUser } from '../fixtures/seed';

const SLUG_BASE = `linville-t1513`;

async function seedAndOpenSettings(page: Page) {
  const email = 'nino-settings@cafelinville.ge';
  const user = await seedUser({
    plan: 'STARTER',
    name: 'Nino Kapanadze',
    email,
  });
  // Start PUBLISHED so the initial visibility radio is "Published".
  const menu = await seedMenu({
    userId: user.id,
    status: 'PUBLISHED',
    categoryCount: 2,
    productCount: 3,
    name: 'Café Linville — Dinner',
    slug: SLUG_BASE,
  });
  await loginAs(page, email);
  await page.goto(`/admin/menus/${menu.id}?tab=settings`);
  await expect(page.getByTestId('settings-url-visibility')).toBeVisible();
  return { user, menu };
}

test.describe('editor settings tab · URL + Visibility (T15.13)', () => {
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
    // Allow clipboard access for the Copy URL assertion.
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  });

  // ── Visual ─────────────────────────────────────────────────────────────────

  test('visual: editor-settings-url-visibility', async ({ page }) => {
    await seedAndOpenSettings(page);
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({
      content:
        '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }',
    });

    const section = page.getByTestId('settings-url-visibility');
    await expect(section).toBeVisible();
    await expect(section).toHaveAttribute('data-visibility', 'PUBLISHED');
    await expect(
      page.getByTestId('settings-visibility-published'),
    ).toHaveAttribute('data-selected', 'true');

    await expect(section).toHaveScreenshot(
      'editor-settings-url-visibility-desktop.png',
      { maxDiffPixelRatio: 0.05 },
    );
  });

  // ── Functional: slug save ─────────────────────────────────────────────────

  test('functional: editing the slug + Save updates the public URL', async ({
    page,
  }) => {
    const { menu } = await seedAndOpenSettings(page);

    const slugInput = page.getByTestId('settings-url-slug');
    await expect(slugInput).toHaveValue(SLUG_BASE);

    const newSlug = `${SLUG_BASE}-new`;
    await slugInput.fill(newSlug);

    // Warning banner flips to role="alert" while dirty.
    await expect(page.getByTestId('settings-url-warning')).toHaveAttribute(
      'role',
      'alert',
    );

    const [putResp] = await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes(`/api/menus/${menu.id}`) && r.request().method() === 'PUT',
      ),
      page.getByTestId('settings-url-visibility-save').click(),
    ]);
    expect(putResp.ok()).toBeTruthy();

    // DB reflects the new slug.
    const row = await prismaTest.menu.findUnique({ where: { id: menu.id } });
    expect(row?.slug).toBe(newSlug);

    // Old slug 404s; new slug returns the menu.
    const oldRes = await page.request.get(`/m/${SLUG_BASE}`);
    expect(oldRes.status()).toBe(404);
    const newRes = await page.request.get(`/m/${newSlug}`);
    expect(newRes.status()).toBe(200);
  });

  // ── Functional: Private draft ──────────────────────────────────────────────

  test('functional: "Private draft" sets status=DRAFT + 404s the public page', async ({
    page,
  }) => {
    const { menu } = await seedAndOpenSettings(page);

    await page.getByTestId('settings-visibility-draft').click();
    await expect(page.getByTestId('settings-url-visibility')).toHaveAttribute(
      'data-visibility',
      'PRIVATE_DRAFT',
    );

    const [putResp] = await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes(`/api/menus/${menu.id}`) && r.request().method() === 'PUT',
      ),
      page.getByTestId('settings-url-visibility-save').click(),
    ]);
    expect(putResp.ok()).toBeTruthy();

    const row = await prismaTest.menu.findUnique({ where: { id: menu.id } });
    expect(row?.status).toBe('DRAFT');
    expect(row?.passwordHash).toBeNull();

    // Public page 404s when draft; preview query still works for owners.
    const publicRes = await page.request.get(`/m/${menu.slug}`);
    expect(publicRes.status()).toBe(404);
  });

  // ── Functional: Password protected end-to-end ─────────────────────────────

  test('functional: "Password protected" hashes + gates + verify unlocks', async ({
    page,
    context,
  }) => {
    const { menu } = await seedAndOpenSettings(page);

    const secret = 'linville-2026';

    await page.getByTestId('settings-visibility-password').click();
    await expect(page.getByTestId('settings-url-visibility')).toHaveAttribute(
      'data-visibility',
      'PASSWORD_PROTECTED',
    );

    const pwInput = page.getByTestId('settings-vis-password-input');
    await pwInput.fill(secret);

    const [putResp] = await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes(`/api/menus/${menu.id}`) && r.request().method() === 'PUT',
      ),
      page.getByTestId('settings-url-visibility-save').click(),
    ]);
    expect(putResp.ok()).toBeTruthy();

    // Saved: hash written, status stays PUBLISHED.
    const saved = await prismaTest.menu.findUnique({
      where: { id: menu.id },
    });
    expect(saved?.status).toBe('PUBLISHED');
    expect(saved?.passwordHash).toBeTruthy();
    // Response must NOT leak the hash.
    const putBody = await putResp.json();
    expect(putBody.data).not.toHaveProperty('passwordHash');
    expect(putBody.data.hasPassword).toBe(true);

    // The admin form re-renders with the "already set" hint.
    await expect(
      page.getByTestId('settings-vis-password-hint'),
    ).toBeVisible();

    // Public page now shows the gate, not the menu.
    await context.clearCookies();
    await page.goto(`/m/${menu.slug}`);
    await expect(page.getByTestId('menu-password-gate')).toBeVisible();

    // Wrong password rejected.
    const bad = await page.request.post(
      `/api/menus/public/${menu.slug}/verify-password`,
      { data: { password: 'nope' } },
    );
    expect(bad.status()).toBe(403);

    // Correct password returns 200 + sets the signed cookie.
    const ok = await page.request.post(
      `/api/menus/public/${menu.slug}/verify-password`,
      { data: { password: secret } },
    );
    expect(ok.ok()).toBeTruthy();

    const cookies = await context.cookies();
    const passCookie = cookies.find((c) => c.name === `menu-pass-${menu.id}`);
    expect(passCookie?.value ?? '').toMatch(
      new RegExp(`^${menu.id}\\.\\d+\\.[a-f0-9]{64}$`),
    );

    // Reload the public page with the cookie in place → menu renders.
    await page.goto(`/m/${menu.slug}`);
    await expect(page.getByTestId('menu-password-gate')).toHaveCount(0);
  });

  // ── Functional: Copy URL ──────────────────────────────────────────────────

  test('functional: Copy URL writes the public URL to the clipboard', async ({
    page,
  }) => {
    const { menu } = await seedAndOpenSettings(page);
    await page.getByTestId('settings-url-copy').click();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    // Full origin-qualified URL, with menu slug.
    expect(copied).toMatch(
      new RegExp(`^https?://[^/]+/m/${menu.slug}$`),
    );
  });
});
