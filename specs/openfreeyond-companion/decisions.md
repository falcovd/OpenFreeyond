# Decision log

## Round 1 critique of feature.md
| Finding | Class | Decision | Reason |
|---|---|---|---|
| G-1 and G-2 targets, timeframes, metrics | Must | Accepted | G-1: at least 1 session per week for 4 weeks, rating 4+ of 5, 4 weeks after phase 1 online. G-2: at least 2 of 3 independent people positive, before phase 2. |
| R-1 to R-3 ambiguity | Must | Accepted | Definitions added. R-3 narrowed to hair and clothing colours, by the builder. Browser support left as an open question. |
| R-5 is a builder constraint, not an outcome | Must | Accepted | Moved to constraints. ID R-5 not reused. |
| Compliance flag (GDPR, EU AI Act) | Must | Rejected | No reason given. |
| Evidence only from the builder | Should | Accepted (editorial) | Problem Statement now says who was interviewed and how. |
| G-2 has no requirement gathering feedback | Should | Accepted | R-7 added. |
| Scope and phases unclear | Should | Accepted (editorial) | Phase added to each requirement; the plan marked as background. Intake fields moved to an open question. |
| Missing dependencies and risks | Should | Accepted | Listed; budget ceiling stays open for phase 2, owner Falco. |
| Two ID forms for assumptions | Should | Accepted (editorial) | A-n used everywhere; A-6 added for the platform. |
| Status contradicts its note | Should | Accepted | Decision go, for phase 1 only. |
| G-1 timeframe hint | Could | Accepted | Replaced by 4 weeks after phase 1 is online. |
| Out of scope boundaries | Could | Accepted (editorial) | Real-person likeness and place personalization added; VR marked as optional later. |

## Gate: feature document
Approved by the PO after round 1, without a round 2.

## Round 1 critique of prd.md
| Finding | Class | Decision | Reason |
|---|---|---|---|
| Non-functional targets and browser/hardware missing | Must | Accepted | NFR-1: latest Chrome, Firefox and Safari on a laptop from the last 5 years. NFR-2: walks smoothly at 30 frames per second. Accessibility: none promised in phase 1. Privacy: nothing leaves the builder's browser; interview notes anonymized. Reliability not yet decided (asked in the spec phase). |
| R-7 gives no testable behaviour | Must | Accepted | The builder shares the try-out, then interviews 3 independent people with the discovery interview guide; notes anonymized, kept in the discovery evidence folder. The try-out (R-4) counts as "try". No in-product form. |
| R-2 clause and definitions dropped | Should | Accepted (editorial) | Restored the clause and the definitions in the PRD. |
| R-3 vs R-4 vs no server storage | Should | Accepted | Colours and intake fields are kept in the builder's own browser, no server. Visitors see the example character. PO chose all seven intake fields stored in the browser in phase 1 (new R-8). A conflicting earlier answer ("only colours") was clarified by the PO in favour of all seven fields. |
| Requirements trace to G-1 only | Should | Accepted (editorial) | R-1, R-2 and R-4 now serve G-1 and G-2. |
| Constraints vs hosting and asset cost | Should | Accepted | Added assumption A-7: free hosting is available; place decided later. Phase 1 estimate of 12 to 16 hours comes from the plan. |
| Slow 3D world risk without a limit | Should | Accepted | Covered by NFR-2. |
| Assumption evidence notes and ID mapping dropped | Could | Accepted (editorial) | Added. |
| Scope pointer to Non-goals | Could | Accepted (editorial) | Out of scope listed in the Scope section. |
| Status missing | Could | Accepted (editorial) | Status section added. |

## Gate: PRD
Approved by the PO after round 1, without a round 2.

## Decisions while writing the spec (PO)
- The intake (colours and seven fields) is open to anyone; data stays in their own browser. Reason: the app cannot tell the builder from a visitor. R-3, R-8 and NFR-3 updated in the PRD.
- All seven intake fields are required. Limits (age range, text length) and the choices for voice and living environment are open product questions.
- Solid objects block walking and a person cannot leave the place (added to R-1).
- Reliability (NFR-5): clear message, no crash; missing or broken stored data resets to the example character.

## Round 1 critique of spec.md
| Finding | Class | Decision | Reason |
|---|---|---|---|
| G-2 tally and interview steps have no home (in or out of the product) | Must | Accepted (editorial, per PRD R-7) | FR-14 to FR-15 and AC-6.x now state they are done outside the product; in-product feedback form and tally listed as out of scope. |
| G-2 rule for more than 3 people | Must | Accepted | PO: at least 2 of 3; with more people, at least two thirds, asked after they tried the place. |
| Voice and living environment choices undefined | Must | Accepted | PO: voice 3 choices; living environment 1 choice, a house with a garden on a cozy street. Names of voices and the colours stay in OQ-1. |
| Intake field limits | Must | Accepted | PO: age whole number 18 to 120; text up to 500 characters. |
| Colour choice mechanism | Should | Accepted | PO: fixed set of 8 colours each for hair and clothing. |
| Returning visitor and try-out colours | Should | Accepted | PO: continue / make new / try-out; the try-out never changes kept data; colours only through the intake. |
| How 30 frames per second is checked | Should | Accepted | PO: average of at least 30 over a 2-minute walk, builder's own laptop, browser frame-rate display. |
| No controls hint | Should | Accepted | PO: short dismissible hint on first entry for keyboard and mouse or trackpad. |
| G-1 has no measurement and no story | Should | Accepted (editorial) | US-7, FR-16, AC-7.1: self-report in the builder's notes, outside the product, since analytics are out. |
| Privacy wording, hosting, "sent" not testable | Should | Accepted (editorial) | NFR-3 says loading the place does not count; AC-4.5 uses a network tool. |
| Error states for storage blocked or broken data | Should | Accepted (editorial) | NFR-5, AC-4.6, AC-4.7 extended. |
| Persona-matching and independent person definitions circular | Should | Accepted (editorial) | Definitions fixed; builder checks three points before the interview. |
| Movement and boundary wording | Should | Accepted (editorial) | Controls hint added; AC-1.1 refers to the hint. |
| Constraints and browser performance dependency dropped; A-7 sentence dropped | Should | Accepted (editorial) | Carried over. |
| R-6 and the feedback form not listed as out of scope | Should | Accepted (editorial) | Added to Out of Scope. |
| Could findings (idle animation, own browser, contract format, cozy wording) | Could | Accepted (editorial) / noted | Idle animation and own browser defined. "Warm" and "domestic objects" are left as judged by the PO at verification. |

## Gate: spec
Approved by the PO after round 1 of the spec critique, without a round 2. OQ-1 left to the builder in design; OQ-2 (budget ceiling) before phase 2; OQ-3 (hosting) is technical.
