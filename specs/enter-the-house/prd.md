# PRD: an enterable house

Source: [feature.md](feature.md), approved by the PO on 2026-11-09. Requirement, goal and assumption numbers are the same as in the feature document, which also holds the evidence for each requirement (PO decisions and assumptions) and the decision log of [decisions.md](decisions.md).

## Summary

Today the house in the OpenFreeyond place is a closed box. This feature lets a person open the front door by clicking it and walk into a cosy main floor: a living room with a couch and a TV, and a kitchen with a dining table, warmly lit. Only the main floor can be entered, and there are no stairs. The house and the place become larger to make room, the character stays in the garden, and the place stays smooth and within a download limit of 100 MB.

## Problem

The house cannot be entered: the door is part of the wall and the house is a solid that stops walking. A house that cannot be entered leaves the place feeling unfinished, while the place is meant to feel like a personal, cosy home. The evidence is the builder's own observation of the running app and the existing spec, which states that the house cannot be entered. No independent viewer has judged it, and nothing has been measured. The PO chose to go ahead on that basis.

## Users

- A visitor: a person who opens the place in a desktop browser and walks around with keyboard and mouse. The visitor wants a house that is a real place to go into.
- The builder, who is also the PO (assumption A-10): judges each checklist item as met or not met on their own laptop. The builder is the only judge of the goals.

The character is not a user. He stays in the garden.

## Goals and success metrics

- G-1: A person can go into the house. Metric: the number of the checklist items of R-1 to R-8, R-14, R-15, R-20, R-21, R-23 and R-25 to R-28 that the builder judges met (yes or no for each). Only the builder judges them; the PO chose on 2026-11-09 to have no outside check. Baseline: 0, because the house cannot be entered. Target: all items met. Timeframe: before the interior goes online.
- G-2: The main floor is a cosy living space. Metric: the number of the checklist items of R-9 to R-13, R-18 and R-24 that the builder judges met (yes or no for each). Only the builder judges them. Baseline: 0, because there is no interior. Target: all items met. Timeframe: before the interior goes online.
- G-3: The place stays smooth with the interior. Metric: average frames per second over a 2-minute walk that includes going through the house, read from the browser's built-in frame-rate display. Baseline: not yet measured with an interior. Target: 30 or more in Chrome on the builder's own laptop (the builder names the laptop when writing down the measurement); Firefox and Safari are best effort. If the target is missed, R-22 applies. Timeframe: before the interior goes online.
- G-4: The place stays within a download limit. Metric: compressed transfer size of the first visit with an empty cache, from the start screen through the place, the house and the character, measured with Chrome's network tool. Baseline: the shipped assets are about 3 MB today (measured from the shipped files on 2026-11-09); the first-visit transfer has not been measured. Target: at most 100 MB. This replaces the 30 MB limit of the world-visuals spec (NFR-2 there), because the interior models and the TV clip need room. Timeframe: before the interior goes online.

## Non-goals

- Stairs, and an accessible upper floor. No stairs are placed.
- The character going into the house.
- Sound, including sound from the TV.
- Saving the state of the door, or anything else, between visits.
- Other doors that open. Only the front door opens; every other opening stays part of the wall. Windows do not open.
- Using the furniture: sitting on the couch, switching the TV on or off, cooking.
- Weather and day-night changes.
- Mobile and touch support.

## Requirements

Each requirement shows the goal it serves. The evidence for each one is in the feature document.

### Functional requirements

The door:

- R-1 (G-1): A person within 3 metres of the front door can click it to open it when it is closed, and to close it when it is open. Each click on a door at rest switches it to the other state, except as R-7 says.
- R-2 (G-1): The distance is a straight line from the person to the door. A person can only click what they see, so the door cannot be clicked through a wall. Clicking the door from more than 3 metres away does nothing.
- R-3 (G-1): The door swings visibly between closed and open. The swing takes at least 0.5 and at most 2 seconds. The door swings outward, into the garden.
- R-4 (G-1): A closed door blocks the way in. An open door lets the person walk in and out through the doorway. The door counts as open only when it is fully open, so it blocks passage while it swings: a person who walks into the swinging door is stopped, and the swing is not stopped or reversed. The walls stay solid.
- R-5 (G-1): The door can be clicked from inside the house as well as from outside.
- R-6 (G-1): The door is closed when a person arrives, on every visit. Its state is not stored anywhere.
- R-7 (G-1): The door does not open or close while a person is in the doorway, that is, in the opening or in the space the door swings through, which is in the garden in front of the door because the door swings outward. The click is ignored, and a short message tells the person to step out of the way. The door moves once the person has stepped out.
- R-20 (G-1): While the door is at rest, in view and within 3 metres of the person, and nobody is in the doorway, a hint of one short sentence tells the person that the door can be clicked. It goes away as soon as one of these stops being true. Nothing is stored.
- R-21 (G-1): While the door swings, further clicks on it are ignored. The door finishes its swing first.

