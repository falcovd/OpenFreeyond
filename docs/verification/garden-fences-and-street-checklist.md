# Garden fences and street: verification checklist

Spec: `specs/garden-fences-and-street/spec.md`. Plan: `docs/plans/2026-11-09-garden-fences-and-street.md`. The builder fills this in (Task 14). Answer each line yes or no. Quote the spec text as written. Only the builder judges these items.

Rows marked "Auto" are also covered by a unit test (file and test named in the row). The test proves the data and logic. A person still judges how it looks and feels, and the rows without "Auto" are judged by a person only.

NFR-5 is a stated limitation, not a deliverable: no accessibility level is promised, and the place works with keyboard and mouse or trackpad only, on desktop browsers (spec A-6).

## Test note

- Laptop (model, chip, RAM): ______
- Operating system and version: ______
- Date: ______
- Chrome version: ______ Firefox version: ______ Safari version: ______ (latest stable at the time of testing)
- `STREET_CARS` used (`src/world/streetConfig.js`): ______
- `STREET_LAMPS` used (`src/world/streetConfig.js`): ______
- `STREET_SHADOWS` used (`src/world/streetConfig.js`): ______
- `SHADOWS` used (`src/world/shadowConfig.js`): ______
- Frame-rate walk values, Chrome, every 10 seconds (12 values): ______ . Average: ______ fps (needs 30 or more)
- First-visit transfer (Chrome, cache disabled, stand in the garden until nothing new arrives for 10 s): ______ MB (needs 100 MB or less)

## How to measure

1. Regression (AC-5.6): go through the start screen, intake, character animations and colours, walking and looking, front door, house and sun shadow items of `docs/verification/phase-1-checklist.md`, `docs/verification/world-visuals-checklist.md` and `docs/verification/enter-the-house-checklist.md`. Each must still be met, except the items under "Changed on purpose" below. Also AC-5.4 and AC-5.3: with the door open, walk to within 3 m of the character with a fence between you (he stops, faces you and waves once), and watch him wander for 5 minutes.
2. Frame-rate walk (AC-6.1): `npm run build && npx vite preview --port 5188`, open `http://localhost:5188/?stats` in Chrome on your own laptop, choose Try-out. Walk 2 minutes: from the start spot along the path to the front door, through every room, and back out. Write down the displayed fps every 10 seconds (12 values) and the average. Name the laptop in the test note.
3. If the average is below 30 (AC-6.2, AC-6.3): lower `STREET_CARS` and `STREET_LAMPS` first (not below 1 and 1), rebuild and measure again. Then set `STREET_SHADOWS = 'off'`, rebuild and measure again. If it is still below 30, the feature does not go online until a measurement meets 30. Write the outcome in "Decisions".
4. Transfer (AC-6.4): Chrome DevTools, Network tab, Disable cache on. Load the start screen, choose Try-out, stand in the garden until no new request has come for 10 seconds. Read the transfer figure in the bottom bar. At most 100 MB.
5. Quiet street (AC-4.5): watch the street for 1 minute. Nothing moves, no sound, the lamps are not lit.
6. Privacy (AC-7.1, AC-7.2): keep the Network tab open for 5 minutes along the path and the fence: only GET requests for files, nothing about you. In Application, Local Storage, compare the keys before and after a visit through the try-out: no new entry about you. A-Frame's own `debug` key is the known exception.
7. Browsers (AC-6.14): in the latest stable Chrome, Firefox and Safari on macOS, walk the path to the gate, along the fence, and look at the street. Record versions and the OS in the test note. Frame rate is judged only in Chrome.
8. Street ends: at each end of the front fence look along the street with a wide window. No end of the road or sidewalk may show. If one does, lengthen `STREET.length` or the fog far distance.
9. Go through every row below and write yes or no.

## Fence line (US-1)

