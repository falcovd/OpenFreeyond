# OpenFreeyond World Visuals Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Give the walkable place a cozy, semi-realistic look (sky, grass, path, trees, bushes, flower beds, hedge, fences, a textured house, better furniture) that stays at 30 fps in Chrome on the builder's laptop and downloads in at most 30 MB, with a loading indicator, graceful fallbacks and recorded licences.

**Architecture:** The rules stay pure and unit tested: layout data (`src/world/layout.js`), walkable-area maths (`src/logic/walkable.js`), the asset loader with its 30-second timeout (`src/world/assetLoader.js`) and the licence records (`src/data/licences.js`). The 3D look is built by plain functions in `src/world/builders/` that take `THREE` as a parameter, so tests run them with the `three` dev dependency and no WebGL. `scene.js` loads every asset first, then builds the world from what loaded and uses a plain colour or plain block for what did not. Sky and clouds are made in code (no files, no licence). Textures are JPEG, models are GLB.

**Tech Stack:** JavaScript (ES modules), Vite, A-Frame 1.6.0 (`AFRAME.THREE`, `THREE.GLTFLoader`, `THREE.TextureLoader`), Vitest + jsdom, ESLint, Prettier, `sharp` (new dev dependency, texture prep), `@gltf-transform/cli` (run with `npx`, model prep), GitHub Pages. Source of these choices: the existing code, `plans/project-plan.md` and `docs/plans/2026-11-07-openfreeyond-phase-1.md` (no `.adlc-project/PROJECT.md` exists).

**Spec:** `specs/world-visuals/spec.md` (v1). Do not change it. If something is wrong or unclear, stop and ask. Phase 1 spec: `specs/openfreeyond-companion/spec.md`.

---

## Decisions this plan settles

- **OQ-2 (hosting): GitHub Pages.** `.github/workflows/pages.yml` already deploys there and the phase 1 plan chose it. GitHub Pages limits a published site to 1 GB and a single file to 100 MB, so a 30 MB first-visit budget fits. The spec says the builder settles hosting before planning: **the builder confirms this in Task 1, Step 1.** If not, stop.
- **OQ-4 (texture formats): JPEG for opaque textures, PNG only where transparency is needed, all at most 1024 px. No WebP, AVIF or KTX2.** JPEG and PNG work in every browser with no extension and no decoder file. The 30 MB budget is large enough without the smaller formats. Model files are GLB, with their textures resized to at most 512 px and left as JPEG or PNG.
- **OQ-1 (sources):**
  - Textures (grass, path, wood): ambientCG or Poly Haven (both CC0). Brick and roof slate: the CC0 textures already in the Downtown City MegaKit (`T_RedBrick_BaseColor.png`, `T_RoofSlate_BaseColor.png`).
  - Tree and bush models: Quaternius "Stylized Nature MegaKit" (free standard version, CC0). It has the same author and a similar painterly style as the character and the kit, which helps FR-12. Fallback if it lacks two tree shapes or a bush: Kenney "Nature Kit" (CC0).
  - Sky, clouds, flowers, fences, hedge, door, windows, furniture: built in code from the textures above. No file, no licence question.
  - Every file is checked against its licence text before use (Task 3). A source with NC, ND or no licence is dropped.
- **Hedge** is a box with the grass texture tinted dark green. **House and fences** are built in code from textures, so they have no model file to fail. FR-16's "plain block" rule applies to the model files: trees, bushes and the character. A missing texture gives a plain colour on the house and fences. This reads FR-16 (a model that fails gets a block; a texture that fails gets a plain colour) against what exists. If the PO wants the house as a model file, that is a spec change.
- **House:** 5.5 by 4.5 m, two floors, gable roof, door and 5 windows on the garden (+z) side. The spec allows up to 10 by 8 m, but the walkable-area rule (FR-11) needs the solids to cover less than 39.52 m², the phase 1 total. A bigger house would force fewer trees. Task 4 holds the numbers.
- **Collision stays on boxes** (`SOLIDS`). The look can be rounder than the box. Trees and bushes collide by their trunk or base only.
- **Flower beds** are not solids. They live in `FLOWER_BEDS`, drawn but never passed to collision. The planter is a solid furniture item.
- **Sky:** a vertex-coloured sphere. **Clouds:** groups of white spheres that rotate slowly around the place. **No empty edge:** the ground plane is 600 m wide, linear fog fades it into the horizon colour, and the sky sphere uses the same colour below the horizon.
- **Loading:** `scene.js` no longer uses `<a-assets>`. It loads with `loadAssets()` (injected loaders, 30 s limit, never rejects), then builds the scene. `main.js` shows the loading indicator from the moment the person chooses, and removes it when the world is ready or after 30 seconds.
- **Character:** loaded through the same loader. If it fails, a plain figure (boxes and a sphere) takes its spot and the chosen hair and clothing colours. The character's solid stays in `SOLIDS`, so it still blocks.
- **Credits:** a "Credits" button in the world overlay lists every record that has a credit line. The same data file drives the licence test.
- **Frame-rate and size checks stay manual** (as in phase 1). The size check also has a cheap guard in tests (total `public/assets` size).

## Not in this plan (flag)

- **OQ-3 is a precondition, not a task:** the builder changes the phase 1 spec (NFR-2, AC-1.6, AC-1.7: 30 fps in Chrome only) before building starts. Task 1 checks that it is done. This plan never edits either spec.
- Rating sessions with the independent people and the week-4 rating happen after the place is online. Task 15 gives the checklist rows and the exact wording; nobody can run them before that.
- No texture or model is bundled in this plan: Task 3 tells the executor what to download, because sources and licences must be read by a person.

## Conventions

- Run tests with `npm test`, lint with `npm run lint`, format with `npm run format`.
- Asset sources stay in the git-ignored `assets/` folder. Only `public/assets/**` is committed.
- Task order matters. Task 1 must finish before any code or asset change (FR-21, AC-10.4 need the *current* look).

---

### Task 1: Preflight, baseline screenshots and layout fixture

**Delivers:** US-10; FR-19 (baseline part), FR-21; AC-10.1, AC-10.4. Also settles OQ-2.

**Files:**
- Create: `specs/world-visuals/baseline/` (screenshots)
- Create: `tests/fixtures/phase1-layout.js`
- Modify: `specs/world-visuals/decisions.md` (append, do not rewrite)

**Step 1: Confirm the preconditions with the builder**

Ask the builder to confirm, and stop if either is no:
1. Hosting is GitHub Pages (the existing `pages.yml`).
2. The phase 1 spec is changed for NFR-2, AC-1.6 and AC-1.7 (30 fps in Chrome only; spec OQ-3).

**Step 2: Create a branch**

```bash
git switch -c world-visuals
```

**Step 3: Verify AC-10.1 already holds**

Run: `grep -n "2026-11-08" specs/world-visuals/decisions.md`
Expected: a line that records the baseline rating 2 on 2026-11-08 ("Decisions while writing the spec"). If it is missing, add `Baseline rating: 2 of 5 on "looks like a cozy home", by the builder, 2026-11-08, before any change.` to `decisions.md`.

**Step 4: Take the baseline screenshots (before any change)**

```bash
npm ci && npm run dev
```

Open http://localhost:5173, choose "Try out". Take four screenshots of the current look and save them as:
- `specs/world-visuals/baseline/garden.png` (view across the garden)
- `specs/world-visuals/baseline/house.png` (the house from the street)
- `specs/world-visuals/baseline/trees.png` (a tree)
- `specs/world-visuals/baseline/furniture.png` (bench, table and planter)

**Step 5: Freeze the phase 1 layout as a test fixture**

Create `tests/fixtures/phase1-layout.js` with the *current* values of `src/world/layout.js`, copied verbatim:

```js
// Frozen copy of the phase 1 layout (AC-4.3 compares the new layout with it). Never edit.
export const PHASE1_BOUNDS = { minX: -11, maxX: 11, minZ: -11, maxZ: 11 };
export const PHASE1_SOLIDS = [
  { id: 'house', x: 0, z: -7, w: 6, d: 5 },
  { id: 'fence-left', x: -8, z: -2, w: 0.2, d: 10 },
  { id: 'fence-right', x: 8, z: -2, w: 0.2, d: 10 },
  { id: 'bench', x: -4, z: -2, w: 1.6, d: 0.6 },
  { id: 'table', x: 5, z: -4, w: 1.2, d: 1.2 },
  { id: 'planter', x: -5, z: -5, w: 2, d: 0.6 },
  { id: 'tree-1', x: -5, z: 3, w: 0.8, d: 0.8 },
  { id: 'tree-2', x: 6, z: 3, w: 0.8, d: 0.8 },
  { id: 'character', x: 3, z: -1, w: 0.8, d: 0.8 },
];
```

**Step 6: Log it and commit**

Append to `specs/world-visuals/decisions.md`:

```markdown
## Plan decisions (2026-11-08)
- OQ-2: hosted on GitHub Pages (existing pages.yml), confirmed by the builder.
- OQ-3: phase 1 spec changed for NFR-2, AC-1.6, AC-1.7 before building (confirmed by the builder).
- OQ-4: JPEG and PNG textures, at most 1024 px; no WebP, AVIF or KTX2.
- Baseline screenshots: specs/world-visuals/baseline/ (taken before any change).
```

```bash
git add specs/world-visuals tests/fixtures/phase1-layout.js
git commit -m "docs: baseline screenshots and frozen phase 1 layout for world visuals"
```

---

### Task 2: Licence records and their test

**Delivers:** US-11; FR-20 (records part); AC-11.1, AC-11.4.

**Files:**
- Create: `src/data/licences.js`
- Create: `tests/licences.test.js`

**Step 1: Write the failing test**

```js
// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { ASSET_RECORDS, USABLE_LICENCES } from '../src/data/licences.js';

const ROOT = new URL('../public/assets', import.meta.url).pathname;

function files(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? files(p) : [p];
  });
}

describe('asset licence records (AC-11.1, AC-11.4)', () => {
  it('has a record for every shipped asset file, and no record without a file', () => {
    const shipped = files(ROOT)
      .map((p) => relative(ROOT, p))
      .filter((p) => !p.startsWith('.'))
      .sort();
    const recorded = ASSET_RECORDS.flatMap((r) => r.files).sort();
    expect(recorded).toEqual(shipped);
  });

  it('gives every record an author, a source link, the licence text and a usable licence', () => {
    for (const r of ASSET_RECORDS) {
      expect(r.author.trim(), r.files.join()).not.toBe('');
      expect(r.source, r.files.join()).toMatch(/^https:\/\//);
      expect(r.licenceText.trim().length, r.files.join()).toBeGreaterThan(20);
      expect(USABLE_LICENCES, r.files.join()).toContain(r.licence);
    }
  });

  it('requires a credit line for every CC-BY asset', () => {
    for (const r of ASSET_RECORDS.filter((x) => x.licence.startsWith('CC-BY'))) {
      expect(r.credit?.trim(), r.files.join()).toBeTruthy();
    }
  });

  it('records the character (AC-11.4)', () => {
    expect(ASSET_RECORDS.some((r) => r.files.includes('character.glb'))).toBe(true);
  });
});
```

**Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/licences.test.js`
Expected: FAIL (cannot find `../src/data/licences.js`).

**Step 3: Check the character's licence (FR-20, AC-11.4)**

The character comes from the Quaternius "Hoodie Character" zip. Read its licence text:

```bash
cd assets/models && unzip -l "Hoodie Character by Quaternius - gKLBoRsyKe.zip" | grep -i licen
unzip -p "Hoodie Character by Quaternius - gKLBoRsyKe.zip" "<the licence file listed above>"
```

Copy the licence text and the source URL (the Quaternius page in the zip's text or on quaternius.com) into the record in Step 4. **If the text does not allow use and redistribution (or no licence is stated), stop: the character must be replaced before going online (FR-20). Tell the builder; the replacement is a separate decision.** Record the check date in the record's `checked` field.

**Step 4: Write the data file**

```js
// One record per source pack. Credits shown on the place's page come from `credit`.
export const USABLE_LICENCES = ['CC0-1.0', 'CC-BY-4.0', 'CC-BY-3.0'];

export const ASSET_RECORDS = [
  {
    files: ['character.glb'],
    author: 'Quaternius',
    source: 'https://quaternius.com/', // replace with the exact pack page
    licence: 'CC0-1.0',
    licenceText: 'PASTE THE LICENCE TEXT FROM THE ZIP HERE',
    credit: null,
    checked: '2026-11-08', // date you read the licence
  },
];
```

Fill in the real text. More records are added in Task 3 as files are added.

**Step 5: Run the test to verify it passes**

Run: `npx vitest run tests/licences.test.js`
Expected: the "every shipped asset" test passes only while `public/assets` holds `character.glb` alone, and the other three pass.

**Step 6: Commit**

```bash
git add src/data/licences.js tests/licences.test.js
git commit -m "feat: licence records for shipped assets, with a test"
```

---

### Task 3: Source and prepare the textures and models

**Delivers:** US-11; FR-20 (records, own address); NFR-2 (budget guard). Settles OQ-1 and OQ-4.

**Files:**
- Create: `scripts/prepare-texture.mjs`
- Create: `public/assets/textures/{grass,path,wood,brick,roof}.jpg`
- Create: `public/assets/models/{tree-round,tree-pine,bush}.glb`
- Modify: `src/data/licences.js`, `package.json`
- Create: `tests/budget.test.js`

**Step 1: Write the budget test**

```js
// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('../public/assets', import.meta.url).pathname;
const total = (dir) =>
  readdirSync(dir).reduce((sum, name) => {
    const p = join(dir, name);
    return sum + (statSync(p).isDirectory() ? total(p) : statSync(p).size);
  }, 0);

