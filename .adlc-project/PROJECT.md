# Project Context

## Tech Stack

- Languages: JavaScript (ES modules), HTML, CSS (source: app/package.json)
- Frameworks: A-Frame 1.6.0 on three.js, built with Vite 8; asset tooling is Node scripts that use three and sharp to generate models and textures (source: app/package.json, app/scripts/)
- Databases: none; the character is kept in browser localStorage (source: app/src/logic/store.js)
- Infrastructure: Docker (Node 22 dev image, nginx production image); source hosted on GitHub, with CI in GitHub Actions (lint, format check, tests and build on pull requests and on pushes to main) and a GitHub Pages deploy that runs the tests before the build (source: app/Dockerfile, .github/workflows/ci.yml, .github/workflows/pages.yml)

## Coding Standards

- Formatting: Prettier with single quotes, checked in CI (source: app/.prettierrc)
- Linting: ESLint 10 with the recommended rules and the AFRAME global (source: app/eslint.config.js)
- Naming: camelCase for files, functions and variables; UPPER_CASE for constants (source: user)
- Testing strategy: Vitest in jsdom, a few files in node; unit tests for the pure modules in src/logic/, tests of the layout data (collision, the 444.5 m² walkable area, the plots), GLB guards (material names, sizes, window and door positions), asset-licence, credits and download-budget checks, a privacy scan of the code, and checklist-consistency tests; no end-to-end tests, and visual and performance checks are manual against the checklists in docs/verification/ (source: app/tests/, app/vite.config.js)

## System Architecture

- Architecture style: client-side single-page app; pure logic (src/logic/) kept apart from the A-Frame scene (src/world/) and screens (src/ui/); the world is lazy-loaded; src/world/layout.js and the plot data are the single source of truth for drawing and collision, the scenery beyond the garden has no collision, the neighbourhood and the interior load after the place is ready with stand-ins, and frame-rate trade-offs are build-time constants (source: app/src/main.js, app/src/world/layout.js, app/src/world/neighbourhood.js, app/src/world/neighbourhoodConfig.js)
- API design: none; there is no backend or network API (source: app/src/)
- State management: module-level variables in main.js plus versioned localStorage keys (source: app/src/logic/store.js)

## UX Guide

- Design system: the dark brand look for the start, confirm, intake and loading screens and the overlay, and the warm look for the 3D place, as set out in the brand rules (source: docs/BRAND.md)
- Styling: plain CSS with CSS variables in one stylesheet; brand images in public/brand/ (source: app/src/ui/styles.css)
- Accessibility: no level is promised; desktop browsers with keyboard and mouse or trackpad only, no mobile or touch support (source: README.md)
