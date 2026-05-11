// T21.2 — Cafe & Menu Name Multilingual Fields.
//
// Run:    pnpm test:e2e tests/e2e/admin/menu-name-i18n.spec.ts
// Update: pnpm test:e2e:update tests/e2e/admin/menu-name-i18n.spec.ts
//
// Bug: Menu.name was a single-language string, so switching language on
// /m/[slug] did not translate the menu name in the public header.
//
// Fix: Menu.{nameKa,nameEn,nameRu} columns; admin Settings → URL section
// has a language-tabbed name input (KA required, EN/RU PRO-gated); public
// header resolves the active locale with KA fallback.
//
// Phase 21 constraint: NO resetDb / NO TRUNCATE. The shared seed helpers
// (`seedUser` / `seedMenu`) refuse to run against Neon because they exist
// to support a wipe-and-reseed flow. This spec inserts its own additive
// rows directly via `prismaTest` and cleans them up in `afterAll` so it
// can run against the dev/Neon database without touching unrelated data.

import { expect, test, type Page } from '@playwright/test';
import bcrypt from 'bcryptjs';

import { loginAs } from '../fixtures/auth';
import { prismaTest } from '../fixtures/seed';

const RUN_ID = `t21-2-${Date.now()}`;
const cleanupUserIds: string[] = [];

interface SeedArgs {
  email: string;
  plan: 'FREE' | 'STARTER' | 'PRO';
  slug: string;
  name?: string;
  nameEn?: string | null;
  nameRu?: string | null;
}

async function seedUserAndMenu(opts: SeedArgs) {
  const user = await prismaTest.user.create({
    data: {
      email: opts.email.toLowerCase(),
      name: 'Nino Kapanadze',
      plan: opts.plan,
      password: await bcrypt.hash('password-not-used', 10),
      emailVerified: new Date(),
    },
  });
  cleanupUserIds.push(user.id);

  const name = opts.name ?? 'Café Linville';
  const menu = await prismaTest.menu.create({
    data: {
      userId: user.id,
      name,
      // Mirror name → nameKa so the Phase-21 multilingual public header
      // has a real KA value to render.
      nameKa: name,
      nameEn: opts.nameEn ?? null,
      nameRu: opts.nameRu ?? null,
      slug: opts.slug,
      status: 'PUBLISHED',
      publishedAt: new Date(),
      enabledLanguages: ['KA', 'EN', 'RU'],
    },
  });

  // One category + product so the public page renders normally and avoids the
  // "menu is empty" branch.
  const category = await prismaTest.category.create({
    data: {
      menuId: menu.id,
      nameKa: 'სასმელები',
      nameEn: 'Drinks',
      nameRu: 'Напитки',
      type: 'DRINK',
      sortOrder: 0,
    },
  });
  await prismaTest.product.create({
    data: {
      categoryId: category.id,
      nameKa: 'თარხუნის ლიმონათი',
      nameEn: 'Tarragon Lemonade',
      price: 6.0,
      sortOrder: 0,
    },
  });

  return { user, menu };
}

async function openSettings(page: Page, menuId: string) {
  await page.goto(`/admin/menus/${menuId}?tab=settings`);
  await expect(page.getByTestId('settings-tab')).toBeVisible();
  await expect(page.getByTestId('settings-menu-name')).toBeVisible();
}