describe('download budget (NFR-2)', () => {
  it('keeps shipped assets at or under 20 MB, so the page, scripts and assets stay under 30 MB', () => {
    expect(total(ROOT)).toBeLessThanOrEqual(20 * 1024 * 1024);
  });
  it('keeps every texture at 1 MB or less', () => {
    for (const f of readdirSync(join(ROOT, 'textures'))) {
      expect(statSync(join(ROOT, 'textures', f)).size).toBeLessThanOrEqual(1024 * 1024);
    }
  });
});
```

Run: `npx vitest run tests/budget.test.js` — Expected: FAIL (no `textures` folder yet).

**Step 2: Add the texture script**

```bash
npm install --save-dev sharp
```

Create `scripts/prepare-texture.mjs`:

```js
/* global process, console */
// Usage: node scripts/prepare-texture.mjs <input image> <output.jpg> [size=1024]
// Makes a square JPEG at most <size> px (OQ-4: JPEG, at most 1024 px).
import sharp from 'sharp';

const [input, output, size = '1024'] = process.argv.slice(2);
if (!input || !output) {
  console.error('Usage: node scripts/prepare-texture.mjs <input> <output.jpg> [size]');
  process.exit(1);
}
const px = Math.min(Number(size), 1024);
await sharp(input)
  .resize(px, px, { fit: 'cover' })
  .jpeg({ quality: 80, mozjpeg: true })
  .toFile(output);
console.log(`wrote ${output}`);
```

**Step 3: Download the sources (a person does this)**

For each item, open the source page, read the licence on that page, and keep the licence text. Put the originals in `assets/textures/` or `assets/models/` (git-ignored).

| File | Source | Needed |
|---|---|---|
| `grass.jpg` | ambientCG or Poly Haven grass, base-colour map, seamless | CC0 |
| `path.jpg` | ambientCG or Poly Haven gravel or dirt path | CC0 |
| `wood.jpg` | ambientCG or Poly Haven planks | CC0 |
| `brick.jpg` | `assets/models/Downtown City MegaKit[Standard]/Textures/T_RedBrick_BaseColor.png` | CC0 (kit licence file) |
| `roof.jpg` | same folder, `T_RoofSlate_BaseColor.png` | CC0 |
| `tree-round.glb`, `tree-pine.glb`, `bush.glb` | Quaternius "Stylized Nature MegaKit" (free version): one round-crown tree, one pine or conifer, one bush | CC0 |

If the Stylized Nature kit lacks two different tree shapes or a bush, use Kenney "Nature Kit" for the missing one. A source with NC, ND or no stated licence is not usable (spec definition): pick another.

**Step 4: Convert the textures**

```bash
mkdir -p public/assets/textures public/assets/models
node scripts/prepare-texture.mjs assets/textures/grass-source.jpg public/assets/textures/grass.jpg 1024
node scripts/prepare-texture.mjs assets/textures/path-source.jpg public/assets/textures/path.jpg 1024
node scripts/prepare-texture.mjs assets/textures/wood-source.jpg public/assets/textures/wood.jpg 1024
node scripts/prepare-texture.mjs "assets/models/Downtown City MegaKit[Standard]/Textures/T_RedBrick_BaseColor.png" public/assets/textures/brick.jpg 1024
node scripts/prepare-texture.mjs "assets/models/Downtown City MegaKit[Standard]/Textures/T_RoofSlate_BaseColor.png" public/assets/textures/roof.jpg 1024
```

(Use your real source file names.)

**Step 5: Convert the models**

For each model, export or copy a `.glb` of just that tree or bush, then shrink it. Run `npx @gltf-transform/cli resize --help` first if a flag below differs in your version.

```bash
for m in tree-round tree-pine bush; do
  npx @gltf-transform/cli resize assets/models/$m-source.glb /tmp/$m-a.glb --width 512 --height 512
  npx @gltf-transform/cli dedup /tmp/$m-a.glb /tmp/$m-b.glb
  npx @gltf-transform/cli prune /tmp/$m-b.glb public/assets/models/$m.glb
done
ls -la public/assets/models public/assets/textures
```

Expected: each model under about 1.5 MB, each texture under about 400 KB. Open each `.glb` at https://gltf-viewer.donmccurdy.com/ and check it looks right and faces +z.

**Step 6: Add the licence records**

Add one record per source pack to `ASSET_RECORDS` in `src/data/licences.js`, with the real author, source link, licence text, and `credit` (null for CC0, the required line for CC-BY). Example for the kit textures:

```js
{
  files: ['textures/brick.jpg', 'textures/roof.jpg'],
  author: 'Quaternius (Downtown City MegaKit, free standard version)',
  source: 'https://quaternius.com/',
  licence: 'CC0-1.0',
  licenceText: 'CC0 1.0 Universal (CC0 1.0) Public Domain Dedication https://creativecommons.org/publicdomain/zero/1.0/',
  credit: null,
  checked: '2026-11-08',
},
```

Add the same kind of record for `textures/grass.jpg`, `textures/path.jpg`, `textures/wood.jpg` and for `models/tree-round.glb`, `models/tree-pine.glb`, `models/bush.glb`.

**Step 7: Run the tests**

Run: `npm test`
Expected: PASS, including `licences.test.js` (every file has a record) and `budget.test.js`.

**Step 8: Commit**

```bash
git add scripts/prepare-texture.mjs public/assets src/data/licences.js tests/budget.test.js package.json package-lock.json
git commit -m "feat: add textures and plant models with licence records"
```

---

### Task 4: New layout and walkable-area checks

**Delivers:** US-2, US-3, US-4; FR-5 (path position), FR-6, FR-7, FR-10, FR-11; AC-2.2 (walkable part), AC-3.1, AC-3.3, AC-4.3, AC-4.4, AC-4.5, AC-4.6, AC-4.7.

**Files:**
- Create: `src/logic/walkable.js`
- Modify: `src/world/layout.js`
- Create: `tests/layout.test.js`
- Modify: `src/world/scene.js` only enough to compile (Task 7 rewrites it; see Step 6)

**Step 1: Write the failing tests**

```js
// tests/layout.test.js
import { describe, it, expect } from 'vitest';
import { hitsSolid, resolveMove } from '../src/logic/collision.js';
import { walkableArea, reachesWithin } from '../src/logic/walkable.js';
import {
  BOUNDS, SOLIDS, SPAWN, CHARACTER_SPOT, HOUSE, DOOR, PATH, FLOWER_BEDS,
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
      SOLIDS, BOUNDS,
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
    expect(new Set(kinds('tree').map((t) => t.shape)).size).toBeGreaterThanOrEqual(2);
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
  it('lets a person reach the character, who stands outside the house in a fixed spot (AC-4.4)', () => {
    const c = SOLIDS.find((s) => s.kind === 'character');
    expect([c.x, c.z]).toEqual([CHARACTER_SPOT.x, CHARACTER_SPOT.z]);
    expect(CHARACTER_SPOT.z).toBeGreaterThan(HOUSE.z + HOUSE.d / 2);
    expect(reachesWithin(SPAWN, CHARACTER_SPOT, 1.2, SOLIDS, BOUNDS)).toBe(true);
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
    expect(e({ x: 10, z: 0 }, { x: 12, z: 0 }).x).toBeLessThanOrEqual(BOUNDS.maxX);
    expect(e({ x: -10, z: 0 }, { x: -12, z: 0 }).x).toBeGreaterThanOrEqual(BOUNDS.minX);
    expect(e({ x: 0, z: 10 }, { x: 0, z: 12 }).z).toBeLessThanOrEqual(BOUNDS.maxZ);
    expect(e({ x: 0, z: -10 }, { x: 0, z: -12 }).z).toBeGreaterThanOrEqual(BOUNDS.minZ);
  });
  it('lets a person walk over a flower bed', () => {
    for (const b of FLOWER_BEDS) {
      expect(SOLIDS.some((s) => s.id === b.id)).toBe(false);
      expect(hitsSolid(b.x, b.z, SOLIDS, 0.3), b.id).toBe(false);
    }
  });
});
```

Run: `npx vitest run tests/layout.test.js` — Expected: FAIL (`walkable.js` does not exist).

**Step 2: Write `src/logic/walkable.js`**

```js
import { hitsSolid } from './collision.js';

// Area inside the bounds that no solid covers, counted on a grid (AC-4.3).
export function walkableArea(solids, bounds, cell = 0.1) {
  const nx = Math.round((bounds.maxX - bounds.minX) / cell);
  const nz = Math.round((bounds.maxZ - bounds.minZ) / cell);
  let free = 0;
  for (let i = 0; i < nx; i++) {
    const x = bounds.minX + (i + 0.5) * cell;
    for (let j = 0; j < nz; j++) {
      const z = bounds.minZ + (j + 0.5) * cell;
      const covered = solids.some(
        (s) => Math.abs(x - s.x) < s.w / 2 && Math.abs(z - s.z) < s.d / 2,
      );
      if (!covered) free++;
    }
  }
  return free * cell * cell;
}

// True when a person of this radius can walk from `from` to a spot within `dist` of `target` (AC-4.4).
export function reachesWithin(from, target, dist, solids, bounds, radius = 0.3, cell = 0.2) {
  const key = (x, z) => `${Math.round(x / cell)},${Math.round(z / cell)}`;
  const seen = new Set([key(from.x, from.z)]);
  const queue = [{ x: from.x, z: from.z }];
  while (queue.length) {
    const p = queue.shift();
    if (Math.hypot(p.x - target.x, p.z - target.z) <= dist) return true;
    for (const [dx, dz] of [[cell, 0], [-cell, 0], [0, cell], [0, -cell]]) {
      const x = p.x + dx;
      const z = p.z + dz;
      if (x < bounds.minX + radius || x > bounds.maxX - radius) continue;
      if (z < bounds.minZ + radius || z > bounds.maxZ - radius) continue;
      const k = key(x, z);
      if (seen.has(k) || hitsSolid(x, z, solids, radius)) continue;
      seen.add(k);
      queue.push({ x, z });
    }
  }
  return false;
}
```

**Step 3: Rewrite `src/world/layout.js`**

Boundary, spawn and character spot stay. The numbers below leave 37.32 m² covered against the phase 1 total of 39.52 m².

```js
export const BOUNDS = { minX: -11, maxX: 11, minZ: -11, maxZ: 11 };
export const SPAWN = { x: 0, z: 6 };
export const CHARACTER_SPOT = { x: 3, z: -1 };

// Two floors, one gable roof. The door and windows are on the garden (+z) side.
export const HOUSE = { x: 0, z: -7.5, w: 5.5, d: 4.5, floors: 2, wallHeight: 5, roofHeight: 1.8 };
export const DOOR = { x: 0, z: HOUSE.z + HOUSE.d / 2 };

// The path from the street to the door. Not a solid.
export const PATH = { x: 0, z0: DOOR.z, z1: 9, w: 1.4 };

// Flower beds are drawn but never block walking (AC-4.7).
export const FLOWER_BEDS = [
  { id: 'bed-left', x: -2.5, z: -3, w: 2, d: 1 },
  { id: 'bed-right', x: 2.5, z: -3, w: 2, d: 1 },
];