- [ ] AC-1.1 "Given the person walks along each of the four edges of the place, when the builder asks "is there any stretch of the edge with no fence in front of it, other than the closed gate?", then the answer is no." (Person only: stand at each corner and walk along each edge, then look for any stretch with no fence in front of it. The data has no gap (`tests/fenceLine.test.js` "leaves no gap other than the gate: the pieces touch end to end"), but a person looks.)
- [ ] AC-1.2 "Given the person walks into each of the four fences, and into every part of the fence line, when the person keeps moving, then the person stops in front of the fence each time and does not pass." (Auto: `tests/garden-layout.test.js` "stops a walk into each edge in front of a fence, never at the bounds". A person also checks: walk into each of the four fences and the gate.)
- [ ] AC-1.3 "Given the person is stopped at any edge of the place, when the builder looks at where the person stands, then a fence or the gate is directly in front of the person. There is no invisible stop." (Auto: `tests/garden-layout.test.js` "stops a walk into each edge in front of a fence, never at the bounds". A person also checks: stop at each edge and see a fence or the gate in front of you.)
- [ ] AC-1.4 "Given the layout data, when the builder reads the fence line, then it follows the edge of the place on all four sides, and no fence stands inside the garden." (Auto: `tests/garden-layout.test.js` "follows the four edges and no fence stands inside the garden"; `tests/fenceLine.test.js` "puts the outer face of every fence on the edge and keeps it inside the bounds", "leaves no gap other than the gate: the pieces touch end to end".)
- [ ] AC-1.5 "Given the builder looks at a section of the fence, when the builder answers "does it look like today's fence, with posts every metre, two rails, cream colour and 1 m high?", then the answer is yes." (Auto for the data part: `tests/builders-gate.test.js` "is no higher than the fence and uses the fence colour"; `tests/fenceLine.test.js` "puts posts about every metre, the first and last inset 6 cm from the ends, on every piece". A person judges: look at a section of the fence next to the old one.)
- [ ] AC-1.6 "Given the garden objects before and after the change, when the builder compares them, then each object whose solid footprint overlapped the fence line, the path or its extension was moved the smallest distance that clears it, none was removed, and none stands on another solid object, on the path, or on the start spot or the character's start spot. An object for which no clear spot existed near it is listed in the checklist with the builder's decision." (Auto: `tests/garden-layout.test.js` "does not cover the path, its extension or the spawn with a garden object (AC-1.6)", "keeps every garden object clear of the fence line, none removed (AC-1.6)". A person also checks: compare the garden objects with the earlier layout. See "Moved garden objects".)

## Gate (US-2)

- [ ] AC-2.1 "Given the person stands on the path inside the gate and looks toward the street, when the builder asks "does a gate stand at the end of the path in the front fence, centred on the path, with a post on each side, matching the fence in look and height?", then the answer is yes." (Auto for the data part: `tests/builders-gate.test.js` "draws two rails across the opening, a brace, and no posts"; `tests/fenceLine.test.js` "leaves exactly 1.2 m between the inner faces of the two gate-side end posts". A person judges: stand on the path 2 m inside the gate and look.)
- [ ] AC-2.2 "Given the closed gate, when the person walks into it and clicks it, then the person stops in front of it and the gate does not open or move." (Auto: `tests/garden-layout.test.js` "stops a walk into the closed gate (AC-2.2)"; `tests/builders-gate.test.js` "is tagged as a gate that clicks pass through". A person also checks: walk into the gate and click it.)
- [ ] AC-2.3 "Given the layout data, when the builder reads the gate and the path, then the clear opening of the gate is 1.2 m, equal to the width of the path, and the gate is centred on the path." (Auto: `tests/garden-layout.test.js` "has a 1.2 m gate centred on a 1.2 m path"; `tests/fenceLine.test.js` "has a gate of 1.2 m centred on the path x (AC-2.3)".)

## Path (US-3)

- [ ] AC-3.1 "Given the person stands on the path and looks along it, when the builder asks "can I tell individual rectangular slabs apart, in rows with visible joints?", then the answer is yes." (Auto for the data part: `tests/builders-slabs.test.js` "has whole slabs along both long sides and the partial row at the far end". A person judges: look along the path.)
- [ ] AC-3.2 "Given the layout data, when the builder reads the path, then a slab is 60 by 30 cm, the path is 1.2 m wide with two whole slabs across, and a partial slab appears only at the ends of the path and where it meets the sidewalk, not along its long sides." (Auto: `tests/slabs.test.js` "lays the 1.2 m path as two whole slabs across, 53 whole rows and one partial row at the far end".)
- [ ] AC-3.3 "Given the layout data, when the builder measures the path from the front door to the gate, then it is 16 m, which is longer than today's 14 m." (Auto: `tests/garden-layout.test.js` "runs 16 m from the front door to the gate (AC-3.3)".)
- [ ] AC-3.4 "Given the person walks the whole path from the front door to the gate, when the person keeps moving, then the person is not stopped by anything on the way." (Auto: `tests/garden-layout.test.js` "can be walked from the gate to the door without being stopped (AC-3.4)".)
- [ ] AC-3.5 "Given the person stands on the path inside the gate, when the builder asks "does the path continue beyond the gate and meet the sidewalk, so that it looks connected to it?", then the answer is yes." (Auto for the data part: `tests/builders-slabs.test.js` "runs from the gate (whole slabs) back to the door (partial row)". A person judges: look from just inside the gate. The path is 5 cm high and the sidewalk top 15 cm, so check the step at the gate.)
- [ ] AC-3.6 "Given the sidewalk, when the builder looks along it, then it is made of the same kind of slabs, three whole slabs across, and no partial slab shows along its length." (Auto: `tests/slabs.test.js` "lays the 1.8 m sidewalk as three whole slabs across and no partial slab at all"; `tests/builders-street.test.js` "has a slab strip of 3 whole slabs across the sidewalk".)

