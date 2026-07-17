// T21.9 — Promotion Form: Default Value Bug.
//
// Run:    pnpm test:e2e tests/e2e/admin/promotion-new-empty.spec.ts
// Update: pnpm test:e2e:update tests/e2e/admin/promotion-new-empty.spec.ts
//
// Bug:
//   - Opening "New promotion" pre-filled the discount numeric input with
//     `260` instead of leaving it empty, and the Save button was enabled
//     before any required field (title KA) was filled.
//
// Fix:
//   - All numeric defaults are `null` / empty string. Browser autofill is
//     disabled on the discount input via `autoComplete="off"` so a stale
//     value from a previous session can't be re-applied.
//   - Save button is `disabled` until the required Georgian title is filled.
//
// Phase-21 constraint: NO resetDb / NO TRUNCATE. Seed additive rows directly
// via `prismaTest`, clean up by user id in `afterAll`.

import { expect, test, type Page } from '@playwright/test';
import bcrypt from 'bcryptjs';

import { loginAs } from '../fixtures/auth';
import { prismaTest } from '../fixtures/seed';

const RUN_ID = `t21-9-${Date.now()}`;
const cleanupUserIds: string[] = [];

async function seedUserAndMenu(email: string, slug: string) {
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
      slug,
      status: 'DRAFT',
      enabledLanguages: ['KA', 'EN', 'RU'],
    },
  });

  return { user, menu };
}

async function openNewPromotion(page: Page, menuId: string) {
  await page.goto(`/admin/menus/${menuId}?tab=promotions`);
  await expect(page.getByTestId('editor-promotions-tab')).toBeVisible();
  await page.getByTestId('editor-promotions-new').click();
  await expect(page.getByTestId('promotion-drawer')).toBeVisible();
}

test.describe('T21.9 promotion form — empty defaults + Save guard', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({}, info) => {
    test.skip(
      info.project.name !== 'desktop',
      'Desktop-only drawer; mobile variant lands in T17.3.',
    );
  });

  test.afterAll(async () => {
    if (cleanupUserIds.length === 0) return;
    await prismaTest.user
      .deleteMany({ where: { id: { in: cleanupUserIds } } })
      .catch(() => undefined);
  });

  test('all numeric inputs open empty; autofill is disabled', async ({ page }) => {
    const email = `t21-9-empty-${RUN_ID}@test.local`;
    const { menu } = await seedUserAndMenu(email, `linville-${RUN_ID}-empty`);

    await loginAs(page, email);
    await openNewPromotion(page, menu.id);

    // Title + description (text/textarea) start empty in KA mode (default).
    await expect(page.getByTestId('promotion-title-input')).toHaveValue('');
    await expect(page.getByTestId('promotion-description-input')).toHaveValue('');

    // Discount value input is only shown for the Percentage promotion type
    // (T22.19). Assert it opens empty with autofill disabled.
    await page.getByTestId('promotion-type-percentage').click();
    const valueInput = page.getByTestId('promotion-discount-value-input');
    await expect(valueInput).toBeVisible();
    await expect(valueInput).toHaveValue('');
    // Autofill guard: a saved "260" (or any prior value) can't be re-applied
    // by the browser. The placeholder shows but value stays empty.
    await expect(valueInput).toHaveAttribute('autocomplete', 'off');
  });

  test('Save is disabled until the required Georgian title is filled', async ({ page }) => {
    const email = `t21-9-guard-${RUN_ID}@test.local`;
    const { menu } = await seedUserAndMenu(email, `linville-${RUN_ID}-guard`);

    await loginAs(page, email);
    await openNewPromotion(page, menu.id);

    const save = page.getByTestId('promotion-drawer-save');
    await expect(save).toBeDisabled();

    // Typing the required title flips Save to enabled.
    await page.getByTestId('promotion-title-input').fill('Happy Hour');
    await expect(save).toBeEnabled();

    // Clearing the title disables Save again.
    await page.getByTestId('promotion-title-input').fill('');
    await expect(save).toBeDisabled();
  });
});
