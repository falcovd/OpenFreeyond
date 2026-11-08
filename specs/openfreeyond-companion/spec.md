# OpenFreeyond: Spec

## Definitions
- Place: the cozy, homely 3D area a person walks around in.
- Cozy, homely: warm light and colours, domestic objects such as furniture and a garden, calm, no threats or timers.
- Visibly present: the character is rendered in the place and shows an idle animation, a repeating small body movement.
- Example character: the fictional character with fixed example data, shown in the try-out.
- Intake fields: name, age, appearance (one hair colour and one clothing colour), character, hobbies and favourite things, background story, voice choice, living environment.
- Persona-matching: an adult who plays relaxed or story-like games on a desktop or laptop. The builder checks these three points with a person before the interview.
- Independent person: a persona-matching person who is not the builder.
- Own browser: the same browser profile on the same device. Clearing site data or private browsing removes what is kept there.
- Supported browsers: the latest version at the time of testing of Chrome, Firefox and Safari, on a laptop.
- Outside the product: done by the builder on paper, in notes or in the discovery evidence folder, not inside the place.

## Goal and Success Criteria
The feature gives a person a cozy place to walk around in, with a character who lives there, that they can make their own. Phase 1 only.
- G-1: The builder can spend relaxed time in a personal, cozy place that feels like theirs. Success: at least 1 relaxing session per week for 4 weeks, and a "feels like mine" self-rating of 4 or more on a 1 to 5 scale, within 4 weeks after phase 1 is online. Baseline 0. Measured by the builder's own notes (self-report), outside the product.
- G-2: Learn whether people other than the builder want this. Success: at least 3 independent people interviewed after trying the place, and at least two thirds of them say they would try it (for example 2 of 3, 3 of 4, 4 of 5), before phase 2 starts. Baseline 0.
- Goal links: US-1, US-2 and US-5 serve G-1 and G-2; US-3, US-4 and US-7 serve G-1; US-6 serves G-2.

## User Stories
- US-1: As a person who opens the place, I want to walk around and explore a cozy, homely place in my desktop browser, so that I can relax in it without installing anything.
- US-2: As a person in the place, I want to see a fictional human character who is visibly present, so that the place does not feel empty.
- US-3: As a person, I want to choose the colours of the character's hair and clothing, so that the character feels like mine.
- US-4: As a person, I want to fill in the seven intake fields and have them kept for my next visit, so that the character is mine and ready for later phases.
- US-5: As a first-time or returning visitor, I want to try the place without an account or personal details, or continue with my own character, so that I can judge it quickly or pick up where I left off.
- US-6: As the builder, I want to learn what at least 3 independent people think after they try the place, so that I know whether others want it.
- US-7: As the builder, I want to record my relaxing sessions and my "feels like mine" rating, so that I know whether G-1 is met.

## Functional Requirements
- FR-1: A person can move on the ground in every direction and look around using the keyboard and mouse or trackpad. Story: US-1.
- FR-2: Solid objects block walking, and a person cannot leave the place. Story: US-1.
- FR-3: The place is reachable through a web address and works without installing anything. Story: US-1.
- FR-4: The place shows warm light and colours and domestic objects (furniture and a garden), and shows no threats or timers. Story: US-1.
- FR-5: The first time a person enters the place, a short controls hint shows how to move and look, for keyboard and mouse and for trackpad; the person can dismiss it. Story: US-1.
- FR-6: The character starts in a fixed spot in the place, wanders through the place with a walking animation, shows an idle animation when he stands, and stops, faces a person who comes close and waves once at them (once for each approach). Story: US-2.
- FR-7: In the intake a person chooses one hair colour from a fixed set of 8 and one clothing colour from a fixed set of 8, and the character in the place shows the chosen colours. Story: US-3.
- FR-8: A person can fill in the seven intake fields. All seven are required. Name, character, hobbies and background story are text of up to 500 characters. Age is a whole number from 18 to 120. Voice is one of 3 choices. Living environment is the one choice offered, a house with a garden on a cozy street. A person who leaves a field empty or out of range is told which field and does not enter the place. Story: US-4.
- FR-9: The intake answers, including the colours, are kept between visits in the person's own browser. In phase 1 only the appearance field changes what is shown in the place. Story: US-4.
- FR-10: The start screen always offers a try-out that loads the example character, without an account and without personal details. Story: US-5.
- FR-11: If an intake is kept in the person's own browser, the start screen offers three options: continue with that character, make a new character, or try-out. Making a new character replaces the kept one only after the person confirms. Story: US-5.
- FR-12: The try-out never changes or removes kept intake answers, and the example character cannot be changed in the try-out. Story: US-5.
- FR-13: Anyone who opens the place can use the try-out or the intake; the app does not tell the builder from a visitor. Story: US-5.
- FR-14: Outside the product, before each interview the builder confirms the person is persona-matching and not the builder, shares the try-out with them, and interviews them afterwards with the discovery interview guide, asking whether they would try it (yes, no or unsure). Story: US-6.
- FR-15: Outside the product, the builder keeps anonymized interview notes without names in the discovery evidence folder, and a tally of independent people interviewed and yes answers. Story: US-6.
- FR-16: Outside the product, the builder notes each relaxing session in the place and a "feels like mine" rating from 1 to 5, at least once per week for 4 weeks. Story: US-7.

