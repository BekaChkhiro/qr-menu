// T1.11 — which dishes the public "რეკომენდებული / Recommended" rail shows.
//
// Owner decision: manual picks win. If any available dish has a `featuredRank`,
// the rail is exactly those dishes, lowest rank first. With no manual picks the
// rail falls back to the ribbon logic it always had (first 8 matching dishes).
// Both public pages (`/m/[slug]` and `/m/[slug]/t/[code]`) call this helper so
// the two can't drift apart.

export const FEATURED_RIBBONS = ['POPULAR', 'CHEF_CHOICE', 'DAILY_DISH'] as const;
export const FEATURED_FALLBACK_LIMIT = 8;

export interface FeaturableProduct {
  ribbons: readonly string[];
  featuredRank?: number | null;
}

export function selectFeaturedProducts<T extends FeaturableProduct>(products: readonly T[]): T[] {
  const picked = products
    .filter((p) => p.featuredRank != null)
    // Array.prototype.sort is stable, so equal ranks keep menu order.
    .sort((a, b) => (a.featuredRank ?? 0) - (b.featuredRank ?? 0));
  if (picked.length > 0) return picked;

  return products
    .filter((p) => p.ribbons.some((r) => (FEATURED_RIBBONS as readonly string[]).includes(r)))
    .slice(0, FEATURED_FALLBACK_LIMIT);
}
