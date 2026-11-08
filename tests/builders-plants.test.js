// @vitest-environment node
import { readFileSync } from 'node:fs';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { makeAssets, fitToHeight } from '../src/world/builders/common.js';
import {
  buildTree,
  buildBush,
  buildHedge,
  buildFlowerBed,
} from '../src/world/builders/plants.js';
import { SOLIDS, FLOWER_BEDS } from '../src/world/layout.js';

const tree = SOLIDS.find((s) => s.kind === 'tree');
const fakeGltf = () => {
  const scene = new THREE.Group();
  scene.add(
    new THREE.Mesh(
      new THREE.BoxGeometry(1, 2, 1),
      new THREE.MeshStandardMaterial(),
    ),
  );
  return { scene };
};

describe('trees (FR-6)', () => {
  it('stands a loaded model at the solid, scaled to its height', () => {
    const t = buildTree(
      THREE,
      makeAssets(
        new Map([
          ['tree-round', fakeGltf()],
          ['tree-pine', fakeGltf()],
        ]),
      ),
      tree,
    );
    expect(t.position.x).toBe(tree.x);
    expect(t.userData.plain).toBeUndefined();
    const box = new THREE.Box3().setFromObject(t);
    expect(box.max.y - box.min.y).toBeCloseTo(tree.h, 1);
  });
  it('puts a plain block with the solid footprint in place of a failed model (AC-8.5)', () => {
    const t = buildTree(THREE, makeAssets(new Map()), tree);
    expect(t.userData.plain).toBeDefined();
    const box = new THREE.Box3().setFromObject(t);
    expect(box.max.x - box.min.x).toBeCloseTo(tree.w);
  });
  it('sways gently (AC-7.1): under 1 degree', () => {
    const t = buildTree(
      THREE,
      makeAssets(
        new Map([
          ['tree-round', fakeGltf()],
          ['tree-pine', fakeGltf()],
        ]),
      ),
      tree,
    );
    let max = 0;
    for (let s = 0; s < 20; s += 0.25) {
      t.userData.update(s);
      max = Math.max(max, Math.abs(t.rotation.z));
    }
    expect(max).toBeGreaterThan(0);
    expect(max).toBeLessThan((1 * Math.PI) / 180);
  });
  it('does not sway when it is a plain block', () => {
    const t = buildTree(THREE, makeAssets(new Map()), tree);
    expect(t.userData.update).toBeUndefined();
  });
});

describe('bushes, hedge, flower beds (FR-7)', () => {
  const bush = SOLIDS.find((s) => s.kind === 'bush');
  const hedge = SOLIDS.find((s) => s.kind === 'hedge');
  it('draws a bush from the model, or a plain block when it failed', () => {
    expect(
      buildBush(THREE, makeAssets(new Map([['bush', fakeGltf()]])), bush)
        .userData.plain,
    ).toBeUndefined();
    expect(
      buildBush(THREE, makeAssets(new Map()), bush).userData.plain,
    ).toBeDefined();
  });
  it('draws a hedge longer than it is tall, with or without the texture', () => {
    for (const assets of [
      makeAssets(new Map()),
      makeAssets(new Map([['grass', new THREE.Texture()]])),
    ]) {
      const box = new THREE.Box3().setFromObject(
        buildHedge(THREE, assets, hedge),
      );
      expect(box.max.x - box.min.x).toBeGreaterThan(box.max.y - box.min.y);
    }
  });
  it('draws flowers on every flower bed, and the bed has no collision data', () => {
    for (const bed of FLOWER_BEDS) {
      const g = buildFlowerBed(THREE, bed);
      expect(g.children.length).toBeGreaterThan(10);
      expect(g.userData.kind).toBe('flower-bed');
    }
  });
});

// Skipped: GLTFLoader decodes the embedded textures with browser image APIs
// (self, createImageBitmap), which node and jsdom do not have.
describe.skip('real model files', () => {
  const cases = [
    ['tree-round', 6],
    ['tree-pine', 7],
    ['bush', 1.2],
  ];
  it.each(cases)(
    'fits %s to the requested height on y = 0',
    async (name, height) => {
      const file = readFileSync(
        new URL(`../public/assets/models/${name}.glb`, import.meta.url),
      );
      const data = file.buffer.slice(
        file.byteOffset,
        file.byteOffset + file.byteLength,
      );
      const gltf = await new Promise((resolve, reject) =>
        new GLTFLoader().parse(data, '', resolve, reject),
      );
      const wrapper = fitToHeight(THREE, gltf.scene, height);
      const box = new THREE.Box3().setFromObject(wrapper);
      expect(box.max.y - box.min.y).toBeCloseTo(height, 3);
      expect(box.min.y).toBeCloseTo(0, 3);
    },
  );
});
