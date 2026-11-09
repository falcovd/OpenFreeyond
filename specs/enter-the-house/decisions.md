# Decision log: an enterable house

## Intake (PO answers, 2026-11-09)

- Problem: the house is a closed box, so the place feels unfinished.
- Door click distance: only when near the door; the distance is 2 metres.
- Door state on arrival: closed on every visit, nothing remembered.
- Door motion: it swings, in about 1 second.
- Door in the way: the door does not close while a person stands in the doorway.
- Character: stays in the garden and never goes into the house.
- Success measure: a checklist only (yes or no for each item), no rating.
- Lights: the lights give a warm glow in the rooms.
- Assets: free models with a recorded, usable licence. Plain blocks stand in if one fails to load.
- TV: shows a calm looping nature scene.
- Limits: 30 frames per second in Chrome on the builder's laptop is kept; the first-visit download may grow, with a limit of 100 MB.
- House: enlarge it within the existing limit of 10 by 8 m.
- Layout of the main floor: separate rooms (a living room and a kitchen, with a doorway between them).
- Folder: specs/enter-the-house/.
- Derived from the request, not asked: the door toggles on a click, the person can enter when it is open, one floor accessible, no stairs.
- Taken from the existing specs, marked as assumptions for the PO to confirm: a click means press and release without dragging (A-1), furniture and inside walls are solid (A-3), no sound from the TV (A-6).
- Not asked, for the PO to confirm: the door can be clicked from inside as well (A-2).

## Critique round 1 (feature document)

Findings: 4 Must, 11 Should, 3 Could. All decided.

### Must

- Goals G-1 and G-2 only restate the requirements and have no outside check: **rejected.** Reason: the PO chose "checklist only" at intake and confirmed it. The document now says plainly that only the builder judges the goals.
- The 100 MB limit against the 30 MB limit, and no reason given: **accepted.** Decision: 100 MB replaces the 30 MB limit of the world-visuals spec. Reason: the interior models and the TV clip need room. Written into G-4.
- The walkable-area rule against a larger house: **accepted, decided twice.** First answer: keep the garden as large. Then the measurement showed only 4.1 m² of spare walkable room (448.6 m² today against 444.5 m² in phase 1), so a larger house takes space from the garden. Final decision: allow a larger place, so the garden keeps its size. This changes the old rule that the boundary stays as it is. Written into R-10.
- Status section missing: **accepted.** Decision: go, owner Falco van Dooremolen, date 2026-11-09.

### Should

- Where the 2 metres is measured, and clicking through a wall: **accepted.** Defined as a straight line from the person to the door; a person can only click what they see (R-2).
- Clicks during the swing and double clicks: **accepted.** Clicks during the swing are ignored; the door counts as open only when fully open (R-4, R-21).
- "In the doorway" is not defined: **accepted.** The opening plus the space the door swings through (R-7).
- Untestable wording ("about 1 second", "calm"): **accepted.** The swing takes between 0.5 and 2 seconds (R-3). Calm means slow, looping, with no flashes or sudden brightness changes (R-12).
- Discoverability of the door: **accepted.** A short hint within 2 metres of the door (R-20).
- "At least two rooms", "comfortably" and the doorway width: **accepted.** Rooms at least 3.5 by 3.5 m, doorways at least 1.2 m wide and 2 m high (R-9, R-10, A-8). The 2 m height came from the option text; the PO confirmed it on 2026-11-09.
- The TV clip format, size and autoplay: **accepted.** At most 60 seconds and 30 MB; a still picture shows if playing is blocked or fails (R-12).
- No fallback if no free assets are found, and risks "addressed by" rules that do not reduce them: **accepted.** Plain blocks are acceptable and the feature still ships (R-18). The risk list was rewritten to say who handles each risk.
- Credit line has no place to show: **accepted.** In the existing Credits list (R-18).
- Frame-rate target with no action when missed: **accepted.** The TV picture is dropped first (R-22).
- The character's greeting with walls and a doorway: **accepted.** By distance only, as today, also through walls (R-8).
- R-15 open-ended, and the exterior and upper floor only in assumptions: **accepted.** R-15 is now a named list. The exterior keeps two storeys and a plain ceiling inside (R-13, former A-5).
- The evidence is only the builder's observation: **accepted.** Stated plainly in the Problem Statement as the PO's decision.

### Could

