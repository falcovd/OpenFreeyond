# Decisions: a neighbourhood around the plot

Decisions of the Product Owner (PO), 2026-11-09, taken during the interview that produced `feature.md`.

## Product decisions

| # | Question | Decision | Reason |
| --- | --- | --- | --- |
| D-1 | What is the problem? | The garden floats alone: no sense of a living neighbourhood. | PO request: "build the surrounding neighborhood". |
| D-2 | Which plots? | The two direct neighbours of our plot and 5 plots across the road, all the same size as ours (24 m by 22 m). | PO request. |
| D-3 | What stands on the other plots? | A European house with a fenced garden, closed gate and tiled path, as ours. Not enterable. | PO choice. |
| D-4 | Building style | Dutch or Belgian: brick or rendered walls, pitched or tiled roofs, gables, large windows. | PO choice. |
| D-5 | Reachability | All of it is scenery; the person stays in our garden. | PO choice. |
| D-6 | Cars | Our 3 cars become 1, at the curb in front of our plot. Every other plot has 1 car at the curb in front of it: 8 in total. | PO request and choice. |
| D-7 | Far row placement | Centred: the middle of the 5 plots is opposite ours (row 120 m wide). | PO choice. |
| D-8 | Lamps | 1 lamp per plot along both sidewalks: 8 in total. | PO choice. |
| D-9 | Background | A static picture of European buildings all around the horizon. | PO request and choice. |
| D-10 | Variety of houses | Same footprint (8 m by 5 m, as our house); differ in facade, roof and floors (2 or 3); at least 4 distinct looks among the 7 houses. | PO choice. |
| D-11 | Gates and paths | Every other plot has fence, closed gate and a tiled path to its house, as ours. | PO choice. |
| D-12 | Frame-rate fallback | Reduce garden objects and cars of the 7 other plots first, then drop shadows on the new objects. Never our plot, the street, the houses or the backdrop. | PO choice. |
| D-13 | Floor of the reduction | To none (the 7 other plots only). | PO choice. |
| D-14 | Frame-rate limit | Keep 30 fps average in Chrome on the builder's laptop over the same 2-minute walk. | PO choice. |
| D-15 | Transfer limit | 200 MB first-visit transfer (was 100 MB). The PO first answered 512 MB, then lowered it to 200 MB after critique round 1. | PO decision. About 12 times today's shipped size; recorded as a risk. |
| D-16 | Footprint of the houses | 8 m by 5 m, the same as our house. | PO choice. |
| D-17 | Gardens of the other plots | "Like ours", with fewer of each: at least 3 trees or bushes, 1 hedge, 1 bench or table, 1 flower bed. | PO choice after a follow-up. |
| D-18 | Backdrop | A band of about 20 m behind the plots, faded by fog. | PO choice. |
| D-19 | Boundary between plots | One shared fence line, not two. | PO choice. |
| D-20 | Loading | Our plot and the street within the 30-second rule; the neighbourhood loads after the place is ready, with plain blocks until then. | PO choice. |
| D-21 | Variety of the 8 cars | They may share a model; no two neighbouring cars have the same colour. | PO choice. |
| D-22 | Test for European style | Pitched or stepped-gable tiled roof, brick or rendered facade, at least 4 windows facing the street, front door on the street side. | Round 1 finding: the style was a judgement call. |
| D-23 | Houses and the plain-block fallback | At least 4 of the 7 houses must be real models with distinct looks, else no go-online; up to 3 may be plain blocks, listed as missing. | Round 1 finding: 7 blocks could count as success. |
| D-24 | Ground beyond the plots | The grass ground continues to the backdrop, faded by fog; no extra objects. | Round 1 finding. |
| D-25 | Arrival time of the neighbourhood | 60 seconds or less without throttling; no limit on Slow 4G. New goal G-4. | Round 1 finding: R-13 had no goal. |
| D-26 | Shadows | Our plot, house and character are not visibly softer than today; shadows on the other plots may be softer or dropped. | Round 1 finding. |
| D-27 | Last lever of the frame-rate rule | After the garden objects, cars and shadows of the other plots, the 5 far plots are reduced to 3. Then no go-online until met. | Round 2 finding: no decision rule when the miss comes from houses. |
| D-28 | Direction of the cars | Parallel to the curb, facing the driving direction of their side (right-hand traffic); at least 3 colours across the 8 cars. | Round 2 finding. |
| D-29 | Source of the backdrop picture | A free licensed picture, recorded like every asset; no generated images. | Round 2 finding. |
| D-30 | Floor for assets other than houses | The backdrop picture must be real, else no go-online. Cars, lamps and garden objects reuse existing models, so no further floor. | PRD round 1 finding. |
| D-31 | Our own car and lamp | They load late with the neighbourhood, with stand-ins until they arrive. | PRD round 1 finding. |
| D-32 | Houses after far plots are removed | The house counts apply to the houses that remain: at least 4 real models with distinct looks (at most 1 plain block of 5). | PRD round 2 finding. |
| D-33 | Browsers | Latest stable Chrome, Firefox and Safari on desktop; frame-rate limit in Chrome only. | PO choice (spec phase). |
| D-34 | Accessibility | No level promised; keyboard and mouse on desktop. | PO choice (spec phase). |
| D-35 | State of the scene at the start of the frame-rate walk | The walk starts as soon as the place is ready, while the neighbourhood is still arriving, as for a visitor. | PO choice (spec round 1). Recorded as a risk: the first part of the walk may show fewer objects. |
| D-36 | Gate, path and door on the other plots | Position varies per plot; gate and front door in line; gate at least 1.2 m from the plot corners. | PO choice (spec round 1). |
| D-37 | House position on the other plots | Varies per plot: at least 3 m behind the street-side fence, at least 1 m from the other fences. | PO choice (spec round 1). |
| D-38 | Source of the backdrop picture (changes D-29) | The Product Owner supplies a picture generated with Google Gemini (4128 x 1024, Dutch or Belgian street front) and it is used for the backdrop. Generated images are allowed for the backdrop; the tool and its terms are to be confirmed and the picture checked for readable brands, signs and recognisable people before going online. | PO decision during the build, 2026-11-09: the photos found did not give a band in the same style as the houses. FR-9 and FR-15 of spec v1 still say generated images are not allowed; this needs a spec change (spec-change) to match. |

