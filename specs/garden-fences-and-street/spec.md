# OpenFreeyond: a fenced garden with a tiled path to the street: Spec

## Definitions

- Place: the 3D area a person walks around in, as defined in the phase 1 spec ([spec.md](../openfreeyond-companion/spec.md)).
- Edge of the place: the edge of the walkable ground of the place. At the start of this feature it is a rectangle of 24 m by 22 m. This feature puts a fence along it (FR-1) and may move it outward (FR-12).
- Front edge: the edge of the place that the path leads to, on the opposite side from the back of the house. The street lies beyond it. The other three edges are the left, right and back edges.
- Fence line: the fence along all four edges of the place, including the gate.
- Gate: the part of the front fence at the end of the path. It stays closed (FR-4).
- Path: the way of paving slabs from the front door to the gate, and on through the gate to the sidewalk (FR-6, FR-7). Only the part inside the fence can be walked on.
- Slab: one rectangular paving tile of 60 by 30 cm. Partial slab: a slab cut shorter to fit.
- Street: everything drawn beyond the front fence: the sidewalk, the curb, the road, the parked cars and the street lamps. It is scenery and cannot be reached.
- Sidewalk: the strip of slabs along the front fence, 1.8 m wide, outside the fence. It starts at the front fence (A-8).
- Curb: the 15 cm high edge between the sidewalk and the road.
- Road: the two-lane road beyond the curb, 7 m wide, with a centre line.
- Start spot: the spawn point where a person starts when they enter the place (FR-13).
- Person's footprint: a circle of 0.3 m radius around where the person stands, the same area that stops the person at solid objects today.
- Solid footprint: the area on the ground that stops the person at a solid object. An object overlaps the fence line or the path when its solid footprint overlaps the area of the fence line, or of the path or its extension.
- Layout data: the written list of the positions and sizes of everything in the place, which the builder can read.
- Try-out: the option on the start screen that enters the place with the example character, with no account or personal details (AC-5.1 of the phase 1 spec).
- Phase 1 walkable area: 444.5 m², the area inside the boundary that no solid object covers, measured from the layout data of the phase 1 build on 2026-11-09 with the same grid method as AC-4.3 of the world-visuals spec.
- Walkable area outside the house: the area inside the edge of the place that no solid object covers, not counting the floor inside the house, with the fence's own footprint counted as covered like every other solid object.
- Frame-rate walk: a 2-minute walk that always follows the same route: from the start spot along the path to the front door, through every room of the house and back out.
- Load message: a text of one short sentence that tells the person that something failed to load, as in the world-visuals spec.
- Plain block: a simple block or colour that stands in the place of an asset that is missing. It still blocks walking where the asset would.
- Missing items: the list, in the checklist, of items for which no free asset was found.
- Test note: the note in which the builder writes down a measurement, with the laptop, the browser and its version, and the operating system.
- Builder: the person who builds the place and judges the checklists. The builder is also the Product Owner (assumption A-1).
- Checklist: the acceptance criteria below. The builder judges each one as met or not met, yes or no.

## Goal and Success Criteria

The garden looks enclosed and the path leads to a street. Success is measured by the goals of the feature document ([feature.md](feature.md)):

- G-1: The garden looks enclosed, so that a person is stopped by something they can see. Baseline: 0, because only two short fences exist and the rest of the edge is an invisible wall. Measured by the checklist items AC-1.1 to AC-1.6, AC-2.1 to AC-2.3, AC-5.1 to AC-5.6 that the builder judges met. Baseline: 0. Target: all met, before the feature goes online. Only the builder judges them.
- G-2: The path and the street read as a connected, real street scene. Measured by the checklist items AC-3.1 to AC-3.6, AC-4.1 to AC-4.10, AC-6.5 to AC-6.13 that the builder judges met. Baseline: 0. Target: all met, except cars and lamps listed as missing because no free asset was found (FR-16) or reduced by the frame-rate rule (FR-17), and the shadows dropped by that rule. These exceptions are written down in the checklist.
- G-3: The place stays smooth with the new objects. Baseline: not yet measured with the interior, the shadows and these additions. Measured by NFR-1, with the checklist items AC-6.1 to AC-6.3. If the target is missed, FR-17 applies.
- G-4: The place stays within a download limit. Baseline: shipped assets about 15 MB (measured 2026-11-09), first-visit transfer not measured. Measured by NFR-2, with the checklist item AC-6.4.

