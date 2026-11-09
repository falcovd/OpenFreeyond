// The brain of the wandering character. Pure functions: no A-Frame, no DOM, no clock.
// Positions are in metres on the ground (x, z). A heading is a rotation about the y axis in
// radians: it points along (sin h, cos h), and the heading toward a point is atan2(dx, dz).
import { hitsSolid } from './collision.js';

export const WANDER = {
  radius: 0.5, // body radius for routes and steps: he keeps this far from every solid and the boundary
  cell: 0.25, // grid size for path-finding
  speed: 1.33, // metres per second: the ground speed of the Walk clip, measured by tests/walk-speed.test.js
  turnRate: 4, // radians per second
  idleMin: 2, // seconds he stands still between walks
  idleMax: 6,
  greetNear: 3, // he stops and faces the player closer than this ...
  greetFar: 4, // ... and wanders again when the player is farther than this
  waveFacing: 0.6, // he waves once he faces the player to within this many radians
  personGap: 0.9, // he never steps closer to the player than this
  arrive: 0.15, // close enough to a waypoint
  minTrip: 2, // a new target is at least this far away
  blockedLimit: 2, // seconds he waits for the player to get out of the way before giving up the walk
};

// True when a body of this radius can stand here: inside the boundary and clear of every solid.
export function isFree(x, z, solids, bounds, radius = WANDER.radius) {
  if (x < bounds.minX + radius || x > bounds.maxX - radius) return false;
  if (z < bounds.minZ + radius || z > bounds.maxZ - radius) return false;
  return !hitsSolid(x, z, solids, radius);
}

// True when the straight line between two points is free all the way.
function lineFree(a, b, solids, bounds, radius) {
  const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 0.1));
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    if (
      !isFree(
        a.x + (b.x - a.x) * t,
        a.z + (b.z - a.z) * t,
        solids,
        bounds,
        radius,
      )
    )
      return false;
  }
  return true;
}

// A small binary heap of [priority, value], lowest priority first.
class Heap {
  constructor() {
    this.items = [];
  }
  get size() {
    return this.items.length;
  }
  push(priority, value) {
    const a = this.items;
    a.push([priority, value]);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (a[p][0] <= a[i][0]) break;
      [a[p], a[i]] = [a[i], a[p]];
      i = p;
    }
  }
  pop() {
    const a = this.items;
    const top = a[0];
    const last = a.pop();
    if (a.length > 0) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < a.length && a[l][0] < a[m][0]) m = l;
        if (r < a.length && a[r][0] < a[m][0]) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]];
        i = m;
      }
    }
    return top[1];
  }
}

// A route on a grid from `from` to `to` that stays free of the solids and inside the bounds.
// Returns a list of waypoints that ends exactly at `to` (the start is not included), or null
// when the target is blocked or cannot be reached.
export function findPath(
  from,
  to,
  solids,
  bounds,
  { radius = WANDER.radius, cell = WANDER.cell } = {},
) {
  if (!isFree(to.x, to.z, solids, bounds, radius)) return null;
  if (lineFree(from, to, solids, bounds, radius)) return [{ x: to.x, z: to.z }];

  const nx = Math.floor((bounds.maxX - bounds.minX) / cell) + 1;
  const nz = Math.floor((bounds.maxZ - bounds.minZ) / cell) + 1;
  const toNode = (p) => [
    Math.round((p.x - bounds.minX) / cell),
    Math.round((p.z - bounds.minZ) / cell),
  ];
  const toPoint = (i, j) => ({
    x: bounds.minX + i * cell,
    z: bounds.minZ + j * cell,
  });
  const id = (i, j) => j * nx + i;
  const free = new Map();
  const isNodeFree = (i, j) => {
    if (i < 0 || j < 0 || i >= nx || j >= nz) return false;
    const k = id(i, j);
    if (!free.has(k)) {
      const p = toPoint(i, j);
      free.set(k, isFree(p.x, p.z, solids, bounds, radius));
    }
    return free.get(k);
  };

  const [si, sj] = toNode(from);
  const [gi, gj] = toNode(to);
  const octile = (i, j) => {
    const dx = Math.abs(i - gi);
    const dz = Math.abs(j - gj);
    return (Math.max(dx, dz) + (Math.SQRT2 - 1) * Math.min(dx, dz)) * cell;
  };

  const best = new Map([[id(si, sj), 0]]);
  const parent = new Map();
  const open = new Heap();
  open.push(octile(si, sj), [si, sj]);
  const done = new Set();
  let found = false;
  while (open.size > 0) {
    const [i, j] = open.pop();
    const k = id(i, j);
    if (done.has(k)) continue;
    done.add(k);
    if (i === gi && j === gj) {
      found = true;
      break;
    }
    for (let di = -1; di <= 1; di++) {
      for (let dj = -1; dj <= 1; dj++) {
        if (di === 0 && dj === 0) continue;
        const ni = i + di;
        const nj = j + dj;
        if (!isNodeFree(ni, nj)) continue;
        // No cutting corners: a diagonal step needs both sides free.
        if (
          di !== 0 &&
          dj !== 0 &&
          !(isNodeFree(i + di, j) && isNodeFree(i, j + dj))
        )
          continue;
        const cost =
          best.get(k) + (di !== 0 && dj !== 0 ? Math.SQRT2 : 1) * cell;
        const nk = id(ni, nj);
        if (cost < (best.get(nk) ?? Infinity)) {
          best.set(nk, cost);
          parent.set(nk, k);
          open.push(cost + octile(ni, nj), [ni, nj]);
        }
      }
    }
  }
  if (!found) return null;

  // Walk back from the goal to the start, then pull the route tight: skip every waypoint
  // that the next one can be reached from in a straight free line.
  const nodes = [];
  for (let k = id(gi, gj); k !== undefined; k = parent.get(k)) {
    nodes.push(toPoint(k % nx, Math.floor(k / nx)));
  }
  nodes.reverse();
  nodes[0] = { x: from.x, z: from.z };
  nodes[nodes.length - 1] = { x: to.x, z: to.z };
  const route = [];
  let at = 0;
  while (at < nodes.length - 1) {
    let far = nodes.length - 1;
    while (
      far > at + 1 &&
      !lineFree(nodes[at], nodes[far], solids, bounds, radius)
    )
      far--;
    route.push(nodes[far]);
    at = far;
  }
  return route;
}