// kind: house | fence | furniture | tree | bush | hedge | character
// Collision uses w and d only. h and shape are for drawing.
export const SOLIDS = [
  { id: 'house', kind: 'house', x: HOUSE.x, z: HOUSE.z, w: HOUSE.w, d: HOUSE.d, h: HOUSE.wallHeight, color: '#e8c9a0' },
  { id: 'fence-left', kind: 'fence', x: -8, z: -2, w: 0.2, d: 10, h: 1, color: '#f2e3c6' },
  { id: 'fence-right', kind: 'fence', x: 8, z: -2, w: 0.2, d: 10, h: 1, color: '#f2e3c6' },
  { id: 'bench', kind: 'furniture', item: 'bench', x: -4, z: -2, w: 1.6, d: 0.6, h: 0.9, color: '#8b5a2b' },
  { id: 'table', kind: 'furniture', item: 'table', x: 5, z: -4, w: 1.2, d: 1.2, h: 0.8, color: '#a9743b' },
  { id: 'planter', kind: 'furniture', item: 'planter', x: -5, z: -5, w: 2, d: 0.6, h: 0.5, color: '#7a4b2a' },
  { id: 'tree-1', kind: 'tree', shape: 'round', x: -5, z: 3, w: 0.5, d: 0.5, h: 4, color: '#5c4033' },
  { id: 'tree-2', kind: 'tree', shape: 'pine', x: 6, z: 3, w: 0.5, d: 0.5, h: 5, color: '#5c4033' },
  { id: 'tree-3', kind: 'tree', shape: 'pine', x: -6.5, z: 7, w: 0.5, d: 0.5, h: 4.5, color: '#5c4033' },
  { id: 'tree-4', kind: 'tree', shape: 'round', x: 7, z: 8, w: 0.5, d: 0.5, h: 4.2, color: '#5c4033' },
  { id: 'tree-5', kind: 'tree', shape: 'pine', x: -9.5, z: -8, w: 0.5, d: 0.5, h: 5, color: '#5c4033' },
  { id: 'tree-6', kind: 'tree', shape: 'round', x: 9.5, z: -8, w: 0.5, d: 0.5, h: 4, color: '#5c4033' },
  { id: 'bush-1', kind: 'bush', x: -2.5, z: -4.6, w: 0.6, d: 0.6, h: 0.8, color: '#4f7a3a' },
  { id: 'bush-2', kind: 'bush', x: 2.5, z: -4.6, w: 0.6, d: 0.6, h: 0.8, color: '#4f7a3a' },
  { id: 'bush-3', kind: 'bush', x: -6.8, z: 6, w: 0.6, d: 0.6, h: 0.8, color: '#4f7a3a' },
  { id: 'hedge-1', kind: 'hedge', x: 5, z: -9.6, w: 3.5, d: 0.5, h: 1.1, color: '#4f7a3a' },
  { id: 'character', kind: 'character', ...CHARACTER_SPOT, w: 0.8, d: 0.8 },
];
```

**Step 4: Run the layout tests**

Run: `npx vitest run tests/layout.test.js`
Expected: PASS. If the walkable-area test fails, shrink a collision box (for example the table or hedge) rather than the boundary; keep the counts. If "reaches the character" fails, a solid blocks the way: move it.

**Step 5: Fix the older test that names `tree-1` style kinds**

Run: `npm test`
`tests/collision.test.js` still passes (same exports). Fix anything else that fails because `kind: 'tree'` entries now have different sizes.

**Step 6: Keep the old scene compiling until Task 7**

`scene.js` `drawSolid` still reads `s.kind`/`s.id`. The house roof test is `s.id === 'house'`, still true. Run `npm run dev` and check the old scene still loads (some objects look wrong; that is expected until Tasks 7 to 11).

**Step 7: Commit**

```bash
git add src/logic/walkable.js src/world/layout.js tests/layout.test.js
git commit -m "feat: new world layout with walkable-area and blocking tests"
```

---

### Task 5: Asset loader with fallbacks and a 30-second limit

**Delivers:** US-8; FR-15 (limit), FR-16 (logic); AC-8.3, AC-8.4, AC-8.5, AC-8.6 (logic part).

**Files:**
- Create: `src/world/assetLoader.js`
- Create: `tests/assetLoader.test.js`

**Step 1: Write the failing test**

```js
import { describe, it, expect, vi } from 'vitest';
import { loadAssets, failureMessage, LOAD_TIMEOUT_MS } from '../src/world/assetLoader.js';

const manifest = [
  { id: 'grass', type: 'texture', url: '/g.jpg' },
  { id: 'tree', type: 'model', url: '/t.glb' },
];

describe('loadAssets (FR-16)', () => {
  it('returns every loaded value', async () => {
    const r = await loadAssets(manifest, {
      texture: async () => 'T',
      model: async () => 'M',
    });
    expect(r.values.get('grass')).toBe('T');
    expect(r.values.get('tree')).toBe('M');
    expect(r.failed).toEqual([]);
    expect(r.stalled).toBe(false);
  });

  it('lists a failed file and still resolves (AC-8.3)', async () => {
    const r = await loadAssets(manifest, {
      texture: async () => { throw new Error('404'); },
      model: async () => 'M',
    });
    expect(r.failed).toEqual(['grass']);
    expect(r.values.has('grass')).toBe(false);
    expect(r.values.get('tree')).toBe('M');
  });

  it('survives every file failing, the character included (AC-8.4)', async () => {
    const withCharacter = [...manifest, { id: 'character', type: 'model', url: '/c.glb' }];
    const r = await loadAssets(withCharacter, {
      texture: async () => { throw new Error('x'); },
      model: async () => { throw new Error('x'); },
    });
    expect(r.failed.sort()).toEqual(['character', 'grass', 'tree']);
    expect(r.values.size).toBe(0);
  });

  it('counts a file that has not loaded after 30 seconds as failed (AC-8.6)', async () => {
    vi.useFakeTimers();
    const never = () => new Promise(() => {});
    const p = loadAssets(manifest, { texture: async () => 'T', model: never });
    await vi.advanceTimersByTimeAsync(LOAD_TIMEOUT_MS);
    const r = await p;
    expect(r.stalled).toBe(true);
    expect(r.failed).toEqual(['tree']);
    expect(r.values.get('grass')).toBe('T');
    vi.useRealTimers();
  });

  it('ignores a file that arrives after the limit', async () => {
    vi.useFakeTimers();
    let release;
    const late = new Promise((res) => { release = res; });
    const p = loadAssets([manifest[0]], { texture: () => late, model: async () => 'M' });
    await vi.advanceTimersByTimeAsync(LOAD_TIMEOUT_MS);
    const r = await p;
    release('T');
    await Promise.resolve();
    expect(r.values.has('grass')).toBe(false);
    vi.useRealTimers();
  });

  it('reports progress', async () => {
    const seen = [];
    await loadAssets(manifest, { texture: async () => 'T', model: async () => 'M' }, {
      onProgress: (done, total) => seen.push([done, total]),
    });
    expect(seen.at(-1)).toEqual([2, 2]);
  });
});

describe('failureMessage', () => {
  it('is empty when nothing failed', () => {
    expect(failureMessage({ failed: [], stalled: false })).toBe('');
  });
  it('tells what happened in short words', () => {
    expect(failureMessage({ failed: ['grass'], stalled: false })).toMatch(/could not be loaded/i);
    expect(failureMessage({ failed: ['tree'], stalled: true })).toMatch(/too long/i);
  });
});
```

Run: `npx vitest run tests/assetLoader.test.js` — Expected: FAIL (module missing).

**Step 2: Write `src/world/assetLoader.js`**

```js
// Loads every file of the manifest. Never rejects: a file that fails, or has not loaded after the
// limit, is listed in `failed` and the caller draws a plain colour or block for it (FR-16).
// This file must not import aframe, so it runs in unit tests.
export const LOAD_TIMEOUT_MS = 30000;

export function loadAssets(manifest, loaders, { timeoutMs = LOAD_TIMEOUT_MS, onProgress } = {}) {
  return new Promise((resolve) => {
    const values = new Map();
    const failed = [];
    const pending = new Set(manifest.map((a) => a.id));
    let finished = false;
    let timer = null;

    const finish = (stalled) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      for (const id of pending) failed.push(id);
      resolve({ values, failed, stalled });
    };

    const settle = (id) => {
      pending.delete(id);
      onProgress?.(manifest.length - pending.size, manifest.length);
      if (pending.size === 0) finish(false);
    };

    if (manifest.length === 0) return finish(false);
    timer = setTimeout(() => finish(true), timeoutMs);

    for (const asset of manifest) {
      Promise.resolve()
        .then(() => loaders[asset.type](asset.url))
        .then(
          (value) => {
            if (finished) return;
            values.set(asset.id, value);
            settle(asset.id);
          },
          () => {
            if (finished) return;
            failed.push(asset.id);
            settle(asset.id);
          },
        );
    }
  });
}

export function failureMessage({ failed, stalled }) {
  if (stalled)
    return 'Some parts of the place took too long to load. Plain colours and shapes are shown where they are missing.';
  if (failed.length > 0)
    return 'Some parts of the place could not be loaded. Plain colours and shapes are shown where they are missing.';
  return '';
}
```

**Step 3: Run the tests**

Run: `npx vitest run tests/assetLoader.test.js`
Expected: PASS.

**Step 4: Commit**

```bash
git add src/world/assetLoader.js tests/assetLoader.test.js
git commit -m "feat: asset loader that never rejects and gives up after 30 seconds"
```

---

### Task 6: Loading indicator and message in the page flow

**Delivers:** US-8; FR-15, FR-16 (the short message); AC-8.1, AC-8.2.

**Files:**
- Modify: `src/ui/screens.js`, `src/ui/styles.css`, `src/main.js`
- Create: `tests/loading.test.js`

**Step 1: Write the failing test**

```js
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';

let release;
vi.mock('../src/ui/styles.css', () => ({}));

const tick = (ms = 20) => new Promise((r) => setTimeout(r, ms));

async function boot(mount) {
  vi.resetModules();
  vi.doMock('../src/world/scene.js', async () => ({ mountWorld: mount }));
  document.body.innerHTML = '<div id="app"></div>';
  await import('../src/main.js');
  await tick();
}

beforeEach(() => {
  localStorage.clear();
  Object.defineProperty(navigator, 'userAgent', { value: 'Mozilla/5.0 Chrome/120', configurable: true });
  HTMLCanvasElement.prototype.getContext = () => ({});
});

describe('loading indicator (FR-15)', () => {
  it('shows from the moment the person chooses and goes when the place is ready (AC-8.1, AC-8.2)', async () => {
    const gate = new Promise((r) => { release = r; });
    await boot(async (container) => {
      await gate;
      const el = document.createElement('div');
      el.className = 'world';
      container.appendChild(el);
      return { destroy: () => el.remove() };
    });
    document.querySelector('[data-choice="try-out"]').click();
    await tick();
    expect(document.querySelector('.loading')).not.toBeNull();
    release();
    await tick();
    expect(document.querySelector('.loading')).toBeNull();
    expect(document.querySelector('.world')).not.toBeNull();
  });

  it('removes the indicator after 30 seconds even when the place never gets ready (AC-8.6)', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    await boot(() => new Promise(() => {}));
    document.querySelector('[data-choice="try-out"]').click();
    await vi.advanceTimersByTimeAsync(50);
    expect(document.querySelector('.loading')).not.toBeNull();
    await vi.advanceTimersByTimeAsync(30000);
    expect(document.querySelector('.loading')).toBeNull();
    vi.useRealTimers();
  });

  it('shows the short message when assets failed (AC-8.3)', async () => {
    await boot(async (container) => {
      const el = document.createElement('div');
      el.className = 'world';
      container.appendChild(el);
      return { destroy: () => el.remove(), warning: 'Some parts of the place could not be loaded.' };
    });
    document.querySelector('[data-choice="try-out"]').click();
    await tick();
    expect(document.querySelector('.notice').textContent).toMatch(/could not be loaded/);
  });
});
```

Run: `npx vitest run tests/loading.test.js` — Expected: FAIL (no `.loading`).

**Step 2: Add `renderLoading` to `src/ui/screens.js`** (next to `renderWorldOverlay`)

```js
// Full-screen "loading" cover. Returns the element; the caller removes it (FR-15).
export function renderLoading(root) {
  const el = h(
    'div',
    { class: 'loading', role: 'status', 'aria-live': 'polite' },
    h('div', { class: 'spinner', 'aria-hidden': 'true' }),
    h('p', {}, 'Loading the place…'),
  );
  root.append(el);
  return el;
}
```

**Step 3: Add the styles** (end of `src/ui/styles.css`)

```css
.loading {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f6d9a8;
}
.spinner {
  width: 2.5rem;
  height: 2.5rem;
  border: 0.3rem solid rgba(0, 0, 0, 0.15);
  border-top-color: #8b5a2b;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
```

**Step 4: Change `enterWorld` in `src/main.js`**

Add `renderLoading` to the import from `./ui/screens.js`, then replace `enterWorld`:

```js
const LOADING_LIMIT_MS = 30000;

async function enterWorld(character, { notice = null } = {}) {
  const token = ++screenToken;
  // The cover shows at once and goes when the place is ready or after 30 seconds (FR-15).
  const loading = renderLoading(document.body);
  const limit = setTimeout(() => loading.remove(), LOADING_LIMIT_MS);
  try {
    const { mountWorld } = await import('./world/scene.js');
    if (token !== screenToken) return;
    leaveWorld();
    app.replaceChildren();
    const stats = new URLSearchParams(window.location.search).has('stats');
    const mounted = await mountWorld(app, character, { stats });
    if (token !== screenToken) {
      mounted.destroy();
      return;
    }
    world = mounted;
    renderWorldOverlay(app, {
      notice: [notice, mounted.warning].filter(Boolean).join(' ') || null,
      showHint: !isHintSeen(storage),
      onDismissHint: () => markHintSeen(storage),
      onBack: showStart,
    });
  } catch (error) {
    console.error(error);
    if (token !== screenToken) return;
    leaveWorld();
    renderMessage(
      app,
      'The place could not be loaded. Reload the page to try again.',
    );
  } finally {
    clearTimeout(limit);
    loading.remove();
  }
}
```

**Step 5: Run all tests**

Run: `npm test`
Expected: PASS, including `main-flow.test.js` (its mock returns no `warning`; `[notice, undefined].filter(Boolean)` is fine).

**Step 6: Commit**

```bash
git add src/ui src/main.js tests/loading.test.js
git commit -m "feat: loading indicator and failed-asset message in the page flow"
```

---

### Task 7: Builder foundation, sky, clouds, ground and path

**Delivers:** US-1, US-2; FR-1, FR-2, FR-3, FR-4, FR-5 (drawing), FR-14 (clouds); AC-1.1, AC-1.2, AC-1.3, AC-2.1, AC-2.2, AC-7.2.

**Files:**
- Create: `src/world/builders/common.js`, `sky.js`, `ground.js`
- Create: `tests/builders-sky-ground.test.js`

All builders take `THREE` as the first argument so tests can use the `three` dev dependency and the scene can pass `AFRAME.THREE`. Builders must never throw when an asset is missing (FR-16).

**Step 1: Write the failing test**

```js
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { makeAssets } from '../src/world/builders/common.js';
import { buildSky, buildClouds, SKY } from '../src/world/builders/sky.js';
import { buildGround, buildPath } from '../src/world/builders/ground.js';
import { PATH } from '../src/world/layout.js';

const none = makeAssets(new Map());

function colourAt(sky, pick) {
  const mesh = sky.children[0];
  const pos = mesh.geometry.attributes.position;
  const col = mesh.geometry.attributes.color;
  const out = [];
  for (let i = 0; i < pos.count; i++) if (pick(pos.getY(i))) out.push([col.getX(i), col.getY(i), col.getZ(i)]);
  return out[0];
}

describe('sky (FR-1, FR-3)', () => {
  const sky = buildSky(THREE);
  it('is a blue gradient, lighter at the horizon and deeper overhead (AC-1.1)', () => {
    const horizon = colourAt(sky, (y) => Math.abs(y) < 1);
    const top = colourAt(sky, (y) => y > SKY.radius - 1);
    const luma = (c) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    expect(luma(horizon)).toBeGreaterThan(luma(top));
    expect(top[2]).toBeGreaterThan(top[0]); // blue beats red overhead
  });
  it('uses the horizon colour below the horizon, so no empty edge shows (AC-1.3)', () => {
    const below = colourAt(sky, (y) => y < -SKY.radius + 1);
    const horizon = colourAt(sky, (y) => Math.abs(y) < 1);
    expect(below).toEqual(horizon);
  });
});

describe('clouds (FR-2, FR-14)', () => {
  it('has at least one cloud that drifts (AC-1.2, AC-7.2)', () => {
    const clouds = buildClouds(THREE);
    expect(clouds.children.length).toBeGreaterThanOrEqual(1);
    const before = clouds.rotation.y;
    clouds.userData.update(10);
    expect(clouds.rotation.y).not.toBe(before);
  });
  it('drifts slowly: under 0.01 radians per second', () => {
    const clouds = buildClouds(THREE);
    clouds.userData.update(0);
    const a = clouds.rotation.y;
    clouds.userData.update(1);
    expect(Math.abs(clouds.rotation.y - a)).toBeLessThan(0.01);
  });
});

describe('ground (FR-3, FR-4, FR-5)', () => {
  it('reaches well beyond the horizon fog, so no edge shows', () => {
    const g = buildGround(THREE, none);
    expect(g.geometry.parameters.width).toBeGreaterThanOrEqual(600);
  });
  it('uses a plain colour when the grass texture is missing (FR-16)', () => {
    const g = buildGround(THREE, none);
    expect(g.material.map).toBeNull();
  });
  it('uses the grass texture when it is there, repeated', () => {
    const tex = new THREE.Texture();
    const g = buildGround(THREE, makeAssets(new Map([['grass', tex]])));
    expect(g.material.map).not.toBeNull();
    expect(g.material.map.repeat.x).toBeGreaterThan(1);
  });
  it('draws a path from the street to the door', () => {
    const p = buildPath(THREE, none);
    expect(p.geometry.parameters.width).toBeCloseTo(PATH.w);
    expect(p.geometry.parameters.height).toBeCloseTo(PATH.z1 - PATH.z0);
  });
});
```

Run: `npx vitest run tests/builders-sky-ground.test.js` — Expected: FAIL.

**Step 2: Write `src/world/builders/common.js`**

```js
// Shared helpers. No import of aframe: THREE is passed in.

// assets: { texture(id), model(id), gltf(id) } built from the loader's result (null when missing).
export function makeAssets(values) {
  return {
    texture: (id) => (values.get(id)?.isTexture ? values.get(id) : null),
    gltf: (id) => values.get(id) ?? null,
    model: (id) => values.get(id)?.scene ?? null,
  };
}

// A material that uses the texture when it loaded and a plain colour when it did not (FR-16).
export function surface(THREE, assets, textureId, fallback, { repeat, tint } = {}) {
  const tex = assets.texture(textureId);
  if (!tex) return new THREE.MeshStandardMaterial({ color: fallback, roughness: 1 });
  const map = tex.clone();
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  if (repeat) map.repeat.set(repeat[0], repeat[1]);
  map.needsUpdate = true;
  return new THREE.MeshStandardMaterial({ map, color: tint ?? 0xffffff, roughness: 1 });
}

export function box(THREE, w, h, d, material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z);
  return m;
}

