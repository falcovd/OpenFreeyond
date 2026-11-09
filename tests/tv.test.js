import { describe, it, expect } from 'vitest';
import { tvSource } from '../src/logic/tv.js';

describe('what the TV screen shows (FR-15, FR-22, FR-23)', () => {
  const ok = { mode: 'clip', clip: 'ready', still: 'ready' };
  it('plays the clip when it loaded and can play', () => {
    expect(tvSource(ok)).toBe('clip');
  });
  it('shows the still when the clip failed to load (AC-4.7)', () => {
    expect(tvSource({ ...ok, clip: 'failed' })).toBe('still');
  });
  it('shows the still when the browser blocks the clip (AC-4.7)', () => {
    expect(tvSource({ ...ok, clip: 'blocked' })).toBe('still');
  });
  it('shows the still, and never the clip, in still mode (FR-22, AC-4.8)', () => {
    expect(tvSource({ ...ok, mode: 'still' })).toBe('still');
    expect(tvSource({ mode: 'still', clip: 'ready', still: 'ready' })).toBe(
      'still',
    );
  });
  it('shows the still while the clip is still loading', () => {
    expect(tvSource({ ...ok, clip: 'loading' })).toBe('still');
  });
  it('shows a plain dark screen when there is no still either', () => {
    expect(tvSource({ ...ok, clip: 'failed', still: 'failed' })).toBe('dark');
    expect(tvSource({ mode: 'still', clip: 'none', still: 'loading' })).toBe(
      'dark',
    );
  });
});
