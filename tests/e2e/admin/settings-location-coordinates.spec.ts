// Test for T20.10 Settings Tab — Location Coordinates Picker.
// Run:     pnpm test:e2e tests/e2e/admin/settings-location-coordinates.spec.ts
// Update:  pnpm test:e2e:update tests/e2e/admin/settings-location-coordinates.spec.ts

import { expect, test, type Page } from '@playwright/test';

import { loginAs } from '../fixtures/auth';
import { prismaTest, seedMenu, seedUser } from '../fixtures/seed';

function uniqueSuffix(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

async function seedAndOpenSettings(page: Page) {
  const suffix = uniqueSuffix();
  const email = `nino-coordinates-${suffix}@cafelinville.ge`;
  const address = '12 Rustaveli Avenue, Tbilisi';
  const user = await seedUser({
    plan: 'STARTER',
    name: 'Nino Kapanadze',
    email,
  });
  const menu = await seedMenu({
    userId: user.id,
    status: 'PUBLISHED',
    categoryCount: 1,
    productCount: 2,
    name: 'Café Linville — Coordinates',
    slug: `linville-coords-${suffix}`,
  });
  await prismaTest.menu.update({
    where: { id: menu.id },
    data: { address },
  });

  await loginAs(page, email);
  await page.goto(`/admin/menus/${menu.id}?tab=settings`);
  await expect(page.getByTestId('settings-tab')).toBeVisible();
  return { menu: { ...menu, address } };
}

test.describe('editor settings tab · Location coordinates (T20.10)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ context }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop',
      'Desktop-only tab; mobile variant lives elsewhere.',
    );
    await context.clearCookies();
    await context.addCookies([
      { name: 'NEXT_LOCALE', value: 'en', domain: 'localhost', path: '/' },
    ]);
  });

  test('visual: settings-location-coordinates', async ({ page }) => {
    await seedAndOpenSettings(page);

    const section = page.getByTestId('settings-location-coordinates');
    await section.scrollIntoViewIfNeeded();
    await expect(section).toBeVisible();

    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({
      content:
        '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }',
    });

    await expect(section).toHaveScreenshot('settings-location-coordinates.png', {
      maxDiffPixelRatio: 0.05,
    });
  });

  test('functional: saves coordinates and public map link prefers them over address', async ({
    page,
  }) => {
    const { menu } = await seedAndOpenSettings(page);

    await page.getByTestId('settings-location-lat').fill('41.7151');
    await page.getByTestId('settings-location-lng').fill('44.8271');

    const [putResp] = await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes(`/api/menus/${menu.id}`) && r.request().method() === 'PUT',
      ),
      page.getByTestId('settings-location-save').click(),
    ]);
    expect(putResp.ok()).toBeTruthy();

    const row = await prismaTest.menu.findUnique({ where: { id: menu.id } });
    expect(Number(row?.locationLat)).toBeCloseTo(41.7151, 6);
    expect(Number(row?.locationLng)).toBeCloseTo(44.8271, 6);

    await expect(page.getByTestId('settings-location')).toHaveAttribute(
      'data-dirty',
      'false',
    );

    await page.goto(`/m/${menu.slug}`);
    await page.getByRole('button', { name: 'Address' }).click();
    const mapLink = page.getByRole('link', { name: 'View on map' });
    await expect(mapLink).toHaveAttribute(
      'href',
      'https://www.google.com/maps/search/?api=1&query=41.7151,44.8271',
    );

    await page.goto(`/admin/menus/${menu.id}?tab=settings`);
    await page.getByTestId('settings-location-lat').fill('');
    await page.getByTestId('settings-location-lng').fill('');

    const [clearResp] = await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes(`/api/menus/${menu.id}`) && r.request().method() === 'PUT',
      ),
      page.getByTestId('settings-location-save').click(),
    ]);
    expect(clearResp.ok()).toBeTruthy();

    const cleared = await prismaTest.menu.findUnique({ where: { id: menu.id } });
    expect(cleared?.locationLat).toBeNull();
    expect(cleared?.locationLng).toBeNull();

    await page.goto(`/m/${menu.slug}`);
    await page.getByRole('button', { name: 'Address' }).click();
    await expect(page.getByRole('link', { name: 'View on map' })).toHaveAttribute(
      'href',
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        menu.address,
      )}`,
    );
  });
});