test.describe('T21.2 multilingual menu name', () => {
  test.describe.configure({ mode: 'serial' });

  test.afterAll(async () => {
    if (cleanupUserIds.length === 0) return;
    // Cascade-deletes menus / categories / products / sessions for these users
    // only — leaves the rest of the dev database untouched.
    await prismaTest.user
      .deleteMany({ where: { id: { in: cleanupUserIds } } })
      .catch(() => undefined);
  });

  // ── Visual ───────────────────────────────────────────────────────────────

  test('visual: menu-name-langs', async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop',
      'Settings tab is desktop-only; mobile variant lands in T17.x.',
    );

    const { menu } = await seedUserAndMenu({
      email: `menu-name-visual-${RUN_ID}@test.local`,
      plan: 'PRO',
      slug: `linville-${RUN_ID}-vis`,
      nameEn: 'Café Linville',
      nameRu: 'Кафе Линвиль',
    });

    await loginAs(page, `menu-name-visual-${RUN_ID}@test.local`);
    await openSettings(page, menu.id);

    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({
      content:
        '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }',
    });

    const section = page.getByTestId('settings-menu-name');
    await expect(section).toHaveScreenshot('menu-name-langs.png', {
      maxDiffPixelRatio: 0.05,
    });
  });

  // ── Functional ───────────────────────────────────────────────────────────

  test('PRO user sets KA/EN/RU → PATCH succeeds → public header per locale', async ({
    page,
    context,
  }) => {
    const email = `menu-name-pro-${RUN_ID}@test.local`;
    const { menu } = await seedUserAndMenu({
      email,
      plan: 'PRO',
      slug: `linville-${RUN_ID}-pro`,
    });

    // Visitor cookie has to start clean so `?locale=` is the only signal.
    await context.clearCookies();

    await loginAs(page, email);
    await openSettings(page, menu.id);

    // KA tab is the default and gets the seeded value.
    const inputKa = page.getByTestId('settings-menu-name-input-KA');
    await expect(inputKa).toHaveValue('Café Linville');
    await inputKa.fill('კაფე ლინვილი');

    // Switch to EN, populate.
    await page.getByTestId('settings-menu-name-tab-EN').click();
    const inputEn = page.getByTestId('settings-menu-name-input-EN');
    await expect(inputEn).toBeVisible();
    await inputEn.fill('Café Linville Bistro');

    // Switch to RU, populate.
    await page.getByTestId('settings-menu-name-tab-RU').click();
    const inputRu = page.getByTestId('settings-menu-name-input-RU');
    await expect(inputRu).toBeVisible();
    await inputRu.fill('Кафе Линвиль');

    // Save and capture the PUT to assert the payload.
    const [putResp] = await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes(`/api/menus/${menu.id}`) &&
          r.request().method() === 'PUT',
      ),
      page.getByTestId('settings-url-visibility-save').click(),
    ]);
    expect(putResp.ok()).toBeTruthy();

    const reqBody = JSON.parse(putResp.request().postData() || '{}');
    expect(reqBody.nameKa).toBe('კაფე ლინვილი');
    expect(reqBody.nameEn).toBe('Café Linville Bistro');
    expect(reqBody.nameRu).toBe('Кафе Линвиль');

    // DB row reflects all three values; legacy `name` mirrors `nameKa`.
    const row = await prismaTest.menu.findUniqueOrThrow({
      where: { id: menu.id },
      select: { name: true, nameKa: true, nameEn: true, nameRu: true },
    });
    expect(row.nameKa).toBe('კაფე ლინვილი');
    expect(row.nameEn).toBe('Café Linville Bistro');
    expect(row.nameRu).toBe('Кафе Линвиль');
    expect(row.name).toBe('კაფე ლინვილი');

    // Public header per locale — `?locale=` query param wins over the cookie
    // (matches generateMetadata + page logic).
    await page.goto(`/m/${menu.slug}?locale=en`);
    await expect(page.getByRole('banner').locator('h1')).toHaveText(
      'Café Linville Bistro',
    );

    await page.goto(`/m/${menu.slug}?locale=ru`);
    await expect(page.getByRole('banner').locator('h1')).toHaveText(
      'Кафе Линвиль',
    );

    // No query param + cleared cookie → KA fallback.
    await context.clearCookies();
    await page.goto(`/m/${menu.slug}`);
    await expect(page.getByRole('banner').locator('h1')).toHaveText(
      'კაფე ლინვილი',
    );
  });

  test('locale fallback to KA when translation is empty', async ({
    page,
    context,
  }) => {
    const { menu } = await seedUserAndMenu({
      email: `menu-name-fallback-${RUN_ID}@test.local`,
      plan: 'PRO',
      slug: `linville-${RUN_ID}-fb`,
      name: 'Café Linville KA-Only',
    });

    await context.clearCookies();
    await page.goto(`/m/${menu.slug}?locale=en`);
    // No nameEn was seeded → header falls back to KA (which equals `name`).
    await expect(page.getByRole('banner').locator('h1')).toHaveText(
      'Café Linville KA-Only',
    );
  });

  test('non-PRO user is blocked from setting EN/RU translations', async ({
    page,
  }) => {
    const email = `menu-name-starter-${RUN_ID}@test.local`;
    const { menu } = await seedUserAndMenu({
      email,
      plan: 'STARTER',
      slug: `linville-${RUN_ID}-starter`,
    });

    await loginAs(page, email);
    await openSettings(page, menu.id);

    // EN and RU tabs render the lock icon and are disabled.
    const enTab = page.getByTestId('settings-menu-name-tab-EN');
    const ruTab = page.getByTestId('settings-menu-name-tab-RU');
    await expect(enTab).toHaveAttribute('data-locked', 'true');
    await expect(ruTab).toHaveAttribute('data-locked', 'true');
    await expect(enTab).toBeDisabled();
    await expect(ruTab).toBeDisabled();

    // The locked-helper copy is rendered.
    await expect(
      page.getByTestId('settings-menu-name-locked-helper'),
    ).toBeVisible();

    // Direct PATCH bypassing the UI must be rejected with 403.
    const direct = await page.request.put(`/api/menus/${menu.id}`, {
      data: { nameEn: 'Should Not Stick' },
    });
    expect(direct.status()).toBe(403);

    // DB row has no English translation.
    const row = await prismaTest.menu.findUniqueOrThrow({
      where: { id: menu.id },
      select: { nameEn: true },
    });
    expect(row.nameEn).toBeNull();
  });
});
