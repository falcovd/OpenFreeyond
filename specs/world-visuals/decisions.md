# Decision log: world visuals

## Intake (PO answers)
- Art direction: semi-realistic (real textured surfaces).
- Improve: sky, grass and ground, trees and plants, house.
- Kit use: pick the useful pieces of the Downtown City MegaKit only; source grass, trees and sky elsewhere.
- Download budget: up to 30 MB in total.
- Success measure: the builder's self-rating of 4 or more out of 5 on "looks like a cozy home".
- Character: keep it; restyle the world (textures on simplified, painterly shapes) so the character still fits.
- Performance: lower frame rates are accepted on weaker laptops; 30 fps stays on the builder's laptop.
- House: exterior only, as today.
- Folder: specs/world-visuals/.

## Gate: feature document (before critique)
Approved by the PO, with the reading "real textures on simplified shapes" confirmed.

## Round 1 critique of feature.md
| Finding | Class | Decision | Reason |
|---|---|---|---|
| House size and layout effect | Must | Accepted | House up to about 10 by 8 m, two floors; place re-laid out; walkable area at least as large as today's; character fixed spot kept. In R-4. |
| 30 fps rule across browsers | Must | Accepted, with a change | PO: 30 fps in Chrome only; Firefox and Safari best effort. This weakens the existing NFR-2; a spec change is needed when this feature lands. In G-2, R-7. |
| Licences and assets from outside hosts | Must | Accepted | New requirement R-11: recorded licence per asset, all files served from the product's own address. |
| G-1 baseline, deadline, single judge | Should | Accepted | Baseline rating now; target 4 or more within 4 weeks after online; independent ratings from the 3 interviewees recorded, no target. |
| R-1 to R-5 not testable | Should | Accepted | New R-12: the builder judges each against a short written checklist in the spec. |
| R-6 traceability, FR-4 furniture | Should | Accepted | Outdoor furniture stays (bench, table, planter); R-6 now serves G-1 and G-2. |
| Download size measurement | Should | Accepted | Compressed first-visit transfer, empty cache, start screen through place and character. In G-3, R-8. |
| Weak-laptop floor | Should | Accepted | No floor promised; listed as out of scope. |
| Kit as a solution; effort and constraints missing | Should | Accepted (editorial) | Kit use kept as PO decision; constraints and dependencies added (under 2 hours per week, free budget, 3D skill, hosting limits). |
| Missing dependencies (memory, texture formats) | Should | Parked as technical | Left to the plan. |
| Other causes of a less cozy feeling | Could | Accepted (editorial) | Noted in the Problem Statement and Risks. |
| Scope edges (sound, weather, animation, loading indicator, start screen) | Could | Accepted | PO: loading indicator in (R-10); gentle tree and cloud movement allowed, written as R-9; sound, weather, day-night and start screen restyle out. |
| Compliance flag | Could | Accepted | Covered by R-11 (own address). No personal data involved. |
| Status 'go' with open items | Could | Kept | PO confirmed 'go'. |

## Gate: feature document
Approved by the PO after round 1, without a round 2.