## User Stories

- US-1: As a visitor, I want a fence along every edge of the garden, so that I am stopped by something I can see and not by an invisible wall.
- US-2: As a visitor, I want a closed gate at the end of the path, so that the fence looks complete and the path has a place to lead to.
- US-3: As a visitor, I want a path of paving slabs that is a bit longer and runs on to a sidewalk, so that it looks like a real path to a street.
- US-4: As a visitor, I want a street beyond the fence, with a sidewalk, a curb, a road, parked cars and street lamps, so that the garden feels like a home on a street, even though I cannot go there.
- US-5: As a visitor, I want everything that worked before to keep working, with a garden as large as before and a start spot on the path, so that the new fence and street take nothing away.
- US-6: As the builder, I want the place to stay smooth, to stay within a download limit, and to use only licensed assets with a fallback when an asset is missing, so that the feature can go online.
- US-7: As a visitor, I want nothing about me to be stored or sent, so that my visit stays private.

## Functional Requirements

- FR-1: A continuous fence stands along all four edges of the place, at the edge, so that the fence is what stops the person. A person walking into the fence stops in front of it and cannot pass, as at every other solid object. Story: US-1.
- FR-2: The fence has the look of today's fences: posts every metre and two rails, 1 m high, cream colour. The two fences that stand inside the garden today are removed from the inside of the garden and become part of the fence line at the edge. No fence stands inside the garden. Story: US-1.
- FR-3: A garden object that overlaps the fence line, the path or its extension is moved the smallest distance that clears it: inward from the fence line, sideways off the path. Nothing is removed. A moved object never ends on another solid object, on the path, or on the start spot or the character's start spot. If the smallest move would end on one of those, the next smallest move that clears is used. If no clear spot exists near the object, the builder decides and writes the decision in the checklist. Story: US-1.
- FR-4: The front fence has a gate at the end of the path. The gate has a clear opening of 1.2 m between its two posts, as wide as the path, and stands centred on the path. It matches the fence in look and height, with a post on each side, and is the only break in the rhythm of one post every metre. It stays closed and cannot be opened. A person walking into it stops. Story: US-2.
- FR-5: A person never reaches a point where an edge of the place stops them without a fence or the gate in front of them. There is no gap in the fence line other than the closed gate. Story: US-1.
- FR-6: The path is made of slabs of 60 by 30 cm, in rows with visible joints, so that individual slabs can be told apart when the person stands on the path and looks along it. The path is 1.2 m wide, two whole slabs across. Partial slabs are allowed at the ends of the path and where it meets the sidewalk, not along its long sides. Story: US-3.
- FR-7: The path runs from the front door to the gate, which is 16 m and so 2 m longer than today's 14 m (A-4), and continues through the gate to meet the sidewalk, which starts at the front fence (A-8), so that it looks connected. The stretch beyond the gate cannot be walked on. Story: US-3.
- FR-8: Beyond the front fence there is a sidewalk of the same kind of slabs, 1.8 m wide with three whole slabs across, along the fence, a curb 15 cm high, and a road 7 m wide with a centre line. Along the length of the sidewalk only whole slabs show; partial slabs appear only at its ends, which are out of view. The street runs along the whole front fence and carries on out of view at both ends. The person sees it over the fence from the start spot once they turn toward the gate, and from anywhere along the front fence. Story: US-4.
- FR-9: There are 3 parked cars at the curb and 3 street lamps along the sidewalk, standing along the street within 10 m either side of the point opposite the gate. They do not move and make no sound, and the lamps are not lit. Each item is judged on its own. An item that stands as a plain block because no free model was found (FR-16) is on the list of missing items and does not count as met. Story: US-4.
- FR-10: The sidewalk, curb, road and everything on them cannot be reached or walked on. The person stays in the garden. Story: US-4.
- FR-11: The ground, the sky and the fog reach beyond the street, so that no empty edge or void shows from anywhere in the garden, including at the ends of the road. Story: US-4.
- FR-12: The walkable area outside the house is at least the phase 1 walkable area (444.5 m²). If the fence's footprint or a moved object would bring the area below it, the left, right and back edges of the place, and with them the fence line, move outward until the area is met. The front edge does not move, so the gate, the street and the path hold. The character stays in the garden inside the fence, and his wandering, greeting and waving work as they do today. Story: US-5.
- FR-13: These keep working as before: walking and looking, solid objects and the fence stopping the person, the front door and the enterable house, the character with his idle, walk and wave animations and his chosen colours, the sun and its shadows, the start screen and the intake. The start spot is in the garden on the path 2 m inside the gate, free and reachable, and the person faces the house when they enter. The character's start spot is a free spot that a person can reach. Story: US-5.
- FR-14: The fences, the gate, the slabs, the curb, the road, the cars and the lamps cast and receive sun shadows like the other objects in the garden, except the shadows on the street objects that FR-17 drops. Story: US-4.
- FR-15: If a car or lamp model, or a slab, curb or road texture, fails to load, the place still loads, with a plain block or colour in its place and a load message in the place's existing notice area, shown the same way other load messages are shown. When several assets fail in one load, one message is shown for that load, and it is not repeated during the same visit. The fence line and the gate do not depend on a loaded file. Story: US-6.
- FR-16: Every new asset (the cars, the lamps, the slab, curb and road textures) has a recorded licence with author, source link, licence text and any credit line, and the licence is usable: CC0, CC-BY with the credit shown, or one that explicitly allows use and redistribution. NC, ND or no licence is not usable. Credit lines are shown in the existing Credits list of the start page. Every asset ships with the app and loads from its own address, never from a third-party host. The car models and textures carry no readable brand logos or number plates. The builder first tries to find a free asset for each item. If none is found, a plain block or colour in its place is acceptable: the feature still ships, and the item is on the list of missing items with what was tried. Story: US-6.
- FR-17: If the builder's frame-rate measurement misses the target of NFR-1, the cars and lamps are reduced first, down to no fewer than 1 car and 1 lamp, and never the fence, the slabs or the house. If the walk still misses the target, the sun shadows on the street objects are dropped. This is decided before the feature goes online, from the builder's measurement; nothing switches at run time. If the walk still misses the target, the feature does not go online until it is met. Story: US-6.

