# Shadows from the sun: design

Date: 2026-11-09. Status: approved by the builder (PO) in conversation. Not in spec v1 of any feature; recorded here and in the plan addendum.

## Goal

Objects in the place cast shadows. The shadows follow the position of the sun that you see in the sky, so they look natural.

## What exists

- The sun is one `DirectionalLight` inside the sky group (`app/src/world/builders/sky.js`). Its direction comes from `app/src/data/sky.json`, the sun in the sky photo.
- The sky group turns slowly (`SKY_DRIFT`, one full turn in about 105 minutes) and the light turns with it. So the light direction already follows the visible sun.
- Nothing casts or receives shadows. The scene has an ambient light, one garden point light and the four room lights.

## Decision: what "the position of the sun" means

The visible sun in the sky photo, with the existing slow drift. No clock and no day-night change (out of scope in the specs). Rejected: real clock time (would disagree with the fixed sky photo), a frozen sun.

## Approach

A real shadow map from the existing sun light. Rejected: blob shadows (cannot follow the sun, wrong for the house). Fallback if frame rate fails: refresh the shadow map a few times a second.

## Design

- **Sun and map.** The sun light casts shadows. Map size 2048, soft filtering. The shadow camera is an orthographic box fitted to the boundary plus a margin, and tall enough for the roof and the trees. A pure function `shadowFrustum(bounds, sunDirection, maxHeight)` in `app/src/logic/` computes it, so it is unit-tested. The light target stays at the origin, so the shadow camera follows the light as the sky group turns.
- **Casters.** Trees, bushes, hedge, fences, garden furniture, the house walls and roof, the character.
- **Receivers.** Ground, path, the house, furniture, the character.
- **Neither.** The sky sphere. The see-through window glass does not cast, so sunlight can enter through the windows.
- **Interior items.** They receive only. This saves cost, and the roof and walls already shade the rooms.
- **Interior look.** The roof and walls now block the sun, so the rooms get darker. Retune `INTERIOR_DIM`, `CEILING_DIM` and the room lights by eye.
- **Ambient light.** Keep it. Lower it slightly only if the shadows look too weak. The garden keeps its warm look.
- **Switch.** A build-time constant `SHADOWS = 'on' | 'off'` in `app/src/world/interiorConfig.js` style (a config file, no run-time switch). Off means no shadow map is allocated.
- **Renderer.** Enable shadows in A-Frame with the scene `shadow` system (soft type). Bias and normal bias are tuned to avoid acne and peter-panning.

## Performance

Shadows add a depth pass, so NFR-1 (30 fps in Chrome on the builder's laptop) is at risk. The builder measures it in the Task 15 frame-rate walk. FR-22 only names the TV as the first thing to drop, so the order of what to drop now needs a builder decision. Shadows are the new cost.

## Testing

- Unit: the frustum function covers the boundary and the tallest caster for several sun directions.
- Unit: the flags per object kind, with glass and the sky excluded, and interior items receive-only.
- Unit: `SHADOWS = 'off'` allocates no shadow map and sets no cast flags.
- Visual: headless Chrome screenshots at several sun azimuths (turn the sky group), read by eye. The builder judges the final look.

## Docs

Add an addendum to `docs/plans/2026-11-09-enter-the-house.md` and rows to `docs/verification/enter-the-house-checklist.md` (shadow look, frame rate with shadows on and off).
