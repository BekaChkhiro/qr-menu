// Test for T10.3 Feedback Primitives (Toast, Banner, Empty State, Skeleton,
// Spinner, Progress).
// Run:      pnpm test:e2e tests/e2e/components/feedback.spec.ts
// Baseline: pnpm test:e2e:update tests/e2e/components/feedback.spec.ts

import { test, expect, type Page } from '@playwright/test';

const SHOWCASE_URL = '/test/components/feedback';

// ── Helpers ──────────────────────────────────────────────────────────────────

async function readActionClicks(page: Page): Promise<number> {
  const text = await page.getByTestId('toast-action-count').textContent();
  const match = text?.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

async function readProgressValue(page: Page): Promise<number> {
  const text = await page.getByTestId('progress-value-label').textContent();
  const match = text?.match(/\d+/);
  return match ? parseInt(match[0], 10) : -1;
}

// ── Suite ────────────────────────────────────────────────────────────────────

test.describe('T10.3 — Feedback Primitives', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(SHOWCASE_URL);
    await expect(page.getByTestId('feedback-showcase')).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
  });

  // ── 1. Visual baseline ─────────────────────────────────────────────────────

  test('visual: feedback showcase matches baseline', async ({ page }, testInfo) => {
    // Desktop-only — mobile variants are covered in Phase 17.
    test.skip(testInfo.project.name === 'mobile', 'Desktop-only visual baseline');

    // Disable CSS animations so shimmer / spinner / pulse frames do not diff.
    await page.addStyleTag({
      content:
        '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }',
    });

    await expect(page).toHaveScreenshot('feedback-showcase.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });

  // ── 2. Structure smoke test ────────────────────────────────────────────────

  test('functional: showcase renders all major sections', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /feedback primitives/i }),
    ).toBeVisible();
    await expect(page.getByRole('region', { name: /toasts/i })).toBeVisible();
    await expect(page.getByRole('region', { name: /^banners$/i })).toBeVisible();
    await expect(page.getByRole('region', { name: /empty states/i })).toBeVisible();
    await expect(page.getByRole('region', { name: /skeletons/i })).toBeVisible();
    await expect(page.getByRole('region', { name: /spinners/i })).toBeVisible();
    await expect(page.getByRole('region', { name: /^progress$/i })).toBeVisible();
    await expect(page.getByTestId('interactive-section')).toBeVisible();
  });

  // ── 3. Toast triggers render toast bodies ──────────────────────────────────

  test('functional: triggering a toast renders its body', async ({ page }) => {
    await page.getByTestId('trigger-toast-success').click();
    const toast = page.getByTestId('toast-success');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('Menu saved');
    await expect(toast).toContainText('Your changes are live');
  });

  // ── 4. Toast auto-dismisses after its duration ─────────────────────────────

  test('functional: toast auto-dismisses after its duration', async ({ page }) => {
    await page.getByTestId('trigger-toast-short').click();
    const toast = page.getByTestId('toast-info');
    await expect(toast).toBeVisible();

    // Duration is 1s — give it 3s to animate out before failing.
    await expect(toast).toBeHidden({ timeout: 3000 });
  });

  // ── 5. Toast action button fires handler ───────────────────────────────────

  test('functional: toast action button fires handler and dismisses', async ({ page }) => {
    const before = await readActionClicks(page);

    await page.getByTestId('trigger-toast-error').click();
    const toast = page.getByTestId('toast-error');
    await expect(toast).toBeVisible();

    await page.getByTestId('toast-error-action').click();

    const after = await readActionClicks(page);
    expect(
      after,
      'Toast action click should increment the counter by 1',
    ).toBe(before + 1);

    // Action click also dismisses the toast.
    await expect(toast).toBeHidden({ timeout: 2000 });
  });

  // ── 6. Toast close button dismisses ────────────────────────────────────────

  test('functional: toast close (X) button dismisses the toast', async ({ page }) => {
    await page.getByTestId('trigger-toast-info').click();
    const toast = page.getByTestId('toast-info');
    await expect(toast).toBeVisible();

    await page.getByTestId('toast-info-close').click();
    await expect(toast).toBeHidden({ timeout: 2000 });
  });

  // ── 7. Banner close button dismisses and calls onDismiss ───────────────────

  test('functional: dismissible banner close button hides the banner', async ({ page }) => {
    // Make sure we start from the rendered (non-dismissed) state.
    await page.getByTestId('banner-reset').click();
    const banner = page.getByTestId('dismissible-banner');
    await expect(banner).toBeVisible();

    await banner.getByRole('button', { name: /dismiss/i }).click();

    // Banner removed from the DOM and replaced by the marker.
    await expect(banner).toHaveCount(0);
    await expect(page.getByTestId('banner-dismissed-marker')).toBeVisible();
  });

  // ── 8. Progress aria-valuenow reflects the current value ───────────────────

  test('functional: progress aria-valuenow matches value and updates on change', async ({ page }) => {
    const progress = page.getByTestId('interactive-progress').getByRole('progressbar');

    // Starting value = 40 (per interactive section).
    await expect(progress).toHaveAttribute('aria-valuenow', '40');
    expect(await readProgressValue(page)).toBe(40);

    // Increment twice → 60.
    await page.getByTestId('progress-inc').click();
    await page.getByTestId('progress-inc').click();
    await expect(progress).toHaveAttribute('aria-valuenow', '60');
    expect(await readProgressValue(page)).toBe(60);

    // Decrement four times → 20.
    for (let i = 0; i < 4; i++) {
      await page.getByTestId('progress-dec').click();
    }
    await expect(progress).toHaveAttribute('aria-valuenow', '20');
    expect(await readProgressValue(page)).toBe(20);

    // Progressbar exposes min/max bounds.
    await expect(progress).toHaveAttribute('aria-valuemin', '0');
    await expect(progress).toHaveAttribute('aria-valuemax', '100');
  });

  // ── 9. Indeterminate progress exposes aria-busy, no aria-valuenow ──────────

  test('functional: indeterminate progress has aria-busy and no aria-valuenow', async ({ page }) => {
    // The showcase renders an indeterminate Progress inside the Progress section.
    const progressSection = page.getByRole('region', { name: /^progress$/i });
    const indeterminate = progressSection
      .getByRole('progressbar', { name: /loading/i })
      .first();

    await expect(indeterminate).toBeVisible();
    await expect(indeterminate).toHaveAttribute('aria-busy', 'true');
    await expect(indeterminate).not.toHaveAttribute('aria-valuenow', /.+/);
  });

  // ── 10. Spinner exposes role="status" and accessible label ────────────────

  test('functional: spinner has role=status and accessible label', async ({ page }) => {
    const spinnersSection = page.getByRole('region', { name: /spinners/i });
    const firstSpinner = spinnersSection.getByRole('status').first();

    await expect(firstSpinner).toBeVisible();
    await expect(firstSpinner).toHaveAttribute('aria-label', /loading/i);
  });

  // ── 11. Empty state renders title and CTA action ───────────────────────────

  test('functional: large empty state renders title, description, and CTA', async ({ page }) => {
    const emptySection = page.getByRole('region', { name: /empty states/i });

    await expect(
      emptySection.getByText('No menus yet', { exact: true }),
    ).toBeVisible();
    await expect(
      emptySection.getByText(/create your first menu/i),
    ).toBeVisible();
    await expect(
      emptySection.getByRole('button', { name: /create menu/i }),
    ).toBeVisible();

    // Small variant shows title but no button.
    await expect(
      emptySection.getByText('No results', { exact: true }),
    ).toBeVisible();
  });

  // ── 12. Banner tones expose correct role ───────────────────────────────────

  test('functional: warning and error banners use role=alert; success/info use role=status', async ({ page }) => {
    const bannersSection = page.getByRole('region', { name: /^banners$/i });

    // Warning and error — role=alert (live region announces immediately).
    await expect(
      bannersSection.locator('[data-tone="warning"][role="alert"]'),
    ).toHaveCount(1);
    await expect(
      bannersSection.locator('[data-tone="error"][role="alert"]'),
    ).toHaveCount(1);

    // Info and success — role=status (polite live region).
    await expect(
      bannersSection.locator('[data-tone="info"][role="status"]'),
    ).toHaveCount(1);
    await expect(
      bannersSection.locator('[data-tone="success"][role="status"]'),
    ).toHaveCount(1);
  });
});
