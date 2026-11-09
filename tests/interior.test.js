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
