// T21.3 — Branding colors (primaryColor / accentColor) propagate to public menu.
// Run:    pnpm test:e2e tests/e2e/public/branding-colors.spec.ts
//
// Strategy: this spec NEVER resets the database. It creates a single
// uniquely-named user + menu, asserts the wiring, and deletes the user in
// afterAll (cascade removes the menu, categories, products).

import { expect, test } from '@playwright/test';

import { prismaTest, seedMenu, seedUser } from '../fixtures/seed';

const PRIMARY_HEX = '#ff0000';
const PRIMARY_RGB = 'rgb(255, 0, 0)';
const ACCENT_HEX = '#00bb88';
const ACCENT_RGB = 'rgb(0, 187, 136)';

const runId = Math.random().toString(36).slice(2, 8);
const slug = `t213-branding-${runId}`;
const email = `t213-branding-${runId}@test.local`;

let userId: string;

test.describe('T21.3 — public menu branding colors', () => {
  test.beforeAll(async () => {
    const user = await seedUser({ plan: 'PRO', email, name: 'Nino Kapanadze' });
    userId = user.id;

    const menu = await seedMenu({
      userId,
      status: 'PUBLISHED',
      slug,
      categoryCount: 1,
      productCount: 1,
      name: 'Café Linville',
    });

    await prismaTest.menu.update({
      where: { id: menu.id },
      data: { primaryColor: PRIMARY_HEX, accentColor: ACCENT_HEX },
    });
  });

  test.afterAll(async () => {
    if (userId) {
      await prismaTest.user.delete({ where: { id: userId } }).catch(() => {});
    }
  });

  test('CSS vars + branded surfaces reflect menu colors', async ({ page }) => {
    await page.goto(`/m/${slug}`);

    // CSS custom properties live on the public-menu root wrapper.
    const wrapper = page.locator('div.min-h-screen').first();
    await expect(wrapper).toBeVisible();

    const [primaryVar, accentVar] = await wrapper.evaluate((el) => [
      getComputedStyle(el).getPropertyValue('--menu-primary').trim(),
      getComputedStyle(el).getPropertyValue('--menu-accent').trim(),
    ]);
    expect(primaryVar.toLowerCase()).toBe(PRIMARY_HEX);
    expect(accentVar.toLowerCase()).toBe(ACCENT_HEX);

    // Active category-nav pill uses bg-[var(--menu-primary)] (no alpha).
    const activePill = page.locator('[role="tab"][aria-selected="true"]').first();
    await expect(activePill).toBeVisible();
    await expect(activePill).toHaveCSS('background-color', PRIMARY_RGB);

    // Footer "Digital Menu" link uses text-[var(--menu-accent)] (no alpha).
    const accentLink = page.getByRole('link', { name: 'Digital Menu' }).first();
    await expect(accentLink).toBeVisible();
    await expect(accentLink).toHaveCSS('color', ACCENT_RGB);
  });
});
