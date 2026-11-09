// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { HINGE, HOUSE, DOOR, WALL } from '../src/world/layout.js';

const buf = readFileSync(
  new URL('../public/assets/models/house.glb', import.meta.url),
);
const len = buf.readUInt32LE(12);
const gltf = JSON.parse(buf.toString('utf8', 20, 20 + len));

// Boxes of the model as world-space ranges (the model shares one unit cube and scales it per node).
const box = (n, parent = [0, 0, 0]) => {
  const t = (n.translation ?? [0, 0, 0]).map((v, i) => v + parent[i]);
  const sc = n.scale ?? [1, 1, 1];
  return {
    name: n.name,
    mat: gltf.materials[gltf.meshes[n.mesh].primitives[0].material]?.name,
    min: t.map((v, i) => v - sc[i] / 2),
    max: t.map((v, i) => v + sc[i] / 2),
  };
};
const boxes = [];
const walk = (n, parent) => {
  if (
    n.mesh !== undefined &&
    gltf.meshes[n.mesh].primitives[0].indices !== undefined
  ) {
    // only unit-cube nodes are boxes
    const acc =
      gltf.accessors[gltf.meshes[n.mesh].primitives[0].attributes.POSITION];
    if (acc.count === 24) boxes.push({ ...box(n, parent), group: parent.name });
  }
  const t = (n.translation ?? [0, 0, 0]).map((v, i) => v + parent[i]);
  (n.children ?? []).forEach((c) =>
    walk(gltf.nodes[c], Object.assign(t, { name: n.name })),
  );
};
gltf.scenes[0].nodes.forEach((i) =>
  (gltf.nodes[i].children ?? []).forEach((c) =>
    walk(gltf.nodes[c], Object.assign([0, 0, 0], { name: 'House' })),
  ),
);
const overlap = (a, b) =>
  [0, 1, 2].every(
    (i) => a.min[i] < b.max[i] - 1e-6 && a.max[i] > b.min[i] + 1e-6,
  );

describe('house.glb', () => {
  it('has the trim, door and step materials as well', () => {
    const names = gltf.materials.map((m) => m.name);
    for (const n of ['Trim', 'TrimIn', 'Paint', 'Metal', 'Stone'])
      expect(names, n).toContain(n);
  });
  it('has no overlapping wall boxes, so no wall face is shared (no z-fighting at the corners)', () => {
    const walls = boxes.filter(
      (b) => b.group === 'House' && b.mat === 'Wall' && !/lintel/.test(b.name),
    );
    expect(walls.length).toBeGreaterThan(5);
    for (let i = 0; i < walls.length; i++)
      for (let j = i + 1; j < walls.length; j++)
        expect(
          overlap(walls[i], walls[j]),
          walls[i].name + ' ' + walls[j].name,
        ).toBe(false);
  });
  it('keeps the ceiling, floor and linings inside the walls, so no edge shows outside', () => {
    const hw = HOUSE.w / 2 - WALL;
    const hd = HOUSE.d / 2 - WALL;
    for (const b of boxes.filter(
      (x) =>
        x.group === 'House' &&
        /^(Ceiling|Floor|lining-|cornice-|beam-)/.test(x.name),
    )) {
      expect(b.min[0], b.name).toBeGreaterThanOrEqual(-hw - 1e-6);
      expect(b.max[0], b.name).toBeLessThanOrEqual(hw + 1e-6);
      expect(b.min[2], b.name).toBeGreaterThanOrEqual(-hd - 0.02 - 1e-6);
      expect(b.max[2], b.name).toBeLessThanOrEqual(hd + 1e-6);
    }
  });
  it('has real window openings in the ground-floor garden wall, with glass in them (finding 8)', () => {
    for (const [i, x] of [-3.3, 1.2, 3.0].entries()) {
      const hole = { min: [x - 0.39, 1.01, -0.3], max: [x + 0.39, 1.99, 2.6] };
      for (const b of boxes.filter(
        (b) =>
          b.group === 'House' && /wall-front|lining-wall-front/.test(b.name),
      ))
        expect(overlap(b, hole), `${b.name} blocks window ${i + 1}`).toBe(
          false,
        );
      const glass = boxes.filter(
        (b) => b.group === `Window${i + 1}` && b.mat === 'Glass',
      );
      expect(glass.length).toBe(1);
      // the pane is inside the wall thickness, so it is seen from both sides
      expect(glass[0].min[2]).toBeGreaterThan(HOUSE.d / 2 - WALL - 0.01);
      expect(glass[0].max[2]).toBeLessThan(HOUSE.d / 2);
    }
  });
  it('has a door with a handle on both sides and panels, a frame and thresholds no higher than 0.03 m (findings 2, 3)', () => {
    const leaf = boxes.filter((b) => b.group === 'Door');
    expect(leaf.some((b) => b.name === 'leaf')).toBe(true);
    expect(
      leaf.filter((b) => /^panel-/.test(b.name)).length,
    ).toBeGreaterThanOrEqual(6);
    const knobs = gltf.nodes.filter((n) => /^knob-(?!neck)/.test(n.name ?? ''));
    expect(knobs.map((n) => Math.sign(n.translation[2])).sort()).toEqual([
      -1, 1,
    ]);
    const top = Math.max(
      ...leaf.filter((b) => b.name === 'leaf').map((b) => b.max[1]),
    );
    expect(top).toBeCloseTo(DOOR.h);
    expect(boxes.some((b) => /^arch-out-/.test(b.name))).toBe(true);
    expect(boxes.some((b) => /^arch-in-/.test(b.name))).toBe(true);
    const sills = boxes.filter((b) => /^(threshold|step)/.test(b.name));
    expect(sills.length).toBeGreaterThanOrEqual(3);
    for (const b of sills) expect(b.max[1], b.name).toBeLessThanOrEqual(0.03);
  });
  it('has white ceiling structure: cornice and beams (finding 6)', () => {
    const c = boxes.filter((b) => b.mat === 'Ceiling');
    expect(
      c.filter((b) => /^cornice-/.test(b.name)).length,
    ).toBeGreaterThanOrEqual(8);
    expect(
      c.filter((b) => /^beam-/.test(b.name)).length,
    ).toBeGreaterThanOrEqual(4);
  });

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