## Round 1 critique of prd.md
| Finding | Class | Decision | Reason |
|---|---|---|---|
| Checklist for R-1 to R-5 has no date or place | Must | Accepted | Written into the spec's acceptance criteria before building starts. R-12. |
| Baseline rating open; who rates | Must | Accepted | Only the builder rates the old world; baseline 2 on 2026-11-08. Independent people rate only the new look, no names, no target. G-1. |
| NFR-2 weakened but AC-1.6/AC-1.7 and functional support unclear | Must | Accepted | Only the frame-rate part changes; AC-1.1 to AC-1.5 must pass in all three browsers. R-6; risk names AC-1.6 and AC-1.7 as needing a spec change. |
| NFR-1 drops laptop naming and walk route | Should | Accepted (editorial) | Laptop named in the test note; walk covers the whole place. |
| 2.7 MB baseline unsourced; goal title contradicts 30 MB; measure method | Should | Accepted (editorial) | Baseline marked as estimated; G-3 renamed to "loads in an acceptable way"; measured with Chrome's network tool, cache disabled. |
| Failed asset behaviour | Should | Accepted | PO: place loads with a plain colour and a short message. New R-13. |
| Renumbering, NFR-4 new, traces | Should | Accepted (editorial) | Mapping added; NFR-4 marked as a carry-over of existing NFR-3; licence traced under G-1 with a note. |
| "Today's walkable area" has no measure | Should | Accepted (editorial) | Measured from the layout data in the current layout. Character stays outside the house and reachable. R-4. |
| Lighting not covered | Should | Accepted | PO: requirement R-14, warm light and colours hold; in the checklist. |
| R-9 trace and checklist | Should | Accepted | R-9 serves G-1 and G-2; R-9 and R-10 are covered by the checklist (R-12). |
| R-10 trace to G-3 | Should | Accepted (editorial) | G-3 now covers the loading indicator. |
| Plants and fences | Should | Accepted | PO: bushes, flowers and flower beds, hedges; fences kept and restyled. In R-3. |
| Licence record contents; character licence; names in ratings | Should | Accepted | PO: author, source link, licence text, credit line; the character's licence checked before online; ratings without names. NFR-3, NFR-4. |
| Independent people available | Could | Accepted (editorial) | Assumption A-5. |
| "Convincing", "as they are" | Could | Accepted (editorial) | "Convincing" removed; "used whole and unchanged". |
| Hosting dependency | Could | Accepted (editorial) | The builder settles the hosting place before the technical plan. |

## Gate: PRD
Approved by the PO after round 1, without a round 2.

## Decisions while writing the spec (PO)
- Sky: a blue gradient, lighter at the horizon and deeper overhead, with visible clouds.
- Ground: grass texture with visible variation, plus a path from the street to the house door.
- Trees: at least 6, in at least two different shapes; bushes, flowers and flower beds, hedges and fences also present.
- House: one door and at least 4 windows visible from the garden side, a sloped roof with a visible roof texture, textured walls.
- Baseline rating of the current world: 2 out of 5 on "looks like a cozy home", by the builder, on 2026-11-08, before any change.

## Round 1 critique of spec.md
| Finding | Class | Decision | Reason |
|---|---|---|---|
| FR-17 contradicts NFR-1 (frame rate in Firefox and Safari) | Must | Accepted (editorial) | FR-17 now carves out the frame-rate part; the risk says the phase 1 spec needs a spec change for NFR-2, AC-1.6 and AC-1.7. |
| AC-9.1/9.2 labels wrong, controls hint uncovered, browsers | Should | Accepted (editorial) | References corrected; AC-1.8 added; both run in all three browsers. |
| House size and floors untestable | Should | Accepted | PO: one or two floors; footprint at most 10 by 8 m (hard limit). New AC-4.6. |
| Solid objects list and the boundary | Should | Accepted | PO: house, trees, hedges, fences, bushes, furniture, planters and the character block; flowers and flower beds do not; the boundary stays as today. |
| No AC for NFR-3 | Should | Accepted (editorial) | New AC-9.4: no new keys in the browser's storage. |
| FR-7 counts, flowers wording | Should | Accepted | PO: at least 3 bushes, 2 flower beds (the planter counts as one) and 1 hedge. |
| Subjective checks without yes/no questions; no reference images | Should | Accepted | Yes/no questions written for each; PO: screenshots of the current look are taken before building and kept with the spec (new FR-21). |
| Throttling undefined | Should | Accepted | PO: Chrome's "Slow 4G" profile from the start screen. |
| All-files-fail and the character | Should | Accepted | PO: a plain figure shape in the character's spot, still blocking, with the chosen colours, plus the message. |
| Rating scale for independent people | Should | Accepted (editorial) | Same question, 1 to 5 scale, asked by the builder at the end of a short session, noted without names. |
| Attribution and the character's licence | Should | Accepted | PO: a credits section on the place's page; if the character's licence does not allow redistribution, the character is replaced before going online. |
| Missing risks (kit textures, Safari, weaker laptops) | Should | Accepted (editorial) | Added to Risks; Safari and weaker laptops are technical points for the plan. |
| Independent people "3" vs "at least 3" | Could | Accepted (editorial) | Definition aligned. |
| AC-10.1 looks like it repeats the rating | Could | Accepted (editorial) | AC-10.1 now checks the record in decisions.md. |
| Method gaps in AC-12 | Could | Accepted (editorial) | Route, animations on, try-out start, 12 readings every 10 seconds averaged. |
| Weak traceability (NFR-3, US-8) | Could | Accepted (editorial) | NFR-3 marked as carried over from the phase 1 spec; US-8 serves G-1 and G-3. |
| Undefined terms | Could | Accepted (editorial) | Street, cloud and empty edge defined. |
| Solution wording ("compressed") | Could | Accepted (editorial) | Reworded as size targets; the method is left to the plan. |

