/**
 * Plan feature flag unit tests
 * Verifies hasFeature() returns the correct boolean for each plan tier.
 */

import { describe, it, expect } from 'vitest';
import { hasFeature, PLAN_FEATURES } from '@/lib/auth/permissions';

describe('hasFeature — arViewer', () => {
  it('is false for FREE', () => {
    expect(hasFeature('FREE', 'arViewer')).toBe(false);
  });

  it('is false for STARTER', () => {
    expect(hasFeature('STARTER', 'arViewer')).toBe(false);
  });

  it('is true for PRO', () => {
    expect(hasFeature('PRO', 'arViewer')).toBe(true);
  });

  it('is declared on every plan tier', () => {
    expect(PLAN_FEATURES.FREE.arViewer).toBe(false);
    expect(PLAN_FEATURES.STARTER.arViewer).toBe(false);
    expect(PLAN_FEATURES.PRO.arViewer).toBe(true);
  });
});