## Non-Functional Requirements
- NFR-1: The place works in the supported browsers. Goal: G-1.
- NFR-2: Walking in the place averages 30 frames per second or better over a 2-minute walk through the place, measured with the browser's built-in frame-rate display, in each supported browser on the builder's own laptop, which the builder names in the test note. Below that counts as a failure of FR-1. Story: US-1.
- NFR-3: Nothing a person types or chooses leaves that person's own browser. There are no accounts, no analytics and no server storage in phase 1. Loading the place and its files from its web address does not count as data leaving the browser. Interview notes contain no names. Goal: G-2.
- NFR-4: No accessibility level is promised in phase 1; keyboard and mouse or trackpad only. This is a known limitation. Goal: G-1.
- NFR-5: Kept data is "broken" when it fails any intake rule in FR-8. If kept data is missing or broken, the example character loads and a message says what happened. If the browser cannot keep data (for example private browsing), the person is told, and the place still works for that visit without keeping anything. If the browser is unsupported, a message names the supported browsers. The app never shows a blank screen or a crash in these cases. Goal: G-1.

## Acceptance Criteria
- AC-1.1: Given the place has loaded, when a person uses the movement controls shown in the hint and moves the mouse or trackpad, then the person moves forward, backward and sideways and the view turns.
- AC-1.2: Given a person stands next to a solid object, when the person walks into it, then the person does not pass through it.
- AC-1.3: Given a person stands at the edge of the place, when the person keeps walking outward, then the person stays inside the place.
- AC-1.4: Given a supported browser, when a person opens the web address, then the place loads without anything to install.
- AC-1.5: Given the place has loaded, when a person looks around, then warm light and domestic objects are visible and no threat or timer is shown.
- AC-1.6: Given the builder's own laptop and a supported browser, when the builder walks through the place for 2 minutes with the frame-rate display on, then the average is 30 frames per second or better.
- AC-1.7: Given each of the supported browsers, when the builder performs AC-1.1 to AC-1.5, then each passes in that browser.
- AC-1.8: Given a person enters the place for the first time, when the place loads, then a controls hint is shown that can be dismissed, and it is not shown again after it was dismissed in the same browser.
- AC-2.1: Given the place has loaded, when a person looks at the character's spot, then the character is visible and upright, and a repeating body movement plays (idle when he stands, walking when he moves).
- AC-2.2: Given the place has loaded, when a person walks away and returns, then the character starts in the same spot on every visit.
- AC-3.1: Given the colour choice in the intake, when a person picks a hair colour and a clothing colour from the sets, then the character in the place shows those colours.
- AC-3.2: Given a person has chosen colours, when the person closes the browser and opens the place again in the same browser and continues, then the character shows the same colours.
- AC-3.3: Given a person opens the place in another browser or on another device, when it loads, then the colours chosen elsewhere are not applied.
- AC-4.1: Given the intake is open, when a person fills in all seven fields with valid values and confirms, then the person enters the place with their character.
- AC-4.2: Given the intake is open, when a person leaves a field empty and confirms, then the person is told which field is missing and does not enter the place.
- AC-4.3: Given the intake is open, when a person enters an age that is not a whole number from 18 to 120 or text longer than 500 characters, then the person is told which field is invalid and does not enter the place.
- AC-4.4: Given a person has filled in the intake, when the person opens the place again in the same browser and continues, then the earlier answers are shown.
- AC-4.5: Given a person submits the intake with a browser network tool open, when the form is submitted, then no request carries the entered values.
- AC-4.6: Given kept intake data is missing or broken, when the place loads, then the example character loads and a message says what happened.
- AC-4.7: Given the browser cannot keep data, when a person completes the intake, then the person is told that nothing will be kept and the place still loads with their character for that visit.
- AC-5.1: Given the start screen is shown, when a first-time visitor chooses the try-out, then the place loads with the example character without any account or personal details.
- AC-5.2: Given a visitor is in the try-out, when the visitor looks at the character, then it is the example character, not a kept character, and no colour choice is offered.
- AC-5.3: Given intake answers are kept in the person's own browser, when the person opens the place, then the start screen offers continue, make a new character, and try-out.
- AC-5.4: Given intake answers are kept, when the person chooses the try-out and returns to the start screen, then the kept answers are unchanged.
- AC-5.5: Given intake answers are kept, when the person chooses to make a new character and confirms the replacement, then the old answers are replaced; when the person does not confirm, then the old answers remain.
- AC-5.6: Given an unsupported browser, when a person opens the place, then a message names the supported browsers.
- AC-6.1: Given a person who is not the builder and who meets the three persona-matching points, when the builder has shared the try-out and the person has tried it, then the builder interviews them and notes yes, no or unsure without a name.
- AC-6.2: Given 3 or more independent people have been interviewed, when the builder counts the yes answers, then the tally shows whether at least two thirds said yes.
- AC-6.3: Given fewer than 3 independent people have been interviewed, when the builder looks at the tally, then G-2 is noted as not yet met.
- AC-6.4: Given interview notes exist, when anyone reads them, then no name appears in them.
- AC-7.1: Given 4 weeks have passed after phase 1 is online, when the builder reviews the notes, then the notes show the sessions per week and the "feels like mine" ratings, so that G-1 can be judged as met or not met.

