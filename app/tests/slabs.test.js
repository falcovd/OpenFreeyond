import { describe, it, expect } from 'vitest';
import { slabGrid, SLAB } from '../src/logic/slabs.js';

const numeric = (a, b) => a - b;

describe('slabGrid (FR-6, AC-3.2, AC-3.6)', () => {
  it('lays the 1.2 m path as two whole slabs across, 53 whole rows and one partial row at the far end', () => {
    const g = slabGrid({ width: 1.2, length: 16 });
    expect(g.across).toBe(2);
    expect(g.slabs.every((s) => Math.abs(s.w - 0.6) < 1e-9)).toBe(true); // no partial along the long sides
    const whole = g.slabs.filter((s) => Math.abs(s.l - 0.3) < 1e-9);
    const partial = g.slabs.filter((s) => s.l < 0.3 - 1e-9);
    expect(whole.length).toBe(2 * 53);
    expect(partial.length).toBe(2);
    expect(Math.min(...partial.map((s) => s.y))).toBeGreaterThan(15.8); // partial row only at the far end
    expect(partial[0].l).toBeCloseTo(0.1);
  });
  it('lays the 1.8 m sidewalk as three whole slabs across and no partial slab at all', () => {
    const g = slabGrid({ width: 1.8, length: 480 });
    expect(g.across).toBe(3);
    expect(g.slabs.length).toBe(3 * 1600);
    expect(
      g.slabs.every((s) => s.l === SLAB.along && s.w === SLAB.across),
    ).toBe(true);
  });
  it('refuses a width that is not a whole number of slabs', () => {
    expect(() => slabGrid({ width: 1.4, length: 5 })).toThrow();
  });
  it('centres the slabs across the width and starts the rows at y = 0', () => {
    const g = slabGrid({ width: 1.2, length: 0.6 });
    const xs = g.slabs.map((s) => s.x).sort(numeric);
    const ys = g.slabs.map((s) => s.y).sort(numeric);
    [-0.3, -0.3, 0.3, 0.3].forEach((v, i) => expect(xs[i]).toBeCloseTo(v, 9));
    [0.15, 0.15, 0.45, 0.45].forEach((v, i) => expect(ys[i]).toBeCloseTo(v, 9));
  });
});
