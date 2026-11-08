# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

OpenFreeyond is a cozy 3D place in the desktop browser (A-Frame 1.6 on three.js, built with Vite) with a character who lives there. Phase 1 is a walkable world plus a character with a 7-field intake; voice conversation comes in phase 2. Vanilla JS (ES modules), no framework. Requires Node >= 22 (see `.nvmrc`).

## Commands

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

- `src/world/layout.js` is the single source of truth for `BOUNDS`, `SPAWN`, `CHARACTER_SPOT` and `SOLIDS`. `scene.js` draws the solids from it and `walk-limiter` (in `components.js`) uses the same list for collision via `logic/collision.js`. Add or move an object by editing `SOLIDS` only. The walk-limiter moves in small steps so thin fences cannot be skipped.
- `scene.js` builds the scene as an HTML string (`mountWorld`). Anything user-supplied (character colours) must pass through `safeId` before reaching markup.
- Teardown is fragile: `destroy()` must stop A-Frame's render loop manually, and `teardown.js` removes the `a-fullscreen` class that A-Frame leaves on `<html>`, otherwise the start and intake screens cannot scroll. `teardown.js` must not import `aframe` so it stays unit-testable.
- The character is `public/assets/character.glb`, produced from an FBX by `scripts/convert-character.mjs` (metres, one animation clip, optional `Material=#hex` overrides). `tests/character-glb.test.js` guards that the GLB keeps the material names that `logic/colours.js` recolours, so keep those names when reconverting.
- The GLB has eyes and eyebrows but no mouth. `src/world/builders/mouth.js` draws one as a thin ribbon and the `character-mouth` component hangs it on the `Head` bone, so it follows the idle animation. Its numbers are in head-bone space; re-measure them if the model is reconverted.
- The character is stored in the user's own browser (`localStorage`, versioned keys such as `openfreeyond.character.v1`). Storage can be unavailable or corrupt, so `store.js` returns status objects instead of throwing, and `main.js` shows notices for those cases.

## Repo notes

- `/assets/` (root, git-ignored) holds raw source models (Quaternius, Downtown City MegaKit). Only `public/assets/` ships.
- `specs/`, `discovery/`, `plans/`, `docs/` hold the product spec, plans, and verification checklist (`docs/verification/phase-1-checklist.md`). `plans/project-plan.md` is in Dutch. `specs/world-visuals/` is the spec for the next visual-overhaul work (sky, grass, trees, house, loading indicator; targets 30 fps and a 30 MB first-visit transfer).
- Prettier and ESLint are enforced; the phase 1 spec states no accessibility level and desktop browsers only.
- Branding: read `BRAND.md` before changing colours, logos, fonts or on-screen wording. The start, confirm, intake and loading screens and the overlay use the dark brand look (CSS variables in `src/ui/styles.css`); the 3D place keeps its warm look. Brand images live in `public/brand/` (made by `scripts/make-brand-assets.mjs`), outside `public/assets/`, so the licence and budget tests do not cover them.

@AGENTS.md
