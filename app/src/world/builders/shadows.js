import { SHADOWS } from '../shadowConfig.js';
import { STREET_SHADOWS } from '../streetConfig.js';
import { NEIGHBOUR_SHADOWS } from '../neighbourhoodConfig.js';

// cast: throws a shadow. receive: has shadows drawn on it.
export const SHADOW_RULES = {
  tree: { cast: true, receive: true },
  bush: { cast: true, receive: true },
  hedge: { cast: true, receive: true },
  fence: { cast: true, receive: true },
  gate: { cast: true, receive: true },
  furniture: { cast: true, receive: true },
  house: { cast: true, receive: true },
  character: { cast: true, receive: true },
  // Flat things and the inside of the house only receive. The roof and walls already shade the rooms.
  'flower-bed': { cast: false, receive: true },
  interior: { cast: false, receive: true },
  ground: { cast: false, receive: true },
  slab: { cast: true, receive: true },
  'street-slab': { cast: true, receive: true },
  curb: { cast: true, receive: true },
  road: { cast: false, receive: true },
  street: { cast: false, receive: true },
  car: { cast: true, receive: true },
  lamp: { cast: true, receive: true },
  // The painted far scenery never throws or catches a shadow.
  backdrop: { cast: false, receive: false },
  sky: { cast: false, receive: false },
};
const NONE = { cast: false, receive: false };
// Dropped first when the frame rate misses 30 (STREET_SHADOWS = 'off'). Fence, gate and path slabs keep theirs.
const STREET_KINDS = new Set([
  'street-slab',
  'curb',
  'road',
  'street',
  'car',
  'lamp',
]);

function kindOf(object, fallback) {
  for (let o = object; o; o = o.parent)
    if (o.userData?.kind) return o.userData.kind;
  return fallback;
}

function isNeighbour(object) {
  for (let o = object; o; o = o.parent) if (o.userData?.neighbour) return true;
  return false;
}

// Sets castShadow and receiveShadow on every mesh under `root` by the kind of its nearest ancestor.
// With neighbourShadows 'off' (FR-13 step 2) everything under a `userData.neighbour` ancestor does neither.
// See-through materials never cast (the window glass lets the sun in).
export function applyShadows(
  root,
  {
    enabled = SHADOWS === 'on',
    kind,
    streetShadows = STREET_SHADOWS,
    neighbourShadows = NEIGHBOUR_SHADOWS,
  } = {},
) {
  root.traverse((o) => {
    if (!o.isMesh) return;
    const k = kindOf(o, kind);
    // Our own car and lamp are not neighbour objects: they keep the street rule only.
    const off =
      (streetShadows === 'off' && STREET_KINDS.has(k)) ||
      (neighbourShadows === 'off' && isNeighbour(o));
    const rule = enabled && !off ? (SHADOW_RULES[k] ?? NONE) : NONE;
    const see = [].concat(o.material ?? []).some((m) => m?.transparent);
    o.castShadow = rule.cast && !see && !o.userData.flat; // flat: a ground-level underlay that never casts
    o.receiveShadow = rule.receive;
  });
}
