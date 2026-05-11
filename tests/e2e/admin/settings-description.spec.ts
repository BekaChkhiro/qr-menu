// Test for T20.9 Settings Tab — Description Editor.
// Run:     pnpm test:e2e tests/e2e/admin/settings-description.spec.ts
// Update:  pnpm test:e2e:update tests/e2e/admin/settings-description.spec.ts
//
// Covers:
//   Visual     — settings-description card on /admin/menus/[id]?tab=settings
//   Functional —
//     - typing a new description + Save fires PUT /api/menus/:id with the new
//       value, the response carries the updated string, and the DB row matches;
//     - reloading /m/{slug} renders <meta name="description"> with the new value
//       (no metaDescription set);
//     - clearing the description and re-saving falls back to the default copy.

import { expect, test, type Page } from '@playwright/test';

import { loginAs } from '../fixtures/auth';
import { prismaTest, resetDb, seedMenu, seedUser } from '../fixtures/seed';

const SLUG_BASE = 'linville-t209';

async function seedAndOpenSettings(page: Page) {
  const email = 'nino-description@cafelinville.ge';
  const user = await seedUser({
    plan: 'STARTER',
    name: 'Nino Kapanadze',
    email,
  });
  const menu = await seedMenu({
    userId: user.id,
    status: 'PUBLISHED',
    categoryCount: 2,
    productCount: 3,
    name: 'Café Linville — Dinner',
    slug: SLUG_BASE,
  });
  await loginAs(page, email);
  await page.goto(`/admin/menus/${menu.id}?tab=settings`);
  await expect(page.getByTestId('settings-tab')).toBeVisible();
  return { user, menu };
}

test.describe('settings tab · Description editor (T20.9)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ context }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop',
      'Desktop-only tab; mobile variant lands in T17.3',
    );
    await resetDb();
    await context.clearCookies();
    await context.addCookies([
      { name: 'NEXT_LOCALE', value: 'en', domain: 'localhost', path: '/' },
    ]);
  });

  // ── Visual ─────────────────────────────────────────────────────────────────

  test('visual: settings-description-card', async ({ page }) => {
    await seedAndOpenSettings(page);
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({
      content:
        '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }',
    });

    const section = page.getByTestId('settings-description');
    await expect(section).toBeVisible();
    // Description card sits above SEO so the meta-description fallback
    // relationship is visually obvious.
    await expect(page.getByTestId('settings-seo')).toBeVisible();

    await expect(section).toHaveScreenshot('settings-description-card.png', {
      maxDiffPixelRatio: 0.05,
    });
  });

  // ── Functional: edit + save ────────────────────────────────────────────────

  test('functional: edit description → Save patches /api/menus/:id and DB matches', async ({
    page,
  }) => {
    const { menu } = await seedAndOpenSettings(page);

    const section = page.getByTestId('settings-description');
    await expect(section).toHaveAttribute('data-dirty', 'false');

    const textarea = page.getByTestId('settings-description-textarea');
    const counter = page.getByTestId('settings-description-char-count');
    const save = page.getByTestId('settings-description-save');

    await expect(counter).toHaveText('0 / 500');
    await expect(save).toBeDisabled();

    const newDescription =
      'Small-batch coffee, khachapuri, and seasonal brunch on Rustaveli Avenue.';
    await textarea.fill(newDescription);
    await expect(counter).toHaveText(`${newDescription.length} / 500`);
    await expect(section).toHaveAttribute('data-dirty', 'true');
    await expect(save).toBeEnabled();

    const [putResp] = await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes(`/api/menus/${menu.id}`) &&
          r.request().method() === 'PUT',
      ),
      save.click(),
    ]);
    expect(putResp.ok()).toBeTruthy();

    const reqBody = JSON.parse(putResp.request().postData() || '{}');
    expect(reqBody.description).toBe(newDescription);

    const respBody = await putResp.json();
    expect(respBody.success).toBe(true);
    expect(respBody.data?.description).toBe(newDescription);

    const row = await prismaTest.menu.findUnique({ where: { id: menu.id } });
    expect(row?.description).toBe(newDescription);

    await expect(section).toHaveAttribute('data-dirty', 'false');
  });

  // ── Functional: meta description fallback on the public page ───────────────

  test('functional: /m/[slug] meta description reflects the saved description', async ({
    page,
  }) => {
    const { menu } = await seedAndOpenSettings(page);

    const newDescription =
      'Authentic Georgian small plates and seasonal cocktails — open daily until midnight.';

    // Save via the editor
    const textarea = page.getByTestId('settings-description-textarea');
    await textarea.fill(newDescription);
    await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes(`/api/menus/${menu.id}`) &&
          r.request().method() === 'PUT',
      ),
      page.getByTestId('settings-description-save').click(),
    ]);

    // Navigate to the public menu and check <meta name="description">
    await page.goto(`/m/${menu.slug}`);
    const metaContent = await page
      .locator('meta[name="description"]')
      .getAttribute('content');
    expect(metaContent).toBe(newDescription);
  });

  // ── Functional: clearing description falls back to the default copy ────────

  test('functional: clearing description re-saves null and falls back to default', async ({
    page,
  }) => {
    const { menu } = await seedAndOpenSettings(page);

    // Pre-populate description directly so the editor starts populated.
    await prismaTest.menu.update({
      where: { id: menu.id },
      data: { description: 'Stale description that we are about to clear.' },
    });
    await page.reload();
    await expect(page.getByTestId('settings-tab')).toBeVisible();

    const textarea = page.getByTestId('settings-description-textarea');
    await expect(textarea).toHaveValue(
      'Stale description that we are about to clear.',
    );

    await textarea.fill('');
    const [putResp] = await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes(`/api/menus/${menu.id}`) &&
          r.request().method() === 'PUT',
      ),
      page.getByTestId('settings-description-save').click(),
    ]);
    expect(putResp.ok()).toBeTruthy();

    const reqBody = JSON.parse(putResp.request().postData() || '{}');
    expect(reqBody.description).toBeNull();

    const row = await prismaTest.menu.findUnique({ where: { id: menu.id } });
    expect(row?.description).toBeNull();

    // Public meta description falls back to the hardcoded default copy.
    await page.goto(`/m/${menu.slug}`);
    const metaContent = await page
      .locator('meta[name="description"]')
      .getAttribute('content');
    expect(metaContent).toBe(`View the menu for ${menu.name}`);
  });

  // ── Functional: discard reverts to last saved value ────────────────────────

  test('functional: Discard reverts the textarea to the last saved value', async ({
    page,
  }) => {
    await seedAndOpenSettings(page);

    const textarea = page.getByTestId('settings-description-textarea');
    const section = page.getByTestId('settings-description');

    await textarea.fill('Draft I do not want to keep.');
    await expect(section).toHaveAttribute('data-dirty', 'true');

    await page.getByTestId('settings-description-discard').click();
    await expect(textarea).toHaveValue('');
    await expect(section).toHaveAttribute('data-dirty', 'false');
  });
});
