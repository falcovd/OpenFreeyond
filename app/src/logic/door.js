// The front door, as pure logic. No A-Frame, no DOM, no storage (NFR-3): the state is never kept.
export const DOOR_SWING_SECONDS = 1; // FR-3: at least 0.5 and at most 2
export const CLICK_RANGE = 3; // metres to the nearest point of the door (FR-1, FR-2)
export const FOOTPRINT_RADIUS = 0.3; // a person's footprint (A-9)

// phase: closed | opening | open | closing. t is how far a swing has come, 0 to 1.
export const createDoor = () => ({ phase: 'closed', t: 0 });
export const isAtRest = (d) => d.phase === 'closed' || d.phase === 'open';
export const isFullyOpen = (d) => d.phase === 'open';

const ease = (t) => t * t * (3 - 2 * t);

// 0 closed, 1 open.
export function openness(d) {
  if (d.phase === 'closed') return 0;
  if (d.phase === 'open') return 1;
  return d.phase === 'opening' ? ease(d.t) : 1 - ease(d.t);
}

// Turn about y of the door leaf. Negative turns the leaf from along +x to along +z: outward (AC-1.10).
export const doorAngle = (d) => -openness(d) * (Math.PI / 2);

export function stepDoor(d, seconds, duration = DOOR_SWING_SECONDS) {
  if (isAtRest(d)) return d;
  const t = Math.min(1, d.t + seconds / duration);
  if (t < 1) return { phase: d.phase, t };
  return { phase: d.phase === 'opening' ? 'open' : 'closed', t: 0 };
}

// outcome: 'swing' | 'ignored' (the door is swinging, FR-9) | 'step-aside' (someone is in the doorway, FR-7).
export function clickDoor(d, { inDoorway }) {
  if (!isAtRest(d)) return { door: d, outcome: 'ignored' };
  if (inDoorway) return { door: d, outcome: 'step-aside' };
  return {
    door: { phase: d.phase === 'closed' ? 'opening' : 'closing', t: 0 },
    outcome: 'swing',
  };
}

export function circleHitsRect(p, radius, rect) {
  const cx = Math.min(Math.max(p.x, rect.minX), rect.maxX);
  const cz = Math.min(Math.max(p.z, rect.minZ), rect.maxZ);
  return Math.hypot(p.x - cx, p.z - cz) < radius;
}

// True when the person's footprint overlaps the opening or the swing space (the `rects`).
export const inDoorway = (p, rects, radius = FOOTPRINT_RADIUS) =>
  rects.some((r) => circleHitsRect(p, radius, r));

// Straight-line distance from a person ({x, y, z}) to the nearest point of the door leaf.
// `door` is { hinge: {x, z}, w, h, t }; `angle` is the turn about y from doorAngle().
export function distanceToDoor(person, door, angle) {
  const rx = person.x - door.hinge.x;
  const rz = person.z - door.hinge.z;
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const lx = rx * c - rz * s; // the person in the leaf's own frame
  const lz = rx * s + rz * c;
  const dx = Math.max(-lx, 0, lx - door.w);
  const dy = Math.max(-person.y, 0, person.y - door.h);
  const dz = Math.max(-door.t / 2 - lz, 0, lz - door.t / 2);
  return Math.hypot(dx, dy, dz);
}

export const hintVisible = ({ door, distance, inView, inDoorway: blocked }) =>
  isAtRest(door) && distance <= CLICK_RANGE && inView && !blocked;

export const stepAsideVisible = ({ requested, inDoorway: blocked }) =>
  requested && blocked;
