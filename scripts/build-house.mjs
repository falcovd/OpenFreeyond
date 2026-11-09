/* global Buffer, URL, console */
// Generates public/assets/models/house.glb from src/world/layout.js. Run: npm run build:house
// The origin of the file is the centre of the house on the ground (the builder places it at HOUSE.x, HOUSE.z).
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { writeFileSync, mkdirSync } from 'node:fs';
import {
  HOUSE,
  DOOR,
  HINGE,
  WALLS,
  WALL,
  OPENING,
  INNER_DOORWAY,
} from '../src/world/layout.js';

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

// A gable roof. The ridge runs along x. Front slope faces the garden (+z).
// The slope runs from the wall top (y 0 at z = +-hd) to the ridge, and carries
// on over the overhang, so the eaves sit slightly lower and meet the walls.
function roofGeometry(hw, hd, rh, o) {
  const ey = (-rh * o) / hd;
  const a = [-hw - o, ey, hd + o];
  const b = [hw + o, ey, hd + o];
  const c = [hw + o, rh, 0];
  const d = [-hw - o, rh, 0];
  const e = [hw + o, ey, -hd - o];
  const f = [-hw - o, ey, -hd - o];
  const pos = [
    ...a,
    ...b,
    ...c,
    ...a,
    ...c,
    ...d,
    ...e,
    ...f,
    ...d,
    ...e,
    ...d,
    ...c,
  ];
  const uv = [
    0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1,
  ];
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}

// A triangle that fills the wall under the roof at one end.
function gableGeometry(x, hd, rh) {
  const g = new THREE.BufferGeometry();
  g.setAttribute(
    'position',
    new THREE.Float32BufferAttribute([x, 0, hd, x, 0, -hd, x, rh, 0], 3),
  );
  g.setAttribute(
    'uv',
    new THREE.Float32BufferAttribute([0, 0, 1, 0, 0.5, 1], 2),
  );
  g.computeVertexNormals();
  return g;
}

const mat = (name, color, extra = {}) => {
  const m = new THREE.MeshStandardMaterial({ color, roughness: 1, ...extra });
  m.name = name;
  return m;
};
const materials = {
  Wall: mat('Wall', '#e8c9a0'),
  Plaster: mat('Plaster', '#f1e4cf'),
  Floor: mat('Floor', '#c9a06b'),
  Ceiling: mat('Ceiling', '#f6efe3'),
  Roof: mat('Roof', '#b5543a', { side: THREE.DoubleSide }),
  Wood: mat('Wood', '#8b5a2b'),
  Glass: mat('Glass', '#9cc7e8', {
    roughness: 0.2,
    emissive: '#3b5a73',
    emissiveIntensity: 0.25,
  }),
};

const root = new THREE.Group();
root.name = 'House';

// A box from its x, z extents (relative to the house centre) and y range.
function slab(name, material, x0, x1, y0, y1, z0, z1) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0),
    materials[material],
  );
  m.name = name;
  m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  root.add(m);
  return m;
}

const { w, d, ceilingHeight: ch, wallHeight: wh, roofHeight: rh } = HOUSE;
const hw = w / 2;
const hd = d / 2;
const bx = (x) => x - HOUSE.x;
const bz = (z) => z - HOUSE.z;

