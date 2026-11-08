# World visuals verification checklist

Test note: laptop used: ______ . Date: ______ . Answer each question yes or no. Quote the question as written.
Do the "per browser" rows in each of: Chrome ___ Firefox ___ Safari ___ (latest version at the time of testing).

Rows marked "Auto" are also covered by a unit test (named in the row). The test proves the data and logic. A person still judges how it looks and feels, unless the row is ticked.

## Automated results (headless Chrome, SwiftShader, 2026-11-08)

Setup: production build (`npm run build`), served with `npx vite preview --port 5188`, headless Chrome with SwiftShader, fresh profile, cache disabled (CDP `Network.setCacheDisabled`). Scripts were run once; numbers below are from that run.

`vite preview` gzips the JS bundle (1,467,572 B on disk, 391,500 B on the wire), so the figures below are compressed transfer. Sum of per-file sizes with text files gzipped at level 9 (node zlib): 4,845,948 B, which agrees. The jpg and glb files are not compressed, here or on GitHub Pages.

| Check | Result |
|---|---|
| AC-12.2 total transfer, start screen to try-out, cover gone | 4,851,713 B = 4.63 MiB (4.85 MB); with gzipped text 4,845,948 B. Limit 30 MB. Spec baseline about 2.7 MB. |
| 10 biggest files | character.glb 1,332,491 B; tree-round.glb 1,330,195; tree-pine.glb 1,070,303; scene-B0va1ra2.js 391,500; grass.jpg 187,339; path.jpg 172,031; bush.glb 144,033; wood.jpg 103,508; brick.jpg 67,449; roof.jpg 45,136 |
| AC-11.2 requests | 22 requests recorded. Every network request goes to the preview origin. Not network requests: 7 `blob:` URLs from the same origin (the page's own decoded textures) and 1 `data:` SVG (A-Frame's built-in fullscreen icon). No other host. |
| AC-9.5 request methods | Only GET. 0 requests with a body. 0 requests with a query string. (Try-out has no typed values; the intake submit was not run here.) |
| AC-9.4 localStorage | Before try-out: no keys. After try-out and 30 s of walking: one key, `debug`. That key is written by A-Frame's own logging library, not by this app. Phase 1 keys `openfreeyond.character.v1` and `openfreeyond.hint-seen.v1` were not written in this run (try-out does not save a character; the hint was not dismissed). `tests/privacy.test.js` shows the app code does not touch storage. |
| AC-8.1 Slow 4G (latency 562.5 ms, 168,000 B/s down, 84,000 B/s up), cache disabled | The loading cover was present in the first sample after the click (9 to 16 ms) and in every sample every 500 ms until it went. The page was never blank during those samples. |
| AC-8.2 / 30 s limit under Slow 4G | Cover gone after 30.2 s to 30.4 s in three runs. All files finished at 30.1 s (the last three big files: tree-pine at 27.0 s, tree-round at 30.1 s, character at 30.1 s). The place showed with no "took too long" message, so the load finished just inside the 30 s limit. The margin is about 0.1 s. |
| Slower than Slow 4G (100,000 B/s, extra run) | Finding: the cover goes at 30.1 s, and the screen is then empty (no text, no scene) until 34.7 s, when the place appears with the message "Some parts of the place took too long to load. Plain colours and shapes are shown where they are missing." So after the 30 s cover limit (FR-15) the person sees an empty page for about 4.6 s in this run. `src/main.js` removes the cover at 30 s, but `mountWorld` adds the scene only after `loadAssets` resolves, and the build and render run after that. SwiftShader makes the build step slower than on a real GPU, so the length of the gap on the builder's laptop is not known. |
| AC-12.1 fps | Not measured. SwiftShader fps says nothing about the 30 fps goal. Measure it on the builder's laptop. |
| Console errors | None during the runs. |

