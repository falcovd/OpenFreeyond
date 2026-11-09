import { describe, it, expect } from 'vitest';
import {
  BOUNDS,
  SOLIDS,
  SPAWN,
  PATH,
  DOOR,
  FENCE,
  CHARACTER_SPOT,
  outsideSolids,
  wanderSolids,
} from '../src/world/layout.js';
import { walkableArea, reachesWithin } from '../src/logic/walkable.js';
import { hitsSolid, resolveMove } from '../src/logic/collision.js';
import { initialState, stepWander } from '../src/logic/wander.js';

const fences = () =>
  SOLIDS.filter((s) => s.kind === 'fence' || s.kind === 'gate');

describe('the fence line in the layout (AC-1.4)', () => {
  it('follows the four edges and no fence stands inside the garden', () => {
    expect(
      fences()
        .map((s) => s.id)
        .sort(),
    ).toEqual([
      'fence-back',
      'fence-front-left',
      'fence-front-right',
      'fence-left',
      'fence-right',
      'gate',
    ]);
    expect(
      SOLIDS.some((s) => s.id === 'fence-left' && Math.abs(s.x) < 11),
    ).toBe(false);
  });
  it('keeps the front edge where it was, so the path length holds (FR-12, AC-5.2)', () => {
    expect(BOUNDS.maxZ).toBe(11);
  });
});

describe('the gate and the path (AC-2.3, AC-3.3)', () => {
  it('has a 1.2 m gate centred on a 1.2 m path', () => {
    const gate = SOLIDS.find((s) => s.id === 'gate');
    expect(gate.w).toBeCloseTo(1.2);
    expect(PATH.w).toBeCloseTo(1.2);
    expect(gate.x).toBeCloseTo(PATH.x);
  });
  it('runs 16 m from the front door to the gate (AC-3.3)', () => {
    expect(PATH.z1 - DOOR.z).toBeCloseTo(16);
    expect(PATH.z1).toBe(BOUNDS.maxZ);
  });
  it('can be walked from the gate to the door without being stopped (AC-3.4)', () => {
    for (let z = BOUNDS.maxZ - FENCE.t - 0.35; z >= DOOR.z + 0.4; z -= 0.2)
      expect(hitsSolid(PATH.x, z, SOLIDS, 0.3), `z=${z}`).toBe(false);
  });
});

describe('the fence stops the person at every point (AC-1.2, AC-1.3, AC-4.7)', () => {
  it('stops a walk into each edge in front of a fence, never at the bounds', () => {
    // Walk in 10 cm steps, as the walk-limiter does, so a thin fence cannot be skipped.
    const into = (from, to) => {
      const n = 40;
      let p = from;
      for (let i = 1; i <= n; i++)
        p = resolveMove(
          p,
          {
            x: from.x + ((to.x - from.x) * i) / n,
            z: from.z + ((to.z - from.z) * i) / n,
          },
          SOLIDS,
          BOUNDS,
        );
      return p;
    };
    // The person stops at the inner face of the fence minus the radius (0.3), to within one step,
    // so 0.2 m short of the bounds clamp (which would stop at 0.1 from the fence face).
    const R = 0.3;
    const near = (got, want, label) =>
      expect(Math.abs(got - want), label).toBeLessThan(0.08);
    for (let t = -10; t <= 10; t += 1) {
      const l = into({ x: -10, z: t }, { x: -13, z: t });
      near(l.x, BOUNDS.minX + FENCE.t + R, `left z=${t}`);
      const r = into({ x: 10, z: t }, { x: 13, z: t });
      near(r.x, BOUNDS.maxX - FENCE.t - R, `right z=${t}`);
    }
    for (let x = -10; x <= 10; x += 1) {
      const b = into({ x, z: -9 }, { x, z: -13 });
      near(b.z, BOUNDS.minZ + FENCE.t + R, `back x=${x}`);
      const f = into({ x, z: 9 }, { x, z: 13 });
      near(f.z, BOUNDS.maxZ - FENCE.t - R, `front x=${x}`);
    }
  });
  it('stops a walk into the closed gate (AC-2.2)', () => {
    let p = { x: PATH.x, z: 9 };
    for (let i = 1; i <= 40; i++)
      p = resolveMove(p, { x: PATH.x, z: 9 + i * 0.1 }, SOLIDS, BOUNDS);
    // The bounds clamp alone would stop at 10.7; the gate stops the person at 10.5.
    expect(Math.abs(p.z - (BOUNDS.maxZ - FENCE.t - 0.3))).toBeLessThan(0.11);
  });
});

