import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { makeAssets } from '../src/world/builders/common.js';
import { createNeighbourhood } from '../src/world/neighbourhood.js';
import { buildWorld } from '../src/world/buildWorld.js';
import { visiblePlots, plotHouse } from '../src/world/plots.js';
import { CARS, LAMPS } from '../src/world/streetLayout.js';
import { SOLIDS } from '../src/world/layout.js';
import { HOUSE_SIZE } from '../src/world/houseLooks.js';
import { buildBackdrop } from '../src/world/builders/backdrop.js';

const stub = (w = 8, h = 5, d = 5) => {
  const scene = new THREE.Group();
  scene.add(new THREE.Mesh(new THREE.BoxGeometry(w, h, d)));
  return { scene };
};
const none = () => makeAssets(new Map());
const nodes = (g) => g.children;
const houses = (g) => g.children.filter((c) => c.userData.kind === 'house');
const plain = (g, kind) =>
  g.children.filter((c) => c.userData.kind === kind && c.userData.plain);

describe('the backdrop in the registry (FR-9, AC-4.7, AC-6.15)', () => {
  const horizon = '#cfe6f5';
  const setup = (assets = none()) => {
    const hood = createNeighbourhood(THREE, assets);
    const parent = new THREE.Group();
    hood.register({
      id: 'backdrop',
      parent,
      neighbour: false,
      node: buildBackdrop(THREE, assets, { horizon }),
      build: (tex) =>
        buildBackdrop(THREE, makeAssets(new Map([['backdrop', tex]])), {
          horizon,
        }),
    });
    return { hood, parent };
  };
  const band = (parent) =>
    parent.children.find((c) => c.userData.kind === 'backdrop');

  it('stands as a plain band first and gets the picture when the texture arrives late', () => {
    const { hood, parent } = setup();
    expect(band(parent).userData.plain).toBe('backdrop');
    const tex = new THREE.Texture();
    hood.replace('backdrop', tex);
    const now = band(parent);
    expect(
      parent.children.filter((c) => c.userData.kind === 'backdrop'),
    ).toHaveLength(1);
    expect(now.userData.plain).toBeUndefined();
    expect(now.material.map).toBe(tex);
    expect(now.userData.noPick).toBe(true);
    expect(now.castShadow).toBe(false);
  });
  it('keeps the plain band when the file fails or arrives after dispose', () => {
    const a = setup();
    a.hood.fail('backdrop');
    expect(band(a.parent).userData.plain).toBe('backdrop');
    const b = setup();
    b.hood.dispose();
    b.hood.replace('backdrop', new THREE.Texture());
    expect(band(b.parent).userData.plain).toBe('backdrop');
  });
  it('buildWorld stands a plain backdrop in the world without assets (AC-4.7)', () => {
    const { group } = buildWorld(
      THREE,
      none(),
      { shirt: '#fff', trousers: '#000' },
      { withCharacter: false },
    );
    const b = group.children.filter((c) => c.userData.kind === 'backdrop');
    expect(b).toHaveLength(1);
    expect(b[0].userData.plain).toBe('backdrop');
    expect(group.children.includes(b[0])).toBe(true);
  });
});

