import { describe, it, expect } from 'vitest';
import {
  isFree,
  findPath,
  pickTarget,
  initialState,
  stepWander,
  WANDER,
} from '../src/logic/wander.js';
import { SOLIDS, BOUNDS, CHARACTER_SPOT } from '../src/world/layout.js';

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

// A small seeded random generator (mulberry32), so tests repeat exactly.
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

const others = SOLIDS.filter((s) => s.id !== 'character');
const far = { x: 100, z: 100 }; // a player far away

describe('pickTarget', () => {
  it('picks a free spot at least minTrip away, with a route to it', () => {
    const rng = seeded(1);
    for (let n = 0; n < 30; n++) {
      const trip = pickTarget(rng, CHARACTER_SPOT, others, BOUNDS);
      expect(trip).not.toBeNull();
      expect(isFree(trip.target.x, trip.target.z, others, BOUNDS)).toBe(true);
      expect(
        Math.hypot(
          trip.target.x - CHARACTER_SPOT.x,
          trip.target.z - CHARACTER_SPOT.z,
        ),
      ).toBeGreaterThanOrEqual(WANDER.minTrip);
      expect(trip.path.at(-1)).toEqual(trip.target);
    }
  });
  it('returns null when nothing is free', () => {
    const everything = [{ x: 0, z: 0, w: 100, d: 100 }];
    expect(
      pickTarget(seeded(1), { x: 0, z: 0 }, everything, BOUNDS),
    ).toBeNull();
  });
  it('varies the target', () => {
    const rng = seeded(7);
    const targets = new Set();
    for (let n = 0; n < 10; n++) {
      const t = pickTarget(rng, CHARACTER_SPOT, others, BOUNDS).target;
      targets.add(`${t.x.toFixed(1)},${t.z.toFixed(1)}`);
    }
    expect(targets.size).toBeGreaterThan(5);
  });
});

describe('the start spot', () => {
  it('is free ground for a wandering character', () => {
    expect(isFree(CHARACTER_SPOT.x, CHARACTER_SPOT.z, others, BOUNDS)).toBe(
      true,
    );
  });
});