The character:

- R-8 (G-1): The character stays in the garden. He never goes into the house. His wandering, and his greeting and waving, work as they do today, so he still greets by distance only, also when a wall is in between.

The house and its interior:

- R-9 (G-2): The main floor has at least two rooms with a doorway between them: a living room with a couch and a TV, and a kitchen room with the kitchen units and a dining table. The dining table stands in the kitchen room. The front door opens into the living room. Each room is at least 3.5 by 3.5 m inside.
- R-10 (G-2): The footprint of the house is at least 5.5 m wide and at least 4.5 m deep (today's size), larger in at least one of the two, and fits in 10 by 8 m (the existing limit) in either direction. Every doorway, the front door included, is at least 1.2 m wide and at least 2 m high. The place is made larger, so that the walkable area outside the house is at least as large as in phase 1 (444.5 m², measured from the phase 1 layout data on 2026-11-09). The place is laid out again around the house.
- R-11 (G-2): The lights in the house give the rooms a warm glow, so the inside looks cosy and different from the garden.
- R-12 (G-2): The TV screen shows a calm, looping nature scene, without sound. Calm means slow, looping, with no flashes or sudden changes of brightness. The clip is at most 60 seconds long and at most 30 MB. If the browser blocks the clip from playing, or it fails to load, the screen shows one still picture from the clip. When R-22 applies, the still picture counts as meeting this requirement.
- R-13 (G-2): Only the main floor can be entered. There are no stairs. Seen from outside, the house keeps its style: the same wall, roof and door textures, the door on the garden side, two storeys and the upper windows. Its size grows (R-10). Inside there is a plain ceiling, and nobody can see or reach the upper floor.
- R-14 (G-1): The furniture and the walls inside stop the person, as every solid object does today.
- R-15 (G-1): These things keep working as before: walking and looking, solid objects and the edge of the place stopping the person, the character with his idle, walk and wave animations and his chosen colours, the start screen and the intake, the spawn point (a free spot in the street) and the character's start spot (a free spot outside the house that a person can reach). The spawn point and the start spot keep their roles, but their coordinates may change when the place is laid out again.

Assets, privacy and checks:

- R-18 (G-2): Every new asset (the furniture, the lamps, the kitchen, the TV and the TV clip) has a recorded licence (author, source link, licence text, any credit line) that is usable: CC0, CC-BY with the credit shown, or one that explicitly allows use and redistribution. NC, ND or no licence is not usable. Credit lines are shown in the existing Credits list of the start page. If no suitable free asset can be found for an item, a plain block or colour in its place is acceptable: the feature still ships, the block still blocks walking, and the missing items are listed.
- R-19 (G-1, G-2): Each of R-1 to R-15, R-18 and R-20 to R-28 has a short written checklist of concrete things to see, written into the spec's acceptance criteria before building starts, so that the builder can judge it as met or not met.
- R-23 (G-1): Nothing about the door or a person is stored or sent. This feature collects, stores and sends no personal data.
- R-24 (G-2): If a single interior model or the TV clip fails to load, a plain block stands in its place (a still picture for the TV), the plain block still blocks walking, and a short load message tells the person what happened.
- R-25 (G-1): The place is ready within 30 seconds, as today: the loading indicator goes then, and the garden, including the outside of the house, is shown with whatever has loaded. The interior may keep loading after that. Until the file of an interior item has arrived, a plain block stands in its place inside the house and blocks walking. Interior files are not subject to the 30-second failure rule.
- R-26 (G-1): If the model of the house itself fails to load, the house is a plain closed block that cannot be entered, a short load message is shown, and no interior is shown.

### Non-functional requirements

- R-16 (G-3): Walking averages 30 frames per second or better over a 2-minute walk that goes through the house.
- R-17 (G-4): The compressed first-visit transfer, with an empty cache, from the start screen through the place, the house and the character, is at most 100 MB. The measurement is read with the person standing inside the house, once no new file has arrived for 10 seconds.
- R-22 (G-3): If the builder's measurement misses the frame-rate target of R-16, the TV picture is dropped first: the TV shows only a still picture, and the warm lights and the furniture stay as designed. This is decided before the interior goes online, from the builder's measurement; nothing switches at run time. If the walk still misses the target with only a still picture, the interior does not go online until the target is met.
- R-27 (G-1): The door starts to move within 0.5 seconds of a click.
- R-28 (G-1): The door, entering the house and the interior work in the latest Chrome, Firefox and Safari on desktop. Only the frame-rate target of R-16 is limited to Chrome. The versions are recorded in the test note.
- Privacy: see R-23. Nothing about the door or a person is stored or sent.
- Accessibility: see assumption A-9. No level is promised.

## Scope and out of scope

In scope:

- A door that opens and closes on a click, with a swing, from both sides, with a hint, and the rules for who may click it and when it may move (R-1 to R-8, R-20, R-21).
- An enterable main floor with at least two rooms, a larger house and a larger place (R-9, R-10, R-13, R-14).
- A cosy interior: a couch, a TV with a looping picture, a kitchen, a dining table, several lights and a warm glow (R-9, R-11, R-12).
- Free assets with recorded licences and credits, with plain blocks as the fallback (R-18).
- The new walking blocks and the new layout of the garden around the larger house.
- The checklists, the frame-rate check, the download check and the privacy rule (R-16, R-17, R-19, R-22, R-23).

Out of scope: see Non-goals.

## Assumptions

- A-1: A click means pressing and releasing the mouse button without dragging. Dragging keeps turning the view.
- A-2: The door can be clicked from inside as well as from outside.
- A-3: Furniture and inside walls stop the person, as every solid object does today (AC-4.5 of the world-visuals spec).
- A-6: The TV plays no sound, because sound is out of scope for the product for now.
- A-7: Free models with usable licences exist for a couch, a TV, a kitchen, a dining table and lamps, and a free calm nature loop exists for the TV. Not yet sourced. R-18 allows plain blocks if one is not found.
- A-8: The room size of 3.5 by 3.5 m and the doorway width of 1.2 m are taken from the option the PO chose and apply to every room and doorway, the front door included. The PO confirmed the doorway height of 2 m.
- A-9: No accessibility level is promised for this feature, as for the rest of the product. The place works with keyboard and mouse or trackpad only, on desktop browsers.
- A-10: The builder and the PO are the same person, as in the earlier specs.
- A-11: A person's footprint is a circle of 0.3 m radius around where they stand, the same area that stops them at solid objects today.
- A-12: The builder can check desktop Safari (on macOS) to judge R-28.
- A-4 and A-5 of an earlier draft became R-18 and R-13. Their numbers are not used again.

## Dependencies and risks

Dependencies:

- The existing world-visuals and companion specs. This feature changes these lines of the world-visuals spec: FR-10 and AC-4.2 ("cannot be entered"), FR-11 and AC-4.3 (the boundary stays, and the walkable area), and NFR-2 (the 30 MB limit).
- Free assets with usable licences (A-7).

Risks:

- The place grows, so the boundary changes, and the ground, sky and fog must still reach its new edge. Handled by R-10 and R-15.
- Warm interior lights and a moving TV picture may cost frame rate. Handled by R-16 and R-22.
- Because the door swings outward, a person who stands closer than the width of the door must step back before it opens, so a click works only in a band in front of the door. Handled by R-1 (3 metres), R-7 and R-20 (the hint shows only while a click works).
- The interior cannot reach 30 frames per second even with a still TV picture, and so cannot go online. Handled by R-22: the interior then does not go online until the target is met.
- The download grows a lot, up to 100 MB, and slow connections wait longer for the first visit. Accepted by the PO; the limit of R-17 is the only measure.
- A free TV clip or model with a usable licence may be hard to find. Handled by R-18.
- The character's wandering and greeting rules assume the house is solid, and must keep treating it as closed to him. Handled by R-8.
- Compliance: no personal data is collected, stored or sent, and no new data is kept (R-23). The GDPR and the EU AI Act are not touched by this feature. Credit lines of CC-BY assets are shown in the existing Credits list (R-18).

## Open questions

- Technical, for the team: how a click on the door is told apart from a drag to look around.
- Technical, for the team: how large the place must become to keep the garden at 444.5 m² (R-10). This follows from the size of the house.
