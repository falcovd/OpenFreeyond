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
// The positions and indices of one mesh, read from the binary chunk.
function geometryOf(buf, gltf, meshIndex) {
  const bin = 20 + buf.readUInt32LE(12) + 8;
  const p = gltf.meshes[meshIndex].primitives[0];
  const read = (acc, Type) => {
    const a = gltf.accessors[acc];
    const v = gltf.bufferViews[a.bufferView];
    const off = bin + (v.byteOffset ?? 0) + (a.byteOffset ?? 0);
    const comps = { SCALAR: 1, VEC3: 3 }[a.type];
    const len = a.count * comps * Type.BYTES_PER_ELEMENT;
    return new Type(
      buf
        .subarray(off, off + len)
        .buffer.slice(buf.byteOffset + off, buf.byteOffset + off + len),
    );
  };
  const pos = read(p.attributes.POSITION, Float32Array);
  const idxType =
    gltf.accessors[p.indices].componentType === 5125
      ? Uint32Array
      : Uint16Array;
  return { pos, idx: read(p.indices, idxType) };
}
// The separate boxes of a merged mesh (connected triangle groups) as bounding boxes.
function parts(buf, gltf, meshIndex) {
  const { pos, idx } = geometryOf(buf, gltf, meshIndex);
  // faces of a box are separate vertices: connect by position
  const key = (v) => [0, 1, 2].map((k) => pos[v * 3 + k].toFixed(4)).join();
  const parent = new Map();
  const find = (a) => {
    while ((parent.get(a) ?? a) !== a) a = parent.get(a);
    return a;
  };
  for (let t = 0; t < idx.length; t += 3)
    for (const k of [1, 2])
      parent.set(find(key(idx[t + k])), find(key(idx[t])));
  const boxes = new Map();
  for (const v of new Set(idx)) {
    const r = find(key(v));
    const b = boxes.get(r) ?? {
      min: [Infinity, Infinity, Infinity],
      max: [-Infinity, -Infinity, -Infinity],
    };
    for (let k = 0; k < 3; k++) {
      b.min[k] = Math.min(b.min[k], pos[v * 3 + k]);
      b.max[k] = Math.max(b.max[k], pos[v * 3 + k]);
    }
    boxes.set(r, b);
  }
  return [...boxes.values()];
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

  it('is merged: one mesh per material, at most 8 meshes', () => {
    const { gltf } = load(look);
    const nodes = gltf.nodes.filter((n) => n.mesh !== undefined);
    expect(nodes.length).toBeLessThanOrEqual(8);
    const mats = nodes.map((n) => gltf.meshes[n.mesh].primitives[0].material);
    expect(new Set(mats).size).toBe(mats.length);
  });

  it('has at least 4 windows and the door on the street face', () => {
    const { buf, gltf } = load(look);
    const all = meshes(gltf);
    const facade = look.facade === 'brick' ? 'Brick' : 'Render';
    const zf = Math.max(
      ...all.filter((m) => m.mat === facade).map((m) => m.max[2]),
    );
    const meshOf = (name) => gltf.nodes.find((n) => n.name === name).mesh;
    // each pane is a separate box; the panes on the street face sit within 0.1 m of its plane
    const onFace = (m) => Math.abs(centre(m)[2] - zf) <= 0.1;
    const panes = parts(buf, gltf, meshOf('Window'));
    expect(panes.filter(onFace).length).toBeGreaterThanOrEqual(4);
    const doors = parts(buf, gltf, meshOf('Door'));
    expect(doors).toHaveLength(1);
    expect(onFace(doors[0])).toBe(true);
    expect(centre(doors[0])[0]).toBeCloseTo(look.doorOffset, 1);
  });

  it('carries world-space UVs on the walls (equal texture scale)', () => {
    const { gltf } = load(look);
    const facade = look.facade === 'brick' ? 'Brick' : 'Render';
    const node = gltf.nodes.find((n) => n.name === facade);
    const uv =
      gltf.accessors[
        gltf.meshes[node.mesh].primitives[0].attributes.TEXCOORD_0
      ];
    // the walls are 8 m wide: at 2 m per tile the u range is well over 1
    expect(uv.max[0] - uv.min[0]).toBeGreaterThan(2);
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
