import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { makeAssets } from '../src/world/builders/common.js';
import {
  buildNeighbourHouse,
  finishNeighbourHouse,
} from '../src/world/builders/neighbourHouse.js';
import { buildWorld } from '../src/world/buildWorld.js';
import { PLOTS, plotHouse, visiblePlots } from '../src/world/plots.js';
import { LOOKS, HOUSE_SIZE } from '../src/world/houseLooks.js';

const none = makeAssets(new Map());
const near = PLOTS.find((p) => p.side === 'near');
const far = PLOTS.find((p) => p.side === 'far');

const named = (name, color = '#ffffff') => {
  const m = new THREE.MeshStandardMaterial({ color });
  m.name = name;
  return m;
};
// A stub model: one mesh per named material, the door at local x = doorOffset.
function stub(plot) {
  const scene = new THREE.Group();
  for (const n of ['Brick', 'Render', 'Roof', 'Window', 'Door', 'Trim']) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), named(n));
    mesh.name = n;
    if (n === 'Door') mesh.position.set(LOOKS[plot.look].doorOffset, 1, 2.5);
    scene.add(mesh);
  }
  return { scene };
}
const withModel = (plot) =>
  makeAssets(new Map([[`house-${plot.look}`, stub(plot)]]));
const find = (root, name) => {
  let hit = null;
  root.traverse((o) => o.name === name && (hit = o));
  return hit;
};

describe('neighbour house stand-in (AC-6.7, AC-6.9)', () => {
  for (const plot of [near, far]) {
    it(`is a plain 8 by 5 block at the house position, ${plot.id}`, () => {
      const h = plotHouse(plot);
      const g = buildNeighbourHouse(THREE, none, plot);
      expect(g.userData.plain).toBe('house');
      expect(g.userData.kind).toBe('house');
      expect(g.userData.neighbour).toBe(true);
      expect(g.userData.noPick).toBe(true);
      expect(g.position.x).toBeCloseTo(h.x);
      expect(g.position.z).toBeCloseTo(h.z);
      expect(g.rotation.y).toBeCloseTo(h.rot);
      const size = new THREE.Box3()
        .setFromObject(g)
        .getSize(new THREE.Vector3());
      expect(size.y).toBeCloseTo(h.floors * HOUSE_SIZE.floorHeight);
      const [a, b] = [size.x, size.z].sort((p, q) => q - p);
      expect(a).toBeCloseTo(8);
      expect(b).toBeCloseTo(5);
      const mesh = g.children[0];
      expect(mesh.material.color.getHexString()).toBe(
        new THREE.Color(plot.tint).getHexString(),
      );
    });
  }
});

describe('finished neighbour house (FR-4, FR-5, FR-14)', () => {
  for (const plot of [near, far]) {
    describe(plot.id, () => {
      const assets = withModel(plot);
      const g = buildNeighbourHouse(THREE, assets, plot);
      const h = plotHouse(plot);

      it('sits at the house position and rotation, as scenery', () => {
        expect(g.userData.plain).toBeUndefined();
        expect(g.userData.kind).toBe('house');
        expect(g.userData.neighbour).toBe(true);
        expect(g.userData.noPick).toBe(true);
        expect(g.position.x).toBeCloseTo(h.x);
        expect(g.position.z).toBeCloseTo(h.z);
        expect(g.rotation.y).toBeCloseTo(h.rot);
      });
      it('swaps the materials by name', () => {
        expect(find(g, 'Render').material.color.getHexString()).toBe(
          new THREE.Color(plot.tint).getHexString(),
        );
        expect(find(g, 'Window').material.opacity).toBe(1);
        expect(find(g, 'Window').material.transparent).toBe(false);
        expect(find(g, 'Window').material.color.getHexString()).toBe('1c2630');
        expect(find(g, 'Roof').material.side).toBe(THREE.DoubleSide);
        expect(find(g, 'Door').material.name).toBe('');
        expect(find(g, 'Brick').material.name).toBe('');
        expect(find(g, 'Trim').material.color.getHexString()).toBe('efe6d4');
      });
      it('has no door controller parts', () => {
        let parts = 0;
        g.traverse((o) => o.userData.part && parts++);
        expect(parts).toBe(0);
        expect(g.userData.door).toBeUndefined();
      });
      it('puts the door on the gate x', () => {
        g.updateMatrixWorld(true);
        const door = find(g, 'Door').getWorldPosition(new THREE.Vector3());
        expect(door.x).toBeCloseTo(plot.gateX, 5);
      });
      it('does not touch the model it was given', () => {
        const model = stub(plot);
        finishNeighbourHouse(THREE, none, plot, model);
        expect(find(model.scene, 'Render').material.name).toBe('Render');
      });
    });
  }

  it('has the same footprint as the stand-in', () => {
    const a = new THREE.Box3().setFromObject(
      buildNeighbourHouse(THREE, none, near),
    );
    const h = plotHouse(near);
    expect(a.min.x).toBeCloseTo(h.footprint.minX);
    expect(a.max.x).toBeCloseTo(h.footprint.maxX);
    expect(a.min.z).toBeCloseTo(h.footprint.minZ);
    expect(a.max.z).toBeCloseTo(h.footprint.maxZ);
  });
});

describe('buildWorld with the neighbour houses', () => {
  it('draws a stand-in for every visible plot when no house file is loaded', () => {
    const world = buildWorld(
      THREE,
      none,
      { hair: 'brown', clothing: 'mustard' },
      { withCharacter: false },
    );
    const blocks = world.group.children.filter(
      (c) => c.userData.neighbour && c.userData.plain === 'house',
    );
    expect(blocks.length).toBe(visiblePlots().length);
    for (const b of blocks) expect(world.pickables).not.toContain(b);
  });
});
