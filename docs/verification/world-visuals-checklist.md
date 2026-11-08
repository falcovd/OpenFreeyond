# World visuals verification checklist

Test note: laptop used: ______ . Date: ______ . Answer each question yes or no. Quote the question as written.
Do the "per browser" rows in each of: Chrome ___ Firefox ___ Safari ___ (latest version at the time of testing).

Rows marked "Auto" are also covered by a unit test (named in the row). The test proves the data and logic. A person still judges how it looks and feels, unless the row is ticked.

## Automated results (headless Chrome, SwiftShader, 2026-11-08)

Setup: production build (`npm run build`), served with `npx vite preview --port 5188`, headless Chrome with SwiftShader, fresh profile, cache disabled (CDP `Network.setCacheDisabled`). Numbers below are from a re-run after the timing fix and the slimmer models (the first run found the empty-page defect, now fixed).

`vite preview` gzips the JS bundle, so the figures below are compressed transfer. The jpg and glb files are not compressed, here or on GitHub Pages.

| Check | Result |
|---|---|
| AC-12.2 total transfer, start screen to try-out, cover gone | About 2,501,000 B = 2.4 MiB (2.5 MB), measured as 2,443 KiB of encoded data in a cache-disabled run. Before the slimmer models: 4.85 MB. Limit 30 MB. Spec baseline about 2.7 MB. |
| Biggest files now | character.glb 813 KiB; scene js 382 KiB; tree-round.glb 339 KiB; tree-pine.glb 198 KiB; grass.jpg 183 KiB; path.jpg 168 KiB; bush.glb 141 KiB; wood.jpg 101 KiB; brick.jpg 66 KiB. Trees: WebP textures, welded and 16-bit geometry. Character: duplicates removed and welded, materials `Hair`/`Purple` and the `Idle` animation unchanged. Screenshots before and after (pine, round tree, character) look identical. |
| AC-11.2 requests | 22 requests recorded. Every network request goes to the preview origin. Not network requests: 7 `blob:` URLs from the same origin (the page's own decoded textures) and 1 `data:` SVG (A-Frame's built-in fullscreen icon). No other host. |
| AC-9.5 request methods | Only GET. 0 requests with a body. 0 requests with a query string. (Try-out has no typed values; the intake submit was not run here.) |
| AC-9.4 localStorage | Before try-out: no keys. After try-out: one key, `debug=*:error,*:info,*:warn`. A-Frame writes it with its own logging library, not this app. The phase 1 build (commit c05b376, which also uses A-Frame) writes the same single `debug` key after try-out, so this build adds no key beyond phase 1's. Phase 1 keys `openfreeyond.character.v1` and `openfreeyond.hint-seen.v1` are not written by try-out. `tests/privacy.test.js` shows the app code does not touch storage. |
| AC-8.1 Slow 4G (latency 562.5 ms, 168,000 B/s down, 84,000 B/s up), cache disabled | The cover shows from the first sample after the click. After the fix all files finish well inside the limit: cover gone and place on screen together at 17.4 s, no message, no empty sample (every 500 ms). Before the fix the files finished at 30.1 s. |
| AC-8.2 / 30 s limit under Slow 4G | Cover gone at 17.4 s with the place on screen. The margin to 30 s is about 12.6 s (it was 0.1 s). |
| Slower than Slow 4G (100,000 B/s and 50,000 B/s) | Asset downloads stop at 24 s after the click (`ASSET_BUDGET_MS`), the place is built with plain colours and blocks for what is missing, and the cover goes when the place is ready. 100,000 B/s: cover gone and `.world` plus canvas present at 24.8 s, message "Some parts of the place took too long to load." shown. 50,000 B/s: same at 24.4 s. 0 samples with an empty page. Before the fix: cover gone at 30.1 s and an empty page until 34.7 s (100,000 B/s). The 30 s cover timer in `src/main.js` stays as a backstop. |
| AC-12.1 fps | Not measured. SwiftShader fps says nothing about the 30 fps goal. Measure it on the builder's laptop. |
| Console errors | None during the runs. |

Findings against the spec:
- AC-9.4: strictly, one key (`debug`, from A-Frame) is added. The phase 1 build adds the same key, so nothing is added beyond phase 1. It holds no user data.

