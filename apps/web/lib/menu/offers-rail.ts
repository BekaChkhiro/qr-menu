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
