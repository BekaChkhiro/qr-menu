// T22.25 — promotions month calendar.
//
// Run: pnpm test:e2e tests/e2e/admin/promotion-calendar.spec.ts
//
// The Promotions tab shows a month view above the list so the operator can see
// which promotions run on which dates and where two or three overlap.
//
// Phase-21 constraint: NO resetDb / NO TRUNCATE. Additive seeds, cleanup by id.

import { expect, test } from '@playwright/test';
import bcrypt from 'bcryptjs';

import { loginAs } from '../fixtures/auth';
import { prismaTest } from '../fixtures/seed';

const RUN_ID = `t22-cal-${Date.now()}`;
const cleanupUserIds: string[] = [];

test.afterAll(async () => {
  for (const id of cleanupUserIds) {
    await prismaTest.user.delete({ where: { id } }).catch(() => {});
  }
});

test('calendar renders a bar per promotion, including overlapping ones', async ({ page }) => {
  const email = `promo-cal-${RUN_ID}@test.local`;
  const user = await prismaTest.user.create({
    data: {
      email: email.toLowerCase(),
      name: 'Nino Kapanadze',
      plan: 'STARTER',
      password: await bcrypt.hash('password-not-used', 10),
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

  // Two promotions overlapping today → both must be drawn, stacked.
  const base = {
    menuId: menu.id,
    type: 'BANNER' as const,
    isActive: true,
  };
  const promoA = await prismaTest.promotion.create({
    data: {
      ...base,
      titleKa: 'ზაფხულის აქცია',
      startDate: new Date(Date.now() - 2 * 86400_000),
      endDate: new Date(Date.now() + 3 * 86400_000),
    },
  });
  const promoB = await prismaTest.promotion.create({
    data: {
      ...base,
      titleKa: 'შაბათ-კვირის შეთავაზება',
      startDate: new Date(Date.now() - 1 * 86400_000),
      endDate: new Date(Date.now() + 5 * 86400_000),
    },
  });

  await loginAs(page, email);
  await page.goto(`/admin/menus/${menu.id}?tab=promotions`);

  const calendar = page.getByTestId('promotion-calendar');
  await expect(calendar).toBeVisible();

  // Each promotion is drawn at least once in the current month view.
  await expect(page.getByTestId(`promotion-calendar-bar-${promoA.id}`).first()).toBeVisible();
  await expect(page.getByTestId(`promotion-calendar-bar-${promoB.id}`).first()).toBeVisible();

  // Month navigation works and is reversible.
  const monthLabel = calendar.getByTestId('promotion-calendar-month');
  const initial = await monthLabel.textContent();
  await page.getByTestId('promotion-calendar-next').click();
  await expect(monthLabel).not.toHaveText(initial!);
  await page.getByTestId('promotion-calendar-today').click();
  await expect(monthLabel).toHaveText(initial!);
});
