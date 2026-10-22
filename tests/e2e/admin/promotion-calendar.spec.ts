// T22.25 — promotions month calendar (redesigned).
//
// Run: pnpm test:e2e tests/e2e/admin/promotion-calendar.spec.ts
//
// The Promotions tab shows a month view above the list. Permanent promotions
// (no dates) sit in an "always on" strip instead of being painted across every
// week; dated ones are bars in lanes under the day numbers, with a "+N" chip
// when more than three overlap. Below md the grid becomes a weekly agenda.
//
// The browser clock is pinned to 2026-10-22 so the month, the lanes and the
// screenshots are the same on every run.
//
// Phase-21 constraint: NO resetDb / NO TRUNCATE. Additive seeds, cleanup by id.

import { expect, test, type Page } from '@playwright/test';
import bcrypt from 'bcryptjs';

import { loginAs } from '../fixtures/auth';
import { prismaTest } from '../fixtures/seed';

const RUN_ID = `t22-cal-${Date.now()}`;
const cleanupUserIds: string[] = [];

// Thursday 22 October 2026, midday in Tbilisi.
const NOW = new Date('2026-10-22T08:00:00Z');
// The drawer authors dates as bare YYYY-MM-DD → UTC midnight.
const day = (iso: string) => new Date(`${iso}T00:00:00Z`);

test.use({ timezoneId: 'Asia/Tbilisi' });

test.afterAll(async () => {
  for (const id of cleanupUserIds) {
    await prismaTest.user.delete({ where: { id } }).catch(() => {});
  }
});

async function seedCalendar(tag: string) {
  const email = `promo-cal-${tag}-${RUN_ID}@test.local`;
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
      slug: `linville-${tag}-${RUN_ID}`,
      status: 'PUBLISHED',
      publishedAt: new Date(),
      enabledLanguages: ['KA'],
    },
  });

  let sortOrder = 0;
  const create = (data: {
    titleKa: string;
    type: 'PERCENTAGE' | 'BANNER' | 'COMBO';
    startDate?: Date | null;
    endDate?: Date | null;
    isActive?: boolean;
  }) =>
    prismaTest.promotion.create({
      data: {
        menuId: menu.id,
        isActive: true,
        startDate: null,
        endDate: null,
        sortOrder: sortOrder++,
        ...(data.type === 'PERCENTAGE'
          ? { discountType: 'PERCENTAGE' as const, discountValue: 15, applyTo: 'ENTIRE_MENU' as const }
          : {}),
        ...data,
      },
    });

  const promos = {
    // Permanent: never painted in the grid.
    lunch: await create({ titleKa: 'ბიზნეს ლანჩი −15%', type: 'PERCENTAGE' }),
    happyHour: await create({ titleKa: 'საღამოს ჰეფი ჰაუერი', type: 'BANNER', isActive: false }),
    combo: await create({ titleKa: 'ხაჭაპური + ლიმონათი', type: 'COMBO' }),
    // Dated, overlapping across week boundaries.
    autumn: await create({
      titleKa: 'შემოდგომის ფასდაკლება',
      type: 'PERCENTAGE',
      startDate: day('2026-10-14'),
      endDate: day('2026-10-28'),
    }),
    wine: await create({
      titleKa: 'ღვინის კვირეული',
      type: 'BANNER',
      startDate: day('2026-10-20'),
      endDate: day('2026-11-30'),
    }),
    khinkali: await create({
      titleKa: 'ხინკლის დღეები',
      type: 'COMBO',
      startDate: day('2026-10-17'),
      endDate: day('2026-10-24'),
    }),
    // Ends today.
    churchkhela: await create({
      titleKa: 'ჩურჩხელა საჩუქრად',
      type: 'BANNER',
      startDate: day('2026-10-08'),
      endDate: day('2026-10-22'),
    }),
    // Starts next month.
    newYear: await create({
      titleKa: 'საახალწლო მენიუ',
      type: 'BANNER',
      startDate: day('2026-11-03'),
      endDate: day('2026-11-20'),
    }),
    // Dated but switched off.
    eggplant: await create({
      titleKa: 'ბადრიჯანი ნიგვზით −10%',
      type: 'PERCENTAGE',
      startDate: day('2026-10-01'),
      endDate: day('2026-10-09'),
      isActive: false,
    }),
    // Already over.
    tarragon: await create({
      titleKa: 'თარხუნის ლიმონათი',
      type: 'COMBO',
      startDate: day('2026-09-25'),
      endDate: day('2026-10-05'),
    }),
  };

  return { email, menu, promos };
}

