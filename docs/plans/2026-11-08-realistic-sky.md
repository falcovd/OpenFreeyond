# Realistic Sky Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the gradient sphere and the sphere clouds with a photographic sky that blends into the fog and ground, and let its sun light the place.

**Architecture:** One equirectangular JPEG (`public/assets/textures/sky.jpg`) goes on the existing inside-out sky sphere. A prep script makes the JPEG and a small `src/data/sky.json` (horizon colour, sun direction). `sky.js` reads that data, fades the lower sky into the fog colour with vertex alpha, and owns a directional light that turns with the sky. If the photo fails to load, the old gradient sphere is the fallback.

**Tech Stack:** three.js 0.170 (via A-Frame 1.6), Vite, Vitest, sharp.

Design: `docs/plans/2026-11-08-realistic-sky-design.md`.

**One change from the design.** `sky.json` lives in `src/data/`, not next to the JPEG. Vite bundles it, so the world needs no extra load step. World code may not call `fetch` (`tests/privacy.test.js`), so this also avoids a new loader type. Task 6 updates the design doc.

**Rules that apply to every task** (from `CLAUDE.md`): `npm run lint`, `npm run format:check`, `npm test` and `npm run build` must all pass before the last commit. Asset URLs go through `import.meta.env.BASE_URL` (the manifest already does). `sky.js` must not import `aframe`.

**Chosen photo:** Poly Haven "Kloofendal 38d Partly Cloudy (Pure Sky)", id `kloofendal_38d_partly_cloudy_puresky`. Authors: Greg Zaal (original), Jarod Guest (sky edits). Licence CC0. It is a pure-sky edit (no ground or trees at the horizon), midday sun at about 38°, a few soft clouds. The builder can veto it. Any other `*_puresky` photo works with the same steps.

---

### Task 1: Prep script and the sky data

**Files:**

- Create: `scripts/prepare-sky.mjs`
- Create: `public/assets/textures/sky.jpg` (generated)
- Create: `src/data/sky.json` (generated)
- Create: `tests/sky-data.test.js`
- Modify: `src/world/builders/sky.js` (only the `validSkyMeta` export, see Task 3 for the rest)

**Step 1: Download the source photo**

The root `assets/` folder is git-ignored and holds raw sources.

```bash
mkdir -p assets/sky
curl -L -o assets/sky/kloofendal_38d_partly_cloudy_puresky.jpg \
  "https://dl.polyhaven.org/file/ph-assets/HDRIs/extra/Tonemapped%20JPG/kloofendal_38d_partly_cloudy_puresky.jpg"
ls -lh assets/sky
```

Expected: a file of about 19 MB.

**Step 2: Write the failing test**

Create `tests/sky-data.test.js`:

```js
// @vitest-environment node
import { describe, it, expect } from 'vitest';
import skyMeta from '../src/data/sky.json';
import { validSkyMeta } from '../src/world/builders/sky.js';

describe('sky data', () => {
  it('holds a horizon colour and a unit sun direction above the horizon', () => {
    expect(validSkyMeta(skyMeta)).toBe(true);
  });
  it('rejects bad data, so the fallback is used', () => {
    expect(validSkyMeta(null)).toBe(false);
    expect(validSkyMeta({ horizon: 'blue', sun: [0, 1, 0] })).toBe(false);
    expect(validSkyMeta({ horizon: '#cfe6f5', sun: [0, 2, 0] })).toBe(false);
    expect(validSkyMeta({ horizon: '#cfe6f5', sun: [0, -1, 0] })).toBe(false);
    expect(validSkyMeta({ horizon: '#cfe6f5', sun: [0, 1] })).toBe(false);
  });
});
```

**Step 3: Run it to see it fail**

Run: `npx vitest run tests/sky-data.test.js`
Expected: FAIL (cannot find `src/data/sky.json`, and `validSkyMeta` is not exported).

**Step 4: Write the prep script**

Create `scripts/prepare-sky.mjs`:

