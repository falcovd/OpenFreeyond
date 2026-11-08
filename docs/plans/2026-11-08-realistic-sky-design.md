# Realistic sky: design

Status: approved by the builder on 2026-11-08.

## Goal

Replace the gradient sphere and the sphere clouds with a photographic sky. The sky shows a fixed, sunny afternoon and stays calm.

Weather and day-night changes are out of scope for this round. See "Later" below.

## Constraints

- 30 frames per second in Chrome on the builder's laptop (world visuals NFR-1).
- First-visit transfer of 30 MB or less (NFR-2). Shipped assets stay at 20 MB or less (`tests/budget.test.js`).
- Nothing leaves the browser (NFR-3). The sky file is served from the product's own address.
- No empty edge between ground and sky, in any direction (FR-3).
- Every shipped file has a licence record in `src/data/licences.js`.

## Design

### Asset

- One equirectangular sky photo, 4096×2048 JPEG, about 1.5 to 2.5 MB.
- Source: a CC0 sky from Poly Haven or ambientCG with a few soft clouds and a visible sun. The exact photo is chosen at implementation time and the builder can veto it.
- `scripts/prepare-sky.mjs` resizes the source and writes `public/assets/textures/sky.jpg`. It also writes `src/data/sky.json` with:
  - `horizon`: the average colour of a thin band just above the photo's horizon (hex).
  - `sun`: the direction of the brightest spot, as a unit vector.
- The texture budget test allows `sky.jpg` up to 3 MB. Every other texture stays at 1 MB.
- `ASSET_RECORDS` gets one record for the sky.

### In the world

- `manifest.js` lists the sky texture, so the loading indicator covers it. `sky.json` is not in the manifest: it lives in `src/data/` and code imports it. The data is bundled by Vite. World code may not call `fetch`, and this avoids a new loader type.
- `buildSky` puts the texture on the existing inside-out sphere. The material is unlit and ignores fog.
- The sphere turns very slowly, so the clouds drift (FR-14). `buildClouds` and the sphere clouds are removed.
- The sphere stays centred on the player.

### Horizon, fog and ground

- The fog colour and the scene background come from `sky.json`, not from the fixed `#cfe6f5`.
- The lower half of the sphere fades to that colour over a short band below the horizon. The ground meets the sky with no seam.
- Fog `near`, `far` and the width of the band are tuned by eye from every edge of the place.

### Light

- The directional light points from the sun direction in `sky.json`.
- Its colour is a warm white, which keeps the warm look of the place.

### Errors

- Sky texture fails to load: use the current gradient sphere with the fixed horizon colour.
- `sky.json` is missing or invalid: use the fixed colours and the current light direction.
- This is the same fallback pattern as the plain stand-ins for trees and the character.

### Tests (Vitest, no WebGL)

- `sky.json` holds a valid hex colour and a unit sun vector.
- `buildSky` uses the texture when it is loaded and the gradient when it is not.
- The manifest lists the sky texture. The licence test finds its record.
- The budget test allows the sky file up to 3 MB.
- `buildClouds` is gone. The sky tests are updated.

### Manual check

- Walk to each edge of the place. Look at the horizon, the sun and the ground seam.
- Check the frame rate with `?stats`.
- Update the world-visuals checklist and the out-of-scope note in the spec.

## Later: weather

A fixed photo cannot change its cloud cover. When weather comes, the options are:

- Darken and tint the sky, raise fog density, and add rain or snow particles.
- Cross-fade to a second sky photo (overcast, for example).

Both fit this design. The sky sphere, the fog colour and the light are already driven by values from one place.
