# A Fenced Garden with a Tiled Path to the Street: Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (or superpowers:subagent-driven-development in the same session) to implement this plan task-by-task.

**Goal:** Fence all four edges of the place, end the path of paving slabs at a closed gate, and draw an unreachable street (tiled sidewalk, curb, road, 3 parked cars, 3 street lamps) beyond it.

**Architecture:** `layout.js` stays the single source of truth. A new pure module (`logic/fenceLine.js`) derives the fence solids and post positions from `BOUNDS` and a `GATE`, so the walkable-area check (FR-12) and collision read the same data that is drawn. A second pure module (`logic/slabs.js`) lays out the 60 by 30 cm slabs; one `InstancedMesh` draws them. The street is data in a new `world/streetLayout.js` and is drawn by a new builder; it has no solids because the person can never reach it.

**Tech Stack:** A-Frame 1.6 / three.js 0.170, Vite 8, Vitest (jsdom), Prettier (single quotes), ESLint 10. Vanilla ES modules. Spec: `specs/garden-fences-and-street/spec.md` (v1). Plans live in `docs/plans/`, checklists in `docs/verification/`.

**Paths:** The app lives in `app/`. Run every command from `app/`; every `src/`, `tests/`, `public/`, `scripts/` path below is relative to `app/`. `specs/` and `docs/` are at the repository root.

---

## Decisions for the three technical questions

**OQ-1: how the slabs are built (A-5).** Each slab is a real object: one `InstancedMesh` of thin boxes (58 by 28 cm tops, 2 cm joints), one instance per slab, on top of a darker underlay plane that shows through the joints. The path (about 108 slabs) and the sidewalk (about 4,800 slabs) are one draw call each. The positions come from the pure function `slabGrid` (Task 4), so "whole slabs along the long sides, partial slabs only at the ends" is a unit test, not an eyeball judgement. A drawn texture pattern was rejected: the joints would blur at distance and the counts could not be tested. Rows are in stack bond (no half-slab stagger), because a stagger would need half slabs along the long sides, which FR-6 forbids.

**OQ-2: how far shadows reach over the street (FR-14).** A new `SHADOW_REGION` (in `streetLayout.js`) is `BOUNDS` with `maxZ` pushed out to the far edge of the road (z = 20). `sky.js` and `shadowFrustum` use it instead of `BOUNDS`. The existing sphere around the origin then holds the whole street for every sun azimuth (radius about 25.6 m instead of 17.9 m, about 2.5 cm per shadow-map texel at 2048, which is enough). The cars and lamps stand within 10 m of the gate, so the lateral extent (x −12..12) already holds them. The existing frustum test is re-pointed at `SHADOW_REGION`, so it fails if the street grows past the box.

**OQ-3: fence line and gate in the layout data (FR-12).** `layout.js` gets `FENCE = { t: 0.2, h: 1, color }` and `GATE = { x: PATH.x, z, w: 1.2 }`. `fenceLine(BOUNDS, FENCE, GATE)` returns six solids of `kind: 'fence'` or `'gate'` (left, right, back, front-left, gate, front-right), each inside `BOUNDS` with its outer face on the edge. They are spread into `SOLIDS` with no `zone`, so `outsideSolids()` already includes them and `walkableArea(outsideSolids(), BOUNDS)` counts their footprint as covered, as FR-12 requires. I measured the new layout before planning: about 462 m², above 444.5, so no edge grows. Task 2 keeps a test that fails if that stops being true, and states the growth rule for the builder.

**Other decisions the spec left to the plan (not behaviour; all reversible):**
- Spawn is at `z = BOUNDS.maxZ - FENCE.t - 2` (2 m from the inner face of the gate), `x = PATH.x`. The camera already looks toward −z, which is the house, so no rotation is needed.
- Street geometry (z from the front edge, which stays at 11): sidewalk 11.0 to 12.8 (top 15 cm, flush with the curb top), curb 12.8 to 13.0 (15 cm high, 20 cm wide), road 13.0 to 20.0 with the centre line at 16.5. The street is 480 m long (x −240..240). The fog ends at 220 m, so the ends are fully fogged from anywhere in the garden (a test checks this). The path is 5 cm high, so there is a small visible step at the gate; the builder judges AC-3.5.
- Street assets load with the existing `MANIFEST`, so the existing one-sentence `failureMessage` (once per load) already satisfies FR-15.
- FR-17 is three build-time constants in `src/world/streetConfig.js` (`STREET_CARS`, `STREET_LAMPS`, `STREET_SHADOWS`). Nothing switches at run time.
- Car and lamp files are not in the repository today (the Downtown City MegaKit has sidewalks and street pieces but no cars or lamps). Tasks 5 and 9 download from the web and need the user's approval first.

---

## Task 1: Fence line and gate as pure data (OQ-3)

**Delivers:** US-1, US-2 · FR-1, FR-2, FR-4, FR-5 · AC-1.4, AC-2.3

**Files:**
- Create: `src/logic/fenceLine.js`
- Test: `tests/fenceLine.test.js`

**Step 1: Write the failing test**

```js
import { describe, it, expect } from 'vitest';
import { fenceLine, fencePosts } from '../src/logic/fenceLine.js';

const B = { minX: -12, maxX: 12, minZ: -11, maxZ: 11 };
const FENCE = { t: 0.2, h: 1, color: '#f2e3c6' };
const GATE = { x: -1.95, w: 1.2 };
const solids = fenceLine(B, FENCE, GATE);
const byId = (id) => solids.find((s) => s.id === id);

describe('fenceLine (FR-1, FR-4, FR-5, AC-1.4)', () => {
  it('makes six solids: left, right, back, two front pieces and the gate', () => {
    expect(solids.map((s) => s.id).sort()).toEqual([
      'fence-back', 'fence-front-left', 'fence-front-right',
      'fence-left', 'fence-right', 'gate',
    ]);
    expect(byId('gate').kind).toBe('gate');
  });
  it('puts the outer face of every fence on the edge and keeps it inside the bounds', () => {
    for (const s of solids) {
      expect(s.x - s.w / 2).toBeGreaterThanOrEqual(B.minX - 1e-9);
      expect(s.x + s.w / 2).toBeLessThanOrEqual(B.maxX + 1e-9);
      expect(s.z - s.d / 2).toBeGreaterThanOrEqual(B.minZ - 1e-9);
      expect(s.z + s.d / 2).toBeLessThanOrEqual(B.maxZ + 1e-9);
    }
    expect(byId('fence-left').x - 0.1).toBeCloseTo(B.minX);
    expect(byId('fence-back').z - 0.1).toBeCloseTo(B.minZ);
    expect(byId('gate').z + 0.1).toBeCloseTo(B.maxZ);
  });
  it('leaves no gap other than the gate: the pieces touch end to end', () => {
    const front = ['fence-front-left', 'gate', 'fence-front-right']
      .map(byId).sort((a, b) => a.x - b.x);
    expect(front[0].x + front[0].w / 2).toBeCloseTo(front[1].x - front[1].w / 2);
    expect(front[1].x + front[1].w / 2).toBeCloseTo(front[2].x - front[2].w / 2);
    expect(front[0].x - front[0].w / 2).toBeCloseTo(B.minX + FENCE.t);
    expect(front[2].x + front[2].w / 2).toBeCloseTo(B.maxX - FENCE.t);
    // the back piece runs between the side fences, so no corner is missing
    const back = byId('fence-back');
    expect(back.x - back.w / 2).toBeCloseTo(B.minX + FENCE.t);
    expect(byId('fence-left').d).toBeCloseTo(B.maxZ - B.minZ);
  });
  it('has a gate of 1.2 m centred on the path x (AC-2.3)', () => {
    expect(byId('gate').w).toBeCloseTo(1.2);
    expect(byId('gate').x).toBeCloseTo(GATE.x);
  });
});

describe('fencePosts (FR-2, FR-4)', () => {
  it('puts posts about every metre, the first and last inset 6 cm from the ends', () => {
    const posts = fencePosts(byId('fence-left'));
    expect(posts[0]).toBeCloseTo(-11 + 0.06);
    for (let i = 1; i < posts.length; i++) {
      const gap = posts[i] - posts[i - 1];
      expect(gap).toBeLessThanOrEqual(1.0 + 1e-9);
      expect(gap).toBeGreaterThan(0.9);
    }
  });
  it('leaves exactly 1.2 m clear between the two gate posts', () => {
    const l = byId('fence-front-left');
    const r = byId('fence-front-right');
    const leftEnd = l.x + fencePosts(l).slice(-1)[0] * 0 + (l.w / 2 - 0.06);
    const rightStart = r.x - (r.w / 2 - 0.06);
    // post faces are 0.06 further in than the post centres
    expect(rightStart - 0.06 - (leftEnd + 0.06)).toBeCloseTo(1.2);
  });
});
```

