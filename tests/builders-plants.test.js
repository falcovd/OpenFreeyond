// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { makeAssets } from '../src/world/builders/common.js';
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

// GLTFLoader cannot decode textures in node, so the real files get a header check instead.
// A-Frame 1.6.0's bundled GLTFLoader supports these two required extensions, and we use only them.
const ALLOWED_REQUIRED = ['EXT_texture_webp', 'KHR_mesh_quantization'];

function glbJson(name) {
  const buf = readFileSync(
    new URL(`../public/assets/models/${name}.glb`, import.meta.url),
  );
  expect(buf.toString('ascii', 0, 4)).toBe('glTF');
  const length = buf.readUInt32LE(12);
  expect(buf.toString('ascii', 16, 20)).toBe('JSON');
  return JSON.parse(buf.toString('utf8', 20, 20 + length));
}

describe('real model files', () => {
  it.each(['tree-round', 'tree-pine', 'bush'])(
    '%s has a mesh and only extensions the loader supports',
    (name) => {
      const gltf = glbJson(name);
      expect(gltf.meshes?.length).toBeGreaterThan(0);
      for (const ext of gltf.extensionsRequired ?? []) {
        expect(ALLOWED_REQUIRED).toContain(ext);
      }
    },
  );
});
