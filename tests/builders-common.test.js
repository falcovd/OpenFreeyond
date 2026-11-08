// @vitest-environment node
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { makeAssets, surface } from '../src/world/builders/common.js';

describe('surface tint and gain', () => {
  const tex = new THREE.Texture();
  const assets = makeAssets(new Map([['t', tex]]));
  it('uses the tint as is without a gain', () => {
    const m = surface(THREE, assets, 't', '#fff', { tint: '#808080' });
    expect(m.color.r).toBeCloseTo(new THREE.Color('#808080').r);
  });
  it('brightens a tint with a gain', () => {
    const plain = surface(THREE, assets, 't', '#fff', { tint: '#808080' });
    const lit = surface(THREE, assets, 't', '#fff', {
      tint: '#808080',
      gain: 2,
    });
    expect(lit.color.r).toBeCloseTo(plain.color.r * 2);
  });
  it('keeps a plain colour when the texture is missing', () => {
    const m = surface(THREE, makeAssets(new Map()), 't', '#b5543a', {
      gain: 2,
    });
    expect(m.map).toBeNull();
  });
});
