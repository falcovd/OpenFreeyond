# OpenFreeyond: a neighbourhood around the plot: Verification v1

## Summary
Verdict: partial
Spec: specs/neighbourhood/spec.md (v2). Date: 2026-11-09. Tests: run.

Branch `neighbourhood` at commit bafa0ab. `npm test` in `app/`: 65 files, 664 tests, all passed. Of 60 criteria, 38 are covered (29 by ID, 9 by a link the user confirmed) and 22 are not verifiable. None is uncovered or deviating. AC-4.6 is retired in v2 and is not counted.

## Limits
- Nothing was looked at in a browser. Twenty-two criteria are judged by the builder by eye, by measurement or in other browsers, and are `not verifiable` here: AC-1.3, AC-1.5, AC-1.9, AC-2.2, AC-3.7, AC-4.1, AC-4.2, AC-4.3, AC-4.5, AC-4.8, AC-5.1, AC-5.5, AC-6.1, AC-6.2, AC-6.3, AC-6.4, AC-6.5, AC-6.6, AC-6.8, AC-6.13, AC-6.19, AC-6.20.
- The frame-rate walk, the transfer measurement, the loading times on Slow 4G and without throttling, and the browser check (AC-6.1 to AC-6.6, AC-6.8, AC-6.19; NFR-1 to NFR-3, NFR-5) are the builder's own measurements and have not been done. Task 14 of the plan is open.
- AC-5.5 needs the "before" views of the scene from `main`, captured before the feature changed it (Task 0 of the plan). `docs/verification/neighbourhood-before/` does not exist yet. The test `app/tests/shadowFrustum.test.js:26` only shows that the shadow-map texel size is no larger than today's (2.64 cm against 2.66 cm).
- AC-6.20: the licence record of the backdrop (app/src/data/licences.js:214) names Google Gemini and says the terms are to be confirmed. The builder has not confirmed them yet, so the criterion is not met.
- AC-4.8 is a go-online decision. It is not met or unmet until the builder decides.
- Older specs reuse the same AC numbers. A hit on an AC ID counts only in files that belong to this feature. Hits in older tests (for example `app/tests/garden-layout.test.js`, `app/tests/door.test.js`) refer to other specs and are used only where the user confirmed the match by meaning.
- Nine links matched by meaning and were confirmed by the user: AC-1.7, AC-2.4, AC-2.5, AC-2.6, AC-3.6, AC-5.3, AC-5.4, AC-6.11 and AC-6.17.
- AC-1.6, AC-2.1 and the other layout criteria are checked against the layout data by tests. Whether they look right on screen (house shapes, tints, the backdrop seam and its 8-fold repetition, car direction) is not checked.
- AC-5.6, AC-7.1 and AC-7.2 are covered by rule and static checks: the shadow flags of the neighbourhood objects, and a scan that the new files contain no network or storage code. That the shadows are visible on screen, the network tab and browser storage are not inspected.
- AC-6.12 is covered by the manifest checks (every URL is under the app's own address). The network-tab inspection is open.
- Facing the house at the start (AC-5.3) relies on A-Frame's default camera direction and is not asserted.
- The generated picture was not inspected at full size for brand names, signs or recognisable people (AC-4.5).

## Stories
| Story | Verdict | Covered / total |
| --- | --- | --- |
| US-1 | partial | 6 / 9 |
| US-2 | partial | 8 / 9 |
| US-3 | partial | 6 / 7 |
| US-4 | partial | 2 / 7 |
| US-5 | partial | 4 / 6 |
| US-6 | partial | 10 / 20 |
| US-7 | verified | 2 / 2 |

## Traceability
| AC | Story | Requirements | Status | Evidence | Link | Test |
| --- | --- | --- | --- | --- | --- | --- |
| AC-1.1 | US-1 | FR-1, FR-2, FR-3, FR-10 | covered | app/tests/plots.test.js:56 | id | pass |
| AC-1.2 | US-1 | FR-1, FR-2, FR-3, FR-10 | covered | app/tests/plots.test.js:62 | id | pass |
| AC-1.3 | US-1 | FR-1, FR-2, FR-3, FR-10 | not verifiable | none | none | n/a |
| AC-1.4 | US-1 | FR-1, FR-2, FR-3, FR-10 | covered | app/tests/plots.test.js:73, app/tests/plots.test.js:89, app/tests/plots.test.js:94 | id | pass |
| AC-1.5 | US-1 | FR-1, FR-2, FR-3, FR-10 | not verifiable | none | none | n/a |
| AC-1.6 | US-1 | FR-1, FR-2, FR-3, FR-10 | covered | app/tests/plots.test.js:148, app/tests/builders-plots.test.js:52 | id | pass |
| AC-1.7 | US-1 | FR-1, FR-2, FR-3, FR-10 | covered | app/tests/garden-layout.test.js:61, app/tests/garden-layout.test.js:96 | inferred-confirmed | pass |
| AC-1.8 | US-1 | FR-1, FR-2, FR-3, FR-10 | covered | app/tests/builders-plots.test.js:132 | id | pass |
| AC-1.9 | US-1 | FR-1, FR-2, FR-3, FR-10 | not verifiable | none | none | n/a |
| AC-2.1 | US-2 | FR-4, FR-5, FR-6 | covered | app/tests/plots.test.js:169, app/tests/plots.test.js:170 | id | pass |
| AC-2.2 | US-2 | FR-4, FR-5, FR-6 | not verifiable | none | none | n/a |
| AC-2.3 | US-2 | FR-4, FR-5, FR-6 | covered | app/tests/plots.test.js:213 | id | pass |
| AC-2.4 | US-2 | FR-4, FR-5, FR-6 | covered | app/tests/plots.test.js:213, app/tests/neighbour-houses-glb.test.js:93 | inferred-confirmed | pass |
| AC-2.5 | US-2 | FR-4, FR-5, FR-6 | covered | app/tests/builders-neighbour-house.test.js:95, app/tests/neighbour-houses-glb.test.js:161 | inferred-confirmed | pass |
| AC-2.6 | US-2 | FR-4, FR-5, FR-6 | covered | app/tests/builders-house.test.js:76 | inferred-confirmed | pass |
| AC-2.7 | US-2 | FR-4, FR-5, FR-6 | covered | app/tests/plots.test.js:226, app/tests/plots.test.js:227, app/tests/plots.test.js:260 | id | pass |
| AC-2.8 | US-2 | FR-4, FR-5, FR-6 | covered | app/tests/plots.test.js:169, app/tests/plots.test.js:178 | id | pass |
| AC-2.9 | US-2 | FR-4, FR-5, FR-6 | covered | app/tests/plots.test.js:127, app/tests/plots.test.js:140, app/tests/plots.test.js:205 | id | pass |
| AC-3.1 | US-3 | FR-7, FR-8 | covered | app/tests/street-layout.test.js:63, app/tests/street-layout.test.js:72 | id | pass |
| AC-3.2 | US-3 | FR-7, FR-8 | covered | app/tests/street-layout.test.js:63, app/tests/street-layout.test.js:79 | id | pass |
| AC-3.3 | US-3 | FR-7, FR-8 | covered | app/tests/street-layout.test.js:63, app/tests/builders-props.test.js:147 | id | pass |
| AC-3.4 | US-3 | FR-7, FR-8 | covered | app/tests/street-layout.test.js:63, app/tests/street-layout.test.js:102 | id | pass |
| AC-3.5 | US-3 | FR-7, FR-8 | covered | app/tests/street-layout.test.js:63, app/tests/street-layout.test.js:130 | id | pass |
| AC-3.6 | US-3 | FR-7, FR-8 | covered | app/tests/builders-props.test.js:75 | inferred-confirmed | pass |
| AC-3.7 | US-3 | FR-7, FR-8 | not verifiable | none | none | n/a |
| AC-4.1 | US-4 | FR-9 | not verifiable | none | none | n/a |
| AC-4.2 | US-4 | FR-9 | not verifiable | none | none | n/a |
| AC-4.3 | US-4 | FR-9 | not verifiable | none | none | n/a |
| AC-4.4 | US-4 | FR-9 | covered | app/tests/builders-backdrop.test.js:14, app/tests/builders-backdrop.test.js:36 | id | pass |
| AC-4.5 | US-4 | FR-9 | not verifiable | none | none | n/a |
| AC-4.7 | US-4 | FR-9 | covered | app/tests/neighbourhood.test.js:23, app/tests/neighbourhood.test.js:66, app/tests/builders-backdrop.test.js:51 | id | pass |
| AC-4.8 | US-4 | FR-9 | not verifiable | none | none | n/a |
| AC-5.1 | US-5 | FR-11, FR-12 | not verifiable | none | none | n/a |
| AC-5.2 | US-5 | FR-11, FR-12 | covered | app/tests/plots.test.js:306, app/tests/plots.test.js:323 | id | pass |
| AC-5.3 | US-5 | FR-11, FR-12 | covered | app/tests/garden-layout.test.js:155 | inferred-confirmed | pass |
| AC-5.4 | US-5 | FR-11, FR-12 | covered | app/tests/garden-layout.test.js:179, app/tests/wander.test.js:223 | inferred-confirmed | pass |
| AC-5.5 | US-5 | FR-11, FR-12 | not verifiable | none | none | n/a |
| AC-5.6 | US-5 | FR-11, FR-12 | covered | app/tests/shadows.test.js:138, app/tests/shadows.test.js:197 | id | pass |
| AC-6.1 | US-6 | FR-13, FR-14, FR-15, FR-16, NFR-5, NFR-6 | not verifiable | none | none | n/a |
| AC-6.2 | US-6 | FR-13, FR-14, FR-15, FR-16, NFR-5, NFR-6 | not verifiable | none | none | n/a |
| AC-6.3 | US-6 | FR-13, FR-14, FR-15, FR-16, NFR-5, NFR-6 | not verifiable | none | none | n/a |
| AC-6.4 | US-6 | FR-13, FR-14, FR-15, FR-16, NFR-5, NFR-6 | not verifiable | none | none | n/a |
| AC-6.5 | US-6 | FR-13, FR-14, FR-15, FR-16, NFR-5, NFR-6 | not verifiable | none | none | n/a |
| AC-6.6 | US-6 | FR-13, FR-14, FR-15, FR-16, NFR-5, NFR-6 | not verifiable | none | none | n/a |
| AC-6.7 | US-6 | FR-13, FR-14, FR-15, FR-16, NFR-5, NFR-6 | covered | app/tests/builders-neighbour-house.test.js:40, app/tests/neighbourhood.test.js:81 | id | pass |
| AC-6.8 | US-6 | FR-13, FR-14, FR-15, FR-16, NFR-5, NFR-6 | not verifiable | none | none | n/a |
| AC-6.9 | US-6 | FR-13, FR-14, FR-15, FR-16, NFR-5, NFR-6 | covered | app/tests/builders-neighbour-house.test.js:40, app/tests/neighbourhood.test.js:99 | id | pass |
| AC-6.10 | US-6 | FR-13, FR-14, FR-15, FR-16, NFR-5, NFR-6 | covered | app/tests/licences.test.js:43 | id | pass |
| AC-6.11 | US-6 | FR-13, FR-14, FR-15, FR-16, NFR-5, NFR-6 | covered | app/tests/credits.test.js:31 | inferred-confirmed | pass |
| AC-6.12 | US-6 | FR-13, FR-14, FR-15, FR-16, NFR-5, NFR-6 | covered | app/tests/manifest.test.js:153, app/tests/manifest.test.js:159 | id | pass |
| AC-6.13 | US-6 | FR-13, FR-14, FR-15, FR-16, NFR-5, NFR-6 | not verifiable | none | none | n/a |
| AC-6.14 | US-6 | FR-13, FR-14, FR-15, FR-16, NFR-5, NFR-6 | covered | app/tests/missing-items.test.js:77, app/tests/missing-items.test.js:89 | id | pass |
| AC-6.15 | US-6 | FR-13, FR-14, FR-15, FR-16, NFR-5, NFR-6 | covered | app/tests/neighbourhood.test.js:23, app/tests/neighbourhood.test.js:148, app/tests/assetLoader.test.js:251 | id | pass |
| AC-6.16 | US-6 | FR-13, FR-14, FR-15, FR-16, NFR-5, NFR-6 | covered | app/tests/assetLoader.test.js:238 | id | pass |
| AC-6.17 | US-6 | FR-13, FR-14, FR-15, FR-16, NFR-5, NFR-6 | covered | app/tests/neighbourhood.test.js:164 | inferred-confirmed | pass |
| AC-6.18 | US-6 | FR-13, FR-14, FR-15, FR-16, NFR-5, NFR-6 | covered | app/tests/neighbourhood.test.js:223 | id | pass |
| AC-6.19 | US-6 | FR-13, FR-14, FR-15, FR-16, NFR-5, NFR-6 | not verifiable | none | none | n/a |
| AC-6.20 | US-6 | FR-13, FR-14, FR-15, FR-16, NFR-5, NFR-6 | not verifiable | none | none | n/a |
| AC-7.1 | US-7 | NFR-4 | covered | app/tests/privacy.test.js:90, app/tests/privacy.test.js:102 | id | pass |
| AC-7.2 | US-7 | NFR-4 | covered | app/tests/privacy.test.js:90, app/tests/privacy.test.js:102 | id | pass |

## Findings
No criterion is uncovered or deviating. Notes on the `not verifiable` criteria:
- AC-1.3, AC-1.5: whether the other plots' fences and gates look right is a visual judgement. The data is checked by `app/tests/plots.test.js:127` and `app/tests/fenceLine.test.js:82`.
- AC-1.9: the street carries on out of view with no end in sight. A view along the street; the street data is unchanged and the ends sit inside the fog by straight-line distance (`app/tests/street-layout.test.js:50`), but the fog uses view depth, so check by eye.
- AC-2.2: the style test of each house (tiled roof, brick or rendered facade, at least 4 street windows, door) is judged by eye. The model files carry at least 4 street windows and a door (`app/tests/neighbour-houses-glb.test.js:131`).
- AC-3.7, AC-4.1, AC-4.2, AC-4.3, AC-4.5: recognisability, the backdrop's look, seam, void and brand check are visual. The picture's edge match is tested (`app/tests/backdrop-image.test.js:52`), and the 8-fold repetition and the cross-fade over about 120 px need a look.
- AC-4.8: a go-online decision on the backdrop. The picture exists (generated with Gemini, decision D-38, spec v2).
- AC-5.1: a walk through the earlier checklists. The whole suite passes, but the person-judged items are the builder's.
- AC-5.5: see Limits: the "before" views are missing.
- AC-6.1 to AC-6.6, AC-6.8: measurements (frame rate, the FR-13 steps, transfer, loading times). The data side is checked: `app/tests/budget.test.js:16` (190 MB of shipped assets), `app/tests/manifest.test.js:113` (the neighbourhood manifest).
- AC-6.3: the removal of far plots is built (`FAR_PLOT_COUNT`, `app/tests/street-layout.test.js:150`), but no test builds the world with 3 far plots; judge by eye after step 3.
- AC-6.13: no readable brand logo or number plate on the cars. The guard test checks material names only (`app/tests/street-glb.test.js:23`); the cars carry blank grey rectangles.
- AC-6.19: the browsers check.
- AC-6.20: the builder has to confirm the Gemini terms (see Limits).
