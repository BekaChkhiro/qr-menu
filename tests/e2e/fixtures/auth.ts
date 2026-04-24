import type { Page } from '@playwright/test';

/**
 * Logs a seeded user in without going through the credential UI.
 *
 * Hits `/api/test/session` (guarded by `ENABLE_TEST_AUTH=1`), which returns a
 * signed NextAuth session cookie. Playwright's `page.request` shares its
 * cookie jar with the page's browser context, so the cookie is applied
 * automatically — no manual `context.addCookies()` required.
 *
 * The target user MUST already exist in the database. Call `seedUser(...)`
 * (or `seedCompleteScenario(...)`) first.
 *
 * @param page - the Playwright Page (shares context/cookie jar with request)
 * @param email - email of a previously seeded user
 *
 * @example
 *   await seedUser({ email: 'demo@test.local', plan: 'STARTER' });
 *   await loginAs(page, 'demo@test.local');
 *   await page.goto('/admin/dashboard');
 */
export async function loginAs(page: Page, email: string): Promise<void> {
  const res = await page.request.post('/api/test/session', {
    data: { email },
  });

  if (!res.ok()) {
    const body = await res.text().catch(() => '<no body>');
    throw new Error(
      `loginAs(${email}) failed: ${res.status()} ${res.statusText()} — ${body}\n` +
        `Checklist:\n` +
        `  1. Is the dev server running with ENABLE_TEST_AUTH=1? ` +
        `(playwright.config.ts sets this when it spawns pnpm dev)\n` +
        `  2. Did you seedUser({ email: "${email}" }) before calling loginAs?\n` +
        `  3. Is AUTH_SECRET set in apps/web/.env.local?`,
    );
  }
}
