// Test for T9.1 Design Tokens Migration. Requires T9.2 (Playwright infra) to execute.
// Run: pnpm test:e2e tests/e2e/design-system/tokens.spec.ts

import { test, expect, type Page } from '@playwright/test';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Convert a 6-digit hex colour to the `rgb(r, g, b)` string that
 * `getComputedStyle().backgroundColor` (and similar properties) returns.
 */
function hexToRgb(hex: string): string {
  const cleaned = hex.replace('#', '');
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Compare two `rgb(r, g, b)` strings with per-channel tolerance.
 * HSL→RGB conversion by different engines rounds fractional values
 * differently, so we allow ±1 per channel.
 */
function rgbChannelsClose(actual: string, expected: string, tolerance = 1): boolean {
  const parse = (s: string) =>
    s
      .replace(/rgba?\(/, '')
      .replace(')', '')
      .split(',')
      .map((v) => parseInt(v.trim(), 10));

  const a = parse(actual);
  const e = parse(expected);
  if (a.length < 3 || e.length < 3) return false;
  return a.every((ch, i) => Math.abs(ch - e[i]) <= tolerance);
}

/**
 * Read `getComputedStyle(document.documentElement).getPropertyValue(varName)`
 * and return it trimmed.
 */
async function readCssVar(page: Page, varName: string): Promise<string> {
  return page.evaluate(
    (v) =>
      getComputedStyle(document.documentElement)
        .getPropertyValue(v)
        .trim(),
    varName,
  );
}

/**
 * Read `getComputedStyle(el).backgroundColor` for the *first* element
 * matching `selector`.
 */
async function readBgColor(page: Page, selector: string): Promise<string> {
  return page.evaluate(
    (sel) => getComputedStyle(document.querySelector(sel)!).backgroundColor,
    selector,
  );
}

/**
 * Read `getComputedStyle(el).borderRadius` for the *first* element
 * matching `selector`.
 */
async function readBorderRadius(page: Page, selector: string): Promise<string> {
  return page.evaluate(
    (sel) => getComputedStyle(document.querySelector(sel)!).borderRadius,
    selector,
  );
}

/**
 * Read `getComputedStyle(el).boxShadow` for the *first* element
 * matching `selector`.
 */
async function readBoxShadow(page: Page, selector: string): Promise<string> {
  return page.evaluate(
    (sel) => getComputedStyle(document.querySelector(sel)!).boxShadow,
    selector,
  );
}

/**
 * Read `getComputedStyle(el).fontVariantNumeric` for the *first* element
 * matching `selector`.
 */
async function readFontVariantNumeric(page: Page, selector: string): Promise<string> {
  return page.evaluate(
    (sel) => getComputedStyle(document.querySelector(sel)!).fontVariantNumeric,
    selector,
  );
}

// ── Spec ─────────────────────────────────────────────────────────────────────

test.describe('T9.1 — Design Tokens', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test/tokens');
    // Confirm the server-rendered root element is present before any assertions.
    await expect(page.getByTestId('tokens-showcase')).toBeVisible();
  });

  // ── 1. Visual baseline ──────────────────────────────────────────────────────

  test('visual: tokens showcase matches baseline', async ({ page }) => {
    // First run: generate with --update-snapshots. Subsequent runs: diff.
    await expect(page).toHaveScreenshot('tokens-showcase.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });

  // ── 2. Color tokens ─────────────────────────────────────────────────────────

  test('functional: color tokens resolve to expected HSL values', async ({ page }) => {
    // ── 2a. CSS variables exist on :root with correct HSL triplets ──────────
    //
    // The tokens are stored as bare HSL triplets (no "hsl()" wrapper) so that
    // Tailwind's `hsl(var(--token))` pattern works. We check the raw var value
    // rather than the computed colour so the assertion is Tailwind-config
    // independent and doesn't rely on the specific element carrying that class.

    const bg = await readCssVar(page, '--bg');
    expect(bg, '--bg CSS variable').toBe('40 14% 98%');

    const accent = await readCssVar(page, '--accent');
    expect(accent, '--accent CSS variable').toBe('18 51% 48%');

    const text = await readCssVar(page, '--text');
    expect(text, '--text CSS variable').toBe('240 6% 10%');

    const danger = await readCssVar(page, '--danger');
    expect(danger, '--danger CSS variable').toBe('3 51% 48%');

    // Also spot-check two more tokens while we have the route loaded.
    const success = await readCssVar(page, '--success');
    expect(success, '--success CSS variable').toBe('120 33% 37%');

    const warning = await readCssVar(page, '--warning');
    expect(warning, '--warning CSS variable').toBe('37 73% 42%');

    // ── 2b. Computed RGB values on elements that use these colours ──────────
    //
    // The showcase page's <main> has `bg-bg` (= background-color: hsl(var(--bg))).
    // We read the *computed* backgroundColor so we also verify that the Tailwind
    // mapping (`colors.bg: 'hsl(var(--bg))'`) is wired correctly end-to-end.

    const expectedBg = hexToRgb('#FAFAF9'); // rgb(250, 250, 249)
    const computedBg = await readBgColor(page, '[data-testid="tokens-showcase"]');
    expect(
      rgbChannelsClose(computedBg, expectedBg),
      `--bg computed backgroundColor: expected ~${expectedBg}, got ${computedBg}`,
    ).toBe(true);

    // The accent swatch div carries `bg-accent`.
    // The ColorSwatch component renders a div with aria-label="Color swatch for accent".
    const expectedAccent = hexToRgb('#B8633D'); // rgb(184, 99, 61)
    const computedAccent = await readBgColor(
      page,
      '[aria-label="Color swatch for accent"]',
    );
    expect(
      rgbChannelsClose(computedAccent, expectedAccent),
      `--accent computed backgroundColor: expected ~${expectedAccent}, got ${computedAccent}`,
    ).toBe(true);

    // Danger swatch.
    const expectedDanger = hexToRgb('#B8423D'); // rgb(184, 66, 61)
    const computedDanger = await readBgColor(
      page,
      '[aria-label="Color swatch for danger"]',
    );
    expect(
      rgbChannelsClose(computedDanger, expectedDanger),
      `--danger computed backgroundColor: expected ~${expectedDanger}, got ${computedDanger}`,
    ).toBe(true);
  });

  // ── 3. Border radius tokens ─────────────────────────────────────────────────

  test('functional: border radius tokens apply correct px values', async ({ page }) => {
    // The showcase renders one w-20 h-20 div per radius token, each carrying
    // the matching class (rounded-xs, rounded-sm, …, rounded-pill). We target
    // them by class. Note: multiple elements on the page may carry `rounded-md`
    // (e.g. shadcn/ui components) — we use the first match, which is the
    // dedicated swatch div in the Border Radius section.

    // xs → 4px
    const rxs = await readBorderRadius(page, '.rounded-xs');
    expect(rxs, '.rounded-xs borderRadius').toBe('4px');

    // sm → 6px
    const rsm = await readBorderRadius(page, '.rounded-sm');
    expect(rsm, '.rounded-sm borderRadius').toBe('6px');

    // md → 8px
    // NOTE: `.rounded-md` is also used by shadcn/ui with a different default (6px).
    // If this assertion fails it means the Tailwind config override for `rounded-md`
    // hasn't been applied — which is exactly the bug we want to catch.
    const rmd = await readBorderRadius(page, '.rounded-md');
    expect(rmd, '.rounded-md borderRadius').toBe('8px');

    // lg → 10px
    const rlg = await readBorderRadius(page, '.rounded-lg');
    expect(rlg, '.rounded-lg borderRadius').toBe('10px');

    // xl → 14px
    const rxl = await readBorderRadius(page, '.rounded-xl');
    expect(rxl, '.rounded-xl borderRadius').toBe('14px');

    // card alias → 12px
    const rcard = await readBorderRadius(page, '.rounded-card');
    expect(rcard, '.rounded-card borderRadius').toBe('12px');

    // pill → 9999px (spec value used in the page; browsers may report 9999px
    // or a clamped value equal to half the element's shorter dimension — we
    // accept both).
    const rpill = await readBorderRadius(page, '.rounded-pill');
    // A 80×80 element clamped pill = 40px per corner. Accept either the raw
    // CSS value or the clamped computed value.
    const pillIsValid =
      rpill === '9999px' ||
      rpill === '999px' ||
      // browsers clamp to half the element size; for our 80px square swatch that is 40px
      rpill === '40px';
    expect(pillIsValid, `.rounded-pill borderRadius should be 9999px or clamped (got ${rpill})`).toBe(true);
  });

  // ── 4. Box-shadow tokens ────────────────────────────────────────────────────

  test('functional: box-shadow tokens match spec values', async ({ page }) => {
    // The showcase renders one w-32 h-20 div per shadow token. We check the
    // most important level (`md`) in detail and do a presence check on `lg`.

    // md: 0 6px 18px rgba(0, 0, 0, 0.08)
    // Browsers normalise rgba alpha to 8 decimal places; we do a substring
    // check for the structural parts we can reliably assert.
    const shadowMd = await readBoxShadow(page, '.shadow-md');
    // Accept "none" as a failure signal (class not applying).
    expect(shadowMd, '.shadow-md boxShadow should not be "none"').not.toBe('none');
    // The shadow should contain the expected offsets and spread.
    expect(shadowMd, '.shadow-md should contain "0px 6px 18px"').toContain('0px 6px 18px');

    // xs: 0 1px 2px rgba(0, 0, 0, 0.06)
    const shadowXs = await readBoxShadow(page, '.shadow-xs');
    expect(shadowXs, '.shadow-xs boxShadow should not be "none"').not.toBe('none');
    expect(shadowXs, '.shadow-xs should contain "0px 1px 2px"').toContain('0px 1px 2px');

    // sm: 0 2px 6px rgba(0, 0, 0, 0.06)
    const shadowSm = await readBoxShadow(page, '.shadow-sm');
    expect(shadowSm, '.shadow-sm boxShadow should not be "none"').not.toBe('none');
    expect(shadowSm, '.shadow-sm should contain "0px 2px 6px"').toContain('0px 2px 6px');

    // lg: 0 10px 30px rgba(0, 0, 0, 0.10)
    const shadowLg = await readBoxShadow(page, '.shadow-lg');
    expect(shadowLg, '.shadow-lg boxShadow should not be "none"').not.toBe('none');
    expect(shadowLg, '.shadow-lg should contain "0px 10px 30px"').toContain('0px 10px 30px');

    // xl: 0 20px 50px rgba(0, 0, 0, 0.12)
    const shadowXl = await readBoxShadow(page, '.shadow-xl');
    expect(shadowXl, '.shadow-xl boxShadow should not be "none"').not.toBe('none');
    expect(shadowXl, '.shadow-xl should contain "0px 20px 50px"').toContain('0px 20px 50px');
  });

  // ── 5. Tabular-nums utility ─────────────────────────────────────────────────

  test('functional: tabular-nums utility applies font-variant-numeric', async ({ page }) => {
    // The showcase renders <p class="text-h2 tabular-nums …"> elements in the
    // "With tabular-nums" comparison block. We assert that at least one of
    // these carries `font-variant-numeric: tabular-nums` in computed style.
    //
    // We also assert that the "Without tabular-nums" sibling uses `normal`
    // (set via inline style) — this confirms the *contrast* the page is
    // demonstrating is real.

    const withTabular = await readFontVariantNumeric(page, '.tabular-nums');
    expect(
      withTabular,
      '.tabular-nums element should have font-variant-numeric: tabular-nums',
    ).toBe('tabular-nums');

    // The "without" paragraph sets `fontVariantNumeric: 'normal'` as an inline
    // style; we reach it via a more specific selector.
    const withoutTabular = await page.evaluate(() => {
      // Find the paragraph in the "Without tabular-nums" block.
      const el = document.querySelector<HTMLElement>(
        '[style*="font-variant-numeric: normal"]',
      );
      if (!el) return null;
      return getComputedStyle(el).fontVariantNumeric;
    });
    expect(
      withoutTabular,
      'Paragraph with explicit normal style should have font-variant-numeric: normal',
    ).toBe('normal');
  });

  // ── 6. Type scale tokens ────────────────────────────────────────────────────

  test('functional: type scale tokens apply correct font sizes', async ({ page }) => {
    // Verify a representative subset of the 7-level type scale.
    // The showcase renders each level as a span with class `text-{name}`.

    const cases: Array<{ selector: string; expectedSize: string; name: string }> = [
      { selector: '.text-display', expectedSize: '32px', name: 'display' },
      { selector: '.text-h1',      expectedSize: '22px', name: 'h1' },
      { selector: '.text-h2',      expectedSize: '16px', name: 'h2' },
      { selector: '.text-body',    expectedSize: '13px', name: 'body' },
      { selector: '.text-caption', expectedSize: '12px', name: 'caption' },
    ];

    for (const { selector, expectedSize, name } of cases) {
      const fontSize = await page.evaluate(
        (sel) => getComputedStyle(document.querySelector(sel)!).fontSize,
        selector,
      );
      expect(
        fontSize,
        `text-${name} font-size should be ${expectedSize}`,
      ).toBe(expectedSize);
    }

    // overline is 10.5px — browsers typically report this as "10.5px".
    const overlineFontSize = await page.evaluate(
      () =>
        getComputedStyle(document.querySelector('.text-overline')!).fontSize,
    );
    expect(
      overlineFontSize,
      'text-overline font-size should be 10.5px',
    ).toBe('10.5px');
  });

  // ── 7. Showcase page structure ──────────────────────────────────────────────

  test('functional: showcase page renders all token sections', async ({ page }) => {
    // Sanity-check that all five sections exist — catches a broken import or
    // an accidental early return in the server component.
    await expect(page.getByRole('region', { name: /colors/i })).toBeVisible();
    await expect(page.getByRole('region', { name: /border radius/i })).toBeVisible();
    await expect(page.getByRole('region', { name: /shadows/i })).toBeVisible();
    await expect(page.getByRole('region', { name: /typography/i })).toBeVisible();
    await expect(page.getByRole('region', { name: /tabular numbers/i })).toBeVisible();

    // All 16 colour swatches should be present (aria-label pattern).
    const swatches = page.locator('[aria-label^="Color swatch for"]');
    await expect(swatches).toHaveCount(16);

    // The page title should identify the task.
    await expect(page.getByRole('heading', { name: /section h design tokens/i })).toBeVisible();
  });
});
