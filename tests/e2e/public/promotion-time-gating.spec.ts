// T22.21 / T22.23 — day/hour windows actually gate what the visitor sees.
//
// Run: pnpm test:e2e tests/e2e/public/promotion-time-gating.spec.ts
//
// Windows are evaluated against the CAFÉ's timezone (Menu.timezone, default
// Asia/Tbilisi), on the SERVER during render. Playwright's clock API only fakes
// the browser clock, so it cannot drive this — instead each test seeds a window
// relative to the café's real "now": today's weekday (always inside) vs
// tomorrow's weekday (always outside). The hour-boundary and midnight-crossing
// math is covered by the unit-level checks on isWithinWindows.
//
// Phase-21 constraint: NO resetDb / NO TRUNCATE. Additive seeds, cleanup by id.

import { expect, test, type Page } from '@playwright/test';
import bcrypt from 'bcryptjs';

import { prismaTest } from '../fixtures/seed';

const RUN_ID = `t22-tg-${Date.now()}`;
const TZ = 'Asia/Tbilisi';
const cleanupUserIds: string[] = [];

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

/** The café-local weekday key, `offsetDays` from now. */
function cafeWeekday(offsetDays = 0): string {
  const short = new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short' }).format(
    new Date(Date.now() + offsetDays * 86400_000),
  );
  const idx = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(short);
  return DAY_KEYS[idx < 0 ? 1 : idx];
}

/** A window covering the whole of a given café weekday. */
const allDay = (day: string) => ({
  enabled: true,
  windows: { [day]: { start: '00:00', end: '23:59' } },
});

async function seedMenu(suffix: string) {
  const user = await prismaTest.user.create({
    data: {
      email: `tg-${RUN_ID}-${suffix}@test.local`.toLowerCase(),
      name: 'Nino Kapanadze',
      plan: 'STARTER',
      password: await bcrypt.hash('x', 10),
      emailVerified: new Date(),
    },
  });
  cleanupUserIds.push(user.id);
  return prismaTest.menu.create({
    data: {
      userId: user.id,
      name: 'Café Linville',
      nameKa: 'Café Linville',
      slug: `linville-${RUN_ID}-${suffix}`,
      status: 'PUBLISHED',
      publishedAt: new Date(),
      enabledLanguages: ['KA'],
      timezone: TZ,
    },
  });
}

const cardFor = (page: Page, name: string) =>
  page
    .getByTestId('public-product-card')
    .filter({ has: page.getByRole('heading', { name, exact: true }) });

test.afterAll(async () => {
  for (const id of cleanupUserIds) {
    await prismaTest.user.delete({ where: { id } }).catch(() => {});
  }
});

test('category promotion inside its window discounts; outside it is gone', async ({ page }) => {
  for (const [suffix, windows, live] of [
    ['in', allDay(cafeWeekday(0)), true],
    ['out', allDay(cafeWeekday(1)), false],
  ] as const) {
    const menu = await seedMenu(`promo-${suffix}`);
    const drinks = await prismaTest.category.create({
      data: { menuId: menu.id, nameKa: 'სასმელები', type: 'DRINK', sortOrder: 0 },
    });
    await prismaTest.product.create({
      data: { categoryId: drinks.id, nameKa: 'საფირმო კოქტეილი', price: 20, sortOrder: 0 },
    });
    const promo = await prismaTest.promotion.create({
      data: {
        menuId: menu.id,
        titleKa: 'ლანჩის საათი',
        type: 'PERCENTAGE',
        isActive: true,
        startDate: new Date(Date.now() - 86400_000),
        endDate: new Date(Date.now() + 7 * 86400_000),
        discountType: 'PERCENTAGE',
        discountValue: 20,
        applyTo: 'CATEGORY',
        categoryId: drinks.id,
        imageUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        timeRestrictions: windows,
      },
    });

    await page.goto(`/m/${menu.slug}`);
    const cocktail = cardFor(page, 'საფირმო კოქტეილი');

    if (live) {
      await expect(page.getByTestId(`promotion-slide-${promo.id}`)).toBeVisible();
      await expect(cocktail).toContainText('16.00'); // 20 − 20%
      await expect(cocktail.getByTestId('public-old-price')).toContainText('20.00');
    } else {
      await expect(page.getByTestId(`promotion-slide-${promo.id}`)).toHaveCount(0);
      await expect(cocktail).toContainText('20.00'); // full price
      await expect(cocktail.getByTestId('public-old-price')).toHaveCount(0);
    }
  }
});

test('dish discount reverts to the original price outside its window', async ({ page }) => {
  for (const [suffix, windows, live] of [
    ['in', allDay(cafeWeekday(0)), true],
    ['out', allDay(cafeWeekday(1)), false],
  ] as const) {
    const menu = await seedMenu(`dish-${suffix}`);
    const food = await prismaTest.category.create({
      data: { menuId: menu.id, nameKa: 'საჭმელები', type: 'FOOD', sortOrder: 0 },
    });
    await prismaTest.product.create({
      data: {
        categoryId: food.id,
        nameKa: 'ხაჭაპური აჭარული',
        price: 18, // discounted
        oldPrice: 20, // original
        discountType: 'PERCENTAGE',
        discountValue: 10,
        discountWindows: windows,
        sortOrder: 0,
      },
    });

    await page.goto(`/m/${menu.slug}`);
    const card = cardFor(page, 'ხაჭაპური აჭარული');

    if (live) {
      await expect(card).toContainText('18.00');
      await expect(card.getByTestId('public-old-price')).toContainText('20.00');
    } else {
      await expect(card).toContainText('20.00');
      await expect(card.getByTestId('public-old-price')).toHaveCount(0);
    }
  }
});
