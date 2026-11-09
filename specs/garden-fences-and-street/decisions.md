# Decisions: a fenced garden with a tiled path to the street

Decisions of the Product Owner (PO), 2026-11-09, taken during the interview that produced `feature.md`.

## Product decisions

| # | Question | Decision | Reason |
| --- | --- | --- | --- |
| D-1 | Where do the fences stand? | A continuous fence on all four sides, with a closed gate on the street side. | PO request: "place the garden fences around the walking area, so it looks like you are blocked by these fences". |
| D-2 | Street and sidewalk: what is visible, what is walkable? | A sidewalk, curb and road are drawn beyond the fence; the person cannot reach them. The gate stays closed and cannot be opened. | The first answer (walkable sidewalk) conflicted with the closed gate. The PO resolved it: scenery beyond the closed gate. |
| D-3 | Tile look | Rectangular paving slabs, 60 by 30 cm, with visible joints, for the path and the sidewalk. | PO request: the path must be built with a tile structure. |
| D-4 | Fence style | Keep today's wooden fence (posts every metre, two rails, 1 m high, cream). | Keeps one family of fences. |
| D-5 | Fence line position | At the current edge of the place (24 m by 22 m). | The fence is then what stops the person, and the garden keeps its size. |
| D-6 | Path length and end | From the front door to the gate (about 2 m longer than today) and on to the sidewalk beyond the gate. | PO request: extend the path a bit and connect it to a sidewalk. |
| D-7 | Street dressing | 3 parked cars and 3 street lamps, with a sidewalk, curb and a road with a centre line. Static, silent, lamps not lit. | PO choice among 2, 3 or 5 cars. |
| D-8 | The two inner fences | They move out to the edge; no fence stands inside the garden. | PO choice. |
| D-9 | Start spot | In the garden on the tiled path just inside the gate. | PO choice. |
| D-10 | Limits | Keep the current limits: 30 fps in Chrome on the builder's laptop, at most 100 MB first-visit transfer. | PO choice. |
| D-11 | Evidence | The problem rests on the builder's own observation; no independent evidence. | Same basis as the earlier features. |
| D-12 | Street proportions | Sidewalk 2 m wide (changed to 1.8 m by D-26), curb 15 cm high, road 7 m wide (two lanes) with a centre line, running the whole street-side fence and carrying on out of view. | Round 1 finding: no sizes, so "reads as a street" was not checkable. |
| D-13 | Path and gate width | 1.2 m (two whole 60 cm slabs). Today's path is 1.4 m. | Round 1 finding: 1.4 m does not fit whole slabs. |
| D-14 | Stopping and the area rule | The person is stopped in front of the fence. The 444.5 m² check counts the fence footprint as covered, like every solid. | Round 1 finding: a "stopped at the edge" fence and a measured area could conflict. |
| D-15 | Fallback minimum for cars and lamps | The builder must try to source real assets first. A plain block is allowed only if none is found; it is listed as missing and does not count as met for R-8. | Round 1 finding: R-8 could be met with six blocks. |
| D-16 | Objects in the way of the fence line | Move the object the smallest distance inward; nothing is removed. | Round 1 finding: open-ended exception to scope. |
| D-17 | Frame-rate fallback and route | Reduce cars and lamps first (never fence, tiles or house), then drop sun shadows on the street objects. The walk is always the same route: start spot, path to the door, every room, back out, 2 minutes. Decided before going online from the measurement. | Round 1 finding: no decision rule when 30 fps is missed. |
| D-18 | Facing at start | The person faces the house. | Round 1 finding: the first view was not decided. |
| D-19 | What lets the feature go online | All checklist items met, except cars and lamps listed as missing (no free asset) or reduced by the frame-rate rule, and the shadows dropped by it. The exceptions are written down. | Round 2 finding: G-2 contradicted R-16 and R-14. |
| D-20 | Area rule against the fence line | The 444.5 m² rule wins: if the fence footprint or moved objects push the area below it, the edge of the place, and the fence line with it, moves outward. | Round 2 finding: no rule for the conflict. |
| D-21 | Point of the 100 MB measurement | With the person standing in the garden, once no new file has arrived for 10 seconds. | Round 2 finding: G-4 and R-15 differed. The PO chose the garden. |
| D-22 | Which edges grow if the area rule needs it | Left, right and back only. The street-side edge stays. | PRD round 1 finding: R-6 and R-11 could conflict. |
| D-23 | How far cars and lamps may be reduced | Down to no fewer than 1 car and 1 lamp. | PRD round 1 finding: "reduced" had no floor. |
| D-24 | Where the cars and lamps stand | Along the street within 10 m either side of the point opposite the gate. | PRD round 1 finding: placement was not measurable. |
| D-25 | Start spot distance | 2 m inside the gate. | PRD round 1 finding: "just inside" had no distance. |
| D-26 | Sidewalk width | 1.8 m, three whole slabs across, whole slabs along its length. This replaces the 2 m of D-12. | Spec round 1 finding: 2 m is not a whole number of 60 cm slabs. The PO chose 1.8 m over cut slabs or 2.4 m. |
| D-27 | Far sidewalk | A second sidewalk, same width (1.8 m), same slabs and a 15 cm curb, on the far side of the road | PO request after the build; scenery, unreachable; not in spec v1. |

