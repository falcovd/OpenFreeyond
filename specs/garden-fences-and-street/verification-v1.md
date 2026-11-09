# OpenFreeyond: a fenced garden with a tiled path to the street: Verification v1

## Summary
Verdict: partial
Spec: specs/garden-fences-and-street/spec.md. Date: 2026-11-09. Tests: run.

Branch `garden-fences` at commit 65b4f2d. `npm test` in `app/`: 57 files, 483 tests, all passed. Of 47 criteria, 32 are covered (26 by ID, 6 by a link the user confirmed) and 15 are not verifiable. None is uncovered or deviating.

## Limits
- Nothing was looked at in a browser. Fifteen criteria are judged by the builder by eye, by measurement or in other browsers, and are `not verifiable` here: AC-1.5, AC-2.1, AC-3.1, AC-3.5, AC-4.1, AC-4.3, AC-4.6, AC-4.8, AC-5.6, AC-6.1, AC-6.2, AC-6.3, AC-6.4, AC-6.9, AC-6.14.
- The frame-rate walk (AC-6.1 to AC-6.3), the transfer measurement (AC-6.4) and the browser check (AC-6.14) are the builder's own measurements (spec NFR-1, NFR-2, NFR-4) and have not been done.
- Older specs reuse the same AC numbers. A hit on an AC ID counts here only in the files that belong to this feature. Hits in older tests (for example `tests/door.test.js`, `tests/house-layout.test.js`) refer to other specs and are not used.
- AC-4.3: the test checks the street ends inside the fog by straight-line distance, but A-Frame's fog uses view depth, so the ends may still show at wide view angles. Judged by eye.
- AC-5.5: the test covers the spawn position (on the path, 2 m inside the gate, free, reachable). Facing the house relies on A-Frame's default camera direction (toward -z) and is not asserted.
- AC-6.8 and AC-7.1 and AC-7.2 are covered by static checks (the manifest holds only the app's own addresses; the new files contain no network or storage code). The builder's inspection of the network tab and of browser storage is still open (Task 14 of the plan).
- AC-6.12: the test proves that one non-empty sentence is returned however many assets fail. That it is shown once per load rests on `mountWorld` calling `failureMessage` once (`app/src/world/scene.js:291`) and is not tested.
- AC-6.6: the street assets are all CC0, so no credit line is required. The test shows the Credits list shows every required credit.
- Six links matched by meaning and were confirmed by the user: AC-1.1, AC-4.9, AC-5.4, AC-6.5, AC-6.6 and AC-6.10.
- The far-side sidewalk (decision D-27) is not in the spec and is not covered by any criterion.

## Stories
| Story | Verdict | Covered / total |
| --- | --- | --- |
| US-1 | partial | 5 / 6 |
| US-2 | partial | 2 / 3 |
| US-3 | partial | 4 / 6 |
| US-4 | partial | 6 / 10 |
| US-5 | partial | 5 / 6 |
| US-6 | partial | 8 / 14 |
| US-7 | verified | 2 / 2 |

## Traceability
| AC | Story | Requirements | Status | Evidence | Link | Test |
| --- | --- | --- | --- | --- | --- | --- |
| AC-1.1 | US-1 | FR-1, FR-2, FR-3, FR-5 | covered | app/tests/fenceLine.test.js:33, app/tests/garden-layout.test.js:61 | inferred-confirmed | pass |
| AC-1.2 | US-1 | FR-1, FR-2, FR-3, FR-5 | covered | app/tests/garden-layout.test.js:60 | id | pass |
| AC-1.3 | US-1 | FR-1, FR-2, FR-3, FR-5 | covered | app/tests/garden-layout.test.js:60 | id | pass |
| AC-1.4 | US-1 | FR-1, FR-2, FR-3, FR-5 | covered | app/tests/fenceLine.test.js:10, app/tests/garden-layout.test.js:20 | id | pass |
| AC-1.5 | US-1 | FR-1, FR-2, FR-3, FR-5 | not verifiable | none | none | n/a |
| AC-1.6 | US-1 | FR-1, FR-2, FR-3, FR-5 | covered | app/tests/garden-layout.test.js:109, app/tests/garden-layout.test.js:129 | id | pass |
| AC-2.1 | US-2 | FR-4 | not verifiable | none | none | n/a |
| AC-2.2 | US-2 | FR-4 | covered | app/tests/builders-gate.test.js:17, app/tests/garden-layout.test.js:96 | id | pass |
| AC-2.3 | US-2 | FR-4 | covered | app/tests/fenceLine.test.js:50, app/tests/garden-layout.test.js:43 | id | pass |
| AC-3.1 | US-3 | FR-6, FR-7 | not verifiable | none | none | n/a |
| AC-3.2 | US-3 | FR-6, FR-7 | covered | app/tests/slabs.test.js:6 | id | pass |
| AC-3.3 | US-3 | FR-6, FR-7 | covered | app/tests/garden-layout.test.js:50 | id | pass |
| AC-3.4 | US-3 | FR-6, FR-7 | covered | app/tests/garden-layout.test.js:54 | id | pass |
| AC-3.5 | US-3 | FR-6, FR-7 | not verifiable | none | none | n/a |
| AC-3.6 | US-3 | FR-6, FR-7 | covered | app/tests/slabs.test.js:6, app/tests/builders-street.test.js:20 | id | pass |
| AC-4.1 | US-4 | FR-8, FR-9, FR-10, FR-11, FR-14 | not verifiable | none | none | n/a |
| AC-4.2 | US-4 | FR-8, FR-9, FR-10, FR-11, FR-14 | covered | app/tests/street-layout.test.js:36 | id | pass |
| AC-4.3 | US-4 | FR-8, FR-9, FR-10, FR-11, FR-14 | not verifiable | none | none | n/a |
| AC-4.4 | US-4 | FR-8, FR-9, FR-10, FR-11, FR-14 | covered | app/tests/street-layout.test.js:65 | id | pass |
| AC-4.5 | US-4 | FR-8, FR-9, FR-10, FR-11, FR-14 | covered | app/tests/builders-props.test.js:75 | id | pass |
| AC-4.6 | US-4 | FR-8, FR-9, FR-10, FR-11, FR-14 | not verifiable | none | none | n/a |
| AC-4.7 | US-4 | FR-8, FR-9, FR-10, FR-11, FR-14 | covered | app/tests/garden-layout.test.js:60, app/tests/street-layout.test.js:98 | id | pass |
| AC-4.8 | US-4 | FR-8, FR-9, FR-10, FR-11, FR-14 | not verifiable | none | none | n/a |
| AC-4.9 | US-4 | FR-8, FR-9, FR-10, FR-11, FR-14 | covered | app/tests/shadows.test.js:78, app/tests/shadows.test.js:102 | inferred-confirmed | pass |
| AC-4.10 | US-4 | FR-8, FR-9, FR-10, FR-11, FR-14 | covered | app/tests/shadows.test.js:102 | id | pass |
| AC-5.1 | US-5 | FR-12, FR-13 | covered | app/tests/garden-layout.test.js:106 | id | pass |
| AC-5.2 | US-5 | FR-12, FR-13 | covered | app/tests/garden-layout.test.js:38 | id | pass |
| AC-5.3 | US-5 | FR-12, FR-13 | covered | app/tests/garden-layout.test.js:178 | id | pass |
| AC-5.4 | US-5 | FR-12, FR-13 | covered | app/tests/wander.test.js:223, app/src/logic/wander.js:13 | inferred-confirmed | pass |
| AC-5.5 | US-5 | FR-12, FR-13 | covered | app/tests/garden-layout.test.js:154 | id | pass |
| AC-5.6 | US-5 | FR-12, FR-13 | not verifiable | none | none | n/a |
| AC-6.1 | US-6 | FR-15, FR-16, FR-17, NFR-4, NFR-5 | not verifiable | none | none | n/a |
| AC-6.2 | US-6 | FR-15, FR-16, FR-17, NFR-4, NFR-5 | not verifiable | none | none | n/a |
| AC-6.3 | US-6 | FR-15, FR-16, FR-17, NFR-4, NFR-5 | not verifiable | none | none | n/a |
| AC-6.4 | US-6 | FR-15, FR-16, FR-17, NFR-4, NFR-5 | not verifiable | none | none | n/a |
| AC-6.5 | US-6 | FR-15, FR-16, FR-17, NFR-4, NFR-5 | covered | app/tests/licences.test.js:17, app/tests/licences.test.js:26 | inferred-confirmed | pass |
| AC-6.6 | US-6 | FR-15, FR-16, FR-17, NFR-4, NFR-5 | covered | app/tests/credits.test.js:21 | inferred-confirmed | pass |
| AC-6.7 | US-6 | FR-15, FR-16, FR-17, NFR-4, NFR-5 | covered | app/tests/missing-items.test.js:47 | id | pass |
| AC-6.8 | US-6 | FR-15, FR-16, FR-17, NFR-4, NFR-5 | covered | app/tests/manifest.test.js:95 | id | pass |
| AC-6.9 | US-6 | FR-15, FR-16, FR-17, NFR-4, NFR-5 | not verifiable | none | none | n/a |
| AC-6.10 | US-6 | FR-15, FR-16, FR-17, NFR-4, NFR-5 | covered | app/tests/builders-props.test.js:57, app/tests/assetLoader.test.js:225 | inferred-confirmed | pass |
| AC-6.11 | US-6 | FR-15, FR-16, FR-17, NFR-4, NFR-5 | covered | app/tests/builders-street.test.js:101 | id | pass |
| AC-6.12 | US-6 | FR-15, FR-16, FR-17, NFR-4, NFR-5 | covered | app/tests/assetLoader.test.js:225 | id | pass |
| AC-6.13 | US-6 | FR-15, FR-16, FR-17, NFR-4, NFR-5 | covered | app/tests/buildWorld.test.js:23 | id | pass |
| AC-6.14 | US-6 | FR-15, FR-16, FR-17, NFR-4, NFR-5 | not verifiable | none | none | n/a |
| AC-7.1 | US-7 | NFR-3 | covered | app/tests/privacy.test.js:72 | id | pass |
| AC-7.2 | US-7 | NFR-3 | covered | app/tests/privacy.test.js:72 | id | pass |

## Findings
No criterion is uncovered or deviating. Notes on the `not verifiable` criteria and on weak evidence:
- AC-1.5: whether the fence looks like today's fence (posts, rails, cream, 1 m) is a visual judgement. The data is guarded by `app/tests/builders-furniture.test.js` and `app/tests/builders-gate.test.js:35`, but no visual check was done.
- AC-2.1: whether the gate reads as a gate, centred, with a post on each side, is visual. The data (1.2 m, centred) is covered under AC-2.3.
- AC-3.1, AC-3.5: visual. Slab data is covered under AC-3.2 and AC-3.6. The path is 5 cm high and the sidewalk 15 cm, so there is a 10 cm step at the gate, which the builder judges for AC-3.5.
- AC-4.1, AC-4.6, AC-4.8: visual. The street data is covered under AC-4.2 and AC-4.4.
- AC-4.3: the fog check may not hold at wide view angles (see Limits).
- AC-5.6: a walk through the checklists of the earlier specs. The whole suite passes, but the person-judged items are the builder's.
- AC-6.1 to AC-6.4, AC-6.14: the builder's measurements.
- AC-6.9: no readable logo or number plate on the cars. The guard test checks material and image names only (`app/tests/street-glb.test.js:23`). The new cars carry blank grey rectangles at the front and back that could read as number plates.
- AC-6.12: weak evidence, see Limits.