describe('what stays as before (FR-3, FR-12, FR-13)', () => {
  it('leaves at least the phase 1 walkable area of 444.5 m2 with the fence counted as covered (AC-5.1)', () => {
    expect(walkableArea(outsideSolids(), BOUNDS)).toBeGreaterThanOrEqual(444.5);
  });
  it('does not cover the path, its extension or the spawn with a garden object (AC-1.6)', () => {
    const lane = {
      x: PATH.x,
      z: (DOOR.z + BOUNDS.maxZ) / 2,
      w: PATH.w,
      d: BOUNDS.maxZ - DOOR.z,
    };
    for (const s of SOLIDS.filter(
      (s) =>
        !s.zone &&
        s.kind !== 'fence' &&
        s.kind !== 'gate' &&
        s.kind !== 'character',
    )) {
      const overlaps =
        Math.abs(s.x - lane.x) < (s.w + lane.w) / 2 &&
        Math.abs(s.z - lane.z) < (s.d + lane.d) / 2;
      expect(overlaps, s.id).toBe(false);
    }
  });
  it('keeps every garden object clear of the fence line, none removed (AC-1.6)', () => {
    const ids = SOLIDS.filter((s) => !s.zone).map((s) => s.id);
    for (const id of [
      'bench',
      'table',
      'planter',
      'bush-1',
      'bush-2',
      'bush-3',
      'hedge-1',
      'character',
    ])
      expect(ids).toContain(id);
    for (let n = 1; n <= 6; n++) expect(ids).toContain(`tree-${n}`);
    for (const s of SOLIDS.filter(
      (s) => !s.zone && !['fence', 'gate'].includes(s.kind),
    )) {
      expect(s.x - s.w / 2).toBeGreaterThanOrEqual(BOUNDS.minX + FENCE.t);
      expect(s.x + s.w / 2).toBeLessThanOrEqual(BOUNDS.maxX - FENCE.t);
      expect(s.z - s.d / 2).toBeGreaterThanOrEqual(BOUNDS.minZ + FENCE.t);
      expect(s.z + s.d / 2).toBeLessThanOrEqual(BOUNDS.maxZ - FENCE.t);
    }
  });
});

describe('the start spot (FR-13, AC-5.5)', () => {
  it('is on the path 2 m inside the gate, free, reachable and in front of the house (z above the house)', () => {
    expect(SPAWN.x).toBeCloseTo(PATH.x);
    expect(BOUNDS.maxZ - FENCE.t - SPAWN.z).toBeCloseTo(2);
    expect(hitsSolid(SPAWN.x, SPAWN.z, SOLIDS, 0.3)).toBe(false);
    expect(SPAWN.z).toBeGreaterThan(-7.5); // the house is at -z, so the start is on the street side of it; the camera needs no turn
    expect(reachesWithin(SPAWN, CHARACTER_SPOT, 1.2, SOLIDS, BOUNDS)).toBe(
      true,
    );
  });
});

// A small seeded random generator (mulberry32), copied from tests/wander.test.js.
function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('the character stays inside the fence (AC-5.3)', () => {
  it('wanders for 5 minutes without leaving the garden', () => {
    const solids = wanderSolids();
    const far = { x: 100, z: 100 };
    let s = initialState(CHARACTER_SPOT.x, CHARACTER_SPOT.z, 0);
    const c = { solids, bounds: BOUNDS, player: far, rng: seeded(11) };
    const cells = new Set();
    for (let t = 0; t < 300; t += 0.05) {
      s = stepWander(s, 0.05, c);
      expect(s.x, `t=${t.toFixed(1)}`).toBeGreaterThanOrEqual(
        BOUNDS.minX + FENCE.t,
      );
      expect(s.x).toBeLessThanOrEqual(BOUNDS.maxX - FENCE.t);
      expect(s.z).toBeGreaterThanOrEqual(BOUNDS.minZ + FENCE.t);
      expect(s.z).toBeLessThanOrEqual(BOUNDS.maxZ - FENCE.t);
      expect(
        hitsSolid(s.x, s.z, fences(), 0.5),
        `near fence t=${t.toFixed(1)}`,
      ).toBe(false);
      cells.add(`${Math.floor(s.x)},${Math.floor(s.z)}`);
    }
    expect(cells.size).toBeGreaterThanOrEqual(5);
  });
});
