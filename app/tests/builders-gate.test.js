import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { makeAssets } from '../src/world/builders/common.js';
import { buildGate } from '../src/world/builders/gate.js';
import { SOLIDS, GATE } from '../src/world/layout.js';

const none = makeAssets(new Map());
const gate = SOLIDS.find((s) => s.kind === 'gate');
const parts = (root, name) => {
  const found = [];
  root.traverse((o) => {
    if (o.userData.part === name) found.push(o);
  });
  return found;
};

describe('the closed gate (FR-4, AC-2.1, AC-2.2)', () => {
  const g = buildGate(THREE, none, gate);
  it('is tagged as a gate that clicks pass through', () => {
    expect(g.userData.kind).toBe('gate');
    expect(g.userData.noPick).toBe(true);
    expect(g.position.x).toBe(gate.x);
    expect(g.position.z).toBe(gate.z);
  });
  it('draws two rails across the opening, a brace, and no posts', () => {
    expect(parts(g, 'post').length).toBe(0);
    const rails = parts(g, 'rail');
    expect(rails.length).toBe(2);
    for (const r of rails) {
      const b = new THREE.Box3().setFromObject(r);
      expect(b.max.x - b.min.x).toBeCloseTo(GATE.w, 5);
    }
    expect(parts(g, 'brace').length).toBe(1);
  });
  it('is no higher than the fence and uses the fence colour', () => {
    const b = new THREE.Box3().setFromObject(g);
    expect(b.max.y).toBeLessThanOrEqual(gate.h + 1e-6);
    expect(b.min.y).toBeGreaterThanOrEqual(0);
    g.traverse((o) => {
      if (o.isMesh) expect(o.material.color.getHexString()).toBe('f2e3c6');
    });
  });
});
