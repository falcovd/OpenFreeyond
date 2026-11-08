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
      const g = buildFlowerBed(THREE, makeAssets(new Map()), bed);
      expect(g.children.length).toBeGreaterThan(5);
      expect(g.userData.kind).toBe('flower-bed');
    }
  });
});

describe('flower beds look like a mix of real flowers (FR-7)', () => {
  const bed = FLOWER_BEDS[0];
  const none = makeAssets(new Map());
  const parts = (g) =>
    Object.fromEntries(
      g.children
        .filter((c) => c.isInstancedMesh)
        .map((c) => [c.userData.part, c]),
    );
  const matrixOf = (mesh, i) => {
    const m = new THREE.Matrix4();
    mesh.getMatrixAt(i, m);
    return m;
  };
  const colours = (mesh) => {
    const out = new Set();
    const c = new THREE.Color();
    for (let i = 0; i < mesh.count; i++) {
      mesh.getColorAt(i, c);
      out.add(c.getHexString());
    }
    return out;
  };
  const stems = (g) => {
    const mesh = parts(g).stems;
    return Array.from({ length: mesh.count }, (_, i) => {
      const m = matrixOf(mesh, i);
      return {
        p: new THREE.Vector3().setFromMatrixPosition(m),
        s: new THREE.Vector3().setFromMatrixScale(m),
      };
    });
  };

  it('has daisies, tulips and spikes, with stems, leaves and foliage', () => {
    const p = parts(buildFlowerBed(THREE, none, bed));
    for (const part of [
      'stems',
      'leaves',
      'foliage',
      'daisy-petals',
      'daisy-centres',
      'tulips',
      'spike-buds',
    ]) {
      expect(p[part], part).toBeDefined();
      expect(p[part].count, part).toBeGreaterThan(0);
    }
  });
  it('keeps every stem inside the bed', () => {
    for (const { p } of stems(buildFlowerBed(THREE, none, bed))) {
      expect(Math.abs(p.x)).toBeLessThanOrEqual(bed.w / 2);
      expect(Math.abs(p.z)).toBeLessThanOrEqual(bed.d / 2);
      expect(p.y).toBeGreaterThan(0.12); // above the soil
    }
  });
  it('varies the height of the flowers', () => {
    const heights = stems(buildFlowerBed(THREE, none, bed)).map((s) => s.s.y);
    expect(Math.max(...heights) - Math.min(...heights)).toBeGreaterThan(0.12);
  });
  it('uses several colours for tulips and for daisies', () => {
    const p = parts(buildFlowerBed(THREE, none, bed));
    expect(colours(p.tulips).size).toBeGreaterThanOrEqual(2);
    expect(colours(p['daisy-petals']).size).toBeGreaterThanOrEqual(2);
  });
  it('has a wooden border on all four sides that rises above the soil', () => {
    for (const b of FLOWER_BEDS) {
      const g = buildFlowerBed(THREE, none, b);
      const border = g.children.filter((c) => c.userData.part === 'border');
      expect(border).toHaveLength(4);
      const frame = new THREE.Box3();
      for (const board of border) frame.expandByObject(board);
      // The frame surrounds the soil: it is wider and deeper than the bed, and higher than the soil.
      expect(frame.max.x - frame.min.x).toBeGreaterThan(b.w);
      expect(frame.max.z - frame.min.z).toBeGreaterThan(b.d);
      expect(frame.max.y).toBeGreaterThan(0.12);
      // The frame is centred on the bed.
      expect(Math.abs(frame.min.x + frame.max.x)).toBeLessThan(1e-6);
      expect(Math.abs(frame.min.z + frame.max.z)).toBeLessThan(1e-6);
    }
  });
  it('textures the soil and the border when the textures are there (FR-4)', () => {
    const assets = makeAssets(
      new Map([
        ['soil', new THREE.Texture()],
        ['wood', new THREE.Texture()],
      ]),
    );
    const g = buildFlowerBed(THREE, assets, bed);
    const soil = g.children.find((c) => c.userData.part === 'soil');
    expect(soil.material.map).not.toBeNull();
    expect(soil.material.map.repeat.x).toBeGreaterThan(1);
    const boards = g.children.filter((c) => c.userData.part === 'border');
    expect(boards).toHaveLength(4);
    for (const board of boards) expect(board.material.map).not.toBeNull();
  });
  it('uses plain colours for the soil and the border when the textures are missing (FR-16)', () => {
    const g = buildFlowerBed(THREE, none, bed);
    const soil = g.children.find((c) => c.userData.part === 'soil');
    expect(soil.material.map).toBeNull();
    for (const board of g.children.filter((c) => c.userData.part === 'border'))
      expect(board.material.map).toBeNull();
  });
  it('builds the same bed every time, and beds differ from each other', () => {
    const key = (b) =>
      stems(buildFlowerBed(THREE, none, b))
        .map((s) => s.p.toArray().map((n) => n.toFixed(4)))
        .join('|');
    expect(key(FLOWER_BEDS[0])).toBe(key(FLOWER_BEDS[0]));
    expect(key(FLOWER_BEDS[0])).not.toBe(key(FLOWER_BEDS[1]));
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
