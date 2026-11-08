# Character Wandering Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** The character wanders at random through the whole garden with the model's own `Walk` animation, and stops and faces the player when the player comes close.

**Architecture:** A pure module `src/logic/wander.js` holds the brain: free-space checks, grid path-finding (A\*), target picking and a step function for the states idle, walk and greet. Two small A-Frame components drive the entity (`character-wander`) and switch the animation clip (`character-animation`, which replaces `idle-animation`). The character's entry in `SOLIDS` moves with him, so the player's walk-limiter keeps blocking at his current spot.

**Tech Stack:** three.js 0.170 (via A-Frame 1.6), Vite, Vitest, Playwright (outside the repo, for the browser check).

Design: `docs/plans/2026-11-08-character-wandering-design.md`.

**Rules for every task** (from `CLAUDE.md`): `npm run lint`, `npm run format:check`, `npm test` and `npm run build` pass before the last commit. `src/logic/` must stay free of A-Frame and the DOM. The character GLB must keep the material names `Hair` and `Purple` and stay under 2 MB.

**Numbers worth knowing.** The Walk clip lasts 1.33 s and covers two steps. With a leg about 0.9 m long, one cycle covers about 1.4 m, so the walking speed is about 1.05 m/s at normal playback. The model faces +z at rotation 0, so a heading `h` (the entity's `rotation.y`, in radians) points along `(sin h, cos h)` and the heading toward a point is `atan2(dx, dz)`.

**Working tree.** Work on branch `character-wander` (already checked out, design doc committed). Do not touch `/assets` (git-ignored raw models) except to read from it.

---

### Task 1: Convert the character with both clips

**Files:**

- Modify: `scripts/convert-character.mjs`
- Modify: `public/assets/character.glb` (regenerated)
- Modify: `tests/character-glb.test.js`

**Step 1: Write the failing test**

In `tests/character-glb.test.js`, replace the animation test with:

```js
  it('has exactly two animations, named Idle and Walk', () => {
    expect(gltf.animations.map((a) => a.name).sort()).toEqual([
      'Idle',
      'Walk',
    ]);
  });
```

**Step 2: Run it to see it fail**

Run: `npx vitest run tests/character-glb.test.js`
Expected: FAIL (one animation, `Idle`).

**Step 3: Let the converter keep several clips**

In `scripts/convert-character.mjs`:

- Change the usage comment and usage message to `[clipNames=Idle] [Material=#hex ...]` and say that `clipNames` is a comma-separated list, for example `Idle,Walk`.
- Replace the single-clip destructuring and lookup. The line `const [input, output, clipName = 'Idle', ...overrides] = process.argv.slice(2);` becomes:

```js
const [input, output, clipList = 'Idle', ...overrides] = process.argv.slice(2);
```

- Replace the block from `const clip = model.animations.find(...)` through `clip.name = clipName;` with:

```js
const clips = clipList.split(',').map((clipName) => {
  const clip = model.animations.find(
    (a) => a.name.split('|').pop() === clipName,
  );
  if (!clip) {
    console.error(
      `No clip named "${clipName}". Found: ${model.animations.map((a) => a.name).join(', ')}`,
    );
    process.exit(1);
  }
  clip.name = clipName;
  return clip;
});
```

- In the exporter options change `animations: [clip],` to `animations: clips,`.
- In the final `console.log` change `clip "${clipName}"` to `clips "${clipList}"`.

**Step 4: Regenerate the GLB**

The original command was `node scripts/convert-character.mjs assets/models/Casual_Hoodie.fbx public/assets/character.glb Idle LightBlue=#7ea6c9`. Keep a copy of the old file first, so you can compare and roll back:

```bash
cp public/assets/character.glb /tmp/character-before.glb
node scripts/convert-character.mjs assets/models/Casual_Hoodie.fbx public/assets/character.glb Idle,Walk LightBlue=#7ea6c9
ls -l public/assets/character.glb /tmp/character-before.glb
```

Expected: the new file is larger than 813 KB, because of the second clip and because an earlier optimisation (duplicates removed, geometry welded) may not be reproduced by the converter.

**Stop condition.** If the new GLB is 2 MB or larger, or `npx vitest run tests/character-glb.test.js` reports a missing `Hair` or `Purple` material, stop and report the numbers. Do not weaken the 2 MB test. Restore the old file with `cp /tmp/character-before.glb public/assets/character.glb` and tell the controller.

**Step 5: Check that the model still looks right**

Run the three existing checks. The scripts live in the session scratchpad and need the Docker dev server on http://localhost:5173 (it is already running):

```bash
S=/private/tmp/claude-501/-Users-falco-vandooremolen-PRIVE-Projects-OpenFreeyond/8552bcb4-29c3-47c8-a569-fbdbe7336e70/scratchpad
cd $S/shot && node face.mjs $S/out && node follow.mjs
```

Then look at `$S/out/face.png` with the Read tool. Expected: the character with hair colour, green hoodie, eyes, and the smiling mouth, as before; `follow.mjs` prints one mouth per sample and a constant `dist` while `mouthY` changes. If the mouth is missing or floats off the face, report it (the `Head` bone may have changed).

**Step 6: Run the test, then commit**

Run: `npx vitest run tests/character-glb.test.js`
Expected: PASS.

```bash
npx prettier --write scripts/convert-character.mjs tests/character-glb.test.js
git add scripts/convert-character.mjs public/assets/character.glb tests/character-glb.test.js
git commit -m "feat: keep the Walk clip in the character model" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

(`npm test` may fail until Task 4 for any test that still expects one clip; run the one file here.)

---

### Task 2: Free space and path-finding in `wander.js`

**Files:**

- Create: `src/logic/wander.js`
- Create: `tests/wander.test.js`

**Step 1: Write the failing tests**

Create `tests/wander.test.js`:

```js
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
    expect(findPath({ x: -3, z: -3 }, { x: 3, z: 3 }, box, bounds)).toBeNull();
  });
});
```

**Step 2: Run to see it fail**

Run: `npx vitest run tests/wander.test.js`
Expected: FAIL (cannot find `src/logic/wander.js`).

**Step 3: Write the first part of `wander.js`**

Create `src/logic/wander.js`:

```js
// The brain of the wandering character. Pure functions: no A-Frame, no DOM, no clock.
// Positions are in metres on the ground (x, z). A heading is a rotation about the y axis in
// radians: it points along (sin h, cos h), and the heading toward a point is atan2(dx, dz).
import { hitsSolid } from './collision.js';

