// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { LOOKS, HOUSE_SIZE } from '../src/world/houseLooks.js';

const MAX_BYTES = 300 * 1024;

function load(look) {
  const url = new URL(`../public/assets/${look.file}`, import.meta.url);
  const buf = readFileSync(url);
  const len = buf.readUInt32LE(12);
  return { buf, gltf: JSON.parse(buf.toString('utf8', 20, 20 + len)) };
}

// Every mesh node as a world box (the nodes have a translation and a scale only, no rotation).
function meshes(gltf) {
  const out = [];
  const walk = (i, t, s) => {
    const n = gltf.nodes[i];
    const nt = (n.translation ?? [0, 0, 0]).map((v, k) => t[k] + v * s[k]);
    const ns = (n.scale ?? [1, 1, 1]).map((v, k) => v * s[k]);
    if (n.mesh !== undefined) {
      const p = gltf.meshes[n.mesh].primitives[0];
      const acc = gltf.accessors[p.attributes.POSITION];
      out.push({
        name: n.name,
        mat: gltf.materials[p.material].name,
        min: acc.min.map((v, k) => nt[k] + v * ns[k]),
        max: acc.max.map((v, k) => nt[k] + v * ns[k]),
      });
    }
    (n.children ?? []).forEach((c) => walk(c, nt, ns));
  };
  gltf.scenes[0].nodes.forEach((i) => walk(i, [0, 0, 0], [1, 1, 1]));
  return out;
}
const centre = (m) => m.min.map((v, k) => (v + m.max[k]) / 2);

describe.each(Object.entries(LOOKS))('%s', (id, look) => {
  const path = new URL(`../public/assets/${look.file}`, import.meta.url);

  it('exists, is a valid GLB and is small', () => {
    expect(existsSync(path)).toBe(true);
    const { buf, gltf } = load(look);
    expect(buf.toString('utf8', 0, 4)).toBe('glTF');
    expect(buf.readUInt32LE(8)).toBe(buf.length);
    expect(gltf.asset.version).toBe('2.0');
    expect(statSync(path).size).toBeLessThanOrEqual(MAX_BYTES);
  });

  it('is 8 by 5 m, stands on y = 0 and is centred', () => {
    const all = meshes(load(look).gltf);
    const min = [0, 1, 2].map((k) => Math.min(...all.map((m) => m.min[k])));
    const max = [0, 1, 2].map((k) => Math.max(...all.map((m) => m.max[k])));
    expect(max[0] - min[0]).toBeCloseTo(HOUSE_SIZE.w, 1);
    expect(max[2] - min[2]).toBeCloseTo(HOUSE_SIZE.d, 1);
    expect(Math.abs(min[1])).toBeLessThanOrEqual(0.05);
    expect(Math.abs(min[0] + max[0])).toBeLessThanOrEqual(0.05);
    expect(Math.abs(min[2] + max[2])).toBeLessThanOrEqual(0.05);
    const roof = max[1] - look.floors * HOUSE_SIZE.floorHeight;
    expect(roof).toBeGreaterThanOrEqual(1);
    expect(roof).toBeLessThanOrEqual(4);
  });

  it('uses only the five named materials', () => {
    const { gltf } = load(look);
    const names = gltf.materials.map((m) => m.name).sort();
    const facade = look.facade === 'brick' ? 'Brick' : 'Render';
    expect(names).toEqual([facade, 'Door', 'Roof', 'Trim', 'Window'].sort());
  });

  it('has at least 4 windows and the door on the street face', () => {
    const all = meshes(load(look).gltf);
    const zf = Math.max(
      ...all.filter((m) => m.name === 'wall').map((m) => m.max[2]),
    );
    const onFace = (m) => Math.abs(centre(m)[2] - zf) <= 0.1;
    const windows = all.filter((m) => m.mat === 'Window' && onFace(m));
    expect(windows.length).toBeGreaterThanOrEqual(4);
    const doors = all.filter((m) => m.mat === 'Door' && onFace(m));
    expect(doors).toHaveLength(1);
    expect(centre(doors[0])[0]).toBeCloseTo(look.doorOffset, 1);
  });

  it('has dark, opaque glass', () => {
    const { gltf } = load(look);
    const w = gltf.materials.find((m) => m.name === 'Window');
    expect(w.alphaMode ?? 'OPAQUE').toBe('OPAQUE');
    expect(w.extensions?.KHR_materials_transmission).toBeUndefined();
    const [r, g, b, a] = w.pbrMetallicRoughness.baseColorFactor;
    expect(a).toBe(1);
    expect(Math.max(r, g, b)).toBeLessThan(0.2);
    expect(w.emissiveFactor ?? [0, 0, 0]).toEqual([0, 0, 0]);
  });
});
