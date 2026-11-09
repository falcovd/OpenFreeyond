import { plotFences, plotPath, plotGarden } from '../plots.js';
import { buildFence, buildFurniture } from './furniture.js';
import { buildGate } from './gate.js';
import { buildSlabs } from './slabs.js';
import { buildTree, buildBush, buildHedge, buildFlowerBed } from './plants.js';

const GARDEN_BUILDERS = {
  tree: buildTree,
  bush: buildBush,
  hedge: buildHedge,
  furniture: buildFurniture,
};

// The scenery of one other plot: fences, the gate, the slab path and (gardens 'on') the garden. Scenery only:
// it adds nothing to SOLIDS and a click goes through it. The house is added by the caller (Task 6).
export function buildPlotScenery(THREE, assets, plot, { gardens = 'on' } = {}) {
  const g = new THREE.Group();
  g.userData.kind = 'plot';
  g.userData.plotId = plot.id;
  g.userData.neighbour = true;
  g.userData.noPick = true;

  for (const piece of plotFences(plot))
    g.add(
      piece.kind === 'gate'
        ? buildGate(THREE, assets, piece)
        : buildFence(THREE, assets, piece),
    );

  // Like buildPath: whole slabs at the gate end, the partial row at the door end. Local +z runs along the
  // strip; a near plot runs toward -z (turned), a far plot toward +z.
  const path = plotPath(plot);
  const slabs = buildSlabs(THREE, assets, {
    width: path.w,
    length: path.length,
    texture: 'paving',
    fallback: '#b9b3a8',
    kind: 'slab',
    top: 0.05,
  });
  if (plot.side === 'near') slabs.rotation.y = Math.PI;
  slabs.position.set(path.x, 0, path.z0);
  slabs.userData.noPick = true;
  g.add(slabs);

  if (gardens === 'on') {
    const garden = plotGarden(plot);
    for (const item of garden.items) {
      const build = GARDEN_BUILDERS[item.kind];
      if (build) g.add(build(THREE, assets, item));
    }
    for (const bed of garden.beds) g.add(buildFlowerBed(THREE, assets, bed));
  }
  return g;
}