export const WANDER = {
  radius: 0.5, // body radius for routes and steps: he keeps this far from every solid and the boundary
  cell: 0.25, // grid size for path-finding
  speed: 1.05, // metres per second; matches one cycle (1.33 s, about 1.4 m) of the Walk clip
  turnRate: 4, // radians per second
  idleMin: 2, // seconds he stands still between walks
  idleMax: 6,
  greetNear: 3, // he stops and faces the player closer than this ...
  greetFar: 4, // ... and wanders again when the player is farther than this
  personGap: 0.9, // he never steps closer to the player than this
  arrive: 0.15, // close enough to a waypoint
  minTrip: 2, // a new target is at least this far away
  blockedLimit: 2, // seconds he waits for the player to get out of the way before giving up the walk
};

// True when a body of this radius can stand here: inside the boundary and clear of every solid.
export function isFree(x, z, solids, bounds, radius = WANDER.radius) {
  if (x < bounds.minX + radius || x > bounds.maxX - radius) return false;
  if (z < bounds.minZ + radius || z > bounds.maxZ - radius) return false;
  return !hitsSolid(x, z, solids, radius);
}

// True when the straight line between two points is free all the way.
function lineFree(a, b, solids, bounds, radius) {
  const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 0.1));
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    if (
      !isFree(
        a.x + (b.x - a.x) * t,
        a.z + (b.z - a.z) * t,
        solids,
        bounds,
        radius,
      )
    )
      return false;
  }
  return true;
}

// A small binary heap of [priority, value], lowest priority first.
class Heap {
  constructor() {
    this.items = [];
  }
  get size() {
    return this.items.length;
  }
  push(priority, value) {
    const a = this.items;
    a.push([priority, value]);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (a[p][0] <= a[i][0]) break;
      [a[p], a[i]] = [a[i], a[p]];
      i = p;
    }
  }
  pop() {
    const a = this.items;
    const top = a[0];
    const last = a.pop();
    if (a.length > 0) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < a.length && a[l][0] < a[m][0]) m = l;
        if (r < a.length && a[r][0] < a[m][0]) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]];
        i = m;
      }
    }
    return top[1];
  }
}

