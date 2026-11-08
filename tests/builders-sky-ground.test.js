import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { makeAssets } from '../src/world/builders/common.js';
import { buildSky, buildClouds, SKY } from '../src/world/builders/sky.js';
import { buildGround, buildPath } from '../src/world/builders/ground.js';
import { PATH } from '../src/world/layout.js';

const none = makeAssets(new Map());

function colourAt(sky, pick) {
  const mesh = sky.children[0];
  const pos = mesh.geometry.attributes.position;
  const col = mesh.geometry.attributes.color;
  const out = [];
  for (let i = 0; i < pos.count; i++) {
    if (pick(pos.getY(i))) out.push([col.getX(i), col.getY(i), col.getZ(i)]);
  }
  return out[0];
}

describe('sky (FR-1, FR-3)', () => {
  const sky = buildSky(THREE);
  it('is a blue gradient, lighter at the horizon and deeper overhead (AC-1.1)', () => {
    const horizon = colourAt(sky, (y) => Math.abs(y) < 1);
    const top = colourAt(sky, (y) => y > SKY.radius - 1);
    const luma = (c) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    expect(luma(horizon)).toBeGreaterThan(luma(top));
    expect(top[2]).toBeGreaterThan(top[0]); // blue beats red overhead
  });
  it('uses the horizon colour below the horizon, so no empty edge shows (AC-1.3)', () => {
    const below = colourAt(sky, (y) => y < -SKY.radius + 1);
    const horizon = colourAt(sky, (y) => Math.abs(y) < 1);
    expect(below).toEqual(horizon);
  });
});

describe('clouds (FR-2, FR-14)', () => {
  it('has at least one cloud that drifts (AC-1.2, AC-7.2)', () => {
    const clouds = buildClouds(THREE);
    expect(clouds.children.length).toBeGreaterThanOrEqual(1);
    const before = clouds.rotation.y;
    clouds.userData.update(10);
    expect(clouds.rotation.y).not.toBe(before);
  });
  it('drifts slowly: under 0.01 radians per second', () => {
    const clouds = buildClouds(THREE);
    clouds.userData.update(0);
    const a = clouds.rotation.y;
    clouds.userData.update(1);
    expect(Math.abs(clouds.rotation.y - a)).toBeLessThan(0.01);
  });
});

describe('ground (FR-3, FR-4, FR-5)', () => {
  it('reaches well beyond the horizon fog, so no edge shows', () => {
    const g = buildGround(THREE, none);
    expect(g.geometry.parameters.width).toBeGreaterThanOrEqual(600);
  });
  it('uses a plain colour when the grass texture is missing (FR-16)', () => {
    const g = buildGround(THREE, none);
    expect(g.material.map).toBeNull();
  });
  it('uses the grass texture when it is there, repeated', () => {
    const tex = new THREE.Texture();
    const g = buildGround(THREE, makeAssets(new Map([['grass', tex]])));
    expect(g.material.map).not.toBeNull();
    expect(g.material.map.repeat.x).toBeGreaterThan(1);
  });
  it('draws a path from the street to the door', () => {
    const p = buildPath(THREE, none);
    expect(p.geometry.parameters.width).toBeCloseTo(PATH.w);
    expect(p.geometry.parameters.height).toBeCloseTo(PATH.z1 - PATH.z0);
  });
});
