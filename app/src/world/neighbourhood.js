import { visiblePlots } from './plots.js';
import { CARS, LAMPS } from './streetLayout.js';
import {
  buildNeighbourHouse,
  finishNeighbourHouse,
  houseAssetId,
} from './builders/neighbourHouse.js';
import { buildCar, buildLamp } from './builders/props.js';
import { makeAssets } from './builders/common.js';
import { applyShadows } from './builders/shadows.js';
import { disposeObject } from './dispose.js';

// The late parts of the neighbourhood: houses, cars, lamps (and later the backdrop). Each part starts as a
// stand-in (a plain block) at its final place and size, and is swapped for the finished node when the file
// it uses arrives (FR-14). A file that fails leaves its stand-ins. Nothing here is solid or pickable.
export function createNeighbourhood(
  THREE,
  assets,
  { plots = visiblePlots(), cars = CARS, lamps = LAMPS } = {},
) {
  const group = new THREE.Group();
  group.userData.noPick = true;
  const parts = [];
  const late = []; // loaded values this registry holds, released at dispose
  let disposed = false;

  // part: { id, parent, node, build(value) -> finished node }. The node is added to its parent here.
  // Our own car and lamp (plotId 'ours') are parts of the neighbourhood but not flagged as a neighbour's.
  // A node that is already finished (its asset was in `assets`) has no userData.plain and is never swapped.
  const register = ({ id, parent = group, node, build, neighbour = true }) => {
    node.userData.neighbour = neighbour;
    parent.add(node);
    parts.push({ id, parent, node, build, neighbour });
    return node;
  };

  const withModel = (id, gltf) => makeAssets(new Map([[id, gltf]]));
  for (const plot of plots)
    register({
      id: houseAssetId(plot),
      node: buildNeighbourHouse(THREE, assets, plot),
      build: (gltf) => finishNeighbourHouse(THREE, assets, plot, gltf),
    });
  for (const car of cars)
    register({
      id: car.model,
      neighbour: car.plotId !== 'ours',
      node: buildCar(THREE, assets, car),
      build: (gltf) => buildCar(THREE, withModel(car.model, gltf), car),
    });
  for (const lamp of lamps)
    register({
      id: 'lamp',
      neighbour: lamp.plotId !== 'ours',
      node: buildLamp(THREE, assets, lamp),
      build: (gltf) => buildLamp(THREE, withModel('lamp', gltf), lamp),
    });

  return {
    group,
    register,
    // Swaps every stand-in that uses this file. A throw leaves the stand-ins as they were.
    replace(id, value) {
      if (disposed) return;
      const mine = parts.filter((p) => p.id === id && p.node.userData.plain);
      if (mine.length === 0) return;
      const fresh = mine.map((p) => {
        const node = p.build(value);
        // A value that cannot make the finished node is a failure: the stand-ins stay.
        if (node.userData.plain) throw new Error(`Unusable file for ${id}`);
        node.userData.neighbour = p.neighbour;
        return node;
      });
      late.push(value);
      mine.forEach((p, i) => {
        const old = p.node;
        p.parent.add(fresh[i]);
        p.parent.remove(old);
        disposeObject(old);
        applyShadows(fresh[i]);
        p.node = fresh[i];
      });
    },
    // The stand-ins stay.
    fail() {},
    dispose() {
      if (disposed) return;
      disposed = true;
      disposeObject(group);
      for (const v of late) if (v?.scene) disposeObject(v.scene);
      late.length = 0;
    },
  };
}
