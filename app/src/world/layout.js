import { fenceLine } from '../logic/fenceLine.js';

export const BOUNDS = { minX: -12, maxX: 12, minZ: -11, maxZ: 11 };
// The fence along the four edges: its outer face is on the edge of BOUNDS.
export const FENCE = { t: 0.2, h: 1, color: '#f2e3c6' };
export const CHARACTER_SPOT = { x: 3, z: -1 };

export const WALL = 0.2; // thickness of every wall, in metres

// Two floors, one gable roof. Only the main floor can be entered. Door and windows are on the garden (+z) side.
export const HOUSE = {
  x: 0,
  z: -7.5,
  w: 8,
  d: 5,
  floors: 2,
  wallHeight: 5,
  ceilingHeight: 2.5,
  roofHeight: 1.8,
};
const HW = HOUSE.w / 2;
const HD = HOUSE.d / 2;
export const HOUSE_FRONT_Z = HOUSE.z + HD; // the outer face of the garden wall

// The front door. DOOR.z is the outer face of the wall. It swings outward, hinged on its left jamb.
export const DOOR = { x: -1.95, z: HOUSE_FRONT_Z, w: 1.2, h: 2.1 };
export const HINGE = { x: DOOR.x - DOOR.w / 2, z: DOOR.z + 0.03 };
// The opening in the wall, and the swing space (a square that contains the quarter disc the door sweeps).
export const OPENING = {
  minX: DOOR.x - DOOR.w / 2,
  maxX: DOOR.x + DOOR.w / 2,
  minZ: DOOR.z - WALL,
  maxZ: DOOR.z,
};
export const SWING_SPACE = {
  minX: OPENING.minX,
  maxX: OPENING.maxX,
  minZ: DOOR.z,
  maxZ: DOOR.z + DOOR.w,
};
// The doorway between the rooms: an opening in the wall that splits the main floor.
export const INNER_DOORWAY = { x: HOUSE.x, z: HOUSE.z, w: 1.2, h: 2.1 };

export const ROOMS = [
  {
    id: 'living',
    minX: -HW + WALL,
    maxX: -WALL / 2,
    minZ: HOUSE.z - HD + WALL,
    maxZ: HOUSE_FRONT_Z - WALL,
  },
  {
    id: 'kitchen',
    minX: WALL / 2,
    maxX: HW - WALL,
    minZ: HOUSE.z - HD + WALL,
    maxZ: HOUSE_FRONT_Z - WALL,
  },
];

// The path from the gate to the door, 16 m long. Not a solid.
export const PATH = { x: DOOR.x, z0: DOOR.z, z1: BOUNDS.maxZ, w: 1.2 };
// The closed gate in the front fence, centred on the path.
export const GATE = { x: PATH.x, w: 1.2 };
// The start spot: on the path, 2 m inside the gate.
export const SPAWN = { x: PATH.x, z: BOUNDS.maxZ - FENCE.t - 2 };

// Flower beds are drawn but never block walking.
export const FLOWER_BEDS = [
  { id: 'bed-left', x: -5, z: -3.2, w: 2, d: 1 },
  { id: 'bed-right', x: 2.5, z: -3, w: 2, d: 1 },
];

// Walls. The garden wall has a gap for the front door and the middle wall a gap for the inner doorway.
const leftW = OPENING.minX - (HOUSE.x - HW);
const rightW = HOUSE.x + HW - OPENING.maxX;
const frontZ = HOUSE_FRONT_Z - WALL / 2;
const backEnd = HOUSE.z - HD + WALL;
const frontEnd = HOUSE_FRONT_Z - WALL;
const gapLo = INNER_DOORWAY.z - INNER_DOORWAY.w / 2;
const gapHi = INNER_DOORWAY.z + INNER_DOORWAY.w / 2;
const wall = (id, x, z, w, d, h) => ({ id, x, z, w, d, h });
export const WALLS = [
  wall(
    'wall-front-left',
    HOUSE.x - HW + leftW / 2,
    frontZ,
    leftW,
    WALL,
    HOUSE.wallHeight,
  ),
  wall(
    'wall-front-right',
    OPENING.maxX + rightW / 2,
    frontZ,
    rightW,
    WALL,
    HOUSE.wallHeight,
  ),
  wall(
    'wall-back',
    HOUSE.x,
    HOUSE.z - HD + WALL / 2,
    HOUSE.w,
    WALL,
    HOUSE.wallHeight,
  ),
  wall(
    'wall-left',
    HOUSE.x - HW + WALL / 2,
    HOUSE.z,
    WALL,
    HOUSE.d,
    HOUSE.wallHeight,
  ),
  wall(
    'wall-right',
    HOUSE.x + HW - WALL / 2,
    HOUSE.z,
    WALL,
    HOUSE.d,
    HOUSE.wallHeight,
  ),
  wall(
    'wall-mid-back',
    HOUSE.x,
    (backEnd + gapLo) / 2,
    WALL,
    gapLo - backEnd,
    HOUSE.ceilingHeight,
  ),
  wall(
    'wall-mid-front',
    HOUSE.x,
    (gapHi + frontEnd) / 2,
    WALL,
    frontEnd - gapHi,
    HOUSE.ceilingHeight,
  ),
];

