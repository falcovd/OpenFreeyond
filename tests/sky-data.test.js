// @vitest-environment node
import { describe, it, expect } from 'vitest';
import skyMeta from '../src/data/sky.json';
import { validSkyMeta } from '../src/world/builders/sky.js';

describe('sky data', () => {
  it('holds a horizon colour and a unit sun direction above the horizon', () => {
    expect(validSkyMeta(skyMeta)).toBe(true);
  });
  it('rejects bad data, so the fallback is used', () => {
    expect(validSkyMeta(null)).toBe(false);
    expect(validSkyMeta({ horizon: 'blue', sun: [0, 1, 0] })).toBe(false);
    expect(validSkyMeta({ horizon: '#cfe6f5', sun: [0, 2, 0] })).toBe(false);
    expect(validSkyMeta({ horizon: '#cfe6f5', sun: [0, -1, 0] })).toBe(false);
    expect(validSkyMeta({ horizon: '#cfe6f5', sun: [0, 1] })).toBe(false);
  });
});
