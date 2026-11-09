import { surface } from './common.js';
import { PATH } from '../layout.js';
import { buildSlabs } from './slabs.js';

export const GROUND_SIZE = 600; // far beyond the fog, so the ground never ends in view (FR-3)
export const FOG = { near: 40, far: 220 };
const GRASS_METRES_PER_TILE = 4;

export function buildGround(THREE, assets) {
  const tiles = GROUND_SIZE / GRASS_METRES_PER_TILE;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(GROUND_SIZE, GROUND_SIZE),
    surface(THREE, assets, 'grass', '#8fae6b', { repeat: [tiles, tiles] }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.userData.noPick = true;
  mesh.userData.kind = 'ground';
  return mesh;
}

// Paving slabs from the gate (z = PATH.z1, whole slabs) back to the door (z = PATH.z0, the partial row).
export function buildPath(THREE, assets) {
  const g = buildSlabs(THREE, assets, {
    width: PATH.w,
    length: PATH.z1 - PATH.z0,
    texture: 'paving',
    fallback: '#b9b3a8',
    kind: 'slab',
    top: 0.05,
  });
  g.rotation.y = Math.PI; // local +z (along the strip) points to world -z
  g.position.set(PATH.x, 0, PATH.z1);
  g.userData.noPick = true;
  return g;
}
