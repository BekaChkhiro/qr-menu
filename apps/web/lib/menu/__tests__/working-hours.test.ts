import { describe, expect, it } from 'vitest';
import {
  defaultWorkingHours,
  groupWorkingHours,
  hasWorkingHours,
  normalizeWorkingHours,
} from '../working-hours';
import { updateMenuSchema } from '@/lib/validations/menu';

describe('working hours', () => {
  it('treats legacy all-closed weeks as disabled', () => {
    const hours = defaultWorkingHours().map((day) => ({ ...day, closed: true }));
    expect(normalizeWorkingHours(hours)).toBeNull();
    expect(hasWorkingHours(hours)).toBe(false);
    expect(hasWorkingHours(normalizeWorkingHours(hours))).toBe(false);
  });

  it('preserves a partially closed week', () => {
    const hours = defaultWorkingHours().map((day) => ({
      ...day,
      closed: day.day === 'sat' || day.day === 'sun',
    }));
    expect(normalizeWorkingHours(hours)).toEqual(hours);
    expect(hasWorkingHours(normalizeWorkingHours(hours))).toBe(true);
  });

  it('accepts null to disable hours and preserves omitted updates', () => {
    expect(updateMenuSchema.parse({ workingHours: null }).workingHours).toBeNull();
    expect(updateMenuSchema.parse({})).not.toHaveProperty('workingHours');
    expect(normalizeWorkingHours(null)).toBeNull();
  });

  it('groups consecutive schedules and keeps different breaks separate', () => {
    const hours = defaultWorkingHours().map((day, index) => ({
      ...day,
      closed: index >= 5,
      breakStart: index < 4 ? '15:00' : null,
      breakEnd: index < 4 ? '17:00' : null,
    }));
    expect(groupWorkingHours(hours)).toEqual([
      { closed: false, open: '09:00', close: '23:00', breakStart: '15:00', breakEnd: '17:00', days: ['mon', 'tue', 'wed', 'thu'] },
      { closed: false, open: '09:00', close: '23:00', breakStart: null, breakEnd: null, days: ['fri'] },
      { closed: true, open: '09:00', close: '23:00', breakStart: null, breakEnd: null, days: ['sat', 'sun'] },
    ]);
  });
});