```js
/* global process, console */
// Usage: node scripts/prepare-sky.mjs <equirectangular image> <out.jpg> <out.json> [width=4096]
// Makes the sky JPEG (2:1) and a small JSON file with the colour of the horizon and the
// direction of the sun. Directions use the mapping of the sky sphere in
// src/world/builders/sky.js: u = phi / 2pi, v = theta / pi (from the top),
// direction = (cos phi sin theta, cos theta, sin phi sin theta).
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';

const [input, outJpg, outJson, width = '4096'] = process.argv.slice(2);
if (!input || !outJpg || !outJson) {
  console.error(
    'Usage: node scripts/prepare-sky.mjs <input> <out.jpg> <out.json> [width]',
  );
  process.exit(1);
}
const W = Number(width);
const H = W / 2;

await sharp(input, { limitInputPixels: false })
  .resize(W, H, { fit: 'fill' })
  .jpeg({ quality: 82, mozjpeg: true })
  .toFile(outJpg);

// Analyse a small copy of the finished JPEG.
const AW = 512;
const AH = 256;
const { data } = await sharp(outJpg)
  .resize(AW, AH, { fit: 'fill' })
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const px = (x, y) => {
  const i = (y * AW + x) * 3;
  return [data[i], data[i + 1], data[i + 2]];
};

// Horizon colour: the mean of a band 2 to 8 degrees above the horizon.
const rowAt = (elevationDeg) => Math.round(((90 - elevationDeg) / 180) * AH);
const sum = [0, 0, 0];
let n = 0;
for (let y = rowAt(8); y <= rowAt(2); y++) {
  for (let x = 0; x < AW; x++) {
    const p = px(x, y);
    sum[0] += p[0];
    sum[1] += p[1];
    sum[2] += p[2];
    n++;
  }
}
const horizon =
  '#' +
  sum
    .map((s) =>
      Math.round(s / n)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('');

// Sun: the mean direction of the brightest pixels (within 2 percent of the maximum).
const luma = (p) => 0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2];
let max = 0;
for (let y = 0; y < AH; y++)
  for (let x = 0; x < AW; x++) max = Math.max(max, luma(px(x, y)));
const v = [0, 0, 0];
for (let y = 0; y < AH; y++) {
  for (let x = 0; x < AW; x++) {
    if (luma(px(x, y)) < max * 0.98) continue;
    const phi = 2 * Math.PI * ((x + 0.5) / AW);
    const theta = Math.PI * ((y + 0.5) / AH);
    v[0] += Math.cos(phi) * Math.sin(theta);
    v[1] += Math.cos(theta);
    v[2] += Math.sin(phi) * Math.sin(theta);
  }
}
const len = Math.hypot(...v);
const sun = v.map((c) => Math.round((c / len) * 10000) / 10000);

writeFileSync(outJson, JSON.stringify({ horizon, sun }, null, 2) + '\n');
console.log(`wrote ${outJpg} and ${outJson}`, { horizon, sun });
```

**Step 5: Run the script**

```bash
node scripts/prepare-sky.mjs assets/sky/kloofendal_38d_partly_cloudy_puresky.jpg \
  public/assets/textures/sky.jpg src/data/sky.json 4096
ls -lh public/assets/textures/sky.jpg
cat src/data/sky.json
```

Expected: `sky.jpg` between 1 and 3 MB. `sky.json` has a hex `horizon` and a `sun` vector whose second value (height) is positive. If the JPEG is over 3 MB, rerun with quality lowered to 75 in the script, or with width `3072`.

**Step 6: Add `validSkyMeta` to `sky.js`**

At the top of `src/world/builders/sky.js`, after the `SKY` constant, add:

```js
const HEX = /^#[0-9a-f]{6}$/i;

// True when the sky data can be trusted: a hex colour and a unit vector that points above the horizon.
export function validSkyMeta(meta) {
  if (!meta || typeof meta.horizon !== 'string' || !HEX.test(meta.horizon))
    return false;
  const sun = meta.sun;
  if (!Array.isArray(sun) || sun.length !== 3) return false;
  if (!sun.every(Number.isFinite)) return false;
  return Math.abs(Math.hypot(...sun) - 1) < 0.01 && sun[1] > 0;
}
```

**Step 7: Run the test to see it pass**

Run: `npx vitest run tests/sky-data.test.js`
Expected: PASS.

**Step 8: Commit**

