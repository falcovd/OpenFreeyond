# OpenFreeyond: an enterable house: Spec

## Definitions

- Place: the 3D area a person walks around in, as defined in the phase 1 spec ([spec.md](../openfreeyond-companion/spec.md)).
- Boundary: the edge of the walkable ground of the place. This feature makes the place, and so the boundary, larger (FR-13).
- Front door: the door on the garden side of the house. It is the only door that opens.
- Door at rest: a door that is fully closed or fully open. A door that is swinging is not at rest.
- Fully open: the door has finished its swing to the open position. Fully closed: it has finished its swing to the closed position.
- Doorway: the opening in a wall that a person walks through, together with the swing space of the door. A person is in the doorway when the person's footprint overlaps that opening or that space.
- Swing space: the area that the door sweeps while it moves. The front door swings outward, so its swing space is in the garden, in front of the door.
- Person's footprint: a circle of 0.3 m radius around where the person stands, the same area that stops the person at solid objects today (assumption A-9).
- In view: the door, or a part of it, can be seen on screen, not hidden by a wall or an object, and a click lands on a visible part of the door.
- Distance to the door: a straight line from the person to the nearest point of the door.
- Hint: a text of one short sentence that tells the person that the door can be clicked.
- Step-aside message: a text of one short sentence that tells the person to step out of the way of the door.
- Load message: a text of one short sentence that tells the person that something failed to load, as in the world-visuals spec.
- Try-out: the option on the start screen that enters the place with the example character, with no account or personal details (AC-5.1 of the phase 1 spec).
- Test note: the note in which the builder writes down a measurement, with the laptop, the browser and its version, and the operating system.
- Main floor: the ground floor of the house, the only floor that can be entered.
- Room: a part of the main floor that is enclosed by walls and joined to another room by a doorway.
- Interior items: the couch, the TV, the kitchen units, the dining table and the lights.
- Calm (the TV scene): slow, looping, with no flashes and no sudden changes of brightness.
- Plain block: a simple block or colour that stands in the place of an asset that is missing. It still blocks walking.
- Phase 1 walkable area: 444.5 m², the area inside the boundary that no solid object covers, measured from the layout data of the phase 1 build on 2026-11-09 with the same grid method as AC-4.3 of the world-visuals spec.
- Walkable area outside the house: the area inside the boundary that no solid object covers, not counting the floor inside the house.
- Frame-rate walk: a 2-minute walk that goes through the garden, in through the front door, through every room and out again.
- Builder: the person who builds the place and judges the checklists. The builder is also the Product Owner (assumption A-8).
- Checklist: the acceptance criteria below. The builder judges each one as met or not met, yes or no.

## Goal and Success Criteria

The house can be entered, and the main floor is a cosy living space. Success is measured by the goals of the feature document ([feature.md](feature.md)):

- G-1: A person can go into the house. Measured by the checklist items AC-1.1 to AC-1.10, AC-2.1 to AC-2.7, AC-3.1 to AC-3.7, AC-6.1 to AC-6.7, AC-7.7, AC-7.9, AC-7.11, AC-8.1 and AC-8.2 that the builder judges met. Baseline: 0. Target: all met, before the interior goes online. Only the builder judges them; the PO chose to have no outside check.
- G-2: The main floor is a cosy living space. Measured by the checklist items AC-4.1 to AC-4.8, AC-5.1 to AC-5.3, AC-7.4 to AC-7.6, AC-7.8 and AC-7.10 that the builder judges met. AC-4.4 and AC-4.5 count as met when FR-22 applies and AC-4.8 and AC-7.2 are met. Baseline: 0. Target: all met, before the interior goes online.
- G-3: The place stays smooth with the interior. Measured by NFR-1, with the checklist items AC-7.1, AC-7.2 and AC-7.12. If the target is missed, FR-22 applies, and the interior goes online only when the target is met.
- G-4: The place stays within a download limit. Measured by NFR-2, with the checklist item AC-7.3. The limit of 100 MB replaces the 30 MB limit of the world-visuals spec.

## User Stories