- Evidence labels, and requirements that name verification methods: **accepted.** Verification methods moved into the goal metrics; evidence labels tidied.
- Where the credit line shows: **accepted** (see above, R-18).
- "Other doors" is unclear: **accepted.** Only the front door opens; every other opening stays part of the wall (Out of Scope).

## Approval of the feature document (PO, 2026-11-09)

- The feature document and the decision log are approved after critique round 1. No second critique round: no Must finding is open and the PO decided every finding.
- The PO confirmed the doorway height of 2 m.

## Critique round 1 (PRD)

Findings: 0 Must, 6 Should, 4 Could. All handled. The PRD and the feature document were changed together, so they stay the same.

### Decided by the PO

- Where the dining table stands: in the kitchen (R-9). The open question is closed.
- R-12 (moving picture) against R-22 (still picture): R-22 wins. It is decided before the interior goes online, from the builder's measurement; nothing switches at run time. A still picture then counts as meeting R-12.
- A click while a person is in the doorway: the click is ignored, and a short message tells the person to step out of the way (R-7).
- Opening while a person is in the space the door swings through: the door does not open, with the same rule and message as for closing (R-7 now covers opening and closing).
- Privacy ("nothing about the door or a person is stored or sent"): its own requirement, R-23, with a checklist.
- Accessibility ("no level promised, keyboard and mouse, desktop"): an assumption, A-9, as for the rest of the product.
- Users (a visitor, and the builder who is also the PO): kept, and "the builder and the PO are the same person" is assumption A-10. (The questions named these A-10 and A-11; the numbers moved up one because privacy became a requirement, not an assumption.)

### Fixed by the agent, shown to the PO at the approval

- R-20: the hint shows while the door is in view and the person is within 2 metres, is one short sentence, and goes away when the door is out of view or the person is more than 2 metres away.
- R-11 says "in the house".
- "Looks as today" (R-13) is defined: the same wall, roof and door textures, the door on the garden side, two storeys and the upper windows. The size grows (R-10).
- "As before" (R-15) is defined: the spawn point and the character's start spot keep their roles but their coordinates may change.
- R-1 now refers to the exceptions of R-7.
- Traceability: R-15 joined the G-1 metric, R-18 the G-2 metric, and R-19 now covers R-15, R-18, R-20 to R-23. R-22 is checked by its checklist.
- "Named in the test note" became "the builder names the laptop when writing down the measurement".
- The PRD refers to the feature document for the evidence of each requirement. "Through the doorway" is back in R-4, and the measured scope is back in G-4. Requirements appear in ID order, and R-6 is no longer repeated.
- A note says A-4 and A-5 of an earlier draft became R-18 and R-13, and their numbers are not used again.

## Approval of the PRD (PO, 2026-11-09)

- The PRD is approved after one critique round. The PO decided every finding.

## Spec (Phase 3)

Quality decisions asked before writing the spec (PO, 2026-11-09):

- Loading: the garden first, the interior may follow. The place is ready within 30 seconds as today (FR-20). The interior may keep loading, and plain blocks stand in until each file arrives.
- Click reaction: the door starts to move within 0.5 seconds (NFR-4).
- Browsers: the door, entering and the interior must work in Chrome, Firefox and Safari. Only the frame-rate target is Chrome-only (NFR-5).
- House model fails to load: a plain closed block that cannot be entered, with a message (FR-21).

Numbering in the spec (the contract wants IDs from 1 without gaps in the first version):

- User stories US-1 to US-8, functional requirements FR-1 to FR-22, non-functional requirements NFR-1 to NFR-6, acceptance criteria AC-n.m by story, assumptions A-1 to A-8, open questions OQ-1 to OQ-3.
- Requirements of the feature document and PRD map to the spec as follows: R-1, R-2, R-3, R-5, R-6 to FR-1, FR-2, FR-3, FR-5, FR-6 (R-4 to FR-4, R-7 to FR-7, R-20 to FR-8, R-21 to FR-9, R-8 to FR-10, R-9 to FR-11, R-10 to FR-12 and FR-13, R-11 to FR-14, R-12 to FR-15, R-13 to FR-16, R-14 to FR-17, R-15 to FR-18, R-18 to FR-19, R-22 to FR-22). R-16, R-17, R-23 and the accessibility assumption became NFR-1, NFR-2, NFR-3 and NFR-6. R-19 is the acceptance criteria themselves. FR-20 and FR-21 and NFR-4 and NFR-5 come from the quality decisions above.
- Assumptions of the PRD map to the spec as follows: A-1, A-2, A-3 stay A-1, A-2, A-3. A-6 became A-4, A-7 became A-5, A-8 became A-6, A-9 became A-7, A-10 became A-8.

