import { describe, it, expect } from 'vitest';
import { getPromotionStatus } from '../status';

// 14:00 Tbilisi on 21 Aug 2026.
const now = new Date('2026-08-21T10:00:00Z');

const ended = { startDate: new Date('2026-08-01'), endDate: new Date('2026-08-10') };
const scheduled = { startDate: new Date('2026-09-01'), endDate: new Date('2026-09-10') };
const running = { startDate: new Date('2026-08-15'), endDate: new Date('2026-08-25') };

describe('getPromotionStatus (T1.7)', () => {
  it('switched off + ended dates -> paused, never ended', () => {
    expect(getPromotionStatus({ isActive: false, ...ended }, now)).toBe('paused');
  });

  it('switched off + scheduled -> paused', () => {
    expect(getPromotionStatus({ isActive: false, ...scheduled }, now)).toBe('paused');
  });

  it('switched off + no dates -> paused', () => {
    expect(
      getPromotionStatus({ isActive: false, startDate: null, endDate: null }, now),
    ).toBe('paused');
  });

  it('switched on + ended -> ended', () => {
    expect(getPromotionStatus({ isActive: true, ...ended }, now)).toBe('ended');
  });

  it('switched on + scheduled -> scheduled', () => {
    expect(getPromotionStatus({ isActive: true, ...scheduled }, now)).toBe('scheduled');
  });

  it('switched on + no dates -> active', () => {
    expect(
      getPromotionStatus({ isActive: true, startDate: null, endDate: null }, now),
    ).toBe('active');
  });

  it('switched on + running dates -> active', () => {
    expect(getPromotionStatus({ isActive: true, ...running }, now)).toBe('active');
  });
});
