import { describe, expect, it } from 'vitest';
import { updateMenuSchema } from '../menu';

describe('updateMenuSchema · Offers row (T1.12)', () => {
  it('accepts the on/off switch and both positions', () => {
    expect(updateMenuSchema.safeParse({ offersRailEnabled: false }).success).toBe(true);
    expect(updateMenuSchema.safeParse({ offersRailEnabled: true }).success).toBe(true);
    expect(updateMenuSchema.safeParse({ offersRailPosition: 'TOP' }).success).toBe(true);
    expect(updateMenuSchema.safeParse({ offersRailPosition: 'BOTTOM' }).success).toBe(true);
  });

  it('rejects positions outside TOP | BOTTOM', () => {
    expect(updateMenuSchema.safeParse({ offersRailPosition: 'LEFT' }).success).toBe(false);
    expect(updateMenuSchema.safeParse({ offersRailPosition: 'top' }).success).toBe(false);
  });

  it('rejects a non-boolean switch value', () => {
    expect(updateMenuSchema.safeParse({ offersRailEnabled: 'yes' }).success).toBe(false);
  });

  // Regression: a save from another settings card must not carry the rail
  // fields along, so existing values are left alone.
  it('omits the rail fields from a patch that does not mention them', () => {
    const result = updateMenuSchema.parse({ featuredEnabled: false });
    expect(result).not.toHaveProperty('offersRailEnabled');
    expect(result).not.toHaveProperty('offersRailPosition');
  });
});
