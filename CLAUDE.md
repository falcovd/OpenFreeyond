# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

OpenFreeyond is a cozy 3D place in the desktop browser (A-Frame 1.6 on three.js, built with Vite) with a character who lives there. Phase 1 is a walkable world plus a character with a 7-field intake; voice conversation comes in phase 2. Vanilla JS (ES modules), no framework. Requires Node >= 22 (see `.nvmrc`).

## Commands

The app lives in `app/`. Run every command below from `app/`, and read every `src/`, `public/`, `scripts/`, `tests/` and config path in this file as relative to `app/`. Product documentation sits outside it: `specs/`, `discovery/` and `docs/` at the repository root.

- Dev server: `npm run dev` (port 5173) or `docker compose up`
- Tests: `npm test` (Vitest, jsdom). Single file: `npx vitest run tests/store.test.js`. Single test: `npx vitest run -t "name"`
- Lint: `npm run lint`. Format: `npm run format` / `npm run format:check`
- Build: `npm run build`. Production image: `docker build --target prod -t openfreeyond-prod .`
- `?stats` in the URL shows the frame-rate display.
- CI (`.github/workflows/ci.yml`) runs lint, format:check, test and build, so all four must pass. GitHub Pages deploys use `BASE_PATH` (read in `vite.config.js`); asset URLs must go through `import.meta.env.BASE_URL`.

## Architecture

Two layers, kept apart so logic can be tested without WebGL:

- `src/logic/`: pure, DOM-light modules (validation, localStorage store, colours, collision, start-screen options, browser support checks). This is where unit tests live (`tests/`).
- `src/world/` and `src/ui/`: the A-Frame scene and the HTML screens.

Flow in `src/main.js`: start screen, then confirm or intake form, then `enterWorld`. The world is lazy-loaded (`import('./world/scene.js')`) so the start/intake screens do not pull in A-Frame. `screenToken` guards against a slow world load finishing after the user has navigated away.

World details that span files:

- `src/world/layout.js` is the single source of truth for `BOUNDS`, `SPAWN`, `CHARACTER_SPOT` and `SOLIDS`. `scene.js` draws the solids from it and `walk-limiter` (in `components.js`) uses the same list for collision via `logic/collision.js`. Garden solids are edited in `SOLIDS`; house solids come from `WALLS` and `INTERIOR_ITEMS` (pushed onto `SOLIDS` at module load) (the boundary is 24 by 22 m). The walk-limiter moves in small steps so thin fences cannot be skipped.
- The house can be entered. In `layout.js` it is `WALLS`, a door solid and a swing solid (both can be `off`, which collision and `walkableArea` skip), `INTERIOR_ITEMS` and `LIGHTS`. `HOUSE_BLOCK` (one closed block) stands in when the house fails (`useClosedHouse`, `resetHouse`). `wanderSolids()` keeps the character out of the house; `outsideSolids()` is what the 444.5 m² walkable-area check measures. Windows are on the outside only, and there are no stairs or upper floor.
- The house is `public/assets/models/house.glb`, generated from `layout.js` by `npm run build:house` (`scripts/build-house.mjs`). Reconvert after you change the house numbers; `tests/house-glb.test.js` guards the material names. `public/assets/interior/kitchen.glb` is made from five Kenney pieces by `scripts/build-kitchen.mjs`.
- The interior loads after the place is ready: `loadInterior` (in `assetLoader.js`) fetches the files of `interiorManifest()` (each file starts on its own), and each model replaces its plain block (blocks solid from the first frame, kept when a file fails). Interior files are outside the 30 s load rule. `TV_MODE` (`'clip'` or `'still'`) and `INTERIOR_DIM` are in `src/world/interiorConfig.js`; `TV_MODE = 'still'` is the FR-22 fallback when the frame rate misses 30.
- The front door is the `house-door` component in `components.js`. Pure rules are in `src/logic/door.js` (state machine, swing space, hint and step-aside rules), `click.js` (click versus drag) and `tv.js` (clip or still). The door state is never stored: every visit starts closed, and nothing about the door or the person is saved or sent (`tests/privacy.test.js` guards it).
- `scene.js` builds the scene as an HTML string (`mountWorld`). Anything user-supplied (character colours) must pass through `safeId` before reaching markup.
- Teardown is fragile: `destroy()` must stop A-Frame's render loop manually, and `teardown.js` removes the `a-fullscreen` class that A-Frame leaves on `<html>`, otherwise the start and intake screens cannot scroll. `teardown.js` must not import `aframe` so it stays unit-testable.
- The character is `public/assets/character.glb`, produced from an FBX by `scripts/convert-character.mjs` (metres, the clips named on the command line, optional `Material=#hex` overrides). `tests/character-glb.test.js` guards that the GLB keeps the material names that `logic/colours.js` recolours, so keep those names when reconverting.
- The character wanders. `src/logic/wander.js` (pure) picks targets, finds routes on a grid and runs the idle, walk and greet states (greet includes one wave per approach: `waveNow`, reset when the person goes beyond `greetFar`). `character-wander` in `components.js` moves the entity and the `character` entry of `SOLIDS` (reset by `resetCharacterSolid` on teardown); `character-animation` plays the `Idle`, `Walk` and `Wave` clips (Wave once, on the `character-wave` event). `character.glb` has exactly those three clips, made by `scripts/convert-character.mjs` with `Idle,Walk,Wave` (no colour overrides). The converter also shortens the shoes and softens the ankle (`scripts/lib/foot-tweaks.mjs`, amounts in `FOOT`), because the original feet look like flippers when they swing; so a reconversion needs no extra step. `tests/walk-speed.test.js` keeps `WANDER.speed` equal to the Walk clip's measured ground speed.
- The GLB has eyes and eyebrows but no mouth. `src/world/builders/mouth.js` draws one as a thin ribbon and the `character-mouth` component hangs it on the `Head` bone, so it follows the animation. Its numbers are in head-bone space; re-measure them if the model is reconverted.
- The character is stored in the user's own browser (`localStorage`, versioned keys such as `openfreeyond.character.v1`). Storage can be unavailable or corrupt, so `store.js` returns status objects instead of throwing, and `main.js` shows notices for those cases.

## Repo notes

- `app/source-assets/` (git-ignored) holds raw source models (Quaternius, Downtown City MegaKit). Only `public/assets/` ships.
- `specs/`, `discovery/` and `docs/` (all at the repository root) hold the product spec, plans, and verification checklist (`docs/verification/phase-1-checklist.md`). `docs/plans/project-plan.md` is in Dutch. `specs/world-visuals/` is the spec for the next visual-overhaul work (sky, grass, trees, house, loading indicator; targets 30 fps). `specs/enter-the-house/` is the spec for the enterable house; its plan is `docs/plans/2026-11-09-enter-the-house.md` and its checklist `docs/verification/enter-the-house-checklist.md`. The first-visit transfer limit is 100 MB (it replaces the 30 MB of the world-visuals spec; `tests/budget.test.js` keeps shipped assets at 90 MB).
- Prettier and ESLint are enforced; the phase 1 spec states no accessibility level and desktop browsers only.
- Branding: read `docs/BRAND.md` before changing colours, logos, fonts or on-screen wording. The start, confirm, intake and loading screens and the overlay use the dark brand look (CSS variables in `src/ui/styles.css`); the 3D place keeps its warm look. Brand images live in `public/brand/` (made by `scripts/make-brand-assets.mjs`), outside `public/assets/`, so the licence and budget tests do not cover them.

@AGENTS.md
