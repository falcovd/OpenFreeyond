# OpenFreeyond world visuals: Spec

## Definitions
- Place: the 3D area a person walks around in, as defined in the phase 1 spec ([spec.md](../openfreeyond-companion/spec.md)).
- Boundary: the edge of the walkable ground of the place. It stays as in the phase 1 build.
- Street: the area in front of the house, inside the boundary, where the person starts.
- Cloud: a visible white or grey shape in the sky that is not part of the blue gradient.
- Empty edge: a void or empty gap visible between the ground and the sky.
- Solid object: anything that blocks walking: the house, trees, hedges, fences, bushes, furniture, planters and the character. Flower beds are not solid. The planter is solid and is not a flower bed.
- Bush: a plant shorter than a person with no visible trunk. Hedge: a dense row of plants that is longer than it is tall and is not a fence. Flower bed: a patch of ground with flowers that a person can walk over. Two different tree shapes: the builder answers yes to "do these look like two different kinds of tree?".
- Today's walkable area: the area inside the boundary that no solid object covers, measured from the layout data of the phase 1 build.
- Gentle (movement of trees) and slow (drifting of clouds): the builder answers yes to "is the movement calm and not distracting?".
- Warm: the builder answers yes to "does the place look warm rather than cold or dull?".
- Consistent with the character: the builder answers yes to "does the character look at home in this world, not out of place?".
- Plain figure: a simple human-shaped block in the character's spot that stands in for the character model when it fails to load.
- Rating: a whole number from 1 (not at all) to 5 (very) in answer to "does the place look like a cozy home?".
- First-visit transfer: the compressed data a browser downloads on the first visit with an empty cache, from the start screen (reached through the try-out) through the place and the character.
- Independent people: persona-matching people who are not the builder, at least 3, as in the phase 1 spec.
- Usable licence: CC0, CC-BY (with the credit shown), or any licence that explicitly allows use and redistribution. A licence with NC or ND, or no stated licence, is not usable.
- Supported browsers: the latest version at the time of testing of Chrome, Firefox and Safari, on a laptop.

## Goal and Success Criteria
The place looks like a cozy home, stays smooth and loads in an acceptable way.
- G-1: The place looks like a cozy home. Success: a single rating taken by the builder at the end of week 4 after the new look is online is 4 or more. Baseline: 2, rated by the builder on 2026-11-08 before any change. The independent people rate only the new look; their ratings are recorded without names and have no target.
- G-2: The place stays smooth. Success: an average of 30 frames per second or better over a 2-minute walk through the whole place in Chrome on the builder's own laptop, before the new look goes online. Firefox and Safari are best effort; no floor on other laptops.
- G-3: The place loads in an acceptable way. Success: a first-visit transfer of at most 30 MB and a visible loading indicator, before the new look goes online. Baseline: about 2.7 MB, estimated from the phase 1 build.
- Goal links: US-1 to US-7, US-10 and US-11 serve G-1; US-8 serves G-1 and G-3; US-9 serves G-1 and G-2; US-12 serves G-2 and G-3.

## User Stories
- US-1: As a person in the place, I want a sky above me, so that the place feels like a real outdoor spot.
- US-2: As a person in the place, I want the ground to look like grass with a path to the house, so that the garden feels real.
- US-3: As a person in the place, I want recognisable trees, bushes, flower beds, hedges and fences, so that the garden feels alive.
- US-4: As a person in the place, I want a house that looks like a house from the outside, so that I recognise a home.
- US-5: As the builder, I want the world to fit the character, so that the character does not look out of place.
- US-6: As a person in the place, I want the place to look warm, so that it feels cozy.
- US-7: As a person in the place, I want the trees to move gently and the clouds to drift, so that the place feels alive.
- US-8: As a person opening the place, I want to see a loading indicator and still get a working place if a file fails, so that I am not left with an empty screen.
- US-9: As a person in the place, I want everything that worked before to keep working and the garden furniture to look better, so that the new look costs me nothing.
- US-10: As the builder, I want to rate the place, have the independent people rate it, and keep a reference of the old look, so that I know whether the place now looks like a cozy home.
- US-11: As the builder, I want a record of every asset's licence and the required credits shown, so that I may publish the place.
- US-12: As the builder, I want to measure the frame rate and the download size, so that I know the place stays smooth and light.

