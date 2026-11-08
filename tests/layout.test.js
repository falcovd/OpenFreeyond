import { describe, it, expect } from 'vitest';
import { hitsSolid, resolveMove } from '../src/logic/collision.js';
import { walkableArea, reachesWithin } from '../src/logic/walkable.js';
import {
  BOUNDS,
  SOLIDS,
  SPAWN,
  CHARACTER_SPOT,
  HOUSE,
  DOOR,
  PATH,
  FLOWER_BEDS,
  resetCharacterSolid,
} from '../src/world/layout.js';
import { PHASE1_BOUNDS, PHASE1_SOLIDS } from './fixtures/phase1-layout.js';

const kinds = (k) => SOLIDS.filter((s) => s.kind === k);

describe('walkableArea', () => {
  it('measures free ground', () => {
    const b = { minX: 0, maxX: 10, minZ: 0, maxZ: 10 };
    expect(walkableArea([], b)).toBeCloseTo(100, 0);
    expect(walkableArea([{ x: 5, z: 5, w: 2, d: 2 }], b)).toBeCloseTo(96, 0);
  });
});

describe('new layout (FR-11)', () => {
  it('keeps the boundary (AC-4.3)', () => {
    expect(BOUNDS).toEqual(PHASE1_BOUNDS);
  });
  it('leaves at least as much walkable area as phase 1 (AC-4.3)', () => {
    expect(walkableArea(SOLIDS, BOUNDS)).toBeGreaterThanOrEqual(
      walkableArea(PHASE1_SOLIDS, PHASE1_BOUNDS),
    );
  });
  it('keeps every solid inside the boundary', () => {
    for (const s of SOLIDS) {
      expect(s.x - s.w / 2).toBeGreaterThanOrEqual(BOUNDS.minX);
      expect(s.x + s.w / 2).toBeLessThanOrEqual(BOUNDS.maxX);
      expect(s.z - s.d / 2).toBeGreaterThanOrEqual(BOUNDS.minZ);
      expect(s.z + s.d / 2).toBeLessThanOrEqual(BOUNDS.maxZ);
    }
  });
  it('starts the person in free space in the street', () => {
    expect(hitsSolid(SPAWN.x, SPAWN.z, SOLIDS, 0.3)).toBe(false);
  });
});

describe('the house (FR-10, AC-4.6)', () => {
  it('has a footprint of at most 10 by 8 m and one or two floors', () => {
    expect(HOUSE.w).toBeLessThanOrEqual(10);
    expect(HOUSE.d).toBeLessThanOrEqual(8);
    expect([1, 2]).toContain(HOUSE.floors);
  });
  it('is a solid with the same footprint and cannot be entered (AC-4.2)', () => {
    const h = SOLIDS.find((s) => s.kind === 'house');
    expect([h.x, h.z, h.w, h.d]).toEqual([HOUSE.x, HOUSE.z, HOUSE.w, HOUSE.d]);
    const r = resolveMove(
      { x: 0, z: HOUSE.z + HOUSE.d / 2 + 0.5 },
      { x: 0, z: HOUSE.z },
      SOLIDS,
      BOUNDS,
    );
    expect(r.z).toBeGreaterThan(HOUSE.z + HOUSE.d / 2);
  });
  it('has its door on the garden side', () => {
    expect(DOOR.z).toBeCloseTo(HOUSE.z + HOUSE.d / 2);
  });
});

describe('counts (FR-6, FR-7)', () => {
  it('has at least 6 trees in at least 2 shapes (AC-3.1)', () => {
    expect(kinds('tree').length).toBeGreaterThanOrEqual(6);
    expect(
      new Set(kinds('tree').map((t) => t.shape)).size,
    ).toBeGreaterThanOrEqual(2);
  });
  it('has at least 3 bushes, 2 flower beds and 1 hedge (AC-3.3)', () => {
    expect(kinds('bush').length).toBeGreaterThanOrEqual(3);
    expect(FLOWER_BEDS.length).toBeGreaterThanOrEqual(2);
    expect(kinds('hedge').length).toBeGreaterThanOrEqual(1);
  });
  it('keeps the planter a solid that is not a flower bed', () => {
    expect(SOLIDS.some((s) => s.id === 'planter')).toBe(true);
    expect(FLOWER_BEDS.some((b) => b.id === 'planter')).toBe(false);
  });
});

describe('path and reachability (AC-2.2, AC-4.4)', () => {
  it('has a walkable path from the street to the door', () => {
    expect(Math.abs(PATH.x - DOOR.x)).toBeLessThan(PATH.w / 2);
    for (let z = PATH.z1; z >= PATH.z0 + 0.4; z -= 0.2) {
      expect(hitsSolid(PATH.x, z, SOLIDS, 0.3), `z=${z}`).toBe(false);
    }
  });
  it('lets a person reach the character, who starts outside the house in a fixed spot (AC-4.4)', () => {
    const c = SOLIDS.find((s) => s.kind === 'character');
    expect([c.x, c.z]).toEqual([CHARACTER_SPOT.x, CHARACTER_SPOT.z]);
    expect(CHARACTER_SPOT.z).toBeGreaterThan(HOUSE.z + HOUSE.d / 2);
    expect(reachesWithin(SPAWN, CHARACTER_SPOT, 1.2, SOLIDS, BOUNDS)).toBe(
      true,
    );
  });
});

describe('blocking (AC-4.5, AC-4.7)', () => {
  const walkInto = (s) => {
    const from = { x: s.x, z: s.z + s.d / 2 + 0.6 };
    const r = resolveMove(from, { x: s.x, z: s.z }, SOLIDS, BOUNDS);
    return r.z >= s.z + s.d / 2;
  };
  it('stops a person at every solid object', () => {
    for (const s of SOLIDS) expect(walkInto(s), s.id).toBe(true);
  });
  it('stops a person at every part of the boundary', () => {
    const e = (from, to) => resolveMove(from, to, [], BOUNDS);
    expect(e({ x: 10, z: 0 }, { x: 12, z: 0 }).x).toBeLessThanOrEqual(
      BOUNDS.maxX,
    );
    expect(e({ x: -10, z: 0 }, { x: -12, z: 0 }).x).toBeGreaterThanOrEqual(
      BOUNDS.minX,
    );
    expect(e({ x: 0, z: 10 }, { x: 0, z: 12 }).z).toBeLessThanOrEqual(
      BOUNDS.maxZ,
    );
    expect(e({ x: 0, z: -10 }, { x: 0, z: -12 }).z).toBeGreaterThanOrEqual(
      BOUNDS.minZ,
    );
  });
  it('lets a person walk over a flower bed', () => {
    for (const b of FLOWER_BEDS) {
      expect(SOLIDS.some((s) => s.id === b.id)).toBe(false);
      expect(hitsSolid(b.x, b.z, SOLIDS, 0.3), b.id).toBe(false);
    }
  });
});

describe('the character solid moves and can be put back', () => {
  it('goes back to the start spot', () => {
    const c = SOLIDS.find((s) => s.kind === 'character');
    c.x = 9;
    c.z = 9;
    resetCharacterSolid();
    expect([c.x, c.z]).toEqual([CHARACTER_SPOT.x, CHARACTER_SPOT.z]);
  });
});
