import { surface, plainBlock } from './common.js';
import { plotHouse } from '../plots.js';
import { HOUSE_SIZE } from '../houseLooks.js';

const BRICK_GAIN = 1.5; // the brick texture is mid dark, so the tint needs brightening to read as its colour
const ROOF_TINT = '#d9a98c';
const WINDOW = '#1c2630'; // dark and opaque: nothing shows inside
const DOOR = '#8b5a2b';
const TRIM = '#efe6d4';

export const houseAssetId = (plot) => `house-${plot.look}`;

function standIn(THREE, plot) {
  const house = plotHouse(plot);
  const block = plainBlock(
    THREE,
    {
      x: house.x,
      z: house.z,
      w: HOUSE_SIZE.w,
      d: HOUSE_SIZE.d,
      h: house.floors * HOUSE_SIZE.floorHeight,
      color: plot.tint,
      kind: 'house',
    },
    'house',
  );
  block.rotation.y = house.rot;
  block.userData.neighbour = true;
  block.userData.noPick = true;
  return block;
}

// The finished house from a loaded model. Materials are swapped by name, as buildHouse does. The house is
// scenery: no door controller parts, never picked, never in SOLIDS (FR-5).
export function finishNeighbourHouse(THREE, assets, plot, gltf) {
  const house = plotHouse(plot);
  const g = new THREE.Group();
  g.position.set(house.x, 0, house.z);
  g.rotation.y = house.rot;
  g.userData.kind = 'house';
  g.userData.neighbour = true;
  g.userData.noPick = true;
  const scene = gltf.scene.clone(true);
  g.add(scene);

  const flat = (color, extra = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness: 1, ...extra });
  const meshes = [];
  scene.traverse((o) => o.isMesh && meshes.push(o));
  for (const mesh of meshes) {
    switch (mesh.material?.name) {
      case 'Brick': {
        mesh.geometry.computeBoundingBox();
        const s = mesh.geometry.boundingBox
          .getSize(new THREE.Vector3())
          .multiply(mesh.scale);
        mesh.material = surface(THREE, assets, 'brick', plot.tint, {
          repeat: [Math.max(s.x, s.z) / 2, s.y / 2],
          tint: plot.tint,
          gain: BRICK_GAIN,
        });
        break;
      }
      case 'Render':
        mesh.material = flat(plot.tint);
        break;
      case 'Roof':
        mesh.material = surface(THREE, assets, 'roof', '#b5543a', {
          repeat: [HOUSE_SIZE.w / 1.5, HOUSE_SIZE.d / 1.5],
          tint: ROOF_TINT,
          gain: 2.8,
        });
        mesh.material.side = THREE.DoubleSide;
        break;
      case 'Window':
        mesh.material = flat(WINDOW, { roughness: 0.3 });
        break;
      case 'Door':
        mesh.material = surface(THREE, assets, 'wood', DOOR);
        break;
      case 'Trim':
        mesh.material = flat(TRIM);
        break;
    }
  }
  return g;
}

// The house of a plot: the finished model when it is loaded, otherwise the plain block (AC-6.7, AC-6.9).
export function buildNeighbourHouse(THREE, assets, plot) {
  const gltf = assets.gltf(houseAssetId(plot));
  return gltf?.scene
    ? finishNeighbourHouse(THREE, assets, plot, gltf)
    : standIn(THREE, plot);
}
