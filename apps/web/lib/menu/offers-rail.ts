// T1.12 — how the public menu places the Offers rail (combo promotions).
// Legacy menus have no stored value yet, so an absent flag reads as ON / TOP:
// exactly what the public page rendered before the switch existed.
export type OffersRailPosition = 'TOP' | 'BOTTOM';

export interface OffersRailSettings {
  offersRailEnabled?: boolean | null;
  offersRailPosition?: OffersRailPosition | null;
}

export function resolveOffersRail(menu: OffersRailSettings): { enabled: boolean; onTop: boolean } {
  return {
    enabled: menu.offersRailEnabled !== false,
    onTop: menu.offersRailPosition !== 'BOTTOM',
  };
}

export interface OffersRailCandidate {
  id: string;
  kind?: 'STANDARD' | 'COMBO';
}

export interface OffersRailSourceCategory<T extends OffersRailCandidate> {
  isSystemOffers: boolean;
  products: T[];
}

// T1.12 follow-up — combos are products (kind COMBO) that live in any category,
// so the rail gathers them from the whole menu. Categories arrive already sorted
// by sortOrder and products by their sortOrder, so one pass yields the rail in
// menu order. Legacy products of the system Offers category are included too;
// a product seen twice (a combo that sits in Offers) keeps its first position.
export function selectOffersRailProducts<T extends OffersRailCandidate>(
  categories: ReadonlyArray<OffersRailSourceCategory<T>>,
): T[] {
  const seen = new Set<string>();
  const rail: T[] = [];
  for (const category of categories) {
    for (const product of category.products) {
      const isCombo = product.kind === 'COMBO';
      if (!isCombo && !category.isSystemOffers) continue;
      if (seen.has(product.id)) continue;
      seen.add(product.id);
      rail.push(product);
    }
  }
  return rail;
}
