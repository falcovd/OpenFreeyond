import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { makeAssets } from '../src/world/builders/common.js';
import { buildHouse } from '../src/world/builders/house.js';
import { HOUSE, DOOR } from '../src/world/layout.js';

const count = (root, kind) => {
  let n = 0;
  root.traverse((o) => {
    if (o.userData.part === kind) n++;
  });
  return n;
};
const textures = () =>
  makeAssets(
    new Map(['brick', 'roof', 'wood'].map((id) => [id, new THREE.Texture()])),
  );

describe('house (FR-9, FR-10)', () => {
  const house = buildHouse(THREE, textures());
  it('has walls, a sloped roof, one door and at least 4 windows on the garden side (AC-4.1)', () => {
    expect(count(house, 'walls')).toBe(1);
    expect(count(house, 'roof')).toBe(1);
    expect(count(house, 'door')).toBe(1);
    expect(count(house, 'window')).toBeGreaterThanOrEqual(4);
  });
  it('puts the door and every window on the garden side', () => {
    house.updateMatrixWorld(true);
    house.traverse((o) => {
      if (o.userData.part === 'door' || o.userData.part === 'window') {
        const p = new THREE.Vector3().setFromMatrixPosition(o.matrixWorld);
        expect(p.z).toBeGreaterThan(HOUSE.z + HOUSE.d / 2 - 0.2);
      }
    });
  });
  it('has the door at the door position', () => {
    house.updateMatrixWorld(true);
    let door;
    house.traverse((o) => {
      if (o.userData.part === 'door') door = o;
    });
    expect(
      new THREE.Vector3().setFromMatrixPosition(door.matrixWorld).x,
    ).toBeCloseTo(DOOR.x);
  });
  it('fits inside the footprint plus the roof overhang and slopes', () => {
    const box = new THREE.Box3().setFromObject(house);
    expect(box.max.x - box.min.x).toBeLessThanOrEqual(HOUSE.w + 1.2);
    const roof = [];
    house.traverse((o) => {
      if (o.userData.part === 'roof') roof.push(o);
    });
    const b = new THREE.Box3().setFromObject(roof[0]);
    expect(b.max.y - b.min.y).toBeGreaterThan(0.5);
  });
  it('has roof slopes that face up', () => {
    let roof;
    house.traverse((o) => {
      if (o.userData.part === 'roof') roof = o;
    });
    const n = roof.geometry.getAttribute('normal');
    for (let i = 0; i < n.count; i++) expect(n.getY(i)).toBeGreaterThan(0);
  });
  it('is built with plain colours when every texture is missing (FR-16)', () => {
    expect(() => buildHouse(THREE, makeAssets(new Map()))).not.toThrow();
  });
});
