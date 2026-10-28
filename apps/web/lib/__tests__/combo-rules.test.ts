import { describe, expect, it } from 'vitest';
import { findComboItemsError, comboItemLabels } from '../products/combo-rules';
import { createProductSchema, updateProductSchema } from '../validations/product';
import { publicMenuSelect } from '../public-menu';

const dish = (id: string) => ({ id, kind: 'STANDARD' as const });

describe('ComboItem rules (T1.9)', () => {
  it('accepts a combo with two or more distinct owned dishes', () => {
    expect(
      findComboItemsError({
        comboId: 'combo',
        componentIds: ['a', 'b'],
        found: [dish('a'), dish('b')],
      })
    ).toBeNull();
    expect(
      findComboItemsError({
        comboId: 'combo',
        componentIds: ['a', 'b', 'c'],
        found: [dish('a'), dish('b'), dish('c')],
      })
    ).toBeNull();
  });

  it('needs at least two components', () => {
    expect(findComboItemsError({ comboId: 'combo', componentIds: [], found: [] })).toBe(
      'MIN_COMPONENTS'
    );
    expect(findComboItemsError({ comboId: 'combo', componentIds: ['a'], found: [dish('a')] })).toBe(
      'MIN_COMPONENTS'
    );
  });

  it('does not count the same dish twice toward the minimum', () => {
    expect(
      findComboItemsError({ comboId: 'combo', componentIds: ['a', 'a'], found: [dish('a')] })
    ).toBe('MIN_COMPONENTS');
    expect(
      findComboItemsError({
        comboId: 'combo',
        componentIds: ['a', 'b', 'a'],
        found: [dish('a'), dish('b')],
      })
    ).toBe('DUPLICATE_COMPONENT');
  });

  it('rejects a combo that lists itself', () => {
    expect(
      findComboItemsError({ comboId: 'combo', componentIds: ['combo', 'a'], found: [dish('a')] })
    ).toBe('SELF_REFERENCE');
  });

  it('rejects components that are not owned dishes of this menu', () => {
    // A dish from another menu or another owner is absent from `found`.
    expect(
      findComboItemsError({ comboId: 'combo', componentIds: ['a', 'foreign'], found: [dish('a')] })
    ).toBe('FOREIGN_COMPONENT');
  });

  it('rejects combos nested inside combos', () => {
    expect(
      findComboItemsError({
        comboId: 'combo',
        componentIds: ['a', 'other-combo'],
        found: [dish('a'), { id: 'other-combo', kind: 'COMBO' }],
      })
    ).toBe('NESTED_COMBO');
  });

  it('reports the minimum before any lookup result matters', () => {
    expect(findComboItemsError({ comboId: 'combo', componentIds: ['combo'], found: [] })).toBe(
      'MIN_COMPONENTS'
    );
  });
});

describe('combo item labels for the public card (T1.9)', () => {
  const items = [
    { quantity: 1, component: { nameKa: 'ხაჭაპური', nameEn: 'Khachapuri', nameRu: 'Хачапури' } },
    { quantity: 2, component: { nameKa: 'ლიმონათი', nameEn: null, nameRu: 'Лимонад' } },
  ];

  it('uses the visitor locale', () => {
    expect(comboItemLabels(items, 'en')).toEqual(['Khachapuri', '2 × ლიმონათი']);
    expect(comboItemLabels(items, 'ru')).toEqual(['Хачапури', '2 × Лимонад']);
  });

  it('falls back to Georgian when a translation is missing', () => {
    expect(comboItemLabels(items, 'ka')).toEqual(['ხაჭაპური', '2 × ლიმონათი']);
    expect(comboItemLabels(items, 'en')[1]).toBe('2 × ლიმონათი');
  });

  it('is public through the menu query, with names, prices and quantity', () => {
    const products = publicMenuSelect.categories.select.products.select;
    expect(products.kind).toBe(true);
    expect(products.comboItems.select.quantity).toBe(true);
    expect(products.comboItems.select.component.select).toEqual({
      nameKa: true,
      nameEn: true,
      nameRu: true,
      price: true,
      oldPrice: true,
    });
  });
});

describe('product payload schemas accept combos (T1.9)', () => {
  const base = { categoryId: 'ckl0000000000000000000000', nameKa: 'კომბო', price: 20 };

  it('defaults a create payload to STANDARD with no items', () => {
    const parsed = createProductSchema.parse(base);
    expect(parsed.kind).toBe('STANDARD');
    expect(parsed.comboItems).toBeUndefined();
  });

  it('defaults each item quantity to 1', () => {
    const parsed = createProductSchema.parse({
      ...base,
      kind: 'COMBO',
      comboItems: [{ componentId: 'a' }, { componentId: 'b', quantity: 3 }],
    });
    expect(parsed.comboItems).toEqual([
      { componentId: 'a', quantity: 1 },
      { componentId: 'b', quantity: 3 },
    ]);
  });

  it('rejects an unknown kind and a quantity below 1', () => {
    expect(createProductSchema.safeParse({ ...base, kind: 'BUNDLE' }).success).toBe(false);
    expect(
      updateProductSchema.safeParse({
        kind: 'COMBO',
        comboItems: [{ componentId: 'a', quantity: 0 }],
      }).success
    ).toBe(false);
  });
});
