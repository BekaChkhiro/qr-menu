// Test for T10.6 Navigation primitives.
// Run:     pnpm test:e2e tests/e2e/components/navigation.spec.ts
// Update:  pnpm test:e2e:update tests/e2e/components/navigation.spec.ts
//
// Covers: SidebarItem (click navigates, active reflects route, locked opens
// upgrade prompt), TopBar (search + notification clicks fire handlers),
// EditorTabBar (change + ArrowRight/ArrowLeft keyboard nav), MobileTabBar
// (tap updates active).

import { test, expect, Page } from '@playwright/test';

const SHOWCASE_URL = '/test/components/navigation';

// ── Helpers ──────────────────────────────────────────────────────────────

async function readActiveRoute(page: Page): Promise<string> {
  const text = (await page.getByTestId('active-route').textContent()) ?? '';
  const match = text.match(/route\s*=\s*(\S+)/);
  return match?.[1] ?? '';
}

async function readEditorActive(page: Page): Promise<string> {
  const text = (await page.getByTestId('editor-active-tab').textContent()) ?? '';
  const match = text.match(/Active tab:\s*(\S+)/);
  return match?.[1] ?? '';
}

async function readMobileActive(page: Page): Promise<string> {
  const text = (await page.getByTestId('mobile-active-tab').textContent()) ?? '';
  const match = text.match(/Active mobile tab:\s*(\S+)/);
  return match?.[1] ?? '';
}

async function readLog(page: Page): Promise<string[]> {
  const entries = page.getByTestId('action-log').locator('li[data-log-entry]');
  const count = await entries.count();
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const v = await entries.nth(i).getAttribute('data-log-entry');
    if (v) out.push(v);
  }
  return out;
}

// ── Suite ────────────────────────────────────────────────────────────────

