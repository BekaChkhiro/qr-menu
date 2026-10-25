import { describe, expect, it } from 'vitest';
import { selectOffersRailProducts } from '../offers-rail';

type P = { id: string; kind?: 'STANDARD' | 'COMBO' };

const combo = (id: string): P => ({ id, kind: 'COMBO' });
const dish = (id: string): P => ({ id, kind: 'STANDARD' });

// T2.7 (#12c) — the rail lists the system Offers category only.
describe('selectOffersRailProducts', () => {
  it('returns no products when the menu has no Offers category', () => {
    const rail = selectOffersRailProducts([
      { isSystemOffers: false, products: [dish('a'), dish('b')] },
    ]);
    expect(rail).toEqual([]);
  });

  it('leaves kind=COMBO products of regular categories out of the rail', () => {
    const rail = selectOffersRailProducts([
      { isSystemOffers: false, products: [dish('a'), combo('c1'), dish('b')] },
      { isSystemOffers: false, products: [combo('c2')] },
    ]);
    expect(rail).toEqual([]);
  });

  it('lists the Offers category products in their order', () => {
    const rail = selectOffersRailProducts([
      { isSystemOffers: false, products: [combo('content-combo'), dish('a')] },
      { isSystemOffers: true, products: [combo('o2'), combo('o1'), dish('legacy')] },
      { isSystemOffers: false, products: [combo('c3')] },
    ]);
    expect(rail.map((p) => p.id)).toEqual(['o2', 'o1', 'legacy']);
  });

  it('does not hand back the category array itself', () => {
    const products = [combo('o1')];
    const rail = selectOffersRailProducts([{ isSystemOffers: true, products }]);
    expect(rail).toEqual(products);
    expect(rail).not.toBe(products);
  });
});
