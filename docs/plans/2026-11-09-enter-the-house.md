# Enter the house Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** The house can be entered. A front door opens and closes by click, the main floor has a living room and a kitchen room with furniture, warm lights and a TV, and the place stays smooth and private.

**Architecture:** Pure logic goes in `src/logic/` (door state machine, door geometry, click-versus-drag, TV source choice). The layout (`src/world/layout.js`) stays the single source of truth: it gains the house walls, the door, the interior items and a larger boundary. The house becomes a generated GLB (`public/assets/models/house.glb`) so that "the house model fails to load" (FR-21) is a real, testable failure. The interior loads after the place is ready, one file at a time, each swapping out its plain block.

**Tech Stack:** JavaScript ES modules, A-Frame 1.6.0 on three.js 0.170, Vite 8, Vitest (jsdom), Prettier, ESLint. Dev tool outside the repo: `ffmpeg` (`brew install ffmpeg`) for the TV clip.

Spec: `specs/enter-the-house/spec.md` (v1, not changed by this plan). Project context: `.adlc-project/PROJECT.md`. Read `CLAUDE.md` and `BRAND.md` before you start.

**Rules for every task** (from `CLAUDE.md` and the project context):

- Work on a branch: `git checkout -b enter-the-house`. Merging to `main` puts the interior online (GitHub Pages deploys from `main`), so merge only after Task 15 passes its gates.
- `npm run lint`, `npm run format:check`, `npm test` and `npm run build` must pass before the last commit of each task. Run `npm run format` if the format check fails.
- `src/logic/` stays free of A-Frame and the DOM. `teardown.js` must not import `aframe`.
- Asset URLs go through `import.meta.env.BASE_URL` (the manifest does this). No hard-coded `http(s)://` in `src/world/`.
- Nothing about the door or the person is stored or sent (NFR-3). Do not touch `localStorage` or the network from new code.
- Camel case for files, functions and variables. Upper case for constants. Single quotes.
- End each commit message with the co-author trailer the session gives you.

---

## Decisions (the technical questions, and what the plan chose)

### OQ-1: click versus drag

A-Frame's `cursor` component fires `click` after any press and release on the same entity, drag or not, so it cannot be used. Instead:

- A `house-door` component listens to `pointerdown` and `pointerup` on the scene canvas, button 0 only.
- `isClick(down, up)` in `src/logic/click.js` is true when the pointer moved at most 4 px between press and release. No time limit (the spec has none, A-1).
- On a click, the component casts one ray from the camera through the pointer against the pickable scene objects (the house, the interior, the garden objects and the character, but not the sky or the ground). The click counts only when the nearest hit is the door. That gives "a wall hides the door" (AC-1.4) and "a click lands on a visible part" for free.
- The distance rule (3 m to the nearest point of the door) is checked in pure code (`distanceToDoor`).

### OQ-2: how large the place must be

Walkable area outside the house = boundary area − house footprint − every other solid (the floor inside the house is not counted, FR-13).

- Other solids today: 2 + 2 (fences) + 0.96 (bench) + 1.44 (table) + 1.2 (planter) + 1.5 (6 trees) + 1.08 (3 bushes) + 1.75 (hedge) + 0.64 (character) = **12.57 m²**.
- The house footprint becomes **8 × 5 = 40 m²** (needed: two rooms of at least 3.5 × 3.5 m inside, side by side: 3.7 + 0.2 + 3.7 + 2 × 0.2 = 8.0 m wide; 5 m deep gives 4.6 m inside).
- Need: boundary area ≥ 444.5 + 40 + 12.57 = **497.07 m²**.
- Chosen boundary: x from −12 to 12, z from −11 to 11 = 24 × 22 = **528 m²**. Walkable area outside the house = 528 − 40 − 12.57 = **475.4 m²** (margin 30.9 m²). Only x grows (by 1 m each side), so the street, the spawn point and the fog stay as they are.
- The ground is 600 × 600 m, the sky sphere has radius 400 m and the fog ends at 220 m, all well beyond the new edge. A test pins this.
- The garden around the house is laid out again (planter, one bush, the hedge, a flower bed and the path move) so nothing overlaps the 8 m wide house or the door's swing space. Tests guard this.

### OQ-3: how the interior keeps loading

