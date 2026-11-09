// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

// A-Frame replaces `play` and `pause` of every component with a wrapper that takes no arguments
// and runs only on the entity's first play. A component method of that name that takes
// arguments silently does nothing (the character stayed frozen). A-Frame is not loaded in the
// unit tests, so this scans the source.
const source = readFileSync(
  new URL('../src/world/components.js', import.meta.url),
  'utf8',
)
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\/\/.*$/gm, '');

describe('A-Frame components', () => {
  it('define no method that reuses a reserved lifecycle name with arguments', () => {
    const clashes = [
      ...source.matchAll(/^\s+(play|pause)\s*\(\s*[^)\s][^)]*\)\s*\{/gm),
    ].map((m) => m[0].trim());
    expect(clashes).toEqual([]);
  });
  it('registers the house-door component', () => {
    expect(source).toMatch(/registerComponent\('house-door'/);
  });
  it('keeps the scan able to fail', () => {
    const bad = '  play(name, fade = 0.25) {\n  }';
    expect(/^\s+(play|pause)\s*\(\s*[^)\s][^)]*\)\s*\{/m.test(bad)).toBe(true);
    expect(
      /^\s+(play|pause)\s*\(\s*[^)\s][^)]*\)\s*\{/m.test('  play() {'),
    ).toBe(false);
  });
});
