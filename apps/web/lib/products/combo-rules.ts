// T1.9 — a COMBO product is a bundle whose included dishes ("components") are
// ComboItem rows. Components must be plain (STANDARD) products of the same menu,
// owned by the same user, and there must be at least two of them. Combos may not
// nest, so a combo's public card never has to recurse and cycles are impossible.
//
// Pure rules, safe to import from client components (no database access).
// Database checks live in combo-items.ts.

export const COMBO_MIN_COMPONENTS = 2;
export const COMBO_MAX_COMPONENTS = 30;

export type ComboItemsError =
  | 'MIN_COMPONENTS'
  | 'DUPLICATE_COMPONENT'
  | 'SELF_REFERENCE'
  | 'NESTED_COMBO'
  | 'FOREIGN_COMPONENT';

export interface ComboComponentRef {
  id: string;
  kind: 'STANDARD' | 'COMBO';
}

/**
 * Pure rule check. `found` is the subset of requested component ids that exist
 * in this menu and belong to the owner (see loadComboComponents). Returns the
 * first violated rule, or null when the combo is valid.
 */
export function findComboItemsError(input: {
  comboId?: string | null;
  componentIds: string[];
  found: ComboComponentRef[];
}): ComboItemsError | null {
  const { comboId, componentIds, found } = input;
  const distinct = new Set(componentIds);

  if (distinct.size < COMBO_MIN_COMPONENTS) return 'MIN_COMPONENTS';
  if (distinct.size !== componentIds.length) return 'DUPLICATE_COMPONENT';
  if (comboId && distinct.has(comboId)) return 'SELF_REFERENCE';

  const byId = new Map(found.map((p) => [p.id, p]));
  for (const id of componentIds) {
    const component = byId.get(id);
    if (!component) return 'FOREIGN_COMPONENT';
    if (component.kind === 'COMBO') return 'NESTED_COMBO';
  }
  return null;
}

export const COMBO_ERROR_MESSAGES: Record<ComboItemsError, string> = {
  MIN_COMPONENTS: 'A combo needs at least two dishes.',
  DUPLICATE_COMPONENT: 'Each dish can be added to a combo only once.',
  SELF_REFERENCE: 'A combo cannot include itself.',
  NESTED_COMBO: 'A combo cannot include another combo.',
  FOREIGN_COMPONENT: 'Every dish in a combo must belong to this menu.',
};

export interface ComboItemLabelSource {
  quantity: number;
  component: { nameKa: string; nameEn: string | null; nameRu: string | null };
}

/**
 * Names of the dishes a combo includes, in the visitor's locale with Georgian as
 * the fallback. Quantities above one are shown as "2 × Name".
 */
export function comboItemLabels(
  items: ComboItemLabelSource[],
  locale: 'ka' | 'en' | 'ru'
): string[] {
  return items.map((item) => {
    const c = item.component;
    const name =
      locale === 'en' ? c.nameEn || c.nameKa : locale === 'ru' ? c.nameRu || c.nameKa : c.nameKa;
    return item.quantity > 1 ? `${item.quantity} × ${name}` : name;
  });
}
