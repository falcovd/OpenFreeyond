import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { makeAssets } from '../src/world/builders/common.js';
import { buildCar, buildLamp } from '../src/world/builders/props.js';
import { CARS, LAMPS, STREET } from '../src/world/streetLayout.js';

const stub = () => {
  const scene = new THREE.Group();
  scene.add(new THREE.Mesh(new THREE.BoxGeometry(2, 1, 5)));
  return { scene };
};
const none = makeAssets(new Map());
const all = (g) => {
  const list = [];
  g.traverse((o) => list.push(o));
  return list;
};

describe('buildCar and buildLamp', () => {
  it('with a model: a group at the position, kind car, no plain label, fitted to the box', () => {
    const car = CARS[0];
    const g = buildCar(THREE, makeAssets(new Map([[car.model, stub()]])), car);
    expect(g.position.x).toBe(car.x);
    expect(g.position.z).toBe(car.z);
    expect(g.userData.kind).toBe('car');
    expect(g.userData.plain).toBeUndefined();
    const size = new THREE.Box3().setFromObject(g).getSize(new THREE.Vector3());
    expect(size.x).toBeLessThanOrEqual(car.w + 1e-6);
    expect(size.y).toBeLessThanOrEqual(car.h + 1e-6);
    expect(size.z).toBeLessThanOrEqual(car.d + 1e-6);
  });
  it('every lamp uses the shared model id lamp', () => {
    const assets = makeAssets(new Map([['lamp', stub()]]));
    for (const lamp of LAMPS) {
      const g = buildLamp(THREE, assets, lamp);
      expect(g.userData.kind).toBe('lamp');
      expect(g.userData.plain).toBeUndefined();
      expect(g.position.x).toBe(lamp.x);
    }
  });
  it('lamps stand on the sidewalk top, cars on the road level; nobody can click them', () => {
    const assets = makeAssets(
      new Map([
        ['car-1', stub()],
        ['lamp', stub()],
      ]),
    );
    for (const a of [none, assets]) {
      const lamp = buildLamp(THREE, a, LAMPS[0]);
      const car = buildCar(THREE, a, CARS[0]);
      expect(lamp.position.y).toBe(STREET.sidewalk.top);
      expect(car.position.y).toBe(0);
      expect(lamp.userData.noPick).toBe(true);
      expect(car.userData.noPick).toBe(true);
    }
  });
  it('without a model: a plain block of the right size', () => {
    for (const [item, build, kind] of [
      [CARS[0], buildCar, 'car'],
      [LAMPS[0], buildLamp, 'lamp'],
    ]) {
      const g = build(THREE, none, item);
      expect(g.userData.kind).toBe(kind);
      expect(g.userData.plain).toBe('plain');
      expect(g.position.x).toBe(item.x);
      expect(g.position.z).toBe(item.z);
      const size = new THREE.Box3()
        .setFromObject(g)
        .getSize(new THREE.Vector3());
      expect(size.x).toBeCloseTo(item.w);
      expect(size.y).toBeCloseTo(item.h);
      expect(size.z).toBeCloseTo(item.d);
    }
  });
  it('nothing moves, makes sound or gives light (AC-4.5)', () => {
    const assets = makeAssets(
      new Map([
        ['car-1', stub()],
        ['lamp', stub()],
      ]),
    );
    for (const a of [none, assets]) {
      for (const g of [
        buildCar(THREE, a, CARS[0]),
        buildLamp(THREE, a, LAMPS[0]),
      ]) {
        for (const o of all(g)) {
          expect(o.userData.update).toBeUndefined();
          expect(o.isLight).toBeFalsy();
          expect(o.type).not.toMatch(/Audio/);
        }
      }
    }
  });
});
