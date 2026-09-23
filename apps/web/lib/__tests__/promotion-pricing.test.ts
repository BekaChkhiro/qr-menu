import { describe, it, expect } from 'vitest';
import {
  applyPromotionPricing,
  type SerializedPublicMenu,
  type SerializedPublicProduct,
  type SerializedPublicPromotion,
} from '../public-menu';

// T24.15 — the precedence question raised in the Promotions V2 report:
//
//   "whole menu 5% is on → a category's 10% overrides it → but NOT another
//    category's 3%, since it doesn't beat the 5%, right?"
//
// Right. When several promotions reach the same dish the one producing the
// LOWEST final price wins, so a weaker category offer never undercuts a
// stronger menu-wide one. These tests pin that down.

const CAT_A = 'cat-a';
const CAT_B = 'cat-b';

function product(id: string, price: number): SerializedPublicProduct {
  return {
    id,
    nameKa: id,
    nameEn: null,
    nameRu: null,
    descriptionKa: null,
    descriptionEn: null,
    descriptionRu: null,
    price,
    oldPrice: null,
    discountWindows: null,
    currency: '₾',
    imageUrl: null,
    imageFocalX: null,
    imageFocalY: null,
    imageZoom: null,
    allergens: [],
    ribbons: [],
    isVegan: false,
    isVegetarian: false,
    calories: null,
    protein: null,
    fats: null,
    carbs: null,
    fiber: null,
    arEnabled: false,
    arModelUrl: null,
    arModelUrlIos: null,
    arPosterUrl: null,
    sortOrder: 0,
    variations: [],
  };
}

function promo(
  id: string,
  overrides: Partial<SerializedPublicPromotion>,
): SerializedPublicPromotion {
  return {
    id,
    titleKa: id,
    titleEn: null,
    titleRu: null,
    descriptionKa: null,
    descriptionEn: null,
    descriptionRu: null,
    imageUrl: null,
    startDate: null,
    endDate: null,
    sortOrder: 0,
    discountType: 'PERCENTAGE',
    discountValue: 10,
    applyTo: 'ENTIRE_MENU',
    categoryId: null,
    type: 'PERCENTAGE',
    backgroundColor: null,
    showTitle: true,
    timeRestrictions: null,
    ...overrides,
  };
}

function menu(promotions: SerializedPublicPromotion[]): SerializedPublicMenu {
  return {
    timezone: 'Asia/Tbilisi',
    promotions,
    categories: [
      { id: CAT_A, products: [product('a1', 100)] },
      { id: CAT_B, products: [product('b1', 100)] },
    ],
    // Only the fields applyPromotionPricing touches matter here.
  } as unknown as SerializedPublicMenu;
}

const priceOf = (m: SerializedPublicMenu, catId: string) =>
  Number(m.categories.find((c) => c.id === catId)!.products[0].price);
const oldPriceOf = (m: SerializedPublicMenu, catId: string) => {
  const v = m.categories.find((c) => c.id === catId)!.products[0].oldPrice;
  return v == null ? null : Number(v);
};

describe('promotion pricing precedence', () => {
  it('a stronger category discount overrides the menu-wide one', () => {
    const result = applyPromotionPricing(
      menu([
        promo('menu5', { discountValue: 5 }),
        promo('catA10', { applyTo: 'CATEGORY', categoryId: CAT_A, discountValue: 10 }),
      ]),
    );

    expect(priceOf(result, CAT_A)).toBe(90);
    expect(oldPriceOf(result, CAT_A)).toBe(100);
  });

  it('a weaker category discount does NOT undercut the menu-wide one', () => {
    const result = applyPromotionPricing(
      menu([
        promo('menu5', { discountValue: 5 }),
        promo('catB3', { applyTo: 'CATEGORY', categoryId: CAT_B, discountValue: 3 }),
      ]),
    );

    // The 3% must lose to the menu-wide 5% — 95, never 97.
    expect(priceOf(result, CAT_B)).toBe(95);
  });

  it('the full report scenario: 5% menu-wide, 10% on A, 3% on B', () => {
    const result = applyPromotionPricing(
      menu([
        promo('menu5', { discountValue: 5 }),
        promo('catA10', { applyTo: 'CATEGORY', categoryId: CAT_A, discountValue: 10 }),
        promo('catB3', { applyTo: 'CATEGORY', categoryId: CAT_B, discountValue: 3 }),
      ]),
    );

    expect(priceOf(result, CAT_A)).toBe(90); // 10% wins
    expect(priceOf(result, CAT_B)).toBe(95); // 5% wins, 3% ignored
  });

  it('a category promotion never reaches a different category', () => {
    const result = applyPromotionPricing(
      menu([promo('catA10', { applyTo: 'CATEGORY', categoryId: CAT_A, discountValue: 10 })]),
    );

    expect(priceOf(result, CAT_A)).toBe(90);
    expect(priceOf(result, CAT_B)).toBe(100);
    expect(oldPriceOf(result, CAT_B)).toBeNull();
  });

  it('a manual dish discount outranks every promotion', () => {
    const m = menu([promo('menu50', { discountValue: 50 })]);
    m.categories[0].products[0].price = 80;
    m.categories[0].products[0].oldPrice = 100;

    const result = applyPromotionPricing(m);

    // Untouched: the dish-level price the operator set by hand wins.
    expect(priceOf(result, CAT_A)).toBe(80);
    expect(oldPriceOf(result, CAT_A)).toBe(100);
  });

  it('fixed-amount and percentage compete on final price, not on kind', () => {
    const result = applyPromotionPricing(
      menu([
        promo('menu5pct', { discountValue: 5 }),
        promo('catA20flat', {
          applyTo: 'CATEGORY',
          categoryId: CAT_A,
          discountType: 'FIXED_AMOUNT',
          discountValue: 20,
        }),
      ]),
    );

    expect(priceOf(result, CAT_A)).toBe(80); // −20₾ beats −5%
  });

  it('banner / free-addon promotions never move prices', () => {
    const result = applyPromotionPricing(
      menu([
        promo('banner', { discountType: null, type: 'BANNER', discountValue: null }),
        promo('addon', { discountType: 'FREE_ADDON', discountValue: 1 }),
      ]),
    );

    expect(priceOf(result, CAT_A)).toBe(100);
    expect(oldPriceOf(result, CAT_A)).toBeNull();
  });

  it('an expired promotion does not touch prices', () => {
    const result = applyPromotionPricing(
      menu([promo('old', { discountValue: 50, endDate: '2020-01-01' })]),
    );

    expect(priceOf(result, CAT_A)).toBe(100);
  });
});
