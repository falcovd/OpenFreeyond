import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { makeAssets } from '../src/world/builders/common.js';
import { buildSlabs } from '../src/world/builders/slabs.js';
import { applyShadows, SHADOW_RULES } from '../src/world/builders/shadows.js';

const mesh = (material) =>
  new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    material ?? new THREE.MeshStandardMaterial(),
  );
const group = (kind, ...children) => {
  const g = new THREE.Group();
  g.userData.kind = kind;
  g.add(...children);
  return g;
};

describe('applyShadows', () => {
  it('lets trees, the house and furniture cast and receive', () => {
    for (const kind of [
      'tree',
      'bush',
      'hedge',
      'fence',
      'furniture',
      'house',
      'character',
      'slab',
      'street-slab',
      'curb',
      'car',
      'lamp',
      'gate',
    ]) {
      const m = mesh();
      applyShadows(group(kind, m), { enabled: true });
      expect([m.castShadow, m.receiveShadow], kind).toEqual([true, true]);
    }
  });
  it('lets the ground, the path, flower beds and interior items receive only', () => {
    for (const kind of ['ground', 'flower-bed', 'interior', 'road', 'street']) {
      const m = mesh();
      applyShadows(group(kind, m), { enabled: true });
      expect([m.castShadow, m.receiveShadow], kind).toEqual([false, true]);
    }
  });
  it('keeps the sky out of it', () => {
    const m = mesh();
    applyShadows(group('sky', m), { enabled: true });
    expect([m.castShadow, m.receiveShadow]).toEqual([false, false]);
  });
  it('never lets see-through glass cast, so sun can come in through the windows', () => {
    const glass = mesh(
      new THREE.MeshStandardMaterial({ transparent: true, opacity: 0.3 }),
    );
    applyShadows(group('house', glass), { enabled: true });
    expect(glass.castShadow).toBe(false);
    expect(glass.receiveShadow).toBe(true);
  });
  it('finds the kind of an ancestor, however deep the mesh is', () => {
    const m = mesh();
    const inner = new THREE.Group();
    inner.add(m);
    applyShadows(group('tree', inner), { enabled: true });
    expect(m.castShadow).toBe(true);
  });
  it('uses the kind option for a mesh that has no ancestor with a kind (the character model)', () => {
    const m = mesh();
    applyShadows(m, { enabled: true, kind: 'character' });
    expect([m.castShadow, m.receiveShadow]).toEqual([true, true]);
  });
  it('sets nothing when shadows are off', () => {
    const m = mesh();
    applyShadows(group('tree', m), { enabled: false });
    expect([m.castShadow, m.receiveShadow]).toEqual([false, false]);
  });
  it('has a rule for every kind that buildWorld makes', () => {
    for (const kind of [
      'tree',
      'bush',
      'hedge',
      'fence',
      'furniture',
      'house',
      'flower-bed',
      'interior',
      'character',
      'ground',
      'slab',
      'street-slab',
      'curb',
      'road',
      'street',
      'car',
      'lamp',
      'gate',
      'sky',
    ])
      expect(SHADOW_RULES[kind], kind).toBeTruthy();
  });
  it('drops the street kinds, and only those, when streetShadows is off (AC-4.10)', () => {
    for (const kind of [
      'street-slab',
      'curb',
      'road',
      'street',
      'car',
      'lamp',
    ]) {
      const m = mesh();
      applyShadows(group(kind, m), { enabled: true, streetShadows: 'off' });
      expect([m.castShadow, m.receiveShadow], kind).toEqual([false, false]);
    }
    for (const kind of ['fence', 'gate', 'slab']) {
      const m = mesh();
      applyShadows(group(kind, m), { enabled: true, streetShadows: 'off' });
      expect([m.castShadow, m.receiveShadow], kind).toEqual([true, true]);
    }
  });
  it('never lets the flat slab underlay cast, while the slabs do', () => {
    const g = buildSlabs(THREE, makeAssets(new Map()), {
      width: 1.2,
      length: 4,
      texture: 'paving',
      fallback: '#b9b3a8',
      kind: 'slab',
    });
    applyShadows(g, { enabled: true });
    expect([g.children[0].castShadow, g.children[0].receiveShadow]).toEqual([
      false,
      true,
    ]);
    expect(g.children[1].castShadow).toBe(true);
  });
});
