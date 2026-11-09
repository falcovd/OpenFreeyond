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
import { buildStreet } from './builders/street.js';
import { buildGate } from './builders/gate.js';
import { buildFigure } from './builders/figure.js';
import { buildInterior } from './builders/interior.js';
import { applyShadows } from './builders/shadows.js';
import { SHADOWS } from './shadowConfig.js';

const BUILDERS = {
  tree: buildTree,
  bush: buildBush,
  hedge: buildHedge,
  fence: buildFence,
  gate: buildGate,
  furniture: buildFurniture,
};

// Builds the whole place from what loaded. Never throws for a missing asset (FR-16).
// Returns the group, the functions that move things (trees, sky) and the objects a click can hit.
export function buildWorld(
  THREE,
  assets,
  colours,
  { withCharacter = true } = {},
) {
  const group = new THREE.Group();
  group.add(
    buildSky(THREE, assets, undefined, { shadows: SHADOWS === 'on' }),
    buildGround(THREE, assets),
    buildPath(THREE, assets),
    buildStreet(THREE, assets),
    buildHouse(THREE, assets),
  );
  for (const solid of SOLIDS) {
    const build = BUILDERS[solid.kind];
    if (build) group.add(build(THREE, assets, solid));
  }
  // The interior stands in the house, so without the house model there is none (FR-21).
  const interior = assets.gltf('house') ? buildInterior(THREE) : null;
  if (interior) group.add(interior.group);
  for (const bed of FLOWER_BEDS) group.add(buildFlowerBed(THREE, assets, bed));
  // The character model is an entity (see scene.js). Without it, a plain figure stands in.
  if (withCharacter && !assets.model('character'))
    group.add(buildFigure(THREE, colours));

  applyShadows(group);

  const updaters = [];
  group.traverse((o) => {
    if (typeof o.userData.update === 'function')
      updaters.push(o.userData.update);
  });
  const pickables = group.children.filter((c) => !c.userData.noPick);
  return { group, updaters, pickables, interior };
}
