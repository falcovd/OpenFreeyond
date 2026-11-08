// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { CHARACTER_MATERIALS } from '../src/logic/colours.js';

const buf = readFileSync(
  new URL('../public/assets/character.glb', import.meta.url),
);

function readJson() {
  expect(buf.toString('ascii', 0, 4)).toBe('glTF');
  const chunkLength = buf.readUInt32LE(12);
  expect(buf.toString('ascii', 16, 20)).toBe('JSON');
  return JSON.parse(buf.toString('utf8', 20, 20 + chunkLength));
}

describe('character.glb', () => {
  const gltf = readJson();

  it('has the material names the colour logic looks for', () => {
    const names = (gltf.materials ?? []).map((m) => m.name);
    expect(names).toContain(CHARACTER_MATERIALS.hair);
    expect(names).toContain(CHARACTER_MATERIALS.clothing);
  });

  it('has exactly one animation, named Idle', () => {
    expect(gltf.animations).toHaveLength(1);
    expect(gltf.animations[0].name).toBe('Idle');
  });

  it('has only opaque materials', () => {
    for (const m of gltf.materials ?? []) {
      expect(m.alphaMode ?? 'OPAQUE').toBe('OPAQUE');
    }
  });

  it('is under 2 MB', () => {
    expect(buf.length).toBeLessThan(2 * 1024 * 1024);
  });
});