## Street (US-4)

- [ ] AC-4.1 "Given the person stands at the start spot and turns toward the gate, when the builder asks "does a sidewalk, a curb and a road with a centre line show beyond the fence, and does it read as a street that the path connects to?", then the answer is yes." (Person only: stand at the start spot and turn toward the gate.)
- [ ] AC-4.2 "Given the layout data, when the builder reads the street, then the sidewalk is 1.8 m wide, the curb is 15 cm high, and the road is 7 m wide with a centre line." (Auto: `tests/street-layout.test.js` "has a 1.8 m sidewalk that starts at the front fence (A-8)", "has a 15 cm curb and a 7 m road"; the centre line is in `tests/builders-street.test.js` "has one instanced centre line of 3 m dashes on the road centre".)
- [ ] AC-4.3 "Given the person walks along the front fence to each end of it and looks along the street, when the builder asks "does the road carry on out of view, with no end of the road in sight?", then the answer is yes." (Auto for the data part: `tests/street-layout.test.js` "ends inside the fog from anywhere in the garden (AC-4.3)". A person judges: walk to each end of the front fence and look along the street with a wide window (How to measure, step 8).)
- [ ] AC-4.4 "Given the layout data, when the builder reads the street, then 3 cars stand at the curb and 3 lamps stand along the sidewalk, each within 10 m either side of the point opposite the gate, except items that FR-16 lists as missing or that FR-17 reduced, which are written down in the checklist." (Auto: `tests/street-layout.test.js` "match the build-time counts", "stand within 10 m of the gate".)
- [ ] AC-4.5 "Given the person watches the street for 1 minute, when the builder looks at the cars and the lamps, then nothing moves, no sound is played, and the lamps are not lit." (Auto for the data part: `tests/builders-props.test.js` "nothing moves, makes sound or gives light (AC-4.5)". A person judges: watch the street for 1 minute.)
- [ ] AC-4.6 "Given the cars and the lamps that have a real model, when the builder looks at each, then the builder answers yes to "is it recognisable as a car, or as a street lamp?". An item that stands as a plain block is on the list of missing items and is not counted." (Person only: look at each car and lamp close to the fence.)
- [ ] AC-4.7 "Given the person walks into the front fence and the gate at every point along them, when the person keeps moving, then the person never reaches the sidewalk, the curb or the road." (Auto: `tests/garden-layout.test.js` "stops a walk into each edge in front of a fence, never at the bounds"; `tests/street-layout.test.js` "stand beyond the walkable garden and are not solids", "has nothing in SOLIDS that reaches past BOUNDS.maxZ". A person also checks: walk into the front fence and the gate at every point.)
- [ ] AC-4.8 "Given the person walks to each edge of the place and looks toward the horizon, including along the ends of the road, when the builder asks "is any void or empty gap visible between the ground and the sky?", then the answer is no." (Auto for the data part: `tests/street-layout.test.js` "is smaller than the ground, with fog room beyond it". A person judges: look toward the horizon from each edge, including along the ends of the road.)
- [ ] AC-4.9 "Given the sun and the sun shadows, when the builder looks at the fences, the gate, the slabs, the curb, the road, the cars and the lamps, then each casts a shadow and shows shadows like the other objects in the garden, except the street objects whose shadows FR-17 dropped (AC-4.10)." (Auto for the data part: `tests/shadows.test.js` "has a rule for every kind that buildWorld makes"; `tests/shadowFrustum.test.js` "holds the street corners at x = +-12 for every azimuth". A person judges: look for shadows of the fences, the gate, the slabs, the curb, the road, the cars and the lamps.)
- [ ] AC-4.10 "Given FR-17 dropped the sun shadows on the street objects, when the builder looks at the street, then the fence line, the gate and the path still cast and show shadows, and the dropped shadows are written down in the checklist." (Auto for the data part: `tests/shadows.test.js` "drops the street kinds, and only those, when streetShadows is off (AC-4.10)". A person judges: only applies if `STREET_SHADOWS = 'off'`; write down the decision in "Decisions".)

