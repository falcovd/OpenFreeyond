# Enter the house: verification checklist

Spec: `specs/enter-the-house/spec.md`. Plan: `docs/plans/2026-11-09-enter-the-house.md`. The builder fills this in (Task 15). Answer each line yes or no. Quote the spec text as written. Only the builder judges these items.

Rows marked "Auto" are also covered by a unit test (file and test named in the row). The test proves the data and logic. A person still judges how it looks and feels, and the rows without "Auto" are judged by a person only.

## Test note

- Laptop (model, chip, RAM): ______
- Operating system and version: ______
- Date: ______
- Chrome version: ______ Firefox version: ______ Safari version: ______ (latest stable at the time of testing)
- `TV_MODE` used (`src/world/interiorConfig.js`): ______
- Frame-rate walk values, Chrome, every 10 seconds (12 values): ______ . Average: ______ fps (needs 30 or more)
- First-visit transfer (Chrome, cache disabled, stand in the house until nothing new arrives for 10 s): ______ MB (needs 100 MB or less)
- Slow 4G: loading indicator gone after ______ s (needs 30 s or less)

## How to measure

1. Regression (AC-6.7): go through the start screen, intake, character animations and colours, and walking and looking items of `docs/verification/phase-1-checklist.md` and `docs/verification/world-visuals-checklist.md`. Each must still be met.
2. Frame-rate walk (AC-7.1): `npm run build && npx vite preview --port 5188`, open `http://localhost:5188/?stats` in Chrome on your own laptop, choose Try-out. Walk 2 minutes: the garden, in through the front door, every room, and out. Write down the displayed fps every 10 seconds (12 values) and the average. Name the laptop in the test note.
3. Transfer (AC-7.3): Chrome DevTools, Network tab, Disable cache on. Load the start screen, choose Try-out, walk into the house and stand there until no new request has come for 10 seconds. Read the transfer figure in the bottom bar.
4. Slow 4G (AC-7.7): DevTools Network throttling "Slow 4G", cache disabled, reload, choose Try-out and start a timer. After 30 seconds the loading indicator is gone and the garden and the outside of the house show with whatever has loaded. Then check that the interior arrives afterwards: plain blocks first, then models (AC-7.8).
5. Failure cases (AC-7.9, AC-7.10, AC-4.7): in DevTools right-click a request and choose Block request URL. Block `house.glb` (the house is a closed block, a load message shows, no interior, no blank screen). Then `couch.glb` (a plain block, you are stopped by it, a load message shows). Then `tv-clip.mp4` (the TV shows the still). For autoplay blocked, make `video.play()` reject from the console.
6. Privacy (AC-8.1, AC-8.2): keep the Network tab open for 5 minutes of use that includes opening and closing the door and walking through the house: only GET, no query strings, no bodies, no value about the door or you. In Application, Local Storage, compare the keys before and after a visit. A-Frame's own `debug` key is the known exception from the older measurement.
7. Browsers (AC-7.11): in the latest stable Chrome, Firefox and Safari on macOS, open the door, walk in, go through every room and walk out. Record versions and the OS in the test note. Frame rate is judged only in Chrome. Check the TV clip in Safari and Firefox in particular (muted autoplay of the mp4).
8. Screen recording (AC-1.6, AC-1.7): record at 30 fps or more (QuickTime or DevTools) and step through the frames. Time the swing, and the time from click to the first moving frame.

## Door (US-1)