## Non-Functional Requirements

- NFR-1: The average frame rate over a frame-rate walk is 30 frames per second or better in Chrome on the builder's own laptop, which the builder names in the test note. The frame rate is read from the browser's built-in frame-rate display every 10 seconds during the walk, and the average of those 12 values is the measurement. Firefox and Safari are best effort. No floor is promised on other laptops. Goal: G-3.
- NFR-2: The compressed first-visit transfer, with an empty cache, from the start screen through the place, the street, the house and the character, is at most 100 MB. The measurement is read with the person standing in the garden, once no new file has arrived for 10 seconds. Goal: G-4.
- NFR-3: Nothing about a person is stored or sent. The feature collects, stores and sends no personal data. Loading the place and its files from its web address does not count as data leaving the browser. Story: US-7.
- NFR-4: The fence, the gate, the path and the street work in the latest stable Chrome, Firefox and Safari on desktop. The versions and the operating system are recorded in the test note. Only the frame-rate target of NFR-1 is limited to Chrome. Story: US-6.
- NFR-5: No accessibility level is promised for this feature, as for the rest of the product. The place works with keyboard and mouse or trackpad only, on desktop browsers (assumption A-6). This is a known limitation. Story: US-6.

## Acceptance Criteria

Each criterion is a short checklist item that the builder judges as met or not met. Requirements FR-1 to FR-17 are verified through the user stories they serve. AC-6.14, AC-7.1 and AC-7.2 are standing conditions that hold for all four goals.

