import { test, expect } from '@playwright/test';

test.describe('smoke: landing page', () => {
  test('functional: loads and has expected title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Digital Menu/i);
  });

  test('functional: hero demo controls update the phone preview', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('[data-testid="marketing-hero-demo-menu"]:visible').first()).toHaveAttribute(
      'data-active',
      'true',
    );

    const qrButton = page.locator('[data-testid="marketing-hero-demo-qr"]:visible').first();
    await qrButton.click();
    await expect(qrButton).toHaveAttribute('data-active', 'true');
    await expect(page.locator('[data-testid="marketing-hero-phone-screen"][data-demo-mode="qr"]').first()).toBeAttached();

    const analyticsButton = page.locator('[data-testid="marketing-hero-demo-analytics"]:visible').first();
    await analyticsButton.click();
    await expect(analyticsButton).toHaveAttribute('data-active', 'true');
    await expect(
      page.locator('[data-testid="marketing-hero-phone-screen"][data-demo-mode="analytics"]').first(),
    ).toBeAttached();
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