// A plain block in the place of a solid whose model failed. It has the solid's footprint (FR-16).
export function plainBlock(THREE, solid, label = 'plain') {
  const g = new THREE.Group();
  g.position.set(solid.x, 0, solid.z);
  g.userData.kind = solid.kind;
  g.userData.plain = label;
  g.add(
    box(THREE, solid.w, solid.h ?? 1, solid.d, new THREE.MeshStandardMaterial({ color: solid.color ?? '#c9b8a0' }), 0, (solid.h ?? 1) / 2, 0),
  );
  return g;
}

// Scales a model to a height and stands it on y = 0. Returns a wrapper group.
export function fitToHeight(THREE, object, height) {
  const wrapper = new THREE.Group();
  wrapper.add(object);
  const size = new THREE.Box3().setFromObject(object).getSize(new THREE.Vector3());
  if (size.y > 0) object.scale.multiplyScalar(height / size.y);
  const bounds = new THREE.Box3().setFromObject(object);
  object.position.y -= bounds.min.y;
  const centre = bounds.getCenter(new THREE.Vector3());
  object.position.x -= centre.x;
  object.position.z -= centre.z;
  return wrapper;
}

// A small stable number from a string, for varying rotation and sway between objects.
export function hash(text) {
  let h = 0;
  for (const c of text) h = (h * 31 + c.charCodeAt(0)) % 1000;
  return h / 1000;
}
```

**Step 3: Write `src/world/builders/sky.js`**

```js
export const SKY = { radius: 400, horizon: '#cfe6f5', zenith: '#3f86d0' };

// A big inside-out sphere. Colour runs from the horizon colour up to the deeper blue overhead.
// Everything at or below the horizon uses the horizon colour, which is also the fog colour (FR-1, FR-3).
export function buildSky(THREE) {
  const geometry = new THREE.SphereGeometry(SKY.radius, 32, 24);
  const horizon = new THREE.Color(SKY.horizon);
  const zenith = new THREE.Color(SKY.zenith);
  const colours = [];
  const pos = geometry.attributes.position;
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const t = Math.max(0, pos.getY(i) / SKY.radius);
    c.copy(horizon).lerp(zenith, Math.pow(t, 0.6));
    colours.push(c.r, c.g, c.b);
  }
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colours, 3));
  const material = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.renderOrder = -1;
  const group = new THREE.Group();
  group.add(mesh);
  return group;
}

// A few puffy clouds made of white spheres. The whole group turns slowly around the place (FR-2, FR-14).
export function buildClouds(THREE, { count = 8 } = {}) {
  const group = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.92, fog: false });
  for (let i = 0; i < count; i++) {
    const cloud = new THREE.Group();
    const puffs = 4 + (i % 3);
    for (let p = 0; p < puffs; p++) {
      const s = 10 + ((i * 7 + p * 5) % 9);
      const puff = new THREE.Mesh(new THREE.SphereGeometry(s, 10, 8), material);
      puff.position.set(p * 11 - puffs * 5, ((p % 2) * 3), (p % 3) * 4);
      puff.scale.y = 0.55;
      cloud.add(puff);
    }
    const angle = (i / count) * Math.PI * 2;
    const radius = 150 + (i % 3) * 40;
    cloud.position.set(Math.cos(angle) * radius, 55 + (i % 4) * 12, Math.sin(angle) * radius);
    cloud.rotation.y = -angle;
    group.add(cloud);
  }
  // 0.004 radians per second: a full turn takes about 26 minutes. Calm, not distracting.
  group.userData.update = (seconds) => {
    group.rotation.y = seconds * 0.004;
  };
  return group;
}
```

**Step 4: Write `src/world/builders/ground.js`**

```js
import { surface } from './common.js';
import { PATH } from '../layout.js';

const GROUND_SIZE = 600; // far beyond the fog, so the ground never ends in view (FR-3)
const GRASS_METRES_PER_TILE = 4;

export function buildGround(THREE, assets) {
  const tiles = GROUND_SIZE / GRASS_METRES_PER_TILE;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(GROUND_SIZE, GROUND_SIZE),
    surface(THREE, assets, 'grass', '#8fae6b', { repeat: [tiles, tiles] }),
  );
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
}

export function buildPath(THREE, assets) {
  const length = PATH.z1 - PATH.z0;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(PATH.w, length),
    surface(THREE, assets, 'path', '#c9b79c', { repeat: [PATH.w / 1.5, length / 1.5] }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(PATH.x, 0.02, (PATH.z0 + PATH.z1) / 2);
  return mesh;
}
```

**Step 5: Run the tests**

Run: `npx vitest run tests/builders-sky-ground.test.js`
Expected: PASS.

**Step 6: Commit**

```bash
git add src/world/builders tests/builders-sky-ground.test.js
git commit -m "feat: sky, clouds, grass ground and path builders"
```

---

### Task 8: Trees, bushes, flower beds and hedge

**Delivers:** US-3; FR-6, FR-7, FR-14 (trees); AC-3.1, AC-3.2, AC-3.3, AC-7.1, AC-8.5 (block part).

**Files:**
- Create: `src/world/builders/plants.js`
- Create: `tests/builders-plants.test.js`

**Step 1: Write the failing test**

```js
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { makeAssets } from '../src/world/builders/common.js';
import { buildTree, buildBush, buildHedge, buildFlowerBed } from '../src/world/builders/plants.js';
import { SOLIDS, FLOWER_BEDS } from '../src/world/layout.js';

const tree = SOLIDS.find((s) => s.kind === 'tree');
const fakeGltf = () => {
  const scene = new THREE.Group();
  scene.add(new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1), new THREE.MeshStandardMaterial()));
  return { scene };
};

describe('trees (FR-6)', () => {
  it('stands a loaded model at the solid, scaled to its height', () => {
    const t = buildTree(THREE, makeAssets(new Map([['tree-round', fakeGltf()], ['tree-pine', fakeGltf()]])), tree);
    expect(t.position.x).toBe(tree.x);
    expect(t.userData.plain).toBeUndefined();
    const box = new THREE.Box3().setFromObject(t);
    expect(box.max.y - box.min.y).toBeCloseTo(tree.h, 1);
  });
  it('puts a plain block with the solid footprint in place of a failed model (AC-8.5)', () => {
    const t = buildTree(THREE, makeAssets(new Map()), tree);
    expect(t.userData.plain).toBeDefined();
    const box = new THREE.Box3().setFromObject(t);
    expect(box.max.x - box.min.x).toBeCloseTo(tree.w);
  });
  it('sways gently (AC-7.1): under 1 degree', () => {
    const t = buildTree(THREE, makeAssets(new Map([['tree-round', fakeGltf()], ['tree-pine', fakeGltf()]])), tree);
    let max = 0;
    for (let s = 0; s < 20; s += 0.25) {
      t.userData.update(s);
      max = Math.max(max, Math.abs(t.rotation.z));
    }
    expect(max).toBeGreaterThan(0);
    expect(max).toBeLessThan((1 * Math.PI) / 180);
  });
  it('does not sway when it is a plain block', () => {
    const t = buildTree(THREE, makeAssets(new Map()), tree);
    expect(t.userData.update).toBeUndefined();
  });
});

describe('bushes, hedge, flower beds (FR-7)', () => {
  const bush = SOLIDS.find((s) => s.kind === 'bush');
  const hedge = SOLIDS.find((s) => s.kind === 'hedge');
  it('draws a bush from the model, or a plain block when it failed', () => {
    expect(buildBush(THREE, makeAssets(new Map([['bush', fakeGltf()]])), bush).userData.plain).toBeUndefined();
    expect(buildBush(THREE, makeAssets(new Map()), bush).userData.plain).toBeDefined();
  });
  it('draws a hedge longer than it is tall, with or without the texture', () => {
    for (const assets of [makeAssets(new Map()), makeAssets(new Map([['grass', new THREE.Texture()]]))]) {
      const box = new THREE.Box3().setFromObject(buildHedge(THREE, assets, hedge));
      expect(box.max.x - box.min.x).toBeGreaterThan(box.max.y - box.min.y);
    }
  });
  it('draws flowers on every flower bed, and the bed has no collision data', () => {
    for (const bed of FLOWER_BEDS) {
      const g = buildFlowerBed(THREE, bed);
      expect(g.children.length).toBeGreaterThan(10);
      expect(g.userData.kind).toBe('flower-bed');
    }
  });
});
```

Run: `npx vitest run tests/builders-plants.test.js` — Expected: FAIL.

**Step 2: Write `src/world/builders/plants.js`**

```js
import { box, fitToHeight, hash, plainBlock, surface } from './common.js';

const SWAY_RADIANS = (0.7 * Math.PI) / 180; // under one degree: gentle (FR-14)

function fromModel(THREE, assets, modelId, solid) {
  const gltf = assets.model(modelId);
  if (!gltf) return plainBlock(THREE, solid, modelId);
  const g = new THREE.Group();
  g.position.set(solid.x, 0, solid.z);
  g.userData.kind = solid.kind;
  g.rotation.y = hash(solid.id) * Math.PI * 2;
  g.add(fitToHeight(THREE, gltf.clone(true), solid.h));
  return g;
}

export function buildTree(THREE, assets, solid) {
  const g = fromModel(THREE, assets, `tree-${solid.shape}`, solid);
  if (!g.userData.plain) {
    const phase = hash(solid.id) * Math.PI * 2;
    g.userData.update = (seconds) => {
      g.rotation.z = Math.sin(seconds * 0.9 + phase) * SWAY_RADIANS;
    };
  }
  return g;
}

