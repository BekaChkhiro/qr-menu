import { describe, expect, it } from 'vitest';
import { defaultWorkingHours, footerWorkingHours } from '@/lib/menu/working-hours';

describe('footerWorkingHours', () => {
  const hours = defaultWorkingHours();

  it('prints the hours when the show flag is on', () => {
    expect(footerWorkingHours({ workingHours: hours, showWorkingHours: true })).toEqual(
      expect.arrayContaining([expect.objectContaining({ day: 'mon' })]),
    );
  });

  it('hides the footer when the show flag is off but keeps the stored hours', () => {
    const menu = { workingHours: hours, showWorkingHours: false };
    expect(footerWorkingHours(menu)).toBeNull();
    // the hours themselves are untouched for promotion pre-fill
    expect(menu.workingHours).toBe(hours);
  });

  it('follows the hours for a legacy row with no flag', () => {
    expect(footerWorkingHours({ workingHours: hours, showWorkingHours: null })).not.toBeNull();
    expect(footerWorkingHours({ workingHours: null, showWorkingHours: null })).toBeNull();
  });

  it('returns null when nothing is configured, even with the flag on', () => {
    expect(footerWorkingHours({ workingHours: null, showWorkingHours: true })).toBeNull();
  });
});