## Functional Requirements
- FR-1: The sky is a photograph with a visible sun that fades into the fog colour at the horizon. Story: US-1.
- FR-2: The sky shows visible soft clouds. Story: US-1.
- Changed on 2026-11-08: the sky is now a photograph (see `docs/plans/2026-11-08-realistic-sky-design.md`). FR-1 and FR-2 were reworded; the AC numbering is kept. AC-1.1 still says "blue gradient" and is not yet reworded.
- Changed on 2026-11-08: the character wanders (see `docs/plans/2026-11-08-character-wandering-design.md`). FR-11 and AC-4.4 were reworded to "starts in a fixed spot" and "starts in the same spot each time".
- FR-3: No empty edge is visible between the ground and the sky, in any direction. Story: US-1.
- FR-4: The ground shows a grass texture with visible variation, not one uniform colour. Story: US-2.
- FR-5: A path leads from the street to the house door. Story: US-2.
- FR-6: The place has at least 6 trees in at least two different shapes, each with a trunk and foliage that are more than a cylinder and a sphere. Story: US-3.
- FR-7: The place has at least 3 bushes, at least 2 flower beds (not counting the planter) and at least 1 hedge. Story: US-3.
- FR-8: The fences look like fences and still stop the person from walking through them. Story: US-3.
- FR-9: The house has textured walls, one door on the garden side and at least 4 windows visible from the garden side, and a sloped roof with a visible roof texture. Story: US-4.
- FR-10: The house has one or two floors and a footprint of at most 10 by 8 m, blocks walking and cannot be entered. Story: US-4.
- FR-11: The place is laid out around the house so that the walkable area is at least as large as today's, the boundary is unchanged, the character starts in a fixed spot outside the house that a person can reach, and every solid object and the boundary stop the person. Story: US-4.
- FR-12: The new surfaces and shapes are consistent with the character. Story: US-5.
- FR-13: The place looks warm with the new textures. The builder may adjust the light for this. Story: US-6.
- FR-14: The trees move gently and the clouds drift slowly. Story: US-7.
- FR-15: While the place loads, a loading indicator is shown from the moment the place starts to load, and it disappears when the place is ready or after 30 seconds, whichever comes first. Story: US-8.
- FR-16: If a texture or model fails to load, the place still loads, with a plain colour in place of the missing asset and a short message. If the character model fails, a plain figure stands in the character's spot, still blocks walking and takes the chosen hair and clothing colours. If another model fails (a tree, the house, a fence), a plain block stands in its place and still blocks walking. If loading stalls, whatever has not loaded after 30 seconds counts as failed. Story: US-8.
- FR-17: Everything that the phase 1 spec requires of walking, blocking, the controls hint, the character, the colours, the start screen and the intake still works in Chrome, Firefox and Safari, except the 30 frames per second target of the phase 1 NFR-2, which applies only to Chrome. Story: US-9.
- FR-18: The outdoor furniture (bench, table, planter) stays in the garden and looks better than before. Story: US-9.
- FR-19: The builder's rating of the current world (2) is recorded before any change; the builder rates the new look; each independent person rates the new look on the same 1 to 5 scale, asked by the builder at the end of a short session and noted without a name. Story: US-10.
- FR-20: Every asset, new ones and the existing character, has a record with author, source link, licence text and any credit line, and its licence is usable. The character's licence is checked and recorded before the new look goes online; if it does not allow redistribution, the character is replaced before going online. A credits section on the place's page lists every credit that a licence requires. All files are served from the product's own address. Story: US-11.
- FR-21: Before building starts, screenshots of the current look (garden, house, trees, furniture) are taken and kept with the spec. Story: US-10.

## Non-Functional Requirements
- NFR-1: The average frame rate over a 2-minute walk through the whole place is 30 frames per second or better in Chrome on the builder's own laptop, named in the test note. Firefox and Safari are best effort. No floor is promised on other laptops. Goal: G-2.
- NFR-2: The first-visit transfer is at most 30 MB. Goal: G-3.
- NFR-3: Nothing a person types or chooses leaves their own browser, and no new data is stored or sent. Ratings from the independent people contain no names. Goal: G-1 (carried over from NFR-3 of the phase 1 spec).
- NFR-4: No accessibility level is promised; the movement of trees and clouds cannot be switched off. This is a known limitation, as in the phase 1 spec. Goal: G-1.

