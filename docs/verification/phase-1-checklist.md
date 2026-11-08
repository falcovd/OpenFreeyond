# Phase 1 verification checklist

Test note: laptop used: ______ . Date: ______ .
Do the browser rows in each of: Chrome ___ Firefox ___ Safari ___ (latest version at the time of testing).

## Per browser (NFR-1, AC-1.7)
- [ ] AC-1.1 Movement keys and mouse or trackpad move and turn the view.
- [ ] AC-1.2 Walking into the house, fence, bench, table, planter and trees is blocked.
- [ ] AC-1.3 Walking outward at every edge keeps you inside the place.
- [ ] AC-1.4 The web address loads the place with nothing to install.
- [ ] AC-1.5 Warm light and domestic objects are visible; no threat or timer.
- [ ] AC-1.6 / NFR-2 Open the address with `?stats`. Walk for 2 minutes through the whole place. The average frames per second is 30 or better. Result: ____ fps.

## Once, on the live address
- [ ] AC-3.3 Colours chosen in one browser are not applied in another browser or on another device.
- [ ] AC-4.5 / NFR-3 Open the browser's network tool, submit the intake: no request carries the entered values. Loading the page and its files is allowed.
- [ ] NFR-3 There are no accounts, no analytics requests and no server storage.
- [ ] NFR-4 The README states that no accessibility level is promised.

## Intake and start screen
The checks of AC-3.1 to AC-5.6 are in Task 10 Step 5 of the plan.
