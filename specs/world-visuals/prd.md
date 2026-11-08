# PRD: OpenFreeyond, a textured, semi-realistic world

Source: [feature.md](feature.md). Decisions: [decisions.md](decisions.md). This extends the phase 1 product in [spec.md](../openfreeyond-companion/spec.md) and keeps its behaviour, except the frame-rate part of NFR-2 for Firefox and Safari.

Mapping to feature.md: feature R-7 is NFR-1 here, R-8 is NFR-2, R-11 is NFR-3. NFR-4 is a carry-over of NFR-3 of the existing spec. R-13 and R-14 are new, from the critique rounds.

## Summary
The place of phase 1 gets a new look: a sky, textured grass and ground, recognisable trees, bushes, flowers, hedges and fences, and a house with a roof, a door and windows, seen from outside, up to two floors. The style is semi-realistic: real textured surfaces on simplified, painterly shapes, so the stylised character still fits. Trees and clouds move gently, and a loading indicator shows while the larger place loads. The place is laid out again around the larger house. Walking, the character, the colours, the start screen and the intake keep working.

## Problem
The place does not look like a cozy home. The builder reports a missing sky, one-colour grass, trees that are a cylinder and a sphere, and a house that looks like a box with a pyramid roof. The evidence is one observation by the builder, who rated the current world 2 out of 5 on "looks like a cozy home". Lighting and the warmth of colours have not been examined as causes.

## Users
- **The builder:** the owner of the place; rates how cozy it looks.
- **Independent people:** the 3 people interviewed for the earlier G-2 goal, who rate the new look.
- **Visitors:** anyone who opens the place; they walk around in it.

## Goals and success metrics
- G-1: The place looks like a cozy home. Metric: the builder's self-rating of "looks like a cozy home" on a 1 to 5 scale. Baseline: 2, rated by the builder on 2026-11-08 before any change. Target: 4 or more. Timeframe: a single rating taken at the end of week 4 after the new look is online decides. The 3 independent people rate the new look only (they never saw the old one in a rating); their ratings are recorded without names and have no target.
- G-2: The place stays smooth. Metric: average frames per second over a 2-minute walk. Baseline: not yet measured. Target: 30 or more in Chrome on the builder's own laptop; Firefox and Safari best effort; no floor on other laptops. Timeframe: before the new look goes online.
- G-3: The place loads in an acceptable way. Metric: compressed transfer size of the first visit with an empty cache, from the start screen through the place and the character, plus a visible loading indicator. Baseline: about 2.7 MB, estimated from the phase 1 build and not yet measured. Target: at most 30 MB. Timeframe: before the new look goes online.

## Non-goals
- Going inside the house; an interior.
- Replacing or restyling the character.
- A quality setting for the person to choose.
- The Downtown City MegaKit's full buildings, streets and road markings used whole and unchanged.
- Sound, weather and day-night changes.
- A new look for the start screen and the intake.
- Personalizing the place, mobile support and VR.
- A frame-rate floor for other laptops.

## Requirements
Functional:
- R-1 (G-1): Looking in any direction, a person sees a blue sky gradient, lighter at the horizon and deeper overhead, with visible clouds, and the horizon meets the ground without an empty edge.
- R-2 (G-1): The ground reads as grass: a visible surface texture and variation, not one uniform colour, with a path from the street to the house door.
- R-3 (G-1): The place has at least 6 trees in at least two different shapes, at least 3 bushes, at least 2 flower beds (not counting the planter, which is solid) and at least 1 hedge, and fences, all recognisable as such, with shapes that are more than a cylinder and a sphere. The fences keep stopping the person.
- R-4 (G-1): The house is recognisable from the outside: textured walls, one door, at least 4 windows visible from the garden side and a sloped roof with a visible roof texture; one or two floors and a footprint of at most 10 by 8 m; it blocks walking and cannot be entered. The place is laid out again around it: the walkable area is at least as large as today's (measured from the layout data as the area inside the boundary that no solid object covers, in the current layout), the character stays in a fixed spot outside the house and reachable, and the edges still stop the person. The boundary of the place stays as today. The house, trees, hedges, fences, bushes, furniture, planters and the character block walking; flowers and flower beds do not.
- R-5 (G-1): The new surfaces and shapes look consistent with the existing character.
- R-6 (G-1, G-2): Everything that worked before keeps working, in Chrome, Firefox and Safari: walking and looking, solid objects and edges blocking, warm light and domestic objects, the character with its idle animation and chosen colours, the start screen and the intake, and the outdoor furniture in the garden (bench, table, planter), now better looking.
- R-9 (G-1, G-2): The trees move gently and the clouds drift slowly. The movement counts toward the frame-rate target.
- R-10 (G-3): While the place loads, a person sees a simple loading indicator instead of an empty screen, checked with Chrome's "Slow 4G" network throttling profile from the start screen.
- R-12 (G-1): Each of R-1 to R-5, R-9, R-10 and R-14 has a short written checklist of concrete things to see, written into the spec's acceptance criteria before building starts, so the builder can judge it as met or not met.
- R-13 (G-1): If a texture or model fails to load, the place still loads, with a plain colour in place of the missing asset and a short message. If the character model fails, a plain figure shape stands in the character's spot, still blocks walking and takes the chosen colours. A single failed model (a tree, the house, a fence) is replaced by a plain block that still blocks walking. If loading stalls, after 30 seconds what has not loaded counts as failed. There is no blank screen or crash.
- R-14 (G-1): Warm light and warm colours still hold with the new textures: the place looks warm, not dull. The builder may adjust the light for this.

