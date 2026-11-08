import { describe, it, expect } from 'vitest';
import {
  getStorage,
  saveCharacter,
  loadCharacter,
  isHintSeen,
  markHintSeen,
} from '../src/logic/store.js';
import { EXAMPLE_CHARACTER } from '../src/logic/startScreen.js';

class MemoryStorage {
  constructor() {
    this.data = new Map();
  }
  getItem(k) {
    return this.data.has(k) ? this.data.get(k) : null;
  }
  setItem(k, v) {
    this.data.set(k, String(v));
  }
  removeItem(k) {
    this.data.delete(k);
  }
}

class BlockedStorage {
  getItem() {
    throw new Error('blocked');
  }
  setItem() {
    throw new Error('blocked');
  }
  removeItem() {
    throw new Error('blocked');
  }
}

describe('character storage', () => {
  it('returns none when nothing is kept', () => {
    expect(loadCharacter(new MemoryStorage())).toEqual({ status: 'none' });
  });
  it('keeps and loads a character (AC-3.2, AC-4.4)', () => {
    const s = new MemoryStorage();
    expect(saveCharacter(s, EXAMPLE_CHARACTER)).toEqual({ ok: true });
    expect(loadCharacter(s)).toEqual({ status: 'ok', data: EXAMPLE_CHARACTER });
  });
  it('reports broken data when it is not valid JSON (AC-4.6)', () => {
    const s = new MemoryStorage();
    s.setItem('openfreeyond.character.v1', '{not json');
    expect(loadCharacter(s)).toEqual({ status: 'broken' });
  });
  it('reports broken data when it fails the intake rules (AC-4.6)', () => {
    const s = new MemoryStorage();
    s.setItem(
      'openfreeyond.character.v1',
      JSON.stringify({ ...EXAMPLE_CHARACTER, age: 5 }),
    );
    expect(loadCharacter(s)).toEqual({ status: 'broken' });
  });
  it('reports unavailable when there is no storage or it throws (AC-4.7)', () => {
    expect(loadCharacter(null)).toEqual({ status: 'unavailable' });
    expect(loadCharacter(new BlockedStorage())).toEqual({
      status: 'unavailable',
    });
    expect(saveCharacter(null, EXAMPLE_CHARACTER)).toEqual({ ok: false });
    expect(saveCharacter(new BlockedStorage(), EXAMPLE_CHARACTER)).toEqual({
      ok: false,
    });
  });
});

describe('hint flag', () => {
  it('is not seen at first, and seen after it is marked', () => {
    const s = new MemoryStorage();
    expect(isHintSeen(s)).toBe(false);
    markHintSeen(s);
    expect(isHintSeen(s)).toBe(true);
  });
  it('is never seen when storage is blocked', () => {
    expect(isHintSeen(new BlockedStorage())).toBe(false);
    expect(() => markHintSeen(new BlockedStorage())).not.toThrow();
  });
});

describe('getStorage', () => {
  it('returns null when the window has no usable storage', () => {
    const win = {
      get localStorage() {
        throw new Error('blocked');
      },
    };
    expect(getStorage(win)).toBeNull();
  });
});
