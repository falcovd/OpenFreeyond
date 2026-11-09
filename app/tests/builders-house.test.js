import { describe, it, expect, afterEach } from 'vitest';
import * as THREE from 'three';
import { makeAssets } from '../src/world/builders/common.js';
import { buildHouse } from '../src/world/builders/house.js';
import { INTERIOR_DIM } from '../src/world/interiorConfig.js';
import {
  HOUSE,
  HOUSE_BLOCK,
  HINGE,
  SOLIDS,
  BOUNDS,
  SPAWN,
  useClosedHouse,
  resetHouse,
} from '../src/world/layout.js';
import { resolveMove } from '../src/logic/collision.js';

afterEach(() => resetHouse());

const mesh = (name, materialName, w = 1, h = 1, d = 1) => {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ name: materialName }),
  );
  m.name = name;
  return m;
};
function fakeHouse() {
  const scene = new THREE.Group();
  scene.add(mesh('WallFront', 'Wall', 4, 5, 0.2));
  scene.add(mesh('Roof', 'Roof', 8, 1, 5));
  scene.add(mesh('Floor', 'Floor', 8, 0.02, 5));
  scene.add(mesh('Ceiling', 'Ceiling', 8, 0.1, 5));
  scene.add(mesh('MidWall', 'Plaster', 0.2, 2.5, 2));
  const trim = mesh('Arch', 'TrimIn');
  trim.material.color.set('#ffffff');
  scene.add(trim);
  const door = new THREE.Group();
  door.name = 'Door';
  door.position.set(HINGE.x - HOUSE.x, 0, HINGE.z - HOUSE.z);
  door.add(mesh('DoorLeaf', 'Wood', 1.2, 2.1, 0.05));
  scene.add(door);
  const win = new THREE.Group();
  win.name = 'Window1';
  win.add(mesh('Pane', 'GlassClear'));
  scene.add(win);
  const upper = new THREE.Group();
  upper.name = 'Window4';
  upper.add(mesh('Pane', 'Glass'));
  scene.add(upper);
  return { scene };
}
const texture = () => {
  const t = new THREE.Texture();
  t.isTexture = true;
  return t;
};
const loadedAssets = () =>
  makeAssets(
    new Map([
      ['house', fakeHouse()],
      ['brick', texture()],
      ['wood', texture()],
      ['roof', texture()],
      ['wallpaper', texture()],
    ]),
  );
const parts = (root, part) => {
  const out = [];
  root.traverse((o) => {
    if (o.userData.part === part) out.push(o);
  });
  return out;
};

