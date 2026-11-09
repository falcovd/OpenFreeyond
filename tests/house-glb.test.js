// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { HINGE, HOUSE } from '../src/world/layout.js';

const buf = readFileSync(
  new URL('../public/assets/models/house.glb', import.meta.url),
);
const len = buf.readUInt32LE(12);
const gltf = JSON.parse(buf.toString('utf8', 20, 20 + len));

describe('house.glb', () => {
  it('has the material names the builder textures by name', () => {
    const names = gltf.materials.map((m) => m.name);
    for (const n of [
      'Wall',
      'Plaster',
      'Floor',
      'Ceiling',
      'Roof',
      'Wood',
      'Glass',
    ])
      expect(names, n).toContain(n);
  });
  it('has a Door node whose origin is the hinge', () => {
    const door = gltf.nodes.find((n) => n.name === 'Door');
    expect(door).toBeTruthy();
    expect(door.translation[0]).toBeCloseTo(HINGE.x - HOUSE.x);
    expect(door.translation[2]).toBeCloseTo(HINGE.z - HOUSE.z);
  });
  it('has windows on the outside and at least 4 of them (AC-5.3)', () => {
    expect(
      gltf.nodes.filter((n) => /^Window/.test(n.name)).length,
    ).toBeGreaterThanOrEqual(4);
  });
  it('has no stairs and a Ceiling node (AC-5.1, AC-5.2)', () => {
    expect(gltf.nodes.some((n) => /stair/i.test(n.name ?? ''))).toBe(false);
    expect(gltf.nodes.some((n) => n.name === 'Ceiling')).toBe(true);
  });
  it('is small', () => {
    expect(buf.length).toBeLessThan(300 * 1024);
  });
});
