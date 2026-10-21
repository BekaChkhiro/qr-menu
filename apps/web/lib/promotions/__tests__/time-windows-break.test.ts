import { describe, it, expect } from 'vitest';
import { defaultBreakWithin, validateWindowBreak } from '../time-windows';

// T1.8 — a split-shift break is optional and must sit inside its own window.
// The window is 09:00–18:00 unless a case says otherwise.

const day = { start: '09:00', end: '18:00' };
const brk = (breakStart: string | null, breakEnd: string | null) => ({ breakStart, breakEnd });

describe('validateWindowBreak — optional break', () => {
  it('no break fields at all is ok', () => {
    expect(validateWindowBreak(day, brk(null, null)).code).toBe('ok');
    expect(validateWindowBreak(day, {}).code).toBe('ok');
  });

  it('no window and no break is ok', () => {
    expect(validateWindowBreak(undefined, brk(null, null)).code).toBe('ok');
  });
});

describe('validateWindowBreak — break inside its window', () => {
  it('a break in the middle of the window is ok', () => {
    expect(validateWindowBreak(day, brk('13:00', '14:00'))).toEqual({ ok: true, code: 'ok' });
  });

  it('a break touching the window edges exactly is ok', () => {
    expect(validateWindowBreak(day, brk('09:00', '10:00')).ok).toBe(true);
    expect(validateWindowBreak(day, brk('17:00', '18:00')).ok).toBe(true);
  });

  it('outside-start: a break that begins before the window opens', () => {
    expect(validateWindowBreak(day, brk('08:00', '10:00'))).toEqual({
      ok: false,
      code: 'break-outside-start',
    });
  });

  it('outside-start: a break ending exactly at the window opening', () => {
    expect(validateWindowBreak(day, brk('08:00', '09:00')).code).toBe('break-outside-start');
  });

  it('outside-end: a break that runs past the window closing', () => {
    expect(validateWindowBreak(day, brk('17:00', '19:00'))).toEqual({
      ok: false,
      code: 'break-outside-end',
    });
  });

  it('outside-end: a break that starts exactly at the window closing', () => {
    expect(validateWindowBreak(day, brk('18:00', '19:00')).code).toBe('break-outside-end');
  });
});

describe('validateWindowBreak — missing window', () => {
  it('a break with no window is break-without-window', () => {
    expect(validateWindowBreak(undefined, brk('13:00', '14:00'))).toEqual({
      ok: false,
      code: 'break-without-window',
    });
  });

  it('a half-filled break with no window is still break-without-window', () => {
    expect(validateWindowBreak(null, brk('13:00', null)).code).toBe('break-without-window');
  });
});

describe('validateWindowBreak — incomplete break', () => {
  it('only the start is set', () => {
    expect(validateWindowBreak(day, brk('13:00', null))).toEqual({
      ok: false,
      code: 'break-incomplete',
    });
  });

  it('only the end is set', () => {
    expect(validateWindowBreak(day, brk(null, '14:00')).code).toBe('break-incomplete');
  });

  it('an emptied input (empty string) counts as not set', () => {
    expect(validateWindowBreak(day, brk('', '14:00')).code).toBe('break-incomplete');
  });
});

describe('validateWindowBreak — empty or inverted break', () => {
  it('end before start inside the window is inverted', () => {
    expect(validateWindowBreak(day, brk('14:00', '13:00'))).toEqual({
      ok: false,
      code: 'break-empty-or-inverted',
    });
  });

  it('zero-length break is empty', () => {
    expect(validateWindowBreak(day, brk('13:00', '13:00')).code).toBe('break-empty-or-inverted');
  });
});

describe('validateWindowBreak — window that crosses midnight', () => {
  const late = { start: '22:00', end: '02:00' };

  it('a break after midnight but inside the window is ok', () => {
    expect(validateWindowBreak(late, brk('23:00', '01:00')).ok).toBe(true);
    expect(validateWindowBreak(late, brk('00:30', '01:30')).ok).toBe(true);
  });

  it('a break that begins before the window opens (22:00) is outside-start', () => {
    expect(validateWindowBreak(late, brk('21:00', '22:30')).code).toBe('break-outside-start');
  });

  it('a break that runs past the window closing (02:00) is outside-end', () => {
    expect(validateWindowBreak(late, brk('01:30', '03:00')).code).toBe('break-outside-end');
  });

  it('a zero-length break is still empty', () => {
    expect(validateWindowBreak(late, brk('23:00', '23:00')).code).toBe('break-empty-or-inverted');
  });
});

describe('defaultBreakWithin', () => {
  it('a day window gets a break in its middle third', () => {
    expect(defaultBreakWithin(day)).toEqual({ breakStart: '12:00', breakEnd: '15:00' });
  });

  it('a short window gets a break that still fits inside it', () => {
    const short = { start: '12:00', end: '14:00' };
    const b = defaultBreakWithin(short);
    expect(b).toEqual({ breakStart: '12:40', breakEnd: '13:20' });
    expect(validateWindowBreak(short, b).ok).toBe(true);
  });

  it('a window that crosses midnight gets a break that validates', () => {
    const late = { start: '22:00', end: '02:00' };
    const b = defaultBreakWithin(late);
    expect(b).not.toBeNull();
    expect(validateWindowBreak(late, b).ok).toBe(true);
  });

  it('a malformed window yields no default', () => {
    expect(defaultBreakWithin({ start: 'x', end: '18:00' })).toBeNull();
  });
});
