/* global Buffer, URL, console */
// Generates public/assets/models/houses/*.glb (the four neighbour house looks) from src/world/houseLooks.js.
// Run: npm run build:neighbours
// Each model is 8 by 5 m with the origin at the centre of the footprint on y = 0. The street face is +z.
// Materials: Brick or Render (by facade), Roof, Window (dark, opaque: nothing shows inside), Door, Trim.
import * as THREE from 'three';
import {
  mergeGeometries,
  mergeVertices,
} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { writeFileSync, mkdirSync } from 'node:fs';
import { LOOKS, HOUSE_SIZE } from '../src/world/houseLooks.js';

// GLTFExporter wants a browser FileReader.
globalThis.FileReader = class {
  readAsArrayBuffer(b) {
    b.arrayBuffer().then((r) => {
      this.result = r;
      this.onloadend?.();
    });
  }
  readAsDataURL(b) {
    b.arrayBuffer().then((r) => {
      this.result =
        'data:application/octet-stream;base64,' +
        Buffer.from(r).toString('base64');
      this.onloadend?.();
    });
  }
};

const mat = (name, color, extra = {}) => {
  const m = new THREE.MeshStandardMaterial({ color, roughness: 1, ...extra });
  m.name = name;
  return m;
};
const makeMaterials = (facade) => ({
  Facade:
    facade === 'brick' ? mat('Brick', '#a8553c') : mat('Render', '#ece3d0'),
  Roof: mat('Roof', '#5a4a45', { side: THREE.DoubleSide }),
  Window: mat('Window', '#1c2630', { roughness: 0.3 }), // opaque, no emissive: nothing shows inside
  Door: mat('Door', '#3f6b59'),
  Trim: mat('Trim', '#efe6d4'),
});

const UNIT = new THREE.BoxGeometry(1, 1, 1);

