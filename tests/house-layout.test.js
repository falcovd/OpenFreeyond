import { describe, it, expect, afterEach } from 'vitest';
import { resolveMove } from '../src/logic/collision.js';
import { walkableArea, reachesWithin } from '../src/logic/walkable.js';
import {
  BOUNDS,
  SOLIDS,
  SPAWN,
  CHARACTER_SPOT,
  HOUSE,
  DOOR,
  INNER_DOORWAY,
  ROOMS,
  WALLS,
  INTERIOR_ITEMS,
  LIGHTS,
  PATH,
  SWING_SPACE,
  FLOWER_BEDS,
  outsideSolids,
  resetHouse,
} from '../src/world/layout.js';
import { GROUND_SIZE, FOG } from '../src/world/builders/ground.js';
import { PHASE1_BOUNDS, PHASE1_SOLIDS } from './fixtures/phase1-layout.js';

const byId = (id) => SOLIDS.find((s) => s.id === id);
const overlaps = (a, b) =>
  Math.abs(a.x - b.x) < (a.w + b.w) / 2 &&
  Math.abs(a.z - b.z) < (a.d + b.d) / 2;

afterEach(() => resetHouse());
describe('the house footprint and doorways (FR-12, AC-2.6)', () => {
  it('is at least 5.5 by 4.5 m, larger in one, and fits in 10 by 8 m either way', () => {
    const { w, d } = HOUSE;
    expect(w).toBeGreaterThanOrEqual(5.5);
    expect(d).toBeGreaterThanOrEqual(4.5);
    expect(w > 5.5 || d > 4.5).toBe(true);
    expect((w <= 10 && d <= 8) || (w <= 8 && d <= 10)).toBe(true);
  });
  it('has wall solids that add up to that footprint', () => {
    const xs = WALLS.flatMap((s) => [s.x - s.w / 2, s.x + s.w / 2]);
    const zs = WALLS.flatMap((s) => [s.z - s.d / 2, s.z + s.d / 2]);
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(HOUSE.w);
    expect(Math.max(...zs) - Math.min(...zs)).toBeCloseTo(HOUSE.d);
  });
  it('has every doorway at least 1.2 m wide and 2 m high, the front door included', () => {
    for (const d of [DOOR, INNER_DOORWAY]) {
      expect(d.w).toBeGreaterThanOrEqual(1.2);
      expect(d.h).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('the rooms (FR-11, AC-4.1)', () => {
  const size = (r) => [r.maxX - r.minX, r.maxZ - r.minZ];
  it('has a living room and a kitchen room, each at least 3.5 by 3.5 m inside', () => {
    expect(ROOMS.map((r) => r.id)).toEqual(['living', 'kitchen']);
    for (const r of ROOMS)
      for (const s of size(r)) expect(s).toBeGreaterThanOrEqual(3.5);
  });
  it('puts the couch and the TV in the living room, the kitchen units and the dining table in the kitchen room', () => {
    const inRoom = (item, room) => {
      const r = ROOMS.find((x) => x.id === room);
      const s = INTERIOR_ITEMS.find((i) => i.id === item);
      return s.x > r.minX && s.x < r.maxX && s.z > r.minZ && s.z < r.maxZ;
    };
    expect(inRoom('couch', 'living')).toBe(true);
    expect(inRoom('tv', 'living')).toBe(true);
    expect(inRoom('kitchen', 'kitchen')).toBe(true);
    expect(inRoom('dining-table', 'kitchen')).toBe(true);
  });
  it('opens the front door into the living room', () => {
    const living = ROOMS.find((r) => r.id === 'living');
    expect(DOOR.x).toBeGreaterThan(living.minX);
    expect(DOOR.x).toBeLessThan(living.maxX);
  });
  it('has several warm lights, each inside a room, and no more than 4 (frame-rate budget)', () => {
    expect(LIGHTS.length).toBeGreaterThanOrEqual(3);
    expect(LIGHTS.length).toBeLessThanOrEqual(4);
    for (const l of LIGHTS) {
      const room = ROOMS.find((r) => r.id === l.room);
      expect(l.x).toBeGreaterThan(room.minX);
      expect(l.x).toBeLessThan(room.maxX);
      expect(l.z).toBeGreaterThan(room.minZ);
      expect(l.z).toBeLessThan(room.maxZ);
      const [r, g, b] = [1, 3, 5].map((i) =>
        parseInt(l.color.slice(i, i + 2), 16),
      );
      expect(r).toBeGreaterThan(g);
      expect(g).toBeGreaterThan(b); // warm
    }
  });
  it('has no stairs and no solid or item that leads upward (AC-5.1)', () => {
    expect(SOLIDS.some((s) => /stair|ladder/i.test(s.id))).toBe(false);
    expect(INTERIOR_ITEMS.some((s) => /stair|ladder/i.test(s.id))).toBe(false);
  });
});

describe('walking in the house (FR-4, FR-17, AC-2.1 to AC-2.7)', () => {
  const door = byId('door');
  const swing = byId('door-swing');
  const approach = { x: DOOR.x, z: DOOR.z + 2 };
  const into = (from, to) => resolveMove(from, to, SOLIDS, BOUNDS);

  it('stops a person at a closed door (AC-2.2)', () => {
    door.off = false;
    let p = approach;
    for (let i = 0; i < 40; i++) p = into(p, { x: DOOR.x, z: p.z - 0.1 });
    expect(p.z).toBeGreaterThan(DOOR.z);
  });
  it('lets a person through a fully open door and out again (AC-2.1)', () => {
    door.off = true;
    swing.off = true;
    let p = approach;
    for (let i = 0; i < 50; i++) p = into(p, { x: DOOR.x, z: p.z - 0.1 });
    expect(p.z).toBeLessThan(DOOR.z - 0.5);
    for (let i = 0; i < 50; i++) p = into(p, { x: DOOR.x, z: p.z + 0.1 });
    expect(p.z).toBeGreaterThan(DOOR.z + 1);
    door.off = false;
    swing.off = true;
  });
  it('stops a person at the swing space while the door swings (AC-2.3)', () => {
    door.off = false;
    swing.off = false;
    let p = { x: DOOR.x, z: SWING_SPACE.maxZ + 1.5 };
    for (let i = 0; i < 40; i++) p = into(p, { x: DOOR.x, z: p.z - 0.1 });
    expect(p.z).toBeGreaterThanOrEqual(SWING_SPACE.maxZ);
    swing.off = true;
  });
  it('stops a person at every wall, outside and inside (AC-2.4)', () => {
    for (const w of WALLS) {
      const s = byId(w.id);
      const alongZ = s.d > s.w;
      for (const side of [-1, 1]) {
        const from = alongZ
          ? { x: s.x + side * (s.w / 2 + 0.5), z: s.z }
          : { x: s.x, z: s.z + side * (s.d / 2 + 0.5) };
        if (
          SOLIDS.some(
            (o) =>
              o !== s && !o.off && overlaps({ ...from, w: 0.6, d: 0.6 }, o),
          )
        )
          continue;
        let p = from;
        for (let i = 0; i < 20; i++) {
          p = into(
            p,
            alongZ
              ? { x: p.x - side * 0.1, z: p.z }
              : { x: p.x, z: p.z - side * 0.1 },
          );
        }
        const inside =
          Math.abs(p.x - s.x) < s.w / 2 && Math.abs(p.z - s.z) < s.d / 2;
        expect(inside, `${w.id} side ${side}`).toBe(false);
      }
    }
  });
  it('stops a person at the couch, the TV, the kitchen units and the dining table (AC-2.5)', () => {
    for (const id of ['couch', 'tv', 'kitchen', 'dining-table']) {
      const s = byId(id);
      expect(s, id).toBeTruthy();
      const from = { x: s.x, z: s.z + s.d / 2 + 0.6 };
      if (
        SOLIDS.some((o) => o !== s && overlaps({ ...from, w: 0.6, d: 0.6 }, o))
      )
        continue;
      const r = into(from, { x: s.x, z: s.z });
      expect(r.z, id).toBeGreaterThanOrEqual(s.z + s.d / 2);
    }
  });
  it('lets a person walk between the rooms through the inner doorway, both ways (AC-2.7)', () => {
    door.off = true;
    swing.off = true;
    const living = { x: -1.5, z: INNER_DOORWAY.z };
    const kitchen = { x: 1.5, z: INNER_DOORWAY.z };
    let p = living;
    for (let i = 0; i < 40; i++)
      p = into(p, { x: p.x + 0.1, z: INNER_DOORWAY.z });
    expect(p.x).toBeGreaterThan(1);
    for (let i = 0; i < 40; i++)
      p = into(p, { x: p.x - 0.1, z: INNER_DOORWAY.z });
    expect(p.x).toBeLessThan(-1);
    expect(kitchen.x).toBeGreaterThan(0);
    door.off = false;
  });
  it('lets a person reach every interior item once the door is open (AC-2.1, AC-4.2)', () => {
    door.off = true;
    swing.off = true;
    for (const i of INTERIOR_ITEMS.filter((x) => x.solid !== false)) {
      expect(reachesWithin(SPAWN, i, 1.2, SOLIDS, BOUNDS), i.id).toBe(true);
    }
    door.off = false;
  });
  it('keeps a person out when the door is closed', () => {
    door.off = false;
    expect(reachesWithin(SPAWN, byId('couch'), 1.2, SOLIDS, BOUNDS)).toBe(
      false,
    );
  });
});

describe('the larger place (FR-13, AC-6.3 to AC-6.6)', () => {
  it('leaves at least the phase 1 walkable area outside the house (AC-6.3)', () => {
    const phase1 = walkableArea(PHASE1_SOLIDS, PHASE1_BOUNDS);
    expect(phase1).toBeGreaterThan(444);
    expect(walkableArea(outsideSolids(), BOUNDS)).toBeGreaterThanOrEqual(
      phase1,
    );
  });
  it('keeps the ground, sky and fog beyond the new boundary (AC-6.4)', () => {
    const far = Math.max(
      Math.abs(BOUNDS.minX),
      BOUNDS.maxX,
      Math.abs(BOUNDS.minZ),
      BOUNDS.maxZ,
    );
    expect(GROUND_SIZE / 2).toBeGreaterThan(far + FOG.far);
  });
  it('keeps every solid inside the boundary (AC-6.5)', () => {
    for (const s of SOLIDS) {
      expect(s.x - s.w / 2, s.id).toBeGreaterThanOrEqual(BOUNDS.minX);
      expect(s.x + s.w / 2, s.id).toBeLessThanOrEqual(BOUNDS.maxX);
      expect(s.z - s.d / 2, s.id).toBeGreaterThanOrEqual(BOUNDS.minZ);
      expect(s.z + s.d / 2, s.id).toBeLessThanOrEqual(BOUNDS.maxZ);
    }
  });
  it('has a free spawn in the street and a reachable, free start spot for the character (AC-6.6)', () => {
    const free = (p) =>
      !SOLIDS.some(
        (s) =>
          !s.off &&
          s.id !== 'character' &&
          overlaps({ ...p, w: 0.6, d: 0.6 }, s),
      );
    expect(free(SPAWN)).toBe(true);
    expect(free(CHARACTER_SPOT)).toBe(true);
    expect(CHARACTER_SPOT.z).toBeGreaterThan(HOUSE.z + HOUSE.d / 2);
    expect(reachesWithin(SPAWN, CHARACTER_SPOT, 1.2, SOLIDS, BOUNDS)).toBe(
      true,
    );
  });
  it('keeps the path, the swing space and the flower beds clear of solids and of each other', () => {
    expect(Math.abs(PATH.x - DOOR.x)).toBeLessThan(PATH.w / 2);
    const swing = {
      x: (SWING_SPACE.minX + SWING_SPACE.maxX) / 2,
      z: (SWING_SPACE.minZ + SWING_SPACE.maxZ) / 2,
      w: SWING_SPACE.maxX - SWING_SPACE.minX,
      d: SWING_SPACE.maxZ - SWING_SPACE.minZ,
    };
    const garden = SOLIDS.filter((s) => !s.zone && s.id !== 'character');
    for (const s of garden) expect(overlaps(swing, s), s.id).toBe(false);
    for (const b of FLOWER_BEDS) {
      expect(overlaps(b, swing), b.id).toBe(false);
      expect(
        overlaps(b, {
          x: PATH.x,
          z: (PATH.z0 + PATH.z1) / 2,
          w: PATH.w,
          d: PATH.z1 - PATH.z0,
        }),
        b.id,
      ).toBe(false);
    }
  });
});