- [ ] AC-1.1 "Given the front door is fully closed and the person stands within 3 metres of it with the door in view, when the person clicks the door once, then the door swings and ends fully open." (Auto: `tests/door.test.js` "a click on a closed door swings it, and it ends fully open (AC-1.1)"; a person checks it in the browser.)
- [ ] AC-1.2 "Given the front door is fully open and the person stands within 3 metres of it with the door in view, when the person clicks the door once, then the door swings and ends fully closed." (Auto: `tests/door.test.js` "a click on an open door swings it, and it ends fully closed (AC-1.2)".)
- [ ] AC-1.3 "Given the person stands more than 3 metres from the front door, when the person clicks the door, then nothing happens and the door stays as it was." (Auto: `tests/door.test.js` "is more than the click range from a person 4 m away".)
- [ ] AC-1.4 "Given a wall hides the door from the person, even though the person is within 3 metres in a straight line, when the person clicks, then the click lands on the wall and the door stays as it was." (Person only: stand 2 m from the closed door with a wall between you and the door, click where the door would be.)
- [ ] AC-1.5 "Given the person is inside the house within 3 metres of the front door, with the door in view, when the person clicks it, then it switches state as in AC-1.1 and AC-1.2." (Auto: `tests/door.test.js` "works from inside the house (FR-5, AC-1.5)".)
- [ ] AC-1.6 "Given a door at rest, when the builder times a full swing on a screen recording, from the first frame in which the door moves to the first frame in which it stands still, then each swing from fully closed to fully open and back takes at least 0.5 and at most 2 seconds." (Auto: `tests/door.test.js` "lasts between 0.5 and 2 seconds"; the recording is a person check.)
- [ ] AC-1.7 "Given a door at rest and a person within 3 metres with the door in view, when the person clicks the door, then on a screen recording made at 30 frames per second or more, the door has started to move within 0.5 seconds of the click." (Auto: `tests/door.test.js` "moves at once: the first step already turns it (NFR-4)"; the recording is a person check.)
- [ ] AC-1.8 "Given the person presses the mouse button over the door and drags to look around, when the person releases the button, then the door has not changed state." (Auto: `tests/click.test.js` "is a drag when the pointer moved past the limit", "is a click when the pointer stays put"; a person tries it on the door.)
- [ ] AC-1.9 "Given the person opened the door and then reloads the page, when the place has loaded, then the door is fully closed." (Auto: `tests/door.test.js` "starts closed on every visit and is not stored (FR-6, AC-1.9)"; `tests/house-layout.test.js` "resetHouse closes the door and puts the swing space back off".)
- [ ] AC-1.10 "Given the front door is opened, when the builder watches the swing, then the door swings outward into the garden." (Auto: `tests/door.test.js` "swings outward into the garden (AC-1.10)".)

## Walking (US-2)

- [ ] AC-2.1 "Given the front door is fully open, when the person walks from the garden through the doorway into the house and back out, then the person is not stopped at the doorway." (Auto: `tests/house-layout.test.js` "lets a person through a fully open door and out again (AC-2.1)".)
- [ ] AC-2.2 "Given the front door is fully closed, when the person walks into the door, then the person stops and does not enter the house." (Auto: `tests/house-layout.test.js` "stops a person at a closed door (AC-2.2)".)
- [ ] AC-2.3 "Given the front door is swinging, when the person walks into the swinging door, then the person is stopped, the swing is not stopped or reversed, and the person can pass only when the door is fully open." (Auto: `tests/house-layout.test.js` "stops a person at the swing space while the door swings (AC-2.3)", `tests/door.test.js` "counts as open only when fully open, so a swinging door blocks (FR-4)"; a person walks and clicks twice during the swing.)
- [ ] AC-2.4 "Given the person walks into each outside wall of the house, and into each wall inside, when the person keeps moving, then the person stops at each of them." (Auto: `tests/house-layout.test.js` "stops a person at every wall, outside and inside (AC-2.4)".)
- [ ] AC-2.5 "Given the person walks into the couch, the TV, the kitchen units and the dining table, when the person keeps moving, then the person stops at each of them." (Auto: `tests/house-layout.test.js` "stops a person at the couch, the TV, the kitchen units and the dining table (AC-2.5)".)
- [ ] AC-2.6 "Given the layout data of the house, when the builder reads it, then the footprint is at least 5.5 m wide and at least 4.5 m deep, larger in at least one of the two, and fits in a box of 10 by 8 m in either direction, and every doorway, the front door included, is at least 1.2 m wide and at least 2 m high." (Auto: `tests/house-layout.test.js` "is at least 5.5 by 4.5 m, larger in one, and fits in 10 by 8 m either way", "has every doorway at least 1.2 m wide and 2 m high, the front door included".)
- [ ] AC-2.7 "Given the person is in the living room, when the person walks through the doorway to the kitchen room and back, then the person is not stopped at the doorway." (Auto: `tests/house-layout.test.js` "lets a person walk between the rooms through the inner doorway, both ways (AC-2.7)".)

