// Test for T10.4 Data Display components.
// Run:  pnpm test:e2e tests/e2e/components/data-display.spec.ts
// Baseline: pnpm test:e2e:update tests/e2e/components/data-display.spec.ts

import { test, expect } from '@playwright/test';

const SHOWCASE_URL = '/test/components/data-display';

// ── Helpers ──────────────────────────────────────────────────────────────────

async function readActiveTab(page: import('@playwright/test').Page): Promise<string> {
  const text = await page.getByTestId('tabs-active-value').textContent();
  const match = text?.match(/Active:\s*(\S+)/);
  return match?.[1] ?? '';
}

async function readPaginationPage(page: import('@playwright/test').Page): Promise<number> {
  const text = await page.getByTestId('pagination-page').textContent();
  const match = text?.match(/\d+/);
  return match ? parseInt(match[0], 10) : -1;
}

async function readSortDirection(page: import('@playwright/test').Page): Promise<string> {
  const text = await page.getByTestId('sort-direction').textContent();
  const match = text?.match(/Direction:\s*(\S+)/);
  return match?.[1] ?? '';
}

// ── Suite ─────────────────────────────────────────────────────────────────────

test.describe('T10.4 — Data Display', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(SHOWCASE_URL);
    await expect(page.getByTestId('data-display-showcase')).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
  });

  // ── 1. Visual baseline ─────────────────────────────────────────────────────

  test('visual: data-display showcase matches baseline', async ({ page }, testInfo) => {
    // Desktop-only — the responsive behaviour will be covered in Phase 17.
    test.skip(testInfo.project.name === 'mobile', 'Desktop-only visual baseline');

    await page.addStyleTag({
      content: '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }',
    });

    await expect(page).toHaveScreenshot('data-display-showcase.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });

  // ── 2. Structure smoke test ───────────────────────────────────────────────

  test('functional: showcase renders all major sections', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Data Display' })).toBeVisible();
    await expect(page.getByRole('region', { name: /badges.*tones.*shapes/i })).toBeVisible();
    await expect(page.getByRole('region', { name: /status pills/i })).toBeVisible();
    await expect(page.getByRole('region', { name: /tags.*chips/i })).toBeVisible();
    await expect(page.getByRole('region', { name: /avatars/i })).toBeVisible();
    await expect(page.getByRole('region', { name: /breadcrumbs/i })).toBeVisible();
    await expect(page.getByRole('region', { name: /^tabs$/i })).toBeVisible();
    await expect(page.getByRole('region', { name: /stat cards/i })).toBeVisible();
    await expect(page.getByRole('region', { name: /pagination/i })).toBeVisible();
    await expect(page.getByRole('region', { name: /sortable table headers/i })).toBeVisible();
    await expect(page.getByTestId('interactive-section')).toBeVisible();
  });

  // ── 3. Tabs — keyboard arrow-key navigation ───────────────────────────────

  test('functional: tabs respond to ArrowRight / ArrowLeft keyboard navigation', async ({ page }) => {
    // Start: active = "content" (default value in interactive section).
    expect(await readActiveTab(page)).toBe('content');

    // Focus the currently-active tab, then press ArrowRight.
    const contentTab = page.getByTestId('tab-content');
    await contentTab.focus();
    await expect(contentTab).toBeFocused();

    // Radix Tabs: ArrowRight activates the next tab (automatic activation).
    await page.keyboard.press('ArrowRight');
    await expect(page.getByTestId('tab-branding')).toBeFocused();
    expect(await readActiveTab(page)).toBe('branding');

    await page.keyboard.press('ArrowRight');
    await expect(page.getByTestId('tab-languages')).toBeFocused();
    expect(await readActiveTab(page)).toBe('languages');

    // ArrowLeft walks back.
    await page.keyboard.press('ArrowLeft');
    await expect(page.getByTestId('tab-branding')).toBeFocused();
    expect(await readActiveTab(page)).toBe('branding');

    // Enter / Space also activates — confirm Space doesn't break state.
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Space');
    expect(await readActiveTab(page)).toBe('languages');
  });

  // ── 4. Tabs — click activates and updates aria-selected ───────────────────

  test('functional: clicking a tab updates active state and aria-selected', async ({ page }) => {
    await page.getByTestId('tab-analytics').click();
    expect(await readActiveTab(page)).toBe('analytics');

    // Radix sets data-state="active" and aria-selected="true" on the active trigger.
    await expect(page.getByTestId('tab-analytics')).toHaveAttribute('data-state', 'active');
    await expect(page.getByTestId('tab-analytics')).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByTestId('tab-content')).toHaveAttribute('data-state', 'inactive');
  });

  // ── 5. Pagination — prev/next buttons update page state ───────────────────

  test('functional: pagination next button advances the current page', async ({ page }) => {
    // Start at page 1.
    expect(await readPaginationPage(page)).toBe(1);

    // Scope the locator to the interactive section to avoid ambiguity with
    // the static pagination examples rendered earlier on the page.
    const interactive = page.getByTestId('interactive-section');
    const nextBtn = interactive.getByTestId('pagination-next');
    await nextBtn.click();
    expect(await readPaginationPage(page)).toBe(2);

    await nextBtn.click();
    expect(await readPaginationPage(page)).toBe(3);
  });

  test('functional: pagination prev button goes back and is disabled on page 1', async ({ page }) => {
    const interactive = page.getByTestId('interactive-section');
    const nextBtn = interactive.getByTestId('pagination-next');
    const prevBtn = interactive.getByTestId('pagination-prev');

    // Prev is disabled when current page is 1.
    await expect(prevBtn).toBeDisabled();

    // Advance, then step back.
    await nextBtn.click();
    await nextBtn.click();
    expect(await readPaginationPage(page)).toBe(3);

    await expect(prevBtn).toBeEnabled();
    await prevBtn.click();
    expect(await readPaginationPage(page)).toBe(2);

    await prevBtn.click();
    expect(await readPaginationPage(page)).toBe(1);
    await expect(prevBtn).toBeDisabled();
  });

  test('functional: clicking a numbered page jumps directly to that page', async ({ page }) => {
    const interactive = page.getByTestId('interactive-section');
    // At page=1 of 12, buildPageRange shows: [1, 2, …, 12].
    // Page 2 is always in view; clicking it should jump to 2.
    await interactive.getByRole('button', { name: 'Page 2' }).click();
    expect(await readPaginationPage(page)).toBe(2);

    // Now page=2 is current, range becomes [1, 2, 3, …, 12]. Click 12 to jump
    // to the far end in a single click (validates non-adjacent navigation).
    await interactive.getByRole('button', { name: 'Page 12' }).click();
    expect(await readPaginationPage(page)).toBe(12);
  });

  // ── 6. Sort header — click cycles direction ────────────────────────────────

  test('functional: sort header click cycles unsorted → asc → desc → unsorted', async ({ page }) => {
    const btn = page.getByTestId('sort-name');

    // Initial state: unsorted.
    expect(await readSortDirection(page)).toBe('none');
    await expect(btn).toHaveAttribute('aria-sort', 'none');

    // 1st click → ascending.
    await btn.click();
    expect(await readSortDirection(page)).toBe('asc');
    await expect(btn).toHaveAttribute('aria-sort', 'ascending');

    // 2nd click → descending.
    await btn.click();
    expect(await readSortDirection(page)).toBe('desc');
    await expect(btn).toHaveAttribute('aria-sort', 'descending');

    // 3rd click → back to unsorted.
    await btn.click();
    expect(await readSortDirection(page)).toBe('none');
    await expect(btn).toHaveAttribute('aria-sort', 'none');
  });

  // ── 7. Sort header — keyboard activation (Enter/Space) ────────────────────

  test('functional: sort header responds to keyboard activation', async ({ page }) => {
    const btn = page.getByTestId('sort-name');
    await btn.focus();
    await expect(btn).toBeFocused();

    await page.keyboard.press('Enter');
    expect(await readSortDirection(page)).toBe('asc');

    await page.keyboard.press('Space');
    expect(await readSortDirection(page)).toBe('desc');
  });
});