// Interior items. `x`, `z` is the centre, `w` (x) and `d` (z) the footprint on the floor, `h` the height,
// `y` the height of the bottom (default 0), `rot` the turn about y (the model faces +z at 0, so
// +90 degrees faces +x). `file` is the model under public/assets/ (null when no free model was found,
// FR-19). The four dining chairs are an addition to the spec's item list (PO finding 7); FR-17 and FR-19
// apply to them like the rest. They stand two on each long side of the table, because a chair at the short
// end would stand on the line from the inner doorway. `solid: false` for things that hang. The plain block of an item has the footprint and `color`.
export const INTERIOR_ITEMS = [
  {
    id: 'couch',
    file: 'interior/couch.glb',
    x: -3.0,
    z: -8.3,
    w: 0.9,
    d: 2.2,
    h: 0.85,
    rot: Math.PI / 2,
    color: '#8a5a44',
  },
  // The TV desk (PO finding R-10): against the partition wall (its inner face is at x = -0.1), under
  // the TV. Kenney cabinetTelevisionDoors, native 0.8 x 0.31 x 0.25 m, scaled 1.8 to fill this box.
  // It is the solid that blocks walking at the TV (FR-17); `tv` itself does not block.
  {
    id: 'tv-cabinet',
    file: 'interior/tv-cabinet.glb',
    x: -0.33,
    z: -6.05,
    w: 0.45,
    d: 1.44,
    h: 0.558,
    rot: -Math.PI / 2,
    color: '#a9743b',
  },
  // The TV stands on the cabinet: `y` is the top of the cabinet (the cabinet's `h`).
  {
    id: 'tv',
    file: 'interior/tv.glb',
    x: -0.33,
    z: -6.05,
    w: 0.3,
    d: 1.2,
    h: 0.8,
    y: 0.558,
    solid: false,
    rot: -Math.PI / 2,
    color: '#1d1d22',
    // Measured on the model (Kenney televisionModern, native size 0.685 x 0.455 x 0.128 m, front +z):
    // the screen is 0.668 x 0.368 m, its centre 0.262 m up, its face 0.021 m in front of the model centre.
    screen: { w: 0.668, h: 0.368, y: 0.262, z: 0.024 },
  },
  {
    id: 'floor-lamp',
    file: 'interior/lamp-floor.glb',
    x: -3.45,
    z: -6,
    w: 0.35,
    d: 0.35,
    h: 1.6,
    color: '#d8b46a',
  },
  {
    id: 'kitchen',
    file: 'interior/kitchen.glb',
    x: 1.95,
    z: -9.45,
    w: 3.3,
    d: 0.7,
    h: 0.9,
    color: '#cfc8bd',
  },
  {
    id: 'dining-table',
    file: 'interior/dining-table.glb',
    x: 2.4,
    z: -7,
    w: 1.4,
    d: 0.9,
    h: 0.76,
    color: '#a9743b',
  },
  {
    id: 'chair-1',
    file: 'interior/chair.glb',
    x: 2.0,
    z: -7.72,
    w: 0.45,
    d: 0.45,
    h: 0.9,
    rot: 0,
    color: '#a9743b',
  },
  {
    id: 'chair-2',
    file: 'interior/chair.glb',
    x: 2.8,
    z: -7.72,
    w: 0.45,
    d: 0.45,
    h: 0.9,
    rot: 0,
    color: '#a9743b',
  },
  {
    id: 'chair-3',
    file: 'interior/chair.glb',
    x: 2.0,
    z: -6.28,
    w: 0.45,
    d: 0.45,
    h: 0.9,
    rot: Math.PI,
    color: '#a9743b',
  },
  {
    id: 'chair-4',
    file: 'interior/chair.glb',
    x: 2.8,
    z: -6.28,
    w: 0.45,
    d: 0.45,
    h: 0.9,
    rot: Math.PI,
    color: '#a9743b',
  },
  {
    id: 'pendant-living',
    file: 'interior/lamp-pendant.glb',
    x: -1.9,
    z: -7.5,
    w: 0.35,
    d: 0.35,
    h: 0.35,
    y: 2.15,
    solid: false,
    color: '#d8b46a',
  },
  {
    id: 'pendant-kitchen',
    file: 'interior/lamp-pendant.glb',
    x: 1.95,
    z: -7.5,
    w: 0.35,
    d: 0.35,
    h: 0.35,
    y: 2.15,
    solid: false,
    color: '#d8b46a',
  },
];

