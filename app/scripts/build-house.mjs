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
  // Painted trim for the outside (frames, architraves, cornice-like edges). TrimIn is the same
  // paint for the rooms: the builder dims it like the plaster, as the garden light is too strong inside.
  Trim: mat('Trim', '#efe6d4'),
  TrimIn: mat('TrimIn', '#efe6d4'),
  Paint: mat('Paint', '#3f6b59'), // the door
  Metal: mat('Metal', '#c9a24a', { roughness: 0.4 }), // door knobs
  Stone: mat('Stone', '#b9b3a7'), // the step outside the door
  Glass: mat('Glass', '#9cc7e8', {
    roughness: 0.2,
    emissive: '#3b5a73',
    emissiveIntensity: 0.25,
  }),
  // The ground-floor panes: the builder makes this one see-through (PO request, finding R-9).
  GlassClear: mat('GlassClear', '#bcd9ee', { roughness: 0.1 }),
};

// Every box shares one unit cube and is scaled by its node, so the file holds the cube once
// (the builder reads the size from the node scale).
const UNIT = new THREE.BoxGeometry(1, 1, 1);
const unitBox = (material, sx, sy, sz) => {
  const m = new THREE.Mesh(UNIT, material);
  m.scale.set(sx, sy, sz);
  return m;
};

const root = new THREE.Group();
root.name = 'House';

