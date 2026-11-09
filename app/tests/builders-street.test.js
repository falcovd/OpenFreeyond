import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { makeAssets } from '../src/world/builders/common.js';
import { buildStreet } from '../src/world/builders/street.js';
import { buildWorld } from '../src/world/buildWorld.js';
import { STREET } from '../src/world/streetLayout.js';

const none = makeAssets(new Map());
const g = buildStreet(THREE, none);
g.updateMatrixWorld(true);
const byKind = (k) => g.children.filter((c) => c.userData.kind === k);
const sizeOf = (o) =>
  new THREE.Box3().setFromObject(o).getSize(new THREE.Vector3());

describe('buildStreet (FR-8, FR-10, FR-11)', () => {
  it('is a street group nobody can click', () => {
    expect(g.userData.kind).toBe('street');
    expect(g.userData.noPick).toBe(true);
  });
  it('has a slab strip of 3 whole slabs across the sidewalk', () => {
    const strip = g.children.find(
      (c) => c.userData.kind === 'street-slab' && c.isGroup,
    );
    const mesh = strip.children[1];
    expect(mesh.isInstancedMesh).toBe(true);
    expect(mesh.count).toBe(3 * 1600);
    expect(strip.children[0].geometry.parameters.width).toBeCloseTo(
      STREET.sidewalk.w,
    );
    expect(strip.children[0].geometry.parameters.height).toBeCloseTo(
      STREET.length,
    );
  });
  it('puts the sidewalk strip at the right world x and z range', () => {
    const strip = g.children.find(
      (c) => c.userData.kind === 'street-slab' && c.isGroup,
    );
    const b = new THREE.Box3().setFromObject(strip.children[0]);
    expect(b.min.x).toBeCloseTo(-STREET.length / 2);
    expect(b.max.x).toBeCloseTo(STREET.length / 2);
    expect(b.min.z).toBeCloseTo(STREET.sidewalk.z0);
    expect(b.max.z).toBeCloseTo(STREET.sidewalk.z1);
    const mesh = strip.children[1];
    const m = new THREE.Matrix4();
    const p = new THREE.Vector3();
    for (const i of [0, 1, 2, mesh.count - 1]) {
      mesh.getMatrixAt(i, m);
      m.premultiply(strip.matrixWorld);
      p.setFromMatrixPosition(m);
      expect(p.x).toBeGreaterThanOrEqual(-STREET.length / 2 - 1e-6);
      expect(p.x).toBeLessThanOrEqual(STREET.length / 2 + 1e-6);
      expect(p.z).toBeGreaterThan(STREET.sidewalk.z0);
      expect(p.z).toBeLessThan(STREET.sidewalk.z1);
      expect(p.y).toBeCloseTo(STREET.sidewalk.top - 0.02);
    }
  });
  it('has a platform under the sidewalk', () => {
    const platform = g.children.find(
      (c) => c.isMesh && c.userData.kind === 'street-slab',
    );
    const s = sizeOf(platform);
    expect(s.x).toBeCloseTo(STREET.length);
    expect(s.z).toBeCloseTo(STREET.sidewalk.w);
    expect(new THREE.Box3().setFromObject(platform).min.y).toBeCloseTo(0);
  });
  it('has a 0.2 by 0.15 curb along the length', () => {
    const [curb] = byKind('curb');
    const s = sizeOf(curb);
    expect(s.x).toBeCloseTo(STREET.length);
    expect(s.y).toBeCloseTo(0.15);
    expect(s.z).toBeCloseTo(0.2);
    expect(new THREE.Box3().setFromObject(curb).min.z).toBeCloseTo(
      STREET.curb.z0,
    );
  });
  it('has a road plane over the road width, with a repeating surface', () => {
    const road = byKind('road').find((o) => !o.isInstancedMesh);
    const b = new THREE.Box3().setFromObject(road);
    expect(b.min.z).toBeCloseTo(STREET.road.z0);
    expect(b.max.z).toBeCloseTo(STREET.road.z1);
    expect(b.max.x - b.min.x).toBeCloseTo(STREET.length);
    expect(b.min.y).toBeCloseTo(0.01);
    const tex = new THREE.Texture();
    const t = buildStreet(THREE, makeAssets(new Map([['asphalt', tex]])));
    const r = t.children.find(
      (o) => o.userData.kind === 'road' && !o.isInstancedMesh,
    );
    expect(r.material.map.repeat.x).toBeCloseTo(STREET.length / 4);
    expect(r.material.map.repeat.y).toBeCloseTo(7 / 4);
  });
  it('has one instanced centre line of 3 m dashes on the road centre', () => {
    const dashes = byKind('road').find((o) => o.isInstancedMesh);
    expect(dashes.count).toBe(STREET.length / 6);
    const m = new THREE.Matrix4();
    const p = new THREE.Vector3();
    dashes.getMatrixAt(0, m);
    p.setFromMatrixPosition(m);
    expect(p.z).toBeCloseTo(STREET.centreLineZ);
    expect(p.x).toBeCloseTo(-STREET.length / 2 + 1.5);
  });
  it('uses plain colours with no textures (AC-6.11)', () => {
    g.traverse((o) => {
      if (o.isMesh) expect(o.material.map).toBeNull();
    });
  });
});