## Out of Scope
- Photorealistic faces, and characters modelled on real people.
- Real accounts and server-side storage in phase 1.
- Multiplayer.
- Mobile support.
- VR testing (no headset available; VR is an optional later phase).
- Personalizing the place, house or garden.
- Unlimited spending on voice or language model.
- Spoken conversation with the character (PRD R-6): phase 2, not approved, to be confirmed before it is specified.
- Accessibility beyond keyboard and mouse or trackpad in phase 1.
- An in-product feedback form, an in-product interview tally, and in-product analytics or session counting.
- More than one living environment, and changing the example character.

## Assumptions
- A-1: People in the persona group spend free time on relaxed, story-like experiences. Supported by one interview.
- A-2: They feel a personal place with a present character is missing (riskiest). Weakly supported, self-reported.
- A-3: The impediment is lack of personalization and presence. Mixed: price or access was also named.
- A-4: The feeling is mild loneliness or low engagement. Weak; context only; no phase 1 requirement depends on it.
- A-5: Voice conversation with a fictional character is appealing. Weak, biased, little direct experience with chatbots; tested only in phase 2.
- A-6: A desktop browser is the right platform for the persona. No evidence yet; the interviews in FR-14 can test it.
- A-7: Free hosting is available; the place is decided later. If no free option works, the PO revisits the constraint.

## Dependencies and Risks
- Dependency: 3D assets, textures and the character model (source, licence, cost).
- Dependency: 3D performance of the supported browsers on the builder's laptop.
- Dependency: phase 2 voice and language model services, and likely a server or API.
- Dependency: the builder's 3D skill.
- Constraint: the builder has under 2 hours per week (the plan estimates 12 to 16 hours for the first two months); free budget, with a small budget allowed in phase 2; the code stays understandable to the builder.
- Risk: a need only the builder has. Addressed by: FR-14 and FR-15 (they measure it for G-2; they do not remove it).
- Risk: low interest in voice if A-5 fails. Addressed by: Not addressed (decision: voice is phase 2 and not approved).
- Risk: stalled or abandoned project. Addressed by: Not addressed (decision: hobby build under 2 hours per week).
- Risk: a slow 3D world. Addressed by: NFR-2.
- Risk: kept data lost or blocked in the browser. Addressed by: NFR-5.
- Risk: a compliance question (GDPR, EU AI Act) for phase 2 voice. Addressed by: Not addressed (decision: the PO rejected the flag, no reason given).

## Open Questions
- OQ-1: Which 8 hair colours, which 8 clothing colours and which 3 voice choices (names) are offered? Type: product (the builder decides in design).
- OQ-2: What is the monthly budget ceiling for voice and language model? Owner Falco, before phase 2. Type: product.
- OQ-3: Where is the place hosted? Type: technical.
