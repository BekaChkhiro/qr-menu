// Test for T10.7 Utility Primitives (Kbd, Divider, CodeBlock).
// Run:      pnpm test:e2e tests/e2e/components/utility.spec.ts
// Baseline: pnpm test:e2e:update tests/e2e/components/utility.spec.ts

import { test, expect } from '@playwright/test';

const SHOWCASE_URL = '/test/components/utility';

test.describe('T10.7 — Utility Primitives', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(SHOWCASE_URL);
    await expect(page.getByTestId('utility-showcase')).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
  });

  // ── 1. Visual baseline ─────────────────────────────────────────────────────

  test('visual: utility showcase matches baseline', async ({ page }, testInfo) => {
    // Desktop-only — mobile variants are covered in Phase 17.
    test.skip(testInfo.project.name === 'mobile', 'Desktop-only visual baseline');

    // Disable any transitions so the copy-state flip does not diff between runs.
    await page.addStyleTag({
      content:
        '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }',
    });

    await expect(page).toHaveScreenshot('utility-showcase.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });

  // ── 2. Structure smoke test ────────────────────────────────────────────────

  test('functional: showcase renders all major sections', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /utility primitives/i }),
    ).toBeVisible();
    await expect(page.getByRole('region', { name: /^kbd$/i })).toBeVisible();
    await expect(page.getByRole('region', { name: /^dividers$/i })).toBeVisible();
    await expect(page.getByRole('region', { name: /^code block$/i })).toBeVisible();
  });

  // ── 3. Kbd uses semantic styling (monospace, border) ───────────────────────

  test('functional: Kbd renders with monospace font and a bottom border accent', async ({ page }) => {
    const kbdSection = page.getByRole('region', { name: /^kbd$/i });

    // The single-key "⌘" sample (first Kbd inside the showcase row).
    const firstKbd = kbdSection.locator('span', { hasText: /^⌘$/ }).first();
    await expect(firstKbd).toBeVisible();

    const fontFamily = await firstKbd.evaluate(
      (el) => window.getComputedStyle(el).fontFamily,
    );
    expect(fontFamily).toMatch(/mono|Menlo|Consolas|SFMono/i);

    // 2px pressed-key bottom border is the signature of the Kbd spec.
    const bottomWidth = await firstKbd.evaluate(
      (el) => window.getComputedStyle(el).borderBottomWidth,
    );
    expect(bottomWidth).toBe('2px');
  });

  // ── 4. Divider exposes role="separator" with correct orientation ───────────

  test('functional: Divider uses role=separator with correct orientation', async ({ page }) => {
    const dividerSection = page.getByRole('region', { name: /^dividers$/i });

    // Horizontal dividers exist (the plain + label variants).
    const horizontals = dividerSection.locator(
      '[role="separator"][aria-orientation="horizontal"]',
    );
    await expect(horizontals.first()).toBeVisible();
    expect(await horizontals.count()).toBeGreaterThanOrEqual(2);

    // Labeled divider is accessible via its aria-label.
    await expect(
      dividerSection.locator('[role="separator"][aria-label="or"]'),
    ).toBeVisible();

    // Vertical dividers render in the left/right/end row.
    const verticals = dividerSection.locator(
      '[role="separator"][aria-orientation="vertical"]',
    );
    expect(await verticals.count()).toBe(2);
  });

  // ── 5. CodeBlock header surfaces the language label ───────────────────────

  test('functional: CodeBlock renders the language label in uppercase', async ({ page }) => {
    const codeSection = page.getByRole('region', { name: /^code block$/i });
    const firstBlock = codeSection.getByTestId('code-block').first();

    await expect(firstBlock).toBeVisible();
    await expect(firstBlock).toContainText(/window\.DigitalMenu\.init/);
    // Language label renders uppercase via CSS; the source is "html".
    await expect(firstBlock).toContainText(/html/i);
  });

  // ── 6. CodeBlock copy button writes to the clipboard ───────────────────────

  test('functional: CodeBlock copy button writes the code to the clipboard', async ({ page, context, browserName }, testInfo) => {
    // Mobile WebKit gates the clipboard API behind an active user gesture that
    // Playwright's synthetic clicks don't satisfy; the write + readback round
    // trip only works reliably on desktop Chromium. Full mobile coverage lives
    // in Phase 17.
    test.skip(testInfo.project.name === 'mobile', 'Clipboard round trip is desktop-only');

    if (browserName === 'chromium') {
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    }

    const codeSection = page.getByRole('region', { name: /^code block$/i });
    const firstBlock = codeSection.getByTestId('code-block').first();
    const copyButton = firstBlock.getByTestId('code-block-copy');

    await expect(copyButton).toBeVisible();
    await expect(copyButton).toHaveAttribute('data-copied', 'false');

    await copyButton.click();

    // Button flips to the "Copied" affordance.
    await expect(copyButton).toHaveAttribute('data-copied', 'true');
    await expect(copyButton).toHaveAccessibleName(/copied/i);

    // Clipboard now holds the exact snippet that the component was given.
    const clipboardContents = await page.evaluate(() =>
      navigator.clipboard.readText(),
    );
    expect(clipboardContents).toContain('window.DigitalMenu.init');
    expect(clipboardContents).toContain('slug: "cafelinville"');
    expect(clipboardContents.trim().startsWith('<script>')).toBe(true);
    expect(clipboardContents.trim().endsWith('</script>')).toBe(true);
  });

  // ── 7. hideCopy prop removes the copy button ───────────────────────────────

  test('functional: CodeBlock with hideCopy does not render a copy button', async ({ page }) => {
    const codeSection = page.getByRole('region', { name: /^code block$/i });
    const blocks = codeSection.getByTestId('code-block');

    // The third block is rendered with hideCopy.
    const thirdBlock = blocks.nth(2);
    await expect(thirdBlock).toBeVisible();
    await expect(thirdBlock).toContainText('@digital-menu/sdk');
    await expect(thirdBlock.getByTestId('code-block-copy')).toHaveCount(0);
  });
});