## Hint and messages (US-3)

- [ ] AC-3.1 "Given the front door is at rest, in view and within 3 metres of the person, and nobody is in the doorway, when the person looks at the screen, then a hint of one short sentence shows." (Auto: `tests/door.test.js` "shows the hint when the door is at rest, near, in view and nobody is in the doorway"; `tests/door-messages.test.js` "shows and hides the door hint, one short sentence (AC-3.1, AC-3.2)"; `tests/house-messages.test.js` "are one short sentence each".)
- [ ] AC-3.2 "Given the hint shows, when the person walks more than 3 metres from the door, or turns so that the door is out of view, or steps into the doorway, or the door starts to swing, then the hint is gone." (Auto: `tests/door.test.js` "hides it as soon as one of those stops being true"; `tests/door-messages.test.js` as above.)
- [ ] AC-3.3 "Given the front door is fully open and the person stands in the doorway, when the person clicks the door, then the door stays fully open and a step-aside message of one short sentence shows." (Auto: `tests/door.test.js` "ignores a click on a door in the doorway, and says step aside (AC-3.3, AC-3.4)"; `tests/door-messages.test.js` "shows and hides the step-aside message (AC-3.3, AC-3.5)".)
- [ ] AC-3.4 "Given the front door is fully closed and the person stands in the swing space, in the garden in front of the door, when the person clicks the door, then the door stays fully closed and a step-aside message of one short sentence shows." (Auto: `tests/door.test.js` same test as AC-3.3; "is hit by a footprint that overlaps the opening or the swing space".)
- [ ] AC-3.5 "Given the step-aside message of AC-3.3 shows, when the person steps out of the doorway and clicks the door, then the door closes." (Auto: `tests/door.test.js` "closes the door on the next click after the person stepped out (AC-3.5)", "shows the step-aside message while it was asked for and the person is still in the way (AC-3.5)".)
- [ ] AC-3.6 "Given the door is swinging open, when the person clicks it twice more during the swing, including a double click, then the clicks are ignored and the door ends fully open." (Auto: `tests/door.test.js` "ignores any click while it swings, even a double click, and finishes in its direction (AC-3.6, AC-3.7)".)
- [ ] AC-3.7 "Given the door is swinging closed, when the person clicks it during the swing, then the click is ignored and the door ends fully closed." (Auto: same test as AC-3.6.)

## The main floor (US-4, US-5)

