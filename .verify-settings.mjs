import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1400, height: 1000 } });
const page = await context.newPage();

// Login
await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
await page.fill('input[type="email"]', 'playwright-test@local.dev');
await page.fill('input[type="password"]', 'TestPass123!');
await page.click('button[type="submit"]');
await page.waitForURL(/\/admin/, { timeout: 15000 });

// Navigate to menu settings
await page.goto('http://localhost:3000/admin/menus/cmo73lbm100012ffobxbhrdv6', {
  waitUntil: 'networkidle',
});
await page.waitForTimeout(1000);

// Click Settings tab
await page.locator('button[role="tab"]', { hasText: /Settings/i }).first().click();
await page.waitForTimeout(800);

// Screenshot: collapsed state (layout open by default)
await page.screenshot({
  path: '/tmp/qr-menu-tests/screenshots/settings-layout.png',
  fullPage: false,
});

// Expand other sections one by one
const sections = ['Branding', 'Typography', 'Languages', 'Display', 'Location'];
for (const s of sections) {
  try {
    await page.locator('button', { hasText: s }).first().click();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: `/tmp/qr-menu-tests/screenshots/settings-${s.toLowerCase()}.png`,
      fullPage: false,
    });
    // Close it again
    await page.locator('button', { hasText: s }).first().click();
    await page.waitForTimeout(300);
  } catch (e) {
    console.log(`skip ${s}: ${e.message}`);
  }
}

// Final full page showing all collapsed
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(400);
await page.screenshot({
  path: '/tmp/qr-menu-tests/screenshots/settings-overview.png',
  fullPage: true,
});

await browser.close();
console.log('done');