```bash
npx prettier --write scripts/prepare-sky.mjs tests/sky-data.test.js src/data/sky.json src/world/builders/sky.js
git add scripts/prepare-sky.mjs tests/sky-data.test.js public/assets/textures/sky.jpg src/data/sky.json src/world/builders/sky.js
git commit -m "feat: sky prep script, sky photo and sky data" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

(`npm test` will still fail on the budget and licence tests until Task 2. Run only the new test here.)

---

### Task 2: Manifest, licence record and budget

**Files:**

- Modify: `src/world/manifest.js`
- Modify: `src/data/licences.js` (add one record after the `roof.jpg` record)
- Modify: `tests/budget.test.js`
- Test: `tests/manifest.test.js`, `tests/licences.test.js`, `tests/budget.test.js` (existing)

**Step 1: Run the tests to see the current failures**

Run: `npx vitest run tests/licences.test.js tests/budget.test.js`
Expected: `licences.test.js` FAIL (no record for `textures/sky.jpg`) and `budget.test.js` FAIL (texture over 1 MB).

**Step 2: Update the budget test**

In `tests/budget.test.js`, replace the texture test with:

```js
  it('keeps every texture at 1 MB or less, except the sky photo (3 MB)', () => {
    for (const f of readdirSync(join(ROOT, 'textures'))) {
      const limit = f === 'sky.jpg' ? 3 * 1024 * 1024 : 1024 * 1024;
      expect(statSync(join(ROOT, 'textures', f)).size, f).toBeLessThanOrEqual(
        limit,
      );
    }
  });
```

**Step 3: Add the licence record**

In `src/data/licences.js`, add after the roof record (check its exact position and the neighbouring format first):

```js
  {
    files: ['textures/sky.jpg'],
    author: 'Poly Haven (Kloofendal 38d Partly Cloudy, Pure Sky): Greg Zaal (original), Jarod Guest (sky edits)',
    source: 'https://polyhaven.com/a/kloofendal_38d_partly_cloudy_puresky',
    licence: 'CC0-1.0',
    licenceText:
      'CC0 1.0 Universal (CC0 1.0) Public Domain Dedication, https://creativecommons.org/publicdomain/zero/1.0/. Poly Haven: "All assets on Poly Haven are CC0", free to use for any purpose with no attribution required (https://polyhaven.com/license). Resized to 4096x2048 JPEG by scripts/prepare-sky.mjs.',
    credit: null,
    checked: '2026-11-08',
  },
```

**Step 4: Add the sky to the manifest**

In `src/world/manifest.js`, add after the `roof` line:

```js
  { id: 'sky', type: 'texture', url: url('textures/sky.jpg') },
```

**Step 5: Run the tests**

Run: `npx vitest run tests/licences.test.js tests/budget.test.js tests/manifest.test.js tests/credits.test.js`
Expected: PASS. Fix the licence record if `credits.test.js` expects other fields.

**Step 6: Commit**

```bash
npx prettier --write src/data/licences.js src/world/manifest.js tests/budget.test.js
git add src/data/licences.js src/world/manifest.js tests/budget.test.js
git commit -m "feat: load the sky photo, record its licence, allow 3 MB for it" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Photo sky, fade, sun light and drift in `sky.js`

**Files:**

- Modify: `src/world/builders/sky.js`
- Modify: `tests/builders-sky-ground.test.js`

**Step 1: Write the failing tests**

In `tests/builders-sky-ground.test.js`:

Replace the import line for the sky with:

```js
import {
  buildSky,
  skyParams,
  SKY,
  SKY_DRIFT,
  BLEND,
} from '../src/world/builders/sky.js';
```

Keep the existing `describe('sky (FR-1, FR-3)'…)`, but build it without textures: change `const sky = buildSky(THREE);` to `const sky = buildSky(THREE, none);`.

Replace the whole `describe('clouds …')` block with:

