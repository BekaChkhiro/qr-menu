import { describe, expect, it } from 'vitest';
import { createProductSchema, updateProductSchema } from '../product';

// T3.3 — Product.offerRank: a whole number 0..9999, or null to unpick.
const base = { categoryId: 'ckxxxxxxxxxxxxxxxxxxxxxxx', nameKa: 'ხინკალი', price: 12 };

describe('offerRank validation', () => {
  it('accepts a whole rank and null on create and update', () => {
    expect(createProductSchema.parse({ ...base, offerRank: 2 }).offerRank).toBe(2);
    expect(createProductSchema.parse({ ...base, offerRank: null }).offerRank).toBeNull();
    expect(updateProductSchema.parse({ offerRank: 0 }).offerRank).toBe(0);
    expect(updateProductSchema.parse({ offerRank: null }).offerRank).toBeNull();
    expect(updateProductSchema.parse({})).not.toHaveProperty('offerRank');
  });

  it('rejects negative, fractional, too large and non-numeric ranks', () => {
    for (const offerRank of [-1, 1.5, 10000, '2']) {
      expect(createProductSchema.safeParse({ ...base, offerRank }).success).toBe(false);
      expect(updateProductSchema.safeParse({ offerRank }).success).toBe(false);
    }
  });
});