- [ ] AC-4.1 "Given the layout data of the main floor, when the builder reads it, then there are at least two rooms with a doorway between them, a living room with a couch and a TV, and a kitchen room with the kitchen units and a dining table, the front door opens into the living room, and each room is at least 3.5 by 3.5 m inside." (Auto: `tests/house-layout.test.js` "has a living room and a kitchen room, each at least 3.5 by 3.5 m inside", "puts the couch and the TV in the living room, the kitchen units and the dining table in the kitchen room", "opens the front door into the living room".)
- [ ] AC-4.2 "Given the person is inside the house, when the person walks through every room, then the couch, the TV, the kitchen units and the dining table are each visible and recognisable as such." (Auto: `tests/house-layout.test.js` "lets a person reach every interior item once the door is open (AC-2.1, AC-4.2)"; a person judges "recognisable".)
- [ ] AC-4.3 "Given the person is inside the house, when the builder looks at the lights, then several lights are visible, and the builder answers yes to 'do the lights give the rooms a warm glow, different from the garden?'." (Auto: `tests/lights.test.js` "is warm: every colour has red above green above blue"; `tests/house-layout.test.js` "has several warm lights, each inside a room, and no more than 4 (frame-rate budget)"; a person answers the question.)
- [ ] AC-4.4 "Given FR-22 does not apply and the TV clip plays, when the builder watches it for one full loop, then the screen shows a nature scene, the clip starts again when it ends, and no sound is played." (Auto: `tests/interior.test.js` "plays the clip muted and looping, and shows it"; `tests/tv-clip.test.js` "has no audio track"; a person watches one loop.)
- [ ] AC-4.5 "Given FR-22 does not apply, when the builder watches the TV clip, then the builder answers yes to 'is the picture slow, with no flashes and no sudden changes of brightness?'." (Person only. Counts as met when FR-22 applies and AC-4.8 and AC-7.2 are met.)
- [ ] AC-4.6 "Given the shipped TV clip, when the builder checks its length and size, then it is at most 60 seconds long and at most 30 MB." (Auto: `tests/tv-clip.test.js` "is at most 60 seconds and 30 MB".)
- [ ] AC-4.7 "Given the browser blocks the TV clip from playing, or the clip file fails to load, when the person looks at the TV, then the screen shows one still picture from the clip and the place keeps working." (Auto: `tests/tv.test.js` "shows the still when the clip failed to load (AC-4.7)", "shows the still when the browser blocks the clip (AC-4.7)"; `tests/interior.test.js` "falls back to the still when the browser blocks the clip (AC-4.7)", "falls back to the still when the clip fails to load (AC-4.7)"; a person blocks `tv-clip.mp4`.)
- [ ] AC-4.8 "Given FR-22 applies, when the person looks at the TV, then the screen shows one still picture from the clip, no sound is played, and the lights and the furniture are as designed." (Auto: `tests/tv.test.js` "shows the still, and never the clip, in still mode (FR-22, AC-4.8)"; `tests/interior.test.js` "in still mode the clip never shows and no clip is expected (AC-4.8)"; `tests/manifest.test.js` "has the still and no clip in still mode". Only needed if `TV_MODE = 'still'`.)
- [ ] AC-5.1 "Given the person walks through the whole main floor, when the person looks for stairs or any other way up, then there are none and the person cannot reach an upper floor." (Auto: `tests/house-layout.test.js` "has no stairs and no solid or item that leads upward (AC-5.1)"; `tests/house-glb.test.js` "has no stairs and a Ceiling node (AC-5.1, AC-5.2)".)
- [ ] AC-5.2 "Given the person is inside the house, when the person looks up, then a plain ceiling is seen and no upper floor is visible." (Auto: `tests/house-glb.test.js` "has no stairs and a Ceiling node (AC-5.1, AC-5.2)"; a person looks up.)
- [ ] AC-5.3 "Given the person stands in the garden, when the person looks at the house, then the builder answers yes to 'does the house have the same style as before: textured walls, a roof, the door on the garden side, two storeys and the upper windows?'." (Auto: `tests/house-glb.test.js` "has windows on the outside and at least 4 of them (AC-5.3)", `tests/builders-house.test.js` "returns the house group with the door, tagged parts and textured walls"; a person answers the question.)

## The place and the character (US-6)

- [ ] AC-6.1 "Given the front door is open, when the builder watches the character wander for 5 minutes, then he does not enter the house." (Auto: `tests/wander.test.js` "treats the doorway and every room as blocked", "never picks a target inside the house"; a person watches 5 minutes.)
- [ ] AC-6.2 "Given a person comes within 3 metres of the character, with a wall between them, when the builder watches, then he stops, faces the person and waves once, as before." (Auto: `tests/wander.test.js` "waves once when a person comes close and he faces them"; a person checks it with a wall between.)
- [ ] AC-6.3 "Given the new layout data, when the builder measures the walkable area outside the house with the method of the phase 1 comparison, then it is at least 444.5 m²." (Auto: `tests/house-layout.test.js` "leaves at least the phase 1 walkable area outside the house (AC-6.3)".)
- [ ] AC-6.4 "Given the person walks to each edge of the new place and looks toward the horizon, when the builder asks 'is any void or empty gap visible between the ground and the sky?', then the answer is no." (Auto: `tests/house-layout.test.js` "keeps the ground, sky and fog beyond the new boundary (AC-6.4)"; a person walks to each edge.)
- [ ] AC-6.5 "Given the person walks into each solid object in the garden and into each part of the new boundary, when the person keeps moving, then the person stops at each of them." (Auto: `tests/layout.test.js` "stops a person at every solid object", "stops a person at every part of the boundary"; `tests/house-layout.test.js` "keeps every solid inside the boundary (AC-6.5)".)
- [ ] AC-6.6 "Given the layout data, when the builder reads it, then the spawn point is a free spot in the street and the character's start spot is a free spot outside the house that a person can reach." (Auto: `tests/house-layout.test.js` "has a free spawn in the street and a reachable, free start spot for the character (AC-6.6)".)
- [ ] AC-6.7 "Given the checklists of the phase 1 and world-visuals specs for the start screen, the intake, the character's animations and colours, and walking and looking, when the builder goes through them, then each is still met." (Person only, step 1 of How to measure. Auto for the logic: the whole `npm test` run.)