## Acceptance Criteria
- AC-1.1: Given the place has loaded, when the builder looks in a full circle and upward, then the sky is a blue gradient, lighter at the horizon and deeper overhead.
- AC-1.2: Given the place has loaded, when the builder looks at the sky, then at least one cloud is visible.
- AC-1.3: Given a person stands at each edge of the place and looks toward the horizon, when the builder asks "is any void or empty gap visible between the ground and the sky?", then the answer is no.
- AC-2.1: Given the place has loaded, when the builder asks "does the ground show a grass texture that varies in colour or pattern across the place, not one uniform colour?", then the answer is yes.
- AC-2.2: Given a person stands in the street, when they look at the house, then a path from the street to the house door is visible and walkable.
- AC-3.1: Given the builder walks through the place, when they count the trees, then there are at least 6, in at least two different shapes.
- AC-3.2: Given the builder looks at each tree, when they ask "does it have a trunk and separate foliage, not a plain cylinder and sphere?", then the answer is yes for each tree.
- AC-3.3: Given the builder walks through the garden, when they count, then there are at least 3 bushes, at least 2 flower beds (not counting the planter) and at least 1 hedge.
- AC-3.4: Given the builder looks at a fence, when they ask "does it look like a fence, with posts and rails or boards?", then the answer is yes; and given a person walks into it, when they keep moving, then they do not pass through it.
- AC-4.1: Given the builder stands in the garden facing the house door, when they look at the house, then textured walls, one door, at least 4 windows and a sloped roof with a visible roof texture are visible.
- AC-4.2: Given a person walks into the house, when they keep moving, then they do not pass through it and cannot enter.
- AC-4.3: Given the new layout, when the builder compares it with the layout data of the phase 1 build, then the walkable area is at least as large as the phase 1 walkable area and the boundary is the same.
- AC-4.4: Given the new layout, when a person walks to the character, then the character is reachable, starts outside the house and starts in the same spot each time.
- AC-4.5: Given a person walks into each solid object (house, trees, hedges, fences, bushes, furniture, planters, character) and into each part of the boundary, when they keep moving, then they stop at each of them.
- AC-4.6: Given the layout data of the new house, when the builder reads it, then the footprint is at most 10 by 8 m and there are one or two floors.
- AC-4.7: Given a person walks into a flower bed, when they keep moving, then they walk over it.
- AC-5.1: Given the builder views the character from the starting position and from 2 metres away, when they judge it, then the answer to "does the character look at home in this world?" is yes.
- AC-6.1: Given the builder walks through the place, when they judge it, then the answer to "does the place look warm rather than cold or dull?" is yes.
- AC-7.1: Given the builder watches the trees for 10 seconds, when they judge the movement, then the trees move and the answer to "is the movement calm and not distracting?" is yes.
- AC-7.2: Given the builder watches the sky for 30 seconds, when they judge the clouds, then the clouds drift and the answer to "is the movement calm and not distracting?" is yes.
- AC-8.1: Given Chrome's "Slow 4G" network throttling profile and a person on the start screen who chooses the try-out, when the place is loading, then a loading indicator is shown and no empty screen is shown.
- AC-8.2: Given the place has finished loading, when the person looks at the screen, then the loading indicator is gone.
- AC-8.3: Given one texture file fails to load, when the place loads, then the place is shown with a plain colour where the asset is missing and a short message tells what happened.
- AC-8.4: Given every texture and model file, including the character model, fails to load, when the place loads, then the place is shown with plain colours, a plain figure stands in the character's spot and blocks walking, the character's chosen colours are applied to it, the message is shown, and the loading indicator is gone, and there is no blank screen or crash.
- AC-8.5: Given a single model other than the character fails to load (a tree, the house or a fence), when the place loads, then a plain block stands in its place, a person walking into it stops, and a short message is shown.
- AC-8.6: Given loading stalls, when 30 seconds have passed, then the loading indicator is gone, a short message is shown, and the place is shown with what has loaded and plain colours or blocks for the rest.
- AC-9.1: Given each of Chrome, Firefox and Safari, when the builder runs the walking, blocking, edge, loading, light-and-objects and controls-hint checks of the phase 1 spec (AC-1.1 to AC-1.5 and AC-1.8 there), then each passes, without the phase 1 frame-rate check (AC-1.6 and AC-1.7 there) in Firefox and Safari.
- AC-9.2: Given each of Chrome, Firefox and Safari, when the builder runs the character, colour, intake, start screen and unsupported-browser checks of the phase 1 spec (AC-2.1 to AC-5.6 there) with the new look, then each passes.
- AC-9.3: Given the screenshots of the current look kept with the spec, when the builder compares them with the new bench, table and planter, then the builder answers yes to "do they look better?".
- AC-9.5: Given the network tool is open during 5 minutes of use of the new look, when the builder runs the phase 1 check for sent data (AC-4.5 there), then no request carries a value that a person typed or chose.
- AC-9.4: Given the browser's storage view before and after using the new look, when the builder compares them, then no storage key was added beyond those of the phase 1 build.
- AC-10.1: Given decisions.md of this feature, when the builder reads it, then it records the rating 2 with the date 2026-11-08, made before any change.
- AC-10.2: Given the new look is online, when the end of week 4 is reached, then the builder takes one rating and records it, and a rating of 4 or more means G-1 is met.
- AC-10.3: Given the new look is online, when an independent person has tried it for a short session, then the builder asks the rating question, and the rating from 1 to 5 is recorded without a name.
- AC-10.5: Given the end of week 4 is reached, when the builder counts the independent ratings, then at least 3 are recorded.
- AC-10.4: Given the build has not started, when the builder takes the screenshots of the current look, then they are kept with the spec and show the garden, the house, the trees and the furniture.
- AC-11.1: Given every asset in the place and the character, when the builder reads the licence record, then each asset has an author, a source link, the licence text and any credit line, and its licence is usable.
- AC-11.2: Given the place is open with a network tool, when it loads, then every request goes to the product's own address.
- AC-11.3: Given the place is online, when the builder opens the credits section on the place's page, then every credit that a licence requires is listed.
- AC-11.4: Given the character's licence, when the builder checks it before the new look goes online, then it is recorded; and if it is not usable, the character is replaced before going online.
- AC-12.1: Given Chrome on the builder's own laptop, the try-out started, the trees and clouds moving and the frame-rate display on, when the builder walks a route that covers the whole place for 2 minutes and notes the displayed value every 10 seconds, then the average of the 12 values is 30 frames per second or better, and the laptop is named in the test note.
- AC-12.2: Given Chrome's network tool with the cache disabled, when the builder loads the place from the start screen through the try-out, then the first-visit transfer is at most 30 MB.

