import { describe, it, expect } from 'vitest';
import { shadowFrustum } from '../src/logic/shadowFrustum.js';
import { BOUNDS } from '../src/world/layout.js';
import skyMeta from '../src/data/sky.json';
import { SHADOW_MAX_HEIGHT, SUN_DISTANCE } from '../src/world/shadowConfig.js';

const corners = () => {
  const out = [];
  for (const x of [BOUNDS.minX, BOUNDS.maxX])
    for (const z of [BOUNDS.minZ, BOUNDS.maxZ])
      for (const y of [0, SHADOW_MAX_HEIGHT]) out.push([x, y, z]);
  return out;
};
// Turns a point about the y axis, as the sky group does.
const turn = ([x, y, z], a) => [
  x * Math.cos(a) + z * Math.sin(a),
  y,
  -x * Math.sin(a) + z * Math.cos(a),
];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

describe('shadowFrustum', () => {
  const f = shadowFrustum({
    bounds: BOUNDS,
    maxHeight: SHADOW_MAX_HEIGHT,
    distance: SUN_DISTANCE,
  });

  it('is a symmetric box with a positive near plane', () => {
    expect(f.left).toBe(-f.right);
    expect(f.bottom).toBe(-f.top);
    expect(f.right).toBeGreaterThan(0);
    expect(f.near).toBeGreaterThan(0);
    expect(f.far).toBeGreaterThan(f.near);
  });

  it('holds every corner of the place for every sun azimuth (the sky turns)', () => {
    const sun = skyMeta.sun;
    for (let deg = 0; deg < 360; deg += 15) {
      const dir = turn(sun, (deg * Math.PI) / 180);
      const up = Math.abs(dir[1]) > 0.99 ? [1, 0, 0] : [0, 1, 0];
      // light-space axes: forward = -dir (towards the origin), right = forward x up, up2 = right x forward
      const fwd = dir.map((c) => -c);
      const cross = (a, b) => [
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0],
      ];
      const norm = (v) => v.map((c) => c / Math.hypot(...v));
      const right = norm(cross(fwd, up));
      const up2 = cross(right, fwd);
      for (const c of corners()) {
        const depth = SUN_DISTANCE + dot(c, fwd); // distance from the light along its view direction
        expect(Math.abs(dot(c, right)), `az ${deg}`).toBeLessThanOrEqual(
          f.right,
        );
        expect(Math.abs(dot(c, up2)), `az ${deg}`).toBeLessThanOrEqual(f.top);
        expect(depth, `az ${deg}`).toBeGreaterThanOrEqual(f.near);
        expect(depth, `az ${deg}`).toBeLessThanOrEqual(f.far);
      }
    }
  });

  it('keeps the texel size under 3 cm with a 2048 map', () => {
    expect((f.right * 2) / 2048).toBeLessThan(0.03);
  });
});