function geometry(tris) {
  const pos = [];
  const uv = [];
  for (const t of tris) {
    pos.push(...t);
    uv.push(0, 0, 1, 0, 0.5, 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos.flat(), 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}
// A quad as two triangles from four corners in order.
const quad = (a, b, c, d) => [
  [a, b, c],
  [a, c, d],
];

function build(look) {
  const M = makeMaterials(look.facade);
  const { w, d, floorHeight } = HOUSE_SIZE;
  const H = look.floors * floorHeight;
  const pitched = look.roof === 'pitched';
  // Pitched: the roof overhangs the walls by 0.3 m on every side, so the walls sit inside the 8 by 5 box.
  // Stepped: the walls fill it, less 0.05 m for the frames that stand proud of the face.
  const OVER = 0.3;
  const hw = pitched ? w / 2 - OVER : w / 2 - 0.05;
  const hd = pitched ? d / 2 - OVER : d / 2 - 0.05;
  const root = new THREE.Group();
  root.name = 'NeighbourHouse';

  const box = (name, material, cx, cy, cz, sx, sy, sz) => {
    const m = new THREE.Mesh(UNIT, material);
    m.name = name;
    m.scale.set(sx, sy, sz);
    m.position.set(cx, cy, cz);
    root.add(m);
  };
  const mesh = (name, material, tris) => {
    const m = new THREE.Mesh(geometry(tris), material);
    m.name = name;
    root.add(m);
  };

  // Walls, and a plinth strip that stands 0.02 m proud of them.
  box('wall', M.Facade, 0, H / 2, 0, 2 * hw, H, 2 * hd);
  box('plinth', M.Trim, 0, 0.175, 0, 2 * hw + 0.04, 0.35, 2 * hd + 0.04);

  // Windows: a dark pane inside four frame bars. `face` is 'z' (street and back) or 'x' (sides).
  const windowAt = (name, face, sign, along, cy) => {
    const pw = 0.9;
    const ph = 1.2;
    const bar = 0.08;
    const fd = 0.1; // frame depth, centred on the wall face: 0.05 m proud
    const face0 = face === 'z' ? sign * hd : sign * hw;
    const at = (a, y, dep, sa, sy, sdep) =>
      face === 'z' ? [a, y, face0, sa, sy, sdep] : [face0, y, a, sdep, sy, sa];
    const put = (n, material, ...args) => box(n, material, ...at(...args));
    put(`${name}-pane`, M.Window, along, cy, 0.05, pw, ph, 0.04);
    put(
      `${name}-top`,
      M.Trim,
      along,
      cy + ph / 2 + bar / 2,
      fd,
      pw + 2 * bar,
      bar,
      fd,
    );
    put(
      `${name}-bottom`,
      M.Trim,
      along,
      cy - ph / 2 - bar / 2,
      fd,
      pw + 2 * bar,
      bar,
      fd,
    );
    put(`${name}-left`, M.Trim, along - pw / 2 - bar / 2, cy, fd, bar, ph, fd);
    put(`${name}-right`, M.Trim, along + pw / 2 + bar / 2, cy, fd, bar, ph, fd);
  };

  // Street face: the door column plus two more columns on its far side. The ground floor has the door and
  // two windows; every upper floor has three windows (above the door as well).
  const dx = look.doorOffset;
  const dir = dx < 0 ? 1 : -1;
  const columns = [dx, dx + dir * 2.2, dx + dir * 4.4];
  for (let f = 0; f < look.floors; f++) {
    const cy = f * floorHeight + 1.5;
    columns.forEach((x, i) => {
      if (f === 0 && i === 0) return;
      windowAt(`window-f${f}-c${i}`, 'z', 1, x, cy);
    });
    windowAt(`window-side-f${f}-e`, 'x', 1, 0, cy);
    windowAt(`window-side-f${f}-w`, 'x', -1, 0, cy);
  }

  // The door and its lintel on the street face.
  box('door', M.Door, dx, 1.05, hd, 1.0, 2.1, 0.08);
  box('door-lintel', M.Trim, dx, 2.2, hd, 1.3, 0.14, 0.1);
  box('door-step', M.Trim, dx, 0.04, hd + 0.02, 1.3, 0.08, 0.06);

  if (pitched) {
    // Ridge along x (the 8 m side). The slope runs from the wall top to the ridge and carries on over the
    // overhang, so the eaves sit slightly lower than the wall top.
    const rh = 1.8;
    const ey = H - (rh * OVER) / hd;
    const X = w / 2;
    const Z = d / 2;
    const a = [-X, ey, Z];
    const b = [X, ey, Z];
    const c = [X, H + rh, 0];
    const dd = [-X, H + rh, 0];
    const e = [X, ey, -Z];
    const f = [-X, ey, -Z];
    mesh('roof', M.Roof, [...quad(a, b, c, dd), ...quad(e, f, dd, c)]);
    // The gable triangles fill the wall ends under the roof.
    mesh('gable-e', M.Facade, [
      [
        [hw, H, hd],
        [hw, H, -hd],
        [hw, H + rh, 0],
      ],
    ]);
    mesh('gable-w', M.Facade, [
      [
        [-hw, H, -hd],
        [-hw, H, hd],
        [-hw, H + rh, 0],
      ],
    ]);
  } else {
    // Gable toward the street: ridge along z (the 5 m side), a stair-step parapet of 5 levels on the street
    // face, in the facade material. The roof sits behind it.
    const rh = 1.4;
    const a = [-hw, H, hd];
    const b = [-hw, H, -hd];
    const c = [0, H + rh, -hd];
    const dd = [0, H + rh, hd];
    const e = [hw, H, hd];
    const f = [hw, H, -hd];
    mesh('roof', M.Roof, [...quad(b, a, dd, c), ...quad(f, c, dd, e)]);
    // 9 slabs, levels 0 1 2 3 4 3 2 1 0 (5 steps up the middle).
    const sw = (2 * hw) / 9;
    for (let i = 0; i < 9; i++) {
      const level = 4 - Math.abs(i - 4);
      const ph = 0.3 + level * 0.35;
      box(
        `parapet-${i}`,
        M.Facade,
        -hw + sw * (i + 0.5),
        H + ph / 2,
        hd - 0.15,
        sw,
        ph,
        0.3,
      );
    }
    // Capping stone on the middle slab, a cheap hint of a coping.
    box(
      'parapet-cap',
      M.Trim,
      0,
      H + 0.3 + 4 * 0.35 + 0.03,
      hd - 0.15,
      sw + 0.1,
      0.06,
      0.4,
    );
    // The back wall under the roof.
    mesh('gable-back', M.Facade, [
      [
        [hw, H, -hd],
        [-hw, H, -hd],
        [0, H + rh, -hd],
      ],
    ]);
  }
  // Roof texture coordinates in metres / 1.5: u along the ridge, v up the slope (distance from the ridge line).
  const ridgeY = H + (pitched ? 1.8 : 1.4);
  const roofUv = pitched
    ? (x, y, z) => [x / ROOF_M, Math.hypot(z, y - ridgeY) / ROOF_M]
    : (x, y, z) => [z / ROOF_M, Math.hypot(x, y - ridgeY) / ROOF_M];
  return { root, roofUv };
}

const FACADE_M = 2; // one brick texture tile per 2 m, on every face
const ROOF_M = 1.5;

// World-space texture coordinates for the facade: by the face's dominant axis, so the scale is equal everywhere.
function facadeUv(g) {
  const p = g.attributes.position;
  const n = g.attributes.normal;
  const uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i));
    const ay = Math.abs(n.getY(i));
    const az = Math.abs(n.getZ(i));
    const [x, y, z] = [p.getX(i), p.getY(i), p.getZ(i)];
    if (ax >= ay && ax >= az) uv.setXY(i, z / FACADE_M, y / FACADE_M);
    else if (az >= ay) uv.setXY(i, x / FACADE_M, y / FACADE_M);
    else uv.setXY(i, x / FACADE_M, z / FACADE_M);
  }
}

