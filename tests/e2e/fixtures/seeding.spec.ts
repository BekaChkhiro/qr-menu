import { test, expect } from '@playwright/test';
import {
  prismaTest,
  resetDb,
  seedCompleteScenario,
  seedUser,
} from './seed';
import { loginAs } from './auth';

// Proves the T9.3 fixtures behave as advertised:
//   - resetDb() actually clears tables
//   - seedUser() respects the requested plan
//   - loginAs() yields a real NextAuth session visible to /api/auth/session
//
// These tests run against the same DATABASE_URL as the dev server. No mocks.

test.describe('fixtures: resetDb + seedUser + loginAs', () => {
  // Serial so one test's TRUNCATE can't race another's seed.
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async () => {
    await resetDb();
  });

  test.afterAll(async () => {
    await prismaTest.$disconnect();
  });

  test('resetDb() empties the users table', async () => {
    await seedUser({ email: 'reset-probe@test.local' });
    const before = await prismaTest.user.count();
    expect(before).toBeGreaterThan(0);

    await resetDb();

    const after = await prismaTest.user.count();
    expect(after).toBe(0);
  });

  test('seedUser() creates a user with the requested plan', async () => {
    const user = await seedUser({
      plan: 'STARTER',
      email: 'plan-check@test.local',
      name: 'Nino Kapanadze',
    });

    expect(user.plan).toBe('STARTER');
    expect(user.email).toBe('plan-check@test.local');
    expect(user.name).toBe('Nino Kapanadze');

    const fetched = await prismaTest.user.findUnique({
      where: { email: 'plan-check@test.local' },
    });
    expect(fetched?.plan).toBe('STARTER');
  });

  test('loginAs() produces a session visible at /api/auth/session', async ({ page }) => {
    await seedUser({
      plan: 'PRO',
      email: 'login-probe@test.local',
      name: 'Nino Kapanadze',
    });

    await loginAs(page, 'login-probe@test.local');

    const sessionRes = await page.request.get('/api/auth/session');
    expect(sessionRes.ok()).toBeTruthy();

    const session = await sessionRes.json();
    expect(session).toBeTruthy();
    expect(session.user).toBeTruthy();
    expect(session.user.email).toBe('login-probe@test.local');
    expect(session.user.plan).toBe('PRO');
    expect(typeof session.user.id).toBe('string');
  });

  test('seedCompleteScenario(PRO) wires up menu + products + promotions + views', async () => {
    const { user, menu } = await seedCompleteScenario('PRO');

    expect(user.plan).toBe('PRO');
    expect(menu.userId).toBe(user.id);
    expect(menu.status).toBe('PUBLISHED');

    const categories = await prismaTest.category.count({ where: { menuId: menu.id } });
    expect(categories).toBe(3);

    const products = await prismaTest.product.count({
      where: { category: { menuId: menu.id } },
    });
    expect(products).toBe(15);

    const promotions = await prismaTest.promotion.count({ where: { menuId: menu.id } });
    expect(promotions).toBe(2);

    const views = await prismaTest.menuView.count({ where: { menuId: menu.id } });
    expect(views).toBe(600);
  });
});
