import { describe, it, expect } from 'vitest';
import { shadowFollow } from '../src/logic/shadowFollow.js';

const TEXEL = 0.0264;
const DIST = 100;
const norm = (v) => v.map((c) => c / Math.hypot(...v));
const DIR = norm([-6, 5, 8]);
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const axes = (d) => {
  const rl = Math.hypot(d[2], d[0]);
  const right = [d[2] / rl, 0, -d[0] / rl];
  const up = [
    d[1] * right[2] - d[2] * right[1],
    d[2] * right[0] - d[0] * right[2],
    d[0] * right[1] - d[1] * right[0],
  ];
  return { right, up };
};
const t = (r) => [r.target.x, r.target.y, r.target.z];
const run = (person, dir = DIR) =>
  shadowFollow({ person, dir, distance: DIST, texel: TEXEL });

describe('shadowFollow', () => {
  it('has an orthonormal light basis (the maths of the test helper)', () => {
    const { right, up } = axes(DIR);
    expect(dot(right, up)).toBeCloseTo(0);
    expect(dot(right, DIR)).toBeCloseTo(0);
    expect(dot(up, DIR)).toBeCloseTo(0);
    expect(Math.hypot(...up)).toBeCloseTo(1);
  });
  it('puts the target on the texel grid in the light right and up axes', () => {
    const { right, up } = axes(DIR);
    for (const p of [
      { x: 3.1234, z: -7.777 },
      { x: -12.5, z: 9.01 },
      { x: 0.001, z: 0.002 },
    ]) {
      const r = t(run(p));
      for (const axis of [right, up]) {
        const n = dot(r, axis) / TEXEL;
        expect(Math.abs(n - Math.round(n))).toBeLessThan(1e-6);
      }
    }
  });
  it('stays within half a texel (per light axis) of the person', () => {
    const { right, up } = axes(DIR);
    const p = { x: 4.321, z: -2.2 };
    const r = t(run(p));
    const pv = [p.x, 0, p.z];
    for (const axis of [right, up])
      expect(Math.abs(dot(r, axis) - dot(pv, axis))).toBeLessThanOrEqual(
        TEXEL / 2 + 1e-9,
      );
    // the depth component is the person's own
    expect(dot(r, DIR)).toBeCloseTo(dot(pv, DIR));
  });
  it('does not move the target for a sub-texel step', () => {
    const { right } = axes(DIR);
    // start at a grid centre so a quarter texel cannot cross a rounding edge
    const base = run({ x: 5, z: 5 });
    const c = t(base);
    const person = { x: c[0], z: c[2] };
    const nudged = {
      x: person.x + right[0] * TEXEL * 0.25,
      z: person.z + right[2] * TEXEL * 0.25,
    };
    const a = t(run(person));
    const b = t(run(nudged));
    expect(b[0]).toBeCloseTo(a[0], 9);
    expect(b[2]).toBeCloseTo(a[2], 9);
  });
  it('moves the target by one texel for a one-texel step in light space', () => {
    const { right, up } = axes(DIR);
    const c = t(run({ x: 5, z: 5 }));
    const person = { x: c[0], z: c[2] };
    for (const axis of [right, up]) {
      // a ground step of one texel along the axis' ground projection moves light-space u or v by one texel
      const g = [axis[0], axis[2]];
      const gl = Math.hypot(...g);
      const step = TEXEL / gl; // ground distance that gives one texel along this axis
      const moved = {
        x: person.x + (g[0] / gl) * step,
        z: person.z + (g[1] / gl) * step,
      };
      const a = t(run(person));
      const b = t(run(moved));
      expect(dot(b, axis) - dot(a, axis)).toBeCloseTo(TEXEL, 6);
    }
  });
  it('puts the position at target + dir * distance, for any dir (the sky turns)', () => {
    for (let deg = 0; deg < 360; deg += 20) {
      const a = (deg * Math.PI) / 180;
      const dir = norm([
        DIR[0] * Math.cos(a) + DIR[2] * Math.sin(a),
        DIR[1],
        -DIR[0] * Math.sin(a) + DIR[2] * Math.cos(a),
      ]);
      const r = run({ x: 6.5, z: -3.25 }, dir);
      expect(r.position.x - r.target.x).toBeCloseTo(dir[0] * DIST, 9);
      expect(r.position.y - r.target.y).toBeCloseTo(dir[1] * DIST, 9);
      expect(r.position.z - r.target.z).toBeCloseTo(dir[2] * DIST, 9);
    }
  });
  it('normalises dir', () => {
    const a = run({ x: 1, z: 2 }, [-6, 5, 8]);
    const b = run({ x: 1, z: 2 }, DIR);
    expect(a).toEqual(b);
  });
  it('is deterministic', () => {
    expect(run({ x: 2.2, z: 3.3 })).toEqual(run({ x: 2.2, z: 3.3 }));
  });
});