describe('stepWander', () => {
  const ctx = (extra = {}) => ({
    solids: others,
    bounds: BOUNDS,
    player: far,
    rng: seeded(3),
    ...extra,
  });
  const run = (state, seconds, context, dt = 0.05) => {
    let s = state;
    for (let t = 0; t < seconds; t += dt) s = stepWander(s, dt, context);
    return s;
  };

  it('starts idle, then walks, then idles again, and keeps repeating', () => {
    const modes = [];
    let s = initialState(CHARACTER_SPOT.x, CHARACTER_SPOT.z, 0);
    const c = ctx();
    for (let t = 0; t < 120; t += 0.05) {
      s = stepWander(s, 0.05, c);
      if (modes.at(-1) !== s.mode) modes.push(s.mode);
    }
    expect(modes.slice(0, 5)).toEqual(['idle', 'walk', 'idle', 'walk', 'idle']);
  });
  it('really moves, and reports moving only while it walks', () => {
    let s = initialState(CHARACTER_SPOT.x, CHARACTER_SPOT.z, 0);
    const c = ctx();
    let moved = 0;
    for (let t = 0; t < 60; t += 0.05) {
      const before = s;
      s = stepWander(s, 0.05, c);
      if (s.moving) {
        expect(s.mode).toBe('walk');
        moved += Math.hypot(s.x - before.x, s.z - before.z);
      }
    }
    expect(moved).toBeGreaterThan(5);
  });
  it('never walks into a solid or out of the garden, over a long wander', () => {
    let s = initialState(CHARACTER_SPOT.x, CHARACTER_SPOT.z, 0);
    const c = ctx({ rng: seeded(11) });
    for (let t = 0; t < 600; t += 0.05) {
      s = stepWander(s, 0.05, c);
      expect(isFree(s.x, s.z, others, BOUNDS), `t=${t.toFixed(1)}`).toBe(true);
    }
  });
  it('walks no faster than the speed limit', () => {
    let s = initialState(CHARACTER_SPOT.x, CHARACTER_SPOT.z, 0);
    const c = ctx();
    for (let t = 0; t < 60; t += 0.05) {
      const before = s;
      s = stepWander(s, 0.05, c);
      expect(Math.hypot(s.x - before.x, s.z - before.z)).toBeLessThanOrEqual(
        WANDER.speed * 0.05 + 1e-9,
      );
    }
  });
  it('stops and faces the player who comes close, and stays put', () => {
    let s = initialState(CHARACTER_SPOT.x, CHARACTER_SPOT.z, 0);
    s = run(s, 8, ctx()); // let him get going
    const player = { x: s.x + 2, z: s.z }; // 2 m to his east
    const near = ctx({ player });
    s = run(s, 3, near);
    expect(s.mode).toBe('greet');
    expect(s.moving).toBe(false);
    expect(Math.abs(s.heading - Math.PI / 2)).toBeLessThan(0.05); // east is +x: heading atan2(2, 0)
    const here = { x: s.x, z: s.z };
    s = run(s, 3, near);
    expect({ x: s.x, z: s.z }).toEqual(here);
  });
  it('does not flicker at the edge: he greets under 3 m and lets go beyond 4 m', () => {
    let s = initialState(CHARACTER_SPOT.x, CHARACTER_SPOT.z, 0);
    s = stepWander(s, 0.05, ctx({ player: { x: s.x + 2.9, z: s.z } }));
    expect(s.mode).toBe('greet');
    s = stepWander(s, 0.05, ctx({ player: { x: s.x + 3.5, z: s.z } }));
    expect(s.mode).toBe('greet');
    s = stepWander(s, 0.05, ctx({ player: { x: s.x + 4.5, z: s.z } }));
    expect(s.mode).toBe('idle');
  });
  it('never steps closer than personGap to a player on his path (greet takes over first)', () => {
    const open = { minX: -10, maxX: 10, minZ: -10, maxZ: 10 };
    let s = {
      ...initialState(-5, 0, Math.PI / 2),
      mode: 'walk',
      path: [{ x: 5, z: 0 }],
    };
    const player = { x: -4, z: 0 };
    const c = { solids: [], bounds: open, player, rng: seeded(1) };
    for (let t = 0; t < 10; t += 0.05) {
      s = stepWander(s, 0.05, c);
      expect(Math.hypot(player.x - s.x, player.z - s.z)).toBeGreaterThan(
        WANDER.personGap - 1e-6,
      );
    }
    expect(s.mode).toBe('greet');
  });
  it('waits at a solid in his way, then gives up the walk after blockedLimit', () => {
    // The player-block branch cannot trigger: greetNear (3) > personGap (0.9), so greet always
    // takes over first. A solid can block him, so test that branch with one.
    const open = { minX: -10, maxX: 10, minZ: -10, maxZ: 10 };
    const solid = { id: 'box', x: -3, z: 0, w: 2, d: 2 }; // west face at x = -4
    let s = {
      ...initialState(-4.45, 0, Math.PI / 2),
      mode: 'walk',
      path: [{ x: 5, z: 0 }],
    };
    const c = { solids: [solid], bounds: open, player: far, rng: seeded(1) };
    for (let t = 0; t < WANDER.blockedLimit - 0.2; t += 0.05) {
      s = stepWander(s, 0.05, c);
      expect(s.mode).toBe('walk');
      expect(s.moving).toBe(false);
      expect(s.x).toBe(-4.45);
    }
    expect(s.blocked).toBeGreaterThan(1);
    for (let t = 0; t < 0.5; t += 0.05) s = stepWander(s, 0.05, c);
    expect(s.mode).toBe('idle');
    expect(s.path).toEqual([]);
    expect(s.timer).toBeGreaterThanOrEqual(WANDER.idleMin);
    expect(s.timer).toBeLessThanOrEqual(WANDER.idleMax);
  });
  it('a walk with an empty path goes back to idle with a fresh timer', () => {
    const s0 = { ...initialState(0, 0, 0), mode: 'walk', path: [], timer: 0 };
    const s = stepWander(s0, 0.05, ctx());
    expect(s.mode).toBe('idle');
    expect(s.timer).toBeGreaterThanOrEqual(WANDER.idleMin);
    expect(s.timer).toBeLessThanOrEqual(WANDER.idleMax);
  });
  it('after greet ends he is idle with a fresh timer', () => {
    let s = { ...initialState(0, 0, 0), mode: 'greet', timer: 0 };
    s = stepWander(s, 0.05, ctx({ player: { x: 5, z: 0 } }));
    expect(s.mode).toBe('idle');
    expect(s.timer).toBeGreaterThanOrEqual(WANDER.idleMin);
    expect(s.timer).toBeLessThanOrEqual(WANDER.idleMax);
  });
  it('turns the short way round across the +-pi boundary', () => {
    // Facing 3.0 rad, the player is at -3.0 rad: the short way is up through pi (0.28 rad).
    const player = { x: Math.sin(-3) * 2, z: Math.cos(-3) * 2 };
    const s0 = { ...initialState(0, 0, 3.0), mode: 'greet' };
    const s = stepWander(s0, 0.05, ctx({ player }));
    expect(s.heading).toBeGreaterThan(3.0);
    expect(s.heading).toBeCloseTo(3.0 + WANDER.turnRate * 0.05, 6);
    // and the other way round
    const s1 = stepWander(
      { ...s0, heading: -3.0 },
      0.05,
      ctx({ player: { x: Math.sin(3) * 2, z: Math.cos(3) * 2 } }),
    );
    expect(s1.heading).toBeCloseTo(-3.0 - WANDER.turnRate * 0.05, 6);
  });
});
