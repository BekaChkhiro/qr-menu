import { describe, expect, it } from 'vitest';
import { selectOffersRailProducts } from '../offers-rail';

type P = { id: string; kind?: 'STANDARD' | 'COMBO'; offerRank?: number | null };

const combo = (id: string, offerRank: number | null = null): P => ({ id, kind: 'COMBO', offerRank });
const dish = (id: string, offerRank: number | null = null): P => ({
  id,
  kind: 'STANDARD',
  offerRank,
});

// T2.7 (#12c) — the system Offers category; T3.3 (#3) — plus offerRank picks.
describe('selectOffersRailProducts', () => {
  it('returns no products when the menu has no Offers category and no picks', () => {
    const rail = selectOffersRailProducts([
      { isSystemOffers: false, products: [dish('a'), dish('b')] },
    ]);
    expect(rail).toEqual([]);
  });

  it('leaves unpicked kind=COMBO products of regular categories out of the rail', () => {
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

  it('fills the rail from picks alone when the menu has no Offers category', () => {
    const rail = selectOffersRailProducts([
      { isSystemOffers: false, products: [dish('a'), dish('b', 1)] },
    ]);
    expect(rail.map((p) => p.id)).toEqual(['b']);
  });

  it('puts picks first by rank across categories, then the Offers products', () => {
    const rail = selectOffersRailProducts([
      { isSystemOffers: false, products: [dish('a', 2), dish('b'), combo('content-combo', 0)] },
      { isSystemOffers: true, products: [combo('o1'), combo('o2')] },
      { isSystemOffers: false, products: [dish('c', 1)] },
    ]);
    expect(rail.map((p) => p.id)).toEqual(['content-combo', 'c', 'a', 'o1', 'o2']);
  });

  it('keeps category order for equal ranks', () => {
    const rail = selectOffersRailProducts([
      { isSystemOffers: false, products: [dish('a', 1), dish('b', 1)] },
      { isSystemOffers: false, products: [dish('c', 1)] },
    ]);
    expect(rail.map((p) => p.id)).toEqual(['a', 'b', 'c']);
  });

  it('lists a picked Offers product once, at its pick position', () => {
    const rail = selectOffersRailProducts([
      { isSystemOffers: true, products: [combo('o1'), combo('o2', 5)] },
      { isSystemOffers: false, products: [dish('a', 1)] },
    ]);
    expect(rail.map((p) => p.id)).toEqual(['a', 'o2', 'o1']);
  });

  it('does not hand back the category array itself', () => {
    const products = [combo('o1')];
    const rail = selectOffersRailProducts([{ isSystemOffers: true, products }]);
    expect(rail).toEqual(products);
    expect(rail).not.toBe(products);
  });
});
