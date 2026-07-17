// T22.25 — Promotion pop-up on public menu open.
//
// Run: pnpm test:e2e tests/e2e/public/promotion-popup.spec.ts
//
// When Menu.promoPopupEnabled is on, active promotions greet the visitor in a
// dismissible pop-up on open, shown once per browser session.
//
// Phase-21 constraint: NO resetDb / NO TRUNCATE. Additive seeds, cleanup by id.

import { expect, test } from '@playwright/test';
import bcrypt from 'bcryptjs';

import { prismaTest } from '../fixtures/seed';

const RUN_ID = `t22-25-${Date.now()}`;
const cleanupUserIds: string[] = [];

test.afterAll(async () => {
  for (const id of cleanupUserIds) {
    await prismaTest.user.delete({ where: { id } }).catch(() => {});
  }
});

async function seedPopupMenu(popup: boolean) {
  const user = await prismaTest.user.create({
    data: {
      email: `promo-popup-${RUN_ID}-${popup}@test.local`.toLowerCase(),
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
      slug: `linville-${RUN_ID}-${popup}`,
      status: 'PUBLISHED',
      publishedAt: new Date(),
      enabledLanguages: ['KA'],
      promoPopupEnabled: popup,
    },
  });
  await prismaTest.promotion.create({
    data: {
      menuId: menu.id,
      titleKa: 'გახსნის შეთავაზება',
      type: 'BANNER',
      backgroundColor: '#3F5363',
      showTitle: true,
      isActive: true,
      startDate: new Date(Date.now() - 3600_000),
      endDate: new Date(Date.now() + 7 * 86400_000),
    },
  });
  return menu;
}

test('pop-up shows on open, dismisses, and stays closed for the session', async ({ page }) => {
  const menu = await seedPopupMenu(true);

  await page.goto(`/m/${menu.slug}`);

  const popup = page.getByTestId('promotion-popup');
  await expect(popup).toBeVisible();
  await expect(popup).toContainText('გახსნის შეთავაზება');

  await page.getByTestId('promotion-popup-close').click();
  await expect(popup).toHaveCount(0);

  // Same-session reload must not re-open it (sessionStorage guard).
  await page.reload();
  await expect(page.getByTestId('promotion-popup')).toHaveCount(0);
});

test('pop-up does not show when the toggle is off', async ({ page }) => {
  const menu = await seedPopupMenu(false);
  await page.goto(`/m/${menu.slug}`);
  // The inline carousel still renders; only the pop-up must be absent.
  await expect(page.getByText('გახსნის შეთავაზება')).toBeVisible();
  await expect(page.getByTestId('promotion-popup')).toHaveCount(0);
});
