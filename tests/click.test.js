import { describe, it, expect } from 'vitest';
import { isClick, DRAG_LIMIT_PX } from '../src/logic/click.js';

describe('click versus drag (A-1, AC-1.8)', () => {
  it('is a click when the pointer stays put', () => {
    expect(isClick({ x: 100, y: 100 }, { x: 100, y: 100 })).toBe(true);
    expect(isClick({ x: 100, y: 100 }, { x: 102, y: 101 })).toBe(true);
  });
  it('is a drag when the pointer moved past the limit', () => {
    expect(
      isClick({ x: 100, y: 100 }, { x: 100 + DRAG_LIMIT_PX + 1, y: 100 }),
    ).toBe(false);
    expect(isClick({ x: 100, y: 100 }, { x: 160, y: 140 })).toBe(false);
  });
  it('is not a click without a press', () => {
    expect(isClick(null, { x: 1, y: 1 })).toBe(false);
  });
});
