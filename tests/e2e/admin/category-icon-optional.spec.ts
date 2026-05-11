// T21.7 — Category Icon Optional + Crop/Zoom.
//
// Run:    pnpm test:e2e tests/e2e/admin/category-icon-optional.spec.ts
// Update: pnpm test:e2e:update tests/e2e/admin/category-icon-optional.spec.ts
//
// Bug:
//   - Category form treated `iconUrl` as required: Zod's `.url()` rejected the
//     empty-string default, so the Save button never wired up onSubmit. Users
//     could not create a category without uploading an icon.
//   - The icon uploader skipped the crop/zoom step, so users had no way to
//     reframe a non-square photo for a circular icon.
//
// Fix:
//   - Schema accepts `''` for iconUrl; API normalises to `null`. The form
//     defaults to `null` and the submit handler stops blocking on icon presence.
//   - Admin list and public category-section header render a letter-badge
//     fallback (first glyph of `nameKa` on a 12 % tint of the menu's
//     `accentColor`) so missing icons stay visually anchored.
//   - ImageUpload for category icons has `enableCropper` set: selecting a file
//     opens the crop dialog with a 1×–3× zoom slider; confirming uploads the
//     cropped blob through the existing `/api/upload` preset=`logo` pipeline.
//
// Phase-21 constraint: NO resetDb / NO TRUNCATE. Seed additive rows directly
// via `prismaTest`, clean up by user id in `afterAll`.

import { expect, test, type Page } from '@playwright/test';
import bcrypt from 'bcryptjs';

import { loginAs } from '../fixtures/auth';
import { prismaTest } from '../fixtures/seed';

const RUN_ID = `t21-7-${Date.now()}`;
const cleanupUserIds: string[] = [];

interface SeedArgs {
  email: string;
  slug: string;
}

async function seedUserAndMenu(opts: SeedArgs) {
  const user = await prismaTest.user.create({
    data: {
      email: opts.email.toLowerCase(),
      name: 'Nino Kapanadze',
      plan: 'PRO',
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
      slug: opts.slug,
      status: 'DRAFT',
      enabledLanguages: ['KA', 'EN', 'RU'],
      // Distinctive accent so the letter-badge tint is provably wired
      // through to the rendered avatar.
      accentColor: '#d97706',
    },
  });

  return { user, menu };
}

async function openContentTab(page: Page, menuId: string) {
  await page.goto(`/admin/menus/${menuId}?tab=content`);
  await expect(page.getByTestId('categories-list')).toBeVisible();
}

