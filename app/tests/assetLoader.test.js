import { describe, it, expect, vi } from 'vitest';
import {
  loadAssets,
  failureMessage,
  LOAD_TIMEOUT_MS,
  ASSET_BUDGET_MS,
  assetBudgetMs,
  loadInterior,
  HOUSE_FAILED_MESSAGE,
  INTERIOR_FAILED_MESSAGE,
  NEIGHBOURHOOD_FAILED_MESSAGE,
  onceNotice,
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

describe('assetBudgetMs (FR-15, AC-8.6)', () => {
  it('is the whole budget at the moment the person chooses', () => {
    expect(assetBudgetMs(1000, 1000)).toBe(ASSET_BUDGET_MS);
  });
  it('shrinks as time passes', () => {
    expect(assetBudgetMs(0, 5000, 24000)).toBe(19000);
    expect(assetBudgetMs(0, 10000, 24000)).toBeLessThan(
      assetBudgetMs(0, 5000, 24000),
    );
  });
  it('is never negative', () => {
    expect(assetBudgetMs(0, 99000, 24000)).toBe(0);
  });
  it('leaves room for building before the 30 second cover goes', () => {
    expect(ASSET_BUDGET_MS).toBeLessThan(LOAD_TIMEOUT_MS);
  });
});

describe('loadInterior (FR-20, FR-23)', () => {
  it('reports each file as it arrives, with no timeout', async () => {
    const seen = [];
    let release;
    const slow = new Promise((r) => (release = r));
    const done = loadInterior(
      [
        { id: 'a', type: 'model', url: '/a' },
        { id: 'b', type: 'model', url: '/b' },
      ],
      { model: (url) => (url === '/a' ? Promise.resolve('A') : slow) },
      { onItem: (id, v) => seen.push([id, v]) },
    );
    await new Promise((r) => setTimeout(r, 20));
    expect(seen).toEqual([['a', 'A']]);
    release('B');
    await done;
    expect(seen).toEqual([
      ['a', 'A'],
      ['b', 'B'],
    ]);
  });
  it('reports a failed file through onFail and still loads the rest', async () => {
    const failed = [];
    const seen = [];
    await loadInterior(
      [
        { id: 'a', type: 'model', url: '/a' },
        { id: 'b', type: 'model', url: '/b' },
      ],
      {
        model: (url) =>
          url === '/a'
            ? Promise.reject(new Error('404'))
            : Promise.resolve('B'),
      },
      { onItem: (id) => seen.push(id), onFail: (id) => failed.push(id) },
    );
    expect(failed).toEqual(['a']);
    expect(seen).toEqual(['b']);
  });
  it('ignores files that arrive after the world was torn down', async () => {
    const seen = [];
    await loadInterior(
      [{ id: 'a', type: 'model', url: '/a' }],
      { model: async () => 'A' },
      { onItem: (id) => seen.push(id), isCancelled: () => true },
    );
    expect(seen).toEqual([]);
  });
  it('treats a throwing onItem as a failure and still loads the rest', async () => {
    const failed = [];
    const seen = [];
    await loadInterior(
      [
        { id: 'a', type: 'model', url: '/a' },
        { id: 'b', type: 'model', url: '/b' },
      ],
      { model: async (url) => url },
      {
        onItem: (id) => {
          if (id === 'a') throw new Error('boom');
          seen.push(id);
        },
        onFail: (id) => failed.push(id),
      },
    );
    expect(failed).toEqual(['a']);
    expect(seen).toEqual(['b']);
  });
  it('hands a late value to onLate instead of onItem', async () => {
    const late = [];
    const seen = [];
    await loadInterior(
      [{ id: 'a', type: 'model', url: '/a' }],
      { model: async () => 'A' },
      {
        onItem: (id) => seen.push(id),
        onLate: (id, v) => late.push([id, v]),
        isCancelled: () => true,
      },
    );
    expect(seen).toEqual([]);
    expect(late).toEqual([['a', 'A']]);
  });
  it('has one-sentence load messages for the house and for the interior', () => {
    for (const m of [HOUSE_FAILED_MESSAGE, INTERIOR_FAILED_MESSAGE])
      expect(m.split('.').filter(Boolean).length).toBe(1);
  });
});

describe('failureMessage for the street (AC-6.12)', () => {
  it('is one non-empty sentence however many street assets failed', () => {
    const msg = failureMessage({
      failed: ['car-1', 'lamp', 'paving'],
      stalled: false,
    });
    expect(typeof msg).toBe('string');
    expect(msg.length).toBeGreaterThan(0);
  });
});

describe('onceNotice (FR-16, AC-6.16)', () => {
  it('forwards only the first message', () => {
    const send = vi.fn();
    const notify = onceNotice(send);
    notify('a');
    notify('b');
    expect(send.mock.calls).toEqual([['a']]);
  });
  it('forwards nothing when a message was already shown', () => {
    const send = vi.fn();
    onceNotice(send, true)('a');
    expect(send).not.toHaveBeenCalled();
  });
  it('has one short sentence for the neighbourhood', () => {
    expect(NEIGHBOURHOOD_FAILED_MESSAGE).toBe(
      'Part of the neighbourhood could not be loaded, so plain blocks are shown in its place.',
    );
  });
});