- US-1: As a visitor, I want to open and close the front door by clicking it, so that I can choose when to go in or out.
- US-2: As a visitor, I want to walk into the house through the open door, and to be stopped by a closed door and by walls and furniture, so that the house is a real place to go into.
- US-3: As a visitor, I want to be told that the door can be clicked, and I want the door to behave sensibly when it is swinging or when someone is in its way, so that I do not get stuck or confused.
- US-4: As a visitor, I want a living room and a kitchen with a couch, a TV, a kitchen, a dining table and warm lights, so that the inside of the house feels cosy.
- US-5: As a visitor, I want only the main floor to be open, with no stairs, and the house to look from outside in the same style as before, so that nothing looks reachable that is not.
- US-6: As a visitor, I want the character to stay in the garden and everything that worked before to keep working, with a garden as large as before, so that the new house does not take anything away.
- US-7: As the builder, I want the place to stay smooth, to load in an acceptable way, and to use only licensed assets, with a fallback when an asset is missing, so that the feature can go online.
- US-8: As a visitor, I want nothing about the door or about me to be stored or sent, so that my visit stays private.

## Functional Requirements

- FR-1: A person within 3 metres of the front door, with the door in view, can click it. Each click on a door at rest switches it to the other state: a closed door swings open and an open door swings closed, except as FR-7 says. A click is a press and a release of the mouse button without dragging (assumption A-1). Story: US-1.
- FR-2: The distance of FR-1 is measured to the nearest point of the door. Clicking the door from more than 3 metres away does nothing. A person can only click what is in view, so the door cannot be clicked through a wall. Story: US-1.
- FR-3: The door swings visibly between closed and open, outward into the garden. A full swing takes at least 0.5 and at most 2 seconds. Story: US-1.
- FR-4: A closed door blocks the way in. An open door lets the person walk in and out through the doorway. The door counts as open only when it is fully open, so a door that is swinging blocks passage: a person who walks into the swinging door is stopped, and the swing is not stopped or reversed. The walls of the house stay solid. Story: US-2.
- FR-5: The door can be clicked from inside the house as well as from outside, under the same rules (assumption A-2). Story: US-1.
- FR-6: The door is fully closed when a person arrives, on every visit. The state of the door is not stored anywhere. Story: US-1.
- FR-7: The door does not open or close while a person is in the doorway, that is, in the opening or in the swing space. A click on the door then is ignored, the door stays as it was, and a step-aside message shows. The door moves on the next click once the person has stepped out of the doorway. Story: US-3.
- FR-8: A hint shows while the door is at rest, in view and within 3 metres of the person, and nobody is in the doorway. It goes away as soon as one of these stops being true. Nothing about the hint is stored. Story: US-3.
- FR-9: While the door swings, further clicks on it are ignored. The door finishes its swing in the direction it was going. Story: US-3.
- FR-10: The character stays in the garden and never goes into the house. His wandering, and his greeting and waving, work as they do today: he greets by distance only, also when a wall is in between. Story: US-6.
- FR-11: The main floor has at least two rooms with a doorway between them: a living room with a couch and a TV, and a kitchen room with the kitchen units and a dining table. The front door opens into the living room. Each room is at least 3.5 by 3.5 m inside. Story: US-4.
- FR-12: The footprint of the house is at least 5.5 m wide and at least 4.5 m deep, larger in at least one of the two, and fits in a box of 10 by 8 m, in either direction. Every doorway, the front door included, is at least 1.2 m wide and at least 2 m high. Story: US-2.
- FR-13: The place is made larger, and laid out again around the house, so that the walkable area outside the house is at least the phase 1 walkable area. The ground, the sky and the fog still reach beyond the new boundary, so no empty edge shows. Story: US-6.
- FR-14: The lights in the house give the rooms a warm glow, so the inside looks cosy and different from the garden. Story: US-4.
- FR-15: The TV screen shows a calm, looping nature scene and plays no sound (assumption A-4). The clip is at most 60 seconds long and at most 30 MB. If the browser blocks the clip from playing, or the clip fails to load, the screen shows one still picture from the clip. Story: US-4.
- FR-16: Only the main floor can be entered. There are no stairs, and no way to reach the upper floor. Seen from outside, the house keeps its style: the same kinds of wall, roof and door textures, the door on the garden side, two storeys and the upper windows. Inside the main floor there is a plain ceiling, and the upper floor cannot be seen. Story: US-5.
- FR-17: The furniture and the walls inside the house stop the person, as every solid object does today (assumption A-3). Story: US-2.
- FR-18: These keep working as before: walking and looking, solid objects and the boundary stopping the person, the character with his idle, walk and wave animations and his chosen colours, the start screen and the intake, the spawn point and the character's start spot. The spawn point (a free spot in the street) and the start spot (a free spot outside the house that a person can reach) keep their roles, but their coordinates may change when the place is laid out again. Story: US-6.
- FR-19: Every new asset (the furniture, the lamps, the kitchen, the TV and the TV clip) has a recorded licence with author, source link, licence text and any credit line, and the licence is usable: CC0, CC-BY with the credit shown, or one that explicitly allows use and redistribution. NC, ND or no licence is not usable. Credit lines are shown in the existing Credits list of the start page. If no suitable free asset can be found for an item, a plain block or colour in its place is acceptable: the feature still ships, the plain block still blocks walking, and the missing items are listed. Story: US-7.
- FR-20: The place is ready within 30 seconds, as today (FR-15 of the world-visuals spec): the loading indicator goes then, and the garden, including the outside of the house, is shown with whatever has loaded. The interior may keep loading after that. Until the file of an interior item has arrived, a plain block stands in its place inside the house, and it blocks walking. Interior files are not subject to the 30-second failure rule of the world-visuals spec. Story: US-7.
- FR-21: If the model of the house itself fails to load, the house is a plain closed block that cannot be entered, a load message is shown, and no interior is shown. Story: US-7.
- FR-22: If the builder's measurement misses the frame-rate target of NFR-1, the TV picture is dropped first: the TV shows only a still picture, and the warm lights and the furniture stay as designed. This is decided before the interior goes online, from the builder's measurement; nothing switches at run time. A still picture then counts as meeting FR-15. If the walk still misses the target with only a still picture, the interior does not go online until the target is met. Story: US-7.
- FR-23: If a single interior model or the TV clip fails to load, a plain block stands in its place (a still picture for the TV), the plain block still blocks walking, and a load message is shown. Story: US-7.