```js
describe('sky data', () => {
  const tex = new THREE.Texture();
  const meta = { horizon: '#aabbcc', sun: [0, 1, 0] };
  it('uses the photo data when the photo loaded', () => {
    const p = skyParams(makeAssets(new Map([['sky', tex]])), meta);
    expect(p).toEqual({ photo: true, horizon: '#aabbcc', sun: [0, 1, 0] });
  });
  it('uses the fixed colours when the photo is missing', () => {
    const p = skyParams(none, meta);
    expect(p.photo).toBe(false);
    expect(p.horizon).toBe(SKY.horizon);
  });
  it('uses the fixed colours when the data is invalid', () => {
    const p = skyParams(makeAssets(new Map([['sky', tex]])), { horizon: 'x' });
    expect(p.photo).toBe(false);
  });
});

describe('photo sky (FR-1, FR-2, FR-3)', () => {
  const tex = new THREE.Texture();
  const assets = makeAssets(new Map([['sky', tex]]));
  const params = { photo: true, horizon: '#aabbcc', sun: [0, 0.6, 0.8] };
  const sky = buildSky(THREE, assets, params);
  const mesh = sky.children[0];

  it('puts the photo on the sky sphere without fog', () => {
    expect(mesh.material.map).toBe(tex);
    expect(mesh.material.fog).toBe(false);
    expect(mesh.material.transparent).toBe(true);
  });
  it('fades to nothing below the horizon and is solid high up, so the fog colour shows at the edge (AC-1.3)', () => {
    const pos = mesh.geometry.attributes.position;
    const col = mesh.geometry.attributes.color;
    expect(col.itemSize).toBe(4);
    const alphaAt = (pick) => {
      for (let i = 0; i < pos.count; i++)
        if (pick(Math.asin(pos.getY(i) / SKY.radius) * (180 / Math.PI)))
          return col.getW(i);
    };
    expect(alphaAt((e) => e < -BLEND.belowDeg - 1)).toBe(0);
    expect(alphaAt((e) => e > BLEND.aboveDeg + 1)).toBe(1);
  });
  it('carries a sun light that points where the photo sun is', () => {
    const light = sky.children.find((c) => c.isDirectionalLight);
    expect(light).toBeTruthy();
    const dir = light.position.clone().normalize();
    expect(dir.x).toBeCloseTo(0);
    expect(dir.y).toBeCloseTo(0.6);
    expect(dir.z).toBeCloseTo(0.8);
  });
  it('is not mirrored', () => {
    expect(mesh.scale.x).toBe(-1);
  });
});

describe('sky drift (FR-14, AC-7.2)', () => {
  const sky = buildSky(THREE, none);
  it('turns, and the sun light turns with it', () => {
    const before = sky.rotation.y;
    sky.userData.update(10);
    expect(sky.rotation.y).not.toBe(before);
    expect(sky.children.some((c) => c.isDirectionalLight)).toBe(true);
  });
  it('turns slowly: under 0.01 radians per second', () => {
    sky.userData.update(0);
    const a = sky.rotation.y;
    sky.userData.update(1);
    expect(Math.abs(sky.rotation.y - a)).toBeLessThan(0.01);
    expect(SKY_DRIFT).toBeLessThan(0.01);
  });
});
```

**Step 2: Run to see them fail**

Run: `npx vitest run tests/builders-sky-ground.test.js`
Expected: FAIL (`skyParams`, `SKY_DRIFT`, `BLEND` not exported; `buildSky` has no light).

**Step 3: Rewrite `sky.js`**

Replace the whole file `src/world/builders/sky.js` with this (it keeps `validSkyMeta` from Task 1):

```js
import skyMeta from '../../data/sky.json';

export const SKY = { radius: 400, horizon: '#cfe6f5', zenith: '#3f86d0' };

// The sky turns this many radians per second: a full turn takes about 105 minutes. Calm, not distracting.
// The sun light turns with it, so shading stays in step with the sun in the photo.
export const SKY_DRIFT = 0.001;

// The photo fades into the fog colour from this far below to this far above the horizon.
export const BLEND = { belowDeg: 4, aboveDeg: 6 };

// The light direction when there is no photo. Same direction as the light of phase 1.
const FALLBACK_SUN = (() => {
  const v = [-6, 5, 8];
  const len = Math.hypot(...v);
  return v.map((c) => c / len);
})();

const HEX = /^#[0-9a-f]{6}$/i;

// True when the sky data can be trusted: a hex colour and a unit vector that points above the horizon.
export function validSkyMeta(meta) {
  if (!meta || typeof meta.horizon !== 'string' || !HEX.test(meta.horizon))
    return false;
  const sun = meta.sun;
  if (!Array.isArray(sun) || sun.length !== 3) return false;
  if (!sun.every(Number.isFinite)) return false;
  return Math.abs(Math.hypot(...sun) - 1) < 0.01 && sun[1] > 0;
}

// What the sky and the fog use. The photo data counts only when the photo itself loaded (FR-16).
// `horizon` is checked against a hex pattern, so it is safe to place in markup.
export function skyParams(assets, meta = skyMeta) {
  if (assets.texture('sky') && validSkyMeta(meta))
    return { photo: true, horizon: meta.horizon, sun: meta.sun };
  return { photo: false, horizon: SKY.horizon, sun: FALLBACK_SUN };
}

const smoothstep = (t) => {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
};

// The photo on the inside of a sphere. Vertex alpha fades it out toward and below the horizon,
// so the fog-coloured background and the ground meet it without a seam (FR-3).
function photoSphere(THREE, texture) {
  const geometry = new THREE.SphereGeometry(SKY.radius, 64, 48);
  const pos = geometry.attributes.position;
  const rgba = [];
  const span = BLEND.belowDeg + BLEND.aboveDeg;
  for (let i = 0; i < pos.count; i++) {
    const elevation = Math.asin(pos.getY(i) / SKY.radius) * (180 / Math.PI);
    rgba.push(1, 1, 1, smoothstep((elevation + BLEND.belowDeg) / span));
  }
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(rgba, 4));
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    vertexColors: true,
    transparent: true,
    side: THREE.BackSide,
    fog: false,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.scale.x = -1; // seen from inside, the photo would otherwise be mirrored
  return mesh;
}

// The phase 1 sky: a gradient from the horizon colour up to deeper blue. Used when the photo is missing.
function gradientSphere(THREE) {
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
  const material = new THREE.MeshBasicMaterial({
    vertexColors: true,
    side: THREE.BackSide,
    fog: false,
    depthWrite: false,
  });
  return new THREE.Mesh(geometry, material);
}

// The sky sphere and the sun light. The group turns slowly (FR-14); the sphere is child 0.
export function buildSky(THREE, assets, params = skyParams(assets)) {
  const group = new THREE.Group();
  const mesh = params.photo
    ? photoSphere(THREE, assets.texture('sky'))
    : gradientSphere(THREE);
  mesh.renderOrder = -1;
  group.add(mesh);
  const sun = new THREE.DirectionalLight('#ffd9a0', 1.0);
  sun.position.set(...params.sun).multiplyScalar(100);
  group.add(sun);
  group.userData.update = (seconds) => {
    group.rotation.y = seconds * SKY_DRIFT;
  };
  return group;
}
```