// One mesh per material: every node's transform is baked into its geometry, then the geometries are merged.
function mergePerMaterial(root, roofUv) {
  root.updateMatrixWorld(true);
  const byMaterial = new Map();
  root.traverse((o) => {
    if (!o.isMesh) return;
    const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    g.applyMatrix4(o.matrixWorld);
    g.deleteAttribute('normal');
    g.computeVertexNormals();
    const name = o.material.name;
    if (name === 'Brick' || name === 'Render') facadeUv(g);
    else if (name === 'Roof') {
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++)
        g.attributes.uv.setXY(i, ...roofUv(p.getX(i), p.getY(i), p.getZ(i)));
    }
    const entry = byMaterial.get(name) ?? { material: o.material, parts: [] };
    entry.parts.push(g);
    byMaterial.set(name, entry);
  });
  const out = new THREE.Group();
  out.name = 'NeighbourHouse';
  for (const [name, { material, parts }] of byMaterial) {
    const m = new THREE.Mesh(mergeVertices(mergeGeometries(parts)), material);
    m.name = name;
    out.add(m);
  }
  return out;
}

for (const [id, look] of Object.entries(LOOKS)) {
  const built = build(look);
  const root = mergePerMaterial(built.root, built.roofUv);
  const glb = await new Promise((resolve, reject) =>
    new GLTFExporter().parse(root, resolve, reject, {
      binary: true,
      trs: true,
    }),
  );
  const out = new URL(`../public/assets/${look.file}`, import.meta.url);
  mkdirSync(new URL('./', out), { recursive: true });
  writeFileSync(out, Buffer.from(glb));
  console.log(`${id}: ${look.file} written, ${glb.byteLength} bytes`);
}
