import { describe, expect, it } from 'vitest';
import { publicMenuSelect } from '@/lib/public-menu';
import { orderCategoriesForBody, resolveOffersRail } from '../offers-rail';

describe('resolveOffersRail', () => {
  // Regression: menus created before T1.12 have no stored flags and must keep
  // today's public output — the rail shown above the body.
  it('keeps the legacy output for a menu without the flags', () => {
    expect(resolveOffersRail({})).toEqual({ enabled: true });
    expect(resolveOffersRail({ offersRailEnabled: null, offersRailPosition: null })).toEqual({
      enabled: true,
    });
  });

  // T3.2 — the position moves the Offers category, never the rail.
  it('enables the rail for both positions', () => {
    expect(resolveOffersRail({ offersRailEnabled: true, offersRailPosition: 'TOP' })).toEqual({
      enabled: true,
    });
    expect(resolveOffersRail({ offersRailEnabled: true, offersRailPosition: 'BOTTOM' })).toEqual({
      enabled: true,
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

describe('orderCategoriesForBody', () => {
  const cat = (id: string, isSystemOffers = false) => ({ id, isSystemOffers });
  // A stale sortOrder left Offers in the middle.
  const categories = [cat('a'), cat('offers', true), cat('b'), cat('c')];

  it('puts the Offers category first when TOP', () => {
    expect(orderCategoriesForBody(categories, 'TOP').map((c) => c.id)).toEqual([
      'offers',
      'a',
      'b',
      'c',
    ]);
  });

  it('puts the Offers category last when BOTTOM', () => {
    expect(orderCategoriesForBody(categories, 'BOTTOM').map((c) => c.id)).toEqual([
      'a',
      'b',
      'c',
      'offers',
    ]);
  });

  // Matches the column default (@default(TOP)) and the admin card's fallback.
  it('reads a missing position as TOP', () => {
    expect(orderCategoriesForBody(categories, null).map((c) => c.id)).toEqual([
      'offers',
      'a',
      'b',
      'c',
    ]);
  });

  it('keeps a menu without an Offers category as it is, in a new array', () => {
    const plain = [cat('a'), cat('b')];
    const ordered = orderCategoriesForBody(plain, 'TOP');
    expect(ordered).toEqual(plain);
    expect(ordered).not.toBe(plain);
  });
});