test.describe('T21.7 category icon optional + crop/zoom', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async (_, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop',
      'Editor tabs are desktop-only — mobile coverage lives in editor-mobile.spec.ts.',
    );
  });

  test.afterAll(async () => {
    if (cleanupUserIds.length === 0) return;
    // Cascade-deletes menus / categories / products / sessions for these users
    // only — leaves the rest of the dev database untouched.
    await prismaTest.user
      .deleteMany({ where: { id: { in: cleanupUserIds } } })
      .catch(() => undefined);
  });

  test('create category with name only — no icon — POST succeeds and admin row shows the letter badge', async ({
    page,
  }) => {
    const email = `cat-icon-optional-${RUN_ID}@test.local`;
    const { menu } = await seedUserAndMenu({
      email,
      slug: `linville-${RUN_ID}-name-only`,
    });

    await loginAs(page, email);
    await openContentTab(page, menu.id);

    // Open the "Add category" sheet.
    await page.getByTestId('categories-add-dashed').click();
    await expect(page.getByTestId('category-form')).toBeVisible();

    // Fill only the required Georgian name — leave iconUrl untouched.
    const newName = 'ცხელი კერძები';
    await page.getByTestId('category-form-nameKa').fill(newName);

    // Save → POST succeeds. Previously the Zod resolver rejected the empty
    // iconUrl, so the request never fired; now it should hit the API.
    const [postResp] = await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes(`/api/menus/${menu.id}/categories`) &&
          r.request().method() === 'POST',
        { timeout: 5_000 },
      ),
      page.getByTestId('category-form-submit').click(),
    ]);
    expect(postResp.ok()).toBeTruthy();
    const respBody = await postResp.json();
    expect(respBody.success).toBe(true);
    // API normalised the empty string to null in the DB.
    expect(respBody.data.iconUrl).toBeNull();
    expect(respBody.data.nameKa).toBe(newName);

    // Admin list row renders the letter-badge fallback (no broken-image icon).
    const row = page.getByTestId('category-row').filter({
      has: page.locator(`[data-category-name="${newName}"]`),
    });
    await expect(row).toBeVisible();

    const avatar = row.getByTestId('category-icon');
    await expect(avatar).toHaveAttribute('data-icon-kind', 'letter');
    expect((await avatar.textContent())?.trim()).toBe(
      [...newName][0]?.toUpperCase() ?? '?',
    );
    // No <img> rendered when iconUrl is null.
    await expect(row.locator('img')).toHaveCount(0);
  });

  test('edit category → upload image opens crop dialog → confirm uploads a cropped logo URL', async ({
    page,
  }) => {
    const email = `cat-icon-crop-${RUN_ID}@test.local`;
    const { menu } = await seedUserAndMenu({
      email,
      slug: `linville-${RUN_ID}-crop`,
    });

    // Seed one category up-front so we can hit the Edit path immediately.
    const category = await prismaTest.category.create({
      data: {
        menuId: menu.id,
        nameKa: 'სალათები',
        sortOrder: 0,
      },
    });

    await loginAs(page, email);
    await openContentTab(page, menu.id);

    // Open the edit sheet for the seeded category.
    const row = page.getByTestId('category-row').filter({
      hasText: 'სალათები',
    });
    await row.getByTestId('category-action-edit').click();
    await expect(page.getByTestId('category-form')).toBeVisible();

    // 4×3 PNG so the cropper has something non-square to actually crop.
    // Generated by writing four solid-color rows into a canvas and exporting
    // as PNG; pixels here are kept tiny so the file ships in the test source.
    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAQAAAADCAYAAADBlivvAAAAEUlEQVQI12P4z8DAwMjAwAAACAYBAQCJ2/JEAAAAAElFTkSuQmCC',
      'base64',
    );

    // Selecting a file should open the cropper (enableCropper={true} in the
    // category form's ImageUpload).
    const fileInput = page
      .getByTestId('category-form-icon')
      .locator('input[type="file"]');

    await fileInput.setInputFiles({
      name: 'salad.png',
      mimeType: 'image/png',
      buffer: pngBuffer,
    });

    const cropper = page.getByTestId('image-cropper');
    await expect(cropper).toBeVisible();

    // Scale slider exposed and ranges 1× → 3× per the design tokens.
    const zoom = page.getByTestId('image-cropper-zoom');
    await expect(zoom).toHaveAttribute('min', '1');
    await expect(zoom).toHaveAttribute('max', '3');

    // Bump the zoom from 1 → 1.6 — simulates the operator scaling the crop.
    await zoom.fill('1.6');

    // Confirming the crop kicks off the upload to Cloudinary via /api/upload.
    const [uploadResp] = await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes('/api/upload') && r.request().method() === 'POST',
        { timeout: 15_000 },
      ),
      page.getByTestId('image-cropper-confirm').click(),
    ]);
    expect(uploadResp.ok()).toBeTruthy();
    const uploadBody = await uploadResp.json();
    const uploadedUrl = uploadBody.data?.url as string;
    expect(uploadedUrl).toBeTruthy();

    // The `logo` preset applies `c_limit,w_200,h_200` server-side, so the
    // saved URL must contain a Cloudinary crop transform (c_fill, c_limit,
    // c_thumb, …).
    expect(uploadedUrl).toMatch(/\/c_[a-z]+[^/]*(?:w_|h_)/);
    expect(uploadedUrl).toMatch(/\/(?:w_|h_)200/);

    // Cropper closes once the upload resolves and the icon preview swaps in
    // immediately. Save the category to persist iconUrl in the DB.
    await expect(cropper).toBeHidden({ timeout: 10_000 });

    const [putResp] = await Promise.all([
      page.waitForResponse(
        (r) =>
          r
            .url()
            .includes(`/api/menus/${menu.id}/categories/${category.id}`) &&
          r.request().method() === 'PUT',
        { timeout: 5_000 },
      ),
      page.getByTestId('category-form-submit').click(),
    ]);
    expect(putResp.ok()).toBeTruthy();

    const updated = await prismaTest.category.findUniqueOrThrow({
      where: { id: category.id },
      select: { iconUrl: true },
    });
    expect(updated.iconUrl).toBe(uploadedUrl);
  });

  test('public category section renders the letter-badge fallback tinted by the menu accent color', async ({
    page,
    context,
  }) => {
    const email = `cat-icon-public-${RUN_ID}@test.local`;
    const { menu } = await seedUserAndMenu({
      email,
      slug: `linville-${RUN_ID}-public`,
    });

    // Publish the menu and add a category WITHOUT an iconUrl so the public
    // page exercises the fallback path.
    await prismaTest.menu.update({
      where: { id: menu.id },
      data: { status: 'PUBLISHED', publishedAt: new Date() },
    });
    const category = await prismaTest.category.create({
      data: {
        menuId: menu.id,
        nameKa: 'სასმელები',
        nameEn: 'Drinks',
        sortOrder: 0,
      },
    });
    await prismaTest.product.create({
      data: {
        categoryId: category.id,
        nameKa: 'თარხუნის ლიმონათი',
        nameEn: 'Tarragon Lemonade',
        price: 6,
        sortOrder: 0,
      },
    });

    await context.clearCookies();
    await page.goto(`/m/${menu.slug}`);

    const avatar = page.getByTestId('public-category-avatar').first();
    await expect(avatar).toBeVisible();
    await expect(avatar).toHaveAttribute('data-icon-kind', 'letter');

    // Inline `color` carries the menu's accentColor, proving the fallback is
    // tinted by the menu's brand rather than a hardcoded neutral. Browsers
    // normalise hex → rgb when assigning via the style API, so accept either.
    const color = await avatar.evaluate((el) =>
      (el as HTMLElement).style.color,
    );
    expect(color.replace(/\s+/g, '').toLowerCase()).toMatch(
      /^(?:#d97706|rgb\(217,119,6\))$/,
    );
  });
});
