// Test for T10.5 Overlays component library.
// Run:     pnpm test:e2e tests/e2e/components/overlays.spec.ts
// Update:  pnpm test:e2e:update tests/e2e/components/overlays.spec.ts
//
// Covers: Dialog (focus trap, Escape, backdrop), Drawer (slide-in), Popover
// (positioning), KebabMenu (destructive item), Tooltip (hover), and the ⌘K
// CommandPalette (toggle + live filter).

import { test, expect, Page } from '@playwright/test';

const SHOWCASE_URL = '/test/components/overlays';

// ── Helpers ──────────────────────────────────────────────────────────────

async function readActionLog(page: Page): Promise<string[]> {
  // Each <li> renders `> {msg}` but textContent concatenates them without
  // preserving the newlines between list items.  Split on the leading `>`
  // that every entry starts with to recover the per-entry message.
  const text = (await page.getByTestId('action-log').textContent()) ?? '';
  return text
    .split('>')
    .map((s) => s.trim())
    .filter(Boolean);
}

async function waitForFontsReady(page: Page) {
  await page.evaluate(() => document.fonts.ready);
}

// ── Suite ────────────────────────────────────────────────────────────────

test.describe('T10.5 — Overlays', () => {
  // Turbopack cold-compile of this page with all its client JS (cmdk, radix
  // popover/tooltip/dialog, lucide) can take 30-45s on the first request.
  // Give the navigation + the first `beforeEach` room so every test is not
  // retrying against a half-compiled module graph.
  test.beforeEach(async ({ page }, testInfo) => {
    testInfo.setTimeout(testInfo.timeout + 60_000);
    await page.goto(SHOWCASE_URL, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await expect(page.getByTestId('overlays-showcase')).toBeVisible({
      timeout: 30_000,
    });
    await waitForFontsReady(page);
  });

  // ── 1. Visual baseline ─────────────────────────────────────────────────

  test('visual: overlays showcase matches baseline', async ({
    page,
  }, testInfo) => {
    // Desktop-only — mobile variant is covered in Phase 17.
    test.skip(testInfo.project.name === 'mobile', 'Desktop-only visual baseline');

    // Freeze any animations so the spinner / slide-in / fade-in transitions
    // do not cause diff noise between CI runs.
    await page.addStyleTag({
      content:
        '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }',
    });

    await expect(page).toHaveScreenshot('overlays-showcase.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });

  // ── 2. Page structure ──────────────────────────────────────────────────

  test('functional: showcase renders major sections', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /overlays/i, level: 1 })).toBeVisible();
    await expect(page.getByRole('region', { name: /static baselines/i })).toBeVisible();
    await expect(page.getByRole('region', { name: /kbd primitive/i })).toBeVisible();
    await expect(page.getByTestId('interactive-section')).toBeVisible();
  });

  // ── 3. Dialog: Escape closes ───────────────────────────────────────────

  test('functional: Dialog Escape closes the modal and logs escape', async ({
    page,
  }) => {
    await page.getByTestId('open-destructive-dialog').click();
    await expect(page.getByTestId('destructive-dialog')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByTestId('destructive-dialog')).toBeHidden();

    const log = await readActionLog(page);
    expect(
      log,
      'Dialog should fire onEscapeKeyDown which logs "dialog:escape"'
    ).toContain('dialog:escape');
  });

  // ── 4. Dialog: backdrop click closes ──────────────────────────────────

  test('functional: Dialog backdrop click dismisses and logs backdrop-click', async ({
    page,
  }) => {
    await page.getByTestId('open-destructive-dialog').click();
    const dialog = page.getByTestId('destructive-dialog');
    await expect(dialog).toBeVisible();

    // Click near the top-left corner of the viewport — well outside the
    // centered dialog (max-w-[440px]) — which is on the overlay.
    // Use `dispatchEvent` instead of `mouse.click` to ensure we hit the
    // overlay element even if it's behind the dialog z-wise.
    await page.mouse.click(10, 10);

    await expect(dialog).toBeHidden();

    const log = await readActionLog(page);
    expect(
      log,
      'Dialog should fire onPointerDownOutside which logs "dialog:backdrop-click"'
    ).toContain('dialog:backdrop-click');
  });

  // ── 5. Dialog: focus trap ─────────────────────────────────────────────

  test('functional: Dialog traps focus within modal content', async ({
    page,
  }) => {
    await page.getByTestId('open-destructive-dialog').click();
    const dialog = page.getByTestId('destructive-dialog');
    await expect(dialog).toBeVisible();

    // On open the first focusable element inside the dialog should receive
    // focus (Radix auto-focuses the content).  Tab forward several times and
    // assert the active element is still inside the dialog — i.e. focus
    // never escapes to elements on the outer page.
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => {
        const active = document.activeElement as HTMLElement | null;
        const dialog = document.querySelector(
          '[data-testid="destructive-dialog"]'
        );
        return !!(active && dialog && dialog.contains(active));
      });
      expect(focused, `After Tab #${i + 1}, focus should stay inside dialog`).toBe(true);
    }
  });

  // ── 6. Drawer: slides in on open ──────────────────────────────────────

  test('functional: Drawer opens, shows content, and closes via close button', async ({
    page,
  }, testInfo) => {
    await page.getByTestId('open-drawer').click();

    const drawer = page.getByTestId('drawer');
    await expect(drawer).toBeVisible();

    // Radix writes data-state="open" on the content when it's open.
    await expect(drawer).toHaveAttribute('data-state', 'open');

    // Drawer should be anchored to the right side. We only need a loose
    // positional assertion — the visual baseline already verifies pixel-
    // exact chrome.
    const drawerBox = await drawer.boundingBox();
    const viewport = page.viewportSize();
    expect(drawerBox, 'Drawer should be in the DOM with a bounding box').not.toBeNull();
    if (drawerBox && viewport) {
      expect(
        drawerBox.x + drawerBox.width,
        'Drawer right edge should touch viewport right edge'
      ).toBeGreaterThanOrEqual(viewport.width - 2);

      // The Section H 540px spec only applies at `sm` and above (≥640px
      // viewport). Below that breakpoint the drawer is deliberately
      // `w-full` so small phones don't get a narrow floating sliver.
      // Phase 17 covers the dedicated bottom-sheet variant.
      if (testInfo.project.name !== 'mobile') {
        expect(
          drawerBox.width,
          'Desktop drawer should match the Section H 540px spec (±10px)'
        ).toBeGreaterThanOrEqual(530);
        expect(
          drawerBox.width,
          'Desktop drawer should not exceed 540px + 10px tolerance'
        ).toBeLessThanOrEqual(550);
      }
    }

    // Close via Escape since the header X is a Radix close button.
    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
  });

  // ── 7. Popover: opens, positions correctly, dismisses ────────────────

  test('functional: Popover opens below trigger and dismisses on outside click', async ({
    page,
  }) => {
    const trigger = page.getByTestId('open-popover');
    await trigger.click();

    const popover = page.getByTestId('popover');
    await expect(popover).toBeVisible();

    // Popover should be positioned near the trigger.  We assert that the
    // popover top is below the trigger bottom (or close to it when side=
    // "top" — but default is bottom). Tolerance: 100px so this is robust
    // across resolutions.
    const triggerBox = await trigger.boundingBox();
    const popoverBox = await popover.boundingBox();
    expect(triggerBox).not.toBeNull();
    expect(popoverBox).not.toBeNull();

    if (triggerBox && popoverBox) {
      // Horizontal overlap — the popover should share some horizontal space
      // with the trigger (align="start" + sideOffset=8).
      const horizontalOverlap =
        Math.min(
          triggerBox.x + triggerBox.width,
          popoverBox.x + popoverBox.width
        ) - Math.max(triggerBox.x, popoverBox.x);
      expect(
        horizontalOverlap,
        'Popover should horizontally overlap its trigger'
      ).toBeGreaterThan(0);

      // Vertical: popover top should be within 60px of trigger bottom.
      const verticalGap = popoverBox.y - (triggerBox.y + triggerBox.height);
      expect(
        Math.abs(verticalGap),
        `Popover vertical gap ~8px sideOffset (got ${verticalGap}px)`
      ).toBeLessThanOrEqual(60);
    }

    // Dismiss: click outside the popover.
    await page.mouse.click(10, 10);
    await expect(popover).toBeHidden();
  });

  // ── 8. KebabMenu: destructive item fires onSelect ─────────────────────

  test('functional: KebabMenu opens, items fire onSelect, destructive item has danger class', async ({
    page,
  }) => {
    await page.getByTestId('kebab-trigger').click();

    const menu = page.getByTestId('kebab-content');
    await expect(menu).toBeVisible();

    // Destructive item should use danger color utility class — this
    // protects against future refactors removing the destructive tone.
    const deleteItem = page.getByTestId('kebab-item-delete');
    const className = (await deleteItem.getAttribute('class')) ?? '';
    expect(
      className,
      'Destructive KebabMenuItem should include text-danger class'
    ).toContain('text-danger');

    // Click the destructive item to confirm onSelect fires, the menu
    // closes, and the log records the action.
    await deleteItem.click();
    await expect(menu).toBeHidden();

    const log = await readActionLog(page);
    expect(log, 'KebabMenu delete should log kebab:delete').toContain('kebab:delete');
  });

  // ── 9. Tooltip: dark tone on hover ────────────────────────────────────

  test('functional: Tooltip appears on hover of trigger', async ({ page }) => {
    const trigger = page.getByTestId('tooltip-trigger-dark');
    await trigger.hover();

    const tip = page.getByTestId('tooltip-content-dark');
    // The provider delayDuration is 100ms; Radix still needs a tick to
    // portal the content into place.  Playwright's default 5s expect
    // timeout is more than enough.
    await expect(tip).toBeVisible();

    // Sanity-check tone: dark variant sets bg-text-default (near-black)
    // and text-white.
    const className = (await tip.getAttribute('class')) ?? '';
    expect(
      className,
      'Dark tooltip should include bg-text-default and text-white'
    ).toMatch(/bg-text-default/);
    expect(className).toMatch(/text-white/);
  });

  // ── 10. Command Palette: ⌘K opens, typing filters, Enter selects ──────

  test('functional: ⌘K toggles the command palette from anywhere on the page', async ({
    page,
  }) => {
    // Ensure no input has focus so the keyboard shortcut handler runs.
    await page.mouse.click(1, 1);

    // Press ⌘K (macOS) / Ctrl+K (every other OS).  Playwright maps Meta to
    // macOS Cmd on WebKit/Chromium; we send both to keep the test portable.
    const isMac = process.platform === 'darwin';
    await page.keyboard.press(isMac ? 'Meta+K' : 'Control+K');

    const input = page.getByTestId('palette-input');
    await expect(input).toBeVisible();
    await expect(input).toBeFocused();

    // Toggle closed with the same shortcut.
    await page.keyboard.press(isMac ? 'Meta+K' : 'Control+K');
    await expect(input).toBeHidden();
  });

  test('functional: command palette filters results as user types', async ({
    page,
  }) => {
    await page.getByTestId('open-palette').click();
    const input = page.getByTestId('palette-input');
    await expect(input).toBeVisible();

    // Initially both khachapuri items are visible.
    await expect(page.getByTestId('palette-item-khachapuri-adjaruli')).toBeVisible();
    await expect(page.getByTestId('palette-item-khachapuri-imeruli')).toBeVisible();
    await expect(page.getByTestId('palette-item-badrijani')).toBeVisible();

    // Type "adjar" — cmdk should hide unmatched items (it unmounts them
    // from the visible DOM by setting their visibility; `toBeHidden()` is
    // the correct assertion).
    await input.fill('adjar');

    await expect(page.getByTestId('palette-item-khachapuri-adjaruli')).toBeVisible();
    await expect(page.getByTestId('palette-item-khachapuri-imeruli')).toBeHidden();
    await expect(page.getByTestId('palette-item-badrijani')).toBeHidden();

    // Enter selects the first visible match.
    await page.keyboard.press('Enter');
    await expect(input).toBeHidden();

    const log = await readActionLog(page);
    expect(
      log,
      'Enter on a filtered palette should select khachapuri-adjaruli'
    ).toContain('palette:select:khachapuri-adjaruli');
  });

  test('functional: command palette shows empty state when no matches', async ({
    page,
  }) => {
    await page.getByTestId('open-palette').click();
    const input = page.getByTestId('palette-input');
    await input.fill('zzzzzz-no-match');

    await expect(page.getByTestId('palette-empty')).toBeVisible();
    await expect(page.getByTestId('palette-empty')).toContainText(/no results/i);
  });
});