## Round 2 critique of spec.md
| Finding | Class | Decision | Reason |
|---|---|---|---|
| Planter is both a flower bed (walk over) and a planter (blocks) | Must | Accepted | PO: the planter is solid and is not a flower bed; at least 2 flower beds besides it (FR-7, AC-3.3, definitions). |
| A single failed non-character model | Should | Accepted | PO: a plain block stands in its place and still blocks walking, plus the message (FR-16, new AC-8.5). |
| A stalled load | Should | Accepted | PO: after 30 seconds what has not loaded counts as failed; the indicator ends (FR-15, FR-16, new AC-8.6). |
| Phase 1 spec contradicts this spec until changed | Should | Accepted | PO: changed before building starts; tracked as OQ-3 with the builder as owner. |
| Which rating reading counts | Should | Accepted | PO: one rating at the end of week 4 decides G-1 (G-1, AC-10.2). |
| No criterion for "sent" in NFR-3 | Should | Accepted (editorial) | New AC-9.5 reuses the phase 1 check for sent data. |
| Bush, hedge, flower bed, tree shapes undefined | Should | Accepted (editorial) | Definitions added; two tree shapes judged by a yes/no question. |
| Door side | Could | Accepted (editorial) | The door is on the garden side (FR-9). |
| Layout data and fit | Could | Accepted (editorial) | Assumption A-6 and a risk mapped to FR-11. |
| Texture formats dropped | Could | Accepted (editorial) | Open question OQ-4 (technical). |
| At least 3 independent ratings | Could | Accepted (editorial) | New AC-10.5. |
| Licence reading rule | Could | Accepted | PO: usable = CC0, CC-BY with the credit shown, or explicitly allows use and redistribution; NC, ND or no licence is not usable (definitions, FR-20, AC-11.1, AC-11.4). |

## Gate: spec
Approved by the PO after round 2 of the spec critique, without a round 3. feature.md was updated to match every decision.

## Plan decisions (2026-11-08)
- OQ-2: the place runs only on localhost:5173 in Docker for now (builder's answer). GitHub Pages (existing pages.yml) stays the intended host when it goes online; the 30 MB budget fits its limits (1 GB per site, 100 MB per file). The "go online" step (plan Task 17) waits until that is decided.
- OQ-3: the builder reports the phase 1 spec is changed for NFR-2, AC-1.6, AC-1.7. On 2026-11-08 the file specs/openfreeyond-companion/spec.md on disk still carried the old text; this is flagged to the builder.
- OQ-4: JPEG and PNG textures, at most 1024 px; no WebP, AVIF or KTX2.
- Baseline screenshots: specs/world-visuals/baseline/ (taken before any change).

## Open licence check (2026-11-08)

The character licence is recorded as CC0 by assumption (builder decision). The Hoodie Character zip has no licence file, and its pack page was not found. It must be confirmed on the exact pack page before going online (FR-20, AC-11.4).

## Build decisions (2026-11-08)
- Asset budget is 24 s (`ASSET_BUDGET_MS`), measured from the moment the person chooses, so the place is on screen before the 30 s cover limit (FR-15, FR-16, AC-8.6). This deviates from the "30 s" in FR-16 on purpose: anything not loaded at 24 s counts as failed and is drawn with plain colours or blocks.
- OQ-4 updated: `tree-round.glb` and `tree-pine.glb` use WebP textures and the extensions `EXT_texture_webp` and `KHR_mesh_quantization` (both required) to cut their size from about 1.3 MB and 1.1 MB to about 0.35 MB and 0.20 MB. The latest Chrome, Firefox and Safari are expected to support both. So far this is verified only in headless Chrome; Firefox and Safari are confirmed with the checklist row on tree textures. `bush.glb` and the character use PNG and no extensions.
- The bush texture is a recoloured (green) derivative of the pack's texture. CC0 allows this.
