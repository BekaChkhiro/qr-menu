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

// T2.7 (client #12c) — the rail lists the system Offers category only: the
// products COMBO promotions generate, in that category's product order. A
// kind=COMBO product made in Content stays a normal card in its own category
// (with its included-dishes line) and is not mirrored here.
export function selectOffersRailProducts<T extends OffersRailCandidate>(
  categories: ReadonlyArray<OffersRailSourceCategory<T>>,
): T[] {
  return categories.find((category) => category.isSystemOffers)?.products.slice() ?? [];
}
