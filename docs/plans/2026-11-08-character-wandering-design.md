# Character wandering: design

Status: approved by the builder on 2026-11-08.

## Goal

The character walks around the garden at random, using the `Walk` animation of the original model. He stops and faces you when you come close.

Talking to him (phase 2) is out of scope. Other clips (Wave, Interact) wait for phase 2.

## Decisions

- Area: the whole garden. Anywhere inside the boundary that no solid blocks.
- Reaction: when you come close, he stops, turns to face you, and plays Idle. When you walk away, he wanders again.
- Movement: wander on a grid with path-finding, so he walks around the house, fences and trees and never gets stuck.

Rejected: straight-line walking with collision sliding (gets stuck behind the house) and hand-written waypoints (not random).

## Behaviour

He loops through three states:

1. Idle. He stands still for 2 to 6 seconds.
2. Walk. He picks a random free spot, finds a route around the obstacles, and walks it. He keeps about 0.5 m clear of every solid and of the boundary.
3. Greet. You are within about 3 m. He stops, turns toward you, and plays Idle. He goes back to Idle (state 1) when you are 4 m away or more. The gap between 3 m and 4 m stops him flickering at the edge.

If you stand in his way, he waits. He never steps into your space.

## Animation

- `scripts/convert-character.mjs` keeps two clips, `Idle` and `Walk`, from `assets/models/Casual_Hoodie.fbx`. The clip list becomes a comma-separated argument, for example `Idle,Walk`.
- The materials do not change, so `logic/colours.js` still works and `tests/character-glb.test.js` still finds the names.
- A component plays the clip for the current state and cross-fades between them in about 0.25 s. It replaces `idle-animation`.
- The stride is tuned by eye so the feet do not slide.

## Collision

- The character stays solid.
- His entry in `SOLIDS` is updated in place every frame. The `walk-limiter` already reads that list, so you are stopped at his current position.
- The path finder ignores his own entry and treats every other solid as an obstacle.

## Code

- `src/logic/wander.js` (pure, no A-Frame, no DOM). It takes a random function, so tests are repeatable.
  - Pick a random free target.
  - Find a route on a grid of 0.25 m cells around the solids.
  - One step of state: position, heading, and idle, walk or greet.
- `src/world/components.js`: a thin component that moves the entity, turns it, and tells the animation component which state to play.
- `src/world/layout.js`: `CHARACTER_SPOT` stays as the start position. The `character` solid moves with him.
- If the model fails to load, the plain figure stands still, as today.

## Tests (Vitest, no WebGL)

- A route never crosses a solid, and ends at the target.
- A target is always a free spot, away from the solids and the boundary.
- The state machine goes from idle to walk to idle, and enters greet when the player is near.
- He faces the player in greet, and waits when the player blocks the route.
- The GLB has exactly two animations, named `Idle` and `Walk`, and stays under 2 MB.
- The layout test now says the character starts at the same spot each visit.

## Spec and docs

- FR-6 ("stands in a fixed spot") and AC-4.4 ("same spot each time") of the phase 1 spec change to: he starts at a fixed spot and wanders.
- `CLAUDE.md` notes that the model has two clips and the character solid moves.
- The checklist gets items for walking, facing the player, and not walking through objects.

## Notes

- Dead code: in `stepWander` the branch that makes him wait for a player who is in his way cannot trigger. He greets (stops) from 3 m, and the personal-space gap is 0.9 m. The branch stays as a harmless safety net. The block-and-give-up logic is tested against a solid instead.
- The converter command is `node scripts/convert-character.mjs assets/models/Casual_Hoodie.fbx public/assets/character.glb Idle,Walk` with no colour overrides. An override turns the shorts light blue.

## Update: waving (2026-11-08)

When a person comes close, he waves once with the `Wave` clip of `Casual_Hoodie.fbx`.

- One wave for each approach. It starts in the greet state, once he faces the person to within 0.6 radians (`WANDER.waveFacing`). `stepWander` sets `waveNow` for that one step and `waved` until the person goes beyond `greetFar`, so shuffling between 3 m and 4 m does not wave again.
- The animation component plays `Wave` once (it holds its last pose), and goes back to what he is doing when it ends. Standing does not cut a wave short. Walking again does.
- The model has a third clip, so the converter takes `Idle,Walk,Wave` (the file grows by about 110 KB, to 1.5 MB).
