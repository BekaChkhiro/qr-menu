// T21.1 — Admin Panel Language Persistence.
//
// Run:    pnpm test:e2e tests/e2e/admin/locale-persistence.spec.ts
//
// Bug: switching language on the public menu (/m/[slug]) used to also flip
// the admin panel because both surfaces shared one NEXT_LOCALE cookie.
//
// Fix: an authenticated user's choice persists to User.locale and that DB
// value takes precedence over the cookie when the admin renders. A visitor-
// style switch on /m/[slug] still mutates the cookie but never touches the
// authenticated user's stored preference.

import { expect, test } from '@playwright/test';

import { loginAs } from '../fixtures/auth';
import { prismaTest, seedMenu, seedUser } from '../fixtures/seed';

test.describe('T21.1 admin locale persistence', () => {
  test.describe.configure({ mode: 'serial' });

  test('user.locale survives a visitor-style switch on the public menu', async ({
    page,
    context,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop',
      'Persistence flow exercises the admin sidebar which is desktop-only.',
    );

    // ── seed ──────────────────────────────────────────────────────────────
    const email = `locale-persist-${Date.now()}@test.local`;
    const user = await seedUser({ email, plan: 'FREE', name: 'Nino Kapanadze' });
    expect(user.locale).toBeNull();

    const menu = await seedMenu({
      userId: user.id,
      status: 'PUBLISHED',
      categoryCount: 1,
      productCount: 1,
      name: 'Café Linville',
    });

    // Start from a clean cookie jar so we're not biased by a prior run.
    await context.clearCookies();

    await loginAs(page, email);

    // ── 1. admin renders in the default locale (Georgian) ─────────────────
    await page.goto('/admin/dashboard');
    await expect(page.getByTestId('admin-shell')).toBeVisible();
    await expect(page.getByTestId('sidebar-nav-dashboard')).toContainText('პანელი');

    // ── 2. switch the admin UI to English via the top-bar switcher ────────
    await page.getByTestId('topbar-language-switcher').click();
    await page.getByTestId('language-switcher-item-en').click();

    // Page refreshes; English sidebar label confirms next-intl picked up `en`.
    await expect(page.getByTestId('sidebar-nav-dashboard')).toContainText('Dashboard', {
      timeout: 10_000,
    });

    // Persistence: DB now reflects the choice.
    const afterAdminSwitch = await prismaTest.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { locale: true },
    });
    expect(afterAdminSwitch.locale).toBe('EN');

    // Cookie was updated too (used by visitor surfaces).
    const cookiesAfterAdmin = await context.cookies();
    expect(cookiesAfterAdmin.find((c) => c.name === 'NEXT_LOCALE')?.value).toBe('en');

    // ── 3. reload admin → still English (cached preference applies) ───────
    await page.goto('/admin/dashboard');
    await expect(page.getByTestId('sidebar-nav-dashboard')).toContainText('Dashboard');

    // ── 4. visit the public menu and switch it to Russian ─────────────────
    // The public menu only ships locales the operator enabled; force RU on so
    // the switcher renders all three options.
    await prismaTest.menu.update({
      where: { id: menu.id },
      data: { enabledLanguages: ['KA', 'EN', 'RU'] },
    });

    await page.goto(`/m/${menu.slug}`);
    await page.getByTestId('public-menu-language-switcher').click();
    await page.getByTestId('language-switcher-item-ru').click();

    // The visitor flow mutates only the cookie — not the authenticated user's
    // stored preference.
    await expect
      .poll(async () => {
        const cookies = await context.cookies();
        return cookies.find((c) => c.name === 'NEXT_LOCALE')?.value;
      }, { timeout: 5_000 })
      .toBe('ru');

    const afterPublicSwitch = await prismaTest.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { locale: true },
    });
    expect(afterPublicSwitch.locale).toBe('EN');

    // ── 5. return to admin → still English, NOT Russian ───────────────────
    await page.goto('/admin/dashboard');
    await expect(page.getByTestId('sidebar-nav-dashboard')).toContainText('Dashboard');
    // Sanity check: the Russian sidebar label must not have leaked in.
    await expect(page.getByTestId('sidebar-nav-dashboard')).not.toContainText('Панель');
  });
});
