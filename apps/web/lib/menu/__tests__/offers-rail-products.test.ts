import { describe, expect, it } from 'vitest';
import { selectOffersRailProducts } from '../offers-rail';

type P = { id: string; kind?: 'STANDARD' | 'COMBO' };

const combo = (id: string): P => ({ id, kind: 'COMBO' });
const dish = (id: string): P => ({ id, kind: 'STANDARD' });

describe('selectOffersRailProducts', () => {
  it('returns no products when the menu has no combos', () => {
    const rail = selectOffersRailProducts([
      { isSystemOffers: false, products: [dish('a'), dish('b')] },
    ]);
    expect(rail).toEqual([]);
  });

  it('collects combo products from any category, in category then product order', () => {
    const rail = selectOffersRailProducts([
      { isSystemOffers: false, products: [dish('a'), combo('c1'), dish('b')] },
      { isSystemOffers: false, products: [dish('d')] },
      { isSystemOffers: false, products: [combo('c2'), combo('c3')] },
    ]);
    expect(rail.map((p) => p.id)).toEqual(['c1', 'c2', 'c3']);
  });

  it('keeps legacy system-Offers products that are not typed as combos', () => {
    const rail = selectOffersRailProducts([
      { isSystemOffers: false, products: [dish('a')] },
      { isSystemOffers: true, products: [dish('legacy')] },
    ]);
    expect(rail.map((p) => p.id)).toEqual(['legacy']);
  });

  it('de-duplicates a combo that appears in both a category and the Offers category', () => {
    const rail = selectOffersRailProducts([
      { isSystemOffers: false, products: [combo('c1'), dish('a')] },
      { isSystemOffers: true, products: [combo('c1'), combo('c2')] },
    ]);
    expect(rail.map((p) => p.id)).toEqual(['c1', 'c2']);
  });

  it('treats an absent kind as STANDARD', () => {
    const rail = selectOffersRailProducts([
      { isSystemOffers: false, products: [{ id: 'old' }, combo('c1')] },
    ]);
    expect(rail.map((p) => p.id)).toEqual(['c1']);
  });
});
