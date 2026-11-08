import { SOLIDS, FLOWER_BEDS } from './layout.js';
import { buildSky } from './builders/sky.js';
import { buildGround, buildPath } from './builders/ground.js';
import {
  buildTree,
  buildBush,
  buildHedge,
  buildFlowerBed,
} from './builders/plants.js';
import { buildHouse } from './builders/house.js';
import { buildFence, buildFurniture } from './builders/furniture.js';
import { buildFigure } from './builders/figure.js';

const BUILDERS = {
  tree: buildTree,
  bush: buildBush,
  hedge: buildHedge,
  fence: buildFence,
  furniture: buildFurniture,
};

// Builds the whole place from what loaded. Never throws for a missing asset (FR-16).
// Returns the group and the functions that move things (trees, sky).
export function buildWorld(
  THREE,
  assets,
  colours,
  { withCharacter = true } = {},
) {
  const group = new THREE.Group();
  group.add(
    buildSky(THREE, assets),
    buildGround(THREE, assets),
    buildPath(THREE, assets),
    buildHouse(THREE, assets),
  );
  for (const solid of SOLIDS) {
    const build = BUILDERS[solid.kind];
    if (build) group.add(build(THREE, assets, solid));
  }
  for (const bed of FLOWER_BEDS) group.add(buildFlowerBed(THREE, bed));
  // The character model is an entity (see scene.js). Without it, a plain figure stands in.
  if (withCharacter && !assets.model('character'))
    group.add(buildFigure(THREE, colours));

  const updaters = [];
  group.traverse((o) => {
    if (typeof o.userData.update === 'function')
      updaters.push(o.userData.update);
  });
  return { group, updaters };
}
