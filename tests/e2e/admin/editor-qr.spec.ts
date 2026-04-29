// Test for T15.10 Editor — QR Tab · Customize Panel.
// Run:     pnpm test:e2e tests/e2e/admin/editor-qr.spec.ts
// Update:  pnpm test:e2e:update tests/e2e/admin/editor-qr.spec.ts
//
// Covers:
//   Visual     — /admin/menus/[id]?tab=qr on STARTER (logo row locked to PRO)
//                and on PRO with a custom foreground color + Rounded style +
//                centered "CL" logo placeholder on.
//   Functional — picking a style radio card PATCHes the menu's `qrStyle` and
//                the per-module SVG reshapes (Rounded → <rect rx> per cell;
//                Dots → <circle> per cell); picking a foreground swatch
//                persists `qrForegroundColor`; the Background segmented
//                persists `qrBackgroundColor` as null when Transparent; the
//                PRO logo toggle writes `qrLogoUrl` and the SVG gets a
//                centered <image>/"CL" plate; a STARTER user sees the PRO
//                lock badge instead of the switch and cannot save a logo; the
//                Copy URL button writes `${origin}/m/{slug}` to the clipboard.
//
// Note: the QR tab replaces the phone preview column (the tab renders its own
// QR preview inside the customize card), so `editor-shell` is the right
// screenshot target and tests do not assert on any `phone-preview-*` selectors.

import { expect, test, type Page } from '@playwright/test';

import { loginAs } from '../fixtures/auth';
import { prismaTest, resetDb, seedMenu, seedUser } from '../fixtures/seed';

async function seedStarterAndOpenQr(page: Page) {
  const email = 'nino-starter@cafelinville.ge';
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
  await page.goto(`/admin/menus/${menu.id}?tab=qr`);
  await expect(page.getByTestId('editor-qr-tab')).toBeVisible();
  return { user, menu };
}

