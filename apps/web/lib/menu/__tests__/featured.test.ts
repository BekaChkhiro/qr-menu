import { describe, it, expect } from 'vitest';
import { selectFeaturedProducts, FEATURED_FALLBACK_LIMIT } from '../featured';

// T1.11 — the "Recommended" rail: manual picks win, ribbon logic is the fallback.

type P = { id: string; ribbons: string[]; featuredRank?: number | null };

const ids = (list: P[]) => list.map((p) => p.id);

describe('selectFeaturedProducts', () => {
  it('shows manual picks sorted by featuredRank ascending', () => {
    const products: P[] = [
      { id: 'a', ribbons: [], featuredRank: 3 },
      { id: 'b', ribbons: [], featuredRank: null },
      { id: 'c', ribbons: [], featuredRank: 0 },
      { id: 'd', ribbons: ['POPULAR'], featuredRank: 1 },
    ];

    expect(ids(selectFeaturedProducts(products))).toEqual(['c', 'd', 'a']);
  });

  it('ignores ribbons once any manual pick exists', () => {
    const products: P[] = [
      { id: 'popular', ribbons: ['POPULAR'], featuredRank: null },
      { id: 'picked', ribbons: [], featuredRank: 5 },
    ];

    expect(ids(selectFeaturedProducts(products))).toEqual(['picked']);
  });

  it('keeps menu order for equal ranks', () => {
    const products: P[] = [
      { id: 'first', ribbons: [], featuredRank: 2 },
      { id: 'second', ribbons: [], featuredRank: 2 },
    ];

    expect(ids(selectFeaturedProducts(products))).toEqual(['first', 'second']);
  });

  it('does not cap manual picks at the fallback limit', () => {
    const products: P[] = Array.from({ length: FEATURED_FALLBACK_LIMIT + 4 }, (_, i) => ({
      id: `p${i}`,
      ribbons: [],
      featuredRank: i,
    }));

    expect(selectFeaturedProducts(products)).toHaveLength(FEATURED_FALLBACK_LIMIT + 4);
  });

  it('falls back to ribbon products, first 8, when there are no manual picks (regression)', () => {
    const products: P[] = [
      { id: 'plain', ribbons: ['NEW'], featuredRank: null },
      { id: 'popular', ribbons: ['POPULAR'], featuredRank: null },
      { id: 'chef', ribbons: ['SPICY', 'CHEF_CHOICE'], featuredRank: null },
      { id: 'daily', ribbons: ['DAILY_DISH'] },
    ];

    expect(ids(selectFeaturedProducts(products))).toEqual(['popular', 'chef', 'daily']);
  });

  it('caps the ribbon fallback at 8 products', () => {
    const products: P[] = Array.from({ length: 12 }, (_, i) => ({
      id: `p${i}`,
      ribbons: ['POPULAR'],
    }));

    const result = selectFeaturedProducts(products);
    expect(result).toHaveLength(FEATURED_FALLBACK_LIMIT);
    expect(ids(result)[0]).toBe('p0');
  });

  it('returns an empty list when nothing is picked and no ribbon matches', () => {
    const products: P[] = [{ id: 'x', ribbons: ['NEW', 'SPICY'], featuredRank: null }];

    expect(selectFeaturedProducts(products)).toEqual([]);
  });

  it('does not mutate the input array', () => {
    const products: P[] = [
      { id: 'b', ribbons: [], featuredRank: 2 },
      { id: 'a', ribbons: [], featuredRank: 1 },
    ];

    selectFeaturedProducts(products);
    expect(ids(products)).toEqual(['b', 'a']);
  });
});
