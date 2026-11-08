import { describe, it, expect } from 'vitest';
import { releasePage } from '../src/world/teardown.js';

describe('releasePage', () => {
  it('removes the a-fullscreen class A-Frame leaves on <html>', () => {
    document.documentElement.classList.add('a-fullscreen', 'keep-me');
    releasePage(document.documentElement);
    expect(document.documentElement.classList.contains('a-fullscreen')).toBe(
      false,
    );
    expect(document.documentElement.classList.contains('keep-me')).toBe(true);
    document.documentElement.classList.remove('keep-me');
  });

  it('does nothing when the class is absent', () => {
    expect(() => releasePage(document.documentElement)).not.toThrow();
    expect(document.documentElement.classList.contains('a-fullscreen')).toBe(
      false,
    );
  });
});
