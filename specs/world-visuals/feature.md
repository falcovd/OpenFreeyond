# OpenFreeyond: a textured, semi-realistic world

## Problem Statement
The place built in phase 1 does not look like a cozy home. The builder, who opened the running app, reports four things:
- The sky is missing (one flat background colour).
- The grass is one solid colour.
- The trees are too simple (a cylinder and a sphere).
- The house looks very unrealistic (a box with a pyramid roof).

How we know: one observation, by the builder, of the running app on their own laptop. The builder rated the current world 2 out of 5 on "looks like a cozy home" on 2026-11-08. No independent viewer has judged it. The look matters because the first goal of the product is that the place feels like a personal, cozy home ([spec.md](../openfreeyond-companion/spec.md), G-1, FR-4). Other causes of a less cozy feeling, such as the lighting and the warmth of colours, have not been examined.

The art direction chosen by the PO is semi-realistic: real textured surfaces on simplified, painterly shapes, so that the existing stylised character does not look out of place.

## Goals
- G-1: The place looks like a cozy home. Metric: the builder's self-rating of "looks like a cozy home" on a 1 to 5 scale, plus the same rating from the 3 independent people of the earlier G-2 interviews. Baseline: 2 (the builder, 2026-11-08, before any change). Target: a single rating taken by the builder at the end of week 4 after the new look is online is 4 or more. The independent ratings, on the new look only and without names, are recorded with no target. Timeframe: end of week 4 after the new look is online.
- G-2: The place stays smooth. Metric: average frames per second over a 2-minute walk, measured as in the existing spec (NFR-2). Baseline: not yet measured. Target: 30 or more in Chrome on the builder's own laptop (named in the test note); Firefox and Safari are best effort. No floor is promised on other laptops. Timeframe: before the new look goes online.
- G-3: The place stays light to load. Metric: compressed transfer size of the first visit with an empty cache, covering everything from the start screen through the place and the character. Baseline: about 2.7 MB, estimated from the phase 1 build. Target: at most 30 MB. Timeframe: before the new look goes online.

## Requirements
- R-1: Looking in any direction, a person sees a blue sky gradient, lighter at the horizon and deeper overhead, with visible clouds, and the horizon meets the ground without an empty edge. Goal: G-1. Evidence: the builder's observation.
- R-2: The ground reads as grass: it has a visible surface texture and variation, and is not one uniform colour. A path leads from the street to the house door. Goal: G-1. Evidence: the builder's observation.
- R-3: The place has at least 6 trees in at least two different shapes, at least 3 bushes, at least 2 flower beds (not counting the planter, which is solid) and at least 1 hedge, and fences, all recognisable as such, with shapes that are more than a cylinder and a sphere. The fences keep stopping the person. Goal: G-1. Evidence: the builder's observation.
- R-4: The house is recognisable as a house from the outside: textured walls, one door on the garden side, at least 4 windows visible from the garden side and a sloped roof with a visible roof texture. It has one or two floors and a footprint of at most 10 by 8 m. It blocks walking and cannot be entered. The place is laid out again around it so that the walkable area is at least as large as today's, the character stays in a fixed spot outside the house and reachable, and the edges still stop the person. The boundary stays as today. The house, trees, hedges, fences, bushes, furniture, planters and the character block walking; flowers and flower beds do not. Goal: G-1. Evidence: the builder's observation, PO decision.
- R-5: The new surfaces and shapes look consistent with the existing character, so the character does not look out of place. Goal: G-1. Evidence: PO decision.
- R-6: Everything that worked before keeps working, in Chrome, Firefox and Safari: walking and looking, solid objects and the edge of the place blocking the person, the character with its idle animation and chosen colours, the start screen and the intake, and the outdoor furniture in the garden (bench, table, planter), now better looking. Goal: G-1 and G-2. Evidence: the existing [spec.md](../openfreeyond-companion/spec.md), FR-4.
- R-7: Walking averages 30 frames per second or better over a 2-minute walk through the whole place in Chrome on the builder's own laptop; Firefox and Safari are best effort. Goal: G-2. Evidence: NFR-2 of the existing spec, changed by the PO for these two browsers.
- R-8: The compressed first-visit transfer, with an empty cache, from the start screen through the place and the character, is at most 30 MB, measured with Chrome's network tool. Goal: G-3. Evidence: PO decision.
- R-9: The trees move gently and the clouds drift slowly. Goal: G-1. Evidence: PO decision.
- R-10: While the place loads, a person sees a simple loading indicator instead of an empty screen, checked with Chrome's "Slow 4G" profile from the start screen. Goal: G-3. Evidence: PO decision.
- R-11: Every asset, new ones and the existing character, has a recorded licence (author, source link, licence text, any credit line) that is usable: CC0, CC-BY with the credit shown, or one that explicitly allows use and redistribution; NC, ND or no licence is not usable. The character's licence is checked and recorded before the new look goes online, and the character is replaced if it is not usable. A credits section on the place's page lists the credits. All files are served from the product's own address. Goal: G-1. Evidence: PO decision.
- R-12: Each of R-1 to R-5, R-9, R-10 and R-14 has a short written checklist of concrete things to see, written into the spec's acceptance criteria before building starts, so that the builder can judge it as met or not met. Goal: G-1. Evidence: PO decision.
- R-13: If a texture or model fails to load, the place still loads, with a plain colour or plain block in its place, still blocking walking, and a short message; a plain figure stands in the character's spot. After 30 seconds, anything not loaded counts as failed. There is no blank screen or crash. Goal: G-1 and G-3. Evidence: PO decision.
- R-14: Warm light and warm colours still hold with the new textures. The builder may adjust the light. Goal: G-1. Evidence: PO decision, FR-4 of the existing spec.

