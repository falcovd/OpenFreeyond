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
  it('lets a replaced model receive shadows but not cast them', () => {
    const { replace } = buildInterior(THREE);
    const fitted = replace('couch', model());
    const meshes = [];
    fitted.traverse((o) => o.isMesh && meshes.push(o));
    expect(meshes.length).toBeGreaterThan(0);
    for (const m of meshes) {
      expect(m.receiveShadow).toBe(true);
      expect(m.castShadow).toBe(false);
    }
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

// A model with a named material, a normal on every vertex, as the kit's models have.
const furnitureModel = (name = 'wood') => {
  const g = new THREE.Group();
  const geo = new THREE.BoxGeometry(2, 1, 1);
  geo.setAttribute('uv', geo.attributes.uv.clone());
  const mat = new THREE.MeshStandardMaterial({ color: '#e5995f' });
  mat.name = name;
  g.add(new THREE.Mesh(geo, mat));
  return g;
};
const firstMesh = (root) => {
  let r;
  root.traverse((o) => {
    if (o.isMesh && !r) r = o;
  });
  return r;
};

describe('the dark TV frame (PO finding R-10)', () => {
  const tvModel = () => {
    const g = new THREE.Group();
    for (const name of ['metalDark', 'metal']) {
      const m = new THREE.MeshStandardMaterial({ color: '#bcd0d4' });
      m.name = name;
      g.add(new THREE.Mesh(new THREE.BoxGeometry(2, 1, 1), m));
    }
    return g;
  };
  it('makes the body and stand dark, not dimmed kit colours, and leaves the screen alone', () => {
    const { group, replace, tv } = buildInterior(THREE);
    replace('tv', tvModel());
    const lum = (c) => (c.r + c.g + c.b) / 3;
    group.traverse((o) => {
      if (o.isMesh && o.material.name) {
        expect(lum(o.material.color), o.material.name).toBeLessThan(0.05);
      }
    });
    expect(tv.screen.material.toneMapped).toBe(false);
    expect(tv.screen.material.color.getHex()).toBe(0x101014);
  });
  it('does not touch the colour of another item', () => {
    const { group, replace } = buildInterior(THREE);
    replace('kitchen', tvModel());
    group.traverse((o) => {
      if (o.isMesh && o.material.name)
        expect(o.material.color.r).toBeGreaterThan(0.2);
    });
  });
});

describe('textured furniture (PO finding 4; FR-20, FR-23)', () => {
  const tex = () => new THREE.Texture();
  it('keeps the kit colour and its UVs until the texture arrives', () => {
    const { group, replace } = buildInterior(THREE);
    replace('dining-table', furnitureModel('wood'));
    const mesh = firstMesh(find(group, 'dining-table'));
    expect(mesh.material.map).toBeNull();
    expect(mesh.userData.textured).toBeUndefined();
  });
  it('textures a part by its material name when the texture is already known', () => {
    const { group, replace } = buildInterior(THREE, {
      textures: { cabinet: tex() },
    });
    replace('dining-table', furnitureModel('wood'));
    const mesh = firstMesh(find(group, 'dining-table'));
    expect(mesh.material.map).toBeTruthy();
    expect(mesh.material.map.wrapS).toBe(THREE.RepeatWrapping);
    expect(mesh.userData.textured).toBe(true);
  });
  it('textures a model that is already in place when the texture arrives later', () => {
    const { group, replace, setTexture } = buildInterior(THREE);
    replace('kitchen', furnitureModel('wood'));
    const mesh = firstMesh(find(group, 'kitchen'));
    expect(mesh.material.map).toBeNull();
    setTexture('cabinet', tex());
    expect(firstMesh(find(group, 'kitchen')).material.map).toBeTruthy();
  });
  it('leaves parts without a rule (metal, lamp) as they were', () => {
    const { group, replace, setTexture } = buildInterior(THREE);
    replace('kitchen', furnitureModel('metal'));
    setTexture('cabinet', tex());
    setTexture('fabric', tex());
    expect(firstMesh(find(group, 'kitchen')).material.map).toBeNull();
  });
  it('does nothing when the texture failed (nothing is ever set) and keeps the model', () => {
    const { group, replace } = buildInterior(THREE);
    replace('couch', furnitureModel('carpet'));
    const slot = find(group, 'couch');
    expect(slot.userData.plain).toBeFalsy();
    expect(firstMesh(slot).material.map).toBeNull();
  });
  it('ignores an empty texture', () => {
    const { replace, setTexture } = buildInterior(THREE);
    replace('couch', furnitureModel('carpet'));
    expect(() => setTexture('fabric', null)).not.toThrow();
  });
  it('gives clones of one file their own UVs and materials, so one chair does not change another', () => {
    const { group, replace, setTexture } = buildInterior(THREE);
    const shared = furnitureModel('wood');
    replace('chair-1', shared.clone(true));
    replace('chair-2', shared.clone(true));
    setTexture('cabinet', tex());
    const a = firstMesh(find(group, 'chair-1'));
    const b = firstMesh(find(group, 'chair-2'));
    expect(a.geometry).not.toBe(b.geometry);
    expect(a.material).not.toBe(b.material);
    expect(a.geometry).not.toBe(firstMesh(shared).geometry);
    expect(firstMesh(shared).material.map).toBeNull();
  });
  it('projects UVs in metres: a bigger model gets more repeats', () => {
    const { group, replace } = buildInterior(THREE, {
      textures: { cabinet: tex() },
    });
    replace('dining-table', furnitureModel('wood'));
    const uv = firstMesh(find(group, 'dining-table')).geometry.attributes.uv;
    expect(uv.count).toBeGreaterThan(0);
    let max = 0;
    for (let i = 0; i < uv.count; i++)
      max = Math.max(max, uv.getX(i), uv.getY(i));
    // 1.4 m wide table, 0.6 m per repeat, about 2.3 repeats.
    expect(max).toBeGreaterThan(1);
  });
});

describe('the dining chairs (PO finding 7)', () => {
  const chairs = INTERIOR_ITEMS.filter((i) => i.id.startsWith('chair-'));
  it('has four chairs, each a plain block first and a model after replace, or a block on failure', () => {
    expect(chairs.map((c) => c.id)).toEqual([
      'chair-1',
      'chair-2',
      'chair-3',
      'chair-4',
    ]);
    const { group, replace, fail } = buildInterior(THREE);
    for (const c of chairs)
      expect(find(group, c.id).userData.plain).toBeTruthy();
    replace('chair-1', model());
    fail('chair-2');
    expect(find(group, 'chair-1').userData.plain).toBeFalsy();
    expect(find(group, 'chair-2').userData.plain).toBeTruthy();
    expect(find(group, 'chair-3').userData.plain).toBeTruthy();
  });
  it('blocks walking, like the other solid furniture (FR-17)', () => {
    for (const c of chairs)
      expect(
        SOLIDS.some((s) => s.id === c.id),
        c.id,
      ).toBe(true);
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

describe('the TV desk (PO finding R-10)', () => {
  it('gets wood from the cabinet texture, like the other cabinets', () => {
    const { group, replace } = buildInterior(THREE, {
      textures: { cabinet: new THREE.Texture() },
    });
    replace('tv-cabinet', furnitureModel('wood'));
    expect(firstMesh(find(group, 'tv-cabinet')).material.map).toBeTruthy();
  });
});

describe('the TV screen (FR-15, FR-22, FR-23)', () => {
  const tvItem = INTERIOR_ITEMS.find((i) => i.id === 'tv');
  const still = () => new THREE.Texture();
  const fakeVideo = (play = () => Promise.resolve()) => ({
    muted: false,
    loop: false,
    play,
    pause: () => {},
    load: () => {},
    removeAttribute: () => {},
    addEventListener: () => {},
  });
  const mounted = (opts) => {
    const interior = buildInterior(THREE, opts);
    interior.replace('tv', model());
    return interior;
  };

  it('sits on the model, in its own frame, so it scales with the model', () => {
    const { tv, slots } = mounted();
    const wrapper = slots.get('tv');
    expect(tv.screen.parent).toBe(wrapper.children[0]);
    expect(tv.screen.position.y).toBeCloseTo(tvItem.screen.y);
    expect(tv.screen.position.z).toBeCloseTo(tvItem.screen.z);
    expect(tv.screen.material.toneMapped).toBe(false);
  });
  it('is dark until a still arrives, then shows the still', () => {
    const { tv } = mounted();
    expect(tv.screen.material.map).toBeNull();
    const t = still();
    tv.setStill(t);
    expect(tv.screen.material.map).toBe(t);
  });
  it('applies media that arrived before the model', () => {
    const interior = buildInterior(THREE);
    const t = still();
    interior.tv.setStill(t);
    interior.replace('tv', model());
    expect(interior.tv.screen.material.map).toBe(t);
  });
  it('plays the clip muted and looping, and shows it', () => {
    const { tv } = mounted();
    tv.setStill(still());
    const video = fakeVideo();
    tv.setClip(video);
    expect(video.muted).toBe(true);
    expect(video.loop).toBe(true);
    expect(tv.screen.material.map.isVideoTexture).toBe(true);
  });
  it('falls back to the still when the browser blocks the clip (AC-4.7)', async () => {
    const { tv } = mounted();
    const t = still();
    tv.setStill(t);
    tv.setClip(fakeVideo(() => Promise.reject(new Error('blocked'))));
    await Promise.resolve();
    await Promise.resolve();
    expect(tv.state.clip).toBe('blocked');
    expect(tv.screen.material.map).toBe(t);
  });
  it('falls back to the still when the clip fails to load (AC-4.7)', () => {
    const { tv } = mounted();
    const t = still();
    tv.setStill(t);
    tv.clipFailed();
    expect(tv.screen.material.map).toBe(t);
  });
  it('goes dark when both fail', () => {
    const { tv } = mounted();
    tv.clipFailed();
    tv.stillFailed();
    expect(tv.screen.material.map).toBeNull();
  });
  it('in still mode the clip never shows and no clip is expected (AC-4.8)', () => {
    const { tv } = mounted({ tvMode: 'still' });
    expect(tv.state.clip).toBe('none');
    const t = still();
    tv.setStill(t);
    tv.setClip(fakeVideo());
    expect(tv.screen.material.map).toBe(t);
  });
  it('dispose pauses the video, clears its source and frees the textures', () => {
    const { tv } = mounted();
    const t = still();
    let t2 = 0;
    t.addEventListener('dispose', () => t2++);
    tv.setStill(t);
    let paused = 0;
    let loaded = 0;
    const video = fakeVideo();
    video.pause = () => paused++;
    video.load = () => loaded++;
    video.src = 'x.mp4';
    tv.setClip(video);
    tv.dispose();
    expect(paused).toBe(1);
    expect(loaded).toBe(1);
    expect(video.src).toBe('');
    expect(t2).toBe(1);
    expect(() => tv.dispose()).not.toThrow();
  });
});
