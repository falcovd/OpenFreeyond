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

  describe('car body colour, direction and lamp sides (FR-7, FR-8)', () => {
    const carModel = (w = 4.43, h = 1.24, d = 1.9) => {
      const scene = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshStandardMaterial({ name: 'Body', color: '#4a6ea3' }),
      );
      const wheel = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.2, 0.2),
        new THREE.MeshStandardMaterial({ name: 'Black', color: '#111111' }),
      );
      scene.add(body, wheel);
      return { scene, body, wheel };
    };
    const materials = (g) => {
      const list = [];
      g.traverse((o) => o.material && list.push(o.material));
      return list;
    };
    const car = { ...CARS[0], model: 'car-1' };

    it('the Body material takes the car colour; other materials are untouched', () => {
      const m = carModel();
      const g = buildCar(THREE, makeAssets(new Map([['car-1', m]])), {
        ...car,
        colour: '#c0392b',
      });
      const ms = materials(g);
      const body = ms.find((x) => x.name === 'Body');
      expect(body.color.getHexString()).toBe('c0392b');
      expect(ms.find((x) => x.name === 'Black').color.getHexString()).toBe(
        '111111',
      );
    });
    it('two cars of one model with different colours do not share a material, and the cached model is not changed', () => {
      const m = carModel();
      const assets = makeAssets(new Map([['car-1', m]]));
      const a = buildCar(THREE, assets, { ...car, colour: '#c0392b' });
      const b = buildCar(THREE, assets, { ...car, colour: '#2e7d32' });
      const ba = materials(a).find((x) => x.name === 'Body');
      const bb = materials(b).find((x) => x.name === 'Body');
      expect(ba).not.toBe(bb);
      expect(ba.color.getHexString()).toBe('c0392b');
      expect(bb.color.getHexString()).toBe('2e7d32');
      expect(m.body.material.color.getHexString()).toBe('4a6ea3');
      expect(ba).not.toBe(m.body.material);
    });
    it('without a model the plain block has the car colour', () => {
      const g = buildCar(THREE, none, { ...car, colour: '#c0392b' });
      expect(materials(g)[0].color.getHexString()).toBe('c0392b');
    });
    it('a far-side car (rot PI) faces the other way than a near-side car', () => {
      const m = carModel();
      m.body.position.x = 0.5; // a nose that sticks out toward +x
      const assets = makeAssets(new Map([['car-1', m]]));
      const wheelX = (c) => {
        const g = buildCar(THREE, assets, c);
        g.updateMatrixWorld(true);
        let w;
        g.traverse((o) => o.material?.name === 'Black' && (w = o));
        const wp = w.getWorldPosition(new THREE.Vector3());
        return wp.x - g.position.x;
      };
      m.wheel.position.x = 1; // the wheel mark sits toward +x
      const near = wheelX({ ...car, rot: 0 });
      const far = wheelX({ ...car, rot: Math.PI });
      expect(near).toBeGreaterThan(0);
      expect(far).toBeLessThan(0);
    });
    it('buildLamp turns the lamp by lamp.rot; a far lamp stands on the far sidewalk top', () => {
      const m = carModel(0.33, 4.5, 1.66);
      m.wheel.position.z = 0.8;
      const assets = makeAssets(new Map([['lamp', m]]));
      const zOf = (lamp) => {
        const g = buildLamp(THREE, assets, lamp);
        g.updateMatrixWorld(true);
        let w;
        g.traverse((o) => o.material?.name === 'Black' && (w = o));
        return {
          g,
          dz: w.getWorldPosition(new THREE.Vector3()).z - g.position.z,
        };
      };
      const near = zOf({ ...LAMPS[0], rot: 0 });
      const far = zOf({ ...LAMPS[0], rot: Math.PI });
      expect(near.dz).toBeGreaterThan(0);
      expect(far.dz).toBeLessThan(0);
      const farLamp = LAMPS.find((l) => l.rot === Math.PI);
      expect(farLamp).toBeDefined();
      expect(buildLamp(THREE, assets, farLamp).position.y).toBe(
        STREET.farSidewalk.top,
      );
      expect(buildLamp(THREE, none, farLamp).position.y).toBe(
        STREET.farSidewalk.top,
      );
    });
    it('no emissive, no animation, no light on the cars', () => {
      const assets = makeAssets(new Map([['car-1', carModel()]]));
      for (const g of [
        buildCar(THREE, assets, car),
        buildCar(THREE, none, car),
      ])
        for (const o of all(g)) {
          expect(o.userData.update).toBeUndefined();
          expect(o.isLight).toBeFalsy();
          for (const mat of [o.material].flat().filter(Boolean))
            expect(mat.emissive?.getHex() ?? 0).toBe(0);
        }
    });
    it('the stand-in block box equals the model box', () => {
      const assets = makeAssets(
        new Map([['car-1', carModel(car.w, car.h, car.d)]]),
      );
      const box = (g) => new THREE.Box3().setFromObject(g);
      const a = box(buildCar(THREE, assets, car));
      const b = box(buildCar(THREE, none, car));
      for (const k of ['min', 'max'])
        for (const ax of ['x', 'y', 'z'])
          expect(a[k][ax]).toBeCloseTo(b[k][ax], 3);
    });
  });
});
