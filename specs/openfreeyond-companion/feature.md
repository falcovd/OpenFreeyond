# OpenFreeyond: personal cozy world with a companion character

## Problem Statement
An adult who enjoys cozy, story-like games wants to spend relaxed free time in a personal, homely place that feels like theirs, with a character who lives there. Existing games, chatbots and voice assistants offer no personal world or sense of presence.

How we know: weakly. One interview, a self-interview of the builder, who is also the author of the idea, answered through multiple-choice prompts with no free text. It supports the need, but it is biased and not independent. Frequency and size of the problem beyond the builder are unknown. Verdict: partially confirmed, confidence low.
- Problem statement: [problem-statement.md](../../discovery/openfreeyond-companion/problem-statement.md)
- Verdict: [verdict.md](../../discovery/openfreeyond-companion/evidence/verdict.md)
- Interview: [interview-01.md](../../discovery/openfreeyond-companion/evidence/interviews/interview-01.md)
- Data: none ([no-data.md](../../discovery/openfreeyond-companion/evidence/data/no-data.md))

## Goals
- G-1: The builder can spend relaxed time in a personal, cozy place that feels like theirs. Metric: relaxing sessions per week the builder chooses it for, and a self-rating of "feels like mine" on a 1 to 5 scale. Baseline: 0 sessions (does not exist yet). Target: at least 1 session per week for 4 weeks, and a rating of 4 or more. Timeframe: 4 weeks after phase 1 is online.
- G-2: Learn whether people other than the builder want this. Metric: of at least 3 independent, persona-matching people interviewed after trying the place, the number who say they would try it. Baseline: 0 independent interviews. Target: at least two thirds (2 of 3, 3 of 4, 4 of 5). Timeframe: before phase 2 starts.

## Requirements
- R-1: A person can freely walk around and explore a cozy, homely place in a desktop browser without installing anything. Goal: G-1. Evidence: A-1 ([interview-01.md](../../discovery/openfreeyond-companion/evidence/interviews/interview-01.md)). Phase: 1.
- R-2: A fictional human character is visibly present in that place, standing in a fixed spot, so the place does not feel empty. Goal: G-1. Evidence: A-2, weak. Phase: 1.
- R-3: A person can choose the colours of the character's hair and clothing from a fixed set of 8 each, in the intake, so the character feels like theirs; the choice is kept in their own browser. Goal: G-1. Evidence: A-2 and A-3, weak (interview-01, questions 3b and 9). Phase: 1.
- R-4: A first-time visitor can experience the place without creating an account or entering personal details; the example character is used and cannot be changed there. A returning person can continue, make a new character, or try-out. Goal: G-2. Evidence: assumption. Phase: 1.
- R-5: Moved to Open Questions, Assumptions and Risks as constraints (see decisions). The ID is not reused.
- R-6: A person can hold a spoken conversation with the character. Goal: G-1. Evidence: A-5, weak and biased. Phase: 2, to be confirmed before it is specified.
- R-7: The builder can learn what at least 3 independent people think after they try the place, through interviews outside the product. Goal: G-2. Evidence: assumption. Phase: 1.
- R-8: A person can fill in the seven intake fields, all required, and they are kept in their own browser. Goal: G-1. Evidence: plan. Phase: 1.

## Scope
- A walkable, cozy 3D place in the desktop browser with a character present, and a try-out entry with example character data (phase 1).
- Changing the character's hair and clothing colours (R-3).
- A way to collect feedback from independent people (R-7).
- Voice conversation (R-6) as phase 2, only after phase 1 is done and A-5 is better tested.
- The seven intake fields kept in the person's own browser (R-8). Further detail lives in [plans/project-plan.md](../../plans/project-plan.md), which is background, not part of this review.

## Out of Scope
- Photorealistic faces, and characters modelled on real people (the character is fictional).
- Real accounts and server-side storage in phase 1.
- Multiplayer.
- Mobile support.
- VR testing (no headset available). VR is an optional later phase.
- Personalizing the place, house or garden.
- Unlimited spending on voice or language model.

## Open Questions, Assumptions and Risks
Assumptions (A-1 to A-5 are A1 to A5 in [problem-statement.md](../../discovery/openfreeyond-companion/problem-statement.md)):
- A-1: People in the persona group spend free time on relaxed, story-like experiences. Supported by one interview.
- A-2 (riskiest): They feel such a personal place with a present character is missing. Weakly supported, self-reported.
- A-3: The impediment is lack of personalization and presence. Mixed: price or access was also named.
- A-4: The feeling is mild loneliness or lack of engagement. Weak. No requirement depends on it; it is context only.
- A-5: Voice conversation with a fictional character is appealing. Weak, biased, little direct experience with chatbots.
- A-6: A desktop browser is the right platform for the persona.

Constraints (from the former R-5):
- The builder has under 2 hours per week.
- The budget is free, with a small budget allowed in phase 2 for voice or language model.
- The code must stay understandable to the builder.

Open questions:
- Do people other than the builder want this? No independent interview exists yet.
- Which 8 hair colours, 8 clothing colours and 3 voice choices? The builder decides in design.
- Monthly budget ceiling for voice and language model. Owner: Falco. To be decided before phase 2.
- Final hosting location.

Dependencies:
- 3D models, textures and the character model: source, licence and cost per asset.
- Phase 2: third-party voice and language model services, and likely a server or API.
- A-Frame or three.js running well in browsers on the target hardware.
- The builder's skill with 3D assets.

Risks:
- Building on a need that only the builder has; acceptable for a hobby, not for a product.
- Low interest in the voice step if A-5 does not hold.
- Time and motivation; the project may stall or be abandoned.
- The 3D world may be slow with many details.

## Status
Decision: go. Date: 2026-11-07. Owner: Falco (builder).
Scope of the decision: phase 1 only, as a hobby build on the builder's own interest. Claims that others want it, and phase 2, remain unproven and need independent evidence (G-2).

## Definitions
- Cozy, homely: warm light, warm colour palette, domestic objects such as furniture and a garden; a calm place with no threats or timers.
- Visibly present: the character is rendered in the place and shows an idle animation.
- Persona-matching: an adult who plays relaxed or story-like games on a desktop or laptop and is not the builder.
