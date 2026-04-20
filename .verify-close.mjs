import { PrismaClient } from '@prisma/client';
import { chromium } from 'playwright';

const prisma = new PrismaClient();
const browser = await chromium.launch({ headless: true });
// Larger viewport for clearer details
const page = await browser.newPage({ viewport: { width: 520, height: 1200 } });

const menu = await prisma.menu.findUnique({ where: { slug: 'demo-cafe' } });
if (!menu) throw new Error('demo-cafe not found');

for (const template of ['CLASSIC', 'MAGAZINE', 'COMPACT']) {
  await prisma.menu.update({ where: { id: menu.id }, data: { menuTemplate: template } });
  await page.goto(`http://localhost:3000/m/demo-cafe?v=${template}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Scroll to show first category products
  await page.evaluate(() => window.scrollTo(0, 580));
  await page.waitForTimeout(500);

  await page.screenshot({
    path: `/tmp/qr-menu-tests/screenshots/close-${template}.png`,
    fullPage: false,
  });
  console.log(`✅ ${template}`);
}

await prisma.menu.update({ where: { id: menu.id }, data: { menuTemplate: 'CLASSIC' } });
await browser.close();
await prisma.$disconnect();
console.log('done');