test.describe('T10.6 — Navigation', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    testInfo.setTimeout(testInfo.timeout + 30_000);
    await page.goto(SHOWCASE_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await expect(page.getByTestId('navigation-showcase')).toBeVisible({ timeout: 20_000 });
    await page.evaluate(() => document.fonts.ready);
  });

  // ── 1. Visual baseline ─────────────────────────────────────────────────

  test('visual: navigation showcase matches baseline', async ({ page }, testInfo) => {
    // Desktop-only — responsive behaviour is covered in Phase 17.
    test.skip(testInfo.project.name === 'mobile', 'Desktop-only visual baseline');

    await page.addStyleTag({
      content:
        '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }',
    });

    await expect(page).toHaveScreenshot('navigation-showcase.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });

  // ── 2. Structure smoke test ───────────────────────────────────────────

  test('functional: showcase renders all major sections', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Navigation', level: 1 })).toBeVisible();
    await expect(page.getByRole('region', { name: /sidebar item.*states/i })).toBeVisible();
    await expect(page.getByRole('region', { name: /top bar/i })).toBeVisible();
    await expect(page.getByRole('region', { name: /editor tab bar/i })).toBeVisible();
    await expect(page.getByRole('region', { name: /mobile tab bar/i })).toBeVisible();
    await expect(page.getByTestId('interactive-section')).toBeVisible();
  });

  // ── 3. SidebarItem — click navigates (URL updates) ────────────────────

  test('functional: clicking a SidebarItem updates the URL', async ({ page }) => {
    // The interactive sidebar uses `?route=<id>` as its target; clicking the
    // "menus" row must drive the URL to include `route=menus`.
    await page.getByTestId('sidebar-menus').click();
    await expect(page).toHaveURL(/[?&]route=menus\b/);

    await page.getByTestId('sidebar-settings').click();
    await expect(page).toHaveURL(/[?&]route=settings\b/);
  });

  // ── 4. SidebarItem — active state reflects current "route" ───────────

  test('functional: active state reflects the current route', async ({ page }) => {
    // Default route is `dashboard` — the dashboard row should be active.
    expect(await readActiveRoute(page)).toBe('dashboard');
    await expect(page.getByTestId('sidebar-dashboard')).toHaveAttribute('data-active', 'true');
    await expect(page.getByTestId('sidebar-menus')).not.toHaveAttribute('data-active', 'true');

    // Navigate — active should follow.
    await page.getByTestId('sidebar-analytics').click();
    await expect.poll(() => readActiveRoute(page)).toBe('analytics');
    await expect(page.getByTestId('sidebar-analytics')).toHaveAttribute('data-active', 'true');
    await expect(page.getByTestId('sidebar-dashboard')).not.toHaveAttribute('data-active', 'true');
  });

  // ── 5. SidebarItem — locked row opens upgrade prompt, does NOT nav ────

  test('functional: clicking a locked SidebarItem opens the upgrade prompt', async ({ page }) => {
    // Baseline: no prompt visible, no `?locked=` in URL, no route change.
    const startUrl = page.url();
    await expect(page.getByTestId('upgrade-prompt')).toHaveCount(0);

    const locked = page.getByTestId('sidebar-promotions-locked');
    await expect(locked).toHaveAttribute('data-locked', 'true');

    await locked.click();

    // Prompt appears with dialog semantics.
    const prompt = page.getByTestId('upgrade-prompt');
    await expect(prompt).toBeVisible();
    await expect(prompt).toHaveAttribute('role', 'dialog');
    await expect(prompt.getByText(/upgrade to unlock/i)).toBeVisible();

    // Log contains the locked entry.
    const log = await readLog(page);
    expect(log).toContain('locked:promotions');

    // URL did not change — the locked row is a button, not a link.
    expect(page.url()).toBe(startUrl);

    // Prompt dismisses.
    await page.getByTestId('upgrade-dismiss').click();
    await expect(page.getByTestId('upgrade-prompt')).toHaveCount(0);
  });

  // ── 6. TopBar — notifications + user fire their handlers ──────────────

  test('functional: TopBar notifications and user buttons fire their handlers', async ({ page }) => {
    // Scope to the interactive section — the page also renders two static
    // top bars above which would otherwise match the testid.
    const interactive = page.getByTestId('interactive-section');

    await interactive.getByTestId('topbar-notifications').click();
    await interactive.getByTestId('topbar-user').click();

    const log = await readLog(page);
    expect(log).toContain('topbar:notifications');
    expect(log).toContain('topbar:user');

    // Unread dot renders when hasUnreadNotifications is true.
    await expect(interactive.getByTestId('topbar-notifications-dot')).toBeVisible();
  });

  // Desktop-only: the search button is `hidden md:flex` per design (the
  // mobile variant presents search through a different affordance that is
  // covered in Phase 17).
  test('functional: TopBar search fires its handler (desktop only)', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'Search is hidden below md breakpoint');

    const interactive = page.getByTestId('interactive-section');
    await interactive.getByTestId('topbar-search').click();

    const log = await readLog(page);
    expect(log).toContain('topbar:search');
  });

  // ── 7. EditorTabBar — click changes active, aria-selected follows ─────

  test('functional: EditorTabBar click updates active state and aria-selected', async ({ page }) => {
    expect(await readEditorActive(page)).toBe('content');

    const tablist = page.getByTestId('interactive-section').getByRole('tablist', { name: /editor tabs/i });
    await tablist.getByRole('tab', { name: 'Analytics' }).click();

    expect(await readEditorActive(page)).toBe('analytics');
    await expect(tablist.getByRole('tab', { name: 'Analytics' })).toHaveAttribute('aria-selected', 'true');
    await expect(tablist.getByRole('tab', { name: 'Content' })).toHaveAttribute('aria-selected', 'false');
  });

  // ── 8. EditorTabBar — ArrowRight / ArrowLeft keyboard navigation ──────

  test('functional: EditorTabBar responds to ArrowRight/ArrowLeft keys', async ({ page }) => {
    const tablist = page
      .getByTestId('interactive-section')
      .getByRole('tablist', { name: /editor tabs/i });

    // Focus the currently-active tab (Content). ArrowRight should move focus
    // to Branding; Enter activates it.
    const content = tablist.getByRole('tab', { name: 'Content' });
    await content.focus();
    await expect(content).toBeFocused();

    await page.keyboard.press('ArrowRight');
    await expect(tablist.getByRole('tab', { name: 'Branding' })).toBeFocused();

    await page.keyboard.press('Enter');
    expect(await readEditorActive(page)).toBe('branding');

    // ArrowLeft walks back, Space activates.
    await page.keyboard.press('ArrowLeft');
    await expect(tablist.getByRole('tab', { name: 'Content' })).toBeFocused();
    await page.keyboard.press('Space');
    expect(await readEditorActive(page)).toBe('content');
  });

  // ── 9. MobileTabBar — tap updates active tab ──────────────────────────

  test('functional: MobileTabBar tap updates active state', async ({ page }) => {
    expect(await readMobileActive(page)).toBe('home');

    const nav = page.getByTestId('interactive-section').getByRole('navigation', { name: /mobile nav/i });

    await nav.getByRole('button', { name: /menus/i }).click();
    expect(await readMobileActive(page)).toBe('menus');
    await expect(nav.locator('[data-tab-id="menus"]')).toHaveAttribute('data-active', 'true');
    await expect(nav.locator('[data-tab-id="home"]')).not.toHaveAttribute('data-active', 'true');

    await nav.getByRole('button', { name: /qr/i }).click();
    expect(await readMobileActive(page)).toBe('qr');
  });
});