## Critique rounds

### Round 1 (feature document), 2 Must, 8 Should, 3 Could

| Finding | Class | Decision | Reason |
| --- | --- | --- | --- |
| 512 MB limit unexplained against the 100 MB limit | Must | Accepted: D-15 (200 MB). | PO decision. |
| G-1 is a count of an unwritten checklist; style and "no seam" are judgement calls | Must | Accepted: D-22. "No seam" stays a builder judgement, as in the earlier features. | PO decision. |
| R-3 can be met with 7 blocks | Should | Accepted: D-23. | PO decision. |
| What lies beyond the plots | Should | Accepted: D-24. | PO decision. |
| R-13 has no goal and no time limit | Should | Accepted: D-25 (goal G-4). | PO decision. |
| R-9 and R-10 leave shadows undefined; shadow settings dependency | Should | Accepted: D-26; dependency added. | PO decision and editorial. |
| R-5 and R-6 change the street of the earlier feature | Should | Accepted. Written into Scope and R-9: the earlier criteria about the 3 cars and 3 lamps are replaced. | Editorial. |
| R-11 measurement on one machine; interior walk | Should | Rejected as a change: the same walk, laptop and browser as the street feature, accepted by the PO there. | Same basis as the earlier features. |
| Problem evidence is one observation | Should | Noted. It stays as written; the PO accepted this basis. | Same basis as the earlier features. |
| "Neighbouring cars" undefined | Should | Accepted. Cars of neighbouring plots on the same side of the road. | Editorial. |
| Feedback at closed gates | Could | Accepted. No message or hint, as at our own gate. | Editorial. Please correct if you want a hint. |
| R-15 message when a plain block is deliberate | Could | Accepted. No message for a deliberate block. | Editorial. |
| Licence workload and graphics memory not listed as risks | Could | Accepted. Added to the risks. | Editorial. |

### Round 2 (feature document), 2 Must, 6 Should, 3 Could

