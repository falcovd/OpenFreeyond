# Phase 1 verification checklist

Test note: laptop used: ______ . Date: ______ .
Do the browser rows in each of: Chrome ___ Firefox ___ Safari ___ (latest version at the time of testing).

## Per browser (NFR-1, AC-1.7)
- [ ] AC-1.1 Movement keys and mouse or trackpad move and turn the view.
- [ ] AC-1.2 Walking into the house, fence, bench, table, planter and trees is blocked.
- [ ] AC-1.3 Walking outward at every edge keeps you inside the place.
- [ ] AC-1.4 The web address loads the place with nothing to install.
- [ ] FR-4 / AC-1.5 The light is warm and the place is readable (not dim). Domestic objects are visible. There are no timers and nothing threatening.
- [ ] AC-1.8 On first entry a controls hint shows once. Dismiss it, reload and enter again: it stays gone.
- [ ] FR-6 / AC-2.1 The character is visible, upright, a sensible size and faces the spawn point. The idle movement is visible. It is not clipped or culled when you turn around.
- [ ] AC-2.2 Walk away from the character and come back: it starts in the same spot on every visit (reload and enter again).
- [ ] The character walks to different places, going around the house, trees and fences, and stands still for a few seconds between walks. (Auto/agent note: in a 60 s run in headless Chrome with software rendering and the player parked in a far corner, he alternated walk and idle, travelled 42.2 m through 43 distinct spots, and was never inside a solid or outside the garden, checked against the real layout with his body radius 0.5. A person still judges how it looks.)
- [ ] Walk up to the character: he stops, turns to face you and stands (idle). Walk away: he wanders again. (Auto/agent note: with the player 1.8 m away he switched to greet and faced the player, heading error 0 rad; after the player left he went back to wandering. Checked in headless Chrome. Not checked in Firefox or Safari.)
- [ ] You cannot walk through the character while he walks, and he does not walk into you. (Auto/agent note: his collision solid always matched his position during the 60 s run. Not tried with a person walking into him.)
- [ ] FR-7 / AC-3.1 All 8 hair and all 8 clothing colours look visibly distinct on the model. Check again after Continue in a new session.
- [ ] AC-1.6 / NFR-2 Open the address with `?stats`. Walk for 2 minutes through the whole place. The average frames per second is 30 or better. Result: ____ fps.

## Once, on the live address
- [ ] AC-3.3 Colours chosen in one browser are not applied in another browser or on another device.
- [ ] AC-4.5 / NFR-3 Open the browser's network tool, submit the intake: no request carries the entered values. Loading the page and its files is allowed.
- [ ] NFR-3 There are no accounts, no analytics requests and no server storage.
- [ ] NFR-4 The README states that no accessibility level is promised.

## Intake and start screen
- [ ] AC-4.1 A valid intake with all seven fields enters the place with your character.
- [ ] AC-4.2 An empty field is named and entry is blocked.
- [ ] AC-4.3 Age 17 and then 501 characters of text: each time the field is named and entry is blocked.
- [ ] AC-3.2 / AC-4.4 Reload and choose Continue: the same colours and the earlier answers show.
- [ ] AC-4.6 Set `localStorage['openfreeyond.character.v1']` to `{broken` and reload: the example character loads with a message.
- [ ] AC-4.7 With storage blocked (private window or blocked site data), finish the intake: a "Nothing will be kept" message shows and the place still loads.
- [ ] AC-5.1 Try-out from the start screen loads the example character with no account or personal details.
- [ ] AC-5.2 In the try-out it is the example character and no colour choice is offered.
- [ ] AC-5.3 With kept answers the start screen offers Continue, Make a new character and Try-out.
- [ ] AC-5.4 Try-out, then Back to start: Continue still shows your colours and answers.
- [ ] AC-5.5 Make a new character shows a confirmation: No keeps the old answers; Yes and finishing the form replaces them.
- [ ] AC-5.6 In an unsupported browser the message names the supported browsers.
- [ ] Regression (page scrolling) Enter the try-out, press Back, choose Make a new character, scroll down to the Enter the place button. The page scrolls.
