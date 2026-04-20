import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 520, height: 1200 } });

await page.goto('http://localhost:3000/m/demo-cafe?v=footer', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

// Scroll to footer
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(500);
await page.screenshot({ path: '/tmp/qr-menu-tests/screenshots/footer.png', fullPage: false });

// Click "Allergen key" button and screenshot dialog
const btn = page.locator('button', { hasText: /ალერგენ|Allergen/ });
if (await btn.count()) {
  await btn.first().click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/qr-menu-tests/screenshots/allergen-dialog.png', fullPage: false });
}

await browser.close();
console.log('done');
