// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIR = new URL('../public/assets/models/street/', import.meta.url)
  .pathname;
const files = existsSync(DIR)
  ? readdirSync(DIR).filter((f) => f.endsWith('.glb'))
  : [];

// Reads the glTF JSON of a GLB without decoding any image.
function readGlb(path) {
  const b = readFileSync(path);
  expect(b.readUInt32LE(0), 'GLB magic').toBe(0x46546c67);
  expect(b.readUInt32LE(8), 'GLB length').toBe(b.length);
  const jl = b.readUInt32LE(12);
  expect(b.readUInt32LE(16), 'JSON chunk').toBe(0x4e4f534a);
  return JSON.parse(b.subarray(20, 20 + jl).toString('utf8'));
}

// Nothing found for an item is a legal outcome (FR-16): this passes with zero files.
describe('street models (FR-16, AC-6.9)', () => {
  it.each(files)('%s parses, is at most 2 MB and has no logo or plate', (f) => {
    const path = join(DIR, f);
    expect(statSync(path).size).toBeLessThanOrEqual(2 * 1024 * 1024);
    const gltf = readGlb(path);
    expect(gltf.asset.version).toBe('2.0');
    expect(gltf.meshes.length).toBeGreaterThan(0);
    for (const m of gltf.materials ?? []) {
      expect(m.name ?? '', f).not.toMatch(/logo|plate|brand/i);
      // A street lamp or car must not glow (the lamps are not lit).
      expect(m.emissiveFactor ?? [0, 0, 0], f).toEqual([0, 0, 0]);
    }
    for (const i of gltf.images ?? [])
      expect(i.name ?? '', f).not.toMatch(/logo|plate|brand/i);
  });
  it('has only files that the street manifest can load', () => {
    for (const f of files) expect(f).toMatch(/^(car-\d+|lamp)\.glb$/);
  });
});