describe('far sidewalk (D-27)', () => {
  const strips = g.children.filter(
    (c) => c.userData.kind === 'street-slab' && c.isGroup,
  );
  const far = strips[1];
  it('has a second slab strip of 3 * 1600 slabs over the far z range', () => {
    expect(strips).toHaveLength(2);
    expect(far.children[1].isInstancedMesh).toBe(true);
    expect(far.children[1].count).toBe(3 * 1600);
    const b = new THREE.Box3().setFromObject(far.children[0]);
    expect(b.min.x).toBeCloseTo(-STREET.length / 2);
    expect(b.max.x).toBeCloseTo(STREET.length / 2);
    expect(b.min.z).toBeCloseTo(STREET.farSidewalk.z0);
    expect(b.max.z).toBeCloseTo(STREET.farSidewalk.z1);
    const m = new THREE.Matrix4();
    const p = new THREE.Vector3();
    for (const i of [0, far.children[1].count - 1]) {
      far.children[1].getMatrixAt(i, m);
      m.premultiply(far.matrixWorld);
      p.setFromMatrixPosition(m);
      expect(p.z).toBeGreaterThan(STREET.farSidewalk.z0);
      expect(p.z).toBeLessThan(STREET.farSidewalk.z1);
    }
  });
  it('has a far platform and a far curb of the right size', () => {
    const platforms = g.children.filter(
      (c) => c.isMesh && c.userData.kind === 'street-slab',
    );
    expect(platforms).toHaveLength(2);
    expect(sizeOf(platforms[1]).z).toBeCloseTo(1.8);
    const curbs = byKind('curb');
    expect(curbs).toHaveLength(2);
    const s = sizeOf(curbs[1]);
    expect(s.y).toBeCloseTo(0.15);
    expect(s.z).toBeCloseTo(0.2);
    expect(new THREE.Box3().setFromObject(curbs[1]).min.z).toBeCloseTo(
      STREET.farCurb.z0,
    );
  });
});

describe('buildWorld with the street', () => {
  it('includes the street and builds with empty assets', () => {
    const { group, pickables } = buildWorld(
      THREE,
      none,
      {},
      { withCharacter: false },
    );
    expect(group.children.some((c) => c.userData.kind === 'street')).toBe(true);
    expect(pickables.some((c) => c.userData.kind === 'street')).toBe(false);
  });
  it('road and centre line have polygon offsets, the dashes pulled further', () => {
    const road = byKind('road');
    const mats = road.map((o) => o.material);
    for (const m of mats) {
      expect(m.polygonOffset).toBe(true);
      expect(m.polygonOffsetFactor).toBeLessThan(0);
    }
    const dash = road.find((o) => o.isInstancedMesh).material;
    const plane = road.find((o) => !o.isInstancedMesh).material;
    expect(dash.polygonOffsetFactor).toBeLessThan(plane.polygonOffsetFactor);
  });
  it('the platform top meets the slab underlay and the sidewalk top stays 0.15', () => {
    const strip = g.children.find(
      (c) => c.userData.kind === 'street-slab' && c.isGroup,
    );
    const under = strip.children[0];
    expect(under.material.polygonOffset).toBe(true);
    const platform = g.children.find(
      (c) => c.userData.kind === 'street-slab' && c.isMesh,
    );
    const platformTop = new THREE.Box3().setFromObject(platform).max.y;
    const underY = new THREE.Box3().setFromObject(under).max.y;
    expect(platformTop).toBeCloseTo(underY);
    expect(STREET.sidewalk.top).toBe(0.15);
  });
});