## Per browser
- [ ] AC-1.1 Look in a full circle and upward: is the sky a blue gradient, lighter at the horizon and deeper overhead? (Auto: `tests/builders-sky-ground.test.js` checks the sky is built; a person judges the look.)
- [ ] AC-1.2 At least one cloud is visible. (Auto: `tests/builders-sky-ground.test.js`.)
- [ ] AC-1.3 At each edge of the place, looking toward the horizon: is any void or empty gap visible between the ground and the sky? (answer must be no)
- [ ] AC-2.1 Does the ground show a grass texture that varies in colour or pattern across the place, not one uniform colour?
- [ ] AC-2.2 From the street, a path to the house door is visible and you can walk on it. (Auto: `tests/layout.test.js` "has a walkable path from the street to the door".)
- [ ] AC-3.1 Count the trees: at least 6, in at least two different shapes. (Auto: `tests/layout.test.js`.)
- [ ] AC-3.2 Does each tree have a trunk and separate foliage, not a plain cylinder and sphere? (Person check: no test uses the real tree structure; `tests/builders-plants.test.js` only checks the builders with a fake model and the real files' headers.)
- [ ] Do the pine and round trees show leaves and bark, with no 'could not be loaded' message? (Tree textures are WebP, OQ-4 update. Confirm in Firefox and Safari too.)
- [ ] AC-3.3 Count: at least 3 bushes, 2 flower beds (not the planter), 1 hedge. (Auto: `tests/layout.test.js`.)
- [ ] AC-3.4 Does a fence look like a fence, with posts and rails or boards? Walk into it: you do not pass. (Auto: `tests/builders-furniture.test.js` and `tests/layout.test.js`.)
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
- [ ] AC-8.1 Chrome "Slow 4G" throttling, start screen, choose try-out: a loading indicator shows and no empty screen. (Auto: `tests/loading.test.js` mocks `mountWorld`, so it proves the cover logic only. The real timing was measured by hand in headless Chrome, above: the cover shows from the first sample and the page is never empty, also at 100,000 and 50,000 B/s. A person confirms in a real browser.)
- [x] AC-8.2 After loading, the indicator is gone. Ticked 2026-11-08: measured by hand in headless Chrome, above (cover gone 1.9 s after the click on a normal connection, 17.4 s at Slow 4G). `tests/loading.test.js` mocks `mountWorld`, so it does not prove the real timing.
- [ ] AC-8.3 Block `grass.jpg` (DevTools, Block request URL): plain colour there and a short message. (Auto: `tests/assetLoader.test.js`, `tests/loading.test.js`.)
- [ ] AC-8.4 Block all `.jpg` and `.glb`: plain colours, plain figure in the character's spot that blocks walking and takes the chosen colours, message shown, indicator gone, no blank screen or crash. (Auto: `tests/assetLoader.test.js`, `tests/buildWorld.test.js`, `tests/builders-figure.test.js`.)
- [ ] AC-8.5 Block `tree-pine.glb`: plain blocks for those trees, you stop at them, message shown. (Auto: `tests/buildWorld.test.js`, `tests/builders-plants.test.js`.)
- [ ] AC-8.6 Stall loading (Offline after the first request): after 30 seconds the indicator is gone, a message shows and the place shows what loaded. (Auto: `tests/assetLoader.test.js`, `tests/loading.test.js`. Measured above at 100,000 and 50,000 B/s: cover gone and place shown at about 24.5 s with the message. A fully offline stall was not run by hand.)
- [ ] AC-9.3 Compare `specs/world-visuals/baseline/furniture.png` with the new bench, table and planter: do they look better?
- [ ] AC-9.4 Application tab, Local Storage before and after 5 minutes: no key added beyond phase 1's. (Auto: `tests/privacy.test.js`. Measured above: only `debug`, written by A-Frame, appears, and the phase 1 build writes it too.)
- [ ] AC-9.5 Network tab during 5 minutes of use, then the phase 1 sent-data check (phase 1 AC-4.5): no request carries a typed or chosen value. (Auto: `tests/privacy.test.js`. Measured above for try-out: only GET, no body, no query string. Still do the intake submit by hand.)
- [ ] AC-11.1 `npx vitest run tests/licences.test.js` passes and you re-read the licence text of each record once. (The test passes in `npm test`. The re-read is a person's job.)
- [x] AC-11.2 Network tab on the live address: every request goes to the product's own address. Ticked for the production build 2026-11-08 (all 22 requests on the preview origin; `tests/privacy.test.js` also forbids outside addresses in the code). Repeat once on the live address after deploy.
- [ ] AC-11.3 On the live address, press the Credits link in the footer of the start screen: every credit a licence requires is listed. (Auto: `tests/credits.test.js`.)
- [ ] AC-11.4 The character's licence is recorded in `src/data/licences.js` with a check date and is usable. If not, the character is replaced before going online. (Auto: `tests/licences.test.js` "records the character".)
- [ ] AC-12.1 Try-out, `?stats` on, trees and clouds moving. Walk a route through the whole place for 2 minutes and note the displayed fps every 10 seconds (12 values). Values: ____ . Average: ____ fps (must be 30 or more). Laptop: ____ .
- [x] AC-12.2 Network tab, "Disable cache" on, load from the start screen through try-out: compressed transfer ____ MB (must be 30 MB or less). Measured 2026-11-08: 2.5 MB (2,443 KiB), see the automated results. Repeat on the live address if you want the GitHub Pages figure. `tests/budget.test.js` also guards the shipped asset size.

## After the place is online
- [ ] AC-10.3 Each independent person tries it for a short session; ask "does the place look like a cozy home?" (1 to 5) and note the number, no name.
- [ ] AC-10.5 At the end of week 4 at least 3 independent ratings are recorded.
- [ ] AC-10.2 At the end of week 4 take your own rating and record it in `specs/world-visuals/decisions.md`. 4 or more means G-1 is met.
