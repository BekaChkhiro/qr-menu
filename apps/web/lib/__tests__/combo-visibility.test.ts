import { describe, expect, it } from 'vitest';
import { filterComboProducts, publicMenuSelect, type SerializedPublicMenu } from '../public-menu';

function menu(overrides = {}): SerializedPublicMenu {
  return {
    timezone: 'Asia/Tbilisi',
    categories: [
      { id: 'regular', isSystemOffers: false, products: [{ id: 'dish' }] },
      { id: 'offers', isSystemOffers: true, products: [{ id: 'combo' }, { id: 'disabled-combo' }] },
    ],
    // Disabled promotions are excluded by publicMenuSelect, but their generated
    // products remain in the DB/category. They must not leak into public counts.
    promotions: [{ type: 'COMBO', comboProductId: 'combo', startDate: null, endDate: null, timeRestrictions: null, ...overrides }],
  } as unknown as SerializedPublicMenu;
}

const now = new Date('2026-09-23T10:00:00Z');
const ids = (value: SerializedPublicMenu) => value.categories.flatMap((c) => c.products.map((p) => p.id));

describe('public combo visibility after cache reads', () => {
  it('keeps live open-ended combos, removes disabled links, and updates category counts', () => {
    expect(publicMenuSelect.promotions.where.isActive).toBe(true);
    const result = filterComboProducts(menu(), now);
    expect(ids(result)).toEqual(['dish', 'combo']);
    expect(result.categories[1].products).toHaveLength(1);
  });

  it.each([
    { endDate: '2026-09-02T00:00:00Z' },
    { startDate: '2026-09-24T00:00:00Z' },
    { timeRestrictions: { enabled: true, windows: { tue: { start: '09:00', end: '18:00' } } } },
    { timeRestrictions: { enabled: true, windows: { wed: { start: '09:00', end: '13:00' } } } },
  ])('hides inactive combos and the empty Offers category: %j', (overrides) => {
    const result = filterComboProducts(menu(overrides), now);
    expect(ids(result)).toEqual(['dish']);
    expect(result.categories.map((c) => c.id)).toEqual(['regular']);
  });

  it('reevaluates the same cached data at café midnight without mutating it', () => {
    const cached = menu({ endDate: '2026-09-23T00:00:00Z' });
    expect(ids(filterComboProducts(cached, new Date('2026-09-23T19:59:59Z')))).toContain('combo');
    expect(ids(filterComboProducts(cached, new Date('2026-09-23T20:00:00Z')))).not.toContain('combo');
    expect(cached.categories[1].products).toHaveLength(2);
  });

  it('reevaluates café-local hours on the same cache entry', () => {
    const cached = menu({ timeRestrictions: { enabled: true, windows: { wed: { start: '13:00', end: '15:00' } } } });
    expect(ids(filterComboProducts(cached, now))).toContain('combo');
    expect(ids(filterComboProducts(cached, new Date('2026-09-23T11:00:00Z')))).not.toContain('combo');
  });
});