export function buildBush(THREE, assets, solid) {
  return fromModel(THREE, assets, 'bush', solid);
}

// A dense dark-green block with the grass texture, longer than it is tall.
export function buildHedge(THREE, assets, solid) {
  const g = new THREE.Group();
  g.position.set(solid.x, 0, solid.z);
  g.userData.kind = 'hedge';
  const material = surface(THREE, assets, 'grass', solid.color, { repeat: [solid.w, 1], tint: '#4f7a3a' });
  g.add(box(THREE, solid.w, solid.h, solid.d, material, 0, solid.h / 2, 0));
  return g;
}

const FLOWER_COLOURS = ['#e8738f', '#f2c14e', '#ffffff', '#b58be0', '#f08a4b'];

// Soil with small flowers on it. A flower bed is never a solid (AC-4.7).
export function buildFlowerBed(THREE, bed) {
  const g = new THREE.Group();
  g.position.set(bed.x, 0, bed.z);
  g.userData.kind = 'flower-bed';
  g.add(box(THREE, bed.w, 0.12, bed.d, new THREE.MeshStandardMaterial({ color: '#5a3d28', roughness: 1 }), 0, 0.06, 0));
  const stem = new THREE.MeshStandardMaterial({ color: '#4f7a3a' });
  const cols = Math.floor(bed.w / 0.3);
  const rows = Math.floor(bed.d / 0.3);
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const x = -bed.w / 2 + 0.2 + i * 0.3 + ((j % 2) * 0.1);
      const z = -bed.d / 2 + 0.2 + j * 0.3;
      const h = 0.22 + ((i * 3 + j * 5) % 4) * 0.04;
      g.add(box(THREE, 0.02, h, 0.02, stem, x, 0.12 + h / 2, z));
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.07, 8, 6),
        new THREE.MeshStandardMaterial({ color: FLOWER_COLOURS[(i + j * 2) % FLOWER_COLOURS.length] }),
      );
      head.position.set(x, 0.12 + h, z);
      g.add(head);
    }
  }
  return g;
}
```

**Step 3: Run the tests**

Run: `npx vitest run tests/builders-plants.test.js`
Expected: PASS. Flower beds are 2 by 1 m: `cols` 6 and `rows` 3 give 18 flowers = 36 meshes plus soil, above the test's 10.

**Step 4: Commit**

```bash
git add src/world/builders/plants.js tests/builders-plants.test.js
git commit -m "feat: tree, bush, hedge and flower bed builders"
```

---

### Task 9: The house

**Delivers:** US-4; FR-9, FR-10; AC-4.1, AC-4.2, AC-4.6.

**Files:**
- Create: `src/world/builders/house.js`
- Create: `tests/builders-house.test.js`

**Step 1: Write the failing test**

```js
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { makeAssets } from '../src/world/builders/common.js';
import { buildHouse } from '../src/world/builders/house.js';
import { HOUSE, DOOR } from '../src/world/layout.js';

const count = (root, kind) => {
  let n = 0;
  root.traverse((o) => { if (o.userData.part === kind) n++; });
  return n;
};
const textures = () => makeAssets(new Map(['brick', 'roof', 'wood'].map((id) => [id, new THREE.Texture()])));

describe('house (FR-9, FR-10)', () => {
  const house = buildHouse(THREE, textures());
  it('has walls, a sloped roof, one door and at least 4 windows on the garden side (AC-4.1)', () => {
    expect(count(house, 'walls')).toBe(1);
    expect(count(house, 'roof')).toBe(1);
    expect(count(house, 'door')).toBe(1);
    expect(count(house, 'window')).toBeGreaterThanOrEqual(4);
  });
  it('puts the door and every window on the garden side', () => {
    house.updateMatrixWorld(true);
    house.traverse((o) => {
      if (o.userData.part === 'door' || o.userData.part === 'window') {
        const p = new THREE.Vector3().setFromMatrixPosition(o.matrixWorld);
        expect(p.z).toBeGreaterThan(HOUSE.z + HOUSE.d / 2 - 0.2);
      }
    });
  });
  it('has the door at the door position', () => {
    house.updateMatrixWorld(true);
    let door;
    house.traverse((o) => { if (o.userData.part === 'door') door = o; });
    expect(new THREE.Vector3().setFromMatrixPosition(door.matrixWorld).x).toBeCloseTo(DOOR.x);
  });
  it('fits inside the footprint plus the roof overhang and slopes', () => {
    const box = new THREE.Box3().setFromObject(house);
    expect(box.max.x - box.min.x).toBeLessThanOrEqual(HOUSE.w + 1.2);
    const roof = [];
    house.traverse((o) => { if (o.userData.part === 'roof') roof.push(o); });
    const b = new THREE.Box3().setFromObject(roof[0]);
    expect(b.max.y - b.min.y).toBeGreaterThan(0.5);
  });
  it('is built with plain colours when every texture is missing (FR-16)', () => {
    expect(() => buildHouse(THREE, makeAssets(new Map()))).not.toThrow();
  });
});
```

Run: `npx vitest run tests/builders-house.test.js` — Expected: FAIL.

**Step 2: Write `src/world/builders/house.js`**

```js
import { box, surface } from './common.js';
import { HOUSE, DOOR } from '../layout.js';

// A gable roof. The ridge runs along x. Front slope faces the garden (+z).
function roofGeometry(THREE, hw, hd, rh, o) {
  const a = [-hw - o, 0, hd + o];
  const b = [hw + o, 0, hd + o];
  const c = [hw + o, rh, 0];
  const d = [-hw - o, rh, 0];
  const e = [hw + o, 0, -hd - o];
  const f = [-hw - o, 0, -hd - o];
  const pos = [...a, ...b, ...c, ...a, ...c, ...d, ...e, ...f, ...d, ...e, ...d, ...c];
  const uv = [0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1];
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}

// A triangle that fills the wall under the roof at one end.
function gableGeometry(THREE, x, hd, rh) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([x, 0, hd, x, 0, -hd, x, rh, 0], 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0.5, 1], 2));
  g.computeVertexNormals();
  return g;
}

function tag(object, part) {
  object.userData.part = part;
  return object;
}

export function buildHouse(THREE, assets) {
  const { w, d, wallHeight: wh, roofHeight: rh, floors } = HOUSE;
  const hw = w / 2;
  const hd = d / 2;
  const g = new THREE.Group();
  g.position.set(HOUSE.x, 0, HOUSE.z);
  g.userData.kind = 'house';

  const wallMaterial = () => surface(THREE, assets, 'brick', '#e8c9a0', { repeat: [w / 2, wh / 2] });
  g.add(tag(box(THREE, w, wh, d, wallMaterial(), 0, wh / 2, 0), 'walls'));

  const roofMaterial = surface(THREE, assets, 'roof', '#b5543a', { repeat: [w / 1.5, d / 1.5] });
  roofMaterial.side = THREE.DoubleSide;
  const roof = new THREE.Mesh(roofGeometry(THREE, hw, hd, rh, 0.4), roofMaterial);
  roof.position.y = wh;
  g.add(tag(roof, 'roof'));
  for (const x of [-hw, hw]) {
    const gable = new THREE.Mesh(gableGeometry(THREE, x, hd, rh), wallMaterial());
    gable.material.side = THREE.DoubleSide;
    gable.position.y = wh;
    g.add(gable);
  }

  const wood = () => surface(THREE, assets, 'wood', '#8b5a2b');
  const front = hd + 0.05; // just outside the garden wall
  const door = new THREE.Group();
  door.add(box(THREE, 1.0, 2.1, 0.1, wood(), 0, 1.05, 0));
  door.add(box(THREE, 1.2, 0.12, 0.14, wood(), 0, 2.16, 0)); // lintel
  door.position.set(DOOR.x - HOUSE.x, 0, front);
  g.add(tag(door, 'door'));

  const glass = new THREE.MeshStandardMaterial({ color: '#9cc7e8', roughness: 0.2, emissive: '#3b5a73', emissiveIntensity: 0.25 });
  const rowHeight = wh / floors;
  const windowXs = [-1.6, 1.6];
  for (let floor = 0; floor < floors; floor++) {
    const y = floor * rowHeight + rowHeight * 0.6;
    const xs = floor === 0 ? windowXs : [...windowXs, 0];
    for (const x of xs) {
      const win = new THREE.Group();
      win.add(box(THREE, 0.9, 1.1, 0.06, wood(), 0, 0, 0)); // frame
      win.add(box(THREE, 0.7, 0.9, 0.08, glass, 0, 0, 0.01)); // pane
      win.add(box(THREE, 1.05, 0.08, 0.16, wood(), 0, -0.6, 0.04)); // sill
      win.position.set(x, y, front);
      g.add(tag(win, 'window'));
    }
  }
  return g;
}
```

That gives 2 ground-floor and 3 upper-floor windows: 5 in total.

**Step 3: Run the tests**

Run: `npx vitest run tests/builders-house.test.js`
Expected: PASS.

**Step 4: Commit**

```bash
git add src/world/builders/house.js tests/builders-house.test.js
git commit -m "feat: textured two-floor house with door, windows and sloped roof"
```

---

### Task 10: Fences and garden furniture

**Delivers:** US-3, US-9; FR-8, FR-18; AC-3.4, AC-9.3 (drawing part).

**Files:**
- Create: `src/world/builders/furniture.js`
- Create: `tests/builders-furniture.test.js`

**Step 1: Write the failing test**

```js
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { makeAssets } from '../src/world/builders/common.js';
import { buildFence, buildFurniture } from '../src/world/builders/furniture.js';
import { SOLIDS } from '../src/world/layout.js';

const none = makeAssets(new Map());
const parts = (root, name) => { let n = 0; root.traverse((o) => { if (o.userData.part === name) n++; }); return n; };

describe('fences (FR-8, AC-3.4)', () => {
  const fence = SOLIDS.find((s) => s.id === 'fence-left');
  it('has posts and rails along its whole length', () => {
    const g = buildFence(THREE, none, fence);
    expect(parts(g, 'post')).toBeGreaterThanOrEqual(Math.floor(fence.d));
    expect(parts(g, 'rail')).toBeGreaterThanOrEqual(2);
    const box = new THREE.Box3().setFromObject(g);
    expect(box.max.z - box.min.z).toBeGreaterThanOrEqual(fence.d - 0.2);
  });
});

describe('furniture (FR-18)', () => {
  for (const id of ['bench', 'table', 'planter']) {
    it(`builds the ${id} from several parts, not one box, inside its footprint`, () => {
      const s = SOLIDS.find((x) => x.id === id);
      const g = buildFurniture(THREE, none, s);
      expect(g.children.length).toBeGreaterThan(2);
      const box = new THREE.Box3().setFromObject(g);
      expect(box.max.x - box.min.x).toBeLessThanOrEqual(s.w + 0.4);
      expect(g.position.x).toBe(s.x);
    });
  }
});
```

Run: `npx vitest run tests/builders-furniture.test.js` — Expected: FAIL.

**Step 2: Write `src/world/builders/furniture.js`**

```js
import { box, surface } from './common.js';

function tag(m, part) {
  m.userData.part = part;
  return m;
}

// Posts every metre and two rails, along the longer side (FR-8). Collision stays the solid's box.
export function buildFence(THREE, assets, solid) {
  const g = new THREE.Group();
  g.position.set(solid.x, 0, solid.z);
  g.userData.kind = 'fence';
  const alongZ = solid.d >= solid.w;
  const length = alongZ ? solid.d : solid.w;
  const wood = () => surface(THREE, assets, 'wood', solid.color, { repeat: [1, 1] });
  const posts = Math.floor(length) + 1;
  for (let i = 0; i < posts; i++) {
    const t = -length / 2 + (i * length) / (posts - 1);
    const post = alongZ ? box(THREE, 0.12, solid.h, 0.12, wood(), 0, solid.h / 2, t) : box(THREE, 0.12, solid.h, 0.12, wood(), t, solid.h / 2, 0);
    g.add(tag(post, 'post'));
  }
  for (const y of [solid.h * 0.35, solid.h * 0.75]) {
    const rail = alongZ ? box(THREE, 0.06, 0.1, length, wood(), 0, y, 0) : box(THREE, length, 0.1, 0.06, wood(), 0, y, 0);
    g.add(tag(rail, 'rail'));
  }
  return g;
}