// Dev-only overlays (Next.js issues badge, TanStack Query devtools) and the
// fixed mobile tab bar would otherwise land inside the element screenshots.
const HIDE_CHROME =
  'nextjs-portal, .tsqd-open-btn-container, [data-testid="admin-mobile-tab-bar"] { display: none !important; }';

async function openCalendar(page: Page, email: string, menuId: string) {
  await page.clock.setFixedTime(NOW);
  await page.context().addCookies([
    { name: 'NEXT_LOCALE', value: 'ka', domain: 'localhost', path: '/' },
  ]);
  await loginAs(page, email);
  await page.goto(`/admin/menus/${menuId}?tab=promotions`);
  const calendar = page.getByTestId('promotion-calendar');
  await expect(calendar).toBeVisible();
  return calendar;
}

test.describe('promotions calendar', () => {
  test.beforeEach(async ({}, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop',
      'Desktop project drives both the grid and (via a narrow viewport) the agenda',
    );
  });

  test('month grid: always-on strip, lanes, +N, paused and ended styles, drawer', async ({ page }) => {
    const { email, menu, promos } = await seedCalendar('grid');
    const calendar = await openCalendar(page, email, menu.id);

    await expect(calendar.getByTestId('promotion-calendar-month')).toHaveText(/ოქტომბერი 2026/i);

    // Weekdays are localized and start on Monday.
    const grid = calendar.getByTestId('promotion-calendar-grid');
    await expect(grid).toBeVisible();
    await expect(grid).toContainText('ორშ');
    await expect(grid).toContainText('კვი');

    // Permanent promotions live in the strip, never in the grid.
    const strip = calendar.getByTestId('promotion-calendar-permanent');
    for (const p of [promos.lunch, promos.happyHour, promos.combo]) {
      await expect(strip.getByTestId(`promotion-calendar-permanent-${p.id}`)).toBeVisible();
      await expect(calendar.getByTestId(`promotion-calendar-bar-${p.id}`)).toHaveCount(0);
    }
    await expect(
      strip.getByTestId(`promotion-calendar-permanent-${promos.happyHour.id}`),
    ).toHaveAttribute('data-status', 'paused');
    await expect(
      strip.getByTestId(`promotion-calendar-permanent-${promos.happyHour.id}`),
    ).toContainText('გამორთულია');

    // Dated promotions are bars; one bar per week they touch.
    await expect(calendar.getByTestId(`promotion-calendar-bar-${promos.autumn.id}`)).toHaveCount(3);
    await expect(calendar.getByTestId(`promotion-calendar-bar-${promos.khinkali.id}`)).toHaveCount(2);
    await expect(
      calendar.getByTestId(`promotion-calendar-bar-${promos.churchkhela.id}`).first(),
    ).toBeVisible();
    await expect(calendar.getByTestId(`promotion-calendar-bar-${promos.newYear.id}`)).toHaveCount(0);
    await expect(
      calendar.getByTestId(`promotion-calendar-bar-${promos.eggplant.id}`).first(),
    ).toHaveAttribute('data-status', 'paused');
    await expect(
      calendar.getByTestId(`promotion-calendar-bar-${promos.tarragon.id}`).first(),
    ).toHaveAttribute('data-status', 'ended');

    // Today is marked.
    await expect(calendar.getByTestId('promotion-calendar-today-cell')).toHaveText('22');

    await page.addStyleTag({ content: HIDE_CHROME });
    await expect(calendar).toHaveScreenshot('promotion-calendar-desktop.png');

    // Week of 19–25 Oct holds four overlapping promotions: three lanes + "+1".
    const more = calendar.locator('[data-testid^="promotion-calendar-more-"]');
    await expect(more.first()).toHaveText('+1');
    await more.first().click();
    const dayList = page.getByTestId('promotion-calendar-day-list');
    await expect(dayList).toBeVisible();
    await expect(dayList.getByTestId(`promotion-calendar-day-item-${promos.wine.id}`)).toBeVisible();
    await expect(dayList.getByTestId(`promotion-calendar-day-item-${promos.autumn.id}`)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dayList).toBeHidden();


    // Hover shows the details: range, scope, status.
    await calendar.getByTestId(`promotion-calendar-bar-${promos.autumn.id}`).first().hover();
    const tooltip = page.getByRole('tooltip');
    await expect(tooltip).toContainText('შემოდგომის ფასდაკლება');
    await expect(tooltip).toContainText('მთელ მენიუზე');
    await expect(tooltip).toContainText('აქტიური');

    // Click opens that promotion in the drawer.
    await calendar.getByTestId(`promotion-calendar-bar-${promos.autumn.id}`).first().click();
    const drawer = page.getByTestId('promotion-drawer');
    await expect(drawer).toBeVisible();
    await expect(drawer.locator('input[value="შემოდგომის ფასდაკლება"]').first()).toBeVisible();
    await page.getByTestId('promotion-drawer-close').click();
    await expect(drawer).toBeHidden();

    // Month navigation works and is reversible.
    const monthLabel = calendar.getByTestId('promotion-calendar-month');
    await page.getByTestId('promotion-calendar-next').click();
    await expect(monthLabel).toHaveText(/ნოემბერი 2026/i);
    await expect(
      calendar.getByTestId(`promotion-calendar-bar-${promos.newYear.id}`).first(),
    ).toBeVisible();
    await page.getByTestId('promotion-calendar-today').click();
    await expect(monthLabel).toHaveText(/ოქტომბერი 2026/i);
  });

  test('narrow screens get a weekly agenda instead of the grid', async ({ page }) => {
    // Phone width; tall enough that the whole calendar fits the screenshot
    // (it sits inside the admin's scroll container).
    await page.setViewportSize({ width: 390, height: 1600 });
    const { email, menu, promos } = await seedCalendar('agenda');
    const calendar = await openCalendar(page, email, menu.id);

    await expect(calendar.getByTestId('promotion-calendar-grid')).toBeHidden();
    const agenda = calendar.getByTestId('promotion-calendar-agenda');
    await expect(agenda).toBeVisible();
    // Each promotion is listed once, under the first week it touches.
    await expect(agenda.getByTestId('promotion-calendar-agenda-week')).toHaveCount(4);
    await expect(
      agenda.getByTestId(`promotion-calendar-agenda-item-${promos.wine.id}`),
    ).toHaveCount(1);
    await expect(
      agenda.getByTestId(`promotion-calendar-agenda-item-${promos.autumn.id}`),
    ).toHaveCount(1);
    await expect(
      agenda.getByTestId(`promotion-calendar-agenda-item-${promos.newYear.id}`),
    ).toHaveCount(0);
    await expect(
      calendar.getByTestId(`promotion-calendar-permanent-${promos.lunch.id}`),
    ).toBeVisible();

    await page.addStyleTag({ content: HIDE_CHROME });
    await expect(calendar).toHaveScreenshot('promotion-calendar-mobile.png');

    await agenda.getByTestId(`promotion-calendar-agenda-item-${promos.wine.id}`).click();
    await expect(page.getByTestId('promotion-drawer')).toBeVisible();
  });
});