## Critique rounds

### Round 1 (feature document), 0 Must, 7 Should, 4 Could

| Finding | Class | Decision | Reason |
| --- | --- | --- | --- |
| Goals count checklist items of an unwritten list; R-14, R-15, R-18 in no checklist; R-16 and R-17 in no goal | Should | Accepted. G-2 now lists R-16 and R-17. R-14, R-15 and R-18 are measured or standing conditions, not checklist items. | Editorial, fixed by the agent. |
| Plain block counts as a car or lamp? | Should | Accepted: D-15. | PO decision. |
| Street dimensions, gate width, path width vs tile size | Should | Accepted: D-12 and D-13. | PO decision. |
| Fence thickness, stopping rule, area measurement | Should | Accepted: D-14. | PO decision. |
| Objects in the way of the fence line | Should | Accepted: D-16. | PO decision. |
| Frame-rate fallback order and fixed route | Should | Accepted: D-17. | PO decision. |
| R-17 message: where and what | Should | Accepted. One sentence in the existing notice area. | Editorial, fixed by the agent. |
| Facing at start | Should | Accepted: D-18. | PO decision. |
| R-18 traced to G-1 | Could | Accepted. Now G-1 and G-2, as a standing condition. | Editorial. |
| R-7 visibility vantage | Could | Accepted. Visible from the start spot and along the street-side fence. | Editorial. |
| A-4 edge and derived figures | Could | Accepted. The +z edge and the 14 m to 16 m derivation are stated. | Editorial. |
| Dependencies missing | Could | Accepted. Listed under the risks. | Editorial. |
| Third-party hosting and personal data | Could | Accepted. R-16 says assets ship with the app. | Editorial. |

### Round 2 (feature document), 0 Must, 5 Should, 5 Could

| Finding | Class | Decision | Reason |
| --- | --- | --- | --- |
| G-3 route differs from R-14 | Should | Accepted. G-3 now points to the walk of R-14. The start spot is just inside the gate, so the walk begins at the street end. | Editorial. |
| G-4 and R-15 measure at different points | Should | Accepted: D-21. | PO decision. |
| G-2 "all met" against plain blocks and the fallbacks | Should | Accepted: D-19. | PO decision. |
| Area rule against fence footprint and moved objects | Should | Accepted: D-20. | PO decision. |
| Overlap rule for moved objects, path extension and start spots | Should | Accepted. R-2 covers the path and its extension, and moved objects never land on a solid, the path or the start spots. | Editorial. |
| R-7 "sees from the start spot" against facing the house | Could | Accepted. The street is seen once the person turns toward the gate. | Editorial. |
| Tile fit at path ends, sidewalk edge and beyond the gate | Could | Accepted. Partial slabs at the ends and at the junction, none along the long sides; the path meets the sidewalk at its inner edge; the stretch beyond the gate is not walkable. | Editorial. Please correct if you want whole slabs only. |
| Gate position and post rhythm | Could | Accepted. The gate is centred on the path, with a post on each side. | Editorial. |
| Placement of cars and lamps | Could | Accepted. They stand in the stretch of street seen from the start spot looking toward the gate. | Editorial. |
| R-17 with several failures | Could | Accepted. One message per load, not repeated during the visit. | Editorial. |
| Brand logos and number plates on car models | Could | Accepted. Added to R-16. | Compliance attention point, not a legal opinion. |

