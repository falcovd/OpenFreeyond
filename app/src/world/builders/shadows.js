import { SHADOWS } from '../shadowConfig.js';

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
  sky: { cast: false, receive: false },
};
const NONE = { cast: false, receive: false };

function kindOf(object, fallback) {
  for (let o = object; o; o = o.parent)
    if (o.userData?.kind) return o.userData.kind;
  return fallback;
}

// Sets castShadow and receiveShadow on every mesh under `root` by the kind of its nearest ancestor.
// See-through materials never cast (the window glass lets the sun in).
export function applyShadows(root, { enabled = SHADOWS === 'on', kind } = {}) {
  root.traverse((o) => {
    if (!o.isMesh) return;
    const rule = enabled ? (SHADOW_RULES[kindOf(o, kind)] ?? NONE) : NONE;
    const see = [].concat(o.material ?? []).some((m) => m?.transparent);
    o.castShadow = rule.cast && !see;
    o.receiveShadow = rule.receive;
  });
}
