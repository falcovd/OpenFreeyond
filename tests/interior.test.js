import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { buildInterior } from '../src/world/builders/interior.js';
import { buildWorld } from '../src/world/buildWorld.js';
import { makeAssets } from '../src/world/builders/common.js';
import { INTERIOR_ITEMS, SOLIDS } from '../src/world/layout.js';

const model = () => {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.BoxGeometry(2, 1, 1)));
  return g;
};
const find = (root, id) => {
  let r;
  root.traverse((o) => {
    if (o.userData.item === id) r = o;
  });
  return r;
};

describe('the interior (FR-20, FR-23)', () => {
  it('starts with a plain block for every item, before any file has arrived (AC-7.8)', () => {
    const { group } = buildInterior(THREE);
    for (const i of INTERIOR_ITEMS)
      expect(find(group, i.id)?.userData.plain, i.id).toBeTruthy();
  });
  it('blocks walking from the first frame: every solid item has a solid (AC-7.8)', () => {
    for (const i of INTERIOR_ITEMS.filter((x) => x.solid !== false))
      expect(
        SOLIDS.some((s) => s.id === i.id),
        i.id,
      ).toBe(true);
  });
  it('swaps a block for its model when the file arrives, and only that one', () => {
    const { group, replace } = buildInterior(THREE);
    replace('couch', model());
    expect(find(group, 'couch').userData.plain).toBeFalsy();
    expect(find(group, 'tv').userData.plain).toBeTruthy();
  });
  it('fits the model into the footprint of its block', () => {
    const { group, replace } = buildInterior(THREE);
    replace('dining-table', model());
    const box = new THREE.Box3().setFromObject(find(group, 'dining-table'));
    const s = box.getSize(new THREE.Vector3());
    const item = INTERIOR_ITEMS.find((i) => i.id === 'dining-table');
    expect(s.x).toBeLessThanOrEqual(item.w + 1e-6);
    expect(s.z).toBeLessThanOrEqual(item.d + 1e-6);
    expect(s.y).toBeLessThanOrEqual(item.h + 1e-6);
  });
  it('keeps the plain block when a file fails (AC-7.10)', () => {
    const { group, fail } = buildInterior(THREE);
    fail('kitchen');
    expect(find(group, 'kitchen').userData.plain).toBeTruthy();
  });
});

describe('the interior in the world (FR-21)', () => {
  const colours = { hair: 'brown', clothing: 'mustard' };
  it('is added, and pickable, only when the house loaded', () => {
    const house = { scene: new THREE.Group(), animations: [] };
    house.scene.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1)));
    const withHouse = buildWorld(
      THREE,
      makeAssets(new Map([['house', house]])),
      colours,
    );
    expect(withHouse.interior).toBeTruthy();
    expect(withHouse.group.children).toContain(withHouse.interior.group);
    expect(withHouse.pickables).toContain(withHouse.interior.group);
    const without = buildWorld(THREE, makeAssets(new Map()), colours);
    expect(without.interior).toBeNull();
    let found = false;
    without.group.traverse((o) => {
      if (o.userData.kind === 'interior') found = true;
    });
    expect(found).toBe(false);
  });
});