## Everything before keeps working (US-5)

- [ ] AC-5.1 "Given the new layout data, when the builder measures the walkable area outside the house, with the fence's footprint counted as covered and the method of the phase 1 comparison, then it is at least 444.5 m²." (Auto: `tests/garden-layout.test.js` "leaves at least the phase 1 walkable area of 444.5 m2 with the fence counted as covered (AC-5.1)".)
- [ ] AC-5.2 "Given the area needed the place to grow (if it did not, this criterion does not apply and the checklist says so), when the builder compares the edges of the place before and after, then only the left, right and back edges moved outward, the front edge did not move, and the area is at least 444.5 m²." (Person only: does not apply: no edge moved (see "Decisions").)
- [ ] AC-5.3 "Given the front door is open, when the builder watches the character wander for 5 minutes, then he stays in the garden inside the fence line." (Auto for the data part: `tests/garden-layout.test.js` "wanders for 5 minutes without leaving the garden". A person judges: open the door and watch for 5 minutes.)
- [ ] AC-5.4 "Given a person comes within 3 metres of the character, with a wall or a fence between them, when the builder watches, then he stops, faces the person and waves once, as before." (Person only: open the door, walk to within 3 m of the character with a fence between you: he stops, faces you and waves once.)
- [ ] AC-5.5 "Given the layout data and a new visit, when the person enters the place, then the person stands on the path 2 m inside the gate, on a free spot that is reachable, faces the house, and the character's start spot is a free spot outside the house that a person can reach." (Auto: `tests/garden-layout.test.js` "is on the path 2 m inside the gate, free, reachable and in front of the house (z above the house)". A person also checks: start a new visit.)
- [ ] AC-5.6 "Given the checklists of the earlier specs for the start screen, the intake, the character's animations and colours, walking and looking, the front door and the house, and the sun shadows, when the builder goes through them, then each is still met, except the criteria that this feature changes on purpose: the two fences that stood inside the garden (FR-8 and AC-3.4 of the world-visuals spec), the gravel path of 1.4 m (FR-5 and AC-2.2 there), and the start spot as "a free spot in the street" (FR-18 of the house spec). The builder lists in the checklist each criterion judged as changed on purpose." (Person only: go through the earlier checklists (How to measure, step 1). The changes made on purpose are in "Changed on purpose".)

## Frame rate, download, licences, failures, browsers (US-6)