Non-functional:
- NFR-1 (G-2): Walking averages 30 frames per second or better over a 2-minute walk through the whole place in Chrome on the builder's own laptop, named in the test note, measured with the browser's frame-rate display. Firefox and Safari are best effort. No floor is promised on other laptops.
- NFR-2 (G-3): The compressed first-visit transfer with an empty cache, from the start screen through the place and the character, is at most 30 MB, measured with Chrome's network tool with the cache disabled.
- NFR-3 (G-1): Every asset, new ones and the existing character, has a recorded licence that allows use and redistribution: author, source link, licence text and any credit line (for example for CC-BY). A licence is usable when it is CC0, CC-BY (with the credit shown) or explicitly allows use and redistribution; licences with NC or ND, or none stated, are not usable. The character's licence is checked and recorded before the new look goes online; if it does not allow redistribution, the character is replaced before going online. A credits section on the place's page lists every credit that a licence requires. All files are served from the product's own address.
- NFR-4 (G-1): Nothing a person types or chooses leaves their own browser, as in the existing spec. No new data is stored or sent. Ratings from the independent people contain no names.

Pre-condition: before building starts, the builder takes screenshots of the current look (garden, house, trees, furniture) and keeps them with the spec, as a reference for "better than before".

Constraints: the builder has under 2 hours per week, a free budget and limited 3D skill; assets must be free.

## Scope and out of scope
In scope: the sky, grass and ground, trees, bushes, flowers, hedges and fences, the house exterior, gentle movement of trees and clouds, the loading indicator, the fallback for failed assets, selected CC0 pieces of the Downtown City MegaKit with compressed textures, other free sources for what the kit lacks (sky, grass, trees, bushes, flowers, hedges, fences, furniture), and a new layout around the larger house.
Out of scope: see Non-goals.

## Assumptions
- A-1: A better-looking world raises the rating. Unmeasured.
- A-2: Real textures on simplified shapes fit the stylised character. Untested.
- A-3: Free assets for sky, grass, trees and plants exist with suitable licences. Not yet sourced.
- A-4: The 30 MB budget is reachable with compressed textures; the kit's textures are 1 to 9 MB each as delivered.
- A-5: The 3 independent people are still available to rate the new look; if not, other independent people take their place.

## Dependencies and risks
Dependencies: free assets for sky, grass, trees and plants; selected pieces of the Downtown City MegaKit (CC0); hosting file-size limits (existing OQ-3, hosting place still open; the builder settles it before the technical plan starts); the memory and graphics power of weaker laptops and browser support for compressed texture formats, Safari in particular (technical, for the plan).
Risks: the style clashes with the low-detail character; the frame rate drops below 30 in Chrome on the builder's laptop; the existing NFR-2 is weakened for Firefox and Safari (frame rate only) and needs a spec change, together with AC-1.6 and AC-1.7 of the existing spec; the kit's textures need compression; lighting and colour warmth may matter as much for cosiness as textures (R-14 covers it).
Compliance: no personal data is involved and nothing new is stored or sent. Assets served from the product's own address (NFR-3) keep it that way. GDPR and the EU AI Act raise no point for this feature.

## Open questions
- The phase 1 spec must be changed (NFR-2, AC-1.6, AC-1.7) before building starts. Owner: the builder. (product)
- Which texture formats work in Chrome, Firefox and Safari? (technical)
- Which sources are used for sky, grass, trees, bushes, flowers, hedges and fences? (technical; depends on licences)
- Where is the place hosted, and does it limit file sizes? (technical; existing OQ-3; the builder settles it before the technical plan starts)
