import { defineConfig, devices } from '@playwright/test';
import { config as loadDotenv } from 'dotenv';
import path from 'path';

// Load apps/web/.env.local so that DATABASE_URL and AUTH_SECRET are available
// in the test process (seed helpers run in the test process, not in Next.js).
loadDotenv({ path: path.resolve(__dirname, 'apps/web/.env.local') });

// Share the test-auth flag with the test process itself so seed helpers and
// fixtures can assert it's set. The webServer block below sets the same flag
// for the spawned dev server.
process.env.ENABLE_TEST_AUTH = '1';

// Deterministic CRON_SECRET for tests so the cron-cleanup spec can call the
// endpoint with a known bearer. Reuses the user's value if they set one
// locally, otherwise picks a fixed test default and forwards it to the dev
// server below so both sides agree.
const TEST_CRON_SECRET = process.env.CRON_SECRET ?? 'test-cron-secret';
process.env.CRON_SECRET = TEST_CRON_SECRET;

// Visual-diff tolerance. Default 0.05 (5%). Override via PLAYWRIGHT_MAX_DIFF_RATIO
// for noisy local runs or stricter CI sweeps.
const maxDiffPixelRatio = Number(process.env.PLAYWRIGHT_MAX_DIFF_RATIO ?? 0.05);

// Base URL for the dev server. Override via PLAYWRIGHT_BASE_URL when running
// against a deployed preview (e.g. Vercel preview URLs in CI).
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './tests/e2e',
  snapshotDir: './tests/e2e/__screenshots__',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI ? [['list'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
  timeout: 30_000,
  expect: {
    timeout: 5_000,
    toHaveScreenshot: {
      maxDiffPixelRatio,
      animations: 'disabled',
      caret: 'hide',
    },
  },
  use: {
    baseURL,
    trace: isCI ? 'retain-on-failure' : 'on-first-retry',
    screenshot: 'only-on-failure',
    video: isCI ? 'retain-on-failure' : 'off',
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'mobile',
      use: {
        ...devices['iPhone 13'],
      },
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: 'pnpm dev',
        url: baseURL,
        env: { ENABLE_TEST_AUTH: '1', CRON_SECRET: TEST_CRON_SECRET },
        reuseExistingServer: !isCI,
        timeout: 120_000,
        stdout: 'pipe',
        stderr: 'pipe',
      },
});
