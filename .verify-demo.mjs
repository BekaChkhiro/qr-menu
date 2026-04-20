import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 420, height: 900 } });

await page.goto('http://localhost:3000/m/demo-cafe', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);

await page.screenshot({
  path: '/tmp/qr-menu-tests/screenshots/demo-full.png',
  fullPage: true,
});

// Scroll to ribbons area
await page.evaluate(() => window.scrollTo(0, 600));
await page.waitForTimeout(500);
await page.screenshot({
  path: '/tmp/qr-menu-tests/screenshots/demo-scrolled.png',
  fullPage: false,
});

await browser.close();
console.log('screenshots done');
