import { box, fitToHeight, hash, plainBlock, surface } from './common.js';

const SWAY_RADIANS = (0.7 * Math.PI) / 180; // under one degree: gentle (FR-14)

function fromModel(THREE, assets, modelId, solid) {
  const gltf = assets.model(modelId);
  if (!gltf) return plainBlock(THREE, solid, modelId);
  const g = new THREE.Group();
  g.position.set(solid.x, 0, solid.z);
  g.userData.kind = solid.kind;
  g.rotation.y = hash(solid.id) * Math.PI * 2;
  g.add(fitToHeight(THREE, gltf.clone(true), solid.h));
  return g;
}

export function buildTree(THREE, assets, solid) {
  const g = fromModel(THREE, assets, `tree-${solid.shape}`, solid);
  if (!g.userData.plain) {
    const phase = hash(solid.id) * Math.PI * 2;
    g.userData.update = (seconds) => {
      g.rotation.z = Math.sin(seconds * 0.9 + phase) * SWAY_RADIANS;
    };
  }
  return g;
}

export function buildBush(THREE, assets, solid) {
  return fromModel(THREE, assets, 'bush', solid);
}

// A dense green block with the grass texture, longer than it is tall.
export function buildHedge(THREE, assets, solid) {
  const g = new THREE.Group();
  g.position.set(solid.x, 0, solid.z);
  g.userData.kind = 'hedge';
  const material = surface(THREE, assets, 'grass', solid.color, {
    repeat: [solid.w, 1],
    tint: '#7fae5a',
    gain: 1.9,
  });
  g.add(box(THREE, solid.w, solid.h, solid.d, material, 0, solid.h / 2, 0));
  return g;
}

export { buildFlowerBed } from './flowers.js';