## Scope
- A sky, a grass and ground surface, trees and garden plants, and a house exterior (R-1 to R-4).
- Gentle movement of trees and clouds (R-9) and a loading indicator (R-10).
- Selected pieces of the Downtown City MegaKit (CC0: brick walls, slate roof pieces, doors, windows, trim, planters), with compressed textures.
- Other free sources for what the kit lacks: it has no sky, no grass, no trees or bushes, no fences and no furniture.
- A new layout of the place around the larger house, and the walking blocks that go with it. The boundary stays as today.
- A fallback for failed files, a credits section, and screenshots of the current look taken before building.

## Out of Scope
- Going inside the house, an interior and furniture inside.
- Replacing or restyling the character.
- A quality setting (low or high) for the person to choose.
- The kit's full buildings, streets and road markings as they are.
- Sound, weather and day-night changes.
- A new look for the start screen and the intake.
- Personalizing the place (still excluded by the existing spec), mobile support and VR.
- A frame-rate floor for other laptops.

## Open Questions, Assumptions and Risks
Assumptions:
- A-1: A better-looking world raises the "looks like a cozy home" rating. Unmeasured.
- A-2: Real textures on simplified shapes will fit the stylised character well enough. Untested.
- A-3: Free assets for sky, grass, trees and plants exist with licences that allow use and redistribution. Not yet sourced.
- A-4: The 30 MB budget can be met with compressed textures; the kit's textures as delivered are 1 to 9 MB each (the dirt normal map alone is 9 MB).

Constraints and dependencies:
- The builder has under 2 hours per week, a free budget (assets must be free), and limited 3D skill, as in the existing spec.
- Hosting limits on file size are not known; the hosting place is still open in the existing spec (OQ-3).
- Device memory and graphics power of weaker laptops, and the browser support for compressed texture formats (Safari in particular), are technical points for the plan.

Open questions:
- The phase 1 spec must be changed (NFR-2, AC-1.6, AC-1.7) before building starts. Owner: the builder. (product)
- Which sources are used for sky, grass, trees, bushes, flowers, hedges and fences? (technical; it depends on the licences.)
- Where is the place hosted, and does it limit file sizes? (technical; existing OQ-3)
- Which texture formats work in Chrome, Firefox and Safari? (technical)

Risks:
- The semi-realistic style may clash with the low-detail character (see R-5); the PO chose to restyle the world rather than the character.
- The frame rate may drop below 30 in Chrome on the builder's laptop.
- The PO weakened the existing NFR-2 for Firefox and Safari. The existing spec still says 30 fps in all three browsers until it is changed with a spec change.
- The character's licence is still unverified from phase 1; R-11 requires checking it before going online.
- The kit's textures need compression to stay within the budget.
- The lighting and the warmth of colours may matter as much for cosiness as the textures.

## Status
Decision: go. Date: 2026-11-08. Owner: Falco (builder).
This extends phase 1. It changes how the place looks and the layout, and keeps the behaviour of [spec.md](../openfreeyond-companion/spec.md), except NFR-2 for Firefox and Safari as stated.
