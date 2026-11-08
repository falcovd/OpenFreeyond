# OpenFreeyond

A cozy 3D place in the desktop browser, with a character who lives there. You walk around with keyboard and mouse, and the character wanders through the garden. Phase 1 of the plan in `plans/project-plan.md`. Talking to the character by voice is planned for phase 2.

Built with [A-Frame](https://aframe.io) 1.6 (three.js), Vite and plain JavaScript modules. No framework.

## What it does

- A start screen with a try-out option and a character intake (7 fields).
- A walkable place with a photographic sky, grass, trees, a house, a fence and furniture. Solid objects block you.
- A loading indicator while the place loads. If a model fails to load, a plain stand-in is used.
- A character who wanders through the garden, and stops and faces you when you come close. Its hair and clothing colours follow your intake.
- Your character is kept in your browser, so it is still there on your next visit.

## Run

Requires Node 22 or newer (see `.nvmrc`).

- Dev: `docker compose up`, then open http://localhost:5173. Without Docker: `npm ci` and `npm run dev`.
- Tests: `npm test`. Lint: `npm run lint`. Format check: `npm run format:check`.
- Build: `npm run build`. The output goes to `dist/`.
- Production build in nginx: `docker build --target prod -t openfreeyond-prod . && docker run --rm -p 8080:80 openfreeyond-prod`
- Frame-rate display: add `?stats` to the address.

## Controls

- Move: W, A, S, D.
- Look: move the mouse (click and drag).

## Project layout

| Path                                      | Contents                                                                                                                |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `src/logic/`                              | Pure logic: validation, storage, colours, collision, start screen options, browser checks. Covered by unit tests.       |
| `src/world/`                              | The A-Frame scene, the world layout, asset loading and the custom components.                                           |
| `src/ui/`                                 | The start, confirm and intake screens, and their styles.                                                                |
| `public/assets/`                          | Models and textures that ship with the site, such as `character.glb`.                                                   |
| `public/brand/`                           | Brand images (logo, favicons), made by `scripts/make-brand-assets.mjs`.                                                 |
| `src/data/`                               | Asset licence data shown under "Credits".                                                                               |
| `scripts/`                                | Asset tooling: `convert-character.mjs` (FBX to GLB), `prepare-texture.mjs`, `prepare-sky.mjs`, `make-brand-assets.mjs`. |
| `tests/`                                  | Vitest tests.                                                                                                           |
| `specs/`, `discovery/`, `plans/`, `docs/` | Specs, discovery notes, plans, the verification checklist and process notes.                                            |

To add or move something in the world, edit `src/world/layout.js`. Drawing and collision both read from it.

## Deploying

CI (`.github/workflows/ci.yml`) runs lint, format check, tests and build on every pull request. A separate workflow publishes to GitHub Pages and sets `BASE_PATH` for the build.

## Known limitations (phase 1)

- No accessibility level is promised. Keyboard and mouse or trackpad only (NFR-4).
- Desktop and laptop browsers only: latest Chrome, Firefox and Safari. No mobile support.
- Everything you fill in stays in your own browser. Another browser or device does not see it, and clearing site data removes it.
- The movement of trees and clouds cannot be switched off, and no accessibility level is promised (world visuals NFR-4).
- The 30 frames per second goal is measured in Chrome on the builder's laptop only. Firefox and Safari are best effort; there is no floor for other laptops.

## Documents

- Spec: `specs/openfreeyond-companion/spec.md`
- Plan: `docs/plans/2026-11-07-openfreeyond-phase-1.md`
- Checklist: `docs/verification/phase-1-checklist.md`
- Interview and session routines: `docs/process/`
- World visuals spec: `specs/world-visuals/spec.md`
- World visuals plan: `docs/plans/2026-11-08-world-visuals.md`
- World visuals checklist: `docs/verification/world-visuals-checklist.md`
- Brand rules (colours, logo, wording): `BRAND.md`
- Asset licences: `src/data/licences.js` (shown on the start screen under the "Credits" link in the footer)
- Brand refresh plan: `docs/plans/2026-11-08-brand-refresh.md`

## Credits

The 3D models come from Quaternius packs. Check each pack's licence before publishing the place.
