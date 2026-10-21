import { describe, expect, it } from 'vitest';
import { publicMenuSelect } from '@/lib/public-menu';
import { resolveOffersRail } from '../offers-rail';

describe('resolveOffersRail', () => {
  // Regression: menus created before T1.12 have no stored flags and must keep
  // today's public output — the rail shown above the body.
  it('keeps the legacy output for a menu without the flags', () => {
    expect(resolveOffersRail({})).toEqual({ enabled: true, onTop: true });
    expect(resolveOffersRail({ offersRailEnabled: null, offersRailPosition: null })).toEqual({
      enabled: true,
      onTop: true,
    });
  });

  it('places an enabled rail on top by default', () => {
    expect(resolveOffersRail({ offersRailEnabled: true, offersRailPosition: 'TOP' })).toEqual({
      enabled: true,
      onTop: true,
    });
  });

  it('places an enabled rail after the body when BOTTOM', () => {
    expect(resolveOffersRail({ offersRailEnabled: true, offersRailPosition: 'BOTTOM' })).toEqual({
      enabled: true,
      onTop: false,
    });
  });

  it('disables the rail when OFF, whatever the position', () => {
    expect(resolveOffersRail({ offersRailEnabled: false, offersRailPosition: 'TOP' }).enabled).toBe(false);
    expect(resolveOffersRail({ offersRailEnabled: false, offersRailPosition: 'BOTTOM' }).enabled).toBe(false);
  });

  it('reads both settings from the public menu select', () => {
    expect(publicMenuSelect.offersRailEnabled).toBe(true);
    expect(publicMenuSelect.offersRailPosition).toBe(true);
  });
});
