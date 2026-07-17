// T22.22 — Public promo carousel: tap-to-expand detail sheet.
//
// Run: pnpm test:e2e tests/e2e/public/promotion-carousel-detail.spec.ts
//
// Tapping a promotion slide opens a detail sheet with the title, description,
// and the per-day restricted hours. (Auto-advance + GIF are visual; this spec
// covers the interactive detail sheet.)
//
// Phase-21 constraint: NO resetDb / NO TRUNCATE. Additive seeds, cleanup by id.

import { expect, test } from '@playwright/test';
import bcrypt from 'bcryptjs';

import { prismaTest } from '../fixtures/seed';

const RUN_ID = `t22-22-${Date.now()}`;
const cleanupUserIds: string[] = [];

test.afterAll(async () => {
  for (const id of cleanupUserIds) {
    await prismaTest.user.delete({ where: { id } }).catch(() => {});
  }
});

test('tapping a promotion opens a detail sheet with hours; close dismisses it', async ({
  page,
}) => {
  const user = await prismaTest.user.create({
    data: {
      email: `promo-detail-${RUN_ID}@test.local`.toLowerCase(),
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
      slug: `linville-${RUN_ID}`,
      status: 'PUBLISHED',
      publishedAt: new Date(),
      enabledLanguages: ['KA'],
    },
  });
  const promo = await prismaTest.promotion.create({
    data: {
      menuId: menu.id,
      titleKa: 'ბედნიერი საათი',
      descriptionKa: 'ყოველ საღამოს კოქტეილებზე -20%.',
      type: 'BANNER',
      backgroundColor: '#3F5363',
      showTitle: true,
      isActive: true,
      startDate: new Date(Date.now() - 3600_000),
      endDate: new Date(Date.now() + 7 * 86400_000),
      timeRestrictions: {
        enabled: true,
        windows: { mon: { start: '18:00', end: '20:00' } },
      },
    },
  });

  await page.goto(`/m/${menu.slug}`);

  await page.getByTestId(`promotion-slide-${promo.id}`).click();

  const sheet = page.getByTestId('promotion-detail-sheet');
  await expect(sheet).toBeVisible();
  await expect(sheet).toContainText('ბედნიერი საათი');
  await expect(sheet).toContainText('-20%');
  await expect(page.getByTestId('promotion-detail-hours')).toContainText('18:00–20:00');

  await page.getByTestId('promotion-detail-close').click();
  await expect(sheet).toHaveCount(0);
});
