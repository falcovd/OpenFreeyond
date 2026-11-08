import { box, surface } from './common.js';
import { HOUSE, DOOR } from '../layout.js';

// A gable roof. The ridge runs along x. Front slope faces the garden (+z).
function roofGeometry(THREE, hw, hd, rh, o) {
  const a = [-hw - o, 0, hd + o];
  const b = [hw + o, 0, hd + o];
  const c = [hw + o, rh, 0];
  const d = [-hw - o, rh, 0];
  const e = [hw + o, 0, -hd - o];
  const f = [-hw - o, 0, -hd - o];
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
function gableGeometry(THREE, x, hd, rh) {
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

function tag(object, part) {
  object.userData.part = part;
  return object;
}

export function buildHouse(THREE, assets) {
  const { w, d, wallHeight: wh, roofHeight: rh, floors } = HOUSE;
  const hw = w / 2;
  const hd = d / 2;
  const g = new THREE.Group();
  g.position.set(HOUSE.x, 0, HOUSE.z);
  g.userData.kind = 'house';

  const wallMaterial = () =>
    surface(THREE, assets, 'brick', '#e8c9a0', { repeat: [w / 2, wh / 2] });
  g.add(tag(box(THREE, w, wh, d, wallMaterial(), 0, wh / 2, 0), 'walls'));

  const roofMaterial = surface(THREE, assets, 'roof', '#b5543a', {
    repeat: [w / 1.5, d / 1.5],
  });
  roofMaterial.side = THREE.DoubleSide;
  const roof = new THREE.Mesh(
    roofGeometry(THREE, hw, hd, rh, 0.4),
    roofMaterial,
  );
  roof.position.y = wh;
  g.add(tag(roof, 'roof'));
  for (const x of [-hw, hw]) {
    const gable = new THREE.Mesh(
      gableGeometry(THREE, x, hd, rh),
      wallMaterial(),
    );
    gable.material.side = THREE.DoubleSide;
    gable.position.y = wh;
    g.add(gable);
  }

  const wood = () => surface(THREE, assets, 'wood', '#8b5a2b');
  const front = hd + 0.05; // just outside the garden wall
  const door = new THREE.Group();
  door.add(box(THREE, 1.0, 2.1, 0.1, wood(), 0, 1.05, 0));
  door.add(box(THREE, 1.2, 0.12, 0.14, wood(), 0, 2.16, 0)); // lintel
  door.position.set(DOOR.x - HOUSE.x, 0, front);
  g.add(tag(door, 'door'));

  const glass = new THREE.MeshStandardMaterial({
    color: '#9cc7e8',
    roughness: 0.2,
    emissive: '#3b5a73',
    emissiveIntensity: 0.25,
  });
  const rowHeight = wh / floors;
  const windowXs = [-1.6, 1.6];
  for (let floor = 0; floor < floors; floor++) {
    const y = floor * rowHeight + rowHeight * 0.6;
    const xs = floor === 0 ? windowXs : [...windowXs, 0];
    for (const x of xs) {
      const win = new THREE.Group();
      win.add(box(THREE, 0.9, 1.1, 0.06, wood(), 0, 0, 0)); // frame
      win.add(box(THREE, 0.7, 0.9, 0.08, glass, 0, 0, 0.01)); // pane
      win.add(box(THREE, 1.05, 0.08, 0.16, wood(), 0, -0.6, 0.04)); // sill
      win.position.set(x, y, front);
      g.add(tag(win, 'window'));
    }
  }
  return g;
}
