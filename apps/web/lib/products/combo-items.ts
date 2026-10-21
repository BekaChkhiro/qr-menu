import { prisma } from '@/lib/db';
import {
  COMBO_MIN_COMPONENTS,
  findComboItemsError,
  type ComboComponentRef,
  type ComboItemsError,
} from './combo-rules';

// T1.9 — database side of the combo rules. Pure rules are in combo-rules.ts.

/**
 * Components the owner may use in a combo of this menu. Both the menu and the
 * product are filtered by userId, so a foreign or other-menu id is simply absent
 * from the result and fails as FOREIGN_COMPONENT.
 */
export async function loadComboComponents(
  userId: string,
  menuId: string,
  componentIds: string[]
): Promise<ComboComponentRef[]> {
  if (componentIds.length === 0) return [];
  return prisma.product.findMany({
    where: {
      id: { in: [...new Set(componentIds)] },
      category: { menuId, menu: { userId } },
    },
    select: { id: true, kind: true },
  });
}

/** Validates a full list of combo items for one combo product. */
export async function validateComboItems(input: {
  userId: string;
  menuId: string;
  comboId?: string | null;
  componentIds: string[];
}): Promise<ComboItemsError | null> {
  const distinct = [...new Set(input.componentIds)];
  // Cheap rules first: no point in a lookup for a list that cannot pass.
  if (distinct.length < COMBO_MIN_COMPONENTS) return 'MIN_COMPONENTS';
  const found = await loadComboComponents(input.userId, input.menuId, distinct);
  return findComboItemsError({ ...input, found });
}