**Step 2: Run it** — `npx vitest run tests/fenceLine.test.js` — expect FAIL (module missing).

**Step 3: Implement**

```js
// Pure: the fence along the edge of the place, as solids and post positions. No three, no DOM.
// The outer face of every piece is on the edge; the pieces touch end to end; the front is split by the gate.
const POST = 0.12;

export function fenceLine(bounds, { t, h, color }, gate) {
  const { minX, maxX, minZ, maxZ } = bounds;
  const cz = (minZ + maxZ) / 2;
  const innerLo = minX + t;
  const innerHi = maxX - t;
  const frontZ = maxZ - t / 2;
  const gl = gate.x - gate.w / 2;
  const gh = gate.x + gate.w / 2;
  const piece = (id, x, z, w, d, kind = 'fence') => ({ id, kind, x, z, w, d, h, color });
  return [
    piece('fence-left', minX + t / 2, cz, t, maxZ - minZ),
    piece('fence-right', maxX - t / 2, cz, t, maxZ - minZ),
    piece('fence-back', (innerLo + innerHi) / 2, minZ + t / 2, innerHi - innerLo, t),
    piece('fence-front-left', (innerLo + gl) / 2, frontZ, gl - innerLo, t),
    piece('gate', gate.x, frontZ, gate.w, t, 'gate'),
    piece('fence-front-right', (gh + innerHi) / 2, frontZ, innerHi - gh, t),
  ];
}

// Post centres along the long side of a piece, relative to the piece centre. The first and last post are
// inset by half a post so that the end faces line up with the piece ends; the gap is at most 1 m.
export function fencePosts(piece) {
  const length = Math.max(piece.w, piece.d);
  const span = length - POST;
  const gaps = Math.max(1, Math.ceil(span - 1e-9));
  return Array.from({ length: gaps + 1 }, (_, i) => -span / 2 + (i * span) / gaps);
}
```

Note the first post expected at `-length/2 + 0.06`, which equals `-span/2`. If the test's gate-post line is hard to read, simplify it to compare the two inner post faces; the point is 1.2 m clear.

**Step 4: Run it** — expect PASS. **Step 5: Commit** — `git commit -m "feat: fence line and gate as pure data"`.

---

## Task 2: Put the fence line, 1.2 m path and new spawn in the layout (OQ-3)

**Delivers:** US-1, US-3, US-5 · FR-1, FR-2, FR-3, FR-5, FR-7, FR-12, FR-13 · AC-1.2, AC-1.3, AC-1.4, AC-1.6, AC-2.2, AC-3.3, AC-3.4, AC-4.7, AC-5.1, AC-5.2, AC-5.3, AC-5.5

**Files:**
- Modify: `src/world/layout.js` (`SPAWN` line 2, `PATH` line 59, the two `fence-*` solids at lines 331-350)
- Test: `tests/garden-layout.test.js` (new); fix `tests/layout.test.js`, `tests/house-layout.test.js`, `tests/collision.test.js` where they now fail

**Step 1: Write the failing tests** (`tests/garden-layout.test.js`)

