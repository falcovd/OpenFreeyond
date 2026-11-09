import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
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
    ]) {
      const m = mesh();
      applyShadows(group(kind, m), { enabled: true });
      expect([m.castShadow, m.receiveShadow], kind).toEqual([true, true]);
    }
  });
  it('lets the ground, the path, flower beds and interior items receive only', () => {
    for (const kind of ['ground', 'flower-bed', 'interior']) {
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
      'sky',
    ])
      expect(SHADOW_RULES[kind], kind).toBeTruthy();
  });
});
