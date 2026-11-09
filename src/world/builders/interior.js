import { INTERIOR_ITEMS } from '../layout.js';
import { fitToBox } from './common.js';

function block(THREE, item) {
  const g = new THREE.Group();
  g.position.set(item.x, item.y ?? 0, item.z);
  g.userData.item = item.id;
  g.userData.plain = item.id;
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(item.w, item.h, item.d),
    new THREE.MeshStandardMaterial({ color: item.color }),
  );
  m.position.y = item.h / 2;
  g.add(m);
  return g;
}

// A plain block for every item at once. replace(id, scene) swaps one block for its model,
// fitted into the footprint of the block. fail(id) keeps the block (FR-20, FR-23).
export function buildInterior(THREE) {
  const group = new THREE.Group();
  group.userData.kind = 'interior';
  const slots = new Map();
  for (const item of INTERIOR_ITEMS) {
    const b = block(THREE, item);
    slots.set(item.id, b);
    group.add(b);
  }
  return {
    group,
    slots,
    replace(id, scene) {
      const item = INTERIOR_ITEMS.find((i) => i.id === id);
      const old = slots.get(id);
      if (!item || !old) return null;
      const fitted = fitToBox(THREE, scene, item, item.rot ?? 0);
      fitted.position.set(item.x, item.y ?? 0, item.z);
      fitted.userData.item = id;
      group.remove(old);
      group.add(fitted);
      slots.set(id, fitted);
      return fitted;
    },
    fail(id) {
      const slot = slots.get(id);
      if (slot) slot.userData.failed = true;
    },
  };
}