## Frame rate, download, assets, failures, browsers (US-7)

- [ ] AC-7.1 "Given Chrome on the builder's own laptop, the interior in place and the frame-rate display on, when the builder does a frame-rate walk and notes the displayed value every 10 seconds, then the average of the 12 values is 30 frames per second or better, and the laptop is named in the test note." (Person only.)
- [ ] AC-7.2 "Given the builder's measurement misses 30 frames per second, when the interior goes online, then the TV shows only a still picture and the lights and the furniture are as designed." (Person only for the decision; the still mode is covered by the AC-4.8 tests.)
- [ ] AC-7.3 "Given Chrome's network tool with the cache disabled, when the builder loads the place from the start screen through the try-out and stands inside the house until no new file has arrived for 10 seconds, then the first-visit transfer shown is at most 100 MB." (Auto only in part: `tests/budget.test.js` "keeps shipped assets at or under 90 MB, so the page, scripts and assets stay under the 100 MB limit"; the measurement is a person check.)
- [ ] AC-7.4 "Given every new asset, when the builder reads its record, then it has an author, a source link, the licence text and any credit line, and the licence is CC0, CC-BY or another that allows use and redistribution." (Auto: `tests/licences.test.js` "has a record for every shipped asset file, and no record without a file", "gives every record an author, a source link, the licence text and a usable licence"; `tests/manifest.test.js` "has a licence record for every file it loads". See Known open points for the house.glb record.)
- [ ] AC-7.5 "Given a CC-BY asset, when the builder opens the Credits list on the start page, then its credit line is there." (Auto: `tests/licences.test.js` "requires a credit line for every CC-BY asset"; `tests/credits.test.js` "lists every credit that a licence requires".)
- [ ] AC-7.6 "Given no suitable free asset was found for an item, when the builder looks at the house, then a plain block stands in its place, the person is stopped by it, and the item is on the list of missing items." (Auto: `tests/missing-items.test.js` all four tests; `tests/interior.test.js` "blocks walking from the first frame: every solid item has a solid (AC-7.8)". At present no item is missing.)
- [ ] AC-7.7 "Given Chrome's 'Slow 4G' network throttling profile and a person on the start screen who chooses the try-out, when 30 seconds have passed, then the loading indicator is gone and the garden, including the outside of the house, is shown with whatever has loaded." (Auto in part: `tests/loading.test.js` "removes the indicator after 30 seconds even when the place never gets ready (AC-8.6)"; the Slow 4G run is a person check.)
- [ ] AC-7.8 "Given the interior files have not arrived yet, when the person is in the house, then a plain block stands in the place of each missing item and the person is stopped by it, and each item replaces its block when its file arrives." (Auto: `tests/interior.test.js` "starts with a plain block for every item, before any file has arrived (AC-7.8)", "blocks walking from the first frame: every solid item has a solid (AC-7.8)", "swaps a block for its model when the file arrives, and only that one".)
- [ ] AC-7.9 "Given the model of the house fails to load, when the place loads, then the house is a plain closed block, the person cannot enter it, a load message is shown, no interior is shown, and there is no blank screen." (Auto: `tests/builders-house.test.js` "is one closed block with no door", "keeps the person out of the closed house"; `tests/assetLoader.test.js` "has one-sentence load messages for the house and for the interior"; `tests/buildWorld.test.js` "survives every asset failing (AC-8.4)"; a person blocks `house.glb`.)
- [ ] AC-7.10 "Given a single interior model fails to load, when the person looks at the house, then a plain block stands in its place, the person is stopped by it, and a load message is shown." (Auto: `tests/interior.test.js` "keeps the plain block when a file fails (AC-7.10)"; `tests/assetLoader.test.js` "reports a failed file through onFail and still loads the rest"; a person blocks `couch.glb`.)
- [ ] AC-7.11 "Given the latest stable Chrome, Firefox and Safari on desktop, with their versions and the operating system recorded in the test note, when the builder opens the door, walks in, goes through every room and walks out, then it works in each of them." (Person only. Chrome ___ Firefox ___ Safari ___.)
- [ ] AC-7.12 "Given the builder's measurement with only a still picture on the TV still misses 30 frames per second, when the builder decides about going online, then the interior is not put online until a measurement meets 30 frames per second." (Person only. See Decision.)

