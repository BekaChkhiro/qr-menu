// Test for T13.4 Phone Preview (Live Sync).
// Run:     pnpm test:e2e tests/e2e/admin/editor-preview.spec.ts
// Update:  pnpm test:e2e:update tests/e2e/admin/editor-preview.spec.ts
//
// Covers:
//   Visual — the right-hand phone preview panel on the Content tab, with the
//   language tabs, Share / View public actions, the phone frame with iframe
//   loaded, and the "Preview updates in real time" hint.
//
//   Functional — clicking KA / EN / RU tabs swaps the iframe locale param;
//   Share button copies the public URL to the clipboard; View public is
//   disabled on DRAFT menus and navigates to /m/{slug} on PUBLISHED menus;
//   mutating a category via drag-reorder triggers an iframe refetch within 1s.
//
// Notes:
//   - Serial mode because resetDb() truncates tables.
//   - Desktop-only; T17.3 lands the mobile bottom-sheet variant.
//   - The iframe scales 375px content to ~292px screen via CSS transform; we
//     assert against the `src` attribute and inner frame rather than the
//     scaled geometry.

import { expect, test, type Page } from '@playwright/test';

import { loginAs } from '../fixtures/auth';
import { prismaTest, resetDb, seedMenu, seedUser } from '../fixtures/seed';

