# PRD: OpenFreeyond, a personal cozy world with a companion character

Source: [feature.md](feature.md). Decisions: [decisions.md](decisions.md).

## Summary
A cozy, homely 3D place in the desktop browser where a person walks around freely and a fictional human character lives. Phase 1 delivers the place and the character, entered through a try-out without an account, plus an intake that anyone can fill in and that stays in their own browser. Phase 2 (later) adds spoken conversation with the character. This is a hobby build by one person; the wider appeal is untested.

## Problem
An adult who enjoys cozy, story-like games wants to spend relaxed free time in a personal, homely place that feels like theirs, with a character who lives there. Existing games, chatbots and voice assistants offer no personal world or sense of presence.
Evidence is weak: one self-interview of the builder (the author of the idea), through multiple-choice prompts. Verdict: partially confirmed, confidence low. See [verdict.md](../../discovery/openfreeyond-companion/evidence/verdict.md).

## Users
- **Primary (phase 1):** the builder, the only person whose need has been reported.
- **Intended wider persona, unproven:** an adult who plays relaxed or story-like games on a desktop or laptop and is not the builder.
- **Visitors:** first-time visitors who either try the place without an account (example character) or make their own character; their data stays in their own browser.

## Definitions
- **Cozy, homely:** warm light and colours, domestic objects such as furniture and a garden, calm, no threats or timers.
- **Visibly present:** the character is rendered in the place with an idle animation.
- **Persona-matching:** an adult who plays relaxed or story-like games on a desktop or laptop and is not the builder.
- **Intake fields:** name and age, appearance (hair and clothing colours), character, hobbies and favourite things, background story, voice choice, living environment (as in the plan).

## Goals and success metrics
- G-1: The builder can spend relaxed time in a personal, cozy place that feels like theirs. Metric: relaxing sessions per week, and a "feels like mine" rating on a 1 to 5 scale. Baseline: 0. Target: at least 1 session per week for 4 weeks, rating 4 or more. Timeframe: 4 weeks after phase 1 is online.
- G-2: Learn whether people other than the builder want this. Metric: of at least 3 independent persona-matching people interviewed after trying the place, how many say they would try it. Baseline: 0. Target: at least two thirds (2 of 3, 3 of 4, 4 of 5). Timeframe: before phase 2 starts.

## Non-goals
- Photorealistic faces, and characters modelled on real people.
- Real accounts and server-side storage in phase 1.
- Multiplayer.
- Mobile support.
- VR testing (no headset available; VR is an optional later phase).
- Personalizing the place, house or garden.
- Unlimited spending on voice or language model.

## Requirements
Functional:
- R-1 (G-1, G-2, phase 1): A person can freely walk around and explore a cozy, homely place in a desktop browser without installing anything. Solid objects block walking and a person cannot leave the place. A short controls hint is shown on first entry.
- R-2 (G-1, G-2, phase 1): A fictional human character is visibly present in that place, standing in a fixed spot, so the place does not feel empty.
- R-3 (G-1, phase 1): A person can choose the colours of the character's hair and clothing from a fixed set of 8 each, in the intake, so the character feels like theirs, and the choice is kept between sessions in that person's own browser.
- R-4 (G-2, phase 1): A first-time visitor can experience the place without creating an account or entering personal details; they see the example character, which cannot be changed in the try-out. A returning person can continue with their kept character, make a new one, or try-out; the try-out never changes kept data.
- R-6 (G-1, phase 2): A person can hold a spoken conversation with the character. To be confirmed before it is specified.
- R-7 (G-2, phase 1): The builder can learn what at least 3 independent people think after they try the place. The builder shares the try-out (R-4), then interviews each person with the discovery interview guide and keeps anonymized notes in the discovery evidence folder. No in-product feedback form.
- R-8 (G-1, phase 1): A person can fill in the seven intake fields, all required (age a whole number from 18 to 120, text up to 500 characters, voice one of 3 choices, living environment one choice), and they are kept between sessions in that person's own browser. Anyone who opens the place can do this; the app does not tell the builder from a visitor. In phase 1 only the appearance field (R-3) changes what is shown in the world; the other fields are kept for phase 2.

R-5 was moved to constraints; its ID is not reused.

Non-functional:
- NFR-1 (phase 1): The place works in the latest Chrome, Firefox and Safari on a laptop, checked by the builder by hand.
- NFR-2 (phase 1): Walking in the place averages 30 frames per second or better over a 2-minute walk, measured with the browser's frame-rate display on the builder's own laptop. Below that counts as a failure of R-1.
- NFR-3 (phase 1): Nothing a person enters leaves that person's own browser. There are no accounts, no analytics and no server storage. Interview notes contain no names.
- NFR-4 (phase 1): No accessibility level is promised; keyboard and mouse only, noted as a known limitation.
- NFR-5 (phase 1): If stored data is missing or broken, or the browser is unsupported, the person sees a clear message and no crash; missing or broken stored data resets to the example character.

Constraints: under 2 hours per week (the plan estimates 12 to 16 hours for the first two months); free budget, with a small budget allowed in phase 2 for voice or language model; the code stays understandable to the builder.

## Scope and out of scope
In scope: the walkable place with a character and a try-out entry (phase 1); hair and clothing colours; the seven-field intake kept in the person's own browser; a way to learn what independent people think (R-7); voice conversation as phase 2 after phase 1 and a better test of A-5.
Out of scope: see Non-goals above (photorealistic faces and real-person likeness, real accounts and server storage in phase 1, multiplayer, mobile, VR testing, personalizing the place, unlimited spending).

## Assumptions
(A-1 to A-5 are A1 to A5 in [problem-statement.md](../../discovery/openfreeyond-companion/problem-statement.md).)
- A-1: People in the persona group spend free time on relaxed, story-like experiences. Supported by one interview.
- A-2 (riskiest): They feel a personal place with a present character is missing. Weakly supported, self-reported.
- A-3: The impediment is lack of personalization and presence. Mixed: price or access was also named.
- A-4: The feeling is mild loneliness or low engagement. Weak; context only.
- A-5: Voice conversation with a fictional character is appealing. Weak, biased, little direct experience with chatbots.
- A-6: A desktop browser is the right platform for the persona. No evidence yet.
- A-7: Free hosting is available; the place is decided later. If no free option works, the PO revisits the constraint.

## Dependencies and risks
Dependencies: 3D assets, textures and character model (source, licence, cost); phase 2 voice and language model services and likely a server or API; browser 3D performance; the builder's 3D skill.
Risks: a need only the builder has; low interest in voice if A-5 fails; stalled or abandoned project; a slow 3D world (see NFR-2).
Compliance: a GDPR and EU AI Act flag for phase 2 voice was raised in critique and rejected by the PO, with no reason given (see [decisions.md](decisions.md)).

## Open questions
- Do people other than the builder want this? (G-2 answers it.)
- The 8 hair colours, 8 clothing colours and 3 voice choices offered (the builder decides in design).
- Monthly budget ceiling for voice and language model (owner Falco, before phase 2).
- Final hosting location (technical; assumption A-7).

## Status
Decision: go for phase 1 only, as a hobby build, decided 2026-11-07, owner Falco (builder). Phase 2, including R-6, is not approved. Claims that others want it are unproven until G-2 is met.