Findings against the spec:
- AC-8.1 and FR-15: on a connection slower than Slow 4G the page is empty for a few seconds after the cover goes. At exactly Slow 4G the load finishes at about 30 s, so the margin is thin.
- AC-9.4: strictly, one key (`debug`, from A-Frame) is added. It holds no user data.

## Per browser
- [ ] AC-1.1 Look in a full circle and upward: is the sky a blue gradient, lighter at the horizon and deeper overhead? (Auto: `tests/builders-sky-ground.test.js` checks the sky is built; a person judges the look.)
- [ ] AC-1.2 At least one cloud is visible. (Auto: `tests/builders-sky-ground.test.js`.)
- [ ] AC-1.3 At each edge of the place, looking toward the horizon: is any void or empty gap visible between the ground and the sky? (answer must be no)
- [ ] AC-2.1 Does the ground show a grass texture that varies in colour or pattern across the place, not one uniform colour?
- [ ] AC-2.2 From the street, a path to the house door is visible and you can walk on it. (Auto: `tests/layout.test.js` "has a walkable path from the street to the door".)
- [ ] AC-3.1 Count the trees: at least 6, in at least two different shapes. (Auto: `tests/layout.test.js`.)
- [ ] AC-3.2 Does each tree have a trunk and separate foliage, not a plain cylinder and sphere? (Auto: `tests/builders-plants.test.js`.)
- [ ] AC-3.3 Count: at least 3 bushes, 2 flower beds (not the planter), 1 hedge. (Auto: `tests/layout.test.js`.)
- [ ] AC-3.4 Does a fence look like a fence, with posts and rails or boards? Walk into it: you do not pass. (Auto: `tests/builders-plants.test.js` and `tests/layout.test.js`.)
- [ ] AC-4.1 Facing the door: textured walls, one door, at least 4 windows, a sloped roof with a visible texture. (Auto: `tests/builders-house.test.js`.)
- [ ] AC-4.2 Walk into the house: you do not pass and cannot enter. (Auto: `tests/layout.test.js`.)
- [ ] AC-4.4 Walk to the character: reachable, outside the house, same spot each time. (Auto: `tests/layout.test.js`.)
- [ ] AC-4.5 Walk into each solid (house, trees, hedge, fences, bushes, bench, table, planter, character) and into each part of the boundary: you stop at each. (Auto: `tests/layout.test.js` and `tests/collision.test.js`.)
- [ ] AC-4.7 Walk into a flower bed: you walk over it. (Auto: `tests/layout.test.js`.)
- [ ] AC-5.1 View the character from the start and from 2 m away: does the character look at home in this world?
- [ ] AC-6.1 Does the place look warm rather than cold or dull?
- [ ] AC-7.1 Watch the trees for 10 seconds: do they move, and is the movement calm and not distracting? (Auto: `tests/buildWorld.test.js` checks the motion functions exist.)
- [ ] AC-7.2 Watch the sky for 30 seconds: do the clouds drift, and is the movement calm and not distracting? (Auto: `tests/buildWorld.test.js`.)
- [ ] AC-9.1 Phase 1 checks AC-1.1 to AC-1.5 and AC-1.8 pass (without the frame-rate check AC-1.6 in Firefox and Safari).
- [ ] AC-9.2 Phase 1 checks AC-2.1 to AC-5.6 (character, colours, intake, start screen, unsupported browser) pass with the new look.