```js
import { describe, it, expect } from 'vitest';
import { BOUNDS, SOLIDS, SPAWN, PATH, DOOR, GATE, FENCE, CHARACTER_SPOT, outsideSolids, wanderSolids } from '../src/world/layout.js';
import { walkableArea, reachesWithin } from '../src/logic/walkable.js';
import { hitsSolid, resolveMove } from '../src/logic/collision.js';
import { initialState, stepWander } from '../src/logic/wander.js';

const fences = () => SOLIDS.filter((s) => s.kind === 'fence' || s.kind === 'gate');

describe('the fence line in the layout (AC-1.4)', () => {
  it('follows the four edges and no fence stands inside the garden', () => {
    expect(fences().map((s) => s.id).sort()).toEqual([
      'fence-back', 'fence-front-left', 'fence-front-right', 'fence-left', 'fence-right', 'gate',
    ]);
    expect(SOLIDS.some((s) => s.id === 'fence-left' && Math.abs(s.x) < 11)).toBe(false);
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
    const into = (from, to) => resolveMove(from, to, SOLIDS, BOUNDS);
    // every metre along the left, right, back and front edges, away from the gate
    for (let t = -10; t <= 10; t += 1) {
      const l = into({ x: -10, z: t }, { x: -13, z: t });
      expect(hitsSolid(l.x - 0.2, l.z, fences(), 0.3), `left z=${t}`).toBe(true);
      const r = into({ x: 10, z: t }, { x: 13, z: t });
      expect(hitsSolid(r.x + 0.2, r.z, fences(), 0.3), `right z=${t}`).toBe(true);
    }
    for (let x = -10; x <= 10; x += 1) {
      const b = into({ x, z: -9 }, { x, z: -13 });
      expect(hitsSolid(b.x, b.z - 0.2, fences(), 0.3), `back x=${x}`).toBe(true);
      const f = into({ x, z: 9 }, { x, z: 13 });
      expect(hitsSolid(f.x, f.z + 0.2, fences(), 0.3), `front x=${x}`).toBe(true);
    }
  });
  it('stops a walk into the closed gate (AC-2.2)', () => {
    const r = resolveMove({ x: PATH.x, z: 9 }, { x: PATH.x, z: 13 }, SOLIDS, BOUNDS);
    expect(r.z).toBeLessThan(BOUNDS.maxZ - FENCE.t);
  });
});

describe('what stays as before (FR-3, FR-12, FR-13)', () => {
  it('leaves at least the phase 1 walkable area of 444.5 m2 with the fence counted as covered (AC-5.1)', () => {
    expect(walkableArea(outsideSolids(), BOUNDS)).toBeGreaterThanOrEqual(444.5);
  });
  it('does not cover the path, its extension or the spawn with a garden object (AC-1.6)', () => {
    const lane = { x: PATH.x, z: (DOOR.z + BOUNDS.maxZ) / 2, w: PATH.w, d: BOUNDS.maxZ - DOOR.z };
    for (const s of SOLIDS.filter((s) => !s.zone && s.kind !== 'fence' && s.kind !== 'gate' && s.kind !== 'character')) {
      const overlaps = Math.abs(s.x - lane.x) < (s.w + lane.w) / 2 && Math.abs(s.z - lane.z) < (s.d + lane.d) / 2;
      expect(overlaps, s.id).toBe(false);
    }
  });
  it('keeps every garden object clear of the fence line, none removed (AC-1.6)', () => {
    const ids = SOLIDS.filter((s) => !s.zone).map((s) => s.id);
    for (const id of ['bench', 'table', 'planter', 'bush-1', 'bush-2', 'bush-3', 'hedge-1', 'character'])
      expect(ids).toContain(id);
    for (let n = 1; n <= 6; n++) expect(ids).toContain(`tree-${n}`);
    for (const s of SOLIDS.filter((s) => !s.zone && !['fence', 'gate'].includes(s.kind))) {
      expect(s.x - s.w / 2).toBeGreaterThanOrEqual(BOUNDS.minX + FENCE.t);
      expect(s.x + s.w / 2).toBeLessThanOrEqual(BOUNDS.maxX - FENCE.t);
      expect(s.z - s.d / 2).toBeGreaterThanOrEqual(BOUNDS.minZ + FENCE.t);
      expect(s.z + s.d / 2).toBeLessThanOrEqual(BOUNDS.maxZ - FENCE.t);
    }
  });
});

describe('the start spot (FR-13, AC-5.5)', () => {
  it('is on the path 2 m inside the gate, free, reachable and faces the house', () => {
    expect(SPAWN.x).toBeCloseTo(PATH.x);
    expect(BOUNDS.maxZ - FENCE.t - SPAWN.z).toBeCloseTo(2);
    expect(hitsSolid(SPAWN.x, SPAWN.z, SOLIDS, 0.3)).toBe(false);
    expect(SPAWN.z).toBeGreaterThan(-7.5); // the house is at -z; A-Frame's camera looks toward -z
    expect(reachesWithin(SPAWN, CHARACTER_SPOT, 1.2, SOLIDS, BOUNDS)).toBe(true);
  });
});

describe('the character stays inside the fence (AC-5.3)', () => {
  it('wanders for 5 minutes without leaving the garden', () => {
    // Mirror the call used in tests/wander.test.js (same state, same step size, solids = wanderSolids()).
    // Assert every position is inside minX+t .. maxX-t and minZ+t .. maxZ-t.
  });
});
```

For the last test, copy the loop from `tests/wander.test.js` (it already simulates wandering; use `wanderSolids()` and `BOUNDS`, 5 minutes at the same time step) and assert the bounds above. Do not invent a new API.

**Step 2: Run** — `npx vitest run tests/garden-layout.test.js` — expect FAIL (`GATE`, `FENCE` not exported).

**Step 3: Change `layout.js`**
- Add `import { fenceLine } from '../logic/fenceLine.js';` at the top.
- `export const FENCE = { t: 0.2, h: 1, color: '#f2e3c6' };`
- `PATH` becomes `{ x: DOOR.x, z0: DOOR.z, z1: BOUNDS.maxZ, w: 1.2 }`.
- `export const GATE = { x: PATH.x, w: 1.2 };` (define after `PATH`).
- `SPAWN` becomes `{ x: DOOR.x, z: BOUNDS.maxZ - FENCE.t - 2 }`. It is defined at line 2 before `DOOR`: move `SPAWN` below `PATH`, or compute from literals (`x: -1.95, z: 8.8`) with a test that ties it to `DOOR.x`. Prefer moving it.
- Delete the `fence-left` and `fence-right` objects from `SOLIDS` and add `...fenceLine(BOUNDS, FENCE, GATE),` as the first entries. Leave the other solids where they are: the test above shows none overlaps the fence line or the path. If a test goes red on an object, apply FR-3 (smallest move inward or sideways, never onto another solid, the path or a start spot), and write the object, its old and new position in `docs/verification/garden-fences-and-street-checklist.md` (Task 13).
- Update the comment on `SOLIDS` (kind list: add `gate`).

