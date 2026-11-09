import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { makeAssets } from '../src/world/builders/common.js';
import { buildPlotScenery } from '../src/world/builders/plots.js';
import { buildWorld } from '../src/world/buildWorld.js';
import { PLOTS, plotFences, plotPath, plotGarden } from '../src/world/plots.js';
import { SOLIDS } from '../src/world/layout.js';
import { fencePosts } from '../src/logic/fenceLine.js';
import { slabGrid } from '../src/logic/slabs.js';

const none = makeAssets(new Map());
const kids = (g, kind) => g.children.filter((c) => c.userData.kind === kind);
const parts = (root, name) => {
  let n = 0;
  root.traverse((o) => {
    if (o.userData.part === name) n++;
  });
  return n;
};
const near = PLOTS.find((p) => p.id === 'near-left');
const far = PLOTS.find((p) => p.id === 'far-1');

describe('plot scenery (FR-3, FR-6, FR-10)', () => {
  for (const plot of PLOTS) {
    describe(plot.id, () => {
      const g = buildPlotScenery(THREE, none, plot, { gardens: 'on' });
      const pieces = plotFences(plot);

      it('is flagged as neighbour scenery a click passes through', () => {
        expect(g.userData.neighbour).toBe(true);
        expect(g.userData.noPick).toBe(true);
      });
      it('draws every fence piece with its posts, two rails, 1 m high', () => {
        const fences = pieces.filter((p) => p.kind === 'fence');
        const drawn = kids(g, 'fence');
        expect(drawn.length).toBe(fences.length);
        drawn.forEach((f, i) => {
          expect(parts(f, 'post')).toBe(fencePosts(fences[i]).length);
          expect(parts(f, 'rail')).toBe(2);
          expect(new THREE.Box3().setFromObject(f).max.y).toBeCloseTo(1, 5);
        });
      });
      it('draws one gate at the gate piece', () => {
        const gate = pieces.find((p) => p.kind === 'gate');
        const gates = kids(g, 'gate');
        expect(gates.length).toBe(1);
        expect(gates[0].position.x).toBe(gate.x);
        expect(gates[0].position.z).toBe(gate.z);
        expect(parts(gates[0], 'rail')).toBe(2);
        expect(parts(gates[0], 'brace')).toBe(1);
      });
      it('draws a 1.2 m slab path, 2 across, from the gate to the door', () => {
        const path = plotPath(plot);
        const slab = kids(g, 'slab')[0];
        expect(slab.position.x).toBe(plot.gateX);
        expect(slab.position.z).toBeCloseTo(path.z0, 9);
        const mesh = slab.children.find((c) => c.isInstancedMesh);
        const grid = slabGrid({ width: 1.2, length: path.length });
        expect(grid.across).toBe(2);
        expect(mesh.count).toBe(grid.slabs.length);
        // whole slabs at the gate end (local z = 0), the partial row last (door end)
        const m = new THREE.Matrix4();
        const s = new THREE.Vector3();
        mesh.getMatrixAt(0, m);
        s.setFromMatrixScale(m);
        expect(s.z).toBeCloseTo(0.3 - 0.02, 6);
        // the far end of the strip, in world space, is the door
        slab.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(slab);
        const doorZ = plotPath(plot).z1;
        const awayFromGate = plot.side === 'near' ? box.min.z : box.max.z;
        expect(awayFromGate).toBeCloseTo(doorZ, 1);
      });
    });
  }

  it('runs the path toward -z for a near plot and +z for a far plot', () => {
    const zOf = (plot) => {
      const g = buildPlotScenery(THREE, none, plot, { gardens: 'off' });
      return new THREE.Box3().setFromObject(kids(g, 'slab')[0]);
    };
    const n = zOf(near);
    expect(n.max.z).toBeCloseTo(plotPath(near).z0, 1);
    expect(n.min.z).toBeCloseTo(plotPath(near).z1, 1);
    const f = zOf(far);
    expect(f.min.z).toBeCloseTo(plotPath(far).z0, 1);
    expect(f.max.z).toBeCloseTo(plotPath(far).z1, 1);
  });

  it('draws the garden objects when gardens is on', () => {
    const g = buildPlotScenery(THREE, none, near, { gardens: 'on' });
    const garden = plotGarden(near);
    for (const kind of ['tree', 'bush', 'hedge', 'furniture'])
      expect(kids(g, kind).length, kind).toBe(
        garden.items.filter((i) => i.kind === kind).length,
      );
    expect(kids(g, 'flower-bed').length).toBe(garden.beds.length);
  });
  it('leaves the garden out when gardens is off but keeps fences, gate and path', () => {
    const g = buildPlotScenery(THREE, none, near, { gardens: 'off' });
    for (const kind of ['tree', 'bush', 'hedge', 'furniture', 'flower-bed'])
      expect(kids(g, kind).length, kind).toBe(0);
    expect(kids(g, 'fence').length).toBeGreaterThan(0);
    expect(kids(g, 'gate').length).toBe(1);
    expect(kids(g, 'slab').length).toBe(1);
  });
  it('keeps the sway function of a tree that has a model', () => {
    const scene = new THREE.Group();
    scene.add(new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1)));
    const assets = makeAssets(
      new Map([
        ['tree-round', { scene }],
        ['tree-pine', { scene }],
      ]),
    );
    const g = buildPlotScenery(THREE, assets, near, { gardens: 'on' });
    expect(kids(g, 'tree').some((t) => t.userData.update)).toBe(true);
  });
  it('does not touch SOLIDS (AC-1.7)', () => {
    const before = SOLIDS.length;
    for (const plot of PLOTS) buildPlotScenery(THREE, none, plot);
    expect(SOLIDS.length).toBe(before);
    const ids = new Set(SOLIDS.map((s) => s.id));
    for (const plot of PLOTS) {
      const garden = plotGarden(plot);
      for (const o of [...garden.items, ...garden.beds])
        expect(ids.has(o.id)).toBe(false);
    }
  });
});

describe('buildWorld with the plots (AC-1.8)', () => {
  const colours = { hair: 'brown', clothing: 'mustard' };
  it('adds the scenery of every visible plot, leaves SOLIDS alone and picks none of it', () => {
    const before = SOLIDS.length;
    const world = buildWorld(THREE, none, colours, { withCharacter: false });
    expect(SOLIDS.length).toBe(before);
    const scenery = world.group.children.filter((c) => c.userData.neighbour);
    expect(scenery.map((c) => c.userData.plotId)).toEqual(
      PLOTS.map((p) => p.id),
    );
    for (const s of scenery) expect(world.pickables).not.toContain(s);
  });
});
