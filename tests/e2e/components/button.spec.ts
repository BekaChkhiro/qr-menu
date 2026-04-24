// Test for T10.1 Button & Icon Button component.
// Run:  pnpm test:e2e tests/e2e/components/button.spec.ts
// Baseline: pnpm test:e2e:update tests/e2e/components/button.spec.ts

import { test, expect } from '@playwright/test';

const SHOWCASE_URL = '/test/components/buttons';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Read the text content of [data-testid="click-count"] and parse the integer
 * that follows "Clicks: ".
 */
async function readClickCount(page: import('@playwright/test').Page): Promise<number> {
  const text = await page.getByTestId('click-count').textContent();
  const match = text?.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

// ── Suite ─────────────────────────────────────────────────────────────────────

test.describe('T10.1 — Button & Icon Button', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(SHOWCASE_URL);
    // Confirm the page has loaded before any assertions.
    await expect(page.getByTestId('buttons-showcase')).toBeVisible();
    // Wait for fonts so the visual baseline is stable.
    await page.evaluate(() => document.fonts.ready);
  });

  // ── 1. Visual baseline ────────────────────────────────────────────────────

  test('visual: buttons showcase matches baseline', async ({ page }, testInfo) => {
    // Skip on mobile — this spec targets the desktop artboard only.
    // The responsive behaviour is covered in Phase 17 (mobile.spec.ts).
    test.skip(testInfo.project.name === 'mobile', 'Desktop-only visual baseline');

    // Disable CSS animations so the loading spinner does not cause diff noise.
    await page.addStyleTag({
      content: '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }',
    });

    await expect(page).toHaveScreenshot('buttons-showcase.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });

  // ── 2. Page structure ─────────────────────────────────────────────────────

  test('functional: showcase renders all major sections', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /button.*icon button/i })).toBeVisible();
    await expect(page.getByRole('region', { name: /variants.*sizes.*states/i })).toBeVisible();
    await expect(page.getByRole('region', { name: /focus states/i })).toBeVisible();
    await expect(page.getByRole('region', { name: /with leading icon/i })).toBeVisible();
    await expect(page.getByRole('region', { name: /icon-only buttons/i })).toBeVisible();
    await expect(page.getByRole('region', { name: /loading state/i })).toBeVisible();
    await expect(page.getByRole('region', { name: /backwards compatibility/i })).toBeVisible();
    await expect(page.getByTestId('interactive-section')).toBeVisible();
  });

  // ── 3. Click handler fires ────────────────────────────────────────────────

  test('functional: click increments counter', async ({ page }) => {
    const btn = page.getByTestId('btn-click');
    await expect(btn).toBeVisible();

    const before = await readClickCount(page);
    await btn.click();
    const after = await readClickCount(page);

    expect(after, 'Counter should increment by 1 on each click').toBe(before + 1);

    // Click again to confirm it keeps incrementing (not a one-shot toggle).
    await btn.click();
    expect(await readClickCount(page)).toBe(before + 2);
  });

  // ── 4. Disabled button prevents click ────────────────────────────────────

  test('functional: disabled button does not fire click handler', async ({ page }) => {
    const btn = page.getByTestId('btn-disabled');

    // The button must be rendered and carry the HTML disabled attribute.
    await expect(btn).toBeDisabled();

    const before = await readClickCount(page);

    // Force:true bypasses Playwright's "element is disabled" guard so we can
    // assert that even a forced pointer event has no effect on the counter.
    // This validates the CSS `pointer-events: none` + HTML `disabled` combo.
    await btn.click({ force: true });

    const after = await readClickCount(page);
    expect(after, 'Disabled button click must not increment the counter').toBe(before);
  });

  // ── 5. Loading state ──────────────────────────────────────────────────────

  test('functional: loading button exposes correct ARIA and is non-interactive', async ({ page }) => {
    const btn = page.getByTestId('btn-loading');
    await expect(btn).toBeVisible();

    // 5a. aria-busy is set — screen readers announce the loading state.
    await expect(btn).toHaveAttribute('aria-busy', 'true');

    // 5b. The button is disabled (loading prop sets disabled=true on <button>).
    await expect(btn).toBeDisabled();

    // 5c. The spinner span (aria-hidden) is present inside the button.
    //     The Spinner component renders a <span aria-hidden="true"> with an
    //     inline `animation: cl-spin …` style.  We locate it as a child of
    //     the loading button.
    const spinner = btn.locator('span[aria-hidden="true"]');
    await expect(spinner).toBeVisible();

    // 5d. The text label is still rendered so the user can read what is loading.
    await expect(btn).toContainText('Saving');

    // 5e. Clicking does not change the counter (loading implies disabled).
    const before = await readClickCount(page);
    await btn.click({ force: true });
    expect(await readClickCount(page), 'Loading button click must not increment counter').toBe(before);
  });

  // ── 6. Focus-visible ring ─────────────────────────────────────────────────

  test('functional: focus-visible ring classes are present on button element', async ({ page }) => {
    // Navigate into the interactive section and Tab onto the first focusable
    // button (btn-click).  We then confirm:
    //   a) the element receives DOM focus
    //   b) the Tailwind utility classes that produce the ring are in className
    //
    // We check classes rather than computed ring-color because the ring only
    // renders in the :focus-visible pseudo-state which requires keyboard
    // navigation.  Asserting the classes are present verifies the component
    // author has not accidentally removed them from the CVA base.

    const btn = page.getByTestId('btn-click');

    // Scroll the button into view and focus it programmatically via JS
    // (simulates what keyboard focus would trigger without needing exact Tab
    // sequencing through the full page).
    await btn.focus();
    await expect(btn).toBeFocused();

    // Confirm the focus-ring utility classes from the CVA base string are
    // present.  If a refactor removes them this test will catch it.
    const className = await btn.getAttribute('class') ?? '';
    expect(className, 'Button should include focus-visible:ring-2').toContain('focus-visible:ring-2');
    expect(className, 'Button should include focus-visible:ring-accent').toContain('focus-visible:ring-accent');
  });

  // ── 7. Icon-only buttons ──────────────────────────────────────────────────

  test('functional: icon-only buttons have aria-label and are square', async ({ page }) => {
    // The showcase renders several icon-only buttons with aria-label.
    // Confirm the Add button (primary/md/iconOnly) is present and labelled.
    // Use exact: true so "Add item" buttons (which also contain "Add") don't
    // match — the icon-only button has aria-label="Add" verbatim.
    const addBtn = page.getByRole('button', { name: 'Add', exact: true });
    await expect(addBtn).toBeVisible();

    // Square: width should equal height (within 1px for sub-pixel rendering).
    const box = await addBtn.boundingBox();
    expect(box, 'Icon-only button bounding box should exist').not.toBeNull();
    if (box) {
      expect(
        Math.abs(box.width - box.height),
        `Icon-only button should be square (got ${box.width}×${box.height})`,
      ).toBeLessThanOrEqual(1);
    }
  });

  // ── 8. Leading icon renders ───────────────────────────────────────────────

  test('functional: leading icon renders as SVG inside button', async ({ page }) => {
    // "Add item" primary/md button with leadingIcon={Plus} — from the Leading
    // Icon section.  The SVG should be aria-hidden and present as first child.
    const btn = page.getByRole('button', { name: /add item/i }).first();
    await expect(btn).toBeVisible();

    const svg = btn.locator('svg[aria-hidden="true"]');
    await expect(svg).toBeVisible();
  });

  // ── 9. Backwards-compat aliases render ───────────────────────────────────

  test('functional: variant="default" renders as primary style', async ({ page }) => {
    // The backwards-compat section renders a button with variant="default".
    // It should look and behave like primary — we just confirm it is not
    // hidden or erroring (a broken import would collapse the section).
    const btn = page.getByRole('button', { name: /save changes/i });
    await expect(btn).toBeVisible();
    await expect(btn).toBeEnabled();
  });
});