// A route on a grid from `from` to `to` that stays free of the solids and inside the bounds.
// Returns a list of waypoints that ends exactly at `to` (the start is not included), or null
// when the target is blocked or cannot be reached.
export function findPath(
  from,
  to,
  solids,
  bounds,
  { radius = WANDER.radius, cell = WANDER.cell } = {},
) {
  if (!isFree(to.x, to.z, solids, bounds, radius)) return null;
  if (lineFree(from, to, solids, bounds, radius)) return [{ x: to.x, z: to.z }];

  const nx = Math.floor((bounds.maxX - bounds.minX) / cell) + 1;
  const nz = Math.floor((bounds.maxZ - bounds.minZ) / cell) + 1;
  const toNode = (p) => [
    Math.round((p.x - bounds.minX) / cell),
    Math.round((p.z - bounds.minZ) / cell),
  ];
  const toPoint = (i, j) => ({
    x: bounds.minX + i * cell,
    z: bounds.minZ + j * cell,
  });
  const id = (i, j) => j * nx + i;
  const free = new Map();
  const isNodeFree = (i, j) => {
    if (i < 0 || j < 0 || i >= nx || j >= nz) return false;
    const k = id(i, j);
    if (!free.has(k)) {
      const p = toPoint(i, j);
      free.set(k, isFree(p.x, p.z, solids, bounds, radius));
    }
    return free.get(k);
  };

  const [si, sj] = toNode(from);
  const [gi, gj] = toNode(to);
  const octile = (i, j) => {
    const dx = Math.abs(i - gi);
    const dz = Math.abs(j - gj);
    return (Math.max(dx, dz) + (Math.SQRT2 - 1) * Math.min(dx, dz)) * cell;
  };

  const best = new Map([[id(si, sj), 0]]);
  const parent = new Map();
  const open = new Heap();
  open.push(octile(si, sj), [si, sj]);
  const done = new Set();
  let found = false;
  while (open.size > 0) {
    const [i, j] = open.pop();
    const k = id(i, j);
    if (done.has(k)) continue;
    done.add(k);
    if (i === gi && j === gj) {
      found = true;
      break;
    }
    for (let di = -1; di <= 1; di++) {
      for (let dj = -1; dj <= 1; dj++) {
        if (di === 0 && dj === 0) continue;
        const ni = i + di;
        const nj = j + dj;
        if (!isNodeFree(ni, nj)) continue;
        // No cutting corners: a diagonal step needs both sides free.
        if (di !== 0 && dj !== 0 && !(isNodeFree(i + di, j) && isNodeFree(i, j + dj)))
          continue;
        const cost = best.get(k) + (di !== 0 && dj !== 0 ? Math.SQRT2 : 1) * cell;
        const nk = id(ni, nj);
        if (cost < (best.get(nk) ?? Infinity)) {
          best.set(nk, cost);
          parent.set(nk, k);
          open.push(cost + octile(ni, nj), [ni, nj]);
        }
      }
    }
  }
  if (!found) return null;

  // Walk back from the goal to the start, then pull the route tight: skip every waypoint
  // that the next one can be reached from in a straight free line.
  const nodes = [];
  for (let k = id(gi, gj); k !== undefined; k = parent.get(k)) {
    nodes.push(toPoint(k % nx, Math.floor(k / nx)));
  }
  nodes.reverse();
  nodes[0] = { x: from.x, z: from.z };
  nodes[nodes.length - 1] = { x: to.x, z: to.z };
  const route = [];
  let at = 0;
  while (at < nodes.length - 1) {
    let far = nodes.length - 1;
    while (far > at + 1 && !lineFree(nodes[at], nodes[far], solids, bounds, radius))
      far--;
    route.push(nodes[far]);
    at = far;
  }
  return route;
}
```

**Step 4: Run the tests**

Run: `npx vitest run tests/wander.test.js`
Expected: PASS (6 tests). If "goes around a wall" fails because the route hugs the wall end, check that `isFree` radius is used in `lineFree`, not a smaller one.

**Step 5: Commit**

```bash
npx prettier --write src/logic/wander.js tests/wander.test.js
npm run lint
git add src/logic/wander.js tests/wander.test.js
git commit -m "feat: free-space check and path-finding for the wandering character" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Targets and the state machine in `wander.js`

**Files:**

- Modify: `src/logic/wander.js` (append)
- Modify: `tests/wander.test.js` (append)

**Step 1: Write the failing tests**

Append to `tests/wander.test.js`. Add the new names to the import at the top (`pickTarget`, `initialState`, `stepWander`) and import the real layout:

```js
import {
  isFree,
  findPath,
  pickTarget,
  initialState,
  stepWander,
  WANDER,
} from '../src/logic/wander.js';
import { SOLIDS, BOUNDS, CHARACTER_SPOT } from '../src/world/layout.js';
```

Then append:

```js
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
  it('waits when the player stands in his way, then gives up the walk', () => {
    const open = { minX: -10, maxX: 10, minZ: -10, maxZ: 10 };
    // Walking east along z = 0 from x = -5; the player stands 1 m ahead of him.
    let s = {
      ...initialState(-5, 0, Math.PI / 2),
      mode: 'walk',
      path: [{ x: 5, z: 0 }],
    };
    const player = { x: -4, z: 0 };
    const c = {
      solids: [],
      bounds: open,
      player,
      rng: seeded(1),
    };
    // greet takes over inside 3 m, so test the block on its own: start beyond greetFar? Not possible at 1 m.
    // So the check here is that he never gets nearer than personGap.
    for (let t = 0; t < 10; t += 0.05) {
      s = stepWander(s, 0.05, c);
      expect(Math.hypot(player.x - s.x, player.z - s.z)).toBeGreaterThan(
        WANDER.personGap - 1e-6,
      );
    }
  });
});
```

**Step 2: Run to see them fail**

Run: `npx vitest run tests/wander.test.js`
Expected: FAIL (`pickTarget`, `initialState`, `stepWander` are not exported).

**Step 3: Append to `wander.js`**

```js
// A target the character can walk to: a random free spot at least minTrip away that a route leads to.
// Returns { target, path } or null after a number of failed tries.
export function pickTarget(rng, from, solids, bounds, tries = 40) {
  const r = WANDER.radius;
  for (let n = 0; n < tries; n++) {
    const target = {
      x: bounds.minX + r + rng() * (bounds.maxX - bounds.minX - 2 * r),
      z: bounds.minZ + r + rng() * (bounds.maxZ - bounds.minZ - 2 * r),
    };
    if (!isFree(target.x, target.z, solids, bounds)) continue;
    if (Math.hypot(target.x - from.x, target.z - from.z) < WANDER.minTrip)
      continue;
    const path = findPath(from, target, solids, bounds);
    if (path) return { target, path };
  }
  return null;
}

const idleTime = (rng) =>
  WANDER.idleMin + rng() * (WANDER.idleMax - WANDER.idleMin);

// The shortest signed angle from b to a, in -pi..pi.
const angleDiff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));

function turnToward(heading, target, dt) {
  const step = WANDER.turnRate * dt;
  const d = angleDiff(target, heading);
  return heading + Math.max(-step, Math.min(step, d));
}

export function initialState(x, z, heading) {
  return {
    mode: 'idle', // idle | walk | greet
    x,
    z,
    heading,
    timer: 2, // seconds left of the first rest
    path: [], // waypoints still to walk
    blocked: 0, // seconds he has waited for the player to move
    moving: false, // true in the step he actually moved: drives the Walk animation
  };
}

// One step of the character's life. `ctx` is { solids, bounds, player: {x, z}, rng }, where
// `solids` must not include the character himself. Returns a new state; the old one is not changed.
export function stepWander(state, dt, ctx) {
  const { solids, bounds, player, rng } = ctx;
  const s = { ...state, moving: false };
  const toPlayer = Math.hypot(player.x - s.x, player.z - s.z);

  if (s.mode !== 'greet' && toPlayer < WANDER.greetNear) {
    s.mode = 'greet';
    s.path = [];
  } else if (s.mode === 'greet' && toPlayer > WANDER.greetFar) {
    s.mode = 'idle';
    s.timer = idleTime(rng);
  }

  if (s.mode === 'greet') {
    s.heading = turnToward(
      s.heading,
      Math.atan2(player.x - s.x, player.z - s.z),
      dt,
    );
    return s;
  }

  if (s.mode === 'idle') {
    s.timer -= dt;
    if (s.timer <= 0) {
      const trip = pickTarget(rng, s, solids, bounds);
      if (trip) {
        s.mode = 'walk';
        s.path = trip.path;
        s.blocked = 0;
      } else {
        s.timer = idleTime(rng);
      }
    }
    return s;
  }

  // walk
  const next = s.path[0];
  if (!next) {
    s.mode = 'idle';
    s.timer = idleTime(rng);
    return s;
  }
  const dx = next.x - s.x;
  const dz = next.z - s.z;
  const dist = Math.hypot(dx, dz);
  if (dist < WANDER.arrive) {
    s.path = s.path.slice(1);
    return s;
  }
  const want = Math.atan2(dx, dz);
  s.heading = turnToward(s.heading, want, dt);
  if (Math.abs(angleDiff(want, s.heading)) > 0.8) return s; // turn on the spot first

  const step = Math.min(WANDER.speed * dt, dist);
  const x = s.x + (dx / dist) * step;
  const z = s.z + (dz / dist) * step;
  const closer =
    Math.hypot(player.x - x, player.z - z) < Math.hypot(player.x - s.x, player.z - s.z);
  const tooNear = Math.hypot(player.x - x, player.z - z) < WANDER.personGap;
  if (!isFree(x, z, solids, bounds) || (tooNear && closer)) {
    s.blocked += dt;
    if (s.blocked > WANDER.blockedLimit) {
      s.mode = 'idle';
      s.timer = idleTime(rng);
      s.path = [];
    }
    return s;
  }
  s.x = x;
  s.z = z;
  s.blocked = 0;
  s.moving = true;
  return s;
}
```