### PRD round 1, 0 Must, 4 Should, 4 Could

| Finding | Class | Decision | Reason |
| --- | --- | --- | --- |
| R-6 path length against the edge moving (R-11) | Should | Accepted: D-22. | PO decision. |
| R-8 and R-13 against R-14 carve-outs; how far "reduced" goes | Should | Accepted: D-23. R-8 and R-13 now name the R-14 exception. | PO decision and editorial. |
| R-8 extent of "the stretch seen from the start spot" | Should | Accepted: D-24. | PO decision. |
| Measurement tool dropped from R-14 | Should | Accepted. The built-in frame-rate display, read every 10 seconds, 12 values averaged. | Editorial. |
| R-17 and R-16 lost wording | Could | Accepted. Restored. | Editorial. |
| Gate width: clear opening or with posts | Could | Accepted. Clear opening of 1.2 m between the posts. | Editorial. |
| Sidewalk tile fit | Could | Accepted. Same partial-slab rule as the path. | Editorial. |
| Start spot distance | Could | Accepted: D-25. | PO decision. |
| R-14, R-15 and R-18 are not checklist items | Could | Accepted. Stated under R-19. | Editorial. |

### Spec round 1, 0 Must, 7 Should, 7 Could

| Finding | Class | Decision | Reason |
| --- | --- | --- | --- |
| Sidewalk partial slabs against FR-6 and AC-3.6 | Should | Accepted: D-26. | PO decision. |
| AC-4.4 and AC-4.9 without the FR-16 and FR-17 exceptions | Should | Accepted. The exceptions are in the criteria. | Editorial. |
| AC-5.6 open-ended, and criteria that fail by design | Should | Accepted. The three changed-on-purpose cases are named; the builder lists each in the checklist. | Editorial. Please correct if you want a different list. |
| AC-7.2 and the intake | Should | Accepted. The visit goes through the try-out, which is defined. | Editorial. |
| "Layout data" not defined | Should | Accepted. Defined in the Definitions. | Editorial. |
| "Try-out" not defined | Should | Accepted. Defined, as in the house spec. | Editorial. |
| "Overlaps" and "inward" undefined; no outcome when no spot exists | Should | Accepted. Solid footprint defined, sideways off the path, next smallest move, then the builder decides and writes it down. | Editorial. |
| AC-5.3 and AC-5.4 carry numbers not in the PRD | Could | Accepted. A-9 says they follow the house feature; the "stuck" clause is removed. | Editorial. |
| AC-5.2 vacuous when no growth | Could | Accepted. It says it does not apply then. | Editorial. |
| Path definition against FR-7; sidewalk touching the fence | Could | Accepted. Path defined to the sidewalk; A-8: the sidewalk starts at the fence. | Editorial. Please correct if you want a strip of ground between them. |
| AC-3.3 dropped the 16 m, baselines dropped | Could | Accepted. 16 m and the baselines are back. | Editorial. |
| AC-6.14, AC-7.1, AC-7.2 under no goal | Could | Accepted. Stated as standing conditions for all goals. | Editorial. |
| OQ-3 already answered in the Definitions | Could | Accepted. Reworded to the technical part. | Editorial. |
| AC-6.7 covers cars and lamps only | Could | Accepted. Now includes the textures. | Editorial. |
