// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync } from 'node:fs';
import {
  MANIFEST,
  interiorManifest,
  neighbourhoodManifest,
  itemsForFile,
} from '../src/world/manifest.js';
import { ASSET_RECORDS } from '../src/data/licences.js';
import { visiblePlots } from '../src/world/plots.js';
import { CARS } from '../src/world/streetLayout.js';
import { INTERIOR_ITEMS } from '../src/world/layout.js';

const publicDir = new URL('../public/', import.meta.url).pathname;

describe('manifest (FR-20, AC-11.2)', () => {
  it('points only to files of this product, relative to its own address', () => {
    for (const a of MANIFEST) {
      expect(a.url, a.id).not.toMatch(/^(https?:)?\/\//);
      expect(existsSync(publicDir + a.url.replace(/^\//, '')), a.id).toBe(true);
    }
  });
  it('has a licence record for every file it loads', () => {
    const recorded = new Set(ASSET_RECORDS.flatMap((r) => r.files));
    for (const a of MANIFEST)
      expect(recorded.has(a.url.replace(/^\/assets\//, '')), a.id).toBe(true);
  });
});

describe('interior manifest (FR-20, FR-22)', () => {
  it('lists the TV clip and still in clip mode', () => {
    const m = interiorManifest('clip');
    expect(m.find((a) => a.id === 'tv-clip')?.type).toBe('video');
    expect(m.find((a) => a.id === 'tv-still')?.type).toBe('texture');
  });
  it('has the still and no clip in still mode', () => {
    const m = interiorManifest('still');
    expect(m.some((a) => a.id === 'tv-still')).toBe(true);
    expect(m.some((a) => a.id === 'tv-clip')).toBe(false);
  });
  it('lists no entry for an item without a file, and each file once', () => {
    const m = interiorManifest('clip').filter((a) => a.type === 'model');
    const files = INTERIOR_ITEMS.filter((i) => i.file);
    expect(m.length).toBe(new Set(files.map((i) => i.file)).size);
    expect(new Set(m.map((a) => a.url)).size).toBe(m.length);
  });
  it('points only to files that exist and have a licence record', () => {
    const recorded = new Set(ASSET_RECORDS.flatMap((r) => r.files));
    for (const a of interiorManifest('clip')) {
      expect(a.url, a.id).not.toMatch(/^(https?:)?\/\//);
      expect(existsSync(publicDir + a.url.replace(/^\//, '')), a.id).toBe(true);
      expect(recorded.has(a.url.replace(/^\/assets\//, '')), a.id).toBe(true);
    }
  });
  it('lists the furniture textures, after the place, with a licence record each', () => {
    const m = interiorManifest('clip');
    for (const id of ['fabric', 'cabinet']) {
      expect(m.find((a) => a.id === id)?.type, id).toBe('texture');
      expect(
        MANIFEST.some((a) => a.id === id),
        id,
      ).toBe(false);
    }
  });
  it('lists the one chair file once, for four chairs', () => {
    const m = interiorManifest('clip').filter((a) =>
      a.url.endsWith('chair.glb'),
    );
    expect(m).toHaveLength(1);
    expect(itemsForFile(m[0].url).map((i) => i.id)).toEqual([
      'chair-1',
      'chair-2',
      'chair-3',
      'chair-4',
    ]);
  });
  it('lists the TV desk file once, for one item', () => {
    const m = interiorManifest('clip').filter((a) =>
      a.url.endsWith('tv-cabinet.glb'),
    );
    expect(m).toHaveLength(1);
    expect(itemsForFile(m[0].url).map((i) => i.id)).toEqual(['tv-cabinet']);
  });
  it('maps a shared file to every item that uses it', () => {
    const pendant = interiorManifest('clip').find(
      (a) => a.id === 'pendant-living',
    );
    expect(itemsForFile(pendant.url).map((i) => i.id)).toEqual([
      'pendant-living',
      'pendant-kitchen',
    ]);
    expect(itemsForFile('/nope')).toEqual([]);
  });
});

describe('street models (FR-16, AC-6.8)', () => {
  it('keep a licence record for every file under models/street, and stay out of the first load', () => {
    const recorded = new Set(ASSET_RECORDS.flatMap((r) => r.files));
    const files = readdirSync(publicDir + 'assets/models/street');
    expect(files.sort()).toEqual([
      'car-1.glb',
      'car-2.glb',
      'car-3.glb',
      'lamp.glb',
    ]);
    for (const f of files)
      expect(recorded.has(`models/street/${f}`), f).toBe(true);
    expect(MANIFEST.some((a) => a.url.includes('models/street/'))).toBe(false);
  });
});

describe('neighbourhood manifest (FR-14, AC-6.6)', () => {
  const m = neighbourhoodManifest();
  it('points only to files that exist, under the app base, with a licence record', () => {
    const recorded = new Set(ASSET_RECORDS.flatMap((r) => r.files));
    expect(m.length).toBeGreaterThan(0);
    for (const a of m) {
      expect(a.url, a.id).toMatch(/\/assets\//);
      expect(existsSync(publicDir + a.url.replace(/^\//, '')), a.id).toBe(true);
      expect(recorded.has(a.url.replace(/^\/assets\//, '')), a.id).toBe(true);
    }
  });
  it('derives from the visible plots: house files once each, only the car models used, the lamp', () => {
    const looks = new Set(visiblePlots().map((p) => p.look));
    const houses = m.filter((a) => a.id.startsWith('house-'));
    expect(houses.map((a) => a.id).sort()).toEqual(
      [...looks].map((l) => `house-${l}`).sort(),
    );
    expect(houses.every((a) => a.url.includes('models/houses/'))).toBe(true);
    expect(
      m
        .filter((a) => a.id.startsWith('car-'))
        .map((a) => a.id)
        .sort(),
    ).toEqual([...new Set(CARS.map((c) => c.model))].sort());
    expect(m.some((a) => a.id === 'lamp')).toBe(true);
    expect(new Set(m.map((a) => a.id)).size).toBe(m.length);
  });
  it('lists no lamp without lamps, and no house of a plot that is not shown', () => {
    expect(neighbourhoodManifest([], [], []).length).toBe(0);
    const one = neighbourhoodManifest(visiblePlots().slice(0, 1), [], []);
    expect(one).toHaveLength(1);
  });
  it('keeps the street and house models out of the place manifest', () => {
    expect(MANIFEST.some((a) => /models\/(street|houses)\//.test(a.url))).toBe(
      false,
    );
  });
});