describe('buildHouse with the model', () => {
  it('returns the house group with the door, tagged parts and textured walls', () => {
    const g = buildHouse(THREE, loadedAssets());
    expect(g.userData.kind).toBe('house');
    expect(g.userData.closed).toBeFalsy();
    expect(g.position.x).toBe(HOUSE.x);
    expect(g.position.z).toBe(HOUSE.z);
    expect(g.userData.door.name).toBe('Door');
    expect(g.userData.door.userData.part).toBe('door');
    expect(parts(g, 'window')).toHaveLength(2);
    expect(parts(g, 'roof')).toHaveLength(1);
    expect(parts(g, 'walls')).toHaveLength(1);
    expect(parts(g, 'walls')[0].material.map).toBeTruthy();
    expect(parts(g, 'roof')[0].material.map).toBeTruthy();
  });
  it('puts the wallpaper on the indoor plaster, tiled by size, with a white ceiling (findings 5, 6)', () => {
    const g = buildHouse(THREE, loadedAssets());
    let plaster;
    let ceiling;
    let trim;
    g.traverse((o) => {
      if (o.name === 'MidWall') plaster = o;
      if (o.name === 'Ceiling') ceiling = o;
      if (o.name === 'Arch') trim = o;
    });
    expect(plaster.material.map).toBeTruthy();
    // 2 m of wall at 0.8 m per repeat, 2.5 m high
    expect(plaster.material.map.repeat.x).toBeCloseTo(2 / 0.8);
    expect(plaster.material.map.repeat.y).toBeCloseTo(2.5 / 0.8);
    expect(ceiling.material.map).toBeFalsy();
    const c = ceiling.material.color;
    expect(c.r).toBeCloseTo(c.g);
    expect(c.g).toBeCloseTo(c.b);
    expect(c.r).toBeGreaterThan(0.6 * 0.99);
    expect(c.r).toBeLessThanOrEqual(1);
    // indoor trim is dimmed like the plaster
    expect(trim.material.color.r).toBeCloseTo(INTERIOR_DIM, 1);
  });
  it('makes the ground-floor window glass 30% opaque and leaves the upper glass as it was (R-9)', () => {
    const g = buildHouse(THREE, loadedAssets());
    const pane = (win) => {
      let p;
      g.traverse((o) => o.name === win && (p = o.children[0]));
      return p;
    };
    const low = pane('Window1');
    expect(low.material.name).toBe('GlassClear');
    expect(low.material.transparent).toBe(true);
    expect(low.material.opacity).toBeCloseTo(0.3);
    expect(low.material.depthWrite).toBe(false);
    expect(low.material.side).toBe(THREE.FrontSide);
    expect(low.renderOrder).toBeGreaterThan(0);
    const high = pane('Window4');
    expect(high.material.name).toBe('Glass');
    expect(high.material.transparent).toBe(false);
    expect(high.material.opacity).toBe(1);
    expect(high.material.depthWrite).toBe(true);
  });
  it('scales the brick repeat by the node scale of the generated model', () => {
    const scene = new THREE.Group();
    const m = mesh('Wall1', 'Wall', 1, 1, 1);
    m.scale.set(4, 5, 0.2);
    scene.add(m);
    const g = buildHouse(
      THREE,
      makeAssets(
        new Map([
          ['house', { scene }],
          ['brick', texture()],
        ]),
      ),
    );
    expect(parts(g, 'walls')[0].material.map.repeat.x).toBeCloseTo(2);
    expect(parts(g, 'walls')[0].material.map.repeat.y).toBeCloseTo(2.5);
  });
  it('uses plain colours when the textures failed', () => {
    const g = buildHouse(THREE, makeAssets(new Map([['house', fakeHouse()]])));
    expect(parts(g, 'walls')[0].material.map).toBeFalsy();
    let plaster;
    g.traverse((o) => o.name === 'MidWall' && (plaster = o));
    expect(plaster.material.map).toBeFalsy();
    expect(plaster.material.color.r).toBeGreaterThan(0);
    expect(g.userData.door).toBeTruthy();
  });
});

describe('buildHouse without the model (FR-21, AC-7.9)', () => {
  it('is one closed block with no door', () => {
    const g = buildHouse(THREE, makeAssets(new Map()));
    expect(g.userData.kind).toBe('house');
    expect(g.userData.plain).toBeTruthy();
    expect(g.userData.closed).toBe(true);
    expect(g.userData.door).toBeUndefined();
    const meshes = [];
    g.traverse((o) => o.isMesh && meshes.push(o));
    expect(meshes).toHaveLength(1);
    meshes[0].geometry.computeBoundingBox();
    const size = meshes[0].geometry.boundingBox.getSize(new THREE.Vector3());
    expect(size.x).toBeCloseTo(HOUSE_BLOCK.w);
    expect(size.z).toBeCloseTo(HOUSE_BLOCK.d);
  });
  it('useClosedHouse leaves only the block, resetHouse restores the rooms', () => {
    useClosedHouse();
    expect(SOLIDS.some((s) => s.id === 'house-block')).toBe(true);
    expect(SOLIDS.some((s) => s.zone === 'house')).toBe(false);
    resetHouse();
    expect(SOLIDS.some((s) => s.id === 'house-block')).toBe(false);
    expect(SOLIDS.some((s) => s.zone === 'house')).toBe(true);
  });
  it('keeps the person out of the closed house', () => {
    useClosedHouse();
    let p = { x: SPAWN.x, z: SPAWN.z };
    for (let i = 0; i < 400; i++) {
      const next = { x: p.x, z: p.z - 0.05 };
      p = resolveMove(p, next, SOLIDS, BOUNDS);
    }
    expect(p.z).toBeGreaterThan(HOUSE.z + HOUSE.d / 2);
  });
});
