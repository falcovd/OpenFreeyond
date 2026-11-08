# OpenFreeyond: personal cozy world with a companion character

## Problem Statement
An adult who enjoys cozy, story-like games wants to spend relaxed free time in a personal, homely place that feels like theirs, with a character who lives there. Existing games, chatbots and voice assistants offer no personal world or sense of presence. So far only the builder, who is the author of the idea, has reported this need, and weakly (verdict: partially confirmed, confidence low).
- Problem statement: [problem-statement.md](problem-statement.md)
- Verdict: [evidence/verdict.md](evidence/verdict.md)
- Interview: [evidence/interviews/interview-01.md](evidence/interviews/interview-01.md)
- Data: none ([evidence/data/no-data.md](evidence/data/no-data.md))

## Goals
- G-1: The builder can spend relaxed time in a personal, cozy place that feels like theirs. Metric: sessions per week the builder chooses it for relaxing, and a self-rating of "feels like mine". Baseline: 0 (does not exist). Target: to be determined. Timeframe: to be determined (phase 1 is about 2 months in the plan).
- G-2: Learn whether people other than the builder want this. Metric: number of non-builder, persona-matching people who respond positively after trying or hearing about it. Baseline: 0 independent interviews. Target: at least 3 independent interviews (the discovery threshold). Timeframe: to be determined.

## Requirements
- R-1: A person can freely walk around and explore a cozy, homely place in a desktop browser without installing anything. Goal: G-1. Evidence: A1 ([interview-01.md](evidence/interviews/interview-01.md)); plan in [plans/project-plan.md](../../plans/project-plan.md).
- R-2: A fictional human character is visibly present in that place, so it does not feel empty. Goal: G-1. Evidence: A2, weak ([interview-01.md](evidence/interviews/interview-01.md)).
- R-3: A person can make the place and character feel like their own, within the limits of what is feasible. Goal: G-1. Evidence: A2 and A3, Q3b and Q9 ([interview-01.md](evidence/interviews/interview-01.md)).
- R-4: A first-time visitor can experience the place without creating an account or giving personal details. Goal: G-2. Evidence: assumption (plan treats personal data as a risk).
- R-5: The builder can build and maintain this within under 2 hours per week and a free budget, and can understand the code. Goal: G-1. Evidence: constraint from [plans/project-plan.md](../../plans/project-plan.md).
- R-6: Later, a person can hold a spoken conversation with the character. Goal: G-1. Evidence: A5, weak and biased ([interview-01.md](evidence/interviews/interview-01.md)). To be confirmed before it is specified.

## Scope
- Phase 1 of the plan: a walkable, cozy 3D place in the desktop browser with a character present, and a try-out entry with example character data.
- Avatar intake fields as drafted in the plan, as input to later work.
- Voice conversation (R-6) as a later phase, only after phase 1 is done and A5 is better tested.
- Detail lives in [plans/project-plan.md](../../plans/project-plan.md).

## Out of Scope
- Photorealistic faces.
- Real accounts and server-side storage in phase 1.
- Multiplayer.
- Mobile support.
- VR testing (no headset available).
- Unlimited spending on voice or language model.

## Open Questions, Assumptions and Risks
Assumptions (A-1 to A-5 correspond to A1 to A5 in [problem-statement.md](problem-statement.md)):
- A-1: People in the persona group spend free time on relaxed, story-like experiences. Supported by one interview.
- A-2 (riskiest): They feel such a personal place with a present character is missing. Weakly supported, self-reported.
- A-3: The impediment is lack of personalization and presence. Mixed: price or access was also named.
- A-4: The feeling is mild loneliness or lack of engagement. Weak.
- A-5: Voice conversation with a fictional character is appealing. Weak, biased, little direct experience with chatbots.

Open questions:
- Do people other than the builder want this? No independent interview exists yet.
- Monthly budget for voice and language model (phase 2).
- Final hosting location.

Risks:
- Building on a need that only the builder has; acceptable for a hobby, but not as a product.
- Low interest in the voice step if A-5 does not hold.
- Time and motivation (under 2 hours per week).

## Status
Decision: needs more evidence. Date: 2026-11-07. Owner: Falco (builder).
Note: as a personal hobby build, phase 1 can proceed on the builder's own interest; "needs more evidence" applies to any claim that others want it.
