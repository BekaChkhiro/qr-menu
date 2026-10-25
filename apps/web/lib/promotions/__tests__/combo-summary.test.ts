import { describe, expect, it } from 'vitest';

import { summarizeCombo } from '../combo-summary';

describe('summarizeCombo (T2.2)', () => {
  it('returns zeros and no saving for no dishes', () => {
    expect(summarizeCombo([], 10)).toEqual({ count: 0, total: 0, saving: null, percent: null });
  });

  it('sums numeric and string prices', () => {
    expect(summarizeCombo([{ price: '12.50' }, { price: 7 }])).toEqual({
      count: 2,
      total: 19.5,
      saving: null,
      percent: null,
    });
  });

  it('multiplies by quantity', () => {
    expect(summarizeCombo([{ price: '4.20', quantity: 3 }, { price: 5 }]).total).toBe(17.6);
  });

  it.each([null, undefined, '', 0, '0', NaN, 'abc', -5])(
    'has no saving when the combo price is %s',
    (comboPrice) => {
      const s = summarizeCombo([{ price: 10 }, { price: 5 }], comboPrice as never);
      expect(s.saving).toBeNull();
      expect(s.percent).toBeNull();
      expect(s.total).toBe(15);
    },
  );

  it('computes saving and whole percent', () => {
    expect(summarizeCombo([{ price: '12.50' }, { price: '7.50' }], '15')).toEqual({
      count: 2,
      total: 20,
      saving: 5,
      percent: 25,
    });
  });

  it('never goes negative when the combo price is above the total', () => {
    expect(summarizeCombo([{ price: 5 }, { price: 5 }], 12)).toMatchObject({ saving: 0, percent: 0 });
  });

  it('rounds to 2 decimals and the percent to a whole number', () => {
    const s = summarizeCombo([{ price: 0.1 }, { price: 0.2 }, { price: 9.99 }], 7.777);
    expect(s.total).toBe(10.29);
    expect(s.saving).toBe(2.51);
    expect(s.percent).toBe(24);
  });
});
