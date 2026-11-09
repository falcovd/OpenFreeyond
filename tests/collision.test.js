import { describe, it, expect } from 'vitest';
import { resolveMove, hitsSolid } from '../src/logic/collision.js';
import { walkableArea } from '../src/logic/walkable.js';
import { SOLIDS, BOUNDS, SPAWN, CHARACTER_SPOT } from '../src/world/layout.js';

const box = [{ x: 0, z: 0, w: 2, d: 2 }];
const bounds = { minX: -10, maxX: 10, minZ: -10, maxZ: 10 };

describe('resolveMove', () => {
  it('lets a person move in free space', () => {
    expect(
      resolveMove({ x: 5, z: 5 }, { x: 5.1, z: 5.1 }, box, bounds),
    ).toEqual({ x: 5.1, z: 5.1 });
  });
  it('blocks walking into a solid object (AC-1.2)', () => {
    const result = resolveMove({ x: 0, z: 3 }, { x: 0, z: 1.2 }, box, bounds);
    expect(result).toEqual({ x: 0, z: 3 });
  });
  it('slides along a solid object', () => {
    const result = resolveMove(
      { x: 0.5, z: 1.5 },
      { x: 0.7, z: 1.2 },
      box,
      bounds,
    );
    expect(result.x).toBeCloseTo(0.7);
    expect(result.z).toBe(1.5);
  });
  it('keeps a person inside the place at the edge (AC-1.3)', () => {
    const result = resolveMove(
      { x: 9.6, z: 0 },
      { x: 12, z: 0 },
      [],
      bounds,
      0.3,
    );
    expect(result.x).toBeCloseTo(9.7);
  });
});

describe('layout', () => {
  it('has all solids inside the bounds', () => {
    for (const s of SOLIDS) {
      expect(s.x - s.w / 2).toBeGreaterThanOrEqual(BOUNDS.minX);
      expect(s.x + s.w / 2).toBeLessThanOrEqual(BOUNDS.maxX);
      expect(s.z - s.d / 2).toBeGreaterThanOrEqual(BOUNDS.minZ);
      expect(s.z + s.d / 2).toBeLessThanOrEqual(BOUNDS.maxZ);
    }
  });
  it('starts the person in free space', () => {
    expect(hitsSolid(SPAWN.x, SPAWN.z, SOLIDS, 0.3)).toBe(false);
  });
  it('has the character spot among the solids', () => {
    expect(
      SOLIDS.some((s) => s.x === CHARACTER_SPOT.x && s.z === CHARACTER_SPOT.z),
    ).toBe(true);
  });
});

describe('solids that are off (FR-4)', () => {
  const wall = { x: 0, z: 0, w: 2, d: 0.2 };
  it('stops a person at a solid that is on', () => {
    expect(hitsSolid(0, 0, [wall], 0.3)).toBe(true);
  });
  it('lets a person through a solid that is off', () => {
    expect(hitsSolid(0, 0, [{ ...wall, off: true }], 0.3)).toBe(false);
  });
  it('does not count an off solid in the walkable area', () => {
    const b = { minX: -5, maxX: 5, minZ: -5, maxZ: 5 };
    expect(
      walkableArea([{ x: 0, z: 0, w: 2, d: 2, off: true }], b),
    ).toBeCloseTo(100, 0);
  });
});