## Non-Functional Requirements

- NFR-1: The average frame rate over a frame-rate walk is 30 frames per second or better in Chrome on the builder's own laptop, which the builder names when writing down the measurement. Firefox and Safari are best effort. No floor is promised on other laptops. Goal: G-3.
- NFR-2: The compressed first-visit transfer, with an empty cache, from the start screen through the place, the house and the character, is at most 100 MB. The measurement is read with the person standing inside the house, once no new file has arrived for 10 seconds. This replaces the 30 MB limit of the world-visuals spec. Goal: G-4.
- NFR-3: Nothing about the door or about a person is stored or sent. The feature collects, stores and sends no personal data. Loading the place and its files from its web address does not count as data leaving the browser. Story: US-8.
- NFR-4: The door starts to move within 0.5 seconds of a click, judged on a screen recording. Story: US-1.
- NFR-5: The door, entering the house and the interior work in the latest stable Chrome, Firefox and Safari on desktop. The versions and the operating system are recorded in the test note. Only the frame-rate target of NFR-1 is limited to Chrome. Goal: G-1.
- NFR-6: No accessibility level is promised for this feature, as for the rest of the product. The place works with keyboard and mouse or trackpad only, on desktop browsers (assumption A-7). This is a known limitation. Goal: G-1.

## Acceptance Criteria

Each criterion is a short checklist item that the builder judges as met or not met.