// Warm lights (FR-14). Few on purpose: every light costs frame rate on every lit surface.
export const LIGHTS = [
  {
    id: 'light-living',
    room: 'living',
    x: -1.9,
    y: 2.0,
    z: -7.5,
    color: '#ffb866',
    intensity: 1.3,
    distance: 6,
  },
  {
    id: 'light-lamp',
    room: 'living',
    x: -3.45,
    y: 1.5,
    z: -6,
    color: '#ffa94d',
    intensity: 1,
    distance: 4,
  },
  {
    id: 'light-kitchen',
    room: 'kitchen',
    x: 1.95,
    y: 2.0,
    z: -7.5,
    color: '#ffc27a',
    intensity: 1.3,
    distance: 6,
  },
  {
    id: 'light-counter',
    room: 'kitchen',
    x: 1.95,
    y: 1.6,
    z: -9,
    color: '#ffd29a',
    intensity: 0.8,
    distance: 3.5,
  },
];

// kind: house | fence | gate | furniture | tree | bush | hedge | character
// Collision uses w and d only. h and shape are for drawing.
export const SOLIDS = [
  ...fenceLine(BOUNDS, FENCE, GATE),
  {
    id: 'bench',
    kind: 'furniture',
    item: 'bench',
    x: -4,
    z: -2,
    w: 1.6,
    d: 0.6,
    h: 0.9,
    color: '#8b5a2b',
  },
  {
    id: 'table',
    kind: 'furniture',
    item: 'table',
    x: 5,
    z: -4,
    w: 1.2,
    d: 1.2,
    h: 0.8,
    color: '#a9743b',
  },
  {
    id: 'planter',
    kind: 'furniture',
    item: 'planter',
    x: -5.6,
    z: -5.5,
    w: 2,
    d: 0.6,
    h: 0.5,
    color: '#7a4b2a',
  },
  {
    id: 'tree-1',
    kind: 'tree',
    shape: 'round',
    x: -5,
    z: 3,
    w: 0.5,
    d: 0.5,
    h: 4,
    color: '#5c4033',
  },
  {
    id: 'tree-2',
    kind: 'tree',
    shape: 'pine',
    x: 6,
    z: 3,
    w: 0.5,
    d: 0.5,
    h: 5,
    color: '#5c4033',
  },
  {
    id: 'tree-3',
    kind: 'tree',
    shape: 'pine',
    x: -6.5,
    z: 7,
    w: 0.5,
    d: 0.5,
    h: 4.5,
    color: '#5c4033',
  },
  {
    id: 'tree-4',
    kind: 'tree',
    shape: 'round',
    x: 7,
    z: 8,
    w: 0.5,
    d: 0.5,
    h: 4.2,
    color: '#5c4033',
  },
  {
    id: 'tree-5',
    kind: 'tree',
    shape: 'pine',
    x: -9.5,
    z: -8,
    w: 0.5,
    d: 0.5,
    h: 5,
    color: '#5c4033',
  },
  {
    id: 'tree-6',
    kind: 'tree',
    shape: 'round',
    x: 9.5,
    z: -8,
    w: 0.5,
    d: 0.5,
    h: 4,
    color: '#5c4033',
  },
  {
    id: 'bush-1',
    kind: 'bush',
    x: -3.4,
    z: -4.6,
    w: 0.6,
    d: 0.6,
    h: 0.8,
    color: '#4f7a3a',
  },
  {
    id: 'bush-2',
    kind: 'bush',
    x: 2.5,
    z: -4.6,
    w: 0.6,
    d: 0.6,
    h: 0.8,
    color: '#4f7a3a',
  },
  {
    id: 'bush-3',
    kind: 'bush',
    x: -6.8,
    z: 6,
    w: 0.6,
    d: 0.6,
    h: 0.8,
    color: '#4f7a3a',
  },
  {
    id: 'hedge-1',
    kind: 'hedge',
    x: 6,
    z: -9.6,
    w: 3.5,
    d: 0.5,
    h: 1.1,
    color: '#4f7a3a',
  },
  { id: 'character', kind: 'character', ...CHARACTER_SPOT, w: 0.8, d: 0.8 },
];