## Once, in Chrome
- [x] AC-4.3 `npx vitest run tests/layout.test.js` passes (walkable area at least phase 1's, boundary the same). Ticked 2026-11-08: the test passes in `npm test`.
- [x] AC-4.6 `HOUSE` in `src/world/layout.js`: footprint at most 10 by 8 m, one or two floors. Ticked 2026-11-08: `tests/layout.test.js` "has a footprint of at most 10 by 8 m and one or two floors" passes.
- [ ] AC-8.1 Chrome "Slow 4G" throttling, start screen, choose try-out: a loading indicator shows and no empty screen. (Auto: `tests/loading.test.js`. Measured above: the cover shows from the first sample and the page is never empty at Slow 4G. Open finding: an empty page for about 4.6 s after the cover goes when the network is slower than Slow 4G. A person confirms in a real browser.)
- [x] AC-8.2 After loading, the indicator is gone. Ticked 2026-11-08: measured above (cover gone 1.6 s after the click on a normal connection, about 30 s at Slow 4G); `tests/loading.test.js`.
- [ ] AC-8.3 Block `grass.jpg` (DevTools, Block request URL): plain colour there and a short message. (Auto: `tests/assetLoader.test.js`, `tests/loading.test.js`.)
- [ ] AC-8.4 Block all `.jpg` and `.glb`: plain colours, plain figure in the character's spot that blocks walking and takes the chosen colours, message shown, indicator gone, no blank screen or crash. (Auto: `tests/assetLoader.test.js`, `tests/buildWorld.test.js`, `tests/builders-figure.test.js`.)
- [ ] AC-8.5 Block `tree-pine.glb`: plain blocks for those trees, you stop at them, message shown. (Auto: `tests/buildWorld.test.js`, `tests/builders-plants.test.js`.)
- [ ] AC-8.6 Stall loading (Offline after the first request): after 30 seconds the indicator is gone, a message shows and the place shows what loaded. (Auto: `tests/assetLoader.test.js`, `tests/loading.test.js`. See the empty-page finding above: check what you see at 30 seconds.)
- [ ] AC-9.3 Compare `specs/world-visuals/baseline/furniture.png` with the new bench, table and planter: do they look better?
- [ ] AC-9.4 Application tab, Local Storage before and after 5 minutes: no key added beyond phase 1's. (Auto: `tests/privacy.test.js`. Measured above: only `debug`, written by A-Frame, appears. Decide whether that counts.)
- [ ] AC-9.5 Network tab during 5 minutes of use, then the phase 1 sent-data check (phase 1 AC-4.5): no request carries a typed or chosen value. (Auto: `tests/privacy.test.js`. Measured above for try-out: only GET, no body, no query string. Still do the intake submit by hand.)
- [ ] AC-11.1 `npx vitest run tests/licences.test.js` passes and you re-read the licence text of each record once. (The test passes in `npm test`. The re-read is a person's job.)
- [x] AC-11.2 Network tab on the live address: every request goes to the product's own address. Ticked for the production build 2026-11-08 (all 22 requests on the preview origin; `tests/privacy.test.js` also forbids outside addresses in the code). Repeat once on the live address after deploy.
- [ ] AC-11.3 On the live address, press Credits: every credit a licence requires is listed. (Auto: `tests/credits.test.js`.)
- [ ] AC-11.4 The character's licence is recorded in `src/data/licences.js` with a check date and is usable. If not, the character is replaced before going online. (Auto: `tests/licences.test.js` "records the character".)
- [ ] AC-12.1 Try-out, `?stats` on, trees and clouds moving. Walk a route through the whole place for 2 minutes and note the displayed fps every 10 seconds (12 values). Values: ____ . Average: ____ fps (must be 30 or more). Laptop: ____ .
- [x] AC-12.2 Network tab, "Disable cache" on, load from the start screen through try-out: compressed transfer ____ MB (must be 30 MB or less). Measured 2026-11-08: 4.85 MB (4,851,713 B), see the automated results. Repeat on the live address if you want the GitHub Pages figure. `tests/budget.test.js` also guards the shipped asset size.

## After the place is online
- [ ] AC-10.3 Each independent person tries it for a short session; ask "does the place look like a cozy home?" (1 to 5) and note the number, no name.
- [ ] AC-10.5 At the end of week 4 at least 3 independent ratings are recorded.
- [ ] AC-10.2 At the end of week 4 take your own rating and record it in `specs/world-visuals/decisions.md`. 4 or more means G-1 is met.