// Walls from the layout. The middle walls (shorter than the outer walls) are plaster.
for (const wl of WALLS) {
  const mid = wl.h < wh;
  slab(
    wl.id,
    mid ? 'Plaster' : 'Wall',
    bx(wl.x) - wl.w / 2,
    bx(wl.x) + wl.w / 2,
    0,
    wl.h,
    bz(wl.z) - wl.d / 2,
    bz(wl.z) + wl.d / 2,
  );
}
// Lintels over the openings.
slab(
  'lintel-front',
  'Wall',
  bx(OPENING.minX),
  bx(OPENING.maxX),
  DOOR.h,
  wh,
  bz(OPENING.minZ),
  bz(OPENING.maxZ),
);
slab(
  'lintel-inner',
  'Plaster',
  bx(INNER_DOORWAY.x) - WALL / 2,
  bx(INNER_DOORWAY.x) + WALL / 2,
  INNER_DOORWAY.h,
  ch,
  bz(INNER_DOORWAY.z) - INNER_DOORWAY.w / 2,
  bz(INNER_DOORWAY.z) + INNER_DOORWAY.w / 2,
);
// Plaster lining just inside each outer wall piece, up to the ceiling.
const LINING = 0.02;
for (const wl of WALLS.filter((x) => x.h === wh)) {
  const cx = bx(wl.x);
  const cz = bz(wl.z);
  const alongX = wl.w > wl.d;
  let [x0, x1, z0, z1] = [
    cx - wl.w / 2,
    cx + wl.w / 2,
    cz - wl.d / 2,
    cz + wl.d / 2,
  ];
  // Put the lining on the inner face (towards the house centre).
  if (alongX) {
    if (cz > 0) [z0, z1] = [z0 - LINING, z0];
    else [z0, z1] = [z1, z1 + LINING];
  } else if (cx > 0) [x0, x1] = [x0 - LINING, x0];
  else [x0, x1] = [x1, x1 + LINING];
  slab(`lining-${wl.id}`, 'Plaster', x0, x1, 0, ch, z0, z1);
}
// Floor and ceiling over both rooms.
slab('Floor', 'Floor', -hw + WALL, hw - WALL, 0, 0.02, -hd + WALL, hd - WALL);
slab('Ceiling', 'Ceiling', -hw, hw, ch, ch + 0.1, -hd, hd);

// Roof and the two gable triangles.
const roof = new THREE.Mesh(roofGeometry(hw, hd, rh, 0.4), materials.Roof);
roof.name = 'Roof';
roof.position.y = wh;
root.add(roof);
for (const x of [-hw, hw]) {
  const g = new THREE.Mesh(gableGeometry(x, hd, rh), materials.Wall);
  g.name = `Gable${x < 0 ? 'Left' : 'Right'}`;
  g.material = mat('Wall', '#e8c9a0', { side: THREE.DoubleSide });
  g.position.y = wh;
  root.add(g);
}

// Windows on the garden wall, outside only.
const front = hd + 0.05;
const boxAt = (mesh, x, y, z) => {
  mesh.position.set(x, y, z);
  return mesh;
};
const windowAt = (name, x, y) => {
  const win = new THREE.Group();
  win.name = name;
  const part = (pw, ph, pd, material, px, py, pz) =>
    win.add(
      boxAt(
        new THREE.Mesh(new THREE.BoxGeometry(pw, ph, pd), materials[material]),
        px,
        py,
        pz,
      ),
    );
  part(0.9, 1.1, 0.06, 'Wood', 0, 0, 0); // frame
  part(0.7, 0.9, 0.08, 'Glass', 0, 0, 0.01); // pane
  part(1.05, 0.08, 0.16, 'Wood', 0, -0.6, 0.04); // sill
  win.position.set(x, y, front);
  root.add(win);
};
[-3.3, 1.2, 3.0].forEach((x, i) => windowAt(`Window${i + 1}`, x, 1.5));
[-3.3, -1.95, 1.2, 3.0].forEach((x, i) => windowAt(`Window${i + 4}`, x, 4.0));

// The door: its origin is the hinge, the leaf extends along +x.
const door = new THREE.Group();
door.name = 'Door';
door.position.set(HINGE.x - HOUSE.x, 0, HINGE.z - HOUSE.z);
door.add(
  boxAt(
    new THREE.Mesh(new THREE.BoxGeometry(DOOR.w, DOOR.h, 0.05), materials.Wood),
    DOOR.w / 2,
    DOOR.h / 2,
    0,
  ),
);
root.add(door);

const glb = await new Promise((resolve, reject) =>
  new GLTFExporter().parse(root, resolve, reject, { binary: true, trs: true }),
);
const out = new URL('../public/assets/models/house.glb', import.meta.url);
mkdirSync(new URL('./', out), { recursive: true });
writeFileSync(out, Buffer.from(glb));
console.log(`house.glb written, ${glb.byteLength} bytes`);