// A target the character can walk to: a random free spot at least minTrip away that a route leads to.
// Returns { target, path } or null after a number of failed tries.
export function pickTarget(rng, from, solids, bounds, tries = 40) {
  const r = WANDER.radius;
  for (let n = 0; n < tries; n++) {
    const target = {
      x: bounds.minX + r + rng() * (bounds.maxX - bounds.minX - 2 * r),
      z: bounds.minZ + r + rng() * (bounds.maxZ - bounds.minZ - 2 * r),
    };
    if (!isFree(target.x, target.z, solids, bounds)) continue;
    if (Math.hypot(target.x - from.x, target.z - from.z) < WANDER.minTrip)
      continue;
    const path = findPath(from, target, solids, bounds);
    if (path) return { target, path };
  }
  return null;
}

const idleTime = (rng) =>
  WANDER.idleMin + rng() * (WANDER.idleMax - WANDER.idleMin);

// The shortest signed angle from b to a, in -pi..pi.
const angleDiff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));

function turnToward(heading, target, dt) {
  const step = WANDER.turnRate * dt;
  const d = angleDiff(target, heading);
  return heading + Math.max(-step, Math.min(step, d));
}

export function initialState(x, z, heading) {
  return {
    mode: 'idle', // idle | walk | greet
    x,
    z,
    heading,
    timer: 2, // seconds left of the first rest
    path: [], // waypoints still to walk
    blocked: 0, // seconds he has waited for the player to move
    moving: false, // true in the step he actually moved: drives the Walk animation
    waved: false, // he has waved at the person who is near now; reset when the person leaves
    waveNow: false, // true in the one step in which he starts to wave: drives the Wave animation
  };
}

// One step of the character's life. `ctx` is { solids, bounds, player: {x, z}, rng }, where
// `solids` must not include the character himself. Returns a new state; the old one is not changed.
export function stepWander(state, dt, ctx) {
  const { solids, bounds, player, rng } = ctx;
  const s = { ...state, moving: false, waveNow: false };
  const toPlayer = Math.hypot(player.x - s.x, player.z - s.z);

  if (s.mode !== 'greet' && toPlayer < WANDER.greetNear) {
    s.mode = 'greet';
    s.path = [];
    s.waved = false;
  } else if (s.mode === 'greet' && toPlayer > WANDER.greetFar) {
    s.mode = 'idle';
    s.timer = idleTime(rng);
    s.waved = false; // the next approach gets a new wave
  }

  if (s.mode === 'greet') {
    const toward = Math.atan2(player.x - s.x, player.z - s.z);
    s.heading = turnToward(s.heading, toward, dt);
    // One wave per approach, once he faces the person.
    if (
      !s.waved &&
      Math.abs(angleDiff(toward, s.heading)) < WANDER.waveFacing
    ) {
      s.waved = true;
      s.waveNow = true;
    }
    return s;
  }

  if (s.mode === 'idle') {
    s.timer -= dt;
    if (s.timer <= 0) {
      const trip = pickTarget(rng, s, solids, bounds);
      if (trip) {
        s.mode = 'walk';
        s.path = trip.path;
        s.blocked = 0;
      } else {
        s.timer = idleTime(rng);
      }
    }
    return s;
  }

  // walk
  const next = s.path[0];
  if (!next) {
    s.mode = 'idle';
    s.timer = idleTime(rng);
    return s;
  }
  const dx = next.x - s.x;
  const dz = next.z - s.z;
  const dist = Math.hypot(dx, dz);
  if (dist < WANDER.arrive) {
    s.path = s.path.slice(1);
    return s;
  }
  const want = Math.atan2(dx, dz);
  s.heading = turnToward(s.heading, want, dt);
  if (Math.abs(angleDiff(want, s.heading)) > 0.8) return s; // turn on the spot first

  const step = Math.min(WANDER.speed * dt, dist);
  const x = s.x + (dx / dist) * step;
  const z = s.z + (dz / dist) * step;
  const closer =
    Math.hypot(player.x - x, player.z - z) <
    Math.hypot(player.x - s.x, player.z - s.z);
  const tooNear = Math.hypot(player.x - x, player.z - z) < WANDER.personGap;
  if (!isFree(x, z, solids, bounds) || (tooNear && closer)) {
    s.blocked += dt;
    if (s.blocked > WANDER.blockedLimit) {
      s.mode = 'idle';
      s.timer = idleTime(rng);
      s.path = [];
    }
    return s;
  }
  s.x = x;
  s.z = z;
  s.blocked = 0;
  s.moving = true;
  return s;
}