// A box from its x, z extents (relative to the house centre) and y range.
function slab(name, material, x0, x1, y0, y1, z0, z1) {
  const m = unitBox(materials[material], x1 - x0, y1 - y0, z1 - z0);
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

const WINDOW_HOLE = { hw: 0.4, y0: 1.0, y1: 2.0 }; // the openings in the ground-floor garden wall
const GROUND_WINDOWS = [-3.3, 1.2, 3.0];
const UPPER_WINDOWS = [-3.3, -1.95, 1.2, 3.0];
const SILL_Y = 1.5; // window centre, ground floor
const LINING = 0.02;
const inX0 = -hw + WALL;
const inX1 = hw - WALL;
const inZ0 = -hd + WALL;
const inZ1 = hd - WALL;

// A wall box with rectangular holes cut through it along z (the holes are x ranges with a y range).
function wallWithHoles(id, material, x0, x1, y0, y1, z0, z1, holes) {
  const inside = holes
    .filter((h) => h.x0 >= x0 - 1e-9 && h.x1 <= x1 + 1e-9)
    .sort((a, b) => a.x0 - b.x0);
  let cursor = x0;
  let n = 0;
  const name = () => (n++ === 0 ? id : `${id}-${n}`);
  for (const h of inside) {
    if (h.x0 > cursor) slab(name(), material, cursor, h.x0, y0, y1, z0, z1);
    slab(name(), material, h.x0, h.x1, y0, h.y0, z0, z1);
    slab(name(), material, h.x0, h.x1, h.y1, y1, z0, z1);
    cursor = h.x1;
  }
  if (x1 > cursor + 1e-9) slab(name(), material, cursor, x1, y0, y1, z0, z1);
}
const holesFor = () =>
  GROUND_WINDOWS.map((x) => ({
    x0: x - WINDOW_HOLE.hw,
    x1: x + WINDOW_HOLE.hw,
    y0: WINDOW_HOLE.y0,
    y1: WINDOW_HOLE.y1,
  }));

// Walls from the layout. The middle walls (shorter than the outer walls) are plaster. The side walls
// stop at the front and back walls, so no two wall boxes overlap and no face is shared (no z-fighting
// at the corners). The garden wall has real window openings on the ground floor.
for (const wl of WALLS) {
  const mid = wl.h < wh;
  const cx = bx(wl.x);
  const cz = bz(wl.z);
  let [x0, x1, z0, z1] = [
    cx - wl.w / 2,
    cx + wl.w / 2,
    cz - wl.d / 2,
    cz + wl.d / 2,
  ];
  const alongX = wl.w > wl.d;
  if (!mid && !alongX) [z0, z1] = [z0 + WALL, z1 - WALL];
  const front = !mid && alongX && cz > 0;
  wallWithHoles(
    wl.id,
    mid ? 'Plaster' : 'Wall',
    x0,
    x1,
    0,
    wl.h,
    z0,
    z1,
    front ? holesFor() : [],
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
// Plaster lining just inside each outer wall piece, up to the ceiling. It stays inside the rooms, so
// no edge of it reaches the outside.
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
    [x0, x1] = [Math.max(x0, inX0), Math.min(x1, inX1)];
  } else {
    if (cx > 0) [x0, x1] = [x0 - LINING, x0];
    else [x0, x1] = [x1, x1 + LINING];
    [z0, z1] = [inZ0 + LINING, inZ1 - LINING];
  }
  const front = alongX && cz > 0;
  wallWithHoles(
    `lining-${wl.id}`,
    'Plaster',
    x0,
    x1,
    0,
    ch,
    z0,
    z1,
    front ? holesFor() : [],
  );
}
// Plaster over the inside of the lintel above the front door.
slab(
  'lining-lintel-front',
  'Plaster',
  bx(OPENING.minX),
  bx(OPENING.maxX),
  DOOR.h,
  ch,
  bz(OPENING.minZ) - LINING,
  bz(OPENING.minZ),
);
// Floor and ceiling over both rooms. Both sit inside the walls, so no edge of them is outside.
slab('Floor', 'Floor', inX0, inX1, 0, 0.02, inZ0, inZ1);
slab('Ceiling', 'Ceiling', inX0, inX1, ch, ch + 0.1, inZ0, inZ1);

// Ceiling structure, all white: a stepped cornice round the edge of each room, and a frame of
// shallow beams in each room (the pendant hangs in the middle of it).
const CORNICE = [
  [0.05, 0.05], // [how far it reaches into the room, how tall]
  [0.1, 0.04],
];
const cornice = (name, x0, x1, z0, z1, side) => {
  CORNICE.forEach(([reach, h], i) => {
    const y1 = ch - (i === 0 ? 0.04 : 0);
    const y0 = y1 - h;
    const [ax0, ax1, az0, az1] =
      side === 'z-'
        ? [x0, x1, z0, z0 + reach]
        : side === 'z+'
          ? [x0, x1, z1 - reach, z1]
          : side === 'x-'
            ? [x0, x0 + reach, z0, z1]
            : [x1 - reach, x1, z0, z1];
    slab(`${name}-${i}`, 'Ceiling', ax0, ax1, y0, y1, az0, az1);
  });
};
// The rooms: living x from -hw+WALL to -WALL/2, kitchen from WALL/2 to hw-WALL.
for (const [room, rx0, rx1] of [
  ['living', inX0, -WALL / 2],
  ['kitchen', WALL / 2, inX1],
]) {
  for (const side of ['z-', 'z+', 'x-', 'x+'])
    cornice(`cornice-${room}-${side}`, rx0, rx1, inZ0, inZ1, side);
  const bxm = (rx0 + rx1) / 2;
  const bzm = (inZ0 + inZ1) / 2;
  const hx = (rx1 - rx0) / 2 - 0.45;
  const hz = (inZ1 - inZ0) / 2 - 0.45;
  const BEAM = 0.05;
  const BW = 0.1;
  for (const sz of [-1, 1])
    slab(
      `beam-${room}-z${sz}`,
      'Ceiling',
      bxm - hx,
      bxm + hx,
      ch - BEAM,
      ch,
      bzm + sz * hz - BW / 2,
      bzm + sz * hz + BW / 2,
    );
  for (const sx of [-1, 1])
    slab(
      `beam-${room}-x${sx}`,
      'Ceiling',
      bxm + sx * hx - BW / 2,
      bxm + sx * hx + BW / 2,
      ch - BEAM,
      ch,
      bzm - hz + BW / 2,
      bzm + hz - BW / 2,
    );
}

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

// Windows on the garden wall. The ground-floor ones go right through the wall (real openings with
// glass in the middle and a frame, reveal and sill on both sides). The upper ones are drawn on the
// outside only. A window group sits on the outer face of the garden wall.
const boxAt = (mesh, x, y, z) => {
  mesh.position.set(x, y, z);
  return mesh;
};
const part = (group, name, material, sx, sy, sz, px, py, pz) => {
  const m = boxAt(unitBox(materials[material], sx, sy, sz), px, py, pz);
  m.name = name;
  group.add(m);
  return m;
};
const groundWindow = (name, x) => {
  const win = new THREE.Group();
  win.name = name;
  const { hw: hx } = WINDOW_HOLE;
  const hh = (WINDOW_HOLE.y1 - WINDOW_HOLE.y0) / 2;
  const outer = 0.1; // outer frame bar width
  // glass in the middle of the wall
  part(
    win,
    'pane',
    'GlassClear',
    hx * 2 - 0.04,
    hh * 2 - 0.04,
    0.02,
    0,
    0,
    -0.1,
  );
  // mullions
  part(win, 'mullion-v', 'Wood', 0.03, hh * 2, 0.04, 0, 0, -0.1);
  part(win, 'mullion-h', 'Wood', hx * 2, 0.03, 0.04, 0, 0, -0.1);
  // reveals: paint on the outer half, plaster-coloured on the inner half
  for (const [half, mat, z] of [
    ['out', 'Trim', -0.05],
    ['in', 'TrimIn', -0.15],
  ]) {
    part(win, `reveal-${half}-top`, mat, hx * 2, 0.02, 0.1, 0, hh - 0.01, z);
    part(
      win,
      `reveal-${half}-bottom`,
      mat,
      hx * 2,
      0.02,
      0.1,
      0,
      -hh + 0.01,
      z,
    );
    part(win, `reveal-${half}-left`, mat, 0.02, hh * 2, 0.1, -hx + 0.01, 0, z);
    part(win, `reveal-${half}-right`, mat, 0.02, hh * 2, 0.1, hx - 0.01, 0, z);
  }
  // outer frame and sill (wood, as before)
  const fw = hx * 2 + 2 * outer * 0.5;
  const fh = hh * 2 + 2 * outer * 0.5;
  part(win, 'frame-top', 'Wood', fw, 0.08, 0.06, 0, hh + 0.01, 0.03);
  part(win, 'frame-bottom', 'Wood', fw, 0.08, 0.06, 0, -hh - 0.01, 0.03);
  part(win, 'frame-left', 'Wood', 0.08, fh, 0.06, -hx - 0.01, 0, 0.03);
  part(win, 'frame-right', 'Wood', 0.08, fh, 0.06, hx + 0.01, 0, 0.03);
  part(win, 'sill-out', 'Wood', 1.05, 0.08, 0.16, 0, -hh - 0.1, 0.08);
  // inner architrave on the lining, and an inner sill
  const iz = -0.2 - LINING - 0.015;
  part(win, 'arch-top', 'TrimIn', fw, 0.08, 0.03, 0, hh + 0.01, iz);
  part(win, 'arch-bottom', 'TrimIn', fw, 0.08, 0.03, 0, -hh - 0.01, iz);
  part(win, 'arch-left', 'TrimIn', 0.08, fh, 0.03, -hx - 0.01, 0, iz);
  part(win, 'arch-right', 'TrimIn', 0.08, fh, 0.03, hx + 0.01, 0, iz);
  part(win, 'sill-in', 'TrimIn', 1.05, 0.04, 0.14, 0, -hh - 0.04, iz - 0.04);
  win.position.set(x, SILL_Y, hd);
  root.add(win);
};
const upperWindow = (name, x, y) => {
  const win = new THREE.Group();
  win.name = name;
  part(win, 'frame', 'Wood', 0.9, 1.1, 0.06, 0, 0, 0); // frame
  part(win, 'pane', 'Glass', 0.7, 0.9, 0.08, 0, 0, 0.01); // pane
  part(win, 'sill', 'Wood', 1.05, 0.08, 0.16, 0, -0.6, 0.04); // sill
  win.position.set(x, y, hd + 0.05);
  root.add(win);
};
GROUND_WINDOWS.forEach((x, i) => groundWindow(`Window${i + 1}`, x));
UPPER_WINDOWS.forEach((x, i) => upperWindow(`Window${i + 4}`, x, 4.0));

// The front door opening: architraves on both sides, jamb boards in the opening, a threshold in
// it and a low step outside. Nothing is higher than 0.03 m, so walking is not affected.
{
  const g = new THREE.Group();
  g.name = 'DoorFrame';
  const ox0 = bx(OPENING.minX);
  const ox1 = bx(OPENING.maxX);
  const ow = ox1 - ox0;
  const cx = (ox0 + ox1) / 2;
  const A = 0.1; // architrave width
  // outside (paint)
  part(
    g,
    'arch-out-left',
    'Trim',
    A,
    DOOR.h + A,
    0.04,
    ox0 - A / 2,
    (DOOR.h + A) / 2,
    hd + 0.02,
  );
  part(
    g,
    'arch-out-right',
    'Trim',
    A,
    DOOR.h + A,
    0.04,
    ox1 + A / 2,
    (DOOR.h + A) / 2,
    hd + 0.02,
  );
  part(g, 'arch-out-top', 'Trim', ow, A, 0.04, cx, DOOR.h + A / 2, hd + 0.02);
  // inside (dimmed in the rooms)
  const iz = hd - WALL - LINING - 0.015;
  part(
    g,
    'arch-in-left',
    'TrimIn',
    A,
    DOOR.h + A,
    0.03,
    ox0 - A / 2,
    (DOOR.h + A) / 2,
    iz,
  );
  part(
    g,
    'arch-in-right',
    'TrimIn',
    A,
    DOOR.h + A,
    0.03,
    ox1 + A / 2,
    (DOOR.h + A) / 2,
    iz,
  );
  part(g, 'arch-in-top', 'TrimIn', ow, A, 0.03, cx, DOOR.h + A / 2, iz);
  // jamb boards in the opening
  for (const [half, mat, z] of [
    ['out', 'Trim', hd - 0.05],
    ['in', 'TrimIn', hd - 0.15],
  ]) {
    part(
      g,
      `jamb-${half}-left`,
      mat,
      0.02,
      DOOR.h,
      0.1,
      ox0 + 0.01,
      DOOR.h / 2,
      z,
    );
    part(
      g,
      `jamb-${half}-right`,
      mat,
      0.02,
      DOOR.h,
      0.1,
      ox1 - 0.01,
      DOOR.h / 2,
      z,
    );
    part(
      g,
      `jamb-${half}-top`,
      mat,
      ow - 0.04,
      0.02,
      0.1,
      cx,
      DOOR.h - 0.01,
      z,
    );
  }
  // threshold in the opening and a step stone outside
  part(g, 'threshold', 'Wood', ow, 0.03, WALL, cx, 0.015, hd - WALL / 2);
  part(g, 'step', 'Stone', ow + 0.3, 0.025, 0.4, cx, 0.0125, hd + 0.06 + 0.2);
  root.add(g);
}
// A threshold in the inner doorway.
slab(
  'threshold-inner',
  'Wood',
  bx(INNER_DOORWAY.x) - WALL / 2,
  bx(INNER_DOORWAY.x) + WALL / 2,
  0,
  0.025,
  bz(INNER_DOORWAY.z) - INNER_DOORWAY.w / 2,
  bz(INNER_DOORWAY.z) + INNER_DOORWAY.w / 2,
);

// The door: its origin is the hinge, the leaf extends along +x, 1.2 m wide, up to 2.1 m high. The
// foot of the leaf clears the threshold and the step by a hand's breadth of a few millimetres.
const door = new THREE.Group();
door.name = 'Door';
door.position.set(HINGE.x - HOUSE.x, 0, HINGE.z - HOUSE.z);
{
  const LEAF_Y0 = 0.035;
  const LEAF_H = DOOR.h - LEAF_Y0;
  const T = 0.05;
  part(
    door,
    'leaf',
    'Paint',
    DOOR.w,
    LEAF_H,
    T,
    DOOR.w / 2,
    LEAF_Y0 + LEAF_H / 2,
    0,
  );
  // six raised panels (two columns, three rows) on both faces, each with a paler moulding round it
  const stile = 0.14;
  const mid = 0.1;
  const colW = (DOOR.w - 2 * stile - mid) / 2;
  const rows = [0.6, 0.45, 0.495]; // bottom to top
  const railB = 0.18;
  const railM = 0.1;
  let y = LEAF_Y0 + railB;
  rows.forEach((rh2, r) => {
    const cy = y + rh2 / 2;
    [0, 1].forEach((c) => {
      const cxp = stile + colW / 2 + c * (colW + mid);
      for (const side of [1, -1]) {
        part(
          door,
          `moulding-${r}${c}${side}`,
          'Trim',
          colW + 0.04,
          rh2 + 0.04,
          0.01,
          cxp,
          cy,
          side * (T / 2 + 0.005),
        );
        part(
          door,
          `panel-${r}${c}${side}`,
          'Paint',
          colW,
          rh2,
          0.012,
          cxp,
          cy,
          side * (T / 2 + 0.012),
        );
      }
    });
    y += rh2 + railM;
  });
  // a knob on each side, near the free edge
  for (const side of [1, -1]) {
    const neck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.014, 0.06, 10),
      materials.Metal,
    );
    neck.rotation.x = Math.PI / 2;
    neck.position.set(DOOR.w - 0.08, 1.0, side * (T / 2 + 0.03));
    neck.name = `knob-neck-${side}`;
    door.add(neck);
    const knob = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 12, 8),
      materials.Metal,
    );
    knob.position.set(DOOR.w - 0.08, 1.0, side * (T / 2 + 0.07));
    knob.name = `knob-${side}`;
    door.add(knob);
  }
}
root.add(door);

const glb = await new Promise((resolve, reject) =>
  new GLTFExporter().parse(root, resolve, reject, { binary: true, trs: true }),
);
const out = new URL('../public/assets/models/house.glb', import.meta.url);
mkdirSync(new URL('./', out), { recursive: true });
writeFileSync(out, Buffer.from(glb));
console.log(`house.glb written, ${glb.byteLength} bytes`);
