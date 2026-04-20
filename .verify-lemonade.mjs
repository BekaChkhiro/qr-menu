import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 520, height: 1200 } });

await page.goto('http://localhost:3000/m/demo-cafe?v=lemo', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

// Scroll down to cold drinks
await page.evaluate(() => {
  const els = document.querySelectorAll('h2');
  for (const el of els) if (/ცივი/.test(el.textContent || '')) { el.scrollIntoView({ block: 'start' }); break; }
});
await page.waitForTimeout(500);
await page.screenshot({ path: '/tmp/qr-menu-tests/screenshots/close-drinks.png', fullPage: false });
await browser.close();
console.log('done');