## Out of Scope
- Going inside the house, an interior and furniture inside.
- Replacing or restyling the character.
- A quality setting for the person to choose.
- The kit's full buildings, streets and road markings used whole and unchanged.
- Sound, weather and day-night changes.
- A new look for the start screen and the intake.
- Personalizing the place, mobile support and VR.
- A frame-rate floor for other laptops.
- Switching off the movement of trees and clouds.

## Assumptions
- A-1: A better-looking world raises the rating. Unmeasured.
- A-2: Real textures on simplified shapes fit the stylised character. Untested.
- A-3: Free assets for sky, grass, trees and plants exist with suitable licences. Not yet sourced.
- A-4: The 30 MB budget is reachable: the kit's textures are 1 to 9 MB each as delivered and must get much smaller.
- A-6: The layout data of the phase 1 build exists in a comparable form (the layout list of the phase 1 place).
- A-5: The independent people are available to rate the new look; if not, other independent people take their place.

## Dependencies and Risks
- Dependency: free assets for sky, grass, trees and plants.
- Dependency: selected CC0 pieces of the Downtown City MegaKit.
- Dependency: hosting file-size limits (the hosting place is still open in the phase 1 spec).
- Constraint: the builder has under 2 hours per week, a free budget and limited 3D skill; assets must be free.
- Risk: the style clashes with the low-detail character. Addressed by: FR-12.
- Risk: the frame rate drops below 30 in Chrome on the builder's laptop. Addressed by: NFR-1.
- Risk: the download exceeds 30 MB, because the kit's textures are very large as delivered. Addressed by: NFR-2.
- Risk: the phase 1 NFR-2 is weakened for Firefox and Safari (frame rate only). Addressed by: Not addressed (decision: the PO accepted it; the change to the phase 1 spec is tracked in OQ-3).
- Risk: the layout cannot fit the house, 6 trees, hedges and furniture without shrinking the walkable area. Addressed by: FR-11.
- Risk: lighting and colour warmth matter as much as textures for cosiness. Addressed by: FR-13.
- Risk: a texture or model fails to load. Addressed by: FR-16.
- Risk: an asset has no usable licence, or the character's licence does not allow redistribution. Addressed by: FR-20.
- Risk: weaker laptops and Safari handle the new assets badly. Addressed by: Not addressed (decision: no floor on other laptops and Firefox and Safari are best effort for frame rate; the technical side is left to the plan).

## Open Questions
- OQ-1: Which sources are used for sky, grass, trees, bushes, flowers, hedges and fences? Type: technical.
- OQ-2: Where is the place hosted, and does it limit file sizes? The builder settles it before the technical plan starts. Type: technical.
- OQ-3: The phase 1 spec must be changed for NFR-2, AC-1.6 and AC-1.7 (30 frames per second in Chrome only) before building starts. Owner: the builder. Type: product.
- OQ-4: Which texture formats work in Chrome, Firefox and Safari? Type: technical.