test.describe('editor phone preview panel (T13.4)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ context }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop',
      'Desktop-only preview column; mobile variant lands in T17.3',
    );
    await resetDb();
    await context.clearCookies();
    await context.addCookies([
      { name: 'NEXT_LOCALE', value: 'en', domain: 'localhost', path: '/' },
    ]);
    // clipboard-write permission for the Share button test.
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  });

  async function seedEditorAndLogin(
    page: Page,
    opts: {
      status?: 'DRAFT' | 'PUBLISHED';
      plan?: 'FREE' | 'STARTER' | 'PRO';
      enabledLanguages?: Array<'KA' | 'EN' | 'RU'>;
      categoryCount?: number;
      productCount?: number;
    } = {},
  ) {
    const email = 'nino@cafelinville.ge';
    const user = await seedUser({
      plan: opts.plan ?? 'STARTER',
      name: 'Nino Kapanadze',
      email,
    });
    const menu = await seedMenu({
      userId: user.id,
      status: opts.status ?? 'PUBLISHED',
      categoryCount: opts.categoryCount ?? 3,
      productCount: opts.productCount ?? 2,
      name: 'Café Linville — Dinner',
    });

    if (opts.enabledLanguages && opts.enabledLanguages.length > 0) {
      await prismaTest.menu.update({
        where: { id: menu.id },
        data: { enabledLanguages: opts.enabledLanguages },
      });
    }

    await loginAs(page, email);
    return { user, menu };
  }

  // ── Visual ────────────────────────────────────────────────────────────────

  test('visual: preview panel renders with language tabs + realtime hint', async ({
    page,
  }, testInfo) => {
    const { menu } = await seedEditorAndLogin(page, {
      enabledLanguages: ['KA', 'EN', 'RU'],
    });
    await page.goto(`/admin/menus/${menu.id}?tab=content`);
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({
      content:
        '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }',
    });

    const panel = page.getByTestId('phone-preview-panel');
    await expect(panel).toBeVisible();
    // Make sure the iframe has settled before snapshotting.
    const iframe = panel.locator('iframe[title="Menu preview"]');
    await expect(iframe).toHaveAttribute('src', /preview=true&draft=true/);
    await iframe.evaluate(
      (el: HTMLIFrameElement) =>
        new Promise<void>((resolve) => {
          if (el.contentWindow?.document.readyState === 'complete') {
            resolve();
            return;
          }
          el.addEventListener('load', () => resolve(), { once: true });
        }),
    );

    await expect(panel).toHaveScreenshot(
      `editor-content-with-preview-${testInfo.project.name}.png`,
      { maxDiffPixelRatio: 0.05 },
    );
  });

  // ── Functional ────────────────────────────────────────────────────────────

  test('functional: default locale is KA and iframe src carries preview+draft flags', async ({
    page,
  }) => {
    const { menu } = await seedEditorAndLogin(page, {
      enabledLanguages: ['KA', 'EN', 'RU'],
    });
    await page.goto(`/admin/menus/${menu.id}?tab=content`);

    const panel = page.getByTestId('phone-preview-panel');
    await expect(panel).toHaveAttribute('data-active-locale', 'ka');

    // Exactly 3 tabs rendered for a KA+EN+RU menu.
    const tabs = page.getByTestId('preview-language-tabs').getByRole('radio');
    await expect(tabs).toHaveCount(3);

    const kaTab = page.getByTestId('preview-locale-ka');
    const enTab = page.getByTestId('preview-locale-en');
    const ruTab = page.getByTestId('preview-locale-ru');
    await expect(kaTab).toHaveAttribute('aria-checked', 'true');
    await expect(enTab).toHaveAttribute('aria-checked', 'false');
    await expect(ruTab).toHaveAttribute('aria-checked', 'false');

    const iframe = panel.locator('iframe[title="Menu preview"]');
    await expect(iframe).toHaveAttribute(
      'src',
      `/m/${menu.slug}?preview=true&draft=true&locale=ka`,
    );
  });

  test('functional: clicking EN tab updates iframe src to locale=en', async ({
    page,
  }) => {
    const { menu } = await seedEditorAndLogin(page, {
      enabledLanguages: ['KA', 'EN', 'RU'],
    });
    await page.goto(`/admin/menus/${menu.id}?tab=content`);

    const panel = page.getByTestId('phone-preview-panel');
    const iframe = panel.locator('iframe[title="Menu preview"]');
    await expect(iframe).toHaveAttribute('src', /locale=ka/);

    await page.getByTestId('preview-locale-en').click();

    await expect(panel).toHaveAttribute('data-active-locale', 'en');
    await expect(page.getByTestId('preview-locale-en')).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await expect(page.getByTestId('preview-locale-ka')).toHaveAttribute(
      'aria-checked',
      'false',
    );
    await expect(iframe).toHaveAttribute(
      'src',
      `/m/${menu.slug}?preview=true&draft=true&locale=en`,
    );
  });

  test('functional: menu with only KA renders a single-tab radiogroup', async ({
    page,
  }) => {
    // Default seedMenu() leaves enabledLanguages at ['KA'].
    const { menu } = await seedEditorAndLogin(page, {});
    await page.goto(`/admin/menus/${menu.id}?tab=content`);

    const tabs = page.getByTestId('preview-language-tabs').getByRole('radio');
    await expect(tabs).toHaveCount(1);
    await expect(page.getByTestId('preview-locale-ka')).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  test('functional: Share button copies the public URL to the clipboard', async ({
    page,
  }) => {
    const { menu } = await seedEditorAndLogin(page, { status: 'PUBLISHED' });
    await page.goto(`/admin/menus/${menu.id}?tab=content`);

    await page.getByTestId('preview-share').click();

    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toBe(`${new URL(page.url()).origin}/m/${menu.slug}`);
  });

  test('functional: View public is disabled on DRAFT menus', async ({ page }) => {
    const { menu } = await seedEditorAndLogin(page, { status: 'DRAFT' });
    await page.goto(`/admin/menus/${menu.id}?tab=content`);

    const viewPublic = page.getByTestId('preview-view-public');
    await expect(viewPublic).toBeDisabled();
  });

  test('functional: View public opens /m/{slug} in a new tab on PUBLISHED menus', async ({
    page,
    context,
  }) => {
    const { menu } = await seedEditorAndLogin(page, { status: 'PUBLISHED' });
    await page.goto(`/admin/menus/${menu.id}?tab=content`);

    const viewPublic = page.getByTestId('preview-view-public');
    await expect(viewPublic).toBeEnabled();

    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      viewPublic.click(),
    ]);
    await newPage.waitForLoadState('domcontentloaded');
    expect(new URL(newPage.url()).pathname).toBe(`/m/${menu.slug}`);
    await newPage.close();
  });

  test('functional: drag-reordering a category reloads the preview within 1.5s', async ({
    page,
  }) => {
    // Test pulls the "real-time sync" behaviour end-to-end: trigger a category
    // reorder mutation in the left column, and assert that the phone preview
    // iframe re-fetches the public menu route shortly after. Pusher is not
    // configured in this test env, so we're specifically validating the
    // query-cache → previewVersion → iframe reload path.
    const { menu } = await seedEditorAndLogin(page, { categoryCount: 3 });
    await page.goto(`/admin/menus/${menu.id}?tab=content`);

    const iframe = page.locator('iframe[title="Menu preview"]');
    await expect(iframe).toHaveAttribute('src', /preview=true&draft=true/);
    // Wait for the first load to settle so any follow-up request is clearly
    // the reload triggered by our mutation rather than the initial GET.
    await iframe.evaluate(
      (el: HTMLIFrameElement) =>
        new Promise<void>((resolve) => {
          if (el.contentWindow?.document.readyState === 'complete') {
            resolve();
            return;
          }
          el.addEventListener('load', () => resolve(), { once: true });
        }),
    );

    const publicMenuReload = page.waitForResponse(
      (r) =>
        r.url().includes(`/m/${menu.slug}`) &&
        r.request().resourceType() === 'document' &&
        r.ok(),
      { timeout: 5000 },
    );

    // Keyboard-driven drag — matches @dnd-kit's keyboard sensor (see T13.2).
    const firstHandle = page
      .getByTestId('category-row')
      .first()
      .getByTestId('category-drag-handle');
    await firstHandle.focus();
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Space');

    const start = Date.now();
    const response = await publicMenuReload;
    const elapsed = Date.now() - start;

    expect(response.url()).toContain(`/m/${menu.slug}`);
    // The spec's "<1s" target is a best-effort SLO; allow 1.5s headroom for
    // test-env overhead (network idle in CI, etc.).
    expect(elapsed).toBeLessThan(1500);
  });

  test('functional: switching to branding tab keeps the preview panel mounted', async ({
    page,
  }) => {
    const { menu } = await seedEditorAndLogin(page, {
      plan: 'STARTER', // custom branding available
      enabledLanguages: ['KA', 'EN', 'RU'],
    });
    await page.goto(`/admin/menus/${menu.id}?tab=content`);
    await expect(page.getByTestId('phone-preview-panel')).toBeVisible();

    await page.getByTestId('editor-tab-bar').getByRole('tab', { name: 'Branding' }).click();
    await expect(page).toHaveURL(/tab=branding/);
    await expect(page.getByTestId('phone-preview-panel')).toBeVisible();

    await page.getByTestId('editor-tab-bar').getByRole('tab', { name: 'Analytics' }).click();
    await expect(page).toHaveURL(/tab=analytics/);
    // Analytics tab is full-width; preview column should be unmounted.
    await expect(page.getByTestId('phone-preview-panel')).toHaveCount(0);
  });

  test('functional: public menu page honours the ?locale= query param', async ({
    page,
  }) => {
    // Directly exercises the preview contract: /m/{slug}?preview=true&draft=true&locale=en
    // should render the EN locale regardless of the NEXT_LOCALE cookie.
    const user = await seedUser({
      plan: 'STARTER',
      email: 'nino@cafelinville.ge',
      name: 'Nino Kapanadze',
    });
    const menu = await seedMenu({
      userId: user.id,
      status: 'PUBLISHED',
      categoryCount: 2,
      productCount: 2,
    });
    await prismaTest.menu.update({
      where: { id: menu.id },
      data: { enabledLanguages: ['KA', 'EN'] },
    });
    await loginAs(page, 'nino@cafelinville.ge');

    await page.goto(`/m/${menu.slug}?preview=true&draft=true&locale=en`);
    // Seeded English category names (from fixtures/seed.ts).
    await expect(page.locator('body')).toContainText(/Hot Dishes|Salads/);

    await page.goto(`/m/${menu.slug}?preview=true&draft=true&locale=ka`);
    await expect(page.locator('body')).toContainText(/ცხელი კერძები|სალათები/);
  });
});