- AC-1.1: Given the person walks along each of the four edges of the place, when the builder asks "is there any stretch of the edge with no fence in front of it, other than the closed gate?", then the answer is no.
- AC-1.2: Given the person walks into each of the four fences, and into every part of the fence line, when the person keeps moving, then the person stops in front of the fence each time and does not pass.
- AC-1.3: Given the person is stopped at any edge of the place, when the builder looks at where the person stands, then a fence or the gate is directly in front of the person. There is no invisible stop.
- AC-1.4: Given the layout data, when the builder reads the fence line, then it follows the edge of the place on all four sides, and no fence stands inside the garden.
- AC-1.5: Given the builder looks at a section of the fence, when the builder answers "does it look like today's fence, with posts every metre, two rails, cream colour and 1 m high?", then the answer is yes.
- AC-1.6: Given the garden objects before and after the change, when the builder compares them, then each object whose solid footprint overlapped the fence line, the path or its extension was moved the smallest distance that clears it, none was removed, and none stands on another solid object, on the path, or on the start spot or the character's start spot. An object for which no clear spot existed near it is listed in the checklist with the builder's decision.
- AC-2.1: Given the person stands on the path inside the gate and looks toward the street, when the builder asks "does a gate stand at the end of the path in the front fence, centred on the path, with a post on each side, matching the fence in look and height?", then the answer is yes.
- AC-2.2: Given the closed gate, when the person walks into it and clicks it, then the person stops in front of it and the gate does not open or move.
- AC-2.3: Given the layout data, when the builder reads the gate and the path, then the clear opening of the gate is 1.2 m, equal to the width of the path, and the gate is centred on the path.
- AC-3.1: Given the person stands on the path and looks along it, when the builder asks "can I tell individual rectangular slabs apart, in rows with visible joints?", then the answer is yes.
- AC-3.2: Given the layout data, when the builder reads the path, then a slab is 60 by 30 cm, the path is 1.2 m wide with two whole slabs across, and a partial slab appears only at the ends of the path and where it meets the sidewalk, not along its long sides.
- AC-3.3: Given the layout data, when the builder measures the path from the front door to the gate, then it is 16 m, which is longer than today's 14 m.
- AC-3.4: Given the person walks the whole path from the front door to the gate, when the person keeps moving, then the person is not stopped by anything on the way.
- AC-3.5: Given the person stands on the path inside the gate, when the builder asks "does the path continue beyond the gate and meet the sidewalk, so that it looks connected to it?", then the answer is yes.
- AC-3.6: Given the sidewalk, when the builder looks along it, then it is made of the same kind of slabs, three whole slabs across, and no partial slab shows along its length.
- AC-4.1: Given the person stands at the start spot and turns toward the gate, when the builder asks "does a sidewalk, a curb and a road with a centre line show beyond the fence, and does it read as a street that the path connects to?", then the answer is yes.
- AC-4.2: Given the layout data, when the builder reads the street, then the sidewalk is 1.8 m wide, the curb is 15 cm high, and the road is 7 m wide with a centre line.
- AC-4.3: Given the person walks along the front fence to each end of it and looks along the street, when the builder asks "does the road carry on out of view, with no end of the road in sight?", then the answer is yes.
- AC-4.4: Given the layout data, when the builder reads the street, then 3 cars stand at the curb and 3 lamps stand along the sidewalk, each within 10 m either side of the point opposite the gate, except items that FR-16 lists as missing or that FR-17 reduced, which are written down in the checklist.
- AC-4.5: Given the person watches the street for 1 minute, when the builder looks at the cars and the lamps, then nothing moves, no sound is played, and the lamps are not lit.
- AC-4.6: Given the cars and the lamps that have a real model, when the builder looks at each, then the builder answers yes to "is it recognisable as a car, or as a street lamp?". An item that stands as a plain block is on the list of missing items and is not counted.
- AC-4.7: Given the person walks into the front fence and the gate at every point along them, when the person keeps moving, then the person never reaches the sidewalk, the curb or the road.
- AC-4.8: Given the person walks to each edge of the place and looks toward the horizon, including along the ends of the road, when the builder asks "is any void or empty gap visible between the ground and the sky?", then the answer is no.
- AC-4.9: Given the sun and the sun shadows, when the builder looks at the fences, the gate, the slabs, the curb, the road, the cars and the lamps, then each casts a shadow and shows shadows like the other objects in the garden, except the street objects whose shadows FR-17 dropped (AC-4.10).
- AC-4.10: Given FR-17 dropped the sun shadows on the street objects, when the builder looks at the street, then the fence line, the gate and the path still cast and show shadows, and the dropped shadows are written down in the checklist.
- AC-5.1: Given the new layout data, when the builder measures the walkable area outside the house, with the fence's footprint counted as covered and the method of the phase 1 comparison, then it is at least 444.5 m².
- AC-5.2: Given the area needed the place to grow (if it did not, this criterion does not apply and the checklist says so), when the builder compares the edges of the place before and after, then only the left, right and back edges moved outward, the front edge did not move, and the area is at least 444.5 m².
- AC-5.3: Given the front door is open, when the builder watches the character wander for 5 minutes, then he stays in the garden inside the fence line.
- AC-5.4: Given a person comes within 3 metres of the character, with a wall or a fence between them, when the builder watches, then he stops, faces the person and waves once, as before.
- AC-5.5: Given the layout data and a new visit, when the person enters the place, then the person stands on the path 2 m inside the gate, on a free spot that is reachable, faces the house, and the character's start spot is a free spot outside the house that a person can reach.
- AC-5.6: Given the checklists of the earlier specs for the start screen, the intake, the character's animations and colours, walking and looking, the front door and the house, and the sun shadows, when the builder goes through them, then each is still met, except the criteria that this feature changes on purpose: the two fences that stood inside the garden (FR-8 and AC-3.4 of the world-visuals spec), the gravel path of 1.4 m (FR-5 and AC-2.2 there), and the start spot as "a free spot in the street" (FR-18 of the house spec). The builder lists in the checklist each criterion judged as changed on purpose.
- AC-6.1: Given Chrome on the builder's own laptop and the frame-rate display on, when the builder does a frame-rate walk and notes the displayed value every 10 seconds, then the average of the 12 values is 30 frames per second or better, and the laptop is named in the test note.
- AC-6.2: Given the builder's measurement misses 30 frames per second, when the builder decides about going online, then the cars and lamps were reduced first, to no fewer than 1 car and 1 lamp, the fence, the slabs and the house were not reduced, the measurement was done again, and the decision is written in the checklist.
- AC-6.3: Given the measurement still misses 30 frames per second after the cars and lamps were reduced and the shadows on the street objects were dropped, when the builder decides about going online, then the feature is not put online until a measurement meets 30 frames per second.
- AC-6.4: Given Chrome's network tool with the cache disabled, when the builder loads the place from the start screen through the try-out and stands in the garden until no new file has arrived for 10 seconds, then the first-visit transfer shown is at most 100 MB.
- AC-6.5: Given every new asset, when the builder reads its record, then it has an author, a source link, the licence text and any credit line, and the licence is CC0, CC-BY or another that allows use and redistribution.
- AC-6.6: Given a CC-BY asset, when the builder opens the Credits list on the start page, then its credit line is there.
- AC-6.7: Given no free asset was found for a car, a lamp or a slab, curb or road texture, when the builder looks at the street, then a plain block or colour stands in its place, and the item is on the list of missing items with what was tried to find it.
- AC-6.8: Given the network tool is open during a visit, when the builder inspects the requests, then every request for a file of the place goes to the place's own web address and none goes to a third-party host.
- AC-6.9: Given each car model, when the builder looks at it close up, then no readable brand logo or number plate is visible.
- AC-6.10: Given a single car or lamp model fails to load, when the person looks at the street, then a plain block stands in its place, a load message is shown in the existing notice area, the place loads, and there is no blank screen.
- AC-6.11: Given a slab, curb or road texture fails to load, when the place loads, then a plain colour stands in its place, a load message is shown, and the place keeps working.
- AC-6.12: Given several assets fail to load in one load, when the builder looks at the notice area during the visit, then one load message is shown for that load, and it does not appear again during the same visit.
- AC-6.13: Given every file of the street fails to load, when the place loads, then the fence line and the gate still stand and the person is still stopped by them.
- AC-6.14: Given the latest stable Chrome, Firefox and Safari on desktop, with their versions and the operating system recorded in the test note, when the builder walks the path to the gate, along the fence line, and looks at the street, then it works in each of them.
- AC-7.1: Given the network tool is open during 5 minutes of use that includes walking along the path and the fence, when the builder inspects the requests, then no request carries a value about the person.
- AC-7.2: Given the browser storage is inspected before and after a visit through the try-out, when the builder compares them, then no entry about the person has been added.

