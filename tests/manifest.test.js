// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { MANIFEST } from '../src/world/manifest.js';
import { ASSET_RECORDS } from '../src/data/licences.js';

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
