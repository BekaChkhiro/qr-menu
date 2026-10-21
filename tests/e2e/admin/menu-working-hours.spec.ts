// Menu working hours — the "show" switch only controls the public footer.
// Run:     pnpm test:e2e tests/e2e/admin/menu-working-hours.spec.ts
//
// Covers (functional, desktop):
//   - switching the footer off keeps the stored hours (workingHours is NOT nulled)
//   - the hours editor stays visible when the footer switch is off
//   - the save persists showWorkingHours separately from workingHours

import { expect, test, type Page } from '@playwright/test';

import { loginAs } from '../fixtures/auth';
import { prismaTest, resetDb, seedMenu, seedUser } from '../fixtures/seed';

const HOURS = [
  { day: 'mon', closed: false, open: '10:00', close: '22:00', breakStart: null, breakEnd: null },
  { day: 'tue', closed: false, open: '10:00', close: '22:00', breakStart: null, breakEnd: null },
  { day: 'wed', closed: false, open: '10:00', close: '22:00', breakStart: null, breakEnd: null },
  { day: 'thu', closed: false, open: '10:00', close: '22:00', breakStart: null, breakEnd: null },
  { day: 'fri', closed: false, open: '10:00', close: '23:00', breakStart: null, breakEnd: null },
  { day: 'sat', closed: false, open: '11:00', close: '23:00', breakStart: null, breakEnd: null },
  { day: 'sun', closed: true, open: '10:00', close: '22:00', breakStart: null, breakEnd: null },
];

async function seedAndOpenHours(page: Page) {
  const email = 'nino-hours@cafelinville.ge';
  const user = await seedUser({ plan: 'STARTER', name: 'Nino Kapanadze', email });
  const menu = await seedMenu({
    userId: user.id,
    status: 'PUBLISHED',
    categoryCount: 1,
    productCount: 1,
    name: 'Café Linville — Hours',
    slug: 'linville-hours',
  });
  await prismaTest.menu.update({
    where: { id: menu.id },
    data: { workingHours: HOURS, showWorkingHours: true },
  });
  await loginAs(page, email);
  await page.goto(`/admin/menus/${menu.id}?tab=settings`);
  await expect(page.getByTestId('settings-working-hours')).toBeVisible();
  return { user, menu };
}

test.describe('menu working hours · footer switch (T1.10)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ context }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'Desktop-only tab');
    await resetDb();
    await context.clearCookies();
    await context.addCookies([{ name: 'NEXT_LOCALE', value: 'en', domain: 'localhost', path: '/' }]);
  });

  test('functional: switching the footer off keeps the hours and the editor stays visible', async ({
    page,
  }) => {
    const { menu } = await seedAndOpenHours(page);

    await expect(page.getByTestId('settings-working-hours-row-mon')).toBeVisible();

    await page.getByTestId('settings-working-hours-toggle').click();
    await expect(page.getByTestId('settings-working-hours')).toHaveAttribute('data-enabled', 'false');

    // Hours editor is still there — the switch no longer hides it.
    await expect(page.getByTestId('settings-working-hours-row-mon')).toBeVisible();

    const patchPromise = page.waitForResponse(
      (res) => res.url().endsWith(`/api/menus/${menu.id}`) && res.request().method() === 'PUT',
    );
    await page.getByTestId('settings-working-hours-save').click();
    const response = await patchPromise;
    expect(response.status()).toBe(200);

    const sent = response.request().postDataJSON() as Record<string, unknown>;
    expect(sent.showWorkingHours).toBe(false);
    expect(Array.isArray(sent.workingHours)).toBe(true);

    const fresh = await prismaTest.menu.findUnique({ where: { id: menu.id } });
    expect(fresh?.showWorkingHours).toBe(false);
    expect(fresh?.workingHours).not.toBeNull();
    expect((fresh?.workingHours as unknown as Array<{ day: string }>).map((h) => h.day)).toContain('mon');
  });
});