## Out of Scope

- Opening the gate, or any other new door that opens.
- Walking on the sidewalk or the road, or leaving the garden.
- Moving cars, pedestrians, traffic, animals and any sound.
- Lit street lamps, night, weather and day-night changes.
- Changing the house, the interior, the character, the start screen or the intake.
- Any other change to the garden: trees, bushes, beds and furniture stay where they are, except that an object overlapping the new fence line or path is moved the smallest distance inward that clears it (FR-3).
- Mobile and touch support.

## Assumptions

- A-1: The builder and the Product Owner are the same person, as in the earlier features. Only the builder judges the checklists.
- A-2: The edge of the place at the start of this feature is 24 m by 22 m, measured from the layout data on 2026-11-09. The fence line follows the edge as it is when building starts, and FR-12 may move the left, right and back edges outward.
- A-3: Free models with usable licences exist for parked cars and street lamps, and free textures for slabs, curb and asphalt. Not yet sourced. FR-16 allows plain blocks if none is found.
- A-4: The front edge is the edge the path leads to today. Today the path runs from the front door to 14 m from it. The gate stands at the front edge, so the path to the gate is about 2 m longer. Measured from the layout data on 2026-11-09.
- A-5: Whether the slabs are separate objects or a drawn pattern is a technical choice for the plan, as long as individual slabs with joints can be told apart (FR-6).
- A-6: No accessibility level is promised for this feature, as for the rest of the product. The place works with keyboard and mouse or trackpad only, on desktop browsers.
- A-7: The builder can check desktop Safari (on macOS) to judge NFR-4, as in the house feature.
- A-8: The sidewalk starts at the front fence, so the part of the path that continues through the gate meets the sidewalk directly, with no strip of ground between the fence and the sidewalk.
- A-9: The open front door, the 5-minute watch, and the 3 metres of AC-5.3 and AC-5.4 follow the matching criteria of the house feature.

