// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import {
  MANIFEST,
  interiorManifest,
  streetManifest,
  itemsForFile,
} from '../src/world/manifest.js';
import { ASSET_RECORDS } from '../src/data/licences.js';
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

describe('street manifest (FR-16, AC-6.8)', () => {
  it('lists car-1..car-3 and the lamp by default, all under the app base', () => {
    const m = streetManifest();
    expect(m.map((a) => a.id)).toEqual(['car-1', 'car-2', 'car-3', 'lamp']);
    expect(MANIFEST.filter((a) => a.url.includes('models/street/'))).toEqual(m);
  });
  it('lists only the cars and the lamp the build switches use', () => {
    expect(streetManifest(2, 1).map((a) => a.id)).toEqual([
      'car-1',
      'car-2',
      'lamp',
    ]);
    expect(streetManifest(1, 0).map((a) => a.id)).toEqual(['car-1']);
  });
  it('skips ids that have no file in the list it is given', () => {
    expect(streetManifest(3, 1, ['car-2', 'lamp']).map((a) => a.id)).toEqual([
      'car-2',
      'lamp',
    ]);
  });
  it('points only to files that exist, with a licence record each', () => {
    const recorded = new Set(ASSET_RECORDS.flatMap((r) => r.files));
    for (const a of streetManifest(99, 1)) {
      expect(a.url, a.id).not.toMatch(/^(https?:)?\/\//);
      expect(existsSync(publicDir + a.url.replace(/^\//, '')), a.id).toBe(true);
      expect(recorded.has(a.url.replace(/^\/assets\//, '')), a.id).toBe(true);
    }
  });
});