export function buildFurniture(THREE, assets, solid) {
  const g = new THREE.Group();
  g.position.set(solid.x, 0, solid.z);
  g.userData.kind = 'furniture';
  const wood = () => surface(THREE, assets, 'wood', solid.color);
  const leg = (x, z, h) => box(THREE, 0.07, h, 0.07, wood(), x, h / 2, z);

  if (solid.item === 'bench') {
    const { w, d } = solid;
    g.add(box(THREE, w, 0.08, d, wood(), 0, 0.45, 0)); // seat
    g.add(box(THREE, w, 0.4, 0.06, wood(), 0, 0.75, -d / 2 + 0.05)); // backrest
    for (const x of [-w / 2 + 0.1, w / 2 - 0.1]) for (const z of [-d / 2 + 0.08, d / 2 - 0.08]) g.add(leg(x, z, 0.45));
  } else if (solid.item === 'table') {
    const { w, d } = solid;
    g.add(box(THREE, w, 0.06, d, wood(), 0, 0.77, 0)); // top
    for (const x of [-w / 2 + 0.08, w / 2 - 0.08]) for (const z of [-d / 2 + 0.08, d / 2 - 0.08]) g.add(leg(x, z, 0.77));
  } else {
    // planter: wooden trough, soil and a few green plants
    const { w, d, h } = solid;
    g.add(box(THREE, w, h, d, wood(), 0, h / 2, 0));
    g.add(box(THREE, w - 0.1, 0.06, d - 0.1, new THREE.MeshStandardMaterial({ color: '#4a3322', roughness: 1 }), 0, h + 0.01, 0));
    const leaf = new THREE.MeshStandardMaterial({ color: '#5f8f48' });
    for (let i = 0; i < 5; i++) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), leaf);
      s.position.set(-w / 2 + 0.3 + i * ((w - 0.6) / 4), h + 0.14, 0);
      g.add(s);
    }
  }
  return g;
}
```

**Step 3: Run the tests**

Run: `npx vitest run tests/builders-furniture.test.js`
Expected: PASS.

**Step 4: Commit**

```bash
git add src/world/builders/furniture.js tests/builders-furniture.test.js
git commit -m "feat: fences with posts and rails, and better bench, table and planter"
```

---

### Task 11: Character through the loader, with a plain figure fallback

**Delivers:** US-5, US-8; FR-12 (character fits: view check in Task 15), FR-16 (character); AC-4.4 (drawing), AC-8.4, AC-5.1 (subjective, Task 15).

**Files:**
- Create: `src/world/builders/figure.js`
- Create: `tests/builders-figure.test.js`

**Step 1: Write the failing test**

```js
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { buildFigure } from '../src/world/builders/figure.js';
import { hexFor } from '../src/logic/colours.js';
import { CHARACTER_SPOT } from '../src/world/layout.js';

const colourOf = (root, name) => {
  let hex;
  root.traverse((o) => { if (o.material?.name === name) hex = '#' + o.material.color.getHexString(); });
  return hex;
};

describe('plain figure (FR-16, AC-8.4)', () => {
  const figure = buildFigure(THREE, { hair: 'blond', clothing: 'plum' });
  it('stands in the character spot', () => {
    expect(figure.position.x).toBe(CHARACTER_SPOT.x);
    expect(figure.position.z).toBe(CHARACTER_SPOT.z);
  });
  it('is about the size of a person', () => {
    const box = new THREE.Box3().setFromObject(figure);
    expect(box.max.y - box.min.y).toBeGreaterThan(1.5);
    expect(box.max.y - box.min.y).toBeLessThan(2);
  });
  it('takes the chosen hair and clothing colours', () => {
    expect(colourOf(figure, 'figure-hair')).toBe(hexFor('hair', 'blond'));
    expect(colourOf(figure, 'figure-clothing')).toBe(hexFor('clothing', 'plum'));
  });
});
```

Run: `npx vitest run tests/builders-figure.test.js` — Expected: FAIL.

**Step 2: Write `src/world/builders/figure.js`**

```js
import { hexFor } from '../../logic/colours.js';
import { CHARACTER_SPOT } from '../layout.js';

// A simple human-shaped stand-in for the character model (FR-16).
// Collision is the character solid in layout.js, so the figure blocks walking like the model does.
export function buildFigure(THREE, { hair, clothing }) {
  const g = new THREE.Group();
  g.position.set(CHARACTER_SPOT.x, 0, CHARACTER_SPOT.z);
  g.rotation.y = (-30 * Math.PI) / 180;
  g.userData.kind = 'character';
  g.userData.plain = 'figure';

  const mat = (name, hex) => {
    const m = new THREE.MeshStandardMaterial({ color: hex, roughness: 1 });
    m.name = name;
    return m;
  };
  const part = (geometry, material, y) => {
    const m = new THREE.Mesh(geometry, material);
    m.position.y = y;
    g.add(m);
    return m;
  };
  const clothes = mat('figure-clothing', hexFor('clothing', clothing) ?? '#6f8f5a');
  const trousers = mat('figure-trousers', '#7ea6c9');
  const skin = mat('figure-skin', '#e0b394');
  const hairMaterial = mat('figure-hair', hexFor('hair', hair) ?? '#3b2a20');

  for (const x of [-0.11, 0.11]) {
    const leg = part(new THREE.BoxGeometry(0.18, 0.8, 0.18), trousers, 0.4);
    leg.position.x = x;
  }
  part(new THREE.BoxGeometry(0.5, 0.6, 0.25), clothes, 1.1);
  part(new THREE.SphereGeometry(0.14, 12, 10), skin, 1.55);
  const cap = part(new THREE.SphereGeometry(0.15, 12, 10, 0, Math.PI * 2, 0, Math.PI / 1.8), hairMaterial, 1.57);
  cap.rotation.x = -0.15;
  return g;
}
```

**Step 3: Run the tests**

Run: `npx vitest run tests/builders-figure.test.js`
Expected: PASS (`hexFor` returns lowercase hex strings like `#d9bf77`; `getHexString()` is lowercase).

**Step 4: Commit**

```bash
git add src/world/builders/figure.js tests/builders-figure.test.js
git commit -m "feat: plain figure that stands in for a failed character model"
```

---

### Task 12: Compose the world and rewrite the scene

**Delivers:** US-1 to US-9 (assembly); FR-1 to FR-16, FR-18 (in the running scene); AC-8.1 to AC-8.6 (in the running scene); AC-9.1 (Chrome smoke).

**Files:**
- Create: `src/world/manifest.js`, `src/world/buildWorld.js`
- Modify: `src/world/scene.js`, `src/world/components.js`
- Create: `tests/buildWorld.test.js`, `tests/manifest.test.js`

**Step 1: Write the failing tests**

```js
// tests/manifest.test.js
// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { MANIFEST } from '../src/world/manifest.js';
import { ASSET_RECORDS } from '../src/data/licences.js';

const publicDir = new URL('../public/', import.meta.url).pathname;

describe('manifest (FR-20, AC-11.2)', () => {
  it('points only to files of this product, relative to its own address', () => {
    for (const a of MANIFEST) {
      expect(a.url, a.id).not.toMatch(/^(https?:)?\/\//);
      expect(existsSync(publicDir + a.url.replace(/^\//, '')), a.id).toBe(true);
    }
  });
  it('has a licence record for every file it loads', () => {
    const recorded = new Set(ASSET_RECORDS.flatMap((r) => r.files));
    for (const a of MANIFEST) expect(recorded.has(a.url.replace(/^\/assets\//, '')), a.id).toBe(true);
  });
});
```

```js
// tests/buildWorld.test.js
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { makeAssets } from '../src/world/builders/common.js';
import { buildWorld } from '../src/world/buildWorld.js';
import { SOLIDS, FLOWER_BEDS } from '../src/world/layout.js';

const colours = { hair: 'brown', clothing: 'mustard' };
const count = (root, kind) => { let n = 0; root.traverse((o) => { if (o.userData.kind === kind) n++; }); return n; };
const gltf = () => { const scene = new THREE.Group(); scene.add(new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1))); return { scene }; };

describe('buildWorld', () => {
  it('survives every asset failing (AC-8.4)', () => {
    const world = buildWorld(THREE, makeAssets(new Map()), colours, { withCharacter: false });
    expect(count(world.group, 'tree')).toBe(SOLIDS.filter((s) => s.kind === 'tree').length);
    expect(count(world.group, 'house')).toBe(1);
  });
  it('draws every solid kind and every flower bed', () => {
    const assets = makeAssets(new Map([['tree-round', gltf()], ['tree-pine', gltf()], ['bush', gltf()]]));
    const { group } = buildWorld(THREE, assets, colours, { withCharacter: false });
    for (const kind of ['tree', 'bush', 'hedge', 'fence', 'furniture']) {
      expect(count(group, kind), kind).toBe(SOLIDS.filter((s) => s.kind === kind).length);
    }
    expect(count(group, 'flower-bed')).toBe(FLOWER_BEDS.length);
  });
  it('collects the motion functions of trees and clouds (FR-14)', () => {
    const assets = makeAssets(new Map([['tree-round', gltf()], ['tree-pine', gltf()]]));
    const { updaters } = buildWorld(THREE, assets, colours, { withCharacter: false });
    expect(updaters.length).toBeGreaterThanOrEqual(7); // 6 trees + clouds
  });
  it('puts the plain figure in the character spot when the character model is missing (AC-8.4)', () => {
    const world = buildWorld(THREE, makeAssets(new Map()), colours);
    expect(count(world.group, 'character')).toBe(1);
  });
  it('leaves the character to the model entity when the model loaded', () => {
    const world = buildWorld(THREE, makeAssets(new Map([['character', gltf()]])), colours);
    expect(count(world.group, 'character')).toBe(0);
  });
});
```

Run: `npx vitest run tests/manifest.test.js tests/buildWorld.test.js` — Expected: FAIL.

**Step 2: Write `src/world/manifest.js`**

```js
// Every file the place loads. All are served from the product's own address (FR-20, AC-11.2).
const base = import.meta.env.BASE_URL;
const url = (path) => `${base}assets/${path}`;

export const MANIFEST = [
  { id: 'grass', type: 'texture', url: url('textures/grass.jpg') },
  { id: 'path', type: 'texture', url: url('textures/path.jpg') },
  { id: 'wood', type: 'texture', url: url('textures/wood.jpg') },
  { id: 'brick', type: 'texture', url: url('textures/brick.jpg') },
  { id: 'roof', type: 'texture', url: url('textures/roof.jpg') },
  { id: 'tree-round', type: 'model', url: url('models/tree-round.glb') },
  { id: 'tree-pine', type: 'model', url: url('models/tree-pine.glb') },
  { id: 'bush', type: 'model', url: url('models/bush.glb') },
  { id: 'character', type: 'model', url: url('character.glb') },
];
```

In the test, `import.meta.env.BASE_URL` is `/`, so URLs become `/assets/...`. The manifest test strips `/assets/` to get the record key (`textures/grass.jpg`, `character.glb`).

**Step 3: Write `src/world/buildWorld.js`**

```js
import { SOLIDS, FLOWER_BEDS } from './layout.js';
import { buildSky, buildClouds } from './builders/sky.js';
import { buildGround, buildPath } from './builders/ground.js';
import { buildTree, buildBush, buildHedge, buildFlowerBed } from './builders/plants.js';
import { buildHouse } from './builders/house.js';
import { buildFence, buildFurniture } from './builders/furniture.js';
import { buildFigure } from './builders/figure.js';

const BUILDERS = {
  tree: buildTree,
  bush: buildBush,
  hedge: buildHedge,
  fence: buildFence,
  furniture: buildFurniture,
};

// Builds the whole place from what loaded. Never throws for a missing asset (FR-16).
// Returns the group and the functions that move things (trees, clouds).
export function buildWorld(THREE, assets, colours, { withCharacter = true } = {}) {
  const group = new THREE.Group();
  group.add(buildSky(THREE), buildGround(THREE, assets), buildPath(THREE, assets), buildHouse(THREE, assets));
  const clouds = buildClouds(THREE);
  group.add(clouds);
  for (const solid of SOLIDS) {
    const build = BUILDERS[solid.kind];
    if (build) group.add(build(THREE, assets, solid));
  }
  for (const bed of FLOWER_BEDS) group.add(buildFlowerBed(THREE, bed));
  // The character model is an entity (see scene.js). Without it, a plain figure stands in.
  if (withCharacter && !assets.model('character')) group.add(buildFigure(THREE, colours));

  const updaters = [];
  group.traverse((o) => {
    if (typeof o.userData.update === 'function') updaters.push(o.userData.update);
  });
  return { group, updaters };
}
```

**Step 4: Add the motion component to `src/world/components.js`** (append)

```js
// Calls the update functions of trees and clouds every frame (FR-14).
AFRAME.registerComponent('world-motion', {
  schema: { updaters: { default: [] } },
  tick(time) {
    const seconds = time / 1000;
    for (const update of this.data.updaters) update(seconds);
  },
});
```

If the schema `default: []` with a function array is rejected by A-Frame's property parser, store the list on the element instead: in `scene.js` set `el.worldUpdaters = updaters` and in `tick` read `this.el.worldUpdaters ?? []`. Use whichever works; the test is Step 8.

**Step 5: Rewrite `src/world/scene.js`**

