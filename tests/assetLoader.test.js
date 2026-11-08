import { describe, it, expect, vi } from 'vitest';
import {
  loadAssets,
  failureMessage,
  LOAD_TIMEOUT_MS,
} from '../src/world/assetLoader.js';

const manifest = [
  { id: 'grass', type: 'texture', url: '/g.jpg' },
  { id: 'tree', type: 'model', url: '/t.glb' },
];

describe('loadAssets (FR-16)', () => {
  it('returns every loaded value', async () => {
    const r = await loadAssets(manifest, {
      texture: async () => 'T',
      model: async () => 'M',
    });
    expect(r.values.get('grass')).toBe('T');
    expect(r.values.get('tree')).toBe('M');
    expect(r.failed).toEqual([]);
    expect(r.stalled).toBe(false);
  });

  it('lists a failed file and still resolves (AC-8.3)', async () => {
    const r = await loadAssets(manifest, {
      texture: async () => {
        throw new Error('404');
      },
      model: async () => 'M',
    });
    expect(r.failed).toEqual(['grass']);
    expect(r.values.has('grass')).toBe(false);
    expect(r.values.get('tree')).toBe('M');
  });

  it('survives every file failing, the character included (AC-8.4)', async () => {
    const withCharacter = [
      ...manifest,
      { id: 'character', type: 'model', url: '/c.glb' },
    ];
    const r = await loadAssets(withCharacter, {
      texture: async () => {
        throw new Error('x');
      },
      model: async () => {
        throw new Error('x');
      },
    });
    expect(r.failed.sort()).toEqual(['character', 'grass', 'tree']);
    expect(r.values.size).toBe(0);
  });

  it('counts a file that has not loaded after 30 seconds as failed (AC-8.6)', async () => {
    vi.useFakeTimers();
    const never = () => new Promise(() => {});
    const p = loadAssets(manifest, { texture: async () => 'T', model: never });
    await vi.advanceTimersByTimeAsync(LOAD_TIMEOUT_MS);
    const r = await p;
    expect(r.stalled).toBe(true);
    expect(r.failed).toEqual(['tree']);
    expect(r.values.get('grass')).toBe('T');
    vi.useRealTimers();
  });

  it('ignores a file that arrives after the limit', async () => {
    vi.useFakeTimers();
    let release;
    const late = new Promise((res) => {
      release = res;
    });
    const p = loadAssets([manifest[0]], {
      texture: () => late,
      model: async () => 'M',
    });
    await vi.advanceTimersByTimeAsync(LOAD_TIMEOUT_MS);
    const r = await p;
    release('T');
    await Promise.resolve();
    expect(r.values.has('grass')).toBe(false);
    vi.useRealTimers();
  });

  it('reports progress', async () => {
    const seen = [];
    await loadAssets(
      manifest,
      { texture: async () => 'T', model: async () => 'M' },
      {
        onProgress: (done, total) => seen.push([done, total]),
      },
    );
    expect(seen.at(-1)).toEqual([2, 2]);
  });
});

describe('failureMessage', () => {
  it('is empty when nothing failed', () => {
    expect(failureMessage({ failed: [], stalled: false })).toBe('');
  });
  it('tells what happened in short words', () => {
    expect(failureMessage({ failed: ['grass'], stalled: false })).toMatch(
      /could not be loaded/i,
    );
    expect(failureMessage({ failed: ['tree'], stalled: true })).toMatch(
      /too long/i,
    );
  });
});
