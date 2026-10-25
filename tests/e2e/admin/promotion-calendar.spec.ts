// T22.25 / T2.8 — promotions month calendar.
//
// Run: pnpm test:e2e tests/e2e/admin/promotion-calendar.spec.ts
//
// The Promotions tab shows a month view above the list that paints the real
// schedule: permanent promotions (no dates) run every day and are drawn as
// thin bars in every week; dated ones are bars on their days; weekday-
// restricted ones (timeRestrictions enabled with days) are separate segments
// on those weekdays only; paused ones striped, ended ones grey. More than three
// dated overlaps collapse into a per-day "+N" chip. Below md the grid becomes
// a weekly agenda listing each promotion with the days it runs that week.
// Days are counted in the menu's timezone, not the browser's.
//
// The browser clock is pinned to 2026-10-22 so the month, the lanes and the
// screenshots are the same on every run.
//
// Phase-21 constraint: NO resetDb / NO TRUNCATE. Additive seeds, cleanup by id.

import { expect, test, type Locator, type Page } from '@playwright/test';
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

const MENU_TZ = 'Europe/Berlin';
// Mon/Wed lunch window — the canonical per-day `windows` shape the drawer saves.
const MON_WED = {
  enabled: true,
  windows: { mon: { start: '12:00', end: '16:00' }, wed: { start: '12:00', end: '16:00' } },
};

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
      // Not the browser's zone (Asia/Tbilisi below): proves the tab hands the
      // menu's timezone to the calendar.
      timezone: MENU_TZ,
    },
  });

  let sortOrder = 0;
  const create = (data: {
    titleKa: string;
    type: 'PERCENTAGE' | 'BANNER' | 'COMBO';
    startDate?: Date | null;
    endDate?: Date | null;
    isActive?: boolean;
    timeRestrictions?: object;
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
    // Permanent: thin bars in every week.
    lunch: await create({ titleKa: 'ბიზნეს ლანჩი −15%', type: 'PERCENTAGE' }),
    happyHour: await create({ titleKa: 'საღამოს ჰეფი ჰაუერი', type: 'BANNER', isActive: false }),
    combo: await create({ titleKa: 'ხაჭაპური + ლიმონათი', type: 'COMBO' }),
    // Permanent but Mon/Wed only: one segment per Monday and Wednesday.
    chakapuli: await create({
      titleKa: 'ჩაქაფულის დღეები',
      type: 'PERCENTAGE',
      timeRestrictions: MON_WED,
    }),
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

// Element screenshots of a tall element inside the admin's scroll container
// come back with unrasterised (blank) tiles below ~700px now and then, so the
// baselines are page screenshots clipped to the calendar's box instead. The
// viewport is sized per test so the whole calendar is on screen.
async function shoot(page: Page, calendar: Locator, name: string) {
  const box = await calendar.boundingBox();
  if (!box) throw new Error('calendar has no box');
  const viewport = page.viewportSize()!;
  expect(box.y + box.height, `calendar must fit the ${viewport.height}px viewport`).toBeLessThanOrEqual(
    viewport.height,
  );
  await expect(page).toHaveScreenshot(name, { clip: box });
}

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

  test('month grid: permanent every day, Mon/Wed segments, lanes, +N, paused and ended styles, drawer', async ({ page }) => {
    // Tall enough that all five week rows (dated + permanent lanes) are on
    // screen for the clipped screenshot (see shoot()).
    await page.setViewportSize({ width: 1440, height: 1500 });
    const { email, menu, promos } = await seedCalendar('grid');
    const calendar = await openCalendar(page, email, menu.id);

    await expect(calendar.getByTestId('promotion-calendar-month')).toHaveText(/ოქტომბერი 2026/i);
    // The tab passes the menu's timezone, not the browser's.
    await expect(calendar).toHaveAttribute('data-timezone', MENU_TZ);

    // Weekdays are localized and start on Monday.
    const grid = calendar.getByTestId('promotion-calendar-grid');
    await expect(grid).toBeVisible();
    await expect(grid).toContainText('ორშ');
    await expect(grid).toContainText('კვი');

    // The old "always on" strip is gone: permanent promotions are in the grid.
    await expect(calendar.getByTestId('promotion-calendar-permanent')).toHaveCount(0);

    // Permanent promotions: one thin full-width bar in every week row
    // (28 Sep – 1 Nov is five weeks), continuing on both edges.
    const weekRows = calendar.getByTestId('promotion-calendar-week');
    await expect(weekRows).toHaveCount(5);
    for (const p of [promos.lunch, promos.happyHour, promos.combo]) {
      const bars = calendar.getByTestId(`promotion-calendar-bar-${p.id}`);
      await expect(bars).toHaveCount(5);
      for (let w = 0; w < 5; w++) {
        const bar = weekRows.nth(w).getByTestId(`promotion-calendar-bar-${p.id}`);
        await expect(bar).toHaveCount(1);
        await expect(bar).toHaveAttribute('data-permanent', 'true');
        await expect(bar).toHaveAttribute('data-start-col', '0');
        await expect(bar).toHaveAttribute('data-end-col', '6');
      }
    }
    const pausedPermanent = calendar.getByTestId(`promotion-calendar-bar-${promos.happyHour.id}`);
    await expect(pausedPermanent.first()).toHaveAttribute('data-status', 'paused');
    await expect(pausedPermanent.first()).toHaveAttribute('aria-label', /გამორთულია/);

    // Mon/Wed only: a one-day segment on every Monday (col 0) and Wednesday
    // (col 2) of the grid — 5 Mondays + 5 Wednesdays — never a continuous bar.
    const monWed = calendar.getByTestId(`promotion-calendar-bar-${promos.chakapuli.id}`);
    await expect(monWed).toHaveCount(10);
    for (let w = 0; w < 5; w++) {
      const segs = weekRows.nth(w).getByTestId(`promotion-calendar-bar-${promos.chakapuli.id}`);
      await expect(segs).toHaveCount(2);
      await expect(segs.nth(0)).toHaveAttribute('data-start-col', '0');
      await expect(segs.nth(0)).toHaveAttribute('data-end-col', '0');
      await expect(segs.nth(1)).toHaveAttribute('data-start-col', '2');
      await expect(segs.nth(1)).toHaveAttribute('data-end-col', '2');
    }
    await expect(monWed.first()).toHaveAttribute('aria-label', /ორშ, ოთხ/);

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
    await shoot(page, calendar, 'promotion-calendar-desktop.png');

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

    await page.keyboard.press('Escape');
    await expect(tooltip).toBeHidden();

    // A weekday-restricted promotion names its days in the tooltip (opened by
    // keyboard focus: Radix shows it at once, no hover delay to race).
    await monWed.nth(2).focus();
    await expect(
      page
        .getByRole('tooltip')
        .filter({ hasText: 'ჩაქაფულის დღეები' })
        .getByTestId('promotion-calendar-weekdays'),
    ).toHaveText('მხოლოდ: ორშ, ოთხ');
    await page.keyboard.press('Escape');

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
    // Phone width; tall enough that the whole agenda is on screen for the
    // clipped screenshot (see shoot()).
    await page.setViewportSize({ width: 390, height: 3200 });
    const { email, menu, promos } = await seedCalendar('agenda');
    const calendar = await openCalendar(page, email, menu.id);

    await expect(calendar.getByTestId('promotion-calendar-grid')).toBeHidden();
    const agenda = calendar.getByTestId('promotion-calendar-agenda');
    await expect(agenda).toBeVisible();
    const weeks = agenda.getByTestId('promotion-calendar-agenda-week');
    // Permanent promotions run in all five weeks, so every week is listed.
    await expect(weeks).toHaveCount(5);
    const item = (id: string) => agenda.getByTestId(`promotion-calendar-agenda-item-${id}`);
    const days = (id: string) => agenda.getByTestId(`promotion-calendar-agenda-item-${id}-days`);

    // Permanent: every week, "every day".
    await expect(item(promos.lunch.id)).toHaveCount(5);
    for (let w = 0; w < 5; w++) {
      await expect(weeks.nth(w).getByTestId(`promotion-calendar-agenda-item-${promos.lunch.id}-days`)).toHaveText(
        'ყოველდღე',
      );
    }
    // Permanent Mon/Wed: every week, with just those days.
    await expect(item(promos.chakapuli.id)).toHaveCount(5);
    for (let w = 0; w < 5; w++) {
      await expect(days(promos.chakapuli.id).nth(w)).toHaveText('ორშ, ოთხ');
    }
    // Dated: listed in each week it touches, with the days of that week.
    // 14–28 Oct → Wed–Sun of 12–18, all of 19–25, Mon–Wed of 26 Oct – 1 Nov.
    await expect(item(promos.autumn.id)).toHaveCount(3);
    await expect(days(promos.autumn.id).nth(0)).toHaveText('ოთხ–კვი');
    await expect(days(promos.autumn.id).nth(1)).toHaveText('ყოველდღე');
    await expect(days(promos.autumn.id).nth(2)).toHaveText('ორშ–ოთხ');
    await expect(item(promos.wine.id)).toHaveCount(2);
    await expect(item(promos.newYear.id)).toHaveCount(0);
    // Paused stays paused in the agenda too.
    await expect(item(promos.happyHour.id).first()).toHaveAttribute('data-status', 'paused');

    await page.addStyleTag({ content: HIDE_CHROME });
    await shoot(page, calendar, 'promotion-calendar-mobile.png');

    await item(promos.wine.id).first().click();
    await expect(page.getByTestId('promotion-drawer')).toBeVisible();
  });
});
