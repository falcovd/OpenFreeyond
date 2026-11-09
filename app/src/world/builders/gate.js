import { box, surface } from './common.js';

// The closed gate: two rails and a diagonal brace across the opening. The posts are the end posts of the two
// fence pieces beside it, so none are drawn here. Same wood, colour and rail heights as the fence. It is
// not pickable (noPick): a click passes through it. Collision is the gate solid's box.
export function buildGate(THREE, assets, solid) {
  const g = new THREE.Group();
  g.position.set(solid.x, 0, solid.z);
  g.userData.kind = 'gate';
  g.userData.noPick = true;
  const wood = () =>
    surface(THREE, assets, 'wood', solid.color, { repeat: [1, 1] });
  const low = solid.h * 0.35;
  const high = solid.h * 0.75;
  for (const y of [low, high]) {
    const rail = box(THREE, solid.w, 0.1, 0.06, wood(), 0, y, 0);
    rail.userData.part = 'rail';
    g.add(rail);
  }
  const rise = high - low;
  const brace = box(
    THREE,
    Math.hypot(solid.w, rise),
    0.08,
    0.05,
    wood(),
    0,
    (low + high) / 2,
    0,
  );
  brace.rotation.z = Math.atan2(rise, solid.w);
  brace.userData.part = 'brace';
  g.add(brace);
  return g;
}