```js
import 'aframe';
import './components.js';
import { SPAWN, CHARACTER_SPOT } from './layout.js';
import { releasePage } from './teardown.js';
import { HAIR_COLOURS, CLOTHING_COLOURS } from '../logic/fields.js';
import { MANIFEST } from './manifest.js';
import { loadAssets, failureMessage, LOAD_TIMEOUT_MS } from './assetLoader.js';
import { makeAssets } from './builders/common.js';
import { buildWorld } from './buildWorld.js';
import { SKY } from './builders/sky.js';

// Only known colour ids may reach the markup; anything else gets the first entry.
function safeId(set, id) {
  return set.some((c) => c.id === id) ? id : set[0].id;
}

function makeLoaders(THREE) {
  return {
    texture: (url) =>
      new Promise((resolve, reject) => {
        new THREE.TextureLoader().load(
          url,
          (t) => {
            t.colorSpace = THREE.SRGBColorSpace;
            resolve(t);
          },
          undefined,
          reject,
        );
      }),
    model: (url) =>
      new Promise((resolve, reject) => {
        new THREE.GLTFLoader().load(url, resolve, undefined, reject);
      }),
  };
}

const whenLoaded = (el) =>
  el.hasLoaded ? Promise.resolve() : new Promise((r) => el.addEventListener('loaded', r, { once: true }));

// Resolves when the scene has started, or when the time is up, whichever comes first.
function sceneReady(sceneEl, ms) {
  if (sceneEl.hasLoaded) return Promise.resolve();
  return Promise.race([
    new Promise((r) => sceneEl.addEventListener('loaded', r, { once: true })),
    new Promise((r) => setTimeout(r, Math.max(0, ms))),
  ]);
}

export async function mountWorld(container, character, { stats = false } = {}) {
  const deadline = Date.now() + LOAD_TIMEOUT_MS;
  const THREE = AFRAME.THREE;
  const loaded = await loadAssets(MANIFEST, makeLoaders(THREE));
  const assets = makeAssets(loaded.values);
  const hair = safeId(HAIR_COLOURS, character.hair);
  const clothing = safeId(CLOTHING_COLOURS, character.clothing);

  const scene = document.createElement('div');
  scene.className = 'world';
  scene.innerHTML = `
    <a-scene ${stats ? 'stats' : ''} vr-mode-ui="enabled: false" background="color: ${SKY.horizon}"
      fog="type: linear; color: ${SKY.horizon}; near: 40; far: 220">
      <a-light type="ambient" color="#ffe2b8" intensity="0.7"></a-light>
      <a-light type="directional" color="#ffd9a0" intensity="0.8" position="-3 6 4"></a-light>
      <a-light type="point" color="#ffcf8a" intensity="0.8" distance="12" position="0 2.5 -3"></a-light>
      <a-entity id="world-root"></a-entity>
      <a-entity id="character-model-entity"
        position="${CHARACTER_SPOT.x} 0 ${CHARACTER_SPOT.z}"
        rotation="0 -30 0"
        character-colours="hair: ${hair}; clothing: ${clothing}"
        idle-animation></a-entity>
      <a-entity camera="far: 1000" look-controls wasd-controls="acceleration: 25" walk-limiter position="${SPAWN.x} 1.6 ${SPAWN.z}"></a-entity>
    </a-scene>`;
  container.appendChild(scene);
  const sceneEl = scene.querySelector('a-scene');

  const world = buildWorld(THREE, assets, { hair, clothing });
  const root = scene.querySelector('#world-root');
  await whenLoaded(root);
  root.setObject3D('world', world.group);
  root.worldUpdaters = world.updaters;

  // The loaded character model goes on its entity. The existing components paint and animate it.
  const characterGltf = assets.gltf('character');
  if (characterGltf) {
    const el = scene.querySelector('#character-model-entity');
    await whenLoaded(el);
    characterGltf.scene.animations = characterGltf.animations;
    el.setObject3D('mesh', characterGltf.scene);
    el.emit('model-loaded');
  }

  await sceneReady(sceneEl, deadline - Date.now());

  return {
    warning: failureMessage(loaded),
    destroy: () => {
      // Removing the node only disposes the renderer; the render loop must be stopped too.
      if (sceneEl) {
        // A-Frame's pending 'loaded' listener (a-scene.js play(), line 683) returns early
        // when renderStarted is set (line 689), so a late load cannot restart the loop.
        sceneEl.renderStarted = true;
        sceneEl.pause?.();
        sceneEl.renderer?.setAnimationLoop(null);
      }
      scene.remove();
      // A-Frame leaves its fullscreen class on <html>; without this the page cannot scroll.
      releasePage(document.documentElement);
    },
  };
}
```

Then wire the motion: add `world-motion` to the root entity markup (`<a-entity id="world-root" world-motion>`) and, in `components.js`, replace the schema version with the element-based one if Step 4's note applies:

```js
AFRAME.registerComponent('world-motion', {
  tick(time) {
    const seconds = time / 1000;
    for (const update of this.el.worldUpdaters ?? []) update(seconds);
  },
});
```

Use this element-based version (it avoids the schema question).

**Step 6: Run the unit tests**

Run: `npm test && npm run lint && npm run format:check`
Expected: PASS. Run `npm run format` first if Prettier complains.

**Step 7: Look at it in Chrome**

Run: `npm run dev`, open http://localhost:5173, choose "Try out". Expected: blue sky with clouds, grass, a path to a brick house, trees, bushes, flower beds, fences, the character. Walk into every object: you stop. Open the console: no errors. If `THREE.GLTFLoader` is undefined, check `AFRAME.THREE.GLTFLoader` in the console; in A-Frame 1.6.0 it exists (`node_modules/aframe/dist/aframe-v1.6.0.js` contains `THREE.GLTFLoader`).

**Step 8: Check the failure paths by hand (AC-8.3 to AC-8.6)**

In Chrome DevTools, Network tab, "Block request URL":
1. Block `grass.jpg`: reload, try-out. The ground is a plain green, the message shows, the loading cover is gone. (AC-8.3)
2. Block `*.glb` and `*.jpg`: reload, try-out. The place shows plain colours, a plain figure stands where the character was, you cannot walk through it, its hair and clothing follow your choice (use "Make a new character" for a non-example character), the message shows, no blank screen. (AC-8.4)
3. Block only `tree-pine.glb`: the pine trees are plain blocks, you stop at them, the message shows. (AC-8.5)
4. Throttle to "Slow 4G", clear the cache, choose try-out: the loading cover shows at once. (AC-8.1)
5. Block nothing but use DevTools "Offline" after the first request starts, to stall: after 30 seconds the cover is gone, the message shows. (AC-8.6)

**Step 9: Commit**

```bash
git add src tests
git commit -m "feat: build the world from loaded assets with plain fallbacks"
```

---

### Task 13: Warm light

**Delivers:** US-6; FR-13; AC-6.1 (and US-5 warmth).

**Files:**
- Modify: `src/world/scene.js` (the three `<a-light>` lines)

The look is judged by a person, so this task is hands-on. Textures usually make a place cooler than flat colours did.

**Step 1: Walk the place in Chrome and answer the spec's question**

"Does the place look warm rather than cold or dull?" Walk the whole place, including the north side behind the house.

**Step 2: If the answer is no, adjust, one change at a time**

Starting values are already warm (ambient `#ffe2b8` 0.7, directional `#ffd9a0` 0.8, point `#ffcf8a` 0.8). Try, in this order, reloading after each:
1. Directional light: `position="-6 5 8"` (a lower sun gives longer, warmer light) and `intensity="1.0"`.
2. Ambient: `color="#ffd9b0"`, `intensity="0.85"`.
3. Add a second point light near the door: `<a-light type="point" color="#ffb366" intensity="0.9" distance="8" position="0 2.4 -4.5"></a-light>`.
4. Tint a texture material in `surface()` through its `tint` option (for example the roof `#ffe8d0`), only if the light alone is not enough.

Stop at the first change that makes the answer yes. Do not add lights beyond these: each costs frame rate (NFR-1).

**Step 3: Re-check the frame rate**

Open `?stats`, walk 20 seconds. Expected: still well above 30 fps. (The full 2-minute check is Task 15.)

**Step 4: Commit**

```bash
git add src/world/scene.js
git commit -m "style: tune the light so the textured place stays warm"
```

---

### Task 14: Credits section

**Delivers:** US-11; FR-20 (credits); AC-11.3.

**Files:**
- Modify: `src/ui/screens.js`, `src/ui/styles.css`
- Create: `tests/credits.test.js`

**Step 1: Write the failing test**

```js
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderWorldOverlay } from '../src/ui/screens.js';
import { ASSET_RECORDS } from '../src/data/licences.js';

describe('credits section (AC-11.3)', () => {
  it('lists every credit that a licence requires', () => {
    const root = document.createElement('div');
    renderWorldOverlay(root, { notice: null, showHint: false, onDismissHint() {}, onBack() {} });
    root.querySelector('[data-action="toggle-credits"]').click();
    const text = root.querySelector('.credits').textContent;
    for (const r of ASSET_RECORDS.filter((x) => x.credit)) expect(text).toContain(r.credit);
  });
  it('shows the credits panel only after the button is pressed', () => {
    const root = document.createElement('div');
    renderWorldOverlay(root, { notice: null, showHint: false, onDismissHint() {}, onBack() {} });
    expect(root.querySelector('.credits')).toBeNull();
  });
  it('names the source and licence of every asset pack', () => {
    const root = document.createElement('div');
    renderWorldOverlay(root, { notice: null, showHint: false, onDismissHint() {}, onBack() {} });
    root.querySelector('[data-action="toggle-credits"]').click();
    const text = root.querySelector('.credits').textContent;
    for (const r of ASSET_RECORDS) {
      expect(text).toContain(r.author);
      expect(text).toContain(r.licence);
    }
  });
});
```

Run: `npx vitest run tests/credits.test.js` — Expected: FAIL. If every record is CC0 the first test has nothing to check; the third test still runs. Listing authors and licences of CC0 packs is not required by the licence but is good practice and costs nothing.

**Step 2: Add the credits button and panel to `renderWorldOverlay`**

Import `ASSET_RECORDS` at the top of `screens.js`:

```js
import { ASSET_RECORDS } from '../data/licences.js';
```

In `renderWorldOverlay`, after the "Back to start" button and before the notice, add:

```js
  let credits = null;
  overlay.append(
    h(
      'button',
      {
        class: 'back',
        'data-action': 'toggle-credits',
        onClick: () => {
          if (credits) {
            credits.remove();
            credits = null;
            return;
          }
          credits = h(
            'div',
            { class: 'credits notice', role: 'region', 'aria-label': 'Credits' },
            h('p', {}, 'Credits'),
            ...ASSET_RECORDS.map((r) =>
              h(
                'p',
                {},
                `${r.credit ?? r.author} (${r.licence}) `,
                h('a', { href: r.source, target: '_blank', rel: 'noopener noreferrer' }, 'source'),
              ),
            ),
          );
          overlay.append(credits);
        },
      },
      'Credits',
    ),
  );
```

Check that the existing `h()` helper accepts an `href` attribute and nested element children (it already builds `button` with `onClick`; read its code at the top of `screens.js` and adapt the call if it differs).

**Step 3: Style** (end of `src/ui/styles.css`)

```css
.credits {
  max-height: 50vh;
  overflow: auto;
  font-size: 0.85rem;
}
.credits p {
  margin: 0 0 0.4rem;
}
```

**Step 4: Run the tests**

Run: `npm test && npm run lint && npm run format:check`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/ui tests/credits.test.js
git commit -m "feat: credits section listing every asset source and licence"
```

---

### Task 15: Privacy and own-address guards

**Delivers:** NFR-3; FR-20 (own address); AC-9.4 (guard), AC-9.5 (guard), AC-11.2 (guard).

**Files:**
- Create: `tests/privacy.test.js`

**Step 1: Write the test**

```js
// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SRC = new URL('../src/world', import.meta.url).pathname;
const files = (dir) =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? files(p) : [p];
  });
const code = (p) => readFileSync(p, 'utf8').replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');

