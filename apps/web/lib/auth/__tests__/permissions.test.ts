import { describe, expect, it } from 'vitest';
import { hasFeature } from '../permissions';

describe('hasFeature — sharedTable (T19.1)', () => {
  it('PRO has sharedTable', () => {
    expect(hasFeature('PRO', 'sharedTable')).toBe(true);
  });

  it('STARTER does not have sharedTable', () => {
    expect(hasFeature('STARTER', 'sharedTable')).toBe(false);
  });

  it('FREE does not have sharedTable', () => {
    expect(hasFeature('FREE', 'sharedTable')).toBe(false);
  });
});

describe('hasFeature — arViewer (T18.1)', () => {
  it('PRO has arViewer', () => {
    expect(hasFeature('PRO', 'arViewer')).toBe(true);
  });

  it('STARTER does not have arViewer', () => {
    expect(hasFeature('STARTER', 'arViewer')).toBe(false);
  });

  it('FREE does not have arViewer', () => {
    expect(hasFeature('FREE', 'arViewer')).toBe(false);
  });
});
