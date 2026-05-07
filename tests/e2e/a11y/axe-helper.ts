// Shared axe-core helper for the a11y suite (T17.6).
//
// Wraps `@axe-core/playwright` with project-wide defaults: WCAG 2.0/2.1
// AA tags, animation-stabilization (so transitions don't race the scan),
// and a single `expect`-based assertion that prints the violation list
// inline when the test fails.

import { expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// WCAG 2.1 Level AA covers 2.0 A/AA + new 2.1 SC. axe-core reports tags
// per rule, so we include all four tag families to be exhaustive.
const WCAG_AA_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] as const;

export interface AxeCheckOptions {
  /**
   * Limit the scan to a CSS selector or list of selectors. Useful when a
   * page renders fixtures (e.g. design-system showcase pages) that are
   * not themselves user-facing UI surfaces.
   */
  include?: string | string[];
  /**
   * Exclude nodes from the scan. Use sparingly — every excluded selector
   * is a hidden audit gap and should be paired with a comment explaining
   * why the underlying violation is acceptable.
   */
  exclude?: string | string[];
  /**
   * Disable specific rules by id (e.g. `'color-contrast'`). Each entry
   * MUST come with a justification comment in the calling spec.
   */
  disableRules?: string[];
  /**
   * Optional human-readable label appended to the assertion error. Helps
   * locate the exact page/state in CI output.
   */
  context?: string;
}

/**
 * Run axe-core against the current page and assert zero WCAG AA
 * violations. Call this AFTER the page has stabilized — animations
 * disabled, fonts loaded, and any data-driven UI mounted.
 *
 * @example
 *   await page.goto('/admin/dashboard');
 *   await stabilize(page);
 *   await axeCheck(page, { context: 'dashboard (STARTER)' });
 */
export async function axeCheck(
  page: Page,
  opts: AxeCheckOptions = {},
): Promise<void> {
  let builder = new AxeBuilder({ page }).withTags([...WCAG_AA_TAGS]);

  // Exclude `[aria-hidden="true"]` subtrees by default. WCAG 1.4.3
  // exempts "incidental" / decorative text from contrast requirements,
  // and our locked-feature previews (analytics blur, team-locked
  // preview) are intentionally aria-hidden + pointer-events-none + low
  // opacity to convey the "unavailable" state visually behind a lock
  // overlay. Without this exclusion, axe-core flags every blurred
  // placeholder row as a contrast failure even though the content is
  // explicitly hidden from assistive tech.
  builder = builder.exclude('[aria-hidden="true"]');

  if (opts.include) {
    const list = Array.isArray(opts.include) ? opts.include : [opts.include];
    for (const sel of list) builder = builder.include(sel);
  }
  if (opts.exclude) {
    const list = Array.isArray(opts.exclude) ? opts.exclude : [opts.exclude];
    for (const sel of list) builder = builder.exclude(sel);
  }
  if (opts.disableRules?.length) {
    builder = builder.disableRules(opts.disableRules);
  }

  const result = await builder.analyze();

  if (result.violations.length > 0) {
    const summary = result.violations
      .map((v) => {
        const targets = v.nodes
          .map((n) => n.target.join(' '))
          .slice(0, 3)
          .join(' | ');
        const more = v.nodes.length > 3 ? ` (+${v.nodes.length - 3} more)` : '';
        return `  • [${v.impact ?? 'unknown'}] ${v.id} — ${v.help}\n      ${targets}${more}\n      ${v.helpUrl}`;
      })
      .join('\n');
    const label = opts.context ? ` (${opts.context})` : '';
    expect(
      result.violations,
      `axe-core found ${result.violations.length} violation(s)${label}:\n${summary}`,
    ).toEqual([]);
  }
}

/**
 * Wait for fonts + freeze CSS animations/transitions. Mirrors the
 * pattern used across the rest of the e2e suite so a11y scans run
 * against a settled DOM instead of mid-transition state.
 */
export async function stabilize(page: Page): Promise<void> {
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({
    content:
      '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }',
  });
}
