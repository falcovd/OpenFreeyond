# OpenFreeyond

A cozy 3D place in the desktop browser, with a character who lives there. Phase 1 of the plan in `plans/project-plan.md`.

## Run

- Dev: `docker compose up`, then open http://localhost:5173
- Tests: `npm test`. Lint: `npm run lint`.
- Production build in nginx: `docker build --target prod -t openfreeyond-prod . && docker run --rm -p 8080:80 openfreeyond-prod`
- Frame-rate display: add `?stats` to the address.

## Known limitations (phase 1)

- No accessibility level is promised. Keyboard and mouse or trackpad only (NFR-4).
- Desktop and laptop browsers only: latest Chrome, Firefox and Safari. No mobile support.
- Everything you fill in stays in your own browser. Another browser or device does not see it, and clearing site data removes it.

## Documents

- Spec: `specs/openfreeyond-companion/spec.md`
- Plan: `docs/plans/2026-11-07-openfreeyond-phase-1.md`
- Checklist: `docs/verification/phase-1-checklist.md`
- Interview and session routines: `docs/process/`