**Step 4: Fix the older tests that now fail on purpose** (the three cases AC-5.6 names): `tests/layout.test.js` "has a walkable path from the street to the door" (start the loop at the gate's inner face minus 0.35 instead of `PATH.z1`), "starts the person in free space in the street" (rename to "on the path inside the gate"), `tests/collision.test.js` and `tests/house-layout.test.js` where they assume `fence-left`/`fence-right`, a 1.4 m path or `SPAWN.z = 6`. Change only what the spec changed; do not loosen anything else. Run `npm test` and expect every remaining failure to come from those three changes.

**Step 5: Area rule (FR-12).** The test in Step 1 passes today (about 462 m²). If it ever fails, the rule is: move `BOUNDS.minX`, `maxX`, `minZ` outward (never `maxZ`) in 1 m steps until it passes. The shadow test of Task 11 and the ground test of Task 8 then follow `BOUNDS` on their own.

**Step 6: Run** `npm test && npm run lint && npm run format:check` — expect PASS. **Commit** — `git commit -m "feat: fence line at the edge, 1.2 m path to a gate, spawn on the path"`.

---

## Task 3: Draw the fence line and the gate

**Delivers:** US-1, US-2 · FR-2, FR-4 · AC-1.5, AC-2.1, AC-2.2

**Files:**
- Modify: `src/world/builders/furniture.js` (`buildFence`, lines 8-33), `src/world/buildWorld.js` (`BUILDERS`)
- Create: `src/world/builders/gate.js`
- Test: `tests/builders-furniture.test.js` (extend), `tests/builders-gate.test.js`

**Step 1: Write the failing tests.** `buildFence` for a `fenceLine` piece has one post per `fencePosts(piece)` entry and two rails; every post is 1 m high (`solid.h`) and every material colour equals the solid's colour when the wood texture is missing (use the `assets` stub already in `tests/builders-furniture.test.js`). `buildGate` returns a group with `userData.kind = 'gate'`, two posts whose inner faces are 1.2 m apart, two rails and one diagonal brace (so it reads as a gate), all 1 m high or lower. Neither group has `userData.noPick` set to false anywhere that would make it respond to a click: the click handler in `house-door` only acts on the `Door` node, so check that `pickables` still works by asserting `buildGate(...).userData.noPick === true` (clicks pass through; AC-2.2).

**Step 2: Run** — expect FAIL.

**Step 3: Implement.** In `buildFence` replace the `posts`/`t` loop by `for (const t of fencePosts(solid))` (import from `../../logic/fenceLine.js`); rails stay `length` long. `buildGate(THREE, assets, solid)` (new file) places two posts at `±(solid.w / 2 + 0.06)`, two rails of length `solid.w + 0.24` at the same heights as the fence rails, and a diagonal brace `box` rotated about z by `atan2(h*0.4, solid.w)`. Use the same `wood` surface and `solid.color`. Register `gate: buildGate` in `BUILDERS` in `buildWorld.js`. The fence pieces end 6 cm after their end post, and the gate posts stand in the opening's neighbour pieces, so draw the gate posts only if they do not duplicate the piece's end posts: since the end posts of `fence-front-left` and `-right` are the gate posts (Task 1 test), `buildGate` draws only rails and brace, and the post faces are 1.2 m apart because of the pieces. Adjust the Step 1 test to match (rails and brace only; width of the rails equals the opening).

**Step 4: Run** `npx vitest run tests/builders-furniture.test.js tests/builders-gate.test.js` — PASS. **Step 5: Look at it** — `npm run dev`, walk to each edge and to the gate; the look must match the old fence (AC-1.5). **Commit** — `git commit -m "feat: draw the fence line and a closed gate"`.

---

## Task 4: Slab layout as pure data (OQ-1)

**Delivers:** US-3 · FR-6, FR-8 · AC-3.2, AC-3.6

**Files:**
- Create: `src/logic/slabs.js`
- Test: `tests/slabs.test.js`

**Step 1: Write the failing test**

```js
import { describe, it, expect } from 'vitest';
import { slabGrid, SLAB } from '../src/logic/slabs.js';

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
    expect(g.slabs.every((s) => s.l === SLAB.along && s.w === SLAB.across)).toBe(true);
  });
  it('refuses a width that is not a whole number of slabs', () => {
    expect(() => slabGrid({ width: 1.4, length: 5 })).toThrow();
  });
  it('centres the slabs across the width and starts the rows at y = 0', () => {
    const g = slabGrid({ width: 1.2, length: 0.6 });
    expect(g.slabs.map((s) => s.x).sort()).toEqual([-0.3, -0.3, 0.3, 0.3]);
    expect(g.slabs.map((s) => s.y).sort()).toEqual([0.15, 0.15, 0.45, 0.45]);
  });
});
```

**Step 2: Run** — FAIL. **Step 3: Implement**

```js
// Pure: where each paving slab goes. Local coordinates: x across the width (centred), y along the
// length from 0. Slabs are 60 cm across and 30 cm along, in stack bond. Whole slabs fill the width;
// only the last row can be partial (the end of the strip).
export const SLAB = { across: 0.6, along: 0.3, joint: 0.02 };

export function slabGrid({ width, length, slab = SLAB }) {
  const across = Math.round(width / slab.across);
  if (Math.abs(across * slab.across - width) > 1e-9)
    throw new Error(`width ${width} is not a whole number of slabs`);
  const rows = Math.ceil(length / slab.along - 1e-9);
  const slabs = [];
  for (let r = 0; r < rows; r++) {
    const y0 = r * slab.along;
    const l = Math.min(slab.along, length - y0);
    for (let c = 0; c < across; c++)
      slabs.push({
        x: -width / 2 + (c + 0.5) * slab.across,
        y: y0 + l / 2,
        w: slab.across,
        l,
      });
  }
  return { across, rows, slabs };
}
```

Floating point: `length - y0` for whole rows can differ from 0.3 by 1e-15. Round `l` to 1e-9 (`Math.round(l * 1e9) / 1e9`) so the equality tests hold.

**Step 4: Run** — PASS. **Commit** — `git commit -m "feat: slab layout as pure data"`.

---

## Task 5: Source and prepare the paving and asphalt textures (licences, A-3)

**Delivers:** US-6 · FR-16 · AC-6.5, AC-6.6 (for any CC-BY texture), AC-6.7 (texture part), AC-6.8

**This task downloads from the web. Stop and ask the user for approval before downloading.** A subagent may not be allowed to; the controller asks first.

**Files:**
- Create: `public/assets/textures/paving.jpg`, `public/assets/textures/asphalt.jpg`
- Modify: `src/data/licences.js` (one record each), `src/world/manifest.js` (two `MANIFEST` entries), `scripts/prepare-texture.mjs` only if its arguments need extending
- Test: existing `tests/licences.test.js`, `tests/credits.test.js`, `tests/budget.test.js` (they cover the new records automatically)

**Step 1: Source.** Try ambientCG first (CC0, same source as grass, path and fabric): a paving-stone set with clear rectangular joints for `paving`, and an asphalt for `asphalt`. Read the licence text on the page and copy the author, source link and exact licence text into the records. A CC-BY texture needs a `credit` line (the Credits list on the start page shows it). Resize with `scripts/prepare-texture.mjs` to 512 by 512 JPEG (the existing textures are). If nothing usable is found for one of them, do not add it: the builder (Task 6, 8) already falls back to a plain colour, and the item goes on the "Missing items" list in Task 13 with what was tried.

**Step 2: Records.** Add to `ASSET_RECORDS` in the same shape as the `textures/path.jpg` record, with `checked: '2026-11-09'`.

**Step 3: Manifest.** Add `{ id: 'paving', type: 'texture', url: url('textures/paving.jpg') }` and the same for `asphalt` to `MANIFEST`.

**Step 4: Run** `npx vitest run tests/licences.test.js tests/credits.test.js tests/budget.test.js tests/manifest.test.js` — PASS (fix `manifest.test.js` counts if it pins the number of entries). **Commit** — `git commit -m "feat: paving and asphalt textures with licence records"`.

---

## Task 6: Draw the path as slabs (OQ-1)

**Delivers:** US-3 · FR-6, FR-7, FR-14 · AC-3.1, AC-3.5, AC-6.11

**Files:**
- Create: `src/world/builders/slabs.js`
- Modify: `src/world/builders/ground.js` (`buildPath`), `src/world/builders/shadows.js` (rule for `slab`)
- Test: `tests/builders-slabs.test.js`; update `tests/builders-sky-ground.test.js` for the new `buildPath`

**Step 1: Write the failing test.** With a stub `assets` that has no textures: `buildSlabs(THREE, assets, { width: 1.2, length: 16, texture: 'paving', fallback: '#b9b3a8', kind: 'slab' })` returns a group whose first mesh is the underlay plane (1.2 by 16) and whose second is an `InstancedMesh` with `count === 108`; each instance matrix puts a slab inside the strip; the group has `userData.kind === 'slab'`; with a texture present the material has a `map`. `buildPath(THREE, assets)` returns the group positioned so the strip runs from `z = PATH.z1` (gate end, whole slabs) back to `PATH.z0` (door end, the partial row), centred on `PATH.x`, at y 0.02 for the underlay and 0.05 for the slab tops.

**Step 2: Run** — FAIL.

**Step 3: Implement `buildSlabs`.**

```js
import { slabGrid, SLAB } from '../../logic/slabs.js';
import { surface, hash } from './common.js';

// One InstancedMesh of thin boxes on a darker underlay that shows in the joints. Local x runs across the
// strip and local z along it, from the start end (z = 0) to the far end. The caller places and turns the group.
export function buildSlabs(THREE, assets, { width, length, texture, fallback, kind, top = 0.05, tint }) {
  const { slabs } = slabGrid({ width, length });
  const g = new THREE.Group();
  g.userData.kind = kind;
  const under = new THREE.Mesh(
    new THREE.PlaneGeometry(width, length),
    new THREE.MeshStandardMaterial({ color: '#6f6a62', roughness: 1 }),
  );
  under.rotation.x = -Math.PI / 2;
  under.position.set(0, top - 0.035, length / 2);
  g.add(under);
  const geo = new THREE.BoxGeometry(1, 0.04, 1); // scaled per instance
  const mesh = new THREE.InstancedMesh(geo, surface(THREE, assets, texture, fallback, { tint }), slabs.length);
  const m = new THREE.Matrix4();
  const colour = new THREE.Color();
  slabs.forEach((s, i) => {
    m.compose(
      new THREE.Vector3(s.x, top - 0.02, s.y),
      new THREE.Quaternion(),
      new THREE.Vector3(s.w - SLAB.joint, 1, s.l - SLAB.joint),
    );
    mesh.setMatrixAt(i, m);
    // A small brightness change per slab so the slabs read as separate pieces.
    mesh.setColorAt(i, colour.setScalar(0.92 + 0.08 * hash(`${kind}${i}`)));
  });
  mesh.instanceMatrix.needsUpdate = true;
  g.add(mesh);
  return g;
}
```

A partial slab (`s.l = 0.1`) minus the joint is 8 cm: fine. `buildPath` now builds the slabs, rotates the group so local +z points to −z world (`rotation.y = Math.PI`) and puts it at `(PATH.x, 0, PATH.z1)`, so row 0 is at the gate and the partial row is at the door. Keep `userData.noPick = true` and `kind = 'slab'`. In `SHADOW_RULES` add `slab: { cast: true, receive: true }` and remove `path` after checking nothing else sets that kind (grep `'path'`).

**Step 4: Run** — PASS. **Step 5: Look at it** in the browser: stand on the path and look along it; slabs and joints must read (AC-3.1). **Commit** — `git commit -m "feat: draw the path as paving slabs"`.

---

## Task 7: Street layout data

**Delivers:** US-4 · FR-8, FR-9, FR-10 · AC-4.2, AC-4.4, AC-4.7

**Files:**
- Create: `src/world/streetConfig.js`, `src/world/streetLayout.js`
- Test: `tests/street-layout.test.js`

**Step 1: Write the failing test.** Using `STREET`, `CARS`, `LAMPS`, `GATE` and `BOUNDS`:
- `STREET.sidewalk.w === 1.8` and `z0 === BOUNDS.maxZ` (A-8: it starts at the fence), `STREET.curb.h === 0.15`, `STREET.road.w === 7`, `STREET.road.z0 === sidewalk.z0 + 1.8 + curb.w`, and `STREET.centreLineZ` is the middle of the road.
- `STREET.length / 2 - 12 >= FOG.far` (the ends of the street are inside the fog from anywhere in the garden; AC-4.3) and the ground is larger than the street (`GROUND_SIZE / 2 > STREET.length / 2` and `GROUND_SIZE / 2 > STREET.road.z1 + FOG.far`? use the same check as the "keeps the ground, sky and fog beyond the new boundary" test in `tests/house-layout.test.js`).
- `CARS.length === STREET_CARS` (3 by default), `LAMPS.length === STREET_LAMPS` (3); every car and lamp has `|x - GATE.x| <= 10`; cars stand on the road next to the curb (`z` between `road.z0` and `road.z0 + 3`); lamps stand on the sidewalk (`z` between `sidewalk.z0` and `sidewalk.z1`); no two cars overlap (distance along x at least the car length plus 0.5 m).
- None of `CARS`, `LAMPS` is in `SOLIDS` (nothing in the street can stop or be reached; AC-4.7). `BOUNDS.maxZ` is unchanged and the street starts at it.
- `STREET_CARS >= 1`, `STREET_LAMPS >= 1`, and `STREET_SHADOWS` is `'on'` or `'off'` (FR-17 floor).

**Step 2: Run** — FAIL.

**Step 3: Implement.**

`src/world/streetConfig.js`:

```js
// Build-time switches for the frame-rate rule (FR-17). Nothing changes at run time.
// If the 2-minute walk misses 30 fps: lower STREET_CARS and STREET_LAMPS first (never below 1),
// then set STREET_SHADOWS to 'off'. Write the decision in the checklist (AC-6.2).
export const STREET_CARS = 3;
export const STREET_LAMPS = 3;
export const STREET_SHADOWS = 'on';
```

`src/world/streetLayout.js` (numbers are the starting point; tune by eye, the test keeps the rules):

```js
import { BOUNDS, GATE } from './layout.js';
import { STREET_CARS, STREET_LAMPS } from './streetConfig.js';

const z0 = BOUNDS.maxZ; // the sidewalk starts at the outer face of the front fence (A-8)
const SIDEWALK = { z0, w: 1.8, top: 0.15 };
const CURB = { z0: z0 + 1.8, w: 0.2, h: 0.15 };
const ROAD = { z0: CURB.z0 + CURB.w, w: 7 };
ROAD.z1 = ROAD.z0 + ROAD.w;
export const STREET = {
  length: 480, // x from -240 to 240: fully fogged at both ends from anywhere in the garden
  sidewalk: { ...SIDEWALK, z1: z0 + 1.8 },
  curb: { ...CURB, z1: CURB.z0 + CURB.w },
  road: ROAD,
  centreLineZ: ROAD.z0 + ROAD.w / 2,
};

const ALL_CARS = [
  { id: 'car-1', x: GATE.x - 7, w: 4.2, d: 1.8, h: 1.4, rot: 0, color: '#9aa7b8' },
  { id: 'car-2', x: GATE.x - 0.5, w: 4.2, d: 1.8, h: 1.4, rot: 0, color: '#b86b5a' },
  { id: 'car-3', x: GATE.x + 6.5, w: 4.2, d: 1.8, h: 1.4, rot: 0, color: '#d8c98a' },
].map((c) => ({ ...c, z: ROAD.z0 + 0.15 + c.d / 2, kind: 'car' }));
const ALL_LAMPS = [GATE.x - 6, GATE.x + 1, GATE.x + 7].map((x, i) => ({
  id: `lamp-${i + 1}`, kind: 'lamp', x, z: STREET_SIDEWALK_Z(), w: 0.25, d: 0.25, h: 4.5, color: '#3d4148',
}));
function STREET_SIDEWALK_Z() { return SIDEWALK.z0 + 1.8 - 0.35; }
export const CARS = ALL_CARS.slice(0, STREET_CARS);
export const LAMPS = ALL_LAMPS.slice(0, STREET_LAMPS);

// The sun's shadow box must hold the whole street (OQ-2).
export const SHADOW_REGION = { ...BOUNDS, maxZ: ROAD.z1 + 0.5 };
```

Rename `STREET_SIDEWALK_Z` to a plain constant before committing (the sketch uses a function only to keep the example short). Car ids are `car-1`..`car-3` and the lamp ids use one shared model id `lamp`; the asset ids are set in Task 10.

**Step 4: Run** — PASS. **Commit** — `git commit -m "feat: street layout data and build-time switches"`.

---

## Task 8: Draw the sidewalk, curb, road and centre line

**Delivers:** US-4 · FR-8, FR-10, FR-11, FR-14 · AC-3.5, AC-3.6, AC-4.1, AC-4.3, AC-4.8, AC-6.11

**Files:**
- Create: `src/world/builders/street.js`
- Modify: `src/world/buildWorld.js`, `src/world/builders/shadows.js`
- Test: `tests/builders-street.test.js`

**Step 1: Write the failing test.** With a stub `assets` without textures: `buildStreet(THREE, assets)` returns a group (`userData.kind = 'street'`, `noPick = true`) holding: a slab strip of 1.8 by 480 (3 whole slabs across, from `buildSlabs`), a curb box 15 cm high spanning the length, a road plane 7 m wide, and a centre line made of dashes. Check the sizes against `STREET`. With no textures, every material has a plain colour (AC-6.11). The group places the sidewalk at `z = STREET.sidewalk.z0..z1`, rotated so local z runs along world x (`rotation.y = Math.PI / 2`, positioned at `x = -STREET.length / 2`). `buildWorld(THREE, assets, colours)` includes the street group, and still builds with an empty `assets`.

**Step 2: Run** — FAIL.

**Step 3: Implement.** `buildStreet`: (1) the sidewalk via `buildSlabs({ width: 1.8, length: STREET.length, texture: 'paving', fallback: '#b9b3a8', kind: 'street-slab', top: STREET.sidewalk.top })`; (2) a raised platform box under it (height `sidewalk.top - 0.04`, same footprint, concrete colour) so the sidewalk is not floating; (3) the curb: a box `STREET.curb.w` by `STREET.curb.h`, `kind: 'curb'`, textured with `surface(THREE, assets, 'paving', '#c4c0b8', { repeat: [STREET.length / 0.6, 1] })` (the curb texture is the paving asset; no extra file); (4) the road: a plane 480 by 7 at y 0.01 with `surface(..., 'asphalt', '#4a4d52', { repeat: [STREET.length / 4, 7 / 4] })`, `kind: 'road'`; (5) the centre line: one `InstancedMesh` of white dashes 3 m long and 0.12 m wide with 3 m gaps, `kind: 'road'`, at y 0.02. Mark the whole group `kind: 'street'` and the parts with the kinds above (`applyShadows` uses the nearest kind). `buildWorld` adds `buildStreet(THREE, assets)` after `buildPath`. In `SHADOW_RULES`: `'street-slab': {cast:true,receive:true}`, `curb: {cast:true,receive:true}`, `road: {cast:false,receive:true}`, `street: {cast:false,receive:true}`. Task 11 makes these follow `STREET_SHADOWS`.

**Step 4: Run** — PASS. **Step 5: Look at it.** In the browser: stand at the spawn, turn around: sidewalk, curb, road and a centre line show over the gate and the fence; walk to each end of the front fence and look along the street: no end in sight; look at the horizon from each edge: no void (AC-4.3, AC-4.8). **Commit** — `git commit -m "feat: draw the sidewalk, curb and road beyond the front fence"`.

---

## Task 9: Source and prepare the car and lamp models (licences, A-3)

**Delivers:** US-6 · FR-16 · AC-6.5, AC-6.6, AC-6.7, AC-6.8, AC-6.9

**This task downloads from the web. Stop and ask the user for approval before downloading.**

**Files:**
- Create: `public/assets/models/street/car-1.glb`, `car-2.glb`, `car-3.glb`, `lamp.glb` (any that are found), `scripts/build-street-props.mjs`
- Modify: `src/data/licences.js`, `src/world/manifest.js`
- Test: `tests/street-glb.test.js`; existing licence, credits and budget tests

**Step 1: Source.** Try, in this order, for each item: Kenney (Car Kit, City Kit), Quaternius, Poly Pizza, OpenGameArt, all with CC0 or an explicit use-and-redistribute licence. Read the licence text on the pack page and in the pack. Reject NC, ND and no licence. Open each car model and check for a readable brand logo or number plate (AC-6.9); reject or edit those out. Record every try (what, where, why rejected) for the "Missing items" list of Task 13.

**Step 2: Prepare.** Write `scripts/build-street-props.mjs` modelled on `scripts/build-kitchen.mjs`: input a source glTF/GLB, output a GLB in metres, standing on y = 0, facing along +x for cars, each at most 1 MB, with the lamp's glass left unlit (plain material, no emissive). Keep the source in `source-assets/` (git-ignored).

**Step 3: Guard test** (`tests/street-glb.test.js`, node environment): every `public/assets/models/street/*.glb` parses, is at most 1 MB, and has a material list without names matching /logo|plate|brand/i. The test passes with zero files (nothing found is a legal outcome, FR-16).

**Step 4: Records and manifest.** One `ASSET_RECORDS` entry per source pack (list all files of that pack that ship; the existing test requires every shipped file to have a record, and no record without a file). Add each found model to `MANIFEST` as `{ id, type: 'model', url: url('models/street/<file>') }`. Filter by the build switches so unused files are not loaded: cars `car-1..car-N` for `N = STREET_CARS`, `lamp` only when `STREET_LAMPS >= 1`. Add a `streetManifest()` helper in `manifest.js` and spread it into `MANIFEST`, and extend `tests/manifest.test.js` for it.

**Step 5: Run** `npm test` — PASS. **Commit** — `git commit -m "feat: street car and lamp models with licence records"`.

If no model is found for some item, skip Steps 2 and 4 for it. Task 10 draws a plain block there.

---

## Task 10: Draw the cars and lamps, with plain blocks as fallback

**Delivers:** US-4, US-6 · FR-9, FR-14, FR-15 · AC-4.5, AC-4.6, AC-6.10, AC-6.12, AC-6.13

**Files:**
- Create: `src/world/builders/props.js`
- Modify: `src/world/buildWorld.js`
- Test: `tests/builders-props.test.js`, extend `tests/buildWorld.test.js`

**Step 1: Write the failing tests.**
- With a stub model for `car-1`, `buildCar` returns a group at the car's position, rotated by `rot`, with `userData.kind = 'car'`, no `plain` label, scaled to fit `w`, `d`, `h` (use `fitToBox` from `common.js`).
- With no model, `buildCar` returns `plainBlock(THREE, car, 'plain')` (a block of the car's size, `userData.plain` set).
- Same for `buildLamp` and the shared model id `lamp`.
- Nothing in the group moves: no object has `userData.update` (AC-4.5), and no audio object or `<audio>` element is created.
- `buildWorld(THREE, emptyAssets, colours)` still returns the fence line, gate, path and street (AC-6.13: `group` contains objects with ids from `fenceLine` by traversing for `kind === 'fence'` and `'gate'`; the solids are in `SOLIDS` regardless).
- `failureMessage` for one failed car, for several failed assets, and for a failed texture is the existing one-sentence text, once: add a test in `tests/assetLoader.test.js` that `failureMessage({ failed: ['car-1', 'lamp', 'paving'], stalled: false })` is a single non-empty string (AC-6.12; it is returned once per load by `mountWorld`, which calls it once).

**Step 2: Run** — FAIL.

**Step 3: Implement.** `buildCar(THREE, assets, car)`: `const model = assets.model(car.id)`; if present, `fitToBox(THREE, model.clone(true), { w: car.w, d: car.d, h: car.h }, car.rot)` inside a group at `(car.x, 0, car.z)`; otherwise `plainBlock`. `buildLamp` is the same with the asset id `'lamp'` for every lamp (clone per lamp). In `buildWorld`, loop over `CARS` and `LAMPS` from `streetLayout.js` and add them to the group. Kinds `car` and `lamp` go into `SHADOW_RULES` (`cast`, `receive` both true). No solids, no click handlers, no lights on the lamps (they are not lit).

**Step 4: Run** `npx vitest run tests/builders-props.test.js tests/buildWorld.test.js tests/assetLoader.test.js` — PASS. **Step 5: Failure drill (AC-6.10 to AC-6.13)** in the browser with DevTools "Block request URL": block one car (plain block, one message, place loads); block `paving.jpg` and `asphalt.jpg` (plain colours, one message); block every file under `models/street/` and the two textures at once (still one message; fence and gate still stop you). Note the outcome in the checklist (Task 13). **Commit** — `git commit -m "feat: parked cars and street lamps with plain-block fallbacks"`.

---

## Task 11: Shadows over the street and the frame-rate fallback (OQ-2)

**Delivers:** US-4, US-6 · FR-14, FR-17 · AC-4.9, AC-4.10, AC-6.2

**Files:**
- Modify: `src/world/builders/sky.js` (line 2 import, line 121 `bounds`), `src/world/builders/shadows.js`, `CLAUDE.md` (the shadow paragraph)
- Test: `tests/shadowFrustum.test.js` (re-point), `tests/shadows.test.js` (extend)

**Step 1: Write the failing tests.**
- `tests/shadowFrustum.test.js`: replace `BOUNDS` with `SHADOW_REGION` (from `streetLayout.js`) in the corner list and in the `shadowFrustum` call. It still passes for every sun azimuth (it fails if the street ever grows past the box).
- A test that every corner of the street, `x = ±12, z = SHADOW_REGION.maxZ, y = 0 and SHADOW_MAX_HEIGHT`, is inside the box (reuse the corner loop).
- `tests/shadows.test.js`: `applyShadows` on a group of each kind `slab`, `street-slab`, `curb`, `car`, `lamp`, `gate`, `fence` sets `castShadow`/`receiveShadow` as in the rules table (gate, car, lamp, curb, slab: both; road: receive only).
- With `STREET_SHADOWS = 'off'` (make the rule table a function of the setting so the test can pass it: `applyShadows(root, { streetShadows: 'off' })`), the kinds `street-slab`, `curb`, `road`, `street`, `car`, `lamp` neither cast nor receive, while `fence`, `gate`, `slab` (the path) keep both (AC-4.10).

**Step 2: Run** — FAIL.

**Step 3: Implement.** `sky.js` imports `SHADOW_REGION` instead of `BOUNDS` for the frustum (the `bounds:` argument at line 121); keep `BOUNDS` for anything else the file uses. `applyShadows` gets a third option `streetShadows = STREET_SHADOWS` (import from `../streetConfig.js`); a `STREET_KINDS` set applies the `NONE` rule when it is `'off'`. Update the CLAUDE.md shadow paragraph: the box is a sphere around the origin that holds `SHADOW_REGION`, and the street build-time switches are in `streetConfig.js`.

**Step 4: Run** `npm test` — PASS. **Step 5: Decision procedure (AC-6.2).** After Task 14's walk, if the average is below 30: set `STREET_CARS` and `STREET_LAMPS` lower one step at a time (not below 1 each), re-measure; if still below, set `STREET_SHADOWS = 'off'` and re-measure; the fence, slabs and house are never reduced. Write each step in the checklist. **Commit** — `git commit -m "feat: sun shadows reach over the street, with a frame-rate switch"`.

---

## Task 12: Regression, privacy and project docs

**Delivers:** US-5, US-7 · FR-13 · NFR-3 · AC-5.4, AC-5.6, AC-7.1, AC-7.2

**Files:**
- Modify: `tests/privacy.test.js`, `CLAUDE.md`, `README.md` (layout paragraph only)
- Read: `docs/verification/phase-1-checklist.md`, `world-visuals-checklist.md`, `enter-the-house-checklist.md`

**Step 1: Privacy test.** Extend `tests/privacy.test.js` so the new files (`streetLayout.js`, `streetConfig.js`, `builders/street.js`, `builders/slabs.js`, `builders/props.js`, `logic/fenceLine.js`, `logic/slabs.js`, `builders/gate.js`) contain no `fetch(`, `XMLHttpRequest`, `sendBeacon`, `localStorage`, `sessionStorage` or `indexedDB`. Run it; it must pass (the new code only draws).

**Step 2: Full run.** `npm test && npm run lint && npm run format:check && npm run build` — all PASS. The three AC-5.6 changes (inner fences, 1.4 m gravel path, spawn "in the street") are the only older expectations that changed (Task 2). If any other test fails, fix the code, not the test.

**Step 3: Greeting and wave (AC-5.4)** is unchanged logic; confirm in the browser with the door open: walk to within 3 m of the character with a fence between you: he stops, faces you and waves once. Walk the character check of AC-5.3 for 5 minutes.

**Step 4: Docs.** In `CLAUDE.md`: the garden-fence sentence in the layout paragraph (fence line from `fenceLine`, `GATE`, `FENCE`), the path (1.2 m slabs, `slabGrid`), the street (`streetLayout.js`, `streetConfig.js`, `SHADOW_REGION`) and the spec/plan/checklist pointers. In `README.md`, only if it describes the garden.

**Step 5: Commit** — `git commit -m "docs: fence line, slab path and street in the project notes; privacy guard"`.

---

## Task 13: The checklist document

**Delivers:** US-6 · FR-9, FR-16 · AC-5.6, AC-6.7 (written part), AC-4.10 (written part), AC-6.2 (written part)

**Files:**
- Create: `docs/verification/garden-fences-and-street-checklist.md`
- Modify: `tests/missing-items.test.js` (also read the new checklist)

**Step 1: Write the checklist** in the format of `docs/verification/enter-the-house-checklist.md`: a Test note (laptop, OS, date, Chrome/Firefox/Safari versions, `STREET_CARS`, `STREET_LAMPS`, `STREET_SHADOWS`, 12 fps values and their average, transfer in MB), "How to measure" (steps below), one line per AC-1.1 to AC-7.2 quoted as written in the spec with an "Auto" marker where a test covers it (file and test named) and a person-only note otherwise, a "Missing items" section (cars, lamps, textures with no free asset found, with what was tried; AC-6.7), a "Changed on purpose" section with the three AC-5.6 items and any other that the builder finds, a "Moved garden objects" section (FR-3: expected to be empty, see Task 2), and a "Decisions" section (frame-rate steps of Task 11, shadows dropped, area growth, AC-5.2 "does not apply" if no edge moved).

**Step 2: Auto rows.** Mark as Auto: AC-1.4, AC-2.3, AC-3.2, AC-3.3, AC-3.4, AC-3.6, AC-4.2, AC-4.4, AC-4.7, AC-5.1, AC-5.5, AC-6.5 (licence tests), AC-6.6 (credits test), AC-7.1 and AC-7.2 (privacy test covers code, the person still inspects the network and storage).

**Step 3: Run** `npx vitest run tests/missing-items.test.js` — PASS. **Commit** — `git commit -m "docs: garden fences and street verification checklist"`.

---

## Task 14: Measure and decide (the builder)

**Delivers:** US-6, US-7, US-5 · NFR-1, NFR-2, NFR-3, NFR-4 · AC-4.5, AC-6.1, AC-6.2, AC-6.3, AC-6.4, AC-6.14, AC-7.1, AC-7.2

This task is done by the builder in a browser; it cannot be done by an agent or a test.

**Step 1: Frame rate (NFR-1, AC-6.1).** `npm run build && npx vite preview --port 5188`, open `http://localhost:5188/?stats` in Chrome on the builder's laptop, choose Try-out. Walk the fixed 2 minutes: from the start spot along the path to the front door, through every room, and back out. Note the displayed fps every 10 seconds (12 values) and the average. Name the laptop in the test note.

**Step 2: If the average is below 30 (AC-6.2, AC-6.3).** Apply the Task 11 procedure: lower cars and lamps (not below 1 and 1), re-measure; then `STREET_SHADOWS = 'off'`, re-measure. If it is still below 30, the feature does not go online until a measurement meets it.

**Step 3: Transfer (NFR-2, AC-6.4).** Chrome DevTools, Network, Disable cache. Load the start screen, choose Try-out, stand in the garden until no new request has come for 10 seconds. Read the transferred figure; at most 100 MB.

**Step 4: Quiet street (AC-4.5).** Watch the street for 1 minute: nothing moves, no sound, lamps not lit.

**Step 5: Privacy (NFR-3, AC-7.1, AC-7.2).** Network tab open for 5 minutes along the path and the fence: only GETs of files, nothing about the person. Compare Local Storage before and after a visit through the try-out: no new entry about the person (A-Frame's own `debug` key is the known exception).

**Step 6: Browsers (NFR-4, AC-6.14).** Latest stable Chrome, Firefox and Safari on macOS: walk the path to the gate, along the fence, and look at the street. Record versions and the OS. Frame rate is judged only in Chrome.

**Step 7: Go through the checklist** of Task 13, row by row, and write yes or no.

**Step 8: Street ends.** At each end of the front fence look along the street with a wide window: no end of the road or sidewalk may show. If it does, lengthen `STREET.length` or the fog far distance.

---

## Coverage table

Every FR, NFR and AC of `specs/garden-fences-and-street/spec.md` and the task that delivers it. NFR-5 is a stated limitation, not a deliverable.

| ID | Delivered by |
| --- | --- |
| FR-1 | Task 1, Task 2 |
| FR-2 | Task 1, Task 3 |
| FR-3 | Task 2 (test and rule), Task 13 (record) |
| FR-4 | Task 1, Task 3 |
| FR-5 | Task 1, Task 2 |
| FR-6 | Task 4, Task 6 |
| FR-7 | Task 2, Task 6 |
| FR-8 | Task 4, Task 7, Task 8 |
| FR-9 | Task 7, Task 10, Task 13 |
| FR-10 | Task 7, Task 8 |
| FR-11 | Task 8 |
| FR-12 | Task 2 |
| FR-13 | Task 2, Task 12 |
| FR-14 | Task 6, Task 8, Task 10, Task 11 |
| FR-15 | Task 10 |
| FR-16 | Task 5, Task 9, Task 13 |
| FR-17 | Task 11, Task 14 |
| NFR-1 | Task 14 |
| NFR-2 | Task 14 |
| NFR-3 | Task 12, Task 14 |
| NFR-4 | Task 14 |
| NFR-5 | No task. A stated limitation (spec A-6); recorded in the checklist note of Task 13. **Flag: nothing to deliver.** |
| AC-1.1 | Task 1 (no gap in the data), Task 2 (walk test), Task 14 (look) |
| AC-1.2 | Task 2 |
| AC-1.3 | Task 2 |
| AC-1.4 | Task 1, Task 2 |
| AC-1.5 | Task 3 |
| AC-1.6 | Task 2, Task 13 |
| AC-2.1 | Task 3 |
| AC-2.2 | Task 2, Task 3 |
| AC-2.3 | Task 1, Task 2 |
| AC-3.1 | Task 6 |
| AC-3.2 | Task 4 |
| AC-3.3 | Task 2 |
| AC-3.4 | Task 2 |
| AC-3.5 | Task 6, Task 8 |
| AC-3.6 | Task 4, Task 8 |
| AC-4.1 | Task 8 |
| AC-4.2 | Task 7 |
| AC-4.3 | Task 7, Task 8 |
| AC-4.4 | Task 7, Task 13 |
| AC-4.5 | Task 10, Task 14 |
| AC-4.6 | Task 10 |
| AC-4.7 | Task 2, Task 7 |
| AC-4.8 | Task 8 |
| AC-4.9 | Task 11 |
| AC-4.10 | Task 11, Task 13 |
| AC-5.1 | Task 2 |
| AC-5.2 | Task 2 (rule and test; "does not apply" if no edge moves), Task 13 |
| AC-5.3 | Task 2, Task 12 |
| AC-5.4 | Task 12 |
| AC-5.5 | Task 2 |
| AC-5.6 | Task 2 (changes), Task 12 (regression), Task 13 (list) |
| AC-6.1 | Task 14 |
| AC-6.2 | Task 11, Task 13, Task 14 |
| AC-6.3 | Task 14 |
| AC-6.4 | Task 14 |
| AC-6.5 | Task 5, Task 9 |
| AC-6.6 | Task 5, Task 9 |
| AC-6.7 | Task 5, Task 9, Task 13 |
| AC-6.8 | Task 5, Task 9 (assets ship from the app; the builder checks the network tab in Task 14) |
| AC-6.9 | Task 9 |
| AC-6.10 | Task 10 |
| AC-6.11 | Task 6, Task 8, Task 10 |
| AC-6.12 | Task 10 |
| AC-6.13 | Task 10 |
| AC-6.14 | Task 14 |
| AC-7.1 | Task 12, Task 14 |
| AC-7.2 | Task 12, Task 14 |

User stories: US-1 (Tasks 1, 2, 3), US-2 (Tasks 1, 3), US-3 (Tasks 2, 4, 6), US-4 (Tasks 7, 8, 10, 11), US-5 (Tasks 2, 12), US-6 (Tasks 5, 9, 11, 13, 14), US-7 (Tasks 12, 14).

**Gaps:** none. NFR-5 has no task by design. AC-6.8 is a network-tab inspection that Task 14 repeats; the unit tests only guarantee that every manifest URL is under the app's own base (`tests/manifest.test.js` already does this for the existing files, and Task 5 and Task 9 extend it).

**Things the builder must do that no test can:** the web downloads of Tasks 5 and 9 need the user's approval; the licence reading is a human judgement (AC-6.5); the measurements of Task 14 are the builder's own; the placeholder licence URL on `house.glb` and the CC0 confirmation of the character from earlier work are still open and outside this plan.