| Finding | Class | Decision | Reason |
| --- | --- | --- | --- |
| Fallback has no lever for houses and backdrop; G-1 exceptions unclear | Must | Accepted: D-27. G-1 now names the reductions of R-11 as exceptions. | PO decision and editorial. |
| R-3 and R-14 conflict for fewer than 4 houses | Must | Accepted. R-3 decides for houses; a plain-block house is listed as missing and not judged by the style test. | Editorial. |
| Far row 120 m against our side 72 m; nothing said about the asymmetry | Should | Accepted. Stated in R-7: our side 2 plots beyond ours to x = ±36, far side 5 plots to ±60, grass beyond. | Editorial; follows the PO's request (only direct neighbours on our side). |
| Cars: colours, direction, position in front of the plot | Should | Accepted: D-28; centred in front of the plot; at least 3 colours. | PO decision and editorial. |
| G-4 measurement not reproducible | Should | Accepted. "Ready" and "shown" defined; the builder names the connection. | Editorial. |
| Stand-ins: look, place; delayed, deliberate and failed alike | Should | Accepted in R-13. | Editorial. |
| Lamps and gates; far houses face the road | Should | Accepted in R-2 and R-6. | Editorial. |
| Collision and walkability of the street | Should | Accepted in R-8: no collision of their own, gates stay closed. | Editorial. |
| Backdrop: sign test and generated images | Should | Accepted: D-29; test at full size on screen. | PO decision and editorial. |
| G-1 metric depends on the length of the checklist | Could | Rejected as a change: the checklist is the spec's acceptance criteria, written before building, as in the earlier features. | Same basis as the earlier features. |
| Far lamps: which sidewalk | Could | Accepted in R-6. | Editorial. |
| R-9 "visibly softer" has no method; A-1 single judge | Could | Accepted: side-by-side comparison of the same view before and after; A-1 stays as in the earlier features. | Editorial. |

### PRD round 1, 1 Must, 6 Should, 3 Could

| Finding | Class | Decision | Reason |
| --- | --- | --- | --- |
| R-7 says 2 plots beyond ours, R-1 gives 1 | Must | Accepted. One neighbouring plot on each side (to x = ±36). | Editorial; error in both documents. |
| Frame-rate fallback: what happens to the fence, gate, car, lamp of a removed plot; reduced checklist | Should | Accepted in R-11: a removed far plot disappears completely and its space is grass; the rows are judged on what remains and the reduction is written down. | Editorial. |
| Traceability: R-9, R-10, R-14 to R-17 not measured by any goal | Should | Accepted. G-1 covers R-1 to R-10, R-14 and R-15; R-11, R-12 and the time limit are measured conditions; R-16 and R-17 are standing conditions. | Editorial. |
| No floor for assets other than houses | Should | Accepted: D-30. | PO decision. |
| Neighbour gate stop cannot be tested (R-1 against R-8) | Should | Accepted. Gate "cannot be opened and cannot be reached". | Editorial. |
| Our own car and lamp: 30-second rule or late | Should | Accepted: D-31. | PO decision. |
| Compliance bullet without a requirement | Should | Accepted. R-14 now says the backdrop shows no recognisable people. | Editorial. |
| Asset-size check of the earlier features not a dependency | Should | Accepted. Listed as a dependency. | Editorial. |
| Roof wording against the style test; plain block as a look | Could | Accepted. | Editorial. |
| Shadows from neighbouring houses on our garden | Could | Accepted. Expected and allowed. | Editorial. Please correct if you do not want that. |
| "One load" undefined in R-15 | Could | Accepted. At most one message per visit. | Editorial. |

### PRD round 2, 1 Must, 3 Should, 3 Could

| Finding | Class | Decision | Reason |
| --- | --- | --- | --- |
| R-3 counts against removed far plots | Must | Accepted: D-32; R-3 added to the rows judged on what remains. | PO decision. |
| R-9 against R-11 and the shadow reach | Should | Accepted. The shadows of our plot outrank those of the neighbourhood, which are softer or absent where needed (follows D-26). | Editorial. |
| R-13 30-second rule against stand-ins | Should | Accepted. The rule covers our plot and the street without cars and lamps; a stand-in counts as loaded. | Editorial. |
| R-11 steps and re-measurement | Should | Accepted. Three steps one after another, measured after each. | Editorial. |
| R-13 rows not read by a goal | Could | Accepted. G-1 counts the R-13 stand-in rows. | Editorial. |
| Footprint orientation | Could | Accepted. The 8 m side faces the street, as at our house. | Editorial. |
| R-14 sentence garbled | Could | Accepted. Rewritten as three rules (houses, backdrop, every other asset). | Editorial. |

### Spec round 1, 2 Must, 8 Should, 6 Could

