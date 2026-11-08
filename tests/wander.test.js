import { describe, it, expect } from 'vitest';
import { isFree, findPath, WANDER } from '../src/logic/wander.js';

const bounds = { minX: -5, maxX: 5, minZ: -5, maxZ: 5 };
const wall = { id: 'wall', x: 0, z: 0, w: 6, d: 0.4 };
const r = WANDER.radius;

// Every point along the route, sampled finely, must be free.
function routeIsFree(from, path, solids) {
  let a = from;
  for (const b of path) {
    const steps = Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 0.05);
    for (let i = 0; i <= steps; i++) {
      const t = steps === 0 ? 1 : i / steps;
      const x = a.x + (b.x - a.x) * t;
      const z = a.z + (b.z - a.z) * t;
      if (!isFree(x, z, solids, bounds, r)) return false;
    }
    a = b;
  }
  return true;
}

describe('isFree', () => {
  it('is true in open ground and false inside a solid', () => {
    expect(isFree(-3, -3, [wall], bounds, r)).toBe(true);
    expect(isFree(0, 0, [wall], bounds, r)).toBe(false);
  });
  it('keeps the body radius away from a solid and from the boundary', () => {
    expect(isFree(0, wall.d / 2 + r - 0.01, [wall], bounds, r)).toBe(false);
    expect(isFree(0, wall.d / 2 + r + 0.01, [wall], bounds, r)).toBe(true);
    expect(isFree(bounds.maxX - r + 0.01, 3, [], bounds, r)).toBe(false);
    expect(isFree(bounds.maxX - r - 0.01, 3, [], bounds, r)).toBe(true);
  });
});

describe('findPath', () => {
  it('goes straight when nothing is in the way', () => {
    const path = findPath({ x: -3, z: -3 }, { x: 3, z: -3 }, [], bounds);
    expect(path).toEqual([{ x: 3, z: -3 }]);
  });
  it('goes around a wall, never through it, and ends at the target', () => {
    const from = { x: -2, z: -2 };
    const to = { x: 2, z: 2 };
    const path = findPath(from, to, [wall], bounds);
    expect(path).not.toBeNull();
    expect(path.at(-1)).toEqual(to);
    expect(routeIsFree(from, path, [wall])).toBe(true);
    // The wall is 6 m wide, so the route bends around one end: it is longer than the straight line.
    let length = 0;
    let a = from;
    for (const b of path) {
      length += Math.hypot(b.x - a.x, b.z - a.z);
      a = b;
    }
    expect(length).toBeGreaterThan(Math.hypot(4, 4) + 0.5);
  });
  it('returns null when the target is inside a solid', () => {
    expect(
      findPath({ x: -3, z: -3 }, { x: 0, z: 0 }, [wall], bounds),
    ).toBeNull();
  });
  it('returns null when the target cannot be reached', () => {
    // A closed box of walls around the target.
    const box = [
      { x: 3, z: 2, w: 3, d: 0.2 },
      { x: 3, z: 4, w: 3, d: 0.2 },
      { x: 1.6, z: 3, w: 0.2, d: 2 },
      { x: 4.4, z: 3, w: 0.2, d: 2 },
    ];
    // The target is a free spot on its own, so null really comes from the walls.
    expect(isFree(3, 3, box, bounds, r)).toBe(true);
    expect(findPath({ x: -3, z: -3 }, { x: 3, z: 3 }, box, bounds)).toBeNull();
    // Take the top wall away and the same target is reachable.
    const open = box.filter((s) => s !== box[0]);
    expect(
      findPath({ x: -3, z: -3 }, { x: 3, z: 3 }, open, bounds),
    ).not.toBeNull();
  });
});
