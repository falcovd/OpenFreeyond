# PRD: a fenced garden with a tiled path to the street

Source: [feature.md](feature.md) (approved by the Product Owner on 2026-11-09). Decisions: [decisions.md](decisions.md).

## Summary

The garden gets a visible, continuous fence on all four edges, so that a person is stopped by something they can see instead of an invisible wall. The path from the front door becomes a path of paving slabs, about 2 m longer, that ends at a closed gate and continues beyond it to meet a sidewalk. Beyond the fence a street is drawn: a tiled sidewalk, a curb, a road, 3 parked cars and 3 street lamps. The street is scenery that cannot be reached.

## Problem

The garden does not look enclosed, and the path leads nowhere. A person who walks toward the edge of the place is stopped by an invisible wall, with no fence in front of them. Only two short fences exist, standing inside the garden. The path is a gravel texture that ends in open grass. No street is drawn, although the earlier specs speak of "the street". The place is meant to feel like a real, cosy home; an invisible wall and a path to nowhere work against that.

How we know: one observation by the builder of the running app, together with the layout data and the earlier specs. No independent viewer has judged it and nothing has been measured. The Product Owner chose to go ahead on that basis.

## Users

- A person visiting the place (desktop browser, keyboard and mouse): walks around the garden, along the path, and sees the fence and the street.
- The builder, who is also the Product Owner (A-1): judges every checklist item as met or not met.

## Goals and success metrics

- G-1: The garden looks enclosed, so that a person is stopped by something they can see. Metric: checklist items of R-1 to R-4, R-11 and R-12 judged met by the builder. Baseline: 0. Target: all met. Before the feature goes online.
- G-2: The path and the street read as a connected, real street scene. Metric: checklist items of R-5 to R-10, R-13, R-16 and R-17 judged met by the builder. Baseline: 0. Target: all met, except cars and lamps listed as missing because no free asset was found (R-16) or reduced by the frame-rate rule (R-14), and the shadows dropped by that rule. These exceptions are written down in the checklist (D-19). Before the feature goes online.
- G-3: The place stays smooth. Metric: average frames per second over the 2-minute walk of R-14. Baseline: not yet measured with the interior, the shadows and these additions. Target: 30 or more in Chrome on the builder's own laptop (named in the measurement); Firefox and Safari are best effort.
- G-4: The place stays within the download limit. Metric: compressed first-visit transfer with an empty cache, from the start screen through the place, the street, the house and the character, measured in Chrome's network tool with the person standing in the garden (R-15). Baseline: shipped assets about 15 MB (measured 2026-11-09); transfer not measured. Target: at most 100 MB.

## Non-goals

- Opening the gate, or any other new door that opens.
- Walking on the sidewalk or the road, or leaving the garden.
- Moving cars, pedestrians, traffic, animals, and any sound.
- Lit street lamps, night, weather and day-night changes.
- Changing the house, the interior, the character, the start screen or the intake.
- Any other change to the garden. Trees, bushes, beds and furniture stay, except that an object overlapping the new fence line or path is moved the smallest distance inward that clears it.
- Mobile and touch support.

## Requirements

### Functional

