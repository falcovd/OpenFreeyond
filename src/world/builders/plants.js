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

// A dense dark-green block with the grass texture, longer than it is tall.
export function buildHedge(THREE, assets, solid) {
  const g = new THREE.Group();
  g.position.set(solid.x, 0, solid.z);
  g.userData.kind = 'hedge';
  const material = surface(THREE, assets, 'grass', solid.color, {
    repeat: [solid.w, 1],
    tint: '#4f7a3a',
  });
  g.add(box(THREE, solid.w, solid.h, solid.d, material, 0, solid.h / 2, 0));
  return g;
}

const FLOWER_COLOURS = ['#e8738f', '#f2c14e', '#ffffff', '#b58be0', '#f08a4b'];

// Soil with small flowers on it. A flower bed is never a solid (AC-4.7).
export function buildFlowerBed(THREE, bed) {
  const g = new THREE.Group();
  g.position.set(bed.x, 0, bed.z);
  g.userData.kind = 'flower-bed';
  g.add(
    box(
      THREE,
      bed.w,
      0.12,
      bed.d,
      new THREE.MeshStandardMaterial({ color: '#5a3d28', roughness: 1 }),
      0,
      0.06,
      0,
    ),
  );
  const stem = new THREE.MeshStandardMaterial({ color: '#4f7a3a' });
  const cols = Math.floor(bed.w / 0.3);
  const rows = Math.floor(bed.d / 0.3);
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const x = -bed.w / 2 + 0.2 + i * 0.3 + (j % 2) * 0.1;
      const z = -bed.d / 2 + 0.2 + j * 0.3;
      const h = 0.22 + ((i * 3 + j * 5) % 4) * 0.04;
      g.add(box(THREE, 0.02, h, 0.02, stem, x, 0.12 + h / 2, z));
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.07, 8, 6),
        new THREE.MeshStandardMaterial({
          color: FLOWER_COLOURS[(i + j * 2) % FLOWER_COLOURS.length],
        }),
      );
      head.position.set(x, 0.12 + h, z);
      g.add(head);
    }
  }
  return g;
}