async function seedProAndOpenQr(page: Page) {
  const email = 'nino-pro@cafelinville.ge';
  const user = await seedUser({
    plan: 'PRO',
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
  // Give the menu a logo so the PRO logo toggle has something to composite.
  await prismaTest.menu.update({
    where: { id: menu.id },
    data: {
      logoUrl:
        'https://res.cloudinary.com/demo/image/upload/w_200,h_200/sample.png',
      qrStyle: 'ROUNDED',
      qrForegroundColor: '#B8633D',
      qrLogoUrl:
        'https://res.cloudinary.com/demo/image/upload/w_200,h_200/sample.png',
    },
  });
  await loginAs(page, email);
  await page.goto(`/admin/menus/${menu.id}?tab=qr`);
  await expect(page.getByTestId('editor-qr-tab')).toBeVisible();
  return { user, menu };
}

test.describe('editor QR tab · customize (T15.10)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ context }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop',
      'Desktop-only tab; mobile variant lands in T17.3',
    );
    await resetDb();
    await context.clearCookies();
    // Force English so copy assertions don't depend on cookie state.
    await context.addCookies([
      { name: 'NEXT_LOCALE', value: 'en', domain: 'localhost', path: '/' },
    ]);
  });

  // ── Visual: STARTER (logo row locked; foreground defaults) ───────────────

  test('visual: editor-qr-starter', async ({ page }, testInfo) => {
    await seedStarterAndOpenQr(page);
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({
      content:
        '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }',
    });

    const shell = page.getByTestId('editor-shell');
    await expect(shell).toBeVisible();
    await expect(page.getByTestId('editor-qr-preview-svg')).toBeVisible();
    await expect(page.getByTestId('editor-qr-logo-pro-badge')).toBeVisible();

    await expect(shell).toHaveScreenshot(
      `editor-qr-starter-${testInfo.project.name}.png`,
      { maxDiffPixelRatio: 0.05 },
    );
  });

  // ── Visual: PRO with branded foreground + rounded + logo overlay ─────────

  test('visual: editor-qr-pro-branded', async ({ page }, testInfo) => {
    await seedProAndOpenQr(page);
    await page.evaluate(() => document.fonts.ready);
    // Wait for the logo <image> to resolve so the PNG baseline is stable.
    await page.waitForLoadState('networkidle');
    await page.addStyleTag({
      content:
        '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }',
    });

    const shell = page.getByTestId('editor-shell');
    await expect(shell).toBeVisible();
    // Sanity: PRO renders the toggle, not the locked badge.
    await expect(page.getByTestId('editor-qr-logo-toggle')).toBeVisible();
    await expect(page.getByTestId('editor-qr-logo-pro-badge')).toHaveCount(0);
    // Rounded style is active from the seed.
    await expect(page.getByTestId('editor-qr-style-rounded')).toHaveAttribute(
      'aria-checked',
      'true',
    );

    await expect(shell).toHaveScreenshot(
      `editor-qr-pro-branded-${testInfo.project.name}.png`,
      { maxDiffPixelRatio: 0.05 },
    );
  });

  // ── Functional: picking a style radio card reshapes the SVG ──────────────

  test('functional: STARTER picks Dots → SVG switches to per-module circles', async ({
    page,
  }) => {
    const { menu } = await seedStarterAndOpenQr(page);

    // Initial state: SQUARE → SVG uses <rect> per module (no <circle>).
    const svg = page.getByTestId('editor-qr-preview-svg');
    await expect(svg).toBeVisible();
    const initialCircles = await svg.locator('circle').count();
    expect(initialCircles).toBe(0);

    const putResponse = page.waitForResponse(
      (res) =>
        res.url().includes(`/api/menus/${menu.id}`) &&
        res.request().method() === 'PUT' &&
        res.ok(),
    );

    await page.getByTestId('editor-qr-style-dots').click();

    const res = await putResponse;
    const body = (await res.json()) as { data?: { qrStyle: string | null } };
    expect(body.data?.qrStyle).toBe('DOTS');

    // Aria + data state flips.
    await expect(page.getByTestId('editor-qr-style-dots')).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await expect(page.getByTestId('editor-qr-tab')).toHaveAttribute(
      'data-qr-style',
      'DOTS',
    );

    // SVG now has <circle> per module for the data cells.
    const nextCircles = await svg.locator('circle').count();
    expect(nextCircles).toBeGreaterThan(0);

    // Database is source of truth.
    const row = await prismaTest.menu.findFirst({
      where: { id: menu.id },
      select: { qrStyle: true },
    });
    expect(row?.qrStyle).toBe('DOTS');
  });

  // ── Functional: Rounded style adds rx to data cells ──────────────────────

  test('functional: STARTER picks Rounded → SVG per-cell rects carry rx', async ({
    page,
  }) => {
    const { menu } = await seedStarterAndOpenQr(page);

    const putResponse = page.waitForResponse(
      (res) =>
        res.url().includes(`/api/menus/${menu.id}`) &&
        res.request().method() === 'PUT' &&
        res.ok(),
    );

    await page.getByTestId('editor-qr-style-rounded').click();
    const res = await putResponse;
    const body = (await res.json()) as { data?: { qrStyle: string | null } };
    expect(body.data?.qrStyle).toBe('ROUNDED');

    // Pick any data <rect> (i.e., not the finder ones at position 0,0) and
    // assert its rx is > 0. The first 3 rects are the finder outer squares at
    // ox/oy=0, so we skip them by looking for rects whose x > 7 cells in.
    const svg = page.getByTestId('editor-qr-preview-svg');
    const rxValues = await svg
      .locator('rect[rx]')
      .evaluateAll((nodes) =>
        nodes
          .map((n) => parseFloat((n as SVGRectElement).getAttribute('rx') || '0'))
          .filter((n) => n > 0),
      );
    // Many rounded rects should exist (every module + finder outer).
    expect(rxValues.length).toBeGreaterThan(10);
  });

  // ── Functional: swatch click persists qrForegroundColor ──────────────────

  test('functional: STARTER picks Terracotta swatch → DB has new qrForegroundColor', async ({
    page,
  }) => {
    const { menu } = await seedStarterAndOpenQr(page);

    const putResponse = page.waitForResponse(
      (res) =>
        res.url().includes(`/api/menus/${menu.id}`) &&
        res.request().method() === 'PUT' &&
        res.ok(),
    );

    await page.getByTestId('editor-qr-swatch-terracotta').click();

    const res = await putResponse;
    const body = (await res.json()) as {
      data?: { qrForegroundColor: string | null };
    };
    expect(body.data?.qrForegroundColor?.toLowerCase()).toBe('#b8633d');

    await expect(
      page.getByTestId('editor-qr-swatch-terracotta'),
    ).toHaveAttribute('aria-checked', 'true');

    const row = await prismaTest.menu.findFirst({
      where: { id: menu.id },
      select: { qrForegroundColor: true },
    });
    expect(row?.qrForegroundColor?.toLowerCase()).toBe('#b8633d');
  });

  // ── Functional: Background → Transparent nulls qrBackgroundColor ─────────

  test('functional: Background Transparent → DB has qrBackgroundColor = null', async ({
    page,
  }) => {
    const { menu } = await seedStarterAndOpenQr(page);

    // Default in seed = null, so flip to White first to make the change
    // meaningful, then back to Transparent.
    const whitePut = page.waitForResponse(
      (res) =>
        res.url().includes(`/api/menus/${menu.id}`) &&
        res.request().method() === 'PUT' &&
        res.ok(),
    );
    await page.getByTestId('editor-qr-bg-white').click();
    await whitePut;

    const transparentPut = page.waitForResponse(
      (res) =>
        res.url().includes(`/api/menus/${menu.id}`) &&
        res.request().method() === 'PUT' &&
        res.ok(),
    );
    await page.getByTestId('editor-qr-bg-transparent').click();
    const res = await transparentPut;
    const body = (await res.json()) as {
      data?: { qrBackgroundColor: string | null };
    };
    expect(body.data?.qrBackgroundColor).toBeNull();

    await expect(page.getByTestId('editor-qr-tab')).toHaveAttribute(
      'data-qr-bg',
      'transparent',
    );

    const row = await prismaTest.menu.findFirst({
      where: { id: menu.id },
      select: { qrBackgroundColor: true },
    });
    expect(row?.qrBackgroundColor).toBeNull();
  });

  // ── Functional: PRO toggle on → DB gets qrLogoUrl + SVG has <image> ──────

  test('functional: PRO toggle logo on → qrLogoUrl saved + SVG shows logo plate', async ({
    page,
  }) => {
    const { menu } = await seedProAndOpenQr(page);

    // Seed already set qrLogoUrl; verify toggle reflects that, then toggle off
    // → null, then on → back to menu.logoUrl.
    await expect(page.getByTestId('editor-qr-logo-toggle')).toHaveAttribute(
      'data-state',
      'checked',
    );

    const offPut = page.waitForResponse(
      (res) =>
        res.url().includes(`/api/menus/${menu.id}`) &&
        res.request().method() === 'PUT' &&
        res.ok(),
    );
    await page.getByTestId('editor-qr-logo-toggle').click();
    const offRes = await offPut;
    const offBody = (await offRes.json()) as {
      data?: { qrLogoUrl: string | null };
    };
    expect(offBody.data?.qrLogoUrl).toBeNull();

    // SVG now has no <image> element inside.
    await expect(
      page.getByTestId('editor-qr-preview-svg').locator('image'),
    ).toHaveCount(0);

    const onPut = page.waitForResponse(
      (res) =>
        res.url().includes(`/api/menus/${menu.id}`) &&
        res.request().method() === 'PUT' &&
        res.ok(),
    );
    await page.getByTestId('editor-qr-logo-toggle').click();
    const onRes = await onPut;
    const onBody = (await onRes.json()) as {
      data?: { qrLogoUrl: string | null };
    };
    expect(onBody.data?.qrLogoUrl).toContain('cloudinary');

    // SVG now has <image> element for the logo.
    await expect(
      page.getByTestId('editor-qr-preview-svg').locator('image'),
    ).toHaveCount(1);
  });

  // ── Functional: STARTER sees locked logo row, no toggle fires no PUT ─────

  test('functional: STARTER has locked logo row with PRO badge + no switch', async ({
    page,
  }) => {
    const { menu } = await seedStarterAndOpenQr(page);

    await expect(page.getByTestId('editor-qr-logo-row')).toHaveAttribute(
      'data-plan-locked',
      'true',
    );
    await expect(page.getByTestId('editor-qr-logo-pro-badge')).toBeVisible();
    await expect(page.getByTestId('editor-qr-logo-toggle')).toHaveCount(0);

    // DB qrLogoUrl remains null — nothing to PATCH.
    const row = await prismaTest.menu.findFirst({
      where: { id: menu.id },
      select: { qrLogoUrl: true },
    });
    expect(row?.qrLogoUrl).toBeNull();
  });

  // ── Functional: Copy URL writes to clipboard ─────────────────────────────

  test('functional: Copy URL writes ${origin}/m/{slug} to clipboard', async ({
    page,
    context,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    const { menu } = await seedStarterAndOpenQr(page);

    await page.getByTestId('editor-qr-url-copy').click();

    const clipboardText = await page.evaluate(() =>
      navigator.clipboard.readText(),
    );
    expect(clipboardText).toContain(`/m/${menu.slug}`);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// T15.11 — QR Tab · Download Panel + Scan Stats
// ═════════════════════════════════════════════════════════════════════════════

test.describe('editor QR tab · download panel + scan stats (T15.11)', () => {
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

  // ── Visual: full QR tab with download panel ──────────────────────────────

  test('visual: editor-qr-download', async ({ page }, testInfo) => {
    await seedStarterAndOpenQr(page);
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({
      content:
        '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }',
    });

    const shell = page.getByTestId('editor-shell');
    await expect(shell).toBeVisible();
    await expect(page.getByTestId('editor-qr-download-panel')).toBeVisible();

    await expect(shell).toHaveScreenshot(
      `editor-qr-download-${testInfo.project.name}.png`,
      { maxDiffPixelRatio: 0.05 },
    );
  });

  // ── Functional: Download PNG triggers browser download ───────────────────

  test('functional: Download PNG triggers browser download', async ({ page }) => {
    await seedStarterAndOpenQr(page);

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('editor-qr-download-btn').click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/^qr-.*\.png$/);
  });

  // ── Functional: Short URL copy button writes to clipboard ────────────────

  test('functional: Short URL copy button writes to clipboard', async ({
    page,
    context,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    const { menu } = await seedStarterAndOpenQr(page);

    await page.getByTestId('editor-qr-link-copy').click();

    const clipboardText = await page.evaluate(() =>
      navigator.clipboard.readText(),
    );
    expect(clipboardText).toContain(`/m/${menu.slug}`);
  });

  // ── Functional: format radio selection changes active format ─────────────

  test('functional: format radio selection changes active format', async ({
    page,
  }) => {
    await seedStarterAndOpenQr(page);

    await expect(page.getByTestId('editor-qr-format-png')).toHaveAttribute(
      'aria-checked',
      'true',
    );

    await page.getByTestId('editor-qr-format-svg').click();
    await expect(page.getByTestId('editor-qr-format-svg')).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await expect(page.getByTestId('editor-qr-format-png')).toHaveAttribute(
      'aria-checked',
      'false',
    );

    await page.getByTestId('editor-qr-format-pdf').click();
    await expect(page.getByTestId('editor-qr-format-pdf')).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  // ── Functional: include URL/CTA checkboxes are PDF-only ──────────────────

  test('functional: include URL/CTA toggles activate only on PDF', async ({
    page,
  }) => {
    await seedStarterAndOpenQr(page);

    // Default format is PNG → URL/CTA checkboxes are disabled and unchecked.
    await expect(page.getByTestId('editor-qr-include-url')).toBeDisabled();
    await expect(page.getByTestId('editor-qr-include-url')).toHaveAttribute(
      'aria-checked',
      'false',
    );
    await expect(page.getByTestId('editor-qr-include-cta')).toBeDisabled();
    await expect(page.getByTestId('editor-qr-include-cta')).toHaveAttribute(
      'aria-checked',
      'false',
    );

    // Switch to PDF → toggles become active and checked.
    await page.getByTestId('editor-qr-format-pdf').click();
    await expect(page.getByTestId('editor-qr-include-url')).toBeEnabled();
    await expect(page.getByTestId('editor-qr-include-url')).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await expect(page.getByTestId('editor-qr-include-cta')).toHaveAttribute(
      'aria-checked',
      'true',
    );

    // User can toggle them off while in PDF mode.
    await page.getByTestId('editor-qr-include-url').click();
    await expect(page.getByTestId('editor-qr-include-url')).toHaveAttribute(
      'aria-checked',
      'false',
    );
  });

  // ── Functional: STARTER sees locked logo include checkbox ────────────────

  test('functional: STARTER sees locked logo include checkbox', async ({
    page,
  }) => {
    await seedStarterAndOpenQr(page);

    const logoCheckbox = page.getByTestId('editor-qr-include-logo');
    await expect(logoCheckbox).toHaveAttribute('data-locked', 'true');
    await expect(logoCheckbox).toBeDisabled();
  });

  // ── Functional: scan stats card renders ──────────────────────────────────

  test('functional: scan stats card renders with view-analytics link', async ({
    page,
  }) => {
    await seedStarterAndOpenQr(page);

    const statsCard = page.getByTestId('editor-qr-scan-stats');
    await expect(statsCard).toBeVisible();
    await expect(
      page.getByTestId('editor-qr-view-analytics'),
    ).toBeVisible();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// T15.12 — QR Tab · Template Picker Modal
// ═════════════════════════════════════════════════════════════════════════════

test.describe('editor QR tab · template picker modal (T15.12)', () => {
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

  // ── Visual: template picker modal open ───────────────────────────────────

  test('visual: editor-qr-templates', async ({ page }, testInfo) => {
    await seedStarterAndOpenQr(page);

    await page.getByTestId('editor-qr-templates-btn').click();

    const modal = page.getByTestId('qr-template-picker-modal');
    await expect(modal).toBeVisible();

    // Select a template so the footer shows selection state for a richer baseline.
    await page.getByTestId('qr-template-card-poster-A3').click();
    await expect(page.getByTestId('qr-template-card-poster-A3')).toHaveAttribute(
      'data-selected',
      'true',
    );

    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({
      content:
        '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }',
    });

    await expect(modal).toHaveScreenshot(
      `editor-qr-templates-${testInfo.project.name}.png`,
      { maxDiffPixelRatio: 0.05 },
    );
  });

  // ── Functional: open modal from templates button ─────────────────────────

  test('functional: templates button opens modal', async ({ page }) => {
    await seedStarterAndOpenQr(page);

    await expect(
      page.getByTestId('qr-template-picker-modal'),
    ).not.toBeVisible();

    await page.getByTestId('editor-qr-templates-btn').click();

    const modal = page.getByTestId('qr-template-picker-modal');
    await expect(modal).toBeVisible();

    // All 6 template cards should be visible.
    await expect(page.getByTestId('qr-template-card-tent-A4')).toBeVisible();
    await expect(page.getByTestId('qr-template-card-poster-A3')).toBeVisible();
    await expect(page.getByTestId('qr-template-card-tent-min')).toBeVisible();
    await expect(page.getByTestId('qr-template-card-receipt')).toBeVisible();
    await expect(page.getByTestId('qr-template-card-decal')).toBeVisible();
    await expect(page.getByTestId('qr-template-card-booklet')).toBeVisible();
  });

  // ── Functional: select template enables download ─────────────────────────

  test('functional: select template → download enables', async ({ page }) => {
    await seedStarterAndOpenQr(page);
    await page.getByTestId('editor-qr-templates-btn').click();

    const downloadBtn = page.getByTestId('qr-template-picker-download');
    await expect(downloadBtn).toBeDisabled();

    await page.getByTestId('qr-template-card-tent-A4').click();
    await expect(
      page.getByTestId('qr-template-card-tent-A4'),
    ).toHaveAttribute('data-selected', 'true');
    await expect(downloadBtn).toBeEnabled();

    // Selecting another template switches selection.
    await page.getByTestId('qr-template-card-decal').click();
    await expect(
      page.getByTestId('qr-template-card-decal'),
    ).toHaveAttribute('data-selected', 'true');
    await expect(
      page.getByTestId('qr-template-card-tent-A4'),
    ).toHaveAttribute('data-selected', 'false');
    await expect(downloadBtn).toBeEnabled();
  });

  // ── Functional: filter pills narrow templates ────────────────────────────

  test('functional: filter pills narrow template grid', async ({ page }) => {
    await seedStarterAndOpenQr(page);
    await page.getByTestId('editor-qr-templates-btn').click();

    // Default: all 6 visible.
    await expect(page.getByTestId('qr-template-card-tent-A4')).toBeVisible();
    await expect(page.getByTestId('qr-template-card-poster-A3')).toBeVisible();

    // Tent filter → 2 tents.
    await page.getByTestId('qr-template-filter-tent').click();
    await expect(page.getByTestId('qr-template-filter-tent')).toHaveAttribute(
      'data-active',
      'true',
    );
    await expect(page.getByTestId('qr-template-card-tent-A4')).toBeVisible();
    await expect(page.getByTestId('qr-template-card-tent-min')).toBeVisible();
    await expect(
      page.getByTestId('qr-template-card-poster-A3'),
    ).not.toBeVisible();

    // Poster filter → 1 poster.
    await page.getByTestId('qr-template-filter-poster').click();
    await expect(page.getByTestId('qr-template-card-poster-A3')).toBeVisible();
    await expect(
      page.getByTestId('qr-template-card-tent-A4'),
    ).not.toBeVisible();

    // All filter → back to 6.
    await page.getByTestId('qr-template-filter-all').click();
    await expect(page.getByTestId('qr-template-card-tent-A4')).toBeVisible();
    await expect(page.getByTestId('qr-template-card-poster-A3')).toBeVisible();
    await expect(page.getByTestId('qr-template-card-decal')).toBeVisible();
  });

  // ── Functional: click Download triggers PDF download ─────────────────────

  test('functional: click Download triggers PDF download', async ({ page }) => {
    const { menu } = await seedStarterAndOpenQr(page);
    await page.getByTestId('editor-qr-templates-btn').click();

    await page.getByTestId('qr-template-card-booklet').click();

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('qr-template-picker-download').click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/^qr-.*\.pdf$/);

    // Verify the download URL hits the QR API with PDF format.
    const downloadUrl = download.url();
    expect(downloadUrl).toContain(`/api/qr/${menu.id}`);
    expect(downloadUrl).toContain('format=pdf');
    expect(downloadUrl).toContain('download=true');
  });

  // ── Functional: close button dismisses modal ─────────────────────────────

  test('functional: close button dismisses modal', async ({ page }) => {
    await seedStarterAndOpenQr(page);
    await page.getByTestId('editor-qr-templates-btn').click();

    const modal = page.getByTestId('qr-template-picker-modal');
    await expect(modal).toBeVisible();

    await page.getByTestId('qr-template-picker-close').click();
    await expect(modal).not.toBeVisible();
  });
});