- R-1 (G-1): A continuous fence stands along all four edges of the place, at the current edge (24 m by 22 m, unless R-11 moves it), so that the fence is what stops the person. A person walking into the fence stops in front of it and cannot pass, as at every other solid object.
- R-2 (G-1): The fence keeps today's look: posts every metre and two rails, 1 m high, cream colour. The two fences inside the garden today are removed from the inside and become part of the edge fence line. A garden object that overlaps the fence line, the path or its 2 m extension is moved the smallest distance inward that clears it; nothing is removed. A moved object never ends on another solid object, on the path, or on the spawn point or the character's start spot.
- R-3 (G-1): The street-side fence has a gate at the end of the path. The gate has a clear opening of 1.2 m between its two posts, as wide as the path, and stands centred on it. It matches the fence in look and height, with a post on each side, and is the only break in the one-post-every-metre rhythm. It stays closed and cannot be opened. A person walking into it stops.
- R-4 (G-1): A person never reaches a point where an edge of the place stops them without a fence in front of them. There is no gap in the fence line other than the closed gate.
- R-5 (G-2): The walking path is made of rectangular paving slabs of 60 by 30 cm, in rows with visible joints, so that individual tiles can be told apart when the person stands on the path and looks along it. The path is 1.2 m wide (two whole slabs across; today 1.4 m). Partial slabs are allowed at the ends and at the junction with the sidewalk, not along the long sides.
- R-6 (G-2): The path runs from the front door to the gate, about 2 m longer than today (16 m instead of 14 m, A-4), and continues beyond the gate to meet the sidewalk at its inner edge, so it looks connected. The stretch beyond the gate cannot be walked on.
- R-7 (G-2): Beyond the street-side fence there is a 1.8 m wide sidewalk (three whole slabs across) of the same kind of tiles along the fence, with whole slabs along its length and partial slabs only at its ends, which are out of view, a 15 cm high curb, and a 7 m wide two-lane road with a centre line. The street runs along the whole street-side fence and carries on out of view at both ends. The person sees it over the fence from the start spot once they turn toward the gate, and from anywhere along the street-side fence.
- R-8 (G-2): 3 parked cars at the curb and 3 street lamps along the sidewalk, standing along the street within 10 m either side of the point opposite the gate. They do not move and make no sound, and the lamps are not lit. If the builder's frame-rate measurement misses the target, R-14 allows reducing them to no fewer than 1 car and 1 lamp. Each item is judged on its own. An item that stands as a plain block because no free model was found (R-16) is listed as missing and does not count as met.
- R-9 (G-2): The sidewalk, curb, road and everything on them cannot be reached or walked on. The person stays in the garden.
- R-10 (G-2): The ground, sky and fog reach beyond the street, so no empty edge or void shows from anywhere in the garden, including at the ends of the road.
- R-11 (G-1): The walkable area outside the house stays at least 444.5 m² (phase 1 layout data, same grid method as the house feature), with the fence line at the current edge and the fence's own footprint counted as covered, like every other solid. If the fence footprint or a moved object would bring the area below it, the left, right and back edges of the place, and with them the fence line, move outward until the area is met. The street-side (front) edge does not move, so the gate, the street and the path length of R-6 hold. The character stays in the garden inside the fence, and his wandering, greeting and waving work as today.
- R-12 (G-1): These keep working: walking and looking, solid objects stopping the person, the front door and the enterable house, the character with his animations and colours, the sun and its shadows, the start screen and the intake. The spawn point is in the garden on the tiled path 2 m inside the gate, free and reachable, and the person faces the house on entry. The character's start spot stays a free spot a person can reach.
- R-13 (G-2): The new objects (fences, gate, tiles, curb, road, cars, lamps) cast and receive shadows like the other objects in the garden, except the sun shadows on the street objects that R-14 drops.
- R-17 (G-2): If a car or lamp model, or a tile, curb or road texture, fails to load, the place still loads with a plain block or colour in its place and a one-sentence message in the place's existing notice area, shown the same way other load messages are shown. When several assets fail in one load, one message is shown for that load, not repeated during the visit. The fence line and the gate do not depend on a loaded file.

### Non-functional

