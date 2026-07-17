// T22.20 — Promotion appearance variants on the public menu.
//
// Run:    pnpm test:e2e tests/e2e/public/promotion-variants.spec.ts
//
// The owner wants three visual variants in the public promo carousel:
//   var1: banner only            (image, showTitle = false)
//   var2: banner + title         (image, showTitle = true)
//   var3: title-only card        (no image, on a chosen backgroundColor)
// Title-only promotions must appear (previously the carousel dropped every
// promotion without an image).
//
// Phase-21 constraint: NO resetDb / NO TRUNCATE. Additive seeds, cleanup by id.

import { expect, test } from '@playwright/test';
import bcrypt from 'bcryptjs';

import { prismaTest } from '../fixtures/seed';

const RUN_ID = `t22-20-${Date.now()}`;
const cleanupUserIds: string[] = [];

const IMG = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';

async function seedMenu(suffix: string) {
  const user = await prismaTest.user.create({
    data: {
      email: `promo-var-${RUN_ID}-${suffix}@test.local`.toLowerCase(),
      name: 'Nino Kapanadze',
      plan: 'STARTER',
      password: await bcrypt.hash('x', 10),
      emailVerified: new Date(),
    },
  });
  cleanupUserIds.push(user.id);
  const menu = await prismaTest.menu.create({
    data: {
      userId: user.id,
      name: 'Café Linville',
      nameKa: 'Café Linville',
      slug: `linville-${RUN_ID}-${suffix}`,
      status: 'PUBLISHED',
      publishedAt: new Date(),
      enabledLanguages: ['KA'],
    },
  });
  return menu;
}

test.afterAll(async () => {
  for (const id of cleanupUserIds) {
    await prismaTest.user.delete({ where: { id } }).catch(() => {});
  }
});

test('title-only BANNER promotion renders a background-color card with its title', async ({
  page,
}) => {
  const menu = await seedMenu('titleonly');
  const promo = await prismaTest.promotion.create({
    data: {
      menuId: menu.id,
      titleKa: 'ზაფხულის ფესტივალი',
      type: 'BANNER',
      backgroundColor: '#7A3F27',
      showTitle: true,
      isActive: true,
      startDate: new Date(Date.now() - 3600_000),
      endDate: new Date(Date.now() + 7 * 86400_000),
    },
  });

  await page.goto(`/m/${menu.slug}`);

  const slide = page.getByTestId(`promotion-slide-${promo.id}`);
  await expect(slide).toBeVisible();
  await expect(slide.getByTestId('promotion-slide-title')).toHaveText('ზაფხულის ფესტივალი');
});

test('banner promotion hides its title when showTitle is false', async ({ page }) => {
  const menu = await seedMenu('banneronly');
  const promo = await prismaTest.promotion.create({
    data: {
      menuId: menu.id,
      titleKa: 'ფარული სათაური',
      type: 'BANNER',
      imageUrl: IMG,
      showTitle: false,
      isActive: true,
      startDate: new Date(Date.now() - 3600_000),
      endDate: new Date(Date.now() + 7 * 86400_000),
    },
  });

  await page.goto(`/m/${menu.slug}`);

  const slide = page.getByTestId(`promotion-slide-${promo.id}`);
  await expect(slide).toBeVisible();
  await expect(slide.getByTestId('promotion-slide-title')).toHaveCount(0);
});