**Step 4: Run the tests**

Run: `npx vitest run tests/builders-sky-ground.test.js tests/sky-data.test.js`
Expected: PASS. If the "not mirrored" or alpha tests fail, check `mesh.scale.x` and the alpha values, not the test.

**Step 5: Commit**

```bash
npx prettier --write src/world/builders/sky.js tests/builders-sky-ground.test.js
git add src/world/builders/sky.js tests/builders-sky-ground.test.js
git commit -m "feat: photographic sky with horizon fade, sun light and slow drift" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Wire the sky into the world and the scene

**Files:**

- Modify: `src/world/buildWorld.js`
- Modify: `src/world/scene.js`
- Modify: `tests/buildWorld.test.js`

**Step 1: Write the failing tests**

In `tests/buildWorld.test.js`, add these tests inside `describe('buildWorld', …)`:

```js
  it('has a sky that turns and a sun light, and no sphere clouds (FR-2, FR-14)', () => {
    const world = buildWorld(THREE, makeAssets(new Map()), colours, {
      withCharacter: false,
    });
    let lights = 0;
    world.group.traverse((o) => {
      if (o.isDirectionalLight) lights++;
    });
    expect(lights).toBe(1);
  });
  it('uses the sky photo when it loaded', () => {
    const tex = new THREE.Texture();
    const world = buildWorld(
      THREE,
      makeAssets(new Map([['sky', tex]])),
      colours,
      { withCharacter: false },
    );
    let mapped = false;
    world.group.traverse((o) => {
      if (o.material?.map === tex) mapped = true;
    });
    expect(mapped).toBe(true);
  });
```

Also change the comment in the existing motion test from `// 6 trees + clouds` to `// 6 trees + sky`.

**Step 2: Run to see them fail**

Run: `npx vitest run tests/buildWorld.test.js`
Expected: FAIL (no directional light yet, the sky has no photo).

**Step 3: Update `buildWorld.js`**

- Change the import to `import { buildSky } from './builders/sky.js';`
- Change `buildSky(THREE),` to `buildSky(THREE, assets),`
- Delete the line `group.add(buildClouds(THREE));`
- Change the comment above `buildWorld` from `(trees, clouds)` to `(trees, sky)`.

**Step 4: Update `scene.js`**

- Change `import { SKY } from './builders/sky.js';` to `import { skyParams } from './builders/sky.js';`
- After `const assets = makeAssets(loaded.values);` add `const sky = skyParams(assets);`
- In the markup, change both `${SKY.horizon}` to `${sky.horizon}`.
- Delete the line with `<a-light type="directional" …>`. The sun light now comes from `buildSky`.

**Step 5: Run everything**

Run: `npm run lint && npm run format:check && npm test && npm run build`
Expected: all pass. Fix lint errors (an unused import is the likely one).

**Step 6: Commit**

