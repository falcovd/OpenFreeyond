import { BOUNDS } from './layout.js';

// The street sizes. They sit apart from streetLayout.js so plots.js can use them without a cycle.
// The street is data only: it has no solids, because the person can never reach it.
// layout.js must not import this file (it would be circular).
const z0 = BOUNDS.maxZ; // the sidewalk starts at the outer face of the front fence (A-8)
const SIDEWALK = { z0, w: 1.8, top: 0.15 };
const CURB = { z0: z0 + SIDEWALK.w, w: 0.2, h: 0.15 };
const ROAD = { z0: CURB.z0 + CURB.w, w: 7 };
ROAD.z1 = ROAD.z0 + ROAD.w;
// The far side of the road (D-27): scenery like the rest, same sizes as the near curb and sidewalk.
const FAR_CURB = { z0: ROAD.z1, w: CURB.w, h: CURB.h };
const FAR_SIDEWALK = {
  z0: FAR_CURB.z0 + FAR_CURB.w,
  w: SIDEWALK.w,
  top: SIDEWALK.top,
};

export const STREET = {
  length: 480, // x from -240 to 240: fully fogged at both ends from anywhere in the garden
  sidewalk: { ...SIDEWALK, z1: z0 + SIDEWALK.w },
  curb: { ...CURB, z1: CURB.z0 + CURB.w },
  road: ROAD,
  farCurb: { ...FAR_CURB, z1: FAR_CURB.z0 + FAR_CURB.w },
  farSidewalk: { ...FAR_SIDEWALK, z1: FAR_SIDEWALK.z0 + FAR_SIDEWALK.w },
  centreLineZ: ROAD.z0 + ROAD.w / 2,
};