## Privacy (US-8)

- [ ] AC-8.1 "Given the network tool is open during 5 minutes of use that includes opening and closing the door and walking through the house, when the builder inspects the requests, then no request carries a value about the door or about the person." (Auto: `tests/privacy.test.js` "never touches storage, cookies or the network from the world code", "keeps storage and the network out of door.js, click.js and tv.js"; the network check is a person check.)
- [ ] AC-8.2 "Given the browser storage is inspected before and after a visit in which the door was opened and closed, when the builder compares them, then no entry about the door or the person has been added." (Auto: `tests/privacy.test.js` same tests; `tests/door.test.js` "starts closed on every visit and is not stored (FR-6, AC-1.9)"; the storage comparison is a person check.)

## Review findings (PO review of the house shell, 2026-11-09)

Windows from inside supersede plan decision D-7. Person checks in the browser unless marked Auto.

- [ ] R-1 From the garden, at the front, both corners, the doorway and under the eave, no edge of the ceiling, a wall or a lining shows on the outside (no light line at 2.5 m, no vertical lines at the corners). (Auto: `tests/house-glb.test.js` "has no overlapping wall boxes", "keeps the ceiling, floor and linings inside the walls".)
- [ ] R-2 The closed door looks like a door from outside and from inside: panels, a knob on each side, a frame round the opening. It still opens and closes as before. (Auto: `tests/house-glb.test.js` "has a door with a handle on both sides"; the look is a person check.)
- [ ] R-3 There is a threshold in the front doorway and a low step outside, and a threshold in the inner doorway. Walking over them is not blocked or bumpy. (Auto: `tests/house-glb.test.js` checks they are 0.03 m or lower.)
- [ ] R-5 The indoor walls show a wallpaper (fabric-like) texture. With `wallpaper.jpg` missing they are a plain colour. (Auto: `tests/builders-house.test.js` "puts the wallpaper on the indoor plaster", "uses plain colours when the textures failed".)
- [ ] R-6 The indoor ceiling reads white (not grey), with a cornice and beams, and none of it is visible from outside. (Auto: `tests/house-glb.test.js` "has white ceiling structure"; the colour is a person check.)
- [ ] R-8 The three ground-floor windows can be seen through from inside, with glass, a frame and a sill on both sides. They still block walking. (Auto: `tests/house-glb.test.js` "has real window openings".)
- [ ] R-9 The ground-floor window glass is 30% opaque (opacity 0.3, so 70% see-through): from inside you see the garden through it, from outside you see the rooms. It still shows as glass and blocks walking; the door can still be clicked. The upper windows are unchanged. (Auto: `tests/builders-house.test.js` "makes the ground-floor window glass 30% opaque", `tests/house-glb.test.js` "uses GlassClear only on Window1-3"; the look is a person check.) The PO asked for "a transparency of 30%"; this was read as 30% opaque. If 30% see-through was meant, change `GLASS_CLEAR_OPACITY` in `src/world/builders/house.js` to 0.7.
- [ ] R-4 The couch, table, chairs and kitchen cabinets show real materials (fabric weave on the couch cushions, wood grain on the table, chairs, cabinet doors and couch legs). The TV, the lamps and their glowing shades keep their flat look. Nothing is blown out against the walls. With `fabric.jpg` or `cabinet.jpg` blocked in the browser, the furniture stays in its kit colours and the place still works. (Auto: `tests/furniture-textures.test.js`, `tests/interior.test.js` "textured furniture"; the look is a person check.)
- [ ] R-7 Four chairs stand round the dining table (two on each long side), face it, block walking, and the inner doorway and the kitchen units stay free. (Auto: `tests/house-layout.test.js` "the dining chairs", `tests/interior.test.js`, `tests/manifest.test.js`.) Chairs and textured furniture go beyond the spec's item list; FR-17 and FR-19 are applied to them.
- [ ] R-10 The TV stands on a wooden desk against the partition wall (not floating, not sunk in it), the TV body and stand are dark grey or black, and the picture still plays on the screen. The desk blocks walking, and the inner doorway stays free. (Auto: `tests/house-layout.test.js` "the TV desk", `tests/furniture-textures.test.js` and `tests/interior.test.js` "the dark TV frame", `tests/manifest.test.js`; the look is a person check.) The desk model `interior/tv-cabinet.glb` (Kenney) has a licence record in `src/data/licences.js`.
- [ ] R-L2 The new textures `textures/fabric.jpg` (ambientCG Fabric 030) and `textures/cabinet.jpg` (ambientCG Wood 049) and the model `interior/chair.glb` (Kenney) have licence records and stay within the budgets. (Auto: `tests/manifest.test.js`, `tests/licences.test.js`, `tests/budget.test.js`.)
- [ ] R-L The new texture `textures/wallpaper.jpg` has its licence record (ambientCG Fabric 036, CC0) and stays within the 1 MB texture budget. (Auto: `tests/manifest.test.js`, `tests/licences.test.js`, `tests/budget.test.js`.)

