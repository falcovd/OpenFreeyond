# OpenFreeyond

A cozy 3D place in the desktop browser, with a character who lives there. You walk around with keyboard and mouse, and the character wanders through the garden. Phase 1 of the plan in `docs/plans/project-plan.md`. Talking to the character by voice is planned for phase 2.

Built with [A-Frame](https://aframe.io) 1.6 (three.js), Vite and plain JavaScript modules. No framework.

## What it does

- A start screen with a try-out option and a character intake (7 fields).
- A walkable place with a photographic sky, grass, trees, bushes, flower beds and furniture. Solid objects block you, and sun shadows follow the visible sun.
- A fenced garden: a fence along all four edges and a closed gate at the end of a path of paving slabs. The fence is what stops you.
- A house you can enter. Click the front door (within 3 m) to open or close it; the kitchen and living room are furnished, and the TV plays a short clip.
- A street beyond the gate (sidewalks, curbs, a road), and a neighbourhood around the garden: a neighbouring plot on each side and five plots across the road, each with a European-style house, a garden, a parked car and a street lamp, and a picture of more buildings on the horizon. All of it is scenery you can see but not reach.
- A loading indicator while the place loads. The neighbourhood loads after the place is ready and appears as it arrives. If a model fails to load, a plain stand-in is used and one message says so.
- A character who wanders through the garden, and stops, faces you and waves once when you come close. Its hair and clothing colours follow your intake.
- Your character is kept in your browser, so it is still there on your next visit.

## Run

Requires Node 22 or newer (see `app/.nvmrc`). The app lives in `app/`: run every command below from there (`cd app`).

- Dev: `docker compose up`, then open http://localhost:5173. Without Docker: `npm ci` and `npm run dev`.
- Tests: `npm test`. Lint: `npm run lint`. Format check: `npm run format:check`.
- Build: `npm run build`. The output goes to `dist/`.
- Production build in nginx: `docker build --target prod -t openfreeyond-prod . && docker run --rm -p 8080:80 openfreeyond-prod`
- Frame-rate display: add `?stats` to the address.
- Regenerate the house models: `npm run build:house` (our house) and `npm run build:neighbours` (the four neighbour house shapes).

## Controls

- Move: W, A, S, D.
- Look: move the mouse (click and drag).
- Open or close the front door: click it, within 3 m.

## Project layout

| Path                         | Contents                                                                                               |
| ---------------------------- | ------------------------------------------------------------------------------------------------------ |
| `app/`                       | The whole app: source, tests, tooling, configs, Dockerfile. Run all npm and Docker commands here.      |
| `app/src/logic/`             | Pure logic: validation, storage, colours, collision, door, wandering. Covered by unit tests.           |
| `app/src/world/`             | The A-Frame scene, the world layout, the plots of the neighbourhood, asset loading, custom components. |
| `app/src/ui/`                | The start, confirm and intake screens, and their styles.                                               |
| `app/src/data/`              | Asset licence data shown under "Credits".                                                              |
| `app/public/`                | What ships with the site: `assets/` (models, textures) and `brand/` (logo, favicons).                  |
| `app/scripts/`               | Asset tooling: converters and generators for the character, house, kitchen, textures and brand images. |
| `app/tests/`                 | Vitest tests.                                                                                          |
| `app/source-assets/`         | Raw source models and images (git-ignored, not shipped).                                               |
| `specs/`, `discovery/`       | Product specs and discovery notes, one folder per feature.                                             |
| `docs/`                      | Plans (`docs/plans/`), verification checklists, process notes and the brand rules (`docs/BRAND.md`).   |
| `.github/`, `.adlc-project/` | CI and deploy workflows; project context for agents.                                                   |

To add or move something in our garden, edit `src/world/layout.js`. Drawing and collision both read from it. The other plots, houses, cars and lamps are scenery with no collision: their data is in `src/world/plots.js`, `houseLooks.js` and `streetLayout.js`, and the switches that trade detail for frame rate are in `src/world/neighbourhoodConfig.js`.

## Deploying

CI (`.github/workflows/ci.yml`) runs lint, format check, tests and build on every pull request. A separate workflow publishes to GitHub Pages and sets `BASE_PATH` for the build.

## Known limitations

- No accessibility level is promised. Keyboard and mouse or trackpad only (NFR-4).
- Desktop and laptop browsers only: latest Chrome, Firefox and Safari. No mobile support.
- Everything you fill in stays in your own browser. Another browser or device does not see it, and clearing site data removes it.
- The movement of trees and clouds cannot be switched off, and no accessibility level is promised (world visuals NFR-4).
- Shadows follow you within 27 m: objects farther away show no shadow.
- The backdrop picture of buildings is a generated image and repeats around the horizon; its source terms are still to be confirmed (see `CREDITS.md`).
- The 30 frames per second goal is measured in Chrome on the builder's laptop only. Firefox and Safari are best effort; there is no floor for other laptops.

## Documents

- Spec: `specs/openfreeyond-companion/spec.md`
- Plan: `docs/plans/2026-11-07-openfreeyond-phase-1.md`
- Checklist: `docs/verification/phase-1-checklist.md`
- Interview and session routines: `docs/process/`
- World visuals spec: `specs/world-visuals/spec.md`
- World visuals plan: `docs/plans/2026-11-08-world-visuals.md`
- World visuals checklist: `docs/verification/world-visuals-checklist.md`
- Brand rules (colours, logo, wording): `docs/BRAND.md`
- Asset licences: `app/src/data/licences.js` (shown on the start screen under the "Credits" link in the footer)
- Brand refresh plan: `docs/plans/2026-11-08-brand-refresh.md`
- Enter the house: `specs/enter-the-house/spec.md`, `docs/plans/2026-11-09-enter-the-house.md`, `docs/verification/enter-the-house-checklist.md`
- Garden fences and street: `specs/garden-fences-and-street/spec.md`, `docs/plans/2026-11-09-garden-fences-and-street.md`, `docs/verification/garden-fences-and-street-checklist.md`
- Neighbourhood: `specs/neighbourhood/spec.md` (v2), `docs/plans/2026-11-09-neighbourhood.md`, `docs/verification/neighbourhood-checklist.md`, `specs/neighbourhood/verification-v1.md`
- Sun shadows: `docs/plans/2026-11-09-shadows-design.md`, `docs/plans/2026-11-09-shadows.md`

## Licence and credits

The OpenFreeyond source code is under the MIT licence (see `LICENSE`). The models, textures and pictures keep their own licences and are listed in `CREDITS.md`; the same list is shown on the start page under "Credits". A few records are still marked as to be confirmed before a release: the character pack, the generated house models and the generated backdrop picture.