- [ ] AC-6.1 "Given Chrome on the builder's own laptop and the frame-rate display on, when the builder does a frame-rate walk and notes the displayed value every 10 seconds, then the average of the 12 values is 30 frames per second or better, and the laptop is named in the test note." (Person only: frame-rate walk, How to measure step 2. Average: ______ fps.)
- [ ] AC-6.2 "Given the builder's measurement misses 30 frames per second, when the builder decides about going online, then the cars and lamps were reduced first, to no fewer than 1 car and 1 lamp, the fence, the slabs and the house were not reduced, the measurement was done again, and the decision is written in the checklist." (Person only: only if the average misses 30; write the decision in "Decisions". Cars and lamps now: ______ and ______.)
- [ ] AC-6.3 "Given the measurement still misses 30 frames per second after the cars and lamps were reduced and the shadows on the street objects were dropped, when the builder decides about going online, then the feature is not put online until a measurement meets 30 frames per second." (Person only: only if the average still misses 30 after the cars, lamps and shadows were reduced.)
- [ ] AC-6.4 "Given Chrome's network tool with the cache disabled, when the builder loads the place from the start screen through the try-out and stands in the garden until no new file has arrived for 10 seconds, then the first-visit transfer shown is at most 100 MB." (Auto for the data part: `tests/budget.test.js` "keeps shipped assets at or under 90 MB, so the page, scripts and assets stay under the 100 MB limit". A person judges: How to measure, step 3. Transfer: ______ MB.)
- [ ] AC-6.5 "Given every new asset, when the builder reads its record, then it has an author, a source link, the licence text and any credit line, and the licence is CC0, CC-BY or another that allows use and redistribution." (Auto: `tests/licences.test.js` "gives every record an author, a source link, the licence text and a usable licence"; `tests/manifest.test.js` "points only to files that exist, with a licence record each".)
- [ ] AC-6.6 "Given a CC-BY asset, when the builder opens the Credits list on the start page, then its credit line is there." (Auto: `tests/licences.test.js` "requires a credit line for every CC-BY asset"; `tests/credits.test.js` "lists every credit that a licence requires". The street assets are all CC0, so no credit line is needed.)
- [ ] AC-6.7 "Given no free asset was found for a car, a lamp or a slab, curb or road texture, when the builder looks at the street, then a plain block or colour stands in its place, and the item is on the list of missing items with what was tried to find it." (Person only: nothing is missing (see "Missing items"); the plain blocks are the fallback only.)
- [ ] AC-6.8 "Given the network tool is open during a visit, when the builder inspects the requests, then every request for a file of the place goes to the place's own web address and none goes to a third-party host." (Auto for the data part: `tests/manifest.test.js` "lists car-1..car-3 and the lamp by default, all under the app base". A person judges: network tab during any visit: every file request goes to the place's own address.)
- [ ] AC-6.9 "Given each car model, when the builder looks at it close up, then no readable brand logo or number plate is visible." (Auto for the data part: `tests/street-glb.test.js` "parses, is at most 1 MB and has no logo or plate". A person judges: look at each car close up for a logo or number plate.)
- [ ] AC-6.10 "Given a single car or lamp model fails to load, when the person looks at the street, then a plain block stands in its place, a load message is shown in the existing notice area, the place loads, and there is no blank screen." (Auto for the data part: `tests/builders-props.test.js` "without a model: a plain block of the right size". A person judges: block one car file and the lamp file in DevTools: a plain block stands in, one message shows, no blank screen.)
- [ ] AC-6.11 "Given a slab, curb or road texture fails to load, when the place loads, then a plain colour stands in its place, a load message is shown, and the place keeps working." (Auto for the data part: `tests/builders-street.test.js` "uses plain colours with no textures (AC-6.11)". A person judges: block `paving.jpg` and `asphalt.jpg`: a plain colour stands in, one message shows.)
- [ ] AC-6.12 "Given several assets fail to load in one load, when the builder looks at the notice area during the visit, then one load message is shown for that load, and it does not appear again during the same visit." (Auto for the data part: `tests/assetLoader.test.js` "is one non-empty sentence however many street assets failed". A person judges: block several street files at once: one message for that load, not repeated during the visit.)
- [ ] AC-6.13 "Given every file of the street fails to load, when the place loads, then the fence line and the gate still stand and the person is still stopped by them." (Auto for the data part: `tests/buildWorld.test.js` "with no assets still draws fences, gate, street, and the cars and lamps as plain blocks (AC-6.13)". A person judges: block every file under `models/street` and both street textures: the fence and gate stand and stop you.)
- [ ] AC-6.14 "Given the latest stable Chrome, Firefox and Safari on desktop, with their versions and the operating system recorded in the test note, when the builder walks the path to the gate, along the fence line, and looks at the street, then it works in each of them." (Person only: How to measure, step 6.)

## Privacy (US-7)

- [ ] AC-7.1 "Given the network tool is open during 5 minutes of use that includes walking along the path and the fence, when the builder inspects the requests, then no request carries a value about the person." (Auto: `tests/privacy.test.js` "keeps storage and the network out of the fence, slab and street files" (code only; a person inspects the network tab). How to measure, step 5.)
- [ ] AC-7.2 "Given the browser storage is inspected before and after a visit through the try-out, when the builder compares them, then no entry about the person has been added." (Auto: `tests/privacy.test.js` "keeps storage and the network out of the fence, slab and street files" (code only; a person compares Local Storage). How to measure, step 5.)
## Missing items

none missing

Every car, lamp and texture has a free asset with a recorded licence (`src/data/licences.js`). Found on 2026-11-09:

- Cars `models/street/car-1.glb` (sedan), `car-2.glb` (hatchback, body recoloured brick red) and `car-3.glb` (SUV): Quaternius, Cars Bundle via Poly Pizza (https://poly.pizza/m/Cz6yDaUcM9, https://poly.pizza/m/unqqkULtRU, https://poly.pizza/m/xsMtZhBkxL), CC0 1.0 ("Public Domain (CC0)" on each page). About 3,000 triangles each, rounded bodies, windows, spoked wheels, lights; flat colours, no texture, no logos, blank grey plates (AC-6.9). These replace the blockier Kenney Car Kit models after the Product Owner found them too blocky.
- Lamp `models/street/lamp.glb`: Quaternius, Street Light via Poly Pizza (https://poly.pizza/m/nFwrlcLvM5), CC0 1.0. A pole with a smooth curved arm and a lamp head, 324 triangles, no emissive material, so the lamps are not lit. It replaces the Kenney light-curved model.
- Paving texture `textures/paving.jpg`: ambientCG, Paving Stones 109, https://ambientcg.com/a/PavingStones109, CC0 1.0.
- Asphalt texture `textures/asphalt.jpg`: ambientCG, Asphalt 031, https://ambientcg.com/a/Asphalt031, CC0 1.0.

The cars and lamps were made from the Quaternius files by `scripts/build-street-props.mjs`. None of the assets needs a credit line.

## Changed on purpose (AC-5.6)

These older expectations changed because of this feature. Each is judged as changed, not as failed.

- The two fences that stood inside the garden (FR-8 and AC-3.4 of the world-visuals spec) are gone. The fence now runs along the four edges only (AC-1.4).
- The gravel path of 1.4 m (FR-5 and AC-2.2 of the world-visuals spec) is now a path of paving slabs, 1.2 m wide and 16 m long.
- The start spot as "a free spot in the street" (FR-18 of the house spec) is now a spot on the path 2 m inside the gate (AC-5.5). The street is beyond the fence and cannot be reached.

Any other criterion that the builder finds changed goes here: ______

## Moved garden objects (FR-3, AC-1.6)

none

No garden object had to move. `tests/garden-layout.test.js` "keeps every garden object clear of the fence line, none removed (AC-1.6)" and "does not cover the path, its extension or the spawn with a garden object (AC-1.6)" verify that all objects keep their places and none stands on the fence line, the path or the start spot.

## Decisions

- Frame-rate steps (FR-17, AC-6.2, AC-6.3): the order is fixed. First lower `STREET_CARS` and `STREET_LAMPS` (never below 1 and 1), then `STREET_SHADOWS = 'off'`. The fence, the slabs and the house are never reduced. Nothing switches at run time. Measured result and decision: ______ . Date: ______ .
- Shadows: `STREET_SHADOWS` is 'on' by default, and `SHADOW_REGION` (in `src/world/streetLayout.js`) holds the whole street. If the shadows on the street are dropped, the fence line, the gate and the path still cast and show shadows (AC-4.10). Shadows dropped: ______ (yes or no).
- AC-5.2 does not apply: the area did not need the place to grow, so no edge moved. The walkable area outside the house is above 444.5 m2 with the fence counted as covered (`tests/garden-layout.test.js`, AC-5.1), and the front edge stays at z = 11.
- The plain-block stand-in for a lamp is a 0.33 by 1.66 by 4.5 m slab (width, depth, height), the size of the lamp model with its arm over the road. It shows only when the lamp file fails (AC-6.10).
- The car sizes were scaled: `scripts/build-street-props.mjs` scales the three Quaternius cars (1.05, 1.2 and 1.0) and the sizes in `streetLayout.js` follow the result (4.43, 3.97 and 4.21 m long). The shipped street files may be up to 2 MB each (`tests/street-glb.test.js`); they are about 0.2 MB.
- Far sidewalk (D-27, beyond spec v1): the Product Owner asked for a second sidewalk on the far side of the road, with the same 1.8 m width, slabs and 15 cm curb. It is scenery and unreachable (no solids, no lamps or cars). AC-4.1 and AC-4.2 are judged for the near sidewalk; the far one is not part of them.

## Known open points

- No visual check has been made yet of the fence, the gate, the slabs, the street, the cars and the lamps. Every row above marked "person" needs the builder in a browser.
- Z-fighting (flickering where flat surfaces meet: the slab underlay, the road, the centre line, the curb top) and the ends of the street in the fog are to be checked by eye (How to measure, step 8).
- Step height at the gate: the path is 5 cm high and the sidewalk top is 15 cm, so there is a small visible step beyond the gate. The builder judges AC-3.5.