```bash
npx prettier --write src/world/buildWorld.js src/world/scene.js tests/buildWorld.test.js
git add src/world/buildWorld.js src/world/scene.js tests/buildWorld.test.js
git commit -m "feat: use the photo sky and its sun in the world, remove sphere clouds" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Look at it and tune

This task needs eyes. A person must judge it. Do the steps, report what you see, and ask the builder for the final call.

**Files:**

- Modify (only if needed): `src/world/builders/sky.js` (`BLEND`), `src/world/scene.js` (fog `near` and `far`)

**Step 1: Start the app**

Run: `npm run dev` and open http://localhost:5173/?stats. Choose the try-out.

**Step 2: Check each item**

- Look in a full circle and upward. Is the sky a photo with soft clouds and a sun?
- Is the photo upright and not mirrored? Does the visible sun sit roughly where the shadows and bright sides of the house point from?
- Walk to each edge of the place and look at the horizon. Is there any seam, dark band or empty gap between ground and sky (AC-1.3)?
- Watch for 30 seconds. Do the clouds drift calmly (AC-7.2)?
- Read the frame rate. Is it at least 30 fps (AC-12.1)?
- Disable the cache in Chrome's network tool and reload. Is the first visit under 30 MB (AC-12.2)?

**Step 3: Tune if the horizon looks wrong**

- A visible light or dark band at the horizon: raise `BLEND.belowDeg` or `BLEND.aboveDeg` (try 6 and 10), or move the horizon sample band in `scripts/prepare-sky.mjs` and regenerate `src/data/sky.json`.
- The ground looks cut off from the sky: lower fog `near` (40) or `far` (220) in `scene.js` by about 20 percent and look again.
- The place looks too dark or too bright against the sky: change the sun light intensity in `buildSky` (1.0) by 0.2 steps.
- Delete the `?stats` check only when everything above passes.

**Step 4: Commit tuning (if any)**

```bash
git add -u
git commit -m "style: tune the sky horizon blend and fog" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Docs, checklist and spec

**Files:**

- Modify: `README.md`
- Modify: `docs/plans/2026-11-08-realistic-sky-design.md`
- Modify: `docs/verification/world-visuals-checklist.md`
- Modify: `specs/world-visuals/spec.md`

**Step 1: README**

- In "What it does", change "with a sky, grass" to "with a photographic sky, grass".
- In the `scripts/` row of the layout table, add `prepare-sky.mjs`.
- Keep the Prettier table column widths: run `npx prettier --write README.md` after editing.

**Step 2: Design doc**

In `docs/plans/2026-11-08-realistic-sky-design.md`, change the asset section and "In the world" section so `sky.json` is in `src/data/` and is not in the manifest. Add a line: "The data is bundled by Vite. World code may not call `fetch`, and this avoids a new loader type." Remove the manifest mention of `sky.json`.

**Step 3: Checklist**

In `docs/verification/world-visuals-checklist.md`:

- AC-1.1: change "blue gradient, lighter at the horizon and deeper overhead" to "a photographic sky". Keep "(Auto: …)" pointing at `tests/builders-sky-ground.test.js`.
- AC-1.2: keep, and add "(the photo has soft clouds)".
- Add a new line: "Sun and light: does the sun in the photo sit where the shading on the house points from?"
- Fill in the results of the Task 5 checks (fps, transfer size, laptop name) only with real numbers from the builder.

**Step 4: Spec**

In `specs/world-visuals/spec.md`, under "Out of scope", the line "Sound, weather and day-night changes." stays. Add under FR-1 and FR-2 a note: "Changed on 2026-11-08: the sky is now a photograph (see `docs/plans/2026-11-08-realistic-sky-design.md`). FR-1 now reads: the sky is a photograph with a visible sun and soft clouds that fades into the fog colour at the horizon." Keep the AC text. Flag in the final report that AC-1.1 wording changed.

**Step 5: Full check and commit**

Run: `npm run lint && npm run format:check && npm test && npm run build`
Expected: all pass.

```bash
npx prettier --write README.md docs specs
git add README.md docs specs
git commit -m "docs: document the photographic sky" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

## After the plan

- Weather comes later. The sky group, the fog colour and the sun light are each set in one place, so a weather system can darken the sky, change fog density and add particles without changing the builders.
- Risk: a 4096×2048 texture uses about 45 MB of GPU memory with mipmaps. If a laptop struggles, regenerate at `3072` or `2048` with `scripts/prepare-sky.mjs`.
