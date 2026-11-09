// Shadows from the sun. A build-time switch: 'on' or 'off'. Nothing changes at run time.
// If the frame-rate walk misses 30 fps, the builder decides what to drop first (see the checklist).
export const SHADOWS = 'on';

export const SHADOW_MAP_SIZE = 2048;
// The shadow box is a sphere of this radius around the person (OQ-3). 2 x 27 / 2048 = 2.64 cm per texel.
export const SHADOW_RADIUS = 27;
export const SUN_DISTANCE = 100; // metres from the origin, as in sky.js
export const SHADOW_BIAS = -0.0004;
export const SHADOW_NORMAL_BIAS = 0.02;
export const SHADOW_BLUR = 2; // soft edge radius
