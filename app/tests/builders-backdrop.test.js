import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { buildBackdrop, BACKDROP } from '../src/world/builders/backdrop.js';
import { makeAssets } from '../src/world/builders/common.js';
import { PLOTS, visiblePlots } from '../src/world/plots.js';
import { skyParams } from '../src/world/builders/sky.js';

const none = () => makeAssets(new Map());
const HORIZON = '#cfe6f5';
const make = (assets = none()) =>
  buildBackdrop(THREE, assets, { horizon: HORIZON });

describe('buildBackdrop (FR-9, AC-4.4, AC-4.7)', () => {
  it('is an open cylinder of radius 100 m and a height between 15 and 25 m, drawn from the inside', () => {
    const m = make();
    const g = m.geometry;
    expect(g.type).toBe('CylinderGeometry');
    expect(g.parameters.radiusTop).toBe(100);
    expect(g.parameters.radiusBottom).toBe(100);
    expect(g.parameters.height).toBeGreaterThanOrEqual(15);
    expect(g.parameters.height).toBeLessThanOrEqual(25);
    expect(g.parameters.openEnded).toBe(true);
    expect(g.parameters.radialSegments).toBe(128);
    expect(m.material.side).toBe(THREE.BackSide);
  });
  it('stands in the ground, centred on the origin', () => {
    const m = make();
    const box = new THREE.Box3().setFromObject(m);
    expect(box.min.y).toBeCloseTo(-1.6);
    expect(box.max.y).toBeCloseTo(BACKDROP.height - 1.6);
    // the bottom 8% of the picture (its grass strip) is below the ground plane
    expect(-box.min.y / BACKDROP.height).toBeCloseTo(0.08);
    expect(m.position.x).toBe(0);
    expect(m.position.z).toBe(0);
  });
  it('is scenery: kind backdrop, not pickable, no shadows, takes the fog, does not move', () => {
    const m = make();
    expect(m.userData.kind).toBe('backdrop');
    expect(m.userData.noPick).toBe(true);
    expect(m.castShadow).toBe(false);
    expect(m.receiveShadow).toBe(false);
    expect(m.material.fog).toBe(true);
    expect(m.material.transparent).toBe(true);
    expect(m.material.depthWrite).toBe(false);
    expect(m.userData.update).toBeUndefined();
  });
  it('is drawn just above the sky sphere and before the scene', () => {
    expect(make().renderOrder).toBe(0);
  });
  it('is a plain band of the horizon colour until the picture arrives', () => {
    const m = make();
    expect(m.material.map).toBeNull();
    expect(m.material.color.getHexString()).toBe(
      new THREE.Color(HORIZON).getHexString(),
    );
    expect(m.userData.plain).toBe('backdrop');
  });
  it('uses the horizon colour of the sky data (a photo) too', () => {
    const p = skyParams(none());
    const m = buildBackdrop(THREE, none(), { horizon: p.horizon });
    expect(m.material.color.getHexString()).toBe(
      new THREE.Color(p.horizon).getHexString(),
    );
  });
  it('setTexture puts the picture on it, in sRGB, and drops the plain colour', () => {
    const m = make();
    const tex = new THREE.Texture();
    m.userData.setTexture(tex);
    expect(m.material.map).toBe(tex);
    expect(tex.colorSpace).toBe(THREE.SRGBColorSpace);
    expect(tex.repeat.y).toBe(1);
    expect(tex.wrapS).toBe(THREE.RepeatWrapping);
    expect(m.material.color.getHexString()).toBe('ffffff');
    expect(m.userData.plain).toBeUndefined();
    expect(m.material.transparent).toBe(true);
  });
  it('starts with the picture when the assets already have it', () => {
    const tex = new THREE.Texture();
    const m = make(makeAssets(new Map([['backdrop', tex]])));
    expect(m.material.map).toBe(tex);
    expect(m.userData.plain).toBeUndefined();
  });
  it('keeps the picture in proportion: 8 repeats around make each copy 3.9 : 1 like the 4 : 1 picture', () => {
    expect(BACKDROP.repeat).toBe(8);
    const copy = (2 * Math.PI * BACKDROP.radius) / BACKDROP.repeat;
    expect(copy / BACKDROP.height).toBeGreaterThan(3.5);
    expect(copy / BACKDROP.height).toBeLessThan(4.5);
    const m = make();
    const tex = new THREE.Texture();
    m.userData.setTexture(tex);
    expect(tex.repeat.x).toBe(BACKDROP.repeat);
  });
});

describe('the backdrop surrounds the plots (AC-4.3)', () => {
  it('has every corner of every plot, shown or not, inside the radius', () => {
    for (const plot of PLOTS.concat(visiblePlots())) {
      const { minX, maxX, minZ, maxZ } = plot.bounds;
      for (const x of [minX, maxX])
        for (const z of [minZ, maxZ])
          expect(Math.hypot(x, z), plot.id).toBeLessThan(BACKDROP.radius);
    }
  });
});
