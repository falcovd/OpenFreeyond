import { describe, it, expect } from 'vitest';
import {
  startOptions,
  resolveChoice,
  EXAMPLE_CHARACTER,
} from '../src/logic/startScreen.js';
import { validateIntake } from '../src/logic/validate.js';

const ok = {
  status: 'ok',
  data: { ...EXAMPLE_CHARACTER, name: 'Kept Person' },
};
const none = { status: 'none' };

describe('example character', () => {
  it('passes the intake rules', () => {
    expect(validateIntake(EXAMPLE_CHARACTER).ok).toBe(true);
  });
});

describe('startOptions', () => {
  it('always offers the try-out (FR-10)', () => {
    for (const result of [
      none,
      ok,
      { status: 'broken' },
      { status: 'unavailable' },
    ]) {
      expect(startOptions(result)).toContain('try-out');
    }
  });
  it('offers continue, make-new and try-out when a character is kept (AC-5.3)', () => {
    expect(startOptions(ok)).toEqual(['continue', 'make-new', 'try-out']);
  });
  it('offers make-new and try-out otherwise (FR-13)', () => {
    expect(startOptions(none)).toEqual(['make-new', 'try-out']);
    expect(startOptions({ status: 'broken' })).toEqual(['make-new', 'try-out']);
  });
});

describe('resolveChoice', () => {
  it('try-out enters with the example character and keeps nothing (AC-5.1, AC-5.2, AC-5.4)', () => {
    const result = resolveChoice('try-out', ok);
    expect(result).toEqual({
      action: 'enter',
      character: EXAMPLE_CHARACTER,
      tryOut: true,
    });
  });
  it('continue enters with the kept character', () => {
    expect(resolveChoice('continue', ok)).toEqual({
      action: 'enter',
      character: ok.data,
      tryOut: false,
    });
  });
  it('make-new asks to confirm when a character is kept (AC-5.5)', () => {
    expect(resolveChoice('make-new', ok)).toEqual({
      action: 'confirm-replace',
    });
  });
  it('make-new opens the intake when nothing is kept', () => {
    expect(resolveChoice('make-new', none)).toEqual({ action: 'intake' });
  });
  it('continue without a kept character stays on the start screen', () => {
    expect(resolveChoice('continue', none)).toEqual({ action: 'stay' });
  });
});
