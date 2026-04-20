import { PrismaClient } from '@prisma/client';
import { chromium } from 'playwright';

const prisma = new PrismaClient();
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 420, height: 900 } });

const menu = await prisma.menu.findUnique({ where: { slug: 'demo-cafe' } });
if (!menu) throw new Error('demo-cafe not found');

for (const template of ['CLASSIC', 'MAGAZINE', 'COMPACT']) {
  await prisma.menu.update({
    where: { id: menu.id },
    data: { menuTemplate: template },
  });
  // Bust Redis cache by hitting a cache-invalidating endpoint (or just wait and add a query param)
  await page.goto(`http://localhost:3000/m/demo-cafe?v=${template}`, {
    waitUntil: 'networkidle',
  });
  await page.waitForTimeout(1500);
  await page.screenshot({
    path: `/tmp/qr-menu-tests/screenshots/template-${template}.png`,
    fullPage: true,
  });
  console.log(`✅ ${template} captured`);
}

// Reset to CLASSIC for a clean demo state
await prisma.menu.update({
  where: { id: menu.id },
  data: { menuTemplate: 'CLASSIC' },
});

await browser.close();
await prisma.$disconnect();
console.log('done');