| Finding | Class | Decision | Reason |
| --- | --- | --- | --- |
| AC-5.6 against FR-12 (softer or absent shadows) | Must | Accepted. AC-5.6 now allows what FR-12 allows. | Editorial. |
| Scene state at the start of the walk | Must | Accepted: D-35 (place ready), recorded as a risk. | PO decision. |
| Do the steps stop at the first success? | Should | Accepted. They stop at the first measurement that meets the target. | Editorial. |
| Which far plots stay after step 3 | Should | Accepted. The middle one and the inner one on each side. | Editorial. Please correct if you want the outer ones. |
| Rows judged on what remains (FR-3, FR-9, FR-12) | Should | Accepted. List corrected. | Editorial. |
| Stand-in for the backdrop; no void | Should | Accepted: a plain band in the horizon colour; AC-4.7. | Editorial. |
| "Line of the gate opening"; gate and house positions | Should | Accepted: Gate line defined; D-36 and D-37; AC-2.9. | PO decision and editorial. |
| "Distinct" look undefined | Should | Accepted. Defined by hue or material, roof shape, floors. | Editorial. |
| "European buildings" and tolerance for the backdrop | Should | Accepted. Same traits as the style test; height between 15 m and 25 m. | Editorial. |
| Plain block and stand-in definitions contradict | Should | Accepted. Definitions separated; only "no asset found" is listed as missing. | Editorial. |
| Final size of stand-ins | Should | Accepted. From the layout data; a house is its footprint and 2.5 m per floor. | Editorial. |
| "About every metre" against "every metre" | Could | Accepted. | Editorial. |
| Colour matching | Could | Accepted. Main body colour as the builder names it. | Editorial. |
| AC-5.3 and AC-5.2 facts without a source | Could | Accepted: A-9. | Editorial. |
| Before view for AC-5.5 | Could | Accepted. Captured before the feature changes the scene. | Editorial. |
| FR-16 "one short sentence" untested | Could | Accepted in AC-6.15. | Editorial. |
| "No collision of their own" is internal | Could | Accepted. Sentence removed; AC-1.7 and AC-1.8 cover what can be seen. | Editorial. |
| 200 MB in 60 s needs a fast connection | Could | Noted. The connection is named in the test note. | Same basis as round 2 of the feature. |

### Spec round 2, 0 Must, 7 Should, 4 Could

| Finding | Class | Decision | Reason |
| --- | --- | --- | --- |
| Grass only against the street running on | Should | Accepted. Only grass and the street lie between the last plots and the backdrop. | Editorial. |
| AC-6.2 reads as all three steps | Should | Accepted. The steps stop at the first measurement that meets the target. | Editorial. |
| AC-2.9 "not the same on every plot" | Should | Accepted. No two plots have the same gate position and the same house position. | Editorial, follows D-36 and D-37. |
| AC-5.6 not binary | Should | Accepted. Each casts a visible shadow unless step 2 dropped it; received shadows are not judged. | Editorial. |
| Gate line ends at the fence, so the lamp rule has no effect | Should | Accepted. The gate line runs on across the sidewalk to the curb. | Editorial. |
| Backdrop traits without a criterion | Should | Accepted. AC-4.1 asks about roofs, facades and windows. | Editorial. |
| Car criteria after step 1 | Should | Accepted. Exceptions added; criteria that cannot apply are not judged and listed. | Editorial. |
| NFR-6 has no criterion | Could | Accepted. Stated as a limitation in the criteria preamble. | Editorial. |
| AC-6.19 "works" undefined | Could | Accepted. A list of what must work. | Editorial. Please correct if you want a different list. |
| Distance of the gate to the corners | Could | Accepted. Measured to the nearest edge of the clear opening. | Editorial. |
| AC-2.8 repeats AC-2.1 | Could | Accepted. AC-2.1 holds footprint, floors and door; AC-2.8 holds orientation. | Editorial. |

## SC-1: The backdrop may be a generated picture (spec v2, 2026-11-09)
Change: FR-9 and FR-15 now allow the backdrop picture to be a photograph from a free licensed source or a picture generated with an image tool whose terms allow use and redistribution of the output (generated pictures only for the backdrop). A-4 and the matching risk are reworded. AC-4.6 is retired and replaced by AC-4.8 (the same go-online rule with the wider meaning of "available"); AC-6.20 is added for the record of a generated picture. The goal list of G-1 follows the new numbers.
Reason: the photos found did not give a band in the same style as the houses; the Product Owner supplied a picture generated with Google Gemini (D-38).
Approved by: Falco van Dooremolen (Product Owner) on 2026-11-09
Impact: docs/verification/neighbourhood-checklist.md:85 (AC-4.6 row out of date; rows needed for AC-4.8 and AC-6.20); docs/plans/2026-11-09-neighbourhood.md:25, 316, 325, 538 (text "no generated images", AC-4.6); no tests or code name this feature's AC-4.6; no verification report exists yet; AC-4.8 and AC-6.20 have no plan task or test yet.