## Dependencies and Risks

- Dependency: the sun-shadow work already in the place (FR-14), the existing Credits list and licence checks (FR-16), the asset sourcing of A-3, and the walkable-area rule of the house feature (FR-12).
- Dependency: the world-visuals spec and the house spec. This feature changes the two fences that stand inside the garden (FR-8 of the world-visuals spec), the path (FR-5 there), and the start spot of the house feature (FR-18 there, whose spawn point was "a free spot in the street").
- Risk: many fence sections, slabs, cars and lamps cost frame rate. Addressed by: NFR-1 and FR-17.
- Risk: the fence line at the current edge puts the fence where trees or other objects already stand. Addressed by: FR-3.
- Risk: moving objects changes where the character can wander. Addressed by: FR-12.
- Risk: free car and lamp models may not exist. Addressed by: FR-16 and FR-9.
- Risk: the fence's footprint may bring the walkable area below the limit. Addressed by: FR-12.
- Risk: the download grows with the street assets. Addressed by: NFR-2.
- Risk: a person looks at a street that cannot be reached. This is the intended look, and the closed gate is the visible reason. Addressed by: FR-4 and FR-10.
- Risk: car models may show brand logos or number plates. Addressed by: FR-16.
- Risk: no personal data is involved and nothing is stored or sent, so the GDPR and the EU AI Act are not touched. Addressed by: NFR-3.

## Open Questions

- OQ-1: How are the slabs built so that individual slabs with joints can be told apart (A-5)? Type: technical.
- OQ-2: How far must the sun shadows reach over the street, so that the street objects show shadows (FR-14)? Type: technical.
- OQ-3: How are the fence line and the gate set up in the layout data so that the 444.5 m² check of FR-12 can be repeated? Type: technical.
