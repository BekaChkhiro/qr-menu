import { describe, it, expect } from 'vitest';
import {
  applyComboPricing,
  applyPromotionPricing,
  type SerializedPublicMenu,
  type SerializedPublicProduct,
  type SerializedPublicPromotion,
} from '../public-menu';

// T3.1 — client bug #1: a 50 ₾ combo of three 20 ₾ dishes showed 39.00 ₾ with
// 50.00 struck because a menu-wide −22% promotion discounted it again. Combos
// keep their combo price; the struck price is the dishes' own total.

const DISHES = 'cat-dishes';
const OFFERS = 'cat-offers';

type Component = { price?: number | string | null; oldPrice?: number | string | null };

function product(
  id: string,
  price: number,
  extra: Partial<SerializedPublicProduct> = {},
): SerializedPublicProduct {
  return { id, nameKa: id, price, oldPrice: null, ...extra } as SerializedPublicProduct;
}

function combo(id: string, price: number, components: Component[]): SerializedPublicProduct {
  return product(id, price, {
    kind: 'COMBO',
    comboItems: components.map((component, i) => ({
      quantity: 1,
      component: { nameKa: `dish-${i}`, nameEn: null, nameRu: null, ...component },
    })),
  });
}

function promo(overrides: Partial<SerializedPublicPromotion>): SerializedPublicPromotion {
  return {
    id: 'promo',
    discountType: 'PERCENTAGE',
    discountValue: 22,
    applyTo: 'ENTIRE_MENU',
    categoryId: null,
    type: 'PERCENTAGE',
    startDate: null,
    endDate: null,
    timeRestrictions: null,
    ...overrides,
  } as SerializedPublicPromotion;
}

function menu(
  categories: Array<{ id: string; products: SerializedPublicProduct[] }>,
  promotions: SerializedPublicPromotion[] = [],
): SerializedPublicMenu {
  return { timezone: 'Asia/Tbilisi', promotions, categories } as unknown as SerializedPublicMenu;
}

// Same order as the public pages: promotions first, then the combo strike.
const price = (m: SerializedPublicMenu) => applyComboPricing(applyPromotionPricing(m));

const find = (m: SerializedPublicMenu, id: string) =>
  m.categories.flatMap((c) => c.products).find((p) => p.id === id)!;
const num = (v: number | string | null) => (v == null ? null : Number(v));

describe('combo pricing (T3.1)', () => {
  it('keeps the combo price under a menu-wide 22% and strikes the dishes total', () => {
    const result = price(
      menu(
        [
          { id: DISHES, products: [product('dish', 10)] },
          {
            id: OFFERS,
            products: [combo('combo', 50, [{ price: 20 }, { price: 20 }, { price: 20 }])],
          },
        ],
        [promo({})],
      ),
    );
    const c = find(result, 'combo');
    expect(num(c.price)).toBe(50);
    expect(num(c.oldPrice)).toBe(60);
    // Ordinary dishes still get the promotion.
    const d = find(result, 'dish');
    expect(num(d.price)).toBe(7.8);
    expect(num(d.oldPrice)).toBe(10);
  });

  it('leaves a Content kind=COMBO product out of a CATEGORY promotion', () => {
    const result = price(
      menu(
        [{ id: DISHES, products: [combo('combo', 50, [{ price: 20 }, { price: 25 }])] }],
        [promo({ applyTo: 'CATEGORY', categoryId: DISHES, discountValue: 30 })],
      ),
    );
    const c = find(result, 'combo');
    expect(num(c.price)).toBe(50);
    expect(c.oldPrice).toBeNull();
  });

  it('skips FIXED_AMOUNT promotions too', () => {
    const result = price(
      menu(
        [{ id: DISHES, products: [combo('combo', 50, [{ price: 30 }, { price: 30 }])] }],
        [promo({ discountType: 'FIXED_AMOUNT', discountValue: 5 })],
      ),
    );
    expect(num(find(result, 'combo').price)).toBe(50);
    expect(num(find(result, 'combo').oldPrice)).toBe(60);
  });

  it('strikes nothing when the dishes cost no more than the combo', () => {
    const result = price(
      menu([{ id: DISHES, products: [combo('combo', 50, [{ price: 20 }, { price: 25 }])] }]),
    );
    expect(find(result, 'combo').oldPrice).toBeNull();
    const equal = price(
      menu([{ id: DISHES, products: [combo('combo', 50, [{ price: 25 }, { price: 25 }])] }]),
    );
    expect(find(equal, 'combo').oldPrice).toBeNull();
  });

  it("counts a component's manual list price (oldPrice) as its regular price", () => {
    const result = price(
      menu([
        {
          id: DISHES,
          products: [combo('combo', 50, [{ price: 20, oldPrice: 25 }, { price: 20 }, { price: 20 }])],
        },
      ]),
    );
    expect(num(find(result, 'combo').oldPrice)).toBe(65);
  });

  it('multiplies by quantity', () => {
    const c = combo('combo', 45, [{ price: 20 }, { price: 10 }]);
    c.comboItems![0].quantity = 2;
    const result = price(menu([{ id: DISHES, products: [c] }]));
    expect(num(find(result, 'combo').oldPrice)).toBe(50);
  });

  it('keeps a manual oldPrice on the combo itself', () => {
    const c = combo('combo', 50, [{ price: 20 }, { price: 20 }, { price: 20 }]);
    c.oldPrice = 55;
    const result = price(menu([{ id: DISHES, products: [c] }], [promo({})]));
    expect(num(find(result, 'combo').price)).toBe(50);
    expect(num(find(result, 'combo').oldPrice)).toBe(55);
  });

  it('strikes nothing for menus cached without component prices', () => {
    const cached = combo('combo', 50, [{}, {}, {}]);
    const result = price(menu([{ id: DISHES, products: [cached] }], [promo({})]));
    expect(num(find(result, 'combo').price)).toBe(50);
    expect(find(result, 'combo').oldPrice).toBeNull();
  });
});
