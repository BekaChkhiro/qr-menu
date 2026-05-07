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
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    // Trigger lazy-loaded / IntersectionObserver-revealed sections by scrolling
    // through the full page once before capturing. Without this the page height
    // grows mid-screenshot (Playwright's "two consecutive stable screenshots"
    // check then times out).
    await page.evaluate(async () => {
      const totalHeight = document.body.scrollHeight;
      const step = window.innerHeight;
      for (let y = 0; y < totalHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 50));
      }
      window.scrollTo(0, 0);
      await new Promise((r) => setTimeout(r, 100));
    });
    await expect(page).toHaveScreenshot(`landing-${testInfo.project.name}.png`, {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });
});
