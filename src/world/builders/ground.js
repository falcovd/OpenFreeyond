import { surface } from './common.js';
import { PATH } from '../layout.js';

const GROUND_SIZE = 600; // far beyond the fog, so the ground never ends in view (FR-3)
const GRASS_METRES_PER_TILE = 4;

export function buildGround(THREE, assets) {
  const tiles = GROUND_SIZE / GRASS_METRES_PER_TILE;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(GROUND_SIZE, GROUND_SIZE),
    surface(THREE, assets, 'grass', '#8fae6b', { repeat: [tiles, tiles] }),
  );
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
}

export function buildPath(THREE, assets) {
  const length = PATH.z1 - PATH.z0;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(PATH.w, length),
    surface(THREE, assets, 'path', '#bba88c', {
      repeat: [PATH.w / 1.5, length / 1.5],
    }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(PATH.x, 0.02, (PATH.z0 + PATH.z1) / 2);
  return mesh;
}