- AC-1.1: Given the front door is fully closed and the person stands within 3 metres of it with the door in view, when the person clicks the door once, then the door swings and ends fully open.
- AC-1.2: Given the front door is fully open and the person stands within 3 metres of it with the door in view, when the person clicks the door once, then the door swings and ends fully closed.
- AC-1.3: Given the person stands more than 3 metres from the front door, when the person clicks the door, then nothing happens and the door stays as it was.
- AC-1.4: Given a wall hides the door from the person, even though the person is within 3 metres in a straight line, when the person clicks, then the click lands on the wall and the door stays as it was.
- AC-1.5: Given the person is inside the house within 3 metres of the front door, with the door in view, when the person clicks it, then it switches state as in AC-1.1 and AC-1.2.
- AC-1.6: Given a door at rest, when the builder times a full swing on a screen recording, from the first frame in which the door moves to the first frame in which it stands still, then each swing from fully closed to fully open and back takes at least 0.5 and at most 2 seconds.
- AC-1.7: Given a door at rest and a person within 3 metres with the door in view, when the person clicks the door, then on a screen recording made at 30 frames per second or more, the door has started to move within 0.5 seconds of the click.
- AC-1.8: Given the person presses the mouse button over the door and drags to look around, when the person releases the button, then the door has not changed state.
- AC-1.9: Given the person opened the door and then reloads the page, when the place has loaded, then the door is fully closed.
- AC-1.10: Given the front door is opened, when the builder watches the swing, then the door swings outward into the garden.
- AC-2.1: Given the front door is fully open, when the person walks from the garden through the doorway into the house and back out, then the person is not stopped at the doorway.
- AC-2.2: Given the front door is fully closed, when the person walks into the door, then the person stops and does not enter the house.
- AC-2.3: Given the front door is swinging, when the person walks into the swinging door, then the person is stopped, the swing is not stopped or reversed, and the person can pass only when the door is fully open.
- AC-2.4: Given the person walks into each outside wall of the house, and into each wall inside, when the person keeps moving, then the person stops at each of them.
- AC-2.5: Given the person walks into the couch, the TV, the kitchen units and the dining table, when the person keeps moving, then the person stops at each of them.
- AC-2.6: Given the layout data of the house, when the builder reads it, then the footprint is at least 5.5 m wide and at least 4.5 m deep, larger in at least one of the two, and fits in a box of 10 by 8 m in either direction, and every doorway, the front door included, is at least 1.2 m wide and at least 2 m high.
- AC-2.7: Given the person is in the living room, when the person walks through the doorway to the kitchen room and back, then the person is not stopped at the doorway.
- AC-3.1: Given the front door is at rest, in view and within 3 metres of the person, and nobody is in the doorway, when the person looks at the screen, then a hint of one short sentence shows.
- AC-3.2: Given the hint shows, when the person walks more than 3 metres from the door, or turns so that the door is out of view, or steps into the doorway, or the door starts to swing, then the hint is gone.
- AC-3.3: Given the front door is fully open and the person stands in the doorway, when the person clicks the door, then the door stays fully open and a step-aside message of one short sentence shows.
- AC-3.4: Given the front door is fully closed and the person stands in the swing space, in the garden in front of the door, when the person clicks the door, then the door stays fully closed and a step-aside message of one short sentence shows.
- AC-3.5: Given the step-aside message of AC-3.3 shows, when the person steps out of the doorway and clicks the door, then the door closes.
- AC-3.6: Given the door is swinging open, when the person clicks it twice more during the swing, including a double click, then the clicks are ignored and the door ends fully open.
- AC-3.7: Given the door is swinging closed, when the person clicks it during the swing, then the click is ignored and the door ends fully closed.
- AC-4.1: Given the layout data of the main floor, when the builder reads it, then there are at least two rooms with a doorway between them, a living room with a couch and a TV, and a kitchen room with the kitchen units and a dining table, the front door opens into the living room, and each room is at least 3.5 by 3.5 m inside.
- AC-4.2: Given the person is inside the house, when the person walks through every room, then the couch, the TV, the kitchen units and the dining table are each visible and recognisable as such.
- AC-4.3: Given the person is inside the house, when the builder looks at the lights, then several lights are visible, and the builder answers yes to "do the lights give the rooms a warm glow, different from the garden?".
- AC-4.4: Given FR-22 does not apply and the TV clip plays, when the builder watches it for one full loop, then the screen shows a nature scene, the clip starts again when it ends, and no sound is played.
- AC-4.5: Given FR-22 does not apply, when the builder watches the TV clip, then the builder answers yes to "is the picture slow, with no flashes and no sudden changes of brightness?".
- AC-4.6: Given the shipped TV clip, when the builder checks its length and size, then it is at most 60 seconds long and at most 30 MB.
- AC-4.7: Given the browser blocks the TV clip from playing, or the clip file fails to load, when the person looks at the TV, then the screen shows one still picture from the clip and the place keeps working.
- AC-4.8: Given FR-22 applies, when the person looks at the TV, then the screen shows one still picture from the clip, no sound is played, and the lights and the furniture are as designed.
- AC-5.1: Given the person walks through the whole main floor, when the person looks for stairs or any other way up, then there are none and the person cannot reach an upper floor.
- AC-5.2: Given the person is inside the house, when the person looks up, then a plain ceiling is seen and no upper floor is visible.
- AC-5.3: Given the person stands in the garden, when the person looks at the house, then the builder answers yes to "does the house have the same style as before: textured walls, a roof, the door on the garden side, two storeys and the upper windows?".
- AC-6.1: Given the front door is open, when the builder watches the character wander for 5 minutes, then he does not enter the house.
- AC-6.2: Given a person comes within 3 metres of the character, with a wall between them, when the builder watches, then he stops, faces the person and waves once, as before.
- AC-6.3: Given the new layout data, when the builder measures the walkable area outside the house with the method of the phase 1 comparison, then it is at least 444.5 m².
- AC-6.4: Given the person walks to each edge of the new place and looks toward the horizon, when the builder asks "is any void or empty gap visible between the ground and the sky?", then the answer is no.
- AC-6.5: Given the person walks into each solid object in the garden and into each part of the new boundary, when the person keeps moving, then the person stops at each of them.
- AC-6.6: Given the layout data, when the builder reads it, then the spawn point is a free spot in the street and the character's start spot is a free spot outside the house that a person can reach.
- AC-6.7: Given the checklists of the phase 1 and world-visuals specs for the start screen, the intake, the character's animations and colours, and walking and looking, when the builder goes through them, then each is still met.
- AC-7.1: Given Chrome on the builder's own laptop, the interior in place and the frame-rate display on, when the builder does a frame-rate walk and notes the displayed value every 10 seconds, then the average of the 12 values is 30 frames per second or better, and the laptop is named in the test note.
- AC-7.2: Given the builder's measurement misses 30 frames per second, when the interior goes online, then the TV shows only a still picture and the lights and the furniture are as designed.
- AC-7.3: Given Chrome's network tool with the cache disabled, when the builder loads the place from the start screen through the try-out and stands inside the house until no new file has arrived for 10 seconds, then the first-visit transfer shown is at most 100 MB.
- AC-7.4: Given every new asset, when the builder reads its record, then it has an author, a source link, the licence text and any credit line, and the licence is CC0, CC-BY or another that allows use and redistribution.
- AC-7.5: Given a CC-BY asset, when the builder opens the Credits list on the start page, then its credit line is there.
- AC-7.6: Given no suitable free asset was found for an item, when the builder looks at the house, then a plain block stands in its place, the person is stopped by it, and the item is on the list of missing items.
- AC-7.7: Given Chrome's "Slow 4G" network throttling profile and a person on the start screen who chooses the try-out, when 30 seconds have passed, then the loading indicator is gone and the garden, including the outside of the house, is shown with whatever has loaded.
- AC-7.8: Given the interior files have not arrived yet, when the person is in the house, then a plain block stands in the place of each missing item and the person is stopped by it, and each item replaces its block when its file arrives.
- AC-7.9: Given the model of the house fails to load, when the place loads, then the house is a plain closed block, the person cannot enter it, a load message is shown, no interior is shown, and there is no blank screen.
- AC-7.10: Given a single interior model fails to load, when the person looks at the house, then a plain block stands in its place, the person is stopped by it, and a load message is shown.
- AC-7.11: Given the latest stable Chrome, Firefox and Safari on desktop, with their versions and the operating system recorded in the test note, when the builder opens the door, walks in, goes through every room and walks out, then it works in each of them.
- AC-7.12: Given the builder's measurement with only a still picture on the TV still misses 30 frames per second, when the builder decides about going online, then the interior is not put online until a measurement meets 30 frames per second.
- AC-8.1: Given the network tool is open during 5 minutes of use that includes opening and closing the door and walking through the house, when the builder inspects the requests, then no request carries a value about the door or about the person.
- AC-8.2: Given the browser storage is inspected before and after a visit in which the door was opened and closed, when the builder compares them, then no entry about the door or the person has been added.