- Two manifests. `MANIFEST` (core: textures, trees, bush, character, **house.glb**) loads as today with the 24 s asset budget and the 30 s rule. `interiorManifest()` (couch, TV, kitchen units, dining table, lamps, TV still, TV clip) loads **after** the place is ready, so it never slows the 30 s garden.
- `loadInterior()` in `assetLoader.js` loads each file on its own, with no timeout (FR-20). It calls `onItem(id, value)` when one arrives and `onFail(id)` when one fails. It checks `isCancelled()` so a world that was torn down ignores late files.
- `buildInterior()` puts a plain block (the item's footprint, from `layout.js`) in the house for **every** item at once. The blocks are also solids in `SOLIDS`, so they block walking from the first frame. When a model arrives, `replace(id, scene)` swaps that block for the model, fitted into the same footprint. When a file fails, the block stays and a load message shows (FR-23).

### Other choices (reviewer: please confirm or veto)

- **D-1 The house is a generated GLB.** The spec treats "the model of the house" as something that can fail to load (FR-21, AC-7.9). Today the house is built in code, so it cannot. `scripts/build-house.mjs` generates `house.glb` from `layout.js` with three's `GLTFExporter` (verified to run in Node 24 with a small `FileReader` shim). The GLB holds named materials (`Wall`, `Plaster`, `Floor`, `Ceiling`, `Roof`, `Wood`, `Glass`) and a `Door` node whose origin is the hinge. At run time the textures are applied by material name, as the character colours are. If the file fails, the house is a plain closed block.
- **D-2 Door swing is 1.0 s** (FR-3: 0.5 to 2 s), eased with smoothstep, so the first frame moves at once (NFR-4).
- **D-3 Swing space is the square** of side 1.2 m (the door width) on the hinge side, in front of the door. It contains the quarter disc the door sweeps. One rule serves FR-7, FR-8 and the blocking while the door swings. A person standing in the far corner of the square, outside the swept disc, is also told to step aside. This keeps a person from ever being inside an active solid.
- **D-4 Blocking by a flag.** Solids get an optional `off: true` flag that `hitsSolid` and `walkableArea` skip. The `door` solid (the opening) is `off` only when the door is fully open. The `door-swing` solid (the square) is `off` whenever the door is at rest.
- **D-5 The character keeps out by a separate list.** `wanderSolids()` returns the garden solids plus one solid for the whole house footprint, so he never targets or routes through the doorway, open or not (FR-10).
- **D-6 The TV mode is a constant** (`TV_MODE = 'clip' | 'still'` in `src/world/interiorConfig.js`). The builder sets it before the interior goes online (FR-22). Nothing switches at run time.
- **D-7 Windows stay on the outside only**, as drawn today. They do not open and are not cut through the wall.

---

## File map

| File | Change |
| --- | --- |
| `src/world/layout.js` | New house data, walls, door, interior items, lights, bounds, keep-out helpers |
| `src/logic/collision.js`, `src/logic/walkable.js` | Skip solids with `off` |
| `src/logic/door.js` (new) | Door state machine, door geometry, hint and message rules |
| `src/logic/click.js` (new) | `isClick` |
| `src/logic/tv.js` (new) | `tvSource` |
| `src/world/components.js` | `house-door` component; `character-wander` uses `wanderSolids()` |
| `scripts/build-house.mjs` (new), `public/assets/models/house.glb` (new) | Generated house |
| `src/world/builders/house.js` | Rewritten: builds from the GLB, or a closed block |
| `src/world/builders/interior.js` (new) | Plain blocks, replacement, TV screen |
| `src/world/builders/common.js` | `fitToBox` |
| `src/world/builders/ground.js` | Exports `GROUND_SIZE`, `FOG` |
| `src/world/lightsMarkup.js` (new) | Markup for the warm lights |
| `src/world/interiorConfig.js` (new) | `TV_MODE` |
| `src/world/manifest.js` | `house` in `MANIFEST`; `interiorManifest()` |
| `src/world/assetLoader.js` | `loadInterior`, message constants |
| `src/world/scene.js` | Wires it all; video loader |
| `src/ui/screens.js`, `src/ui/styles.css`, `src/main.js` | Door hint, step-aside message, late notices |
| `src/data/licences.js`, `tests/budget.test.js` | Records, new budget |
| `public/assets/interior/*` (new) | Furniture, lamps, TV still, TV clip |
| `docs/verification/enter-the-house-checklist.md` (new) | The checklist, the test note, the missing-items list |
| `CLAUDE.md` | Updated architecture notes |

---

### Task 1: Layout data for the house, the door, the rooms and the larger place

**Delivers:** US-2, US-4, US-5, US-6. FR-10 (data), FR-11, FR-12, FR-13, FR-16 (no stairs), FR-17 (data), FR-18 (spawn and start spot). AC-2.1, AC-2.2, AC-2.4, AC-2.5, AC-2.6, AC-2.7, AC-4.1, AC-5.1, AC-6.3, AC-6.4, AC-6.5, AC-6.6.

**Files:**

- Modify: `src/world/layout.js`
- Modify: `src/world/builders/ground.js` (export two constants)
- Modify: `tests/layout.test.js`, `tests/builders-house.test.js` (delete for now; rewritten in Task 6)
- Create: `tests/house-layout.test.js`
- Do not edit: `tests/fixtures/phase1-layout.js`

**Step 1: Write the failing tests**

Create `tests/house-layout.test.js`:

```js
import { describe, it, expect } from 'vitest';
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
} from '../src/world/layout.js';
import { GROUND_SIZE, FOG } from '../src/world/builders/ground.js';
import { PHASE1_BOUNDS, PHASE1_SOLIDS } from './fixtures/phase1-layout.js';

const byId = (id) => SOLIDS.find((s) => s.id === id);
const overlaps = (a, b) =>
  Math.abs(a.x - b.x) < (a.w + b.w) / 2 && Math.abs(a.z - b.z) < (a.d + b.d) / 2;

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
    for (const r of ROOMS) for (const s of size(r)) expect(s).toBeGreaterThanOrEqual(3.5);
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
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(l.color.slice(i, i + 2), 16));
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
        if (SOLIDS.some((o) => o !== s && !o.off && overlaps({ ...from, w: 0.6, d: 0.6 }, o))) continue;
        let p = from;
        for (let i = 0; i < 20; i++) {
          p = into(p, alongZ ? { x: p.x - side * 0.1, z: p.z } : { x: p.x, z: p.z - side * 0.1 });
        }
        const inside = Math.abs(p.x - s.x) < s.w / 2 && Math.abs(p.z - s.z) < s.d / 2;
        expect(inside, `${w.id} side ${side}`).toBe(false);
      }
    }
  });
  it('stops a person at the couch, the TV, the kitchen units and the dining table (AC-2.5)', () => {
    for (const id of ['couch', 'tv', 'kitchen', 'dining-table']) {
      const s = byId(id);
      expect(s, id).toBeTruthy();
      const from = { x: s.x, z: s.z + s.d / 2 + 0.6 };
      if (SOLIDS.some((o) => o !== s && overlaps({ ...from, w: 0.6, d: 0.6 }, o))) continue;
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
    for (let i = 0; i < 40; i++) p = into(p, { x: p.x + 0.1, z: INNER_DOORWAY.z });
    expect(p.x).toBeGreaterThan(1);
    for (let i = 0; i < 40; i++) p = into(p, { x: p.x - 0.1, z: INNER_DOORWAY.z });
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
    expect(reachesWithin(SPAWN, byId('couch'), 1.2, SOLIDS, BOUNDS)).toBe(false);
  });
});

describe('the larger place (FR-13, AC-6.3 to AC-6.6)', () => {
  it('leaves at least the phase 1 walkable area outside the house (AC-6.3)', () => {
    const phase1 = walkableArea(PHASE1_SOLIDS, PHASE1_BOUNDS);
    expect(phase1).toBeGreaterThan(444);
    expect(walkableArea(outsideSolids(), BOUNDS)).toBeGreaterThanOrEqual(phase1);
  });
  it('keeps the ground, sky and fog beyond the new boundary (AC-6.4)', () => {
    const far = Math.max(Math.abs(BOUNDS.minX), BOUNDS.maxX, Math.abs(BOUNDS.minZ), BOUNDS.maxZ);
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
    const free = (p) => !SOLIDS.some((s) => !s.off && s.id !== 'character' && overlaps({ ...p, w: 0.6, d: 0.6 }, s));
    expect(free(SPAWN)).toBe(true);
    expect(free(CHARACTER_SPOT)).toBe(true);
    expect(CHARACTER_SPOT.z).toBeGreaterThan(HOUSE.z + HOUSE.d / 2);
    expect(reachesWithin(SPAWN, CHARACTER_SPOT, 1.2, SOLIDS, BOUNDS)).toBe(true);
  });
  it('keeps the path, the swing space and the flower beds clear of solids and of each other', () => {
    expect(Math.abs(PATH.x - DOOR.x)).toBeLessThan(PATH.w / 2);
    const swing = { x: (SWING_SPACE.minX + SWING_SPACE.maxX) / 2, z: (SWING_SPACE.minZ + SWING_SPACE.maxZ) / 2, w: SWING_SPACE.maxX - SWING_SPACE.minX, d: SWING_SPACE.maxZ - SWING_SPACE.minZ };
    const garden = SOLIDS.filter((s) => !s.zone && s.id !== 'character');
    for (const s of garden) expect(overlaps(swing, s), s.id).toBe(false);
    for (const b of FLOWER_BEDS) {
      expect(overlaps(b, swing), b.id).toBe(false);
      expect(overlaps(b, { x: PATH.x, z: (PATH.z0 + PATH.z1) / 2, w: PATH.w, d: PATH.z1 - PATH.z0 }), b.id).toBe(false);
    }
  });
});
```

Update `tests/layout.test.js`: delete the `new layout` test `keeps the boundary`, the old `the house` block (`is a solid with the same footprint...`, `has its door on the garden side` stays in a new form below), and the `lets a person reach the character` test's `HOUSE`-based line stays. Replace the `has its door on the garden side` test with `expect(DOOR.z).toBeCloseTo(HOUSE.z + HOUSE.d / 2)`. In `blocking`, `walkInto` runs over every solid; skip solids with a `zone` (they are covered in `house-layout.test.js`). The `leaves at least as much walkable area` test moves to `house-layout.test.js` (done above); delete it here. Delete `tests/builders-house.test.js` (Task 6 writes its replacement).

**Step 2: Run the tests to see them fail**

Run: `npx vitest run tests/house-layout.test.js tests/layout.test.js`
Expected: FAIL (missing exports such as `WALLS`, `ROOMS`, `outsideSolids`).

**Step 3: Write the layout**

In `src/world/builders/ground.js` export the two constants. Change `const GROUND_SIZE = 600;` to `export const GROUND_SIZE = 600;` and add `export const FOG = { near: 40, far: 220 };`.

In `src/world/layout.js`:

1. Replace the first lines through `PATH` with:

```js
export const BOUNDS = { minX: -12, maxX: 12, minZ: -11, maxZ: 11 };
export const SPAWN = { x: 0, z: 6 };
export const CHARACTER_SPOT = { x: 3, z: -1 };

export const WALL = 0.2; // thickness of every wall, in metres

// Two floors, one gable roof. Only the main floor can be entered. Door and windows are on the garden (+z) side.
export const HOUSE = {
  x: 0,
  z: -7.5,
  w: 8,
  d: 5,
  floors: 2,
  wallHeight: 5,
  ceilingHeight: 2.5,
  roofHeight: 1.8,
};
const HW = HOUSE.w / 2;
const HD = HOUSE.d / 2;
export const HOUSE_FRONT_Z = HOUSE.z + HD; // the outer face of the garden wall

// The front door. DOOR.z is the outer face of the wall. It swings outward, hinged on its left jamb.
export const DOOR = { x: -1.95, z: HOUSE_FRONT_Z, w: 1.2, h: 2.1 };
export const HINGE = { x: DOOR.x - DOOR.w / 2, z: DOOR.z + 0.03 };
// The opening in the wall, and the swing space (a square that contains the quarter disc the door sweeps).
export const OPENING = {
  minX: DOOR.x - DOOR.w / 2,
  maxX: DOOR.x + DOOR.w / 2,
  minZ: DOOR.z - WALL,
  maxZ: DOOR.z,
};
export const SWING_SPACE = {
  minX: OPENING.minX,
  maxX: OPENING.maxX,
  minZ: DOOR.z,
  maxZ: DOOR.z + DOOR.w,
};
// The doorway between the rooms: an opening in the wall that splits the main floor.
export const INNER_DOORWAY = { x: HOUSE.x, z: HOUSE.z, w: 1.2, h: 2.1 };

export const ROOMS = [
  { id: 'living', minX: -HW + WALL, maxX: -WALL / 2, minZ: HOUSE.z - HD + WALL, maxZ: HOUSE_FRONT_Z - WALL },
  { id: 'kitchen', minX: WALL / 2, maxX: HW - WALL, minZ: HOUSE.z - HD + WALL, maxZ: HOUSE_FRONT_Z - WALL },
];

// The path from the street to the door. Not a solid.
export const PATH = { x: DOOR.x, z0: DOOR.z, z1: 9, w: 1.4 };

// Flower beds are drawn but never block walking.
export const FLOWER_BEDS = [
  { id: 'bed-left', x: -5, z: -3.2, w: 2, d: 1 },
  { id: 'bed-right', x: 2.5, z: -3, w: 2, d: 1 },
];
```

2. Add the walls, the door solids, the interior items and the lights below the flower beds:

```js
// Walls. The garden wall has a gap for the front door and the middle wall a gap for the inner doorway.
const leftW = OPENING.minX - (HOUSE.x - HW);
const rightW = HOUSE.x + HW - OPENING.maxX;
const frontZ = HOUSE_FRONT_Z - WALL / 2;
const backEnd = HOUSE.z - HD + WALL;
const frontEnd = HOUSE_FRONT_Z - WALL;
const gapLo = INNER_DOORWAY.z - INNER_DOORWAY.w / 2;
const gapHi = INNER_DOORWAY.z + INNER_DOORWAY.w / 2;
const wall = (id, x, z, w, d, h) => ({ id, x, z, w, d, h });
export const WALLS = [
  wall('wall-front-left', HOUSE.x - HW + leftW / 2, frontZ, leftW, WALL, HOUSE.wallHeight),
  wall('wall-front-right', OPENING.maxX + rightW / 2, frontZ, rightW, WALL, HOUSE.wallHeight),
  wall('wall-back', HOUSE.x, HOUSE.z - HD + WALL / 2, HOUSE.w, WALL, HOUSE.wallHeight),
  wall('wall-left', HOUSE.x - HW + WALL / 2, HOUSE.z, WALL, HOUSE.d, HOUSE.wallHeight),
  wall('wall-right', HOUSE.x + HW - WALL / 2, HOUSE.z, WALL, HOUSE.d, HOUSE.wallHeight),
  wall('wall-mid-back', HOUSE.x, (backEnd + gapLo) / 2, WALL, gapLo - backEnd, HOUSE.ceilingHeight),
  wall('wall-mid-front', HOUSE.x, (gapHi + frontEnd) / 2, WALL, frontEnd - gapHi, HOUSE.ceilingHeight),
];

// Interior items. `x`, `z` is the centre, `w` (x) and `d` (z) the footprint on the floor, `h` the height,
// `y` the height of the bottom (default 0), `rot` the turn about y (the model faces +z at 0, so
// +90 degrees faces +x). `file` is the model under public/assets/ (null when no free model was found,
// FR-19). `solid: false` for things that hang. The plain block of an item has the footprint and `color`.
export const INTERIOR_ITEMS = [
  { id: 'couch', file: 'interior/couch.glb', x: -3.35, z: -8.6, w: 0.9, d: 2.2, h: 0.85, rot: Math.PI / 2, color: '#8a5a44' },
  { id: 'tv', file: 'interior/tv.glb', x: -0.3, z: -6.05, w: 0.3, d: 1.2, h: 0.8, y: 0.45, rot: -Math.PI / 2, color: '#1d1d22', screen: { w: 1.05, h: 0.6, y: 0.5, z: 0.04 } },
  { id: 'floor-lamp', file: 'interior/lamp-floor.glb', x: -3.45, z: -6, w: 0.35, d: 0.35, h: 1.6, color: '#d8b46a' },
  { id: 'kitchen', file: 'interior/kitchen.glb', x: 1.95, z: -9.45, w: 3.3, d: 0.7, h: 0.9, color: '#cfc8bd' },
  { id: 'dining-table', file: 'interior/dining-table.glb', x: 2.4, z: -7, w: 1.4, d: 0.9, h: 0.76, color: '#a9743b' },
  { id: 'pendant-living', file: 'interior/lamp-pendant.glb', x: -1.9, z: -7.5, w: 0.35, d: 0.35, h: 0.35, y: 2.15, solid: false, color: '#d8b46a' },
  { id: 'pendant-kitchen', file: 'interior/lamp-pendant.glb', x: 1.95, z: -7.5, w: 0.35, d: 0.35, h: 0.35, y: 2.15, solid: false, color: '#d8b46a' },
];

// Warm lights (FR-14). Few on purpose: every light costs frame rate on every lit surface.
export const LIGHTS = [
  { id: 'light-living', room: 'living', x: -1.9, y: 2.0, z: -7.5, color: '#ffb866', intensity: 0.7, distance: 6 },
  { id: 'light-lamp', room: 'living', x: -3.45, y: 1.5, z: -6, color: '#ffa94d', intensity: 0.5, distance: 4 },
  { id: 'light-kitchen', room: 'kitchen', x: 1.95, y: 2.0, z: -7.5, color: '#ffc27a', intensity: 0.7, distance: 6 },
  { id: 'light-counter', room: 'kitchen', x: 1.95, y: 1.6, z: -9, color: '#ffd29a', intensity: 0.4, distance: 3.5 },
];
```

3. In `SOLIDS`: delete the old `house` entry. Move `planter` to `x: -5.6, z: -5.5`, `bush-1` to `x: -3.4`, and `hedge-1` to `x: 6`. After the `character` entry, append the house solids. Rewrite the end of the file like this:

```js
// The whole house as one block. It stands in for the walls when the house model fails (FR-21),
// it is what the character keeps out of (FR-10), and it is what the walkable area outside the house leaves out.
export const HOUSE_BLOCK = { id: 'house-block', kind: 'house', zone: 'block', x: HOUSE.x, z: HOUSE.z, w: HOUSE.w, d: HOUSE.d, h: HOUSE.wallHeight, color: '#e8c9a0' };

// `off` solids are skipped by collision. The door is `off` when fully open. The swing space is `off` at rest.
const DOOR_SOLID = { id: 'door', kind: 'door', zone: 'house', off: false, x: DOOR.x, z: DOOR.z - WALL / 2, w: DOOR.w, d: WALL, h: DOOR.h };
const SWING_SOLID = { id: 'door-swing', kind: 'door', zone: 'house', off: true, x: (SWING_SPACE.minX + SWING_SPACE.maxX) / 2, z: (SWING_SPACE.minZ + SWING_SPACE.maxZ) / 2, w: DOOR.w, d: DOOR.w, h: DOOR.h };
const HOUSE_SOLIDS = [
  ...WALLS.map((w) => ({ ...w, kind: 'wall', zone: 'house', color: '#e8c9a0' })),
  DOOR_SOLID,
  SWING_SOLID,
  ...INTERIOR_ITEMS.filter((i) => i.solid !== false).map((i) => ({ id: i.id, kind: 'interior', zone: 'house', x: i.x, z: i.z, w: i.w, d: i.d, h: i.h, color: i.color })),
];
SOLIDS.push(...HOUSE_SOLIDS);

// For a house that failed to load: one closed block, no door, no interior (FR-21).
export function useClosedHouse() {
  for (let i = SOLIDS.length - 1; i >= 0; i--) if (SOLIDS[i].zone === 'house') SOLIDS.splice(i, 1);
  if (!SOLIDS.includes(HOUSE_BLOCK)) SOLIDS.push(HOUSE_BLOCK);
}

// Back to the normal house, for a new visit. The door is closed again (FR-6).
export function resetHouse() {
  const at = SOLIDS.indexOf(HOUSE_BLOCK);
  if (at >= 0) SOLIDS.splice(at, 1);
  for (const s of HOUSE_SOLIDS) if (!SOLIDS.includes(s)) SOLIDS.push(s);
  DOOR_SOLID.off = false;
  SWING_SOLID.off = true;
}

export const doorSolids = () => ({ door: DOOR_SOLID, swing: SWING_SOLID });

// The solids outside the house, with the house as one block: what FR-13 measures.
export function outsideSolids() {
  return [...SOLIDS.filter((s) => !s.zone), HOUSE_BLOCK];
}

// The solids the character walks around: the garden, and the whole house as one block, so he
// never goes into it, open door or not (FR-10). The character's own solid is not in the list.
export function wanderSolids() {
  return outsideSolids().filter((s) => s.id !== 'character');
}
```

Keep `resetCharacterSolid` as it is. Because `SOLIDS` is declared with `const` before `SOLIDS.push`, place the `HOUSE_SOLIDS` code after the array.

**Step 4: Run the tests to see them pass**

Run: `npx vitest run tests/house-layout.test.js tests/layout.test.js`
Expected: PASS. Two tests depend on Task 2 (`off` flag): `lets a person through a fully open door`, `lets a person walk between the rooms`, `lets a person reach every interior item`, `stops a person at the swing space`. If they fail only for that reason, finish Task 2 first, then re-run. Do not weaken them.

If `stops a person at the couch...` or the reachability test fails, move that one item a little in `INTERIOR_ITEMS` (keep it inside its room, clear of the inner doorway at z −8.1 to −6.9). Do not change the tests.

**Step 5: Commit**

```bash
git add src/world/layout.js src/world/builders/ground.js tests/
git commit -m "feat: layout for an enterable house and a larger place"
```

---

### Task 2: Collision and walkable area skip solids that are `off`

**Delivers:** US-2. FR-4, FR-17. AC-2.1, AC-2.2, AC-2.3.

**Files:**

- Modify: `src/logic/collision.js`, `src/logic/walkable.js`
- Modify: `tests/collision.test.js`, `tests/layout.test.js` (walkableArea block)

**Step 1: Write the failing tests**

Add to `tests/collision.test.js`:

```js
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
    expect(walkableArea([{ x: 0, z: 0, w: 2, d: 2, off: true }], b)).toBeCloseTo(100, 0);
  });
});
```

(Import `walkableArea` from `../src/logic/walkable.js` at the top if it is not already imported.)

**Step 2:** Run `npx vitest run tests/collision.test.js`. Expected: FAIL (the off solid still blocks).

**Step 3: Implement**

In `src/logic/collision.js` change the `hitsSolid` body to:

```js
export function hitsSolid(x, z, solids, radius) {
  return solids.some(
    (s) =>
      !s.off &&
      Math.abs(x - s.x) < s.w / 2 + radius &&
      Math.abs(z - s.z) < s.d / 2 + radius,
  );
}
```

In `src/logic/walkable.js`, inside the `covered` test add `!s.off &&` first.

**Step 4:** Run `npx vitest run tests/collision.test.js tests/house-layout.test.js tests/layout.test.js`. Expected: PASS, including the Task 1 tests that waited on this.

**Step 5: Commit**

```bash
git add src/logic tests
git commit -m "feat: solids can be switched off, for an open door"
```

---

### Task 3: Door logic (state machine, distance, doorway, hint and message rules)

**Delivers:** US-1, US-3. FR-1, FR-2, FR-3, FR-4, FR-5, FR-6, FR-7, FR-8, FR-9. NFR-3. AC-1.1, AC-1.2, AC-1.3, AC-1.5, AC-1.6, AC-1.9, AC-1.10, AC-3.1 to AC-3.7.

**Files:**

- Create: `src/logic/door.js`
- Create: `tests/door.test.js`

**Step 1: Write the failing tests**

```js
import { describe, it, expect } from 'vitest';
import {
  DOOR_SWING_SECONDS,
  CLICK_RANGE,
  createDoor,
  isAtRest,
  isFullyOpen,
  openness,
  doorAngle,
  stepDoor,
  clickDoor,
  inDoorway,
  distanceToDoor,
  hintVisible,
  stepAsideVisible,
} from '../src/logic/door.js';
import { OPENING, SWING_SPACE, HINGE, DOOR } from '../src/world/layout.js';

const run = (door, seconds, dt = 1 / 60) => {
  for (let t = 0; t < seconds; t += dt) door = stepDoor(door, dt);
  return door;
};
const swing = (door) => clickDoor(door, { inDoorway: false }).door;

describe('the swing (FR-3, FR-4, FR-9, AC-1.1, AC-1.2, AC-1.6)', () => {
  it('starts closed on every visit and is not stored (FR-6, AC-1.9)', () => {
    expect(createDoor()).toEqual({ phase: 'closed', t: 0 });
  });
  it('lasts between 0.5 and 2 seconds', () => {
    expect(DOOR_SWING_SECONDS).toBeGreaterThanOrEqual(0.5);
    expect(DOOR_SWING_SECONDS).toBeLessThanOrEqual(2);
  });
  it('a click on a closed door swings it, and it ends fully open (AC-1.1)', () => {
    let d = swing(createDoor());
    expect(d.phase).toBe('opening');
    expect(isAtRest(d)).toBe(false);
    d = run(d, DOOR_SWING_SECONDS + 0.1);
    expect(isFullyOpen(d)).toBe(true);
  });
  it('a click on an open door swings it, and it ends fully closed (AC-1.2)', () => {
    const open = run(swing(createDoor()), 2);
    const d = run(swing(open), 2);
    expect(d.phase).toBe('closed');
  });
  it('counts as open only when fully open, so a swinging door blocks (FR-4)', () => {
    const d = swing(createDoor());
    expect(isFullyOpen(run(d, DOOR_SWING_SECONDS * 0.5))).toBe(false);
    const closing = swing(run(d, 2));
    expect(isFullyOpen(closing)).toBe(false);
  });
  it('moves at once: the first step already turns it (NFR-4)', () => {
    const d = stepDoor(swing(createDoor()), 1 / 60);
    expect(openness(d)).toBeGreaterThan(0);
  });
  it('swings outward into the garden (AC-1.10)', () => {
    const angle = doorAngle({ phase: 'open', t: 0 });
    // the door leaf runs from the hinge along local +x; turned by the angle it must point to +z
    const wx = 1.2 * Math.cos(angle);
    const wz = -1.2 * Math.sin(angle);
    expect(wx).toBeCloseTo(0);
    expect(wz).toBeCloseTo(1.2);
    expect(doorAngle(createDoor())).toBeCloseTo(0);
  });
});

describe('clicks (FR-7, FR-9, AC-3.3, AC-3.4, AC-3.6, AC-3.7)', () => {
  it('ignores a click on a door in the doorway, and says step aside (AC-3.3, AC-3.4)', () => {
    const open = run(swing(createDoor()), 2);
    const r = clickDoor(open, { inDoorway: true });
    expect(r.outcome).toBe('step-aside');
    expect(r.door).toBe(open);
    const closed = createDoor();
    expect(clickDoor(closed, { inDoorway: true }).door).toBe(closed);
  });
  it('closes the door on the next click after the person stepped out (AC-3.5)', () => {
    const open = run(swing(createDoor()), 2);
    expect(clickDoor(open, { inDoorway: false }).door.phase).toBe('closing');
  });
  it('ignores any click while it swings, even a double click, and finishes in its direction (AC-3.6, AC-3.7)', () => {
    let d = swing(createDoor());
    for (let i = 0; i < 3; i++) {
      const r = clickDoor(d, { inDoorway: false });
      expect(r.outcome).toBe('ignored');
      d = r.door;
    }
    expect(run(d, 2).phase).toBe('open');
    let c = swing(run(swing(createDoor()), 2));
    c = clickDoor(c, { inDoorway: false }).door;
    expect(run(c, 2).phase).toBe('closed');
  });
});

describe('the doorway (FR-7)', () => {
  const rects = [OPENING, SWING_SPACE];
  it('is hit by a footprint that overlaps the opening or the swing space', () => {
    expect(inDoorway({ x: DOOR.x, z: DOOR.z + 0.5 }, rects)).toBe(true);
    expect(inDoorway({ x: DOOR.x, z: DOOR.z - 0.1 }, rects)).toBe(true);
    expect(inDoorway({ x: DOOR.x, z: SWING_SPACE.maxZ + 0.2 }, rects)).toBe(true); // footprint radius 0.3
  });
  it('is not hit when the person stands clear of both', () => {
    expect(inDoorway({ x: DOOR.x, z: SWING_SPACE.maxZ + 0.5 }, rects)).toBe(false);
    expect(inDoorway({ x: DOOR.x, z: OPENING.minZ - 0.5 }, rects)).toBe(false);
    expect(inDoorway({ x: SWING_SPACE.maxX + 0.5, z: DOOR.z + 0.5 }, rects)).toBe(false);
  });
});

describe('the distance to the nearest point of the door (FR-1, FR-2, AC-1.3)', () => {
  const door = { hinge: HINGE, w: DOOR.w, h: DOOR.h, t: 0.05 };
  it('measures to the door leaf, not to its hinge', () => {
    const p = { x: HINGE.x + 0.6, y: 1.6, z: HINGE.z + 2 };
    expect(distanceToDoor(p, door, 0)).toBeCloseTo(2 - 0.025, 2);
  });
  it('follows the leaf as it swings open', () => {
    const p = { x: HINGE.x + 0.6, y: 1.6, z: HINGE.z + 2 };
    expect(distanceToDoor(p, door, -Math.PI / 2)).toBeLessThan(distanceToDoor(p, door, 0));
  });
  it('is more than the click range from a person 4 m away', () => {
    expect(distanceToDoor({ x: HINGE.x + 0.6, y: 1.6, z: HINGE.z + 4 }, door, 0)).toBeGreaterThan(CLICK_RANGE);
  });
  it('works from inside the house (FR-5, AC-1.5)', () => {
    expect(distanceToDoor({ x: HINGE.x + 0.6, y: 1.6, z: HINGE.z - 2 }, door, 0)).toBeLessThanOrEqual(CLICK_RANGE);
  });
});

describe('the hint and the step-aside message (FR-8, AC-3.1, AC-3.2)', () => {
  const ok = { door: createDoor(), distance: 2, inView: true, inDoorway: false };
  it('shows the hint when the door is at rest, near, in view and nobody is in the doorway', () => {
    expect(hintVisible(ok)).toBe(true);
    expect(hintVisible({ ...ok, door: run(swing(createDoor()), 2) })).toBe(true);
  });
  it('hides it as soon as one of those stops being true', () => {
    expect(hintVisible({ ...ok, distance: CLICK_RANGE + 0.01 })).toBe(false);
    expect(hintVisible({ ...ok, inView: false })).toBe(false);
    expect(hintVisible({ ...ok, inDoorway: true })).toBe(false);
    expect(hintVisible({ ...ok, door: swing(createDoor()) })).toBe(false);
  });
  it('shows the step-aside message while it was asked for and the person is still in the way (AC-3.5)', () => {
    expect(stepAsideVisible({ requested: true, inDoorway: true })).toBe(true);
    expect(stepAsideVisible({ requested: true, inDoorway: false })).toBe(false);
    expect(stepAsideVisible({ requested: false, inDoorway: true })).toBe(false);
  });
});
```

**Step 2:** Run `npx vitest run tests/door.test.js`. Expected: FAIL (module not found).

**Step 3: Write `src/logic/door.js`**

```js
// The front door, as pure logic. No A-Frame, no DOM, no storage (NFR-3): the state is never kept.
export const DOOR_SWING_SECONDS = 1; // FR-3: at least 0.5 and at most 2
export const CLICK_RANGE = 3; // metres to the nearest point of the door (FR-1, FR-2)
export const FOOTPRINT_RADIUS = 0.3; // a person's footprint (A-9)

// phase: closed | opening | open | closing. t is how far a swing has come, 0 to 1.
export const createDoor = () => ({ phase: 'closed', t: 0 });
export const isAtRest = (d) => d.phase === 'closed' || d.phase === 'open';
export const isFullyOpen = (d) => d.phase === 'open';

const ease = (t) => t * t * (3 - 2 * t);

// 0 closed, 1 open.
export function openness(d) {
  if (d.phase === 'closed') return 0;
  if (d.phase === 'open') return 1;
  return d.phase === 'opening' ? ease(d.t) : 1 - ease(d.t);
}

// Turn about y of the door leaf. Negative turns the leaf from along +x to along +z: outward (AC-1.10).
export const doorAngle = (d) => -openness(d) * (Math.PI / 2);

export function stepDoor(d, seconds, duration = DOOR_SWING_SECONDS) {
  if (isAtRest(d)) return d;
  const t = Math.min(1, d.t + seconds / duration);
  if (t < 1) return { phase: d.phase, t };
  return { phase: d.phase === 'opening' ? 'open' : 'closed', t: 0 };
}

// outcome: 'swing' | 'ignored' (the door is swinging, FR-9) | 'step-aside' (someone is in the doorway, FR-7).
export function clickDoor(d, { inDoorway }) {
  if (!isAtRest(d)) return { door: d, outcome: 'ignored' };
  if (inDoorway) return { door: d, outcome: 'step-aside' };
  return {
    door: { phase: d.phase === 'closed' ? 'opening' : 'closing', t: 0 },
    outcome: 'swing',
  };
}

export function circleHitsRect(p, radius, rect) {
  const cx = Math.min(Math.max(p.x, rect.minX), rect.maxX);
  const cz = Math.min(Math.max(p.z, rect.minZ), rect.maxZ);
  return Math.hypot(p.x - cx, p.z - cz) < radius;
}

// True when the person's footprint overlaps the opening or the swing space (the `rects`).
export const inDoorway = (p, rects, radius = FOOTPRINT_RADIUS) =>
  rects.some((r) => circleHitsRect(p, radius, r));

// Straight-line distance from a person ({x, y, z}) to the nearest point of the door leaf.
// `door` is { hinge: {x, z}, w, h, t }; `angle` is the turn about y from doorAngle().
export function distanceToDoor(person, door, angle) {
  const rx = person.x - door.hinge.x;
  const rz = person.z - door.hinge.z;
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const lx = rx * c - rz * s; // the person in the leaf's own frame
  const lz = rx * s + rz * c;
  const dx = Math.max(-lx, 0, lx - door.w);
  const dy = Math.max(-person.y, 0, person.y - door.h);
  const dz = Math.max(-door.t / 2 - lz, 0, lz - door.t / 2);
  return Math.hypot(dx, dy, dz);
}

export const hintVisible = ({ door, distance, inView, inDoorway: blocked }) =>
  isAtRest(door) && distance <= CLICK_RANGE && inView && !blocked;

export const stepAsideVisible = ({ requested, inDoorway: blocked }) =>
  requested && blocked;
```

**Step 4:** Run `npx vitest run tests/door.test.js`. Expected: PASS.

**Step 5: Commit**

```bash
git add src/logic/door.js tests/door.test.js
git commit -m "feat: pure door logic"
```

---

### Task 4: Click versus drag (OQ-1)

**Delivers:** US-1. FR-1 (a click is a press and release without dragging). AC-1.8.

**Files:**

- Create: `src/logic/click.js`, `tests/click.test.js`

**Step 1: Test**

```js
import { describe, it, expect } from 'vitest';
import { isClick, DRAG_LIMIT_PX } from '../src/logic/click.js';

describe('click versus drag (A-1, AC-1.8)', () => {
  it('is a click when the pointer stays put', () => {
    expect(isClick({ x: 100, y: 100 }, { x: 100, y: 100 })).toBe(true);
    expect(isClick({ x: 100, y: 100 }, { x: 102, y: 101 })).toBe(true);
  });
  it('is a drag when the pointer moved past the limit', () => {
    expect(isClick({ x: 100, y: 100 }, { x: 100 + DRAG_LIMIT_PX + 1, y: 100 })).toBe(false);
    expect(isClick({ x: 100, y: 100 }, { x: 160, y: 140 })).toBe(false);
  });
  it('is not a click without a press', () => {
    expect(isClick(null, { x: 1, y: 1 })).toBe(false);
  });
});
```

**Step 2:** `npx vitest run tests/click.test.js` → FAIL.

**Step 3: `src/logic/click.js`**

```js
// A click is a press and a release without dragging (A-1). Dragging turns the view.
export const DRAG_LIMIT_PX = 4;

export function isClick(down, up, limit = DRAG_LIMIT_PX) {
  if (!down || !up) return false;
  return Math.hypot(up.x - down.x, up.y - down.y) <= limit;
}
```

**Step 4:** PASS. **Step 5:** `git add src/logic/click.js tests/click.test.js && git commit -m "feat: tell a click from a drag"`

---

### Task 5: The character stays in the garden

**Delivers:** US-6. FR-10. AC-6.1, AC-6.2.

**Files:**

- Modify: `src/world/components.js` (`character-wander`, one line)
- Modify: `tests/wander.test.js` (add a block)

**Step 1: Test.** Add to `tests/wander.test.js`:

```js
import { wanderSolids, doorSolids, BOUNDS, HOUSE, SOLIDS } from '../src/world/layout.js';
import { pickTarget, isFree, findPath } from '../src/logic/wander.js';

describe('he stays out of the house, open door or not (FR-10, AC-6.1)', () => {
  it('treats the doorway and every room as blocked', () => {
    doorSolids().door.off = true; // the door is fully open
    const solids = wanderSolids();
    const inside = { x: HOUSE.x, z: HOUSE.z };
    expect(isFree(inside.x, inside.z, solids, BOUNDS)).toBe(false);
    expect(isFree(-1.95, -4.9, solids, BOUNDS)).toBe(false); // in the open doorway
    expect(findPath({ x: -1.95, z: 0 }, { x: -1.95, z: -6 }, solids, BOUNDS)).toBeNull();
    doorSolids().door.off = false;
  });
  it('never picks a target inside the house', () => {
    doorSolids().door.off = true;
    const solids = wanderSolids();
    let n = 0;
    const rng = () => ((n = (n * 9301 + 49297) % 233280), n / 233280 || 0.5);
    for (let i = 0; i < 200; i++) {
      const t = pickTarget(rng, { x: 3, z: -1 }, solids, BOUNDS);
      if (!t) continue;
      const p = t.target ?? t;
      const inHouse = Math.abs(p.x - HOUSE.x) < HOUSE.w / 2 && Math.abs(p.z - HOUSE.z) < HOUSE.d / 2;
      expect(inHouse).toBe(false);
    }
    doorSolids().door.off = false;
  });
  it('keeps the character solid out of the garden list (his own solid is moved by the component)', () => {
    expect(wanderSolids().some((s) => s.id === 'character')).toBe(false);
    expect(SOLIDS.some((s) => s.id === 'character')).toBe(true);
  });
});
```

(Check what `pickTarget` returns in `src/logic/wander.js` lines 199 to 215 and adjust `t.target ?? t` if it returns `{ target, path }` or a point. Keep the assertion: no target in the house.)

**Step 2:** `npx vitest run tests/wander.test.js` → FAIL (`wanderSolids` is not used by anything yet, but exists from Task 1; the new tests may already pass). If they pass, the wiring below is what the test cannot see: continue.

**Step 3:** In `src/world/components.js` import `wanderSolids` and in `character-wander` `init()` replace
`this.solids = SOLIDS.filter((s) => s.id !== 'character');` with `this.solids = wanderSolids();`. Keep `SOLIDS` imported for `this.body`.

**Step 4:** `npx vitest run` → PASS.

**Step 5:** `git add src tests && git commit -m "feat: the character keeps out of the house"`

---

### Task 6: The house as a generated model, with a closed-block fallback

**Delivers:** US-5, US-7. FR-11 (the rooms are built), FR-12, FR-16, FR-21. AC-5.2, AC-5.3, AC-7.9. (AC-1.10 is judged on screen in Task 15.)

**Files:**

- Create: `scripts/build-house.mjs`, `public/assets/models/house.glb`
- Rewrite: `src/world/builders/house.js`
- Modify: `src/world/manifest.js`, `src/world/builders/common.js` (add `fitToBox`), `src/data/licences.js`
- Create: `tests/house-glb.test.js`, `tests/builders-house.test.js`

**Step 1: Tests**

`tests/house-glb.test.js` (node environment, as `character-glb.test.js` reads the file header):

```js
// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { HINGE, HOUSE } from '../src/world/layout.js';

const buf = readFileSync(new URL('../public/assets/models/house.glb', import.meta.url));
const len = buf.readUInt32LE(12);
const gltf = JSON.parse(buf.toString('utf8', 20, 20 + len));

describe('house.glb', () => {
  it('has the material names the builder textures by name', () => {
    const names = gltf.materials.map((m) => m.name);
    for (const n of ['Wall', 'Plaster', 'Floor', 'Ceiling', 'Roof', 'Wood', 'Glass']) expect(names, n).toContain(n);
  });
  it('has a Door node whose origin is the hinge', () => {
    const door = gltf.nodes.find((n) => n.name === 'Door');
    expect(door).toBeTruthy();
    expect(door.translation[0]).toBeCloseTo(HINGE.x - HOUSE.x);
    expect(door.translation[2]).toBeCloseTo(HINGE.z - HOUSE.z);
  });
  it('has windows on the outside and at least 4 of them (AC-5.3)', () => {
    expect(gltf.nodes.filter((n) => /^Window/.test(n.name)).length).toBeGreaterThanOrEqual(4);
  });
  it('has no stairs and a Ceiling node (AC-5.1, AC-5.2)', () => {
    expect(gltf.nodes.some((n) => /stair/i.test(n.name ?? ''))).toBe(false);
    expect(gltf.nodes.some((n) => n.name === 'Ceiling')).toBe(true);
  });
  it('is small', () => {
    expect(buf.length).toBeLessThan(300 * 1024);
  });
});
```

`tests/builders-house.test.js` (jsdom default env is fine, three is a dev dependency): build a fake GLB scene with the same node names (no file needed), and check:

- With `assets.gltf('house')` present: the group has `userData.kind === 'house'`, a `userData.door` node named `Door`, the `Wall` material replaced by a textured material when `brick` loaded, parts tagged `door`, `window`, `roof`, `walls`.
- With no house: `buildHouse(THREE, makeAssets(new Map()))` returns a group with `userData.kind === 'house'`, `userData.plain` set, **no** `userData.door`, one mesh with the footprint of `HOUSE_BLOCK`, and `userData.closed === true` (FR-21, AC-7.9).
- `useClosedHouse()` leaves `SOLIDS` with `house-block` and no `zone === 'house'` solid, and `resetHouse()` restores them (call `resetHouse()` in `afterEach`). The person cannot enter: `resolveMove` from the garden toward the centre ends outside the footprint.

**Step 2:** Run both; FAIL.

**Step 3: Implement**

`scripts/build-house.mjs`: imports `three`, `three/examples/jsm/exporters/GLTFExporter.js` and `../src/world/layout.js`. It needs a minimal `FileReader` shim before parsing (as verified):

```js
globalThis.FileReader = class {
  readAsArrayBuffer(b) { b.arrayBuffer().then((r) => { this.result = r; this.onloadend?.(); }); }
  readAsDataURL(b) { b.arrayBuffer().then((r) => { this.result = 'data:application/octet-stream;base64,' + Buffer.from(r).toString('base64'); this.onloadend?.(); }); }
};
```

It builds one `THREE.Group` centred on the house (positions in metres, relative to `HOUSE.x`, `HOUSE.z`), one named material per kind (`MeshStandardMaterial` with `.name` set to `Wall`, `Plaster`, `Floor`, `Ceiling`, `Roof`, `Wood`, `Glass`), and these meshes:

- **Wall**: each `WALLS` entry as a box of its `h` (the garden-side and outer walls are 5 m tall, the middle walls 2.5 m), plus the lintels above the openings: over the front door from y 2.1 to 5 (width `DOOR.w`), over the inner doorway from y 2.1 to 2.5 (width `INNER_DOORWAY.w`). Plus the two gable triangles and nothing else above the ceiling inside (the upper floor has no inside).
- **Plaster**: a 0.02 m lining just inside each outer wall piece up to 2.5 m, and the two middle walls use `Plaster` instead of `Wall`.
- **Floor**: a 0.02 m slab over both rooms. **Ceiling**: a 0.1 m slab at y 2.5 to 2.6 over both rooms (plain, FR-16).
- **Roof**: the gable roof geometry from the old `roofGeometry` in `src/world/builders/house.js` (copy the function into the script, pass the same numbers), named `Roof`.
- **Wood** and **Glass**: the windows on the garden wall as before (frame, pane, sill), nodes named `Window1`, `Window2`... at ground x = −3.3, 1.2, 3.0 (y 1.5) and upper x = −3.3, −1.95, 1.2, 3.0 (y 4.0); plus the node `Door`: a group at (`HINGE.x − HOUSE.x`, 0, `HINGE.z − HOUSE.z`) holding one 1.2 × 2.1 × 0.05 `Wood` box at (0.6, 1.05, 0).
- Name the ceiling mesh `Ceiling`.

Export with `new GLTFExporter().parse(group, resolve, reject, { binary: true })` and write `public/assets/models/house.glb`. Add `"build:house": "node scripts/build-house.mjs"` to `package.json`. Run it: `npm run build:house`.

`src/world/manifest.js`: add `{ id: 'house', type: 'model', url: url('models/house.glb') }` to `MANIFEST`.

`src/data/licences.js`: add a record for `models/house.glb`: author `OpenFreeyond (generated by scripts/build-house.mjs)`, source a repo URL (use the repository's GitHub URL; if the remote is not set, ask the builder for it, do not invent one), licence `CC0-1.0`, licence text stating the builder dedicates the generated file under CC0 1.0, `credit: null`, `checked: '2026-11-09'`, `verified: false`, and a `note`: `The owner confirms the CC0 dedication of the generated house before going online.`

`src/world/builders/common.js`: add `fitToBox` (used again in Task 10):

```js
// Scales a model uniformly to fit a footprint and a height, stands it on y = 0 and centres it on x and z.
export function fitToBox(THREE, object, { w, d, h }, rot = 0) {
  const wrapper = new THREE.Group();
  object.rotation.y = rot;
  wrapper.add(object);
  const size = new THREE.Box3().setFromObject(object).getSize(new THREE.Vector3());
  const fit = Math.min(w / (size.x || 1), d / (size.z || 1), h / (size.y || 1));
  object.scale.multiplyScalar(fit);
  const box = new THREE.Box3().setFromObject(object);
  const centre = box.getCenter(new THREE.Vector3());
  object.position.set(-centre.x, -box.min.y, -centre.z);
  return wrapper;
}
```

`src/world/builders/house.js` (rewrite): export `buildHouse(THREE, assets)`. Keep the group at `(HOUSE.x, 0, HOUSE.z)`. When `assets.gltf('house')` is missing, return `plainBlock`-style closed block from `HOUSE_BLOCK` with `userData.kind = 'house'`, `userData.plain = 'house'`, `userData.closed = true` (reuse `plainBlock(THREE, HOUSE_BLOCK, 'house')`). Otherwise take `gltf.scene`, and traverse its meshes by material name, replacing each material:

- `Wall`: `surface(THREE, assets, 'brick', '#e8c9a0', { repeat: [max(sx, sz) / 2, sy / 2] })` where `sx, sy, sz` come from the mesh's geometry bounding box. Tag the first wall mesh `walls`.
- `Roof`: as today (`roof` texture, repeat `[w / 1.5, d / 1.5]`, tint `#d9a98c`, gain 2.8, `DoubleSide`), tag `roof`.
- `Wood`: `surface(THREE, assets, 'wood', '#8b5a2b')`. `Floor`: `surface(THREE, assets, 'wood', '#c9a06b', { repeat: [3, 3] })`.
- `Plaster`: plain `MeshStandardMaterial` `#f1e4cf`. `Ceiling`: plain `#f6efe3`. `Glass`: keep the GLB material but set the colours as the old builder did.
- Tag the node named `Door` with `userData.part = 'door'` and expose it as `group.userData.door`; tag `Window*` nodes `window`.

Dispose note: the textures made by `surface()` are cloned, `disposeObject` already frees them.

**Step 4:** `npm run build:house && npx vitest run tests/house-glb.test.js tests/builders-house.test.js tests/manifest.test.js tests/licences.test.js tests/buildWorld.test.js` → PASS. (`tests/buildWorld.test.js` still passes: with all assets failing there is one `house` kind, the closed block.)

**Step 5:** `git add scripts public/assets/models/house.glb src tests package.json && git commit -m "feat: the house is a generated model with a closed-block fallback"`

---

### Task 7: The door in the world (click, swing, hint and message events)

**Delivers:** US-1, US-2, US-3, US-8. FR-1 to FR-9. NFR-3, NFR-4. AC-1.1 to AC-1.10, AC-2.1 to AC-2.3, AC-3.1 to AC-3.7. (The logic is tested in Tasks 2 to 4. The wiring is judged in Task 15.)

**Files:**

- Modify: `src/world/components.js` (new `house-door` component)
- Modify: `src/world/buildWorld.js` (return `pickables`, mark sky and ground), `src/world/builders/sky.js`, `src/world/builders/ground.js` (set `userData.noPick = true` on the meshes)
- Modify: `src/world/scene.js` (markup, `attach`, events, cleanup)
- Modify: `tests/components.test.js` (add a source scan)

**Step 1: Test.** In `tests/components.test.js` add a scan that the door code never touches storage or the network (it is also covered by Task 13) and that `house-door` defines no `play(`/`pause(` with arguments (the existing scan already covers every component in the file). Add:

```js
it('registers the house-door component', () => {
  expect(source).toMatch(/registerComponent\('house-door'/);
});
```

**Step 2:** `npx vitest run tests/components.test.js` → FAIL.

**Step 3: Implement** in `src/world/components.js`. Import `createDoor, stepDoor, clickDoor, doorAngle, isAtRest, isFullyOpen, inDoorway, distanceToDoor, hintVisible, stepAsideVisible, CLICK_RANGE` from `../logic/door.js`, `isClick` from `../logic/click.js`, and `DOOR, HINGE, OPENING, SWING_SPACE, doorSolids` from `./layout.js`. Add:

```js
const DOOR_BOX = { hinge: HINGE, w: DOOR.w, h: DOOR.h, t: 0.05 };
const CHECK_SECONDS = 0.1; // how often the view checks run

// The front door: click to open and close, hint and step-aside events. A fresh component starts with the door
// closed on every visit, and nothing is stored (FR-6, NFR-3). scene.js calls attach() once the house is built.
AFRAME.registerComponent('house-door', {
  init() {
    this.door = createDoor();
    this.node = null;
    this.pickables = [];
    this.player = null;
    this.down = null;
    this.requested = false; // a click was ignored because someone was in the doorway
    this.hint = false;
    this.stepAside = false;
    this.sinceCheck = 0;
    this.raycaster = new AFRAME.THREE.Raycaster();
    this.canvas = null;
  },
  attach({ node, pickables }) {
    this.node = node;
    this.pickables = pickables;
    this.player = this.el.sceneEl.querySelector('[camera]');
    this.canvas = this.el.sceneEl.canvas;
    this.onDown = (e) => {
      if (e.button === 0) this.down = { x: e.clientX, y: e.clientY };
    };
    this.onUp = (e) => {
      if (e.button !== 0) return;
      const down = this.down;
      this.down = null;
      if (isClick(down, { x: e.clientX, y: e.clientY })) this.click(e);
    };
    this.canvas?.addEventListener('pointerdown', this.onDown);
    this.canvas?.addEventListener('pointerup', this.onUp);
  },
  person() {
    const p = this.player.object3D.position;
    return { x: p.x, y: p.y, z: p.z };
  },
  blocked(person) {
    return inDoorway(person, [OPENING, SWING_SPACE]);
  },
  isDoorHit(object) {
    for (let o = object; o; o = o.parent) if (o === this.node) return true;
    return false;
  },
  click(e) {
    if (!this.node || !this.player) return;
    const rect = this.canvas.getBoundingClientRect();
    const ndc = new AFRAME.THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.el.sceneEl.camera);
    const hit = this.raycaster.intersectObjects(this.pickables, true)[0];
    if (!hit || !this.isDoorHit(hit.object)) return; // a wall or an object is in the way (AC-1.4)
    const person = this.person();
    if (distanceToDoor(person, DOOR_BOX, doorAngle(this.door)) > CLICK_RANGE) return; // FR-2
    const result = clickDoor(this.door, { inDoorway: this.blocked(person) });
    this.door = result.door;
    if (result.outcome === 'step-aside') this.requested = true;
  },
  // True when some part of the door can be seen: on screen and the nearest thing along the ray is the door.
  doorInView() {
    const THREE = AFRAME.THREE;
    const camera = this.el.sceneEl.camera;
    const from = camera.getWorldPosition(new THREE.Vector3());
    const spots = [[0.6, 1.05], [0.15, 0.3], [1.05, 0.3], [0.15, 1.8], [1.05, 1.8]];
    for (const [x, y] of spots) {
      const point = this.node.localToWorld(new THREE.Vector3(x, y, 0));
      const ndc = point.clone().project(camera);
      if (Math.abs(ndc.x) > 1 || Math.abs(ndc.y) > 1 || ndc.z > 1) continue;
      const dir = point.clone().sub(from);
      const dist = dir.length();
      this.raycaster.set(from, dir.normalize());
      this.raycaster.far = dist + 0.05;
      const hit = this.raycaster.intersectObjects(this.pickables, true)[0];
      this.raycaster.far = Infinity;
      if (hit && this.isDoorHit(hit.object)) return true;
    }
    return false;
  },
  tick(time, delta) {
    if (!this.node || !this.player) return;
    this.door = stepDoor(this.door, Math.min(delta / 1000, 0.1));
    this.node.rotation.y = doorAngle(this.door);
    const { door, swing } = doorSolids();
    door.off = isFullyOpen(this.door); // only a fully open door lets a person through (FR-4)
    swing.off = isAtRest(this.door);
    this.sinceCheck += delta / 1000;
    if (this.sinceCheck < CHECK_SECONDS) return;
    this.sinceCheck = 0;
    const person = this.person();
    const blocked = this.blocked(person);
    const distance = distanceToDoor(person, DOOR_BOX, doorAngle(this.door));
    const inView = isAtRest(this.door) && distance <= CLICK_RANGE && this.doorInView();
    const hint = hintVisible({ door: this.door, distance, inView, inDoorway: blocked });
    const stepAside = stepAsideVisible({ requested: this.requested, inDoorway: blocked });
    if (!blocked) this.requested = false;
    if (hint !== this.hint) this.el.emit('door-hint', { visible: hint });
    if (stepAside !== this.stepAside) this.el.emit('door-step-aside', { visible: stepAside });
    this.hint = hint;
    this.stepAside = stepAside;
  },
  remove() {
    this.canvas?.removeEventListener('pointerdown', this.onDown);
    this.canvas?.removeEventListener('pointerup', this.onUp);
    resetHouse();
  },
});
```

(Import `resetHouse` as well. `door-hint` and `door-step-aside` events bubble to the scene because A-Frame events bubble by default.)

`buildWorld.js`: return `{ group, updaters, pickables, interior }`, where `pickables = group.children.filter((c) => !c.userData.noPick)`. In `builders/sky.js` and `builders/ground.js` set `userData.noPick = true` on the objects they return (the sky group, the ground mesh, the path mesh).

`scene.js`: add `house-door` on a controller entity in the markup (`<a-entity id="door-controller" house-door></a-entity>`). After `root.setObject3D('world', world.group)`, if the house loaded call `controller.components['house-door'].attach({ node: world.group.getObjectByName('Door'), pickables: [...world.pickables, characterEntity.object3D] })`. Do that after `sceneReady`, because the canvas exists only once the scene has loaded. Forward the events: `sceneEl.addEventListener('door-hint', (e) => callbacks.onDoorHint?.(e.detail.visible))` and the same for `door-step-aside` → `onStepAside`. The new option object of `mountWorld` takes `onDoorHint`, `onStepAside` and (Task 10) `onNotice`. Remove the listeners in `teardown`. Make sure `teardown` calls `resetHouse()` (also keep `resetCharacterSolid()`).

**Step 4:** `npx vitest run` → PASS. Then do a manual smoke check: `npm run dev`, choose Try-out, walk to the door, click it. The door opens outward. (The full judgement is in Task 15.)

**Step 5:** `git add src tests && git commit -m "feat: click the front door to open and close it"`

---

### Task 8: The hint and the step-aside message on screen

**Delivers:** US-3, US-7. FR-7, FR-8, FR-23 (the message area). AC-3.1, AC-3.2, AC-3.3, AC-3.4, AC-3.5.

**Files:**

- Modify: `src/ui/screens.js`, `src/ui/styles.css`, `src/main.js`
- Create: `tests/door-messages.test.js`

Read `BRAND.md` first. Use the dark panel look of `.notice` and `.hint`.

**Step 1: Test**

```js
import { describe, it, expect } from 'vitest';
import { renderWorldOverlay, worldMessages, DOOR_HINT, DOOR_STEP_ASIDE } from '../src/ui/screens.js';

const setup = () => {
  const root = document.createElement('div');
  const overlay = renderWorldOverlay(root, { notice: null, showHint: false, onDismissHint() {}, onBack() {} });
  return { root, messages: worldMessages(overlay) };
};

describe('door messages (FR-7, FR-8)', () => {
  it('shows and hides the door hint, one short sentence (AC-3.1, AC-3.2)', () => {
    const { root, messages } = setup();
    messages.setDoorHint(true);
    expect(root.querySelector('.door-hint').textContent).toBe(DOOR_HINT);
    expect(DOOR_HINT.split('.').filter(Boolean).length).toBe(1);
    messages.setDoorHint(true);
    expect(root.querySelectorAll('.door-hint').length).toBe(1);
    messages.setDoorHint(false);
    expect(root.querySelector('.door-hint')).toBeNull();
  });
  it('shows and hides the step-aside message (AC-3.3, AC-3.5)', () => {
    const { root, messages } = setup();
    messages.setStepAside(true);
    expect(root.querySelector('.door-step').textContent).toBe(DOOR_STEP_ASIDE);
    messages.setStepAside(false);
    expect(root.querySelector('.door-step')).toBeNull();
  });
  it('adds and updates a notice after the overlay is drawn (FR-23)', () => {
    const { root, messages } = setup();
    messages.setNotice('Something failed to load.');
    expect(root.querySelector('.notice').textContent).toBe('Something failed to load.');
    messages.setNotice('');
    expect(root.querySelector('.notice')).toBeNull();
  });
});
```

**Step 2:** FAIL.

**Step 3: Implement.** In `screens.js` export `DOOR_HINT = 'Click the door to open or close it.'` and `DOOR_STEP_ASIDE = 'Step out of the way of the door, then click it again.'` (check both against the wording rules in `BRAND.md`). Export `worldMessages(overlay)` returning `{ setDoorHint(visible), setStepAside(visible), setNotice(text) }`. The hint and the step-aside message are `<p role="status">` elements with the classes `door-hint` and `door-step`, appended to the overlay, created once and removed on hide. `setNotice` reuses the existing `.notice` element (create it if missing, remove it for an empty text). In `styles.css` give `.door-hint` and `.door-step` the same panel rule as `.notice, .hint, .credits`, and place them at the bottom centre: `position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%); max-width: 22rem;`. Do not use the class `hint` (existing tests query `.hint`).

In `main.js` `enterWorld`: keep one local object `live = { hint: false, step: false, notices: [] }` and `ui = null`. Pass `onDoorHint`, `onStepAside` and `onNotice` to `mountWorld`; each updates `live` and, when `ui` exists, calls `ui.setDoorHint(live.hint)`, `ui.setStepAside(live.step)` or `ui.setNotice([notice, mounted.warning, ...live.notices].filter(Boolean).join(' '))`. After `renderWorldOverlay`, set `ui = worldMessages(overlay)` and apply the current `live` values (a late message that arrived before the overlay existed must still show).

**Step 4:** `npx vitest run` → PASS (also `tests/main-flow.test.js` and `tests/loading.test.js`, whose mock `mountWorld` ignores the new options).

**Step 5:** `git add src tests && git commit -m "feat: door hint and step-aside message"`

---

### Task 9: Interior assets, licences and the new download budget

**Delivers:** US-4, US-7. FR-15 (the clip: length, size, no sound), FR-19. NFR-2. AC-4.6, AC-7.3 (budget guard), AC-7.4, AC-7.5, AC-7.6 (the missing-items list).

**Files:**

- Create: `public/assets/interior/*` (models, `tv-still.jpg`, `tv-clip.mp4`)
- Modify: `src/data/licences.js`, `tests/budget.test.js`, `src/world/layout.js` (set `file: null` for any item with no usable model)
- Create: `tests/tv-clip.test.js`, `tests/missing-items.test.js`, `docs/verification/enter-the-house-checklist.md` (the missing-items section only now; the rest comes in Task 14)

This task is partly a sourcing job (A-5: nothing is sourced yet). The tests are the guard.

**Step 1: Source the assets.** Raw downloads go in the git-ignored `/assets/` folder at the repository root, one folder per pack. Check the licence page of each pack and read the licence text before you use it.

- Furniture, kitchen, lamps, TV: first candidate is **Kenney "Furniture Kit"** (kenney.nl, CC0). Look for a sofa, a television, kitchen cabinets, a table, a floor lamp and a ceiling lamp, in GLB. If it lacks one, try Quaternius or Poly Pizza models that are CC0 or CC-BY. Do not use NC, ND or unlicensed models (FR-19).
- TV clip: a calm, slow, looping nature scene, at most 60 s and at most 30 MB, with **no flashes and no sudden brightness changes**. Look for CC0 or CC-BY video (Wikimedia Commons, NASA and Internet Archive public domain items). A stock site is usable only if its licence **explicitly allows use and redistribution**: read it. If you find none, ship the TV with a plain dark screen and list the clip as missing (FR-19).
- Copy the chosen models to `public/assets/interior/` as `couch.glb`, `tv.glb`, `lamp-floor.glb`, `lamp-pendant.glb`, `kitchen.glb`, `dining-table.glb`. If a kit has no kitchen row as one model, use `kitchen.glb` as a combined model made from its cabinet pieces in Blender, or set that item to `file: null` in `INTERIOR_ITEMS`.
- Turn the clip into a silent mp4, then cut one still from it:

```bash
brew install ffmpeg   # once, outside the repo
ffmpeg -i source.mp4 -t 40 -an -vf "scale=1280:-2,fps=24" -c:v libx264 -crf 28 -preset slow -movflags +faststart public/assets/interior/tv-clip.mp4
ffmpeg -ss 5 -i public/assets/interior/tv-clip.mp4 -frames:v 1 -q:v 4 public/assets/interior/tv-still.jpg
ffprobe -v error -show_entries format=duration,size -of default=nw=1 public/assets/interior/tv-clip.mp4
```

  Expected: duration at most 60, size at most 30,000,000. `-an` strips the sound. Watch the whole clip once for flashes.
- For a TV model, measure the screen on the model and set `screen: { w, h, y, z }` of the `tv` item in `layout.js` (metres, in the item's own frame, before the fit scale: the plane sits `z` in front of the screen face). Re-measure if you change the model.

**Step 2: Tests**

`tests/tv-clip.test.js` (node environment). It skips when the clip is not shipped (FR-19 fallback):

```js
// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, statSync } from 'node:fs';

const path = new URL('../public/assets/interior/tv-clip.mp4', import.meta.url).pathname;

// Reads the duration from the 'mvhd' atom of an mp4.
export function mp4Seconds(buf) {
  const at = buf.indexOf('mvhd');
  const v = buf.readUInt8(at + 4);
  const o = at + 4 + 4 + (v === 1 ? 16 : 8);
  return v === 1 ? Number(buf.readBigUInt64BE(o + 4)) / buf.readUInt32BE(o) : buf.readUInt32BE(o + 4) / buf.readUInt32BE(o);
}

describe.skipIf(!existsSync(path))('the TV clip (AC-4.6, FR-15)', () => {
  it('is at most 60 seconds and 30 MB', () => {
    expect(statSync(path).size).toBeLessThanOrEqual(30 * 1024 * 1024);
    expect(mp4Seconds(readFileSync(path))).toBeLessThanOrEqual(60);
  });
  it('has no audio track', () => {
    expect(readFileSync(path).includes('soun')).toBe(false);
  });
});
```

`tests/missing-items.test.js`: every `INTERIOR_ITEMS` entry with `file === null` has its id in the "Missing items" section of `docs/verification/enter-the-house-checklist.md`, and the section exists even when the list is empty (it then says "none"). Also: when `public/assets/interior/tv-clip.mp4` is absent, the id `tv-clip` is listed.

`tests/budget.test.js`: replace the 20 MB test with the new budget (NFR-2 replaces the 30 MB limit of the world-visuals spec: 100 MB compressed for everything):

```js
it('keeps shipped assets at or under 90 MB, so the page, scripts and assets stay under the 100 MB limit', () => {
  expect(total(ROOT)).toBeLessThanOrEqual(90 * 1024 * 1024);
});
```

Rename the `describe` to mention that the 100 MB limit replaces the 30 MB one. Keep the texture test.

**Step 3: Licence records.** In `src/data/licences.js` add one record per source pack for every new file (author, source link, licence text quoted from the pack's licence file or page, `credit`, `checked: '2026-11-09'`). A CC-BY record needs a `credit` line: `tests/licences.test.js` and `tests/credits.test.js` then check it appears in the Credits list. The TV clip and the still share one record (the still comes from the clip). `tests/licences.test.js` also needs a record for every shipped file, so add the records before you copy in the files, or in the same commit.

**Step 4:** `npx vitest run tests/budget.test.js tests/licences.test.js tests/credits.test.js tests/tv-clip.test.js tests/missing-items.test.js` → PASS.

**Step 5:** `git add public/assets/interior src tests docs && git commit -m "feat: interior assets with licence records"`

---

### Task 10: Load the interior after the place is ready, with plain blocks that give way to models

**Delivers:** US-4, US-7. FR-17 (furniture stops the person from the first frame), FR-20, FR-23. AC-4.2, AC-7.6, AC-7.7, AC-7.8, AC-7.10.

**Files:**

- Modify: `src/world/assetLoader.js`, `src/world/manifest.js`, `src/world/scene.js`, `src/world/buildWorld.js`
- Create: `src/world/builders/interior.js`, `src/world/interiorConfig.js`
- Create: `tests/interior.test.js`; modify `tests/assetLoader.test.js`, `tests/manifest.test.js`

**Step 1: Tests**

Add to `tests/assetLoader.test.js`:

```js
import { loadInterior, HOUSE_FAILED_MESSAGE, INTERIOR_FAILED_MESSAGE } from '../src/world/assetLoader.js';

describe('loadInterior (FR-20, FR-23)', () => {
  it('reports each file as it arrives, with no timeout', async () => {
    const seen = [];
    let release;
    const slow = new Promise((r) => (release = r));
    const done = loadInterior(
      [{ id: 'a', type: 'model', url: '/a' }, { id: 'b', type: 'model', url: '/b' }],
      { model: (url) => (url === '/a' ? Promise.resolve('A') : slow) },
      { onItem: (id, v) => seen.push([id, v]) },
    );
    await new Promise((r) => setTimeout(r, 20));
    expect(seen).toEqual([['a', 'A']]); // b is still on its way: nothing gave up on it
    release('B');
    await done;
    expect(seen).toEqual([['a', 'A'], ['b', 'B']]);
  });
  it('reports a failed file through onFail and still loads the rest', async () => {
    const failed = [];
    const seen = [];
    await loadInterior(
      [{ id: 'a', type: 'model', url: '/a' }, { id: 'b', type: 'model', url: '/b' }],
      { model: (url) => (url === '/a' ? Promise.reject(new Error('404')) : Promise.resolve('B')) },
      { onItem: (id) => seen.push(id), onFail: (id) => failed.push(id) },
    );
    expect(failed).toEqual(['a']);
    expect(seen).toEqual(['b']);
  });
  it('ignores files that arrive after the world was torn down', async () => {
    const seen = [];
    await loadInterior([{ id: 'a', type: 'model', url: '/a' }], { model: async () => 'A' }, { onItem: (id) => seen.push(id), isCancelled: () => true });
    expect(seen).toEqual([]);
  });
  it('has one-sentence load messages for the house and for the interior', () => {
    for (const m of [HOUSE_FAILED_MESSAGE, INTERIOR_FAILED_MESSAGE]) expect(m.split('.').filter(Boolean).length).toBe(1);
  });
});
```

`tests/interior.test.js` (three is available in jsdom tests):

```js
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { buildInterior } from '../src/world/builders/interior.js';
import { INTERIOR_ITEMS, SOLIDS } from '../src/world/layout.js';

const model = () => {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.BoxGeometry(2, 1, 1)));
  return g;
};
const find = (root, id) => { let r; root.traverse((o) => { if (o.userData.item === id) r = o; }); return r; };

describe('the interior (FR-20, FR-23)', () => {
  it('starts with a plain block for every item, before any file has arrived (AC-7.8)', () => {
    const { group } = buildInterior(THREE);
    for (const i of INTERIOR_ITEMS) expect(find(group, i.id)?.userData.plain, i.id).toBeTruthy();
  });
  it('blocks walking from the first frame: every solid item has a solid (AC-7.8)', () => {
    for (const i of INTERIOR_ITEMS.filter((x) => x.solid !== false)) expect(SOLIDS.some((s) => s.id === i.id), i.id).toBe(true);
  });
  it('swaps a block for its model when the file arrives, and only that one', () => {
    const { group, replace } = buildInterior(THREE);
    replace('couch', model());
    expect(find(group, 'couch').userData.plain).toBeFalsy();
    expect(find(group, 'tv').userData.plain).toBeTruthy();
  });
  it('fits the model into the footprint of its block', () => {
    const { group, replace } = buildInterior(THREE);
    replace('dining-table', model());
    const box = new THREE.Box3().setFromObject(find(group, 'dining-table'));
    const s = box.getSize(new THREE.Vector3());
    const item = INTERIOR_ITEMS.find((i) => i.id === 'dining-table');
    expect(s.x).toBeLessThanOrEqual(item.w + 1e-6);
    expect(s.z).toBeLessThanOrEqual(item.d + 1e-6);
    expect(s.y).toBeLessThanOrEqual(item.h + 1e-6);
  });
  it('keeps the plain block when a file fails (AC-7.10)', () => {
    const { group, fail } = buildInterior(THREE);
    fail('kitchen');
    expect(find(group, 'kitchen').userData.plain).toBeTruthy();
  });
});
```

Add to `tests/manifest.test.js`: `interiorManifest('clip')` lists a `tv-clip` video and a `tv-still` texture; `interiorManifest('still')` has the still and **no** `tv-clip`; no entry is listed for an item with `file: null`; every listed file exists in `public/` and has a licence record.

**Step 2:** FAIL.

**Step 3: Implement**

`src/world/interiorConfig.js`:

```js
// FR-22: the builder decides this before the interior goes online, from the frame-rate measurement.
// 'clip' plays the TV clip. 'still' shows one still picture and does not load the clip.
// Nothing switches at run time. Change it only after a measurement (see the checklist).
export const TV_MODE = 'clip';
```

`assetLoader.js`: export the two messages and `loadInterior`:

```js
export const HOUSE_FAILED_MESSAGE = 'The house could not be loaded, so it cannot be entered.';
export const INTERIOR_FAILED_MESSAGE = 'Something in the house could not be loaded, so a plain block is shown in its place.';

// Loads each interior file on its own. Never rejects. No timeout: the interior may keep loading after the
// place is ready (FR-20). onItem(id, value) per arrival, onFail(id) per failure (FR-23).
export function loadInterior(manifest, loaders, { onItem, onFail, isCancelled = () => false } = {}) {
  return Promise.all(
    manifest.map((asset) =>
      Promise.resolve()
        .then(() => loaders[asset.type](asset.url))
        .then(
          (value) => { if (!isCancelled()) onItem?.(asset.id, value); },
          () => { if (!isCancelled()) onFail?.(asset.id); },
        ),
    ),
  );
}
```

`manifest.js`: import `TV_MODE` and add

```js
export function interiorManifest(tvMode = TV_MODE) {
  const items = INTERIOR_ITEMS.filter((i) => i.file).map((i) => ({ id: i.id, type: 'model', url: url(i.file) }));
  const seen = new Set();
  const models = items.filter((i) => (seen.has(i.url) ? false : seen.add(i.url)));
  return [
    ...models,
    { id: 'tv-still', type: 'texture', url: url('interior/tv-still.jpg') },
    ...(tvMode === 'clip' ? [{ id: 'tv-clip', type: 'video', url: url('interior/tv-clip.mp4') }] : []),
  ];
}
```

Two pendants share `lamp-pendant.glb`: load the file once (as above) and, on arrival, give a **clone** to every item that uses that file. So `scene.js` maps a loaded file to all items with that `file`. Because a pendant item and a model share a manifest `id`, use the first item's id as the manifest id and look up `INTERIOR_ITEMS.filter((i) => i.file === asset.url-suffix)`. Write that lookup in one small function `itemsForFile(url)` in `manifest.js` and test it.

If the TV clip is not shipped (Task 9 fallback), leave the `tv-clip` line out of the manifest and leave `tv-still` too if there is no still. Drop only what is missing.

`builders/interior.js`:

```js
import { INTERIOR_ITEMS } from '../layout.js';
import { fitToBox } from './common.js';

function block(THREE, item) {
  const g = new THREE.Group();
  g.position.set(item.x, item.y ?? 0, item.z);
  g.userData.item = item.id;
  g.userData.plain = item.id;
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(item.w, item.h, item.d),
    new THREE.MeshStandardMaterial({ color: item.color }),
  );
  m.position.y = item.h / 2;
  g.add(m);
  return g;
}

// A plain block for every item at once. replace(id, scene) swaps one block for its model,
// fitted into the footprint of the block. fail(id) keeps the block (FR-20, FR-23).
export function buildInterior(THREE) {
  const group = new THREE.Group();
  group.userData.kind = 'interior';
  const slots = new Map();
  for (const item of INTERIOR_ITEMS) {
    const b = block(THREE, item);
    slots.set(item.id, b);
    group.add(b);
  }
  return {
    group,
    slots,
    replace(id, scene) {
      const item = INTERIOR_ITEMS.find((i) => i.id === id);
      const old = slots.get(id);
      if (!item || !old) return null;
      const fitted = fitToBox(THREE, scene, item, item.rot ?? 0);
      fitted.position.set(item.x, item.y ?? 0, item.z);
      fitted.userData.item = id;
      group.remove(old);
      group.add(fitted);
      slots.set(id, fitted);
      return fitted;
    },
    fail(id) {
      slots.get(id)?.userData && (slots.get(id).userData.failed = true);
    },
  };
}
```

`buildWorld.js`: when `assets.gltf('house')` is present, create `buildInterior(THREE)`, add its group to the world group and return it as `interior`. When the house is missing, add no interior (FR-21).

`scene.js`:

- `makeLoaders` gets a `video` loader: create a `<video>` with `muted`, `loop`, `playsInline`, `preload = 'auto'`, resolve on `loadeddata`, reject on `error`, set `src` last.
- After `loadAssets`, if `!assets.gltf('house')`: call `useClosedHouse()` and add `HOUSE_FAILED_MESSAGE` to the warning (FR-21). Build the lights only when the house loaded (Task 11).
- After `await sceneReady(...)`, `attach` the door (Task 7), and then **start the interior** if the house loaded: `loadInterior(interiorManifest(), makeLoaders(THREE), { onItem, onFail, isCancelled: () => torn })`. `onItem(id, value)` for a model: `for (const item of itemsForFile(url)) interior.replace(item.id, value.scene.clone(true))`. `onItem` for `tv-still` and `tv-clip` goes to the TV (Task 12). `onFail(id)` calls `interior.fail(...)` for the items of that file and `callbacks.onNotice?.(INTERIOR_FAILED_MESSAGE)`. For `tv-still` and `tv-clip` failures the TV code decides (Task 12).
- Do not `await` the interior: `mountWorld` returns when the place is ready.

**Step 4:** `npx vitest run` → PASS. Then check by hand: `npm run dev`, DevTools Network set to "Slow 4G". Walk to the door before the interior arrives and open it: plain blocks stand where the couch, TV, kitchen and table go, they stop you, and each turns into its model as its file arrives.

**Step 5:** `git add src tests && git commit -m "feat: the interior loads after the place is ready"`

---

### Task 11: Warm lights

**Delivers:** US-4. FR-14. NFR-1 (the light count is kept small). AC-4.3.

**Files:**

- Create: `src/world/lightsMarkup.js`, `tests/lights.test.js`
- Modify: `src/world/scene.js`

**Step 1: Test**

```js
import { describe, it, expect } from 'vitest';
import { lightsMarkup } from '../src/world/lightsMarkup.js';
import { LIGHTS } from '../src/world/layout.js';

describe('warm lights (FR-14, AC-4.3)', () => {
  it('makes one point light per light, in the house', () => {
    const html = lightsMarkup(LIGHTS);
    expect(html.match(/<a-light/g).length).toBe(LIGHTS.length);
    for (const l of LIGHTS) expect(html).toContain(`position="${l.x} ${l.y} ${l.z}"`);
  });
  it('is warm: every colour has red above green above blue', () => {
    for (const l of LIGHTS) {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(l.color.slice(i, i + 2), 16));
      expect(r > g && g > b).toBe(true);
    }
  });
  it('writes only safe values into the markup', () => {
    expect(lightsMarkup([{ id: 'x', x: 0, y: 0, z: 0, color: '"><script>', intensity: 1, distance: 1 }])).toBe('');
  });
});
```

**Step 2:** FAIL.

**Step 3: Implement** `lightsMarkup.js` (no aframe): for each light, accept it only when `color` matches `/^#[0-9a-f]{6}$/i` and `x`, `y`, `z`, `intensity`, `distance` are finite numbers; skip the rest. Output `<a-light type="point" color="…" intensity="…" distance="…" decay="2" position="x y z"></a-light>` per light. In `scene.js`, add `${house ? lightsMarkup(LIGHTS) : ''}` inside the `<a-scene>` markup, where `house` is `Boolean(assets.gltf('house'))`.

Tune by eye: with a point light the intensity numbers in `layout.js` are a starting point. Walk through both rooms. The rooms must glow warmly and look different from the garden. Change `LIGHTS` values only (keep at most 4 lights; FR-22 does not allow dropping lights to save frame rate).

**Step 4:** `npx vitest run tests/lights.test.js tests/house-layout.test.js` → PASS.

**Step 5:** `git add src tests && git commit -m "feat: warm lights in the house"`

---

### Task 12: The TV (calm clip, still fallback, no sound)

**Delivers:** US-4, US-7. FR-15, FR-22, FR-23. AC-4.4, AC-4.5, AC-4.7, AC-4.8, AC-7.2. (AC-4.5 is a judgement on the clip; see Task 15.)

**Files:**

- Create: `src/logic/tv.js`, `tests/tv.test.js`
- Modify: `src/world/builders/interior.js` (TV screen), `src/world/scene.js`

**Step 1: Test**

```js
import { describe, it, expect } from 'vitest';
import { tvSource } from '../src/logic/tv.js';

describe('what the TV screen shows (FR-15, FR-22, FR-23)', () => {
  const ok = { mode: 'clip', clip: 'ready', still: 'ready' };
  it('plays the clip when it loaded and can play', () => {
    expect(tvSource(ok)).toBe('clip');
  });
  it('shows the still when the clip failed to load (AC-4.7)', () => {
    expect(tvSource({ ...ok, clip: 'failed' })).toBe('still');
  });
  it('shows the still when the browser blocks the clip (AC-4.7)', () => {
    expect(tvSource({ ...ok, clip: 'blocked' })).toBe('still');
  });
  it('shows the still, and never the clip, in still mode (FR-22, AC-4.8)', () => {
    expect(tvSource({ ...ok, mode: 'still' })).toBe('still');
    expect(tvSource({ mode: 'still', clip: 'ready', still: 'ready' })).toBe('still');
  });
  it('shows the still while the clip is still loading', () => {
    expect(tvSource({ ...ok, clip: 'loading' })).toBe('still');
  });
  it('shows a plain dark screen when there is no still either', () => {
    expect(tvSource({ ...ok, clip: 'failed', still: 'failed' })).toBe('dark');
    expect(tvSource({ mode: 'still', clip: 'none', still: 'loading' })).toBe('dark');
  });
});
```

**Step 2:** FAIL.

**Step 3: Implement**

```js
// What the TV screen shows. clip: none | loading | ready | blocked | failed. still: loading | ready | failed.
export function tvSource({ mode, clip, still }) {
  if (mode === 'clip' && clip === 'ready') return 'clip';
  return still === 'ready' ? 'still' : 'dark';
}
```

In `builders/interior.js` add `attachTv(THREE, interior)`: when the `tv` model has replaced its block, add a plane (`item.screen.w` × `.h`) at the item's frame (`y` and `z` from `item.screen`), with a `MeshBasicMaterial` (`toneMapped: false`, so lights do not tint it). It holds `state = { clip, still }` and a `setClip(video)`, `setStill(texture)`, `clipBlocked()`, `clipFailed()`; each call updates the state, then picks the source with `tvSource` and sets `material.map` (a `THREE.VideoTexture` of the video for `'clip'`, the still texture for `'still'`) or the dark colour `#101014` for `'dark'`. For the clip call `video.play()`: if it rejects, call `clipBlocked()`. The video stays `muted` (FR-15: no sound). `dispose()` pauses the video, clears `src`, calls `video.load()`, and disposes the textures and geometry. If the TV model arrives after the media, apply the stored state when the screen is created.

In `scene.js`: `onItem('tv-still', texture)` → `tv.setStill(texture)`; `onItem('tv-clip', video)` → `tv.setClip(video)`. `onFail('tv-clip')` → `tv.clipFailed()` and `onNotice(INTERIOR_FAILED_MESSAGE)` (FR-23). `onFail('tv-still')` → `tv.stillFailed()` and the same message. In still mode (`TV_MODE === 'still'`) the clip is not in the manifest, so `state.clip` starts as `'none'` and the TV never plays anything (AC-4.8). Call `tv.dispose()` from `teardown`.

**Step 4:** `npx vitest run` → PASS.

**Step 5:** `git add src tests && git commit -m "feat: a calm TV with a still fallback"`

---

### Task 13: Teardown and privacy guards

**Delivers:** US-6, US-8. FR-6, FR-18. NFR-3. AC-1.9, AC-8.1, AC-8.2.

**Files:**

- Modify: `src/world/scene.js` (teardown), `tests/privacy.test.js`, `tests/teardown.test.js`
- Check: `tests/dispose.test.js` still passes

**Step 1: Tests.** In `tests/privacy.test.js` add a describe that scans the new pure modules for storage and network use:

```js
const LOGIC = new URL('../src/logic', import.meta.url).pathname;
describe('the door and the TV store and send nothing (NFR-3, AC-8.1, AC-8.2)', () => {
  it('keeps storage and the network out of door.js, click.js and tv.js', () => {
    for (const f of ['door.js', 'click.js', 'tv.js']) expect(code(join(LOGIC, f)), f).not.toMatch(FORBIDDEN);
  });
});
```

(The existing world scan already covers every file in `src/world/`, including `components.js`, `builders/interior.js` and `lightsMarkup.js`. It also checks that no `http(s)://` string is hard-coded.)

Add to `tests/layout.test.js` or `tests/house-layout.test.js` a test that `resetHouse()` closes the door again and puts the swing space back off (FR-6, AC-1.9): set `door.off = true`, `swing.off = false`, call `resetHouse()`, expect `door.off === false` and `swing.off === true`; and after `useClosedHouse()` then `resetHouse()` the zone solids are back.

**Step 2:** Run; the new layout test should pass already if Task 1 is right. Fix the code, not the test.

**Step 3:** In `scene.js` `teardown`: call `tv?.dispose()`, `resetHouse()` and `resetCharacterSolid()`, remove the door and step-aside listeners, and make sure `torn = true` is set first so `isCancelled()` is true for late interior files. The `house-door` component's `remove()` already removes the canvas listeners.

**Step 4:** `npx vitest run` → PASS.

**Step 5:** `git add src tests && git commit -m "feat: clean teardown for the door, the TV and late files"`

---

### Task 14: Update the older tests, the notes and the checklist

**Delivers:** US-6. FR-18. NFR-6 (known limitation, written down). AC-6.7 (regression on the older checklists is run in Task 15). Supports AC-7.6 (the missing-items list).

**Files:**

- Modify: `CLAUDE.md`, `tests/smoke.test.js` (if it references the old house), any test that still fails
- Create or complete: `docs/verification/enter-the-house-checklist.md`

**Step 1:** Run `npm test`. Fix every failure that comes from the new layout and the closed door (for example a test that assumes the house is one solid, or that the boundary is 22 m). A test may change when the spec changed that behaviour (the spec lists the changed lines of the world-visuals spec: FR-10, AC-4.2, FR-11, AC-4.3, NFR-2, AC-12.2, G-3, FR-15, FR-16, AC-8.6). Do **not** change `tests/fixtures/phase1-layout.js`. Keep every other check intact.

**Step 2:** Update `CLAUDE.md`:

- The layout line: the house is `WALLS`, a door solid and a swing solid (`off` flag), `INTERIOR_ITEMS` and `LIGHTS`; `HOUSE_BLOCK` stands in when the house fails; `wanderSolids()` keeps the character out; `outsideSolids()` is what the 444.5 m² check measures.
- The house is `public/assets/models/house.glb`, generated by `npm run build:house` from `layout.js`. Reconvert after you change the house numbers, and keep the material names (`tests/house-glb.test.js` guards them).
- The interior loads after the place is ready (`loadInterior`), and `TV_MODE` in `src/world/interiorConfig.js` is the FR-22 switch.
- The 100 MB limit replaces the 30 MB one. Windows are on the outside only. The door state is never stored.

**Step 3:** Write `docs/verification/enter-the-house-checklist.md` in the style of `docs/verification/world-visuals-checklist.md`:

- A **test note** block: laptop (model, chip, RAM), browser and version for Chrome, Firefox and Safari, operating system, date, `TV_MODE` used, measured frame rates.
- Every AC from `AC-1.1` to `AC-8.2` as a yes/no line, quoting the spec text. Mark which ones a unit test covers (name the test file), as the older checklist does.
- A **Missing items** section (the list of items with `file: null`, and `tv-clip` when no clip is shipped; "none" if all are found).
- A **Decision** section for FR-22 and AC-7.12: measured fps with `TV_MODE = 'clip'`, with `'still'`, and the decision.

**Step 4:** `npm run lint && npm run format:check && npm test && npm run build` → all pass.

**Step 5:** `git add CLAUDE.md docs tests && git commit -m "docs: notes and checklist for the enterable house"`

---

### Task 15: The builder's measurements and the go-online gates

**Delivers:** US-1 to US-8 (judgement). NFR-1, NFR-2, NFR-3, NFR-4, NFR-5. FR-18, FR-22. AC-1.4, AC-1.6, AC-1.7, AC-2.3, AC-4.2 to AC-4.5, AC-5.2, AC-5.3, AC-6.2, AC-6.4, AC-6.7, AC-7.1, AC-7.2, AC-7.3, AC-7.7, AC-7.11, AC-7.12, AC-8.1, AC-8.2. This is a manual task for the builder. Write every result in the checklist from Task 14. Nothing here changes the spec.

**Files:** `docs/verification/enter-the-house-checklist.md` only (plus `src/world/interiorConfig.js` if FR-22 applies).

**Step 1: Run the regression checklists** (AC-6.7): go through the start screen, intake, character animations and colours, and walking and looking items of `docs/verification/phase-1-checklist.md` and `docs/verification/world-visuals-checklist.md`. Each must still be met.

**Step 2: Judge the door and the house in Chrome** (Task 7, 10, 11, 12 behaviour): the AC items of groups 1 to 5 in the checklist. Specifically:

- AC-1.4: stand inside the garden, 2 m from the closed door, turn so a wall is between you and the door from the side, click where the door would be: nothing happens.
- AC-1.6 and AC-1.7: record the screen at 30 fps or more (QuickTime or Chrome DevTools). Step through the frames: time the swing (0.5 to 2 s) and the time from click to the first moving frame (under 0.5 s).
- AC-2.3: walk into the swinging door, and click it twice during the swing: it is not reversed.
- AC-4.5: watch one full TV loop: slow, no flashes, no sudden brightness change.
- AC-6.4: walk to each edge of the place and look at the horizon.

**Step 3: Measure the frame rate (NFR-1, AC-7.1).** `npm run build && npx vite preview --port 5188`, open `http://localhost:5188/?stats` in Chrome on your own laptop, choose Try-out. Do a **frame-rate walk**: 2 minutes through the garden, in through the front door, through every room and out. Write down the displayed fps every 10 seconds (12 values) and the average. The average must be at least 30. Name the laptop in the test note.

**Step 4: The FR-22 gate (AC-7.2, AC-7.12).**

- Average at least 30 with `TV_MODE = 'clip'`: ship with the clip.
- Average below 30: set `TV_MODE = 'still'` in `src/world/interiorConfig.js` (the TV shows only the still; lights and furniture stay as designed), rebuild and measure again. Record both numbers. AC-4.4 and AC-4.5 then count as met when AC-4.8 and AC-7.2 are met.
- Still below 30 with `'still'`: **do not merge to `main`**. The interior does not go online until a measurement meets 30 fps (AC-7.12). Record the number and stop.

**Step 5: Measure the first-visit transfer (NFR-2, AC-7.3).** Chrome DevTools, Network tab, **Disable cache** on, load the start screen, choose Try-out, walk into the house and stand there until no new request has come for 10 seconds. The transfer figure in the bottom bar must be at most 100 MB. Write it down.

**Step 6: Slow 4G (AC-7.7).** DevTools Network throttling "Slow 4G", cache disabled, reload, choose Try-out and start a timer: after 30 seconds the loading indicator is gone and the garden and the outside of the house are shown with whatever has loaded. Then check that the interior arrives afterwards (plain blocks first, then models; AC-7.8).

**Step 7: Failure cases (AC-7.9, AC-7.10, AC-4.7).** In DevTools right-click a request, **Block request URL**: `house.glb` (the house is a closed block, a load message shows, no interior, no blank screen), then `couch.glb` (a plain block, you are stopped by it, a load message shows), then `tv-clip.mp4` (the TV shows the still). Also check the TV with autoplay blocked: Chrome site settings, "Sound: Block" does not block muted video, so test by throwing in `video.play()` rejection through the console if you want a hard check.

**Step 8: Privacy (AC-8.1, AC-8.2).** Network tab open for 5 minutes of use that includes opening and closing the door and walking through the house: no request carries a value about the door or about you (only GET, no query strings, no bodies). In Application, Local Storage: compare the keys before and after a visit: no entry about the door or the person has been added (A-Frame's own `debug` key is the known exception from the older measurement).

**Step 9: Browsers (NFR-5, AC-7.11).** In the latest stable Chrome, Firefox and Safari (macOS): open the door, walk in, go through every room and walk out. Record browser versions and the OS in the test note. Frame rate is judged only in Chrome. Test the TV clip in Safari and Firefox in particular (H.264 mp4 autoplay while muted).

**Step 10: Decide.** All items met (or the FR-22 outcome above): merge the branch to `main` (this deploys). Otherwise list what is not met in the checklist and fix before merging.

**Step 11: Commit**

```bash
git add docs/verification src/world/interiorConfig.js
git commit -m "docs: record the measurements for the enterable house"
```

---

## Risks the executor should know

- **Sourcing (A-5).** If no usable free model exists for an item, set its `file: null`, list it in the checklist, and ship the plain block. If no usable clip exists, ship the TV with the still only or a dark screen and list `tv-clip`. The feature still ships (FR-19).
- **GLB generation.** `GLTFExporter` runs in Node with the `FileReader` shim above (checked). If it breaks on a three upgrade, `@gltf-transform/core` is the fallback writer. The tests read only the glTF JSON, so they do not care how it was written.
- **Safari and video.** Muted `autoplay` should work on desktop Safari with `playsInline`. If the clip does not start there, the TV falls back to the still (AC-4.7); record it.
- **Swing space is a square** (D-3), a superset of the quarter disc the door sweeps. A person in the far corner is told to step aside although the door would not touch them. Say so if you want it exact; it costs a sector shape in `walk-limiter`.
- **Frame rate.** Four extra point lights light every surface in the scene, garden included. The lights stay as designed (FR-22 drops the TV only), so measure early, after Task 11, not at the end.

---

## Coverage table

Every ID from the spec and the task that delivers it. "Judged: T15" means a person judges it on the real build in Task 15; the other tasks supply the code and the unit tests. **No gaps.**

### Functional requirements

| ID | Task(s) |
| --- | --- |
| FR-1 | T3, T4, T7 |
| FR-2 | T3, T7 |
| FR-3 | T3, T7 |
| FR-4 | T1, T2, T3, T7 |
| FR-5 | T3, T7 |
| FR-6 | T3, T7, T13 |
| FR-7 | T3, T7, T8 |
| FR-8 | T3, T7, T8 |
| FR-9 | T3, T7 |
| FR-10 | T1, T5 |
| FR-11 | T1, T6 |
| FR-12 | T1, T6 |
| FR-13 | T1 |
| FR-14 | T11 |
| FR-15 | T9, T12 |
| FR-16 | T1, T6 |
| FR-17 | T1, T10 |
| FR-18 | T1, T13, T14, T15 |
| FR-19 | T9 |
| FR-20 | T10 |
| FR-21 | T6, T10 |
| FR-22 | T12, T15 |
| FR-23 | T8, T10, T12 |

### Non-functional requirements

| ID | Task(s) |
| --- | --- |
| NFR-1 | T11 (light budget), T15 (measurement) |
| NFR-2 | T9 (guard), T15 (measurement) |
| NFR-3 | T3, T7, T13, T15 |
| NFR-4 | T3 (first step moves), T7, T15 (recording) |
| NFR-5 | T15 |
| NFR-6 | T14 (written down as a known limitation, no code needed) |

### Acceptance criteria

| ID | Task(s) |
| --- | --- |
| AC-1.1 | T3, T7; judged T15 |
| AC-1.2 | T3, T7; judged T15 |
| AC-1.3 | T3, T7 |
| AC-1.4 | T7; judged T15 |
| AC-1.5 | T3, T7 |
| AC-1.6 | T3; recording T15 |
| AC-1.7 | T3, T7; recording T15 |
| AC-1.8 | T4, T7 |
| AC-1.9 | T3, T13 |
| AC-1.10 | T3, T7; judged T15 |
| AC-2.1 | T1, T2 |
| AC-2.2 | T1, T2 |
| AC-2.3 | T1, T2, T7; judged T15 |
| AC-2.4 | T1 |
| AC-2.5 | T1 |
| AC-2.6 | T1 |
| AC-2.7 | T1 |
| AC-3.1 | T3, T7, T8 |
| AC-3.2 | T3, T7, T8 |
| AC-3.3 | T3, T7, T8 |
| AC-3.4 | T3, T7, T8 |
| AC-3.5 | T3, T7, T8 |
| AC-3.6 | T3, T7 |
| AC-3.7 | T3, T7 |
| AC-4.1 | T1 |
| AC-4.2 | T1, T10; judged T15 |
| AC-4.3 | T11; judged T15 |
| AC-4.4 | T12; judged T15 |
| AC-4.5 | T12; judged T15 |
| AC-4.6 | T9 |
| AC-4.7 | T12; judged T15 |
| AC-4.8 | T12; judged T15 |
| AC-5.1 | T1, T6 |
| AC-5.2 | T6; judged T15 |
| AC-5.3 | T6; judged T15 |
| AC-6.1 | T5; judged T15 |
| AC-6.2 | T5 (unchanged rule, kept by the keep-out list); judged T15 |
| AC-6.3 | T1 |
| AC-6.4 | T1 (ground and fog test); judged T15 |
| AC-6.5 | T1 |
| AC-6.6 | T1 |
| AC-6.7 | T14; judged T15 |
| AC-7.1 | T15 |
| AC-7.2 | T12, T15 |
| AC-7.3 | T9 (guard), T15 |
| AC-7.4 | T9 |
| AC-7.5 | T9 |
| AC-7.6 | T9, T10 |
| AC-7.7 | T10; judged T15 |
| AC-7.8 | T10 |
| AC-7.9 | T6; judged T15 |
| AC-7.10 | T10; judged T15 |
| AC-7.11 | T15 |
| AC-7.12 | T15 |
| AC-8.1 | T13, T15 |
| AC-8.2 | T13, T15 |

### User stories

| ID | Task(s) |
| --- | --- |
| US-1 | T3, T4, T7 |
| US-2 | T1, T2, T7 |
| US-3 | T3, T7, T8 |
| US-4 | T1, T9, T10, T11, T12 |
| US-5 | T1, T6 |
| US-6 | T1, T5, T13, T14 |
| US-7 | T6, T8, T9, T10, T12 |
| US-8 | T7, T13 |

## Addendum: PO review findings (2026-11-09)

The builder (PO) reviewed the running house shell. This pass fixes findings 1, 2, 3, 5, 6 and 8. Findings 4 and 7 (furniture) are in the second table below; later findings come in a later pass. The spec is unchanged. Windows from inside supersede plan decision D-7 (windows on the outside only); no spec text said they had to stay outside.

| Finding | Cause and fix |
| --- | --- |
| 1. Edges of ceiling and walls show outside | The 0.1 m ceiling slab ran the full footprint, so its edges sat in the same planes as the outer wall faces (a light line at 2.5 m). The side walls also overlapped the front and back walls at the corners (shared outer faces, vertical lines). The ceiling, floor and cornice now stay inside the walls, the side walls stop at the front and back walls, and the plaster linings are clipped to the rooms. `tests/house-glb.test.js` checks that no two wall boxes overlap and that nothing indoors reaches the outer faces. Collision solids and `layout.js` are untouched. |
| 2. Door looks like planks | The leaf is now painted (new `Paint` material) with six raised panels and a paler moulding on both faces, a knob on each side, architraves outside and inside, and jamb boards in the opening. The `Door` node origin is still the hinge and the leaf is still 1.2 m wide and 2.1 m high at the top. The foot of the leaf is lifted 0.035 m so it clears the threshold and step. The swing logic is unchanged. |
| 3. No threshold | A wooden threshold (0.03 m) in the front opening, a stone step (0.025 m) outside and a wooden threshold (0.025 m) in the inner doorway. All are 0.03 m or lower, so there is no collision change. |
| 5. Indoor walls plain | New CC0 texture `textures/wallpaper.jpg` (ambientCG Fabric 036, 512 px, 31 KB, record in `src/data/licences.js`, checked 2026-11-09) in `MANIFEST` as `wallpaper`. `builders/house.js` applies it to the `Plaster` material by name, tiled at 0.8 m per repeat from the size of each piece. Without the texture the plain dimmed colour stays (FR-16). |
| 6. Ceiling | The ceiling is white (`CEILING_DIM = 0.65`, set apart from `INTERIOR_DIM` so it reads white under the warm lights and not grey), with a stepped cornice round each room and a frame of shallow beams. It is plain geometry (about 25 boxes), inside the walls, so it is not seen from outside. |
| 8. Windows not visible from inside | The ground-floor garden wall now has real openings (0.8 x 1.0 m at the GLB positions x = -3.3, 1.2, 3.0), with glass in the middle of the wall, mullions, frame and sill outside, and reveal, architrave and sill inside. Upper windows are unchanged (outside only). `WALLS` solids are unchanged, so the glass still blocks walking. |

Other changes:

- New materials `Trim`, `TrimIn` (indoor trim, dimmed by the builder like the plaster), `Paint`, `Metal` and `Stone`. The seven original names remain.
- The model shares one unit cube and scales it per node, so `house.glb` stays small (about 46 KB). The builder reads sizes from the node scale.

### Furniture pass: findings 4 and 7

Chairs and textured furniture go beyond the interior item list of spec v1. FR-17 (solid furniture) and FR-19 (missing items are listed and shown as plain blocks) are applied to the chairs. The textures follow FR-16, FR-20 and FR-23: the flat-colour model stays until the texture arrives and stays for good if it fails.

| Finding | Cause and fix |
| --- | --- |
| 4. Furniture has no textures | The Kenney models are flat-colour and their UVs point into a colour atlas, so a tiling texture cannot use them. `builders/interior.js` (`texturise`) now gives each model part a geometry copy with box-projected UVs, in metres, from `boxProject` in `src/logic/furniture-textures.js` (pure, unit-tested). The part is chosen by material name in `materialSpec`: `wood` and `woodDark` get wood (table, chairs, couch legs, kitchen cabinets), `carpet` on the couch gets fabric tinted with the kit colour. Metal, glass, the lamp shades and the TV keep their flat colours, so the shades still glow. Textures: new CC0 `textures/cabinet.jpg` (ambientCG Wood 049) and `textures/fabric.jpg` (ambientCG Fabric 030), 512 px, 28 KB and 35 KB, records in `src/data/licences.js`. They are in `interiorManifest()`, so they load after the place is ready, like the models. `replace` textures a model at once if its texture is known, and `setTexture` textures the models already in place when it arrives. A failed texture leaves the kit colours and shows the usual interior notice. Colours use `INTERIOR_DIM` (with a gain, as the wallpaper does) so the furniture is not brighter than the walls. The table and chairs use the pale cabinet wood, not `wood.jpg`, because the floor already uses `wood.jpg` and the table vanished into it. |
| 7. Diner table: add 4 chairs | Four new interior items `chair-1` to `chair-4` in `INTERIOR_ITEMS`, one shared file `interior/chair.glb` (Kenney `chair`, CC0, added to the existing Kenney record; `itemsForFile` and clones, as for the pendants). Footprint 0.45 x 0.45, height 0.9, solids from the same list (FR-17), plain blocks first, replace and fail like the others. Two chairs on each long side of the table (z = -7.72 and -6.28, x = 2.0 and 2.8), facing it. A chair at a short end stood on the line from the inner doorway and blocked the existing "walk between the rooms" test, so there is none. Tests: `tests/house-layout.test.js` (four chairs, one file, inside the kitchen room, clear of the table, units, walls, doorway and each other, facing the table, reachability and the closed-door test unchanged), `tests/interior.test.js`, `tests/manifest.test.js`. |
