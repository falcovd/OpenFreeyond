import { BOUNDS, GATE } from './layout.js';
import { STREET_CARS, STREET_LAMPS } from './streetConfig.js';

// The street is data only: it has no solids, because the person can never reach it.
// layout.js must not import this file (it would be circular).
const z0 = BOUNDS.maxZ; // the sidewalk starts at the outer face of the front fence (A-8)
const SIDEWALK = { z0, w: 1.8, top: 0.15 };
const CURB = { z0: z0 + SIDEWALK.w, w: 0.2, h: 0.15 };
const ROAD = { z0: CURB.z0 + CURB.w, w: 7 };
ROAD.z1 = ROAD.z0 + ROAD.w;

export const STREET = {
  length: 480, // x from -240 to 240: fully fogged at both ends from anywhere in the garden
  sidewalk: { ...SIDEWALK, z1: z0 + SIDEWALK.w },
  curb: { ...CURB, z1: CURB.z0 + CURB.w },
  road: ROAD,
  centreLineZ: ROAD.z0 + ROAD.w / 2,
};

const ALL_CARS = [
  {
    id: 'car-1',
    x: GATE.x - 7,
    w: 3.06,
    d: 1.8,
    h: 1.56,
    rot: 0,
    color: '#9aa7b8',
  },
  {
    id: 'car-2',
    x: GATE.x - 0.5,
    w: 3.85,
    d: 1.75,
    h: 1.48,
    rot: 0,
    color: '#b86b5a',
  },
  {
    id: 'car-3',
    x: GATE.x + 6.5,
    w: 3.37,
    d: 1.88,
    h: 1.63,
    rot: 0,
    color: '#d8c98a',
  },
].map((c) => ({ ...c, z: ROAD.z0 + 0.15 + c.d / 2, kind: 'car' }));

// The lamp model is a pole with an arm that reaches 1.5 m over the road. The model is centred on its
// footprint, so the pole stands 0.583 m behind the lamp's z: LAMP_Z puts the pole 1 m from the fence
// and the arm tip over the edge of the road.
const LAMP_POLE_Z = SIDEWALK.z0 + 1.0;
const LAMP_Z = LAMP_POLE_Z + 0.583;
const ALL_LAMPS = [GATE.x - 6, GATE.x + 1, GATE.x + 7].map((x, i) => ({
  id: `lamp-${i + 1}`,
  kind: 'lamp',
  x,
  z: LAMP_Z,
  w: 0.33,
  d: 1.5,
  h: 4.5,
  color: '#3d4148',
}));

export const CARS = ALL_CARS.slice(0, STREET_CARS);
export const LAMPS = ALL_LAMPS.slice(0, STREET_LAMPS);

// The sun's shadow box must hold the whole street (OQ-2).
export const SHADOW_REGION = { ...BOUNDS, maxZ: ROAD.z1 + 0.5 };