## Out of Scope

- Stairs, and an accessible upper floor. No stairs are placed.
- The character going into the house.
- Sound, including sound from the TV.
- Saving the state of the door, or anything else, between visits.
- Other doors that open. Only the front door opens; every other opening stays part of the wall. Windows do not open.
- Using the furniture: sitting on the couch, switching the TV on or off, cooking.
- Weather and day-night changes.
- Mobile and touch support.

## Assumptions

- A-1: A click means pressing and releasing the mouse button without dragging. Dragging keeps turning the view.
- A-2: The door can be clicked from inside as well as from outside.
- A-3: Furniture and inside walls stop the person, as every solid object does today (AC-4.5 of the world-visuals spec).
- A-4: The TV plays no sound, because sound is out of scope for the product for now.
- A-5: Free models with usable licences exist for a couch, a TV, a kitchen, a dining table and lamps, and a free calm nature loop exists for the TV. Not yet sourced. FR-19 allows plain blocks if one is not found.
- A-6: The room size of 3.5 by 3.5 m and the doorway width of 1.2 m are taken from the option the PO chose, and apply to every room and doorway, the front door included. The PO confirmed the doorway height of 2 m.
- A-7: No accessibility level is promised for this feature, as for the rest of the product. The place works with keyboard and mouse or trackpad only, on desktop browsers.
- A-8: The builder and the Product Owner are the same person, as in the earlier specs.
- A-9: A person's footprint is a circle of 0.3 m radius around where they stand, the same area that stops them at solid objects today.
- A-10: The builder can check desktop Safari (on macOS) to judge NFR-5.

