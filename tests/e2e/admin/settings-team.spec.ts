// Test for T16.5 Settings — Team Tab (locked on all plans).
// Run:     pnpm test:e2e tests/e2e/admin/settings-team.spec.ts
// Update:  pnpm test:e2e:update tests/e2e/admin/settings-team.spec.ts
//
// Covers the artboard `settings-team-locked` from
// `qr-menu-design/components/settings-artboards-b.jsx` lines 3–107.
//
//   Visual — blurred team-list preview behind a centered 460px upgrade card with
//            Users icon, title, body, 3 checkmark bullets, and primary CTA.
//   Functional — all plan tiers see the locked overlay; blurred preview is
//                non-interactive; Upgrade CTA navigates to /admin/settings/billing.

import { expect, test, type Page } from '@playwright/test';

import { loginAs } from '../fixtures/auth';
import { resetDb, seedMenu, seedUser } from '../fixtures/seed';

const PLACEHOLDER_EMAIL = 'nino@cafelinville.ge';

test.describe('admin settings — team tab (T16.5)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ context }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop',
      'Desktop-only; mobile settings variant lands in T17.5',
    );
    await resetDb();
    await context.clearCookies();
    await context.addCookies([
      { name: 'NEXT_LOCALE', value: 'en', domain: 'localhost', path: '/' },
    ]);
  });

  async function seedAndLogin(plan: 'FREE' | 'STARTER' | 'PRO', page: Page) {
    const user = await seedUser({ plan, name: 'Nino Kapanadze', email: PLACEHOLDER_EMAIL });
    await seedMenu({
      userId: user.id,
      status: 'PUBLISHED',
      categoryCount: 2,
      productCount: 3,
    });
    await loginAs(page, PLACEHOLDER_EMAIL);
    return user;
  }

  async function suppressAnimations(page: Page) {
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({
      content:
        '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }',
    });
  }

  // ── Visual baseline ─────────────────────────────────────────────────────────

  test('visual: STARTER user sees blurred preview + centered upgrade overlay', async ({
    page,
  }, testInfo) => {
    await seedAndLogin('STARTER', page);
    await page.goto('/admin/settings/team');
    await suppressAnimations(page);

    const overlay = page.getByTestId('settings-team-locked-overlay');
    await expect(overlay).toBeVisible();

    const tab = page.getByTestId('settings-tab-team');
    await expect(tab).toHaveScreenshot(`settings-team-locked-${testInfo.project.name}.png`, {
      maxDiffPixelRatio: 0.05,
    });
  });

  // ── Functional: all plans see locked state ─────────────────────────────────

  test('functional: FREE plan sees the locked overlay', async ({ page }) => {
    await seedAndLogin('FREE', page);
    await page.goto('/admin/settings/team');

    await expect(page.getByTestId('settings-team-locked')).toBeVisible();
    await expect(page.getByTestId('settings-team-locked-overlay')).toBeVisible();
  });

  test('functional: STARTER plan sees the locked overlay', async ({ page }) => {
    await seedAndLogin('STARTER', page);
    await page.goto('/admin/settings/team');

    await expect(page.getByTestId('settings-team-locked')).toBeVisible();
    await expect(page.getByTestId('settings-team-locked-overlay')).toBeVisible();
  });

  test('functional: PRO plan also sees the locked overlay (backend not yet shipped)', async ({
    page,
  }) => {
    await seedAndLogin('PRO', page);
    await page.goto('/admin/settings/team');

    await expect(page.getByTestId('settings-team-locked')).toBeVisible();
    await expect(page.getByTestId('settings-team-locked-overlay')).toBeVisible();
  });

  // ── Functional: blurred preview is non-interactive ─────────────────────────

  test('functional: blurred preview is non-interactive (pointer-events none, aria-hidden)', async ({
    page,
  }) => {
    await seedAndLogin('STARTER', page);
    await page.goto('/admin/settings/team');

    const preview = page.getByTestId('settings-team-locked-preview');
    await expect(preview).toBeVisible();
    await expect(preview).toHaveAttribute('aria-hidden', 'true');

    // pointer-events: none — force-click should not navigate or trigger requests.
    let sawNavigation = false;
    page.on('request', (req) => {
      if (req.method() === 'POST' && req.url().includes('/api/team')) {
        sawNavigation = true;
      }
    });

    await preview.click({ force: true, position: { x: 20, y: 20 } });
    await page.waitForTimeout(400);
    expect(sawNavigation).toBe(false);
  });

  // ── Functional: CTA navigates to billing ───────────────────────────────────

  test('functional: Upgrade to Pro CTA navigates to /admin/settings/billing', async ({
    page,
  }) => {
    await seedAndLogin('STARTER', page);
    await page.goto('/admin/settings/team');

    const cta = page.getByTestId('settings-team-locked-cta');
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', '/admin/settings/billing');

    await cta.click();
    await expect(page).toHaveURL(/\/admin\/settings\/billing(\b|\?|$)/);
  });

  // ── Functional: compare plans link navigates to billing ────────────────────

  test('functional: Compare all plans link navigates to /admin/settings/billing', async ({
    page,
  }) => {
    await seedAndLogin('STARTER', page);
    await page.goto('/admin/settings/team');

    const link = page.getByTestId('settings-team-locked-compare');
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '/admin/settings/billing');

    await link.click();
    await expect(page).toHaveURL(/\/admin\/settings\/billing(\b|\?|$)/);
  });
});
