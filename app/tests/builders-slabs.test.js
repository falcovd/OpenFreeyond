import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { makeAssets } from '../src/world/builders/common.js';
import { buildSlabs } from '../src/world/builders/slabs.js';
import { buildPath } from '../src/world/builders/ground.js';
import { PATH } from '../src/world/layout.js';

const none = makeAssets(new Map());
const opts = {
  width: 1.2,
  length: 16,
  texture: 'paving',
  fallback: '#b9b3a8',
  kind: 'slab',
};
const parts = (g) => ({
  under: g.children[0],
  slabs: g.children[1],
});
const matrixOf = (mesh, i) => {
  const m = new THREE.Matrix4();
  mesh.getMatrixAt(i, m);
  const p = new THREE.Vector3();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  m.decompose(p, q, s);
  return { p, s };
};

describe('buildSlabs (FR-6, AC-3.1)', () => {
  const g = buildSlabs(THREE, none, opts);
  const { under, slabs } = parts(g);
  it('has an underlay of the strip size and one instance per slab', () => {
    expect(g.userData.kind).toBe('slab');
    expect(under.geometry.parameters.width).toBeCloseTo(1.2);
    expect(under.geometry.parameters.height).toBeCloseTo(16);
    expect(slabs.isInstancedMesh).toBe(true);
    expect(slabs.count).toBe(108);
  });
  it('keeps every instance inside the strip', () => {
    for (let i = 0; i < slabs.count; i++) {
      const { p, s } = matrixOf(slabs, i);
      expect(p.x - s.x / 2).toBeGreaterThanOrEqual(-0.6 - 1e-6);
      expect(p.x + s.x / 2).toBeLessThanOrEqual(0.6 + 1e-6);
      expect(p.z - s.z / 2).toBeGreaterThanOrEqual(-1e-6);
      expect(p.z + s.z / 2).toBeLessThanOrEqual(16 + 1e-6);
    }
  });
  it('has whole slabs along both long sides and the partial row at the far end', () => {
    const ws = new Set();
    let partial = 0;
    for (let i = 0; i < slabs.count; i++) {
      const { p, s } = matrixOf(slabs, i);
      ws.add(s.x.toFixed(3));
      if (s.z < 0.28) {
        partial++;
        expect(p.z).toBeGreaterThan(15.8);
      }
    }
    expect([...ws]).toEqual(['0.580']);
    expect(partial).toBe(2);
  });
  it('gives each slab a colour that is never near black', () => {
    expect(slabs.instanceColor).toBeTruthy();
    expect(slabs.instanceColor.count).toBe(108);
    for (const v of slabs.instanceColor.array)
      expect(v).toBeGreaterThanOrEqual(0.9);
  });
  it('uses a plain colour without a texture and the map with one', () => {
    expect(slabs.material.map).toBeNull();
    expect(slabs.material.color.getHexString()).toBe('b9b3a8');
    const tex = new THREE.Texture();
    const withTex = buildSlabs(
      THREE,
      makeAssets(new Map([['paving', tex]])),
      opts,
    );
    expect(parts(withTex).slabs.material.map).not.toBeNull();
  });
});

describe('buildPath as slabs (AC-3.5)', () => {
  it('runs from the gate (whole slabs) back to the door (partial row)', () => {
    const p = buildPath(THREE, none);
    p.updateMatrixWorld(true);
    const slabs = parts(p).slabs;
    const m = new THREE.Matrix4();
    const zs = { whole: [], partial: [] };
    for (let i = 0; i < slabs.count; i++) {
      slabs.getMatrixAt(i, m);
      m.premultiply(p.matrixWorld);
      const pos = new THREE.Vector3().setFromMatrixPosition(m);
      const s = new THREE.Vector3().setFromMatrixScale(m);
      (s.z < 0.28 ? zs.partial : zs.whole).push(pos.z);
      expect(Math.abs(pos.x - PATH.x)).toBeLessThan(0.6);
    }
    expect(Math.max(...zs.whole)).toBeGreaterThan(PATH.z1 - 0.3);
    expect(Math.max(...zs.partial)).toBeLessThan(PATH.z0 + 0.3);
  });
});