describe('createNeighbourhood (FR-14)', () => {
  it('starts with a stand-in for every house, car and lamp, at its final place', () => {
    const { group } = createNeighbourhood(THREE, none());
    expect(houses(group)).toHaveLength(visiblePlots().length);
    expect(plain(group, 'car')).toHaveLength(CARS.length);
    expect(plain(group, 'lamp')).toHaveLength(LAMPS.length);
    for (const plot of visiblePlots()) {
      const h = plotHouse(plot);
      const node = houses(group).find(
        (n) => n.position.x === h.x && n.position.z === h.z,
      );
      expect(node?.userData.plain).toBe('house');
      const size = new THREE.Box3()
        .setFromObject(node)
        .getSize(new THREE.Vector3());
      expect(size.y).toBeCloseTo(h.floors * HOUSE_SIZE.floorHeight);
    }
  });

  it('replaces every house that shares the file, and disposes the stand-ins', () => {
    const hood = createNeighbourhood(THREE, none());
    const plots = visiblePlots();
    const look = plots[0].look;
    const sharing = plots.filter((p) => p.look === look);
    const before = houses(hood.group).filter(
      (h) => h.userData.plain === 'house',
    );
    const geoms = before.map((h) => h.children[0].geometry);
    let disposed = 0;
    for (const g of geoms) g.addEventListener('dispose', () => disposed++);
    hood.replace(`house-${look}`, stub());
    const now = houses(hood.group);
    expect(now).toHaveLength(plots.length);
    expect(now.filter((h) => !h.userData.plain)).toHaveLength(sharing.length);
    expect(disposed).toBe(sharing.length);
    for (const h of now.filter((n) => !n.userData.plain)) {
      expect(h.userData.neighbour).toBe(true);
      expect(h.userData.noPick).toBe(true);
    }
    // the finished houses stand where the stand-ins stood
    for (const p of sharing) {
      const hh = plotHouse(p);
      expect(
        now.some(
          (n) =>
            !n.userData.plain && n.position.x === hh.x && n.position.z === hh.z,
        ),
      ).toBe(true);
    }
  });

  it('replaces cars of one model and the lamps, with shadows set on the new node', () => {
    const hood = createNeighbourhood(THREE, none());
    const model = CARS[0].model;
    const using = CARS.filter((c) => c.model === model).length;
    hood.replace(model, stub(4, 1, 2));
    expect(plain(hood.group, 'car')).toHaveLength(CARS.length - using);
    hood.replace('lamp', stub(1, 4, 1));
    expect(plain(hood.group, 'lamp')).toHaveLength(0);
    const lamp = hood.group.children.find(
      (c) => c.userData.kind === 'lamp' && c.userData.neighbour,
    );
    expect(lamp.userData.neighbour).toBe(true);
    let cast = false;
    lamp.traverse((o) => o.isMesh && (cast ||= o.castShadow));
    expect(cast).toBe(true);
  });

  it('keeps the stand-ins when a file fails', () => {
    const hood = createNeighbourhood(THREE, none());
    const n = nodes(hood.group).length;
    hood.fail('lamp');
    hood.fail('house-brick-pitched');
    expect(plain(hood.group, 'lamp')).toHaveLength(LAMPS.length);
    expect(nodes(hood.group)).toHaveLength(n);
  });

  it('does nothing when a file arrives after dispose', () => {
    const hood = createNeighbourhood(THREE, none());
    hood.dispose();
    hood.replace('lamp', stub());
    expect(plain(hood.group, 'lamp')).toHaveLength(LAMPS.length);
  });

  it('leaves a part with no file in the manifest as a stand-in (nothing replaces it)', () => {
    const hood = createNeighbourhood(THREE, none());
    hood.replace('nothing-here', stub());
    expect(plain(hood.group, 'car')).toHaveLength(CARS.length);
  });

  it('a failing finish leaves the stand-ins and throws, so the loader reports a failure', () => {
    const hood = createNeighbourhood(THREE, none());
    expect(() => hood.replace('lamp', null)).toThrow();
    expect(plain(hood.group, 'lamp')).toHaveLength(LAMPS.length);
  });

  it('accepts later parts through register (the backdrop of Task 9)', () => {
    const hood = createNeighbourhood(THREE, none(), {
      plots: [],
      cars: [],
      lamps: [],
    });
    const node = new THREE.Group();
    node.userData.plain = 'backdrop';
    hood.register({
      id: 'backdrop',
      node,
      build: () => new THREE.Group(),
    });
    hood.replace('backdrop', {});
    expect(hood.group.children).toHaveLength(1);
    expect(hood.group.children[0]).not.toBe(node);
  });
});

describe('buildWorld with the neighbourhood (AC-6.18)', () => {
  it('with empty assets builds our fence, gate, street and every stand-in, and leaves SOLIDS alone', () => {
    const before = JSON.stringify(SOLIDS);
    const w = buildWorld(
      THREE,
      none(),
      { hair: 'brown', clothing: 'mustard' },
      {
        withCharacter: false,
      },
    );
    expect(JSON.stringify(SOLIDS)).toBe(before);
    expect(w.neighbourhood.group.parent).toBe(w.group);
    expect(houses(w.neighbourhood.group)).toHaveLength(visiblePlots().length);
    expect(w.pickables).not.toContain(w.neighbourhood.group);
    const kinds = new Set();
    w.group.traverse((o) => o.userData.kind && kinds.add(o.userData.kind));
    for (const k of ['fence', 'gate', 'street', 'house', 'car', 'lamp'])
      expect(kinds.has(k), k).toBe(true);
  });
});