**Step 4: Run the tests**

Run: `npx vitest run tests/wander.test.js`
Expected: PASS. If "never walks into a solid" fails, print the time and position and check that the step test `isFree` in `stepWander` uses the same radius as the route. If the "waits when the player stands in his way" test is awkward (greet takes over inside 3 m), keep it as written: it checks the invariant that he never gets nearer than `personGap`.

**Step 5: Commit**

```bash
npx prettier --write src/logic/wander.js tests/wander.test.js
npm run lint
git add src/logic/wander.js tests/wander.test.js
git commit -m "feat: targets and the idle, walk and greet state machine for the character" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Components and wiring

**Files:**

- Modify: `src/world/layout.js` (add `resetCharacterSolid`)
- Modify: `src/world/components.js` (replace `idle-animation`, add `character-wander`)
- Modify: `src/world/scene.js`
- Modify: `tests/layout.test.js`

**Step 1: Write the failing test**

In `tests/layout.test.js`, add `resetCharacterSolid` to the import from `../src/world/layout.js` and append:

```js
describe('the character solid moves and can be put back', () => {
  it('goes back to the start spot', () => {
    const c = SOLIDS.find((s) => s.kind === 'character');
    c.x = 9;
    c.z = 9;
    resetCharacterSolid();
    expect([c.x, c.z]).toEqual([CHARACTER_SPOT.x, CHARACTER_SPOT.z]);
  });
});
```

Also rename the existing test `'lets a person reach the character, who stands outside the house in a fixed spot (AC-4.4)'` to `'lets a person reach the character, who starts outside the house in a fixed spot (AC-4.4)'`.

Run: `npx vitest run tests/layout.test.js`. Expected: FAIL (`resetCharacterSolid` is not exported).

**Step 2: Add `resetCharacterSolid` to `layout.js`**

At the end of `src/world/layout.js` add:

```js
// The character wanders, so his solid moves (see character-wander in components.js).
// This puts it back at the start spot, for a new visit to the world.
export function resetCharacterSolid() {
  const c = SOLIDS.find((s) => s.id === 'character');
  if (c) {
    c.x = CHARACTER_SPOT.x;
    c.z = CHARACTER_SPOT.z;
  }
}
```

Run `npx vitest run tests/layout.test.js`. Expected: PASS.

**Step 3: Replace `idle-animation` and add `character-wander` in `components.js`**

Add to the imports at the top:

```js
import { SOLIDS, BOUNDS, CHARACTER_SPOT, resetCharacterSolid } from './layout.js';
import { initialState, stepWander } from '../logic/wander.js';
```

(Replace the existing `import { SOLIDS, BOUNDS } from './layout.js';`.)

Delete the whole `idle-animation` component (from the comment `// Plays the animation clip named "Idle"` through its closing `});`) and put this in its place:

```js
const FADE_SECONDS = 0.25; // cross-fade between Idle and Walk
const MAX_STEP_SECONDS = 0.1; // a slow frame or a hidden tab must not make him jump
const START_HEADING = (-30 * Math.PI) / 180; // as in the markup of scene.js

// Plays the clip for what the character is doing: "Idle" standing, "Walk" walking (FR-6).
// character-wander says which, with a 'character-state' event. The model holds only those two clips.
AFRAME.registerComponent('character-animation', {
  init() {
    this.mixer = null;
    this.actions = {};
    this.current = null;
    this.wanted = 'Idle';
    this.onModel = () => this.setup();
    this.onState = (event) => {
      this.wanted = event.detail.moving ? 'Walk' : 'Idle';
      this.play(this.wanted);
    };
    this.el.addEventListener('model-loaded', this.onModel);
    this.el.addEventListener('character-state', this.onState);
  },
  setup() {
    const mesh = this.el.getObject3D('mesh');
    if (!mesh || !mesh.animations) return;
    this.mixer = new AFRAME.THREE.AnimationMixer(mesh);
    for (const name of ['Idle', 'Walk']) {
      const clip = mesh.animations.find((c) => c.name === name);
      if (clip) this.actions[name] = this.mixer.clipAction(clip);
    }
    this.play(this.wanted, 0);
  },
  play(name, fade = FADE_SECONDS) {
    const next = this.actions[name];
    if (!next || next === this.current) return;
    next.reset().setEffectiveWeight(1).play();
    if (this.current) this.current.crossFadeTo(next, fade, false);
    this.current = next;
  },
  tick(time, delta) {
    if (this.mixer) this.mixer.update(delta / 1000);
  },
  remove() {
    this.el.removeEventListener('model-loaded', this.onModel);
    this.el.removeEventListener('character-state', this.onState);
    if (this.mixer) this.mixer.stopAllAction();
  },
});

// Lets the character wander through the garden (see src/logic/wander.js). It starts when the
// model has loaded: with the plain figure there is nothing to move, and the figure stays put.
// His solid in SOLIDS moves with him, so the walk-limiter stops the player at his current spot.
AFRAME.registerComponent('character-wander', {
  init() {
    this.active = false;
    this.moving = false;
    this.player = null;
    this.solids = SOLIDS.filter((s) => s.id !== 'character');
    this.body = SOLIDS.find((s) => s.id === 'character');
    this.state = initialState(CHARACTER_SPOT.x, CHARACTER_SPOT.z, START_HEADING);
    this.onModel = () => {
      this.active = true;
    };
    this.el.addEventListener('model-loaded', this.onModel);
  },
  tick(time, delta) {
    if (!this.active) return;
    this.player ??= this.el.sceneEl.querySelector('[camera]');
    if (!this.player) return;
    const seconds = Math.min(delta / 1000, MAX_STEP_SECONDS);
    const p = this.player.object3D.position;
    this.state = stepWander(this.state, seconds, {
      solids: this.solids,
      bounds: BOUNDS,
      player: { x: p.x, z: p.z },
      rng: Math.random,
    });
    this.el.object3D.position.set(this.state.x, 0, this.state.z);
    this.el.object3D.rotation.y = this.state.heading;
    if (this.body) {
      this.body.x = this.state.x;
      this.body.z = this.state.z;
    }
    if (this.state.moving !== this.moving) {
      this.moving = this.state.moving;
      this.el.emit('character-state', { moving: this.moving });
    }
  },
  remove() {
    this.el.removeEventListener('model-loaded', this.onModel);
    resetCharacterSolid();
  },
});
```

**Step 4: Wire it in `scene.js`**

- In the markup, replace the line `idle-animation></a-entity>` with `character-animation\n        character-wander></a-entity>` (keep `character-mouth` above it).
- In the `teardown` function, after `scene.remove();` add `resetCharacterSolid();` and add `resetCharacterSolid` to the import from `./layout.js` (it already imports `SPAWN, CHARACTER_SPOT`).
- Update the comment above `characterGltf` from "The existing components paint and animate it." to "The components paint, animate and move it."

**Step 5: Run everything**

Run: `npm run lint && npm run format:check && npm test && npm run build`
Expected: all pass. A failing test that still expects one clip or an `idle-animation` attribute is a plan gap: grep `idle-animation` in `src` and `tests` and fix the leftover.

**Step 6: Commit**

