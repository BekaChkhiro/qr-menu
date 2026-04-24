// Test for T10.2 Form Controls.
// Run:      pnpm test:e2e tests/e2e/components/forms.spec.ts
// Baseline: pnpm test:e2e:update tests/e2e/components/forms.spec.ts
//
// Spec requires (from PROJECT_PLAN.md T10.2):
//   - Visual: forms-showcase.png
//   - Functional: typing into Input updates value, Zod error displays red
//     border + helper, Switch toggles, Checkbox supports indeterminate,
//     Segmented changes active, Dropzone accepts file.set_input_files().

import { test, expect } from '@playwright/test';
import path from 'node:path';

const SHOWCASE_URL = '/test/components/forms';

test.describe('T10.2 — Form Controls', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(SHOWCASE_URL);
    await expect(page.getByTestId('forms-showcase')).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
  });

  // ── 1. Visual baseline ────────────────────────────────────────────────────

  test('visual: forms showcase matches baseline', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'Desktop-only visual baseline');

    // Disable animations so the baseline is stable.
    await page.addStyleTag({
      content: '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }',
    });

    await expect(page).toHaveScreenshot('forms-showcase.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });

  // ── 2. Page structure ─────────────────────────────────────────────────────

  test('functional: showcase renders all major sections', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /form controls/i })).toBeVisible();
    await expect(page.getByRole('region', { name: /inputs.*textarea/i })).toBeVisible();
    await expect(page.getByRole('region', { name: /select.*combobox.*multi-select/i })).toBeVisible();
    await expect(page.getByRole('region', { name: /toggle primitives/i })).toBeVisible();
    await expect(page.getByRole('region', { name: /dropzone/i })).toBeVisible();
    await expect(page.getByTestId('interactive-section')).toBeVisible();
  });

  // ── 3. Typing into Input updates the value ────────────────────────────────

  test('functional: typing into Input updates the controlled value', async ({ page }) => {
    const input = page.getByTestId('it-input');
    const echo = page.getByTestId('it-input-value');

    await input.fill('xinkali');
    // React state propagates to the echo <span>.
    await expect(echo).toHaveText('xinkali');

    // DOM value also reflects the typed string.
    await expect(input).toHaveValue('xinkali');
  });

  // ── 4. Error state shows red border + helper ──────────────────────────────

  test('functional: error state shows red border + error helper', async ({ page }) => {
    const input = page.getByTestId('it-email');

    // Type an invalid value → validation kicks in.
    await input.fill('not-an-email');

    // aria-invalid flag is set by the Input component.
    await expect(input).toHaveAttribute('aria-invalid', 'true');

    // The wrapper gains the `border-danger` utility class.
    const wrapper = input.locator('xpath=..');
    const wrapperClass = await wrapper.getAttribute('class') ?? '';
    expect(wrapperClass, 'wrapper should carry danger border class').toContain('border-danger');

    // The helper slot flips to a Field.Error with role="alert".
    const errorHelper = page.getByTestId('it-email-error');
    await expect(errorHelper).toBeVisible();
    await expect(errorHelper).toContainText(/valid email/i);
    await expect(errorHelper).toHaveAttribute('role', 'alert');
  });

  // ── 5. Switch toggles ─────────────────────────────────────────────────────

  test('functional: Switch toggles on click', async ({ page }) => {
    const sw = page.getByTestId('it-switch');
    const echo = page.getByTestId('it-switch-state');

    // Initially off.
    await expect(sw).toHaveAttribute('data-state', 'unchecked');
    await expect(echo).toHaveText('off');

    await sw.click();

    await expect(sw).toHaveAttribute('data-state', 'checked');
    await expect(echo).toHaveText('on');

    await sw.click();

    await expect(sw).toHaveAttribute('data-state', 'unchecked');
    await expect(echo).toHaveText('off');
  });

  // ── 6. Checkbox supports indeterminate ────────────────────────────────────

  test('functional: Checkbox supports indeterminate state', async ({ page }) => {
    const checkbox = page.getByTestId('it-checkbox');
    const echo = page.getByTestId('it-checkbox-state');
    const cycle = page.getByTestId('it-checkbox-cycle');

    // Initial: indeterminate (set by default state in the showcase).
    await expect(checkbox).toHaveAttribute('data-state', 'indeterminate');
    await expect(echo).toHaveText('indeterminate');

    // Cycle → checked.
    await cycle.click();
    await expect(checkbox).toHaveAttribute('data-state', 'checked');
    await expect(echo).toHaveText('checked');

    // Cycle → unchecked.
    await cycle.click();
    await expect(checkbox).toHaveAttribute('data-state', 'unchecked');
    await expect(echo).toHaveText('unchecked');

    // Cycle → indeterminate again.
    await cycle.click();
    await expect(checkbox).toHaveAttribute('data-state', 'indeterminate');
    await expect(echo).toHaveText('indeterminate');
  });

  // ── 7. Segmented changes active ───────────────────────────────────────────

  test('functional: Segmented control switches active item', async ({ page }) => {
    const day = page.getByTestId('it-seg-day');
    const week = page.getByTestId('it-seg-week');
    const month = page.getByTestId('it-seg-month');
    const echo = page.getByTestId('it-seg-active');

    // Default is "week".
    await expect(week).toHaveAttribute('aria-checked', 'true');
    await expect(echo).toHaveText('week');

    await day.click();
    await expect(day).toHaveAttribute('aria-checked', 'true');
    await expect(week).toHaveAttribute('aria-checked', 'false');
    await expect(echo).toHaveText('day');

    await month.click();
    await expect(month).toHaveAttribute('aria-checked', 'true');
    await expect(echo).toHaveText('month');
  });

  // ── 8. Dropzone accepts setInputFiles ─────────────────────────────────────

  test('functional: Dropzone accepts setInputFiles() and shows filename', async ({ page }) => {
    const dropzone = page.getByTestId('it-dropzone');
    const echo = page.getByTestId('it-dropzone-file');

    // Initially empty.
    await expect(echo).toHaveText('(none)');

    // Target the hidden file input inside the dropzone. Playwright can set
    // files directly on a disabled-from-the-eye `<input type=file>` node.
    const fileInput = dropzone.getByTestId('dropzone-input');

    await fileInput.setInputFiles({
      name: 'hero.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-jpeg-bytes'),
    });

    await expect(echo).toHaveText('hero.jpg');

    // The dropzone should now render in filled state.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const zone = dropzone; // already scoped
    await expect(dropzone).toHaveAttribute('data-state', 'filled');
  });

  // ── 9. Slider reacts to keyboard ──────────────────────────────────────────

  test('functional: Slider reacts to keyboard arrows', async ({ page }) => {
    // Start state — the interactive slider begins at 40.
    const sliderEcho = page.getByTestId('it-slider-value');
    await expect(sliderEcho).toHaveText('40');

    // Scroll the slider into view, then hover+click the thumb so Radix
    // attaches its keyboard handlers reliably. `.press()` on a not-yet-focused
    // element is flaky in Radix — explicit click is more robust.
    const slider = page.getByTestId('it-slider');
    await slider.scrollIntoViewIfNeeded();
    const thumb = slider.locator('[role="slider"]').first();
    await thumb.click();
    await page.keyboard.press('ArrowRight');

    await expect(sliderEcho).toHaveText('41');
  });

  // ── 10. Multi-select adds chip on Enter ──────────────────────────────────

  test('functional: Multi-select adds a chip on Enter and removes on click', async ({ page }) => {
    const wrapper = page.getByTestId('it-multi');
    const count = page.getByTestId('it-multi-count');
    const input = wrapper.locator('input');

    await expect(count).toHaveText('1'); // seeded with "khachapuri"

    await input.fill('badrijani');
    await input.press('Enter');

    await expect(count).toHaveText('2');
    await expect(wrapper).toContainText('badrijani');

    // Remove "khachapuri" chip via its remove button.
    const removeBtn = wrapper.getByRole('button', { name: /remove khachapuri/i });
    await removeBtn.click();
    await expect(count).toHaveText('1');
  });
});

// Keep a reference to `path` so ESLint doesn't complain about unused import;
// tests may later grow to use fixtures from disk.
void path;
