import { validateIntake } from './validate.js';

const CHARACTER_KEY = 'openfreeyond.character.v1';
const HINT_KEY = 'openfreeyond.hint-seen.v1';

export function getStorage(win = globalThis.window) {
  try {
    const storage = win.localStorage;
    storage.setItem('__openfreeyond_test__', '1');
    storage.removeItem('__openfreeyond_test__');
    return storage;
  } catch {
    return null;
  }
}

export function saveCharacter(storage, character) {
  if (!storage) return { ok: false };
  try {
    storage.setItem(CHARACTER_KEY, JSON.stringify(character));
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export function loadCharacter(storage) {
  if (!storage) return { status: 'unavailable' };
  let raw;
  try {
    raw = storage.getItem(CHARACTER_KEY);
  } catch {
    return { status: 'unavailable' };
  }
  if (raw === null) return { status: 'none' };
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return { status: 'broken' };
  }
  if (!data || typeof data !== 'object' || !validateIntake(data).ok)
    return { status: 'broken' };
  return { status: 'ok', data };
}

export function isHintSeen(storage) {
  if (!storage) return false;
  try {
    return storage.getItem(HINT_KEY) === '1';
  } catch {
    return false;
  }
}

export function markHintSeen(storage) {
  if (!storage) return;
  try {
    storage.setItem(HINT_KEY, '1');
  } catch {
    // Nothing can be kept; the hint will show again next time.
  }
}