```bash
npx prettier --write src/world/layout.js src/world/components.js src/world/scene.js tests/layout.test.js
git add src/world/layout.js src/world/components.js src/world/scene.js tests/layout.test.js
git commit -m "feat: the character wanders and walks with the Walk animation" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Check it in a real browser

This needs eyes. Run the checks, look at the screenshots, and report what you see. Do not change thresholds to make a check pass.

**Files:**

- Create (outside the repo): `$S/shot/wander.mjs`, where `S=/private/tmp/claude-501/-Users-falco-vandooremolen-PRIVE-Projects-OpenFreeyond/8552bcb4-29c3-47c8-a569-fbdbe7336e70/scratchpad`

The Docker dev server on http://localhost:5173 serves the repository, so it already runs the new code. (A second dev server, PID 81355 on port 5174, is also running and may be ignored.)

**Step 1: Write the script**

```js
import { chromium } from 'playwright-core';
const out = process.argv[2];
const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 1000, height: 650 } });
page.on('pageerror', (e) => console.log('pageerror:', e.message));
await page.goto('http://localhost:5173/');
await page.click('[data-choice="try-out"]');
await page.waitForSelector('a-scene canvas', { timeout: 60000 });
await page.waitForTimeout(4000);
await page.click('[data-action="dismiss-hint"]').catch(() => {});

// Park the player far away (the back corner of the street), so he wanders freely.
const setPlayer = (x, z) =>
  page.evaluate(([x, z]) => {
    const cam = document.querySelector('[camera]');
    cam.object3D.position.set(x, 1.6, z);
    cam.components['walk-limiter'].last = { x, z };
  }, [x, z]);
await setPlayer(9, 9);

const sample = () =>
  page.evaluate(async () => {
    const { SOLIDS, BOUNDS } = await import('/src/world/layout.js');
    const { isFree } = await import('/src/logic/wander.js');
    const w = document.querySelector('#character-model-entity').components['character-wander'];
    const others = SOLIDS.filter((s) => s.id !== 'character');
    const body = SOLIDS.find((s) => s.id === 'character');
    return {
      mode: w.state.mode, x: w.state.x, z: w.state.z, heading: w.state.heading,
      free: isFree(w.state.x, w.state.z, others, BOUNDS),
      bodyMatches: Math.abs(body.x - w.state.x) < 1e-9 && Math.abs(body.z - w.state.z) < 1e-9,
      active: w.active,
    };
  });

const samples = [];
for (let i = 0; i < 120; i++) {
  samples.push(await sample());
  if (i === 40) await page.screenshot({ path: `${out}/wander-1.png` });
  await page.waitForTimeout(500);
}
const modes = new Set(samples.map((s) => s.mode));
let travelled = 0;
for (let i = 1; i < samples.length; i++) travelled += Math.hypot(samples[i].x - samples[i - 1].x, samples[i].z - samples[i - 1].z);
console.log(JSON.stringify({
  active: samples.every((s) => s.active),
  modes: [...modes],
  allFree: samples.every((s) => s.free),
  bodyAlwaysMatches: samples.every((s) => s.bodyMatches),
  travelledMetres: +travelled.toFixed(1),
  distinctSpots: new Set(samples.map((s) => `${Math.round(s.x)},${Math.round(s.z)}`)).size,
}));

// Greeting: stand 1.8 m away from him, to his east.
const here = await sample();
await setPlayer(here.x + 1.8, here.z);
await page.waitForTimeout(2500);
const greet = await sample();
const expected = Math.atan2(1.8, 0);
console.log(JSON.stringify({ greetMode: greet.mode, headingError: +Math.abs(Math.atan2(Math.sin(greet.heading - expected), Math.cos(greet.heading - expected))).toFixed(2) }));
await page.screenshot({ path: `${out}/wander-greet.png` });

// Leaving: walk away, he should wander again.
await setPlayer(9, 9);
await page.waitForTimeout(12000);
const after = await sample();
console.log(JSON.stringify({ afterLeaving: after.mode }));
await browser.close();
```

**Step 2: Run it**

```bash
S=/private/tmp/claude-501/-Users-falco-vandooremolen-PRIVE-Projects-OpenFreeyond/8552bcb4-29c3-47c8-a569-fbdbe7336e70/scratchpad
mkdir -p $S/out && cd $S/shot && node wander.mjs $S/out
```

Expected output, in order:

1. `active: true`, `modes` contains `idle` and `walk`, `allFree: true`, `bodyAlwaysMatches: true`, `travelledMetres` well above 10, `distinctSpots` above 5.
2. `greetMode: "greet"` and `headingError` below 0.1.
3. `afterLeaving` is `idle` or `walk`, not `greet`.

Software rendering runs at about 15 frames per second, so movement is slower than on the builder's laptop but the checks hold (a step is capped at 0.1 s).

**Step 3: Look at the pictures**

Read `$S/out/wander-1.png` and `$S/out/wander-greet.png`. Report: is he upright and moving his legs in the first picture, or in an idle pose? Does he face the camera in the second? Does the mouth stay on his face? Is his body clipped into anything?

**Step 4: Check the walk speed against the legs**

Sample two frames 0.4 s apart while he walks and compare. Judge by eye from a screenshot sequence: do the feet look like they slide on the ground? If they clearly slide, report it with the direction (too fast or too slow). The stride is tuned in `WANDER.speed` in `src/logic/wander.js`. Change it only by 0.1 m/s steps, rerun the tests, and report the value you chose. Do not change anything else.

**Step 5: Commit tuning (only if the speed changed)**

```bash
git add src/logic/wander.js
git commit -m "style: tune the walking speed to the Walk animation" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Spec, checklist and docs

