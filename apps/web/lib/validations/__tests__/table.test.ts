import { describe, it, expect } from 'vitest';
import {
  createTableSchema,
  joinTableSchema,
  addSelectionSchema,
} from '../table';

const VALID_CUID = 'clz1234567890abcdefghijkl';

describe('createTableSchema', () => {
  it('accepts a valid host payload without PIN', () => {
    const result = createTableSchema.safeParse({
      hostName: 'Nino',
      maxGuests: 6,
    });
    expect(result.success).toBe(true);
  });

  describe('hostName', () => {
    it('rejects empty name (after trim)', () => {
      const result = createTableSchema.safeParse({
        hostName: '   ',
        maxGuests: 4,
      });
      expect(result.success).toBe(false);
    });

    it('rejects name longer than 32 characters', () => {
      const result = createTableSchema.safeParse({
        hostName: 'a'.repeat(33),
        maxGuests: 4,
      });
      expect(result.success).toBe(false);
    });

    it('accepts a 32-character name', () => {
      const result = createTableSchema.safeParse({
        hostName: 'a'.repeat(32),
        maxGuests: 4,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('maxGuests', () => {
    it('rejects 1 (below minimum)', () => {
      const result = createTableSchema.safeParse({
        hostName: 'Nino',
        maxGuests: 1,
      });
      expect(result.success).toBe(false);
    });

    it('accepts 2 (boundary)', () => {
      const result = createTableSchema.safeParse({
        hostName: 'Nino',
        maxGuests: 2,
      });
      expect(result.success).toBe(true);
    });

    it('accepts 20 (boundary)', () => {
      const result = createTableSchema.safeParse({
        hostName: 'Nino',
        maxGuests: 20,
      });
      expect(result.success).toBe(true);
    });

    it('rejects 21 (above maximum)', () => {
      const result = createTableSchema.safeParse({
        hostName: 'Nino',
        maxGuests: 21,
      });
      expect(result.success).toBe(false);
    });

    it('rejects non-integer', () => {
      const result = createTableSchema.safeParse({
        hostName: 'Nino',
        maxGuests: 4.5,
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('joinTableSchema', () => {
  it('accepts a valid guest payload without PIN', () => {
    const result = joinTableSchema.safeParse({ name: 'Beka' });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = joinTableSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects 33-character name', () => {
    const result = joinTableSchema.safeParse({
      name: 'a'.repeat(33),
    });
    expect(result.success).toBe(false);
  });
});

describe('addSelectionSchema', () => {
  it('accepts a minimal valid selection', () => {
    const result = addSelectionSchema.safeParse({
      productId: VALID_CUID,
      quantity: 1,
    });
    expect(result.success).toBe(true);
  });

  it('accepts a fully populated selection', () => {
    const result = addSelectionSchema.safeParse({
      productId: VALID_CUID,
      variationId: VALID_CUID,
      quantity: 3,
      note: 'no onions',
    });
    expect(result.success).toBe(true);
  });

  it('rejects quantity 0', () => {
    const result = addSelectionSchema.safeParse({
      productId: VALID_CUID,
      quantity: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects quantity 100', () => {
    const result = addSelectionSchema.safeParse({
      productId: VALID_CUID,
      quantity: 100,
    });
    expect(result.success).toBe(false);
  });

  it('accepts quantity 99 (boundary)', () => {
    const result = addSelectionSchema.safeParse({
      productId: VALID_CUID,
      quantity: 99,
    });
    expect(result.success).toBe(true);
  });

  it('rejects note longer than 200 chars', () => {
    const result = addSelectionSchema.safeParse({
      productId: VALID_CUID,
      quantity: 1,
      note: 'x'.repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it('accepts note with exactly 200 chars', () => {
    const result = addSelectionSchema.safeParse({
      productId: VALID_CUID,
      quantity: 1,
      note: 'x'.repeat(200),
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-cuid productId', () => {
    const result = addSelectionSchema.safeParse({
      productId: 'not-a-cuid',
      quantity: 1,
    });
    expect(result.success).toBe(false);
  });
});