describe('the new look stores and sends nothing (NFR-3, AC-9.4, AC-9.5)', () => {
  it('never touches storage, cookies or the network from the world code', () => {
    for (const p of files(SRC)) {
      expect(code(p), p).not.toMatch(/localStorage|sessionStorage|indexedDB|document\.cookie|sendBeacon|XMLHttpRequest|\bfetch\s*\(/);
    }
  });
  it('only loads files through the manifest, with no hard-coded outside address (AC-11.2)', () => {
    for (const p of files(SRC)) {
      expect(code(p), p).not.toMatch(/https?:\/\//);
    }
  });
});
```

**Step 2: Run it**

Run: `npx vitest run tests/privacy.test.js`
Expected: PASS. If `scene.js` mentions an `http` URL in markup, remove it.

**Step 3: Commit**

```bash
git add tests/privacy.test.js
git commit -m "test: guard against storage, network calls and outside addresses in the world code"
```

---

### Task 16: Verification checklist, measurements and README

**Delivers:** NFR-1, NFR-2, NFR-4; FR-12, FR-13, FR-17, FR-19, FR-21; AC-1.1 to AC-1.3, AC-2.1, AC-2.2, AC-3.1 to AC-3.4, AC-4.1 to AC-4.7, AC-5.1, AC-6.1, AC-7.1, AC-7.2, AC-8.1 to AC-8.6, AC-9.1 to AC-9.5, AC-10.2, AC-10.3, AC-10.5, AC-11.1 to AC-11.4, AC-12.1, AC-12.2.

**Files:**
- Create: `docs/verification/world-visuals-checklist.md`
- Modify: `README.md`, `specs/world-visuals/decisions.md`

**Step 1: Write the checklist**

Create `docs/verification/world-visuals-checklist.md`:

```markdown
# World visuals verification checklist

Test note: laptop used: ______ . Date: ______ . Answer each question yes or no. Quote the question as written.
Do the "per browser" rows in each of: Chrome ___ Firefox ___ Safari ___ (latest version at the time of testing).

## Per browser
- [ ] AC-1.1 Look in a full circle and upward: is the sky a blue gradient, lighter at the horizon and deeper overhead?
- [ ] AC-1.2 At least one cloud is visible.
- [ ] AC-1.3 At each edge of the place, looking toward the horizon: is any void or empty gap visible between the ground and the sky? (answer must be no)
- [ ] AC-2.1 Does the ground show a grass texture that varies in colour or pattern across the place, not one uniform colour?
- [ ] AC-2.2 From the street, a path to the house door is visible and you can walk on it.
- [ ] AC-3.1 Count the trees: at least 6, in at least two different shapes.
- [ ] AC-3.2 Does each tree have a trunk and separate foliage, not a plain cylinder and sphere?
- [ ] AC-3.3 Count: at least 3 bushes, 2 flower beds (not the planter), 1 hedge.
- [ ] AC-3.4 Does a fence look like a fence, with posts and rails or boards? Walk into it: you do not pass.
- [ ] AC-4.1 Facing the door: textured walls, one door, at least 4 windows, a sloped roof with a visible texture.
- [ ] AC-4.2 Walk into the house: you do not pass and cannot enter.
- [ ] AC-4.4 Walk to the character: reachable, outside the house, same spot each time.
- [ ] AC-4.5 Walk into each solid (house, trees, hedge, fences, bushes, bench, table, planter, character) and into each part of the boundary: you stop at each.
- [ ] AC-4.7 Walk into a flower bed: you walk over it.
- [ ] AC-5.1 View the character from the start and from 2 m away: does the character look at home in this world?
- [ ] AC-6.1 Does the place look warm rather than cold or dull?
- [ ] AC-7.1 Watch the trees for 10 seconds: do they move, and is the movement calm and not distracting?
- [ ] AC-7.2 Watch the sky for 30 seconds: do the clouds drift, and is the movement calm and not distracting?
- [ ] AC-9.1 Phase 1 checks AC-1.1 to AC-1.5 and AC-1.8 pass (without the frame-rate check AC-1.6 in Firefox and Safari).
- [ ] AC-9.2 Phase 1 checks AC-2.1 to AC-5.6 (character, colours, intake, start screen, unsupported browser) pass with the new look.

## Once, in Chrome
- [ ] AC-4.3 `npx vitest run tests/layout.test.js` passes (walkable area at least phase 1's, boundary the same).
- [ ] AC-4.6 `HOUSE` in `src/world/layout.js`: footprint at most 10 by 8 m, one or two floors.
- [ ] AC-8.1 Chrome "Slow 4G" throttling, start screen, choose try-out: a loading indicator shows and no empty screen.
- [ ] AC-8.2 After loading, the indicator is gone.
- [ ] AC-8.3 Block `grass.jpg` (DevTools, Block request URL): plain colour there and a short message.
- [ ] AC-8.4 Block all `.jpg` and `.glb`: plain colours, plain figure in the character's spot that blocks walking and takes the chosen colours, message shown, indicator gone, no blank screen or crash.
- [ ] AC-8.5 Block `tree-pine.glb`: plain blocks for those trees, you stop at them, message shown.
- [ ] AC-8.6 Stall loading (Offline after the first request): after 30 seconds the indicator is gone, a message shows and the place shows what loaded.
- [ ] AC-9.3 Compare `specs/world-visuals/baseline/furniture.png` with the new bench, table and planter: do they look better?
- [ ] AC-9.4 Application tab, Local Storage before and after 5 minutes: no key added beyond phase 1's.
- [ ] AC-9.5 Network tab during 5 minutes of use, then the phase 1 sent-data check (phase 1 AC-4.5): no request carries a typed or chosen value.
- [ ] AC-11.1 `npx vitest run tests/licences.test.js` passes and you re-read the licence text of each record once.
- [ ] AC-11.2 Network tab on the live address: every request goes to the product's own address.
- [ ] AC-11.3 On the live address, press Credits: every credit a licence requires is listed.
- [ ] AC-11.4 The character's licence is recorded in `src/data/licences.js` with a check date and is usable. If not, the character is replaced before going online.
- [ ] AC-12.1 Try-out, `?stats` on, trees and clouds moving. Walk a route through the whole place for 2 minutes and note the displayed fps every 10 seconds (12 values). Values: ____ . Average: ____ fps (must be 30 or more). Laptop: ____ .
- [ ] AC-12.2 Network tab, "Disable cache" on, load from the start screen through try-out: compressed transfer ____ MB (must be 30 MB or less).

## After the place is online
- [ ] AC-10.3 Each independent person tries it for a short session; ask "does the place look like a cozy home?" (1 to 5) and note the number, no name.
- [ ] AC-10.5 At the end of week 4 at least 3 independent ratings are recorded.
- [ ] AC-10.2 At the end of week 4 take your own rating and record it in `specs/world-visuals/decisions.md`. 4 or more means G-1 is met.
```

**Step 2: Run the whole checklist locally**

```bash
npm run build && npm run preview
```

Work through the "Per browser" rows in Chrome, Firefox and Safari, and the "Once, in Chrome" rows. Record the results in the file (ticks and numbers).

**Step 3: If the frame rate is under 30 in Chrome, in this order (NFR-1, AC-12.1)**

1. Lower the cloud count in `buildClouds` (`count: 8` to `5`) and the puffs per cloud.
2. Lower `SphereGeometry` segment counts in `plants.js` (flower heads `8, 6` to `6, 4`).
3. Add `renderer="antialias: false"` to the `<a-scene>` markup.
4. Merge the flower meshes of each bed with `BufferGeometryUtils.mergeGeometries`, or draw flowers with `THREE.InstancedMesh`.
5. Halve the grass tiles' resolution (`prepare-texture.mjs ... 512`).

Re-measure after each change; stop when the average is 30 or more. If the transfer is over 30 MB (AC-12.2), re-run `prepare-texture.mjs` at 512 px and re-run the model steps from Task 3 with `--width 256`.

**Step 4: Update the README**

Add to the "Known limitations" list in `README.md`:

```markdown
- The movement of trees and clouds cannot be switched off, and no accessibility level is promised (world visuals NFR-4).
- The 30 frames per second goal is measured in Chrome on the builder's laptop only. Firefox and Safari are best effort; there is no floor for other laptops.
```

Add under "Documents":

```markdown
- World visuals spec: `specs/world-visuals/spec.md`
- World visuals plan: `docs/plans/2026-11-08-world-visuals.md`
- World visuals checklist: `docs/verification/world-visuals-checklist.md`
- Asset licences: `src/data/licences.js` (shown in the place under "Credits")
```

**Step 5: Run everything, then commit**

```bash
npm run lint && npm run format:check && npm test && npm run build
git add docs README.md specs/world-visuals/decisions.md
git commit -m "docs: world visuals verification checklist and README notes"
```

---

### Task 17: Go online and take the ratings

**Delivers:** US-10; FR-19; AC-10.2, AC-10.3, AC-10.5 (the live steps).

**Step 1: Gate check before merging**

All of these must be true. If any is not, do not go online:
- Checklist rows AC-8.1 to AC-8.6, AC-11.4, AC-12.1 and AC-12.2 are ticked.
- The character's licence record is usable (AC-11.4).
- `npm run lint && npm run format:check && npm test && npm run build` passes.

**Step 2: Merge to `main`**

`.github/workflows/pages.yml` deploys on push to `main`. Open a pull request, let CI pass, merge. Wait for the deploy.

**Step 3: Re-run the "Once, on the live address" rows on the live address**

AC-11.2 (own address only), AC-11.3 (credits), AC-9.5 (no sent data) and AC-12.2 (transfer, on the live address with the cache disabled).

**Step 4: Collect ratings**

For each independent person (at least 3), after a short session in the place, ask: "Does the place look like a cozy home? 1 (not at all) to 5 (very)." Write the number in `specs/world-visuals/decisions.md` under a heading `## Independent ratings`, without a name. At the end of week 4 after going online, take your own rating and record it with the date. 4 or more meets G-1.

**Step 5: Commit the ratings**

```bash
git add specs/world-visuals/decisions.md
git commit -m "docs: record world visuals ratings"
```

---

## Coverage table

Every ID of the spec and the task that delivers it. "(manual)" means the check is in the checklist (Task 16) and is run by a person; the task still delivers the thing checked.

### Functional requirements

| ID | Task |
|---|---|
| FR-1 | Task 7 |
| FR-2 | Task 7 |
| FR-3 | Task 7 |
| FR-4 | Task 7 |
| FR-5 | Task 4 (layout), Task 7 (drawing) |
| FR-6 | Task 4 (count), Task 8 |
| FR-7 | Task 4 (count), Task 8 |
| FR-8 | Task 10 |
| FR-9 | Task 9 |
| FR-10 | Task 4, Task 9 |
| FR-11 | Task 4 |
| FR-12 | Task 3 (kit and character from one author), Task 11, Task 16 (manual, AC-5.1) |
| FR-13 | Task 13 |
| FR-14 | Task 7 (clouds), Task 8 (trees), Task 12 (motion wired in) |
| FR-15 | Task 5 (limit), Task 6 |
| FR-16 | Task 5, Task 6 (message), Task 8 (blocks), Task 11 (figure), Task 12 |
| FR-17 | Task 12, Task 16 (manual, AC-9.1, AC-9.2) |
| FR-18 | Task 10 |
| FR-19 | Task 1 (baseline), Task 17 (new ratings) |
| FR-20 | Task 2, Task 3, Task 12 (manifest), Task 14, Task 15 |
| FR-21 | Task 1 |

### Non-functional requirements

| ID | Task |
|---|---|
| NFR-1 | Task 13 (light cost), Task 16 (manual, AC-12.1, with the tuning steps) |
| NFR-2 | Task 3 (size budget and test), Task 16 (manual, AC-12.2) |
| NFR-3 | Task 12, Task 15 |
| NFR-4 | Task 16 (README) |

### Acceptance criteria

| ID | Task |
|---|---|
| AC-1.1 | Task 7 (test), Task 16 (manual) |
| AC-1.2 | Task 7 (test), Task 16 (manual) |
| AC-1.3 | Task 7 (test), Task 16 (manual) |
| AC-2.1 | Task 7, Task 16 (manual) |
| AC-2.2 | Task 4 (test), Task 7, Task 16 (manual) |
| AC-3.1 | Task 4 (test), Task 8, Task 16 (manual) |
| AC-3.2 | Task 8, Task 16 (manual) |
| AC-3.3 | Task 4 (test), Task 8, Task 16 (manual) |
| AC-3.4 | Task 10 (test), Task 16 (manual) |
| AC-4.1 | Task 9 (test), Task 16 (manual) |
| AC-4.2 | Task 4 (test), Task 9 |
| AC-4.3 | Task 1 (fixture), Task 4 (test) |
| AC-4.4 | Task 4 (test), Task 16 (manual) |
| AC-4.5 | Task 4 (test), Task 16 (manual) |
| AC-4.6 | Task 4 (test) |
| AC-4.7 | Task 4 (test), Task 8 |
| AC-5.1 | Task 11, Task 16 (manual) |
| AC-6.1 | Task 13, Task 16 (manual) |
| AC-7.1 | Task 8 (test), Task 16 (manual) |
| AC-7.2 | Task 7 (test), Task 16 (manual) |
| AC-8.1 | Task 6 (test), Task 12 (manual step), Task 16 (manual) |
| AC-8.2 | Task 6 (test), Task 16 (manual) |
| AC-8.3 | Task 5 (test), Task 6 (test), Task 12 (manual step), Task 16 (manual) |
| AC-8.4 | Task 5 (test), Task 11 (test), Task 12 (test, manual step), Task 16 (manual) |
| AC-8.5 | Task 8 (test), Task 12 (manual step), Task 16 (manual) |
| AC-8.6 | Task 5 (test), Task 6 (test), Task 12 (manual step), Task 16 (manual) |
| AC-9.1 | Task 12, Task 16 (manual) |
| AC-9.2 | Task 12, Task 16 (manual) |
| AC-9.3 | Task 1 (screenshot), Task 10, Task 16 (manual) |
| AC-9.4 | Task 15 (test), Task 16 (manual) |
| AC-9.5 | Task 15 (test), Task 16 (manual), Task 17 |
| AC-10.1 | Task 1 |
| AC-10.2 | Task 17 |
| AC-10.3 | Task 17 |
| AC-10.4 | Task 1 |
| AC-10.5 | Task 17 |
| AC-11.1 | Task 2 (test), Task 3 |
| AC-11.2 | Task 12 (manifest test), Task 15 (test), Task 16 (manual), Task 17 |
| AC-11.3 | Task 14 (test), Task 16 (manual), Task 17 |
| AC-11.4 | Task 2, Task 16 (manual), Task 17 (gate) |
| AC-12.1 | Task 16 (manual) |
| AC-12.2 | Task 3 (guard), Task 16 (manual), Task 17 |

### User stories

| ID | Task |
|---|---|
| US-1 | Task 7 |
| US-2 | Task 4, Task 7 |
| US-3 | Task 4, Task 8, Task 10 |
| US-4 | Task 4, Task 9 |
| US-5 | Task 11, Task 13 |
| US-6 | Task 13 |
| US-7 | Task 7, Task 8, Task 12 |
| US-8 | Task 5, Task 6, Task 11, Task 12 |
| US-9 | Task 10, Task 12, Task 16 |
| US-10 | Task 1, Task 17 |
| US-11 | Task 2, Task 3, Task 14 |
| US-12 | Task 3, Task 16 |

### Gaps flagged

No ID is without a task. Four items deserve attention:
- **AC-10.2, AC-10.3, AC-10.5** (Task 17) can only happen after the place is online and, for AC-10.2 and AC-10.5, after week 4. They are steps a person runs, not code.
- **FR-16 and the house or fences:** the spec lists "the house" and "a fence" among models that may fail. This plan builds them in code from textures (see "Decisions"), so only trees, bushes and the character are model files. A failed texture gives a plain colour on them. If the PO wants model files for the house or fences, that is a spec change.
- **OQ-1 and the exact assets** depend on what the builder finds at the sources in Task 3. If the Stylized Nature kit has no suitable pine or bush, Task 3 names the Kenney fallback; if neither does, the trees and bushes need a new decision.
- **OQ-3 (phase 1 spec change)** is a precondition checked in Task 1, owned by the builder.