**Files:**

- Modify: `specs/openfreeyond-companion/spec.md`
- Modify: `specs/world-visuals/spec.md`
- Modify: `docs/verification/phase-1-checklist.md`
- Modify: `docs/verification/world-visuals-checklist.md`
- Modify: `CLAUDE.md`
- Modify: `README.md`
- Modify: `docs/plans/2026-11-08-character-wandering-design.md` (only if the plan changed something)

**Step 1: Spec wording**

- `specs/openfreeyond-companion/spec.md`: FR-6 now reads "The character starts in a fixed spot in the place, wanders through the place with a walking animation, shows an idle animation when he stands, and stops and faces a person who comes close." Look at AC-2.1 and AC-2.2 and the Definitions line "Visibly present": change "stands" and "same spot" only where they now contradict the behaviour. AC-2.2 ("walk away and come back: it stands in the same spot") becomes "starts in the same spot on every visit".
- `specs/world-visuals/spec.md`: FR-11 and AC-4.4 say the character stays in a fixed spot. Change to "starts in a fixed spot" and "starts in the same spot each time", and add a one-line dated note: "Changed on 2026-11-08: the character wanders (see `docs/plans/2026-11-08-character-wandering-design.md`)."
- Report the exact before and after wording of every spec line you change, so the builder can review them.

**Step 2: Checklists**

Add unticked items. Tick nothing and fill in no numbers.

- `docs/verification/phase-1-checklist.md`: change AC-2.2 to match the spec. Add: "The character walks to different places, going around the house, trees and fences, and stands still for a few seconds between walks." and "Walk up to the character: he stops, turns to face you and stands (idle). Walk away: he wanders again." and "You cannot walk through the character while he walks, and he does not walk into you."
- `docs/verification/world-visuals-checklist.md`: add one item: "The walk looks right: his feet do not slide on the ground."
- Add an automated-results note of what Task 5 measured (the printed numbers), as the existing notes do. Say that the walk and the feet were judged from screenshots in software rendering.

**Step 3: Project notes**

- `CLAUDE.md`, in the Architecture list: add a bullet "The character wanders. `src/logic/wander.js` (pure) picks targets, finds routes on a grid and runs the idle, walk and greet states. `character-wander` in `components.js` moves the entity and the `character` entry of `SOLIDS` (reset by `resetCharacterSolid` on teardown); `character-animation` plays the `Idle` and `Walk` clips. `character.glb` has exactly those two clips, made by `scripts/convert-character.mjs` with `Idle,Walk`." Also fix the existing sentence that says the GLB has "one animation clip".
- `README.md`, "What it does": change "A character with an idle animation." to "A character who wanders through the garden, and stops and faces you when you come close." and update the "stands in the garden" intro sentence the same way.

**Step 4: Check and commit**

Run: `npm run lint && npm run format:check && npm test && npm run build`
Expected: all pass.

```bash
npx prettier --write README.md CLAUDE.md docs specs
git add README.md CLAUDE.md docs specs
git commit -m "docs: document the wandering character" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

## After the plan

- Phase 2 (voice) can reuse the greet state: it already stops him and turns him toward the player.
- Other clips (`Wave`, `Interact`) are in the same FBX. Add them to the `Idle,Walk` list in the converter and play them from `character-animation` when needed.
- Risk: the re-converted GLB may be larger than before, if an earlier hand optimisation (welded geometry, removed duplicates) is not reproduced. Task 1 stops and reports if the file reaches 2 MB.