- R-14 (G-3): Walking averages 30 frames per second or better over a 2-minute walk that always follows the same route: from the start spot along the path to the front door, through every room, and back out. If the builder's measurement misses the target, the cars and lamps are reduced first, down to no fewer than 1 car and 1 lamp (never the fence, the tiles or the house), then the sun shadows on the street objects are dropped. The frame rate is read from the browser's built-in frame-rate display every 10 seconds during the walk, and the average of those 12 values is the measurement. This is decided before the feature goes online, from the builder's measurement; nothing switches at run time. If the walk still misses the target, the feature does not go online until it is met.
- R-15 (G-4): The compressed first-visit transfer with an empty cache, from the start screen through the place, the street, the house and the character, is at most 100 MB. It is read with the person standing in the garden, once no new file has arrived for 10 seconds.
- R-16 (G-2): Every new asset (cars, lamps, tile, curb and road textures) has a recorded licence (author, source link, licence text, any credit line) that is usable: CC0, CC-BY with the credit shown, or one that explicitly allows use and redistribution. NC, ND or no licence is not usable. Credit lines are shown in the existing Credits list of the start page. Every asset ships with the app and loads from its own address, never from a third-party host. Car models and textures carry no readable brand logos or number plates. The builder must first try to find a free asset for each item; if none is found, a plain block or colour is acceptable, the feature still ships and the missing items are listed.
- R-18 (G-1 and G-2): Nothing about a person is stored or sent. The feature collects, stores and sends no personal data.
- R-19 (G-1 and G-2): Each of R-1 to R-13, R-16 and R-17 has a short written checklist of concrete things to see, written into the spec's acceptance criteria before building starts, so the builder can judge it met or not met. R-14, R-15 and R-18 are measured or standing conditions, not checklist items: R-14 and R-15 are judged from the builder's measurements, and R-18 holds for the whole feature.

## Scope and out of scope

In scope: the fence line at the current edge with the two inner fences moved out to it; the closed gate; the 1.2 m wide path of 60 by 30 cm slabs, about 2 m longer, continuing beyond the gate; the tiled sidewalk, curb, road, 3 cars and 3 lamps beyond the fence, static and unreachable; the spawn point on the path inside the gate, facing the house; sun shadows on the new objects; licence records and credits; plain-block fallbacks.

Out of scope: see Non-goals.

## Assumptions

- A-1: The builder and the Product Owner are the same person. Only the builder judges the checklists.
- A-2: The current edge of the place is 24 m by 22 m (x from -12 to 12, z from -11 to 11), measured from the layout data on 2026-11-09. The fence line follows the edge at the start of building.
- A-3: Free models with usable licences exist for parked cars and street lamps, and free textures for tiles, curb and asphalt. Not yet sourced. R-16 allows plain blocks if none is found.
- A-4: The street side is the +z (front) edge (z = 11), the direction the path leads today. Today the path runs from the front door (z = -5) to z = 9, 14 m; the gate stands at the edge, so the path to it is 16 m. Measured from the layout data on 2026-11-09.
- A-5: Whether tiles are separate objects or a drawn pattern is a technical choice for the plan, as long as individual tiles with joints can be told apart (R-5).

## Dependencies and risks

- Dependency: the sun-shadow work already in the place (R-13); the existing Credits list and licence checks (R-16); the asset sourcing of A-3; the walkable-area rule of the house feature (R-11).
- Risk: many fence sections, tiles, cars and lamps cost frame rate. Addressed by: R-14 (fixed route, fallback order, and no go-online until met).
- Risk: the fence line at the current edge puts the fence where trees or other objects stand (tree-5 and tree-6 near the back edge). Addressed by: R-2.
- Risk: moving objects changes the character's wander routes. Addressed by: R-11.
- Risk: free car and lamp models may not exist. Addressed by: R-16 and D-19.
- Risk: the fence footprint may bring the walkable area below the limit. Addressed by: R-11 (the place grows).
- Risk: the download grows with the street assets. Addressed by: R-15.
- Risk: a person looks at a street that cannot be reached. This is the intended look; the closed gate is the visible reason (R-3, R-9).
- Compliance: no personal data is involved and nothing is stored or sent, so the GDPR and the EU AI Act are not touched (R-18). Car models and textures must not show readable brand logos or number plates (R-16). This is an attention point, not a legal opinion.

## Open questions

- None that is a product decision.
- Technical questions for the plan: how the tiles are built (A-5), how far the shadows must reach over the street, and how the fence line and gate are measured for the 444.5 m² check.
