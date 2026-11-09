import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { makeAssets } from '../src/world/builders/common.js';
import {
  buildSky,
  skyParams,
  SKY,
  SKY_DRIFT,
  BLEND,
} from '../src/world/builders/sky.js';
import { buildGround, buildPath } from '../src/world/builders/ground.js';
import { PATH } from '../src/world/layout.js';
import { SHADOW_MAP_SIZE } from '../src/world/shadowConfig.js';

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
  const sky = buildSky(THREE, none);
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

describe('sky data', () => {
  const tex = new THREE.Texture();
  const meta = { horizon: '#aabbcc', sun: [0, 1, 0] };
  it('uses the photo data when the photo loaded', () => {
    const p = skyParams(makeAssets(new Map([['sky', tex]])), meta);
    expect(p).toEqual({ photo: true, horizon: '#aabbcc', sun: [0, 1, 0] });
  });
  it('uses the fixed colours when the photo is missing', () => {
    const p = skyParams(none, meta);
    expect(p.photo).toBe(false);
    expect(p.horizon).toBe(SKY.horizon);
  });
  it('uses the fixed colours when the data is invalid', () => {
    const p = skyParams(makeAssets(new Map([['sky', tex]])), { horizon: 'x' });
    expect(p.photo).toBe(false);
  });
});

describe('photo sky (FR-1, FR-2, FR-3)', () => {
  const tex = new THREE.Texture();
  const assets = makeAssets(new Map([['sky', tex]]));
  const params = { photo: true, horizon: '#aabbcc', sun: [0, 0.6, 0.8] };
  const sky = buildSky(THREE, assets, params);
  const mesh = sky.children[0];

  it('puts the photo on the sky sphere without fog', () => {
    expect(mesh.material.map).toBe(tex);
    expect(mesh.material.fog).toBe(false);
    expect(mesh.material.transparent).toBe(true);
  });
  it('fades to nothing below the horizon and is solid high up, so the fog colour shows at the edge (AC-1.3)', () => {
    const pos = mesh.geometry.attributes.position;
    const col = mesh.geometry.attributes.color;
    expect(col.itemSize).toBe(4);
    const alphaAt = (pick) => {
      for (let i = 0; i < pos.count; i++)
        if (pick(Math.asin(pos.getY(i) / SKY.radius) * (180 / Math.PI)))
          return col.getW(i);
    };
    expect(alphaAt((e) => e < -BLEND.belowDeg - 1)).toBe(0);
    expect(alphaAt((e) => e > BLEND.aboveDeg + 1)).toBe(1);
  });
  it('carries a sun light that points where the photo sun is', () => {
    const light = sky.children.find((c) => c.isDirectionalLight);
    expect(light).toBeTruthy();
    const dir = light.position.clone().normalize();
    expect(dir.x).toBeCloseTo(0);
    expect(dir.y).toBeCloseTo(0.6);
    expect(dir.z).toBeCloseTo(0.8);
  });
  it('is not mirrored', () => {
    expect(mesh.scale.x).toBe(-1);
  });
});

describe('sky drift (FR-14, AC-7.2)', () => {
  const sky = buildSky(THREE, none);
  it('turns, and the sun light turns with it', () => {
    const before = sky.rotation.y;
    sky.userData.update(10);
    expect(sky.rotation.y).not.toBe(before);
    expect(sky.children.some((c) => c.isDirectionalLight)).toBe(true);
  });
  it('turns slowly: under 0.01 radians per second', () => {
    sky.userData.update(0);
    const a = sky.rotation.y;
    sky.userData.update(1);
    expect(Math.abs(sky.rotation.y - a)).toBeLessThan(0.01);
    expect(SKY_DRIFT).toBeLessThan(0.01);
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
  it('draws a slab path from the gate to the door, centred on the path', () => {
    const p = buildPath(THREE, none);
    expect(p.userData.kind).toBe('slab');
    expect(p.userData.noPick).toBe(true);
    expect(p.position.x).toBeCloseTo(PATH.x);
    expect(p.position.z).toBeCloseTo(PATH.z1);
    const box = new THREE.Box3().setFromObject(p);
    expect(box.min.z).toBeCloseTo(PATH.z0, 1);
    expect(box.max.z).toBeCloseTo(PATH.z1, 1);
    expect(box.max.x - box.min.x).toBeCloseTo(PATH.w, 1);
  });
});

describe('the sun casts shadows (shadows on)', () => {
  const sunOf = (sky) => {
    let s;
    sky.traverse((o) => {
      if (o.isDirectionalLight) s = o;
    });
    return s;
  };
  it('has a shadow map and a frustum that holds the place', () => {
    const sun = sunOf(buildSky(THREE, none, undefined, { shadows: true }));
    expect(sun.castShadow).toBe(true);
    expect(sun.shadow.mapSize.x).toBe(SHADOW_MAP_SIZE);
    expect(sun.shadow.camera.right).toBeGreaterThan(15);
  });
  it('allocates no shadow map when shadows are off', () => {
    const sun = sunOf(buildSky(THREE, none, undefined, { shadows: false }));
    expect(sun.castShadow).toBe(false);
  });
});
