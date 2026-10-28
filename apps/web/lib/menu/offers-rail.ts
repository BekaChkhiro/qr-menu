// T1.12 — the public Offers rail switch. Legacy menus have no stored value
// yet, so an absent flag reads as ON: what the public page rendered before the
// switch existed.
// T3.2 (client #2) — the rail always sits above the body; the TOP/BOTTOM
// setting no longer moves the rail but the system Offers category in the body
// (see orderCategoriesForBody), whether the rail is on or off.
export type OffersRailPosition = 'TOP' | 'BOTTOM';

export interface OffersRailSettings {
  offersRailEnabled?: boolean | null;
  offersRailPosition?: OffersRailPosition | null;
}

export function resolveOffersRail(menu: OffersRailSettings): { enabled: boolean } {
  return { enabled: menu.offersRailEnabled !== false };
}

/**
 * T3.2 — the body order with the system Offers category moved first (TOP, the
 * column default) or last (BOTTOM). The other categories keep their order, so
 * rendering never depends on a stale Offers sortOrder.
 */
export function orderCategoriesForBody<T extends { isSystemOffers: boolean }>(
  categories: ReadonlyArray<T>,
  position: OffersRailPosition | null | undefined,
): T[] {
  const offers = categories.filter((category) => category.isSystemOffers);
  const regular = categories.filter((category) => !category.isSystemOffers);
  return position === 'BOTTOM' ? [...regular, ...offers] : [...offers, ...regular];
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