## Critique round 1 (spec)

Findings: 2 Must, 9 Should, 5 Could. All handled. The feature document, the PRD and the spec were changed together, so the three stay the same. This also puts the four quality decisions that were first made at the spec step into the PRD source (R-25 to R-28).

### Decided by the PO

- If the TV is only a still picture and the walk still misses 30 frames per second: the interior does not go online until the target is met. 30 frames per second is a hard gate (R-22, FR-22, AC-7.12).
- The hint shows only while a click works: the door at rest, in view, within range, and nobody in the doorway (R-20, FR-8, AC-3.1, AC-3.2).
- The front door swings outward, into the garden (R-3, FR-3, AC-1.10). The swing space is therefore in the garden, in front of the door.
- The front door opens into the living room (R-9, FR-11, AC-4.1).
- Click distance raised from 2 to 3 metres, because the outward swing leaves only a band of about 1.2 to 2 metres where a click would work. This changes the earlier decision of 2 metres. It is used for the click (R-1, FR-1, AC-1.x) and for the hint (R-20, FR-8).
- The download measurement is read with the person standing inside the house, once no new file has arrived for 10 seconds (R-17, NFR-2, AC-7.3).
- All nine fixes proposed by the agent (below) were accepted.

### Fixed by the agent and accepted by the PO

- [Must] A single interior model that fails had a criterion (AC-7.10) but no requirement: new R-24 and FR-23, with a plain block (a still picture for the TV) and a load message. The two messages now have separate names: the step-aside message and the load message.
- [Must] FR-22 and AC-4.4, AC-4.5 contradicted each other when the TV is a still picture: AC-4.4 and AC-4.5 now say they apply when FR-22 does not apply; a new AC-4.8 covers the still picture; G-2 says how they count. FR-22 keeps the word "first".
- [Should] FR-20 and AC-7.7 were stricter than the world-visuals spec presented as unchanged: reworded as "the indicator goes within 30 seconds and the garden, including the outside of the house, is shown with whatever has loaded". Interior files are not subject to the 30-second failure rule. The dependency list names the world-visuals lines this touches (FR-15, FR-16, AC-8.6, NFR-2, AC-12.2, G-3).
- [Should] "Any part of the person": a person's footprint is a circle of 0.3 m radius (assumption A-9 in the spec, A-11 in the feature document and PRD). The swing space is defined and tied to the outward swing.
- [Should] FR-8 against FR-7 and FR-9: settled by the PO decision above.
- [Should] G-1 and G-2 against the acceptance criteria: both list their criteria by ID, and G-3 and G-4 list theirs.
- [Should] NFR-2 and AC-7.3 had no stopping point: settled by the PO decision above.
- [Should] FR-12 and AC-2.6: width at least 5.5 m, depth at least 4.5 m, larger in at least one, fitting in a box of 10 by 8 m in either direction.
- [Should] "In view" and the distance: the door, or part of it, visible and not hidden; the distance is to the nearest point of the door.
- [Should] AC-1.6 and AC-1.7: timed on a screen recording. "Within reach" replaced by "within 3 metres with the door in view".
- [Should] "Try-out" and "test note" are now defined in the spec.
- [Could] US-5 says "the same style as before". A swinging door stops a person who walks into it, and its swing is not stopped or reversed (FR-4, AC-2.3). The browser versions are recorded in the test note, and Safari access is assumption A-10 in the spec (A-12 in the feature document and PRD). The dependency list now includes AC-12.2 and G-3 of the world-visuals spec. AC-3.3 says what the message says. The question which room the front door opens into is settled by the PO decision above.

### Numbering note

- The feature document and the PRD now have R-1 to R-28 and the same assumption numbers as before, plus A-11 (footprint) and A-12 (Safari). The spec has FR-1 to FR-23, NFR-1 to NFR-6 and A-1 to A-10, with A-9 (footprint) and A-10 (Safari). R-24 to FR-23, R-25 to FR-20, R-26 to FR-21, R-27 to NFR-4, R-28 to NFR-5.

## Approval of the spec (PO, 2026-11-09)
- The spec is approved after one critique round. The PO decided every product finding. The three open questions are technical and stay with the team (OQ-1, OQ-2, OQ-3).
- The spec is ready for refinement with the team. Approving the scope happens after that refinement and is the PO's decision.
