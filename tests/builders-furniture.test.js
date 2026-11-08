import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { makeAssets } from '../src/world/builders/common.js';
import { buildFence, buildFurniture } from '../src/world/builders/furniture.js';
import { SOLIDS } from '../src/world/layout.js';

const none = makeAssets(new Map());
const parts = (root, name) => {
  let n = 0;
  root.traverse((o) => {
    if (o.userData.part === name) n++;
  });
  return n;
};

describe('fences (FR-8, AC-3.4)', () => {
  const fence = SOLIDS.find((s) => s.id === 'fence-left');
  it('has posts and rails along its whole length', () => {
    const g = buildFence(THREE, none, fence);
    expect(parts(g, 'post')).toBeGreaterThanOrEqual(Math.floor(fence.d));
    expect(parts(g, 'rail')).toBeGreaterThanOrEqual(2);
    const box = new THREE.Box3().setFromObject(g);
    expect(box.max.z - box.min.z).toBeGreaterThanOrEqual(fence.d - 0.2);
  });
});

describe('furniture (FR-18)', () => {
  for (const id of ['bench', 'table', 'planter']) {
    it(`builds the ${id} from several parts, not one box, inside its footprint`, () => {
      const s = SOLIDS.find((x) => x.id === id);
      const g = buildFurniture(THREE, none, s);
      expect(g.children.length).toBeGreaterThan(2);
      const box = new THREE.Box3().setFromObject(g);
      expect(box.max.x - box.min.x).toBeLessThanOrEqual(s.w + 0.4);
      expect(g.position.x).toBe(s.x);
      expect(g.userData.kind).toBe('furniture');
    });
  }
});
