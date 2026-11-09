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
  // One material per material name per house. The model carries world-space UVs (brick 1 tile per 2 m, roof
  // 1 tile per 1.5 m), so the textures keep their repeat of 1.
  const made = {
    Brick: () =>
      surface(THREE, assets, 'brick', plot.tint, {
        tint: plot.tint,
        gain: BRICK_GAIN,
      }),
    Render: () => flat(plot.tint),
    Roof: () => {
      const m = surface(THREE, assets, 'roof', '#b5543a', {
        tint: ROOF_TINT,
        gain: 2.8,
      });
      m.side = THREE.DoubleSide;
      return m;
    },
    Window: () => flat(WINDOW, { roughness: 0.3 }),
    Door: () => surface(THREE, assets, 'wood', DOOR),
    Trim: () => flat(TRIM),
  };
  const cache = new Map();
  scene.traverse((o) => {
    const name = o.isMesh && o.material?.name;
    if (!made[name]) return;
    if (!cache.has(name)) cache.set(name, made[name]());
    o.material = cache.get(name);
  });
  return g;
}

// The house of a plot: the finished model when it is loaded, otherwise the plain block (AC-6.7, AC-6.9).
export function buildNeighbourHouse(THREE, assets, plot) {
  const gltf = assets.gltf(houseAssetId(plot));
  return gltf?.scene
    ? finishNeighbourHouse(THREE, assets, plot, gltf)
    : standIn(THREE, plot);
}