## Missing items

none

Every interior item has a free model with a recorded licence, and the TV has a clip (`tv-clip`) and a still (`tv-still`). Sourced on 2026-11-09:

- Couch, TV, floor lamp, pendant lamp, dining table and the pieces of the kitchen row: Kenney Furniture Kit 2.0 (CC0).
- TV clip and still: "Delaneys Falls.webm" by Psypherium on Wikimedia Commons (CC0).

The kitchen is a single `kitchen.glb` made from five pieces of the same kit by `scripts/build-kitchen.mjs`.

## Decision (FR-22 and AC-7.12)

Measure with the frame-rate walk (How to measure, step 2). `src/world/interiorConfig.js` holds `TV_MODE`.

| Measurement | Average fps (12 values) |
|---|---|
| `TV_MODE = 'clip'` | ______ |
| `TV_MODE = 'still'` (only if the clip run is below 30) | ______ |

- Clip average at least 30: ship with the clip.
- Clip below 30: set `TV_MODE = 'still'`, rebuild, measure again. AC-4.4 and AC-4.5 then count as met when AC-4.8 and AC-7.2 are met.
- Still below 30 as well: do not merge to `main`. The interior does not go online until a measurement meets 30 fps (AC-7.12).

Decision: ______ . Date: ______ .

## Known open points

- The licence record of `house.glb` in `src/data/licences.js` has a placeholder repository URL (`https://example.invalid/PLACEHOLDER-openfreeyond-repository`). The owner must replace it with the real repository URL and confirm the CC0 dedication of the generated house before going online.
- The couch colour and the interior lighting were judged by eye only (AC-4.3). A person confirms them in the browser.
- The CC0 claim for the TV clip comes from the uploader on Wikimedia Commons. It was not checked any further.
- The calmness of the TV clip was judged only from frame analysis. A person must watch one full loop (AC-4.5).
- The swing space is a square (D-3 of the plan), a superset of the quarter disc that the door sweeps. A person in the far corner is told to step aside although the door would not touch them.
