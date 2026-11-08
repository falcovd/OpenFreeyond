# Project Context

## Tech Stack

- Languages: JavaScript (ES modules), HTML, CSS (source: package.json)
- Frameworks: A-Frame 1.6.0 on three.js, built with Vite 8 (source: package.json)
- Databases: none; the character is kept in browser localStorage (source: src/logic/store.js)
- Infrastructure: Docker (Node 22 dev image, nginx production image); GitHub Pages deployed from GitHub Actions (source: Dockerfile, .github/workflows/pages.yml)

## Coding Standards

- Formatting: Prettier with single quotes, checked in CI (source: .prettierrc)
- Linting: ESLint 10 with the recommended rules and the AFRAME global (source: eslint.config.js)
- Naming: camelCase for files, functions and variables; UPPER_CASE for constants (source: user)
- Testing strategy: Vitest in jsdom; unit tests for the pure modules in src/logic/ and a GLB material-name guard; no end-to-end tests (source: vite.config.js)

## System Architecture

- Architecture style: client-side single-page app; pure logic (src/logic/) kept apart from the A-Frame scene (src/world/) and screens (src/ui/); the world is lazy-loaded (source: src/main.js)
- API design: none; there is no backend or network API (source: src/)
- State management: module-level variables in main.js plus versioned localStorage keys (source: src/logic/store.js)
