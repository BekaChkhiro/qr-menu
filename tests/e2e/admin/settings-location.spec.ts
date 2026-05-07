// Test for T20.4 Settings Tab — Location & Contact Card.
// Run:     pnpm test:e2e tests/e2e/admin/settings-location.spec.ts
// Update:  pnpm test:e2e:update tests/e2e/admin/settings-location.spec.ts
//
// Covers:
//   Visual     — Location & Contact card on /admin/menus/[id]?tab=settings
//   Functional —
//     - save phone + Wi-Fi (SSID + password) → PATCH /api/menus/:id → DB updates →
//       public menu header renders the phone link and Wi-Fi modal shows the new values;
//     - upload wcImageUrl via /api/upload + Save → DB has wcImageUrl →
//       public menu header restroom modal renders the image.
//
// IMPORTANT: this spec does not run resetDb — every test seeds with unique
// emails / slugs so it can run alongside other suites without wiping data.

import { expect, test, type Page } from '@playwright/test';

import { loginAs } from '../fixtures/auth';
import { prismaTest, seedMenu, seedUser } from '../fixtures/seed';

function uniqueSuffix(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

async function seedAndOpenSettings(page: Page) {
  const suffix = uniqueSuffix();
  const email = `nino-location-${suffix}@cafelinville.ge`;
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
    name: 'Café Linville — Location',
    slug: `linville-loc-${suffix}`,
  });
  await loginAs(page, email);
  await page.goto(`/admin/menus/${menu.id}?tab=settings`);
  await expect(page.getByTestId('settings-tab')).toBeVisible();
  return { user, menu };
}

test.describe('editor settings tab · Location & Contact (T20.4)', () => {
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

  // ── Visual ─────────────────────────────────────────────────────────────────

  test('visual: settings-location-card', async ({ page }) => {
    await seedAndOpenSettings(page);

    const section = page.getByTestId('settings-location');
    await section.scrollIntoViewIfNeeded();
    await expect(section).toBeVisible();

    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({
      content:
        '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }',
    });

    await expect(section).toHaveScreenshot('settings-location-card.png', {
      maxDiffPixelRatio: 0.05,
    });
  });

  // ── Functional: save phone + Wi-Fi reflects on public menu ────────────────

  test('functional: saving phone + Wi-Fi updates DB and public menu modals', async ({
    page,
  }) => {
    const { menu } = await seedAndOpenSettings(page);

    const phone = '+995 555 12 34 56';
    const ssid = 'CafeLinvilleGuest';
    const password = 'kh4ch4puri-2026';

    await page.getByTestId('settings-location-phone').fill(phone);
    await page.getByTestId('settings-location-wifi-ssid').fill(ssid);
    await page.getByTestId('settings-location-wifi-password').fill(password);

    const [putResp] = await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes(`/api/menus/${menu.id}`) && r.request().method() === 'PUT',
      ),
      page.getByTestId('settings-location-save').click(),
    ]);
    expect(putResp.ok()).toBeTruthy();

    const row = await prismaTest.menu.findUnique({ where: { id: menu.id } });
    expect(row?.phone).toBe(phone);
    expect(row?.wifiSsid).toBe(ssid);
    expect(row?.wifiPassword).toBe(password);

    // Save bar should disappear once dirty resolves.
    await expect(page.getByTestId('settings-location')).toHaveAttribute(
      'data-dirty',
      'false',
    );

    // Verify on the public menu page
    await page.goto(`/m/${menu.slug}`);
    const phoneLink = page.locator(`a[href="tel:${phone.replace(/\s+/g, '')}"]`);
    await expect(phoneLink).toBeVisible();

    // Wi-Fi button opens a modal with the new SSID + password
    await page.getByRole('button', { name: 'Wi-Fi' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText(ssid);
    await expect(dialog).toContainText(password);
  });

  // ── Functional: wcImageUrl upload + public modal ──────────────────────────

  test('functional: uploading wcImageUrl saves it and renders in public WC modal', async ({
    page,
  }) => {
    const { menu } = await seedAndOpenSettings(page);

    const wcDirection = 'Turn left, end of the corridor';
    await page.getByTestId('settings-location-wc-direction').fill(wcDirection);

    // Tiny 1×1 PNG buffer
    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64',
    );

    // The settings page contains multiple ImageUpload widgets (SEO share image,
    // and our WC photo). Scope to the WC image upload's hidden file input.
    const wcImageInput = page
      .getByTestId('settings-location-wc-image')
      .locator('input[type="file"]');

    const [uploadResp] = await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/api/upload') && r.request().method() === 'POST',
      ),
      wcImageInput.setInputFiles({
        name: 'wc.png',
        mimeType: 'image/png',
        buffer: pngBuffer,
      }),
    ]);
    expect(uploadResp.ok()).toBeTruthy();
    const uploadBody = await uploadResp.json();
    expect(uploadBody.data?.url).toBeTruthy();

    const [putResp] = await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes(`/api/menus/${menu.id}`) && r.request().method() === 'PUT',
      ),
      page.getByTestId('settings-location-save').click(),
    ]);
    expect(putResp.ok()).toBeTruthy();

    const row = await prismaTest.menu.findUnique({ where: { id: menu.id } });
    expect(row?.wcImageUrl).toBeTruthy();
    expect(row?.wcDirection).toBe(wcDirection);

    // Verify on public menu — restroom button opens a modal containing the image.
    await page.goto(`/m/${menu.slug}`);
    await page.getByRole('button', { name: 'Restroom' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText(wcDirection);
    const wcImage = dialog.locator('img').first();
    await expect(wcImage).toBeVisible();
    expect(await wcImage.getAttribute('src')).toContain(row!.wcImageUrl as string);
  });

  // ── Functional: discard reverts dirty edits ────────────────────────────────

  test('functional: discard reverts unsaved changes', async ({ page }) => {
    await seedAndOpenSettings(page);

    const phoneInput = page.getByTestId('settings-location-phone');
    await phoneInput.fill('+995 100 00 00 00');

    await expect(page.getByTestId('settings-location')).toHaveAttribute(
      'data-dirty',
      'true',
    );

    await page.getByTestId('settings-location-discard').click();
    await expect(phoneInput).toHaveValue('');
    await expect(page.getByTestId('settings-location')).toHaveAttribute(
      'data-dirty',
      'false',
    );
  });
});
