import { describe, it, expect } from 'vitest';
import { shadowFrustum } from '../src/logic/shadowFrustum.js';
import {
  SHADOW_RADIUS,
  SHADOW_MAP_SIZE,
  SUN_DISTANCE,
} from '../src/world/shadowConfig.js';

describe('shadowFrustum', () => {
  it('is a symmetric box of +-radius around the target', () => {
    const f = shadowFrustum({ radius: 27, distance: 100 });
    expect(f).toEqual({
      left: -27,
      right: 27,
      top: 27,
      bottom: -27,
      near: 73,
      far: 127,
    });
  });
  it('has a positive near plane with the configured sizes', () => {
    const f = shadowFrustum({ radius: SHADOW_RADIUS, distance: SUN_DISTANCE });
    expect(f.near).toBeGreaterThan(0);
    expect(f.far).toBeGreaterThan(f.near);
  });
  it('is not softer than the old box: texel size at most 2.66 cm (FR-11, AC-5.5)', () => {
    expect(SHADOW_RADIUS).toBe(27);
    expect((2 * SHADOW_RADIUS) / SHADOW_MAP_SIZE).toBeLessThanOrEqual(0.0266);
  });
});