## Dependencies and Risks

- Dependency: the world-visuals spec and the companion spec. This feature changes these lines of the world-visuals spec: FR-10 and AC-4.2 ("cannot be entered"), FR-11 and AC-4.3 (the boundary stays, and the walkable area), NFR-2 and AC-12.2 (the 30 MB limit and its check), G-3 (the 30 MB goal), and FR-15, FR-16 and AC-8.6 (the 30-second loading and failure rule, which no longer covers interior files).
- Dependency: free assets with usable licences (A-5).
- Risk: the place grows, so the boundary changes, and the ground, sky and fog must still reach its new edge. Addressed by: FR-13.
- Risk: warm interior lights and a moving TV picture may cost frame rate. Addressed by: NFR-1 and FR-22.
- Risk: because the door swings outward, a person who stands closer than the width of the door must step back before it opens, so a click works only in a band in front of the door. Addressed by: FR-1 (3 metres), FR-7 and FR-8 (the hint shows only while a click works).
- Risk: the interior cannot reach 30 frames per second even with a still TV picture, and so cannot go online. Addressed by: FR-22 and AC-7.12.
- Risk: the download grows a lot, up to 100 MB, and slow connections wait longer. Addressed by: FR-20 (the garden is ready within 30 seconds and the interior may follow) and NFR-2 (the limit).
- Risk: a free TV clip or model with a usable licence may be hard to find. Addressed by: FR-19.
- Risk: the character's wandering and greeting rules assume the house is solid, and must keep treating it as closed to him. Addressed by: FR-10.
- Risk: the house model fails to load, so the house cannot be entered. Addressed by: FR-21.
- Risk: no personal data is involved and nothing is stored or sent, so the GDPR and the EU AI Act are not touched. Addressed by: NFR-3.

## Open Questions

- OQ-1: How is a click on the door told apart from a drag to look around? Type: technical.
- OQ-2: How large must the place become to keep the walkable area outside the house at 444.5 m² (FR-13)? This follows from the size of the house. Type: technical.
- OQ-3: How does the interior keep loading after the place is ready, and how does each item replace its plain block (FR-20)? Type: technical.
