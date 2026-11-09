import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { makeAssets } from '../src/world/builders/common.js';
import { buildWorld } from '../src/world/buildWorld.js';
import { SOLIDS, FLOWER_BEDS } from '../src/world/layout.js';
import { visiblePlots } from '../src/world/plots.js';
import { CARS, LAMPS } from '../src/world/streetLayout.js';

const colours = { hair: 'brown', clothing: 'mustard' };
// Counts our own place; the scenery of the other plots (userData.neighbour) is counted separately.
const count = (root, kind, { neighbours = false } = {}) => {
  let n = 0;
  const walk = (o) => {
    if (o.userData.neighbour && !neighbours) return;
    if (o.userData.kind === kind) n++;
    o.children.forEach(walk);
  };
  walk(root);
  return n;
};
const gltf = () => {
  const scene = new THREE.Group();
  scene.add(new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1)));
  return { scene };
};

describe('buildWorld', () => {
  it('with no assets still draws fences, gate, street, and the cars and lamps as plain blocks (AC-6.13)', () => {
    const { group } = buildWorld(THREE, makeAssets(new Map()), colours, {
      withCharacter: false,
    });
    expect(count(group, 'fence')).toBeGreaterThan(0);
    expect(count(group, 'gate')).toBe(1);
    expect(count(group, 'car')).toBe(CARS.length);
    expect(count(group, 'lamp')).toBe(LAMPS.length);
    expect(CARS.length).toBe(8);
    expect(LAMPS.length).toBe(8);
    const plain = [];
    group.traverse((o) => {
      if (o.userData.plain && ['car', 'lamp'].includes(o.userData.kind))
        plain.push(o);
    });
    expect(plain.length).toBe(CARS.length + LAMPS.length);
  });
  it('draws a fence group per fence solid and one gate that clicks pass through', () => {
    const world = buildWorld(THREE, makeAssets(new Map()), colours, {
      withCharacter: false,
    });
    expect(count(world.group, 'fence')).toBe(
      SOLIDS.filter((s) => s.kind === 'fence').length,
    );
    expect(count(world.group, 'gate')).toBe(1);
    expect(world.pickables.some((o) => o.userData.kind === 'gate')).toBe(false);
  });
  it('adds fences, gates and paths for every visible plot, and no cars or lamps from them', () => {
    const { group } = buildWorld(THREE, makeAssets(new Map()), colours, {
      withCharacter: false,
    });
    const n = visiblePlots().length;
    expect(n).toBe(7);
    expect(count(group, 'gate', { neighbours: true })).toBe(1 + n);
    expect(count(group, 'slab', { neighbours: true })).toBe(1 + n);
    expect(count(group, 'fence', { neighbours: true })).toBeGreaterThan(
      count(group, 'fence'),
    );
  });
  it('survives every asset failing (AC-8.4)', () => {
    const world = buildWorld(THREE, makeAssets(new Map()), colours, {
      withCharacter: false,
    });
    expect(count(world.group, 'tree')).toBe(
      SOLIDS.filter((s) => s.kind === 'tree').length,
    );
    expect(count(world.group, 'house')).toBe(1);
  });
  it('draws every solid kind and every flower bed', () => {
    const assets = makeAssets(
      new Map([
        ['tree-round', gltf()],
        ['tree-pine', gltf()],
        ['bush', gltf()],
      ]),
    );
    const { group } = buildWorld(THREE, assets, colours, {
      withCharacter: false,
    });
    for (const kind of ['tree', 'bush', 'hedge', 'fence', 'furniture']) {
      expect(count(group, kind), kind).toBe(
        SOLIDS.filter((s) => s.kind === kind).length,
      );
    }
    expect(count(group, 'flower-bed')).toBe(FLOWER_BEDS.length);
  });
  it('flags trees as casters and the ground as a receiver only', () => {
    const assets = makeAssets(
      new Map([
        ['tree-round', gltf()],
        ['tree-pine', gltf()],
      ]),
    );
    const { group } = buildWorld(THREE, assets, colours, {
      withCharacter: false,
    });
    const meshesOf = (kind) => {
      const out = [];
      group.traverse((o) => {
        if (o.userData.kind === kind)
          o.traverse((m) => m.isMesh && out.push(m));
      });
      return out;
    };
    const trees = meshesOf('tree');
    expect(trees.length).toBeGreaterThan(0);
    for (const m of trees) expect(m.castShadow).toBe(true);
    const ground = meshesOf('ground');
    expect(ground.length).toBeGreaterThan(0);
    for (const m of ground) {
      expect(m.receiveShadow).toBe(true);
      expect(m.castShadow).toBe(false);
    }
  });
  it('has exactly one directional light, the sun of the sky (FR-2, FR-14)', () => {
    const world = buildWorld(THREE, makeAssets(new Map()), colours, {
      withCharacter: false,
    });
    let lights = 0;
    world.group.traverse((o) => {
      if (o.isDirectionalLight) lights++;
    });
    expect(lights).toBe(1);
  });
  it('uses the sky photo when it loaded', () => {
    const tex = new THREE.Texture();
    const world = buildWorld(
      THREE,
      makeAssets(new Map([['sky', tex]])),
      colours,
      { withCharacter: false },
    );
    let mapped = false;
    world.group.traverse((o) => {
      if (o.material?.map === tex) mapped = true;
    });
    expect(mapped).toBe(true);
  });
  it('collects the motion functions of trees and clouds (FR-14)', () => {
    const assets = makeAssets(
      new Map([
        ['tree-round', gltf()],
        ['tree-pine', gltf()],
      ]),
    );
    const { updaters } = buildWorld(THREE, assets, colours, {
      withCharacter: false,
    });
    expect(updaters.length).toBeGreaterThanOrEqual(7); // 6 trees + sky
  });
  it('puts the plain figure in the character spot when the character model is missing (AC-8.4)', () => {
    const world = buildWorld(THREE, makeAssets(new Map()), colours);
    expect(count(world.group, 'character')).toBe(1);
  });
  it('leaves the character to the model entity when the model loaded', () => {
    const world = buildWorld(
      THREE,
      makeAssets(new Map([['character', gltf()]])),
      colours,
    );
    expect(count(world.group, 'character')).toBe(0);
  });
});