// The character wanders, so his solid moves (see character-wander in components.js).
// This puts it back at the start spot, for a new visit to the world.
export function resetCharacterSolid() {
  const c = SOLIDS.find((s) => s.id === 'character');
  if (c) {
    c.x = CHARACTER_SPOT.x;
    c.z = CHARACTER_SPOT.z;
  }
}

// The whole house as one block. It stands in for the walls when the house model fails (FR-21),
// it is what the character keeps out of (FR-10), and it is what the walkable area outside the house leaves out.
export const HOUSE_BLOCK = {
  id: 'house-block',
  kind: 'house',
  zone: 'block',
  x: HOUSE.x,
  z: HOUSE.z,
  w: HOUSE.w,
  d: HOUSE.d,
  h: HOUSE.wallHeight,
  color: '#e8c9a0',
};

// `off` solids are skipped by collision. The door is `off` when fully open. The swing space is `off` at rest.
const DOOR_SOLID = {
  id: 'door',
  kind: 'door',
  zone: 'house',
  off: false,
  x: DOOR.x,
  z: DOOR.z - WALL / 2,
  w: DOOR.w,
  d: WALL,
  h: DOOR.h,
};
const SWING_SOLID = {
  id: 'door-swing',
  kind: 'door',
  zone: 'house',
  off: true,
  x: (SWING_SPACE.minX + SWING_SPACE.maxX) / 2,
  z: (SWING_SPACE.minZ + SWING_SPACE.maxZ) / 2,
  w: DOOR.w,
  d: DOOR.w,
  h: DOOR.h,
};
const HOUSE_SOLIDS = [
  ...WALLS.map((w) => ({
    ...w,
    kind: 'wall',
    zone: 'house',
    color: '#e8c9a0',
  })),
  DOOR_SOLID,
  SWING_SOLID,
  ...INTERIOR_ITEMS.filter((i) => i.solid !== false).map((i) => ({
    id: i.id,
    kind: 'interior',
    zone: 'house',
    x: i.x,
    z: i.z,
    w: i.w,
    d: i.d,
    h: i.h,
    color: i.color,
  })),
];
SOLIDS.push(...HOUSE_SOLIDS);

// For a house that failed to load: one closed block, no door, no interior (FR-21).
export function useClosedHouse() {
  for (let i = SOLIDS.length - 1; i >= 0; i--)
    if (SOLIDS[i].zone === 'house') SOLIDS.splice(i, 1);
  if (!SOLIDS.includes(HOUSE_BLOCK)) SOLIDS.push(HOUSE_BLOCK);
}

// Back to the normal house, for a new visit. The door is closed again (FR-6).
export function resetHouse() {
  const at = SOLIDS.indexOf(HOUSE_BLOCK);
  if (at >= 0) SOLIDS.splice(at, 1);
  for (const s of HOUSE_SOLIDS) if (!SOLIDS.includes(s)) SOLIDS.push(s);
  DOOR_SOLID.off = false;
  SWING_SOLID.off = true;
}

export const doorSolids = () => ({ door: DOOR_SOLID, swing: SWING_SOLID });

// The solids outside the house, with the house as one block: what FR-13 measures.
export function outsideSolids() {
  return [...SOLIDS.filter((s) => !s.zone), HOUSE_BLOCK];
}

// The solids the character walks around: the garden, and the whole house as one block, so he
// never goes into it, open door or not (FR-10). The character's own solid is not in the list.
export function wanderSolids() {
  return outsideSolids().filter((s) => s.id !== 'character');
}
