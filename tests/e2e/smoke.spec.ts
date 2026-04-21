import { test, expect } from '@playwright/test';

test.describe('smoke: landing page', () => {
  test('functional: loads and has expected title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Digital Menu/i);
  });

  test('visual: landing matches baseline', async ({ page }, testInfo) => {
    await page.goto('/');
    // Wait for fonts to settle so text rendering is stable across runs.
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot(`landing-${testInfo.project.name}.png`, {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });
});
