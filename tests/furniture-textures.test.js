import { describe, it, expect } from 'vitest';
import {
  boxUv,
  boxProject,
  materialSpec,
  furnitureTextureIds,
} from '../src/logic/furniture-textures.js';

describe('box projection of UVs (PO finding 4)', () => {
  it('looks along the dominant normal axis', () => {
    expect(boxUv([1, 2, 3], [0, 1, 0], 1)).toEqual([1, 3]); // top: x, z
    expect(boxUv([1, 2, 3], [0, -1, 0], 1)).toEqual([1, 3]); // bottom
    expect(boxUv([1, 2, 3], [1, 0, 0], 1)).toEqual([3, 2]); // side: z, y
    expect(boxUv([1, 2, 3], [-1, 0, 0], 1)).toEqual([3, 2]);
    expect(boxUv([1, 2, 3], [0, 0, 1], 1)).toEqual([1, 2]); // front: x, y
    expect(boxUv([1, 2, 3], [0, 0, -1], 1)).toEqual([1, 2]);
  });
  it('gives one repeat per `size` metres', () => {
    expect(boxUv([1.2, 0.6, 0], [0, 0, 1], 0.6)).toEqual([2, 1]);
  });
  it('fills two numbers per vertex, from three positions and three normals', () => {
    const positions = [0, 0, 0, 1, 0, 0, 0, 0, 2];
    const normals = [0, 1, 0, 0, 1, 0, 0, 0, 1];
    const uv = boxProject(positions, normals, 1);
    expect(uv).toBeInstanceOf(Float32Array);
    expect(Array.from(uv)).toEqual([0, 0, 1, 0, 0, 0]);
  });
  it('does not depend on where in the model the face is, only on the metres', () => {
    const a = boxProject([0, 0, 0, 2, 0, 0], [0, 1, 0, 0, 1, 0], 0.5);
    expect(a[2] - a[0]).toBeCloseTo(4);
  });
});

describe('which material a furniture part gets, by name', () => {
  it('puts wood on the table, the chairs, the couch legs and the cabinets', () => {
    expect(materialSpec('dining-table', 'wood')).toBeTruthy();
    for (const id of ['chair-1', 'chair-2', 'chair-3', 'chair-4'])
      expect(materialSpec(id, 'wood'), id).toBeTruthy();
    expect(materialSpec('couch', 'wood')).toBeTruthy();
    expect(materialSpec('kitchen', 'wood')).toBeTruthy();
    expect(materialSpec('kitchen', 'woodDark')).toBeTruthy();
  });
  it('puts fabric on the couch cushions and keeps the kit colour as its tint', () => {
    const spec = materialSpec('couch', 'carpet');
    expect(spec.texture).toBe('fabric');
    expect(spec.tint).toBe('kit');
  });
  it('leaves metal, glass, lamp shades and the TV with their own colours', () => {
    for (const name of ['metal', 'metalDark', 'metalLight', 'glass', 'lamp'])
      for (const id of ['kitchen', 'floor-lamp', 'pendant-living', 'tv'])
        expect(materialSpec(id, name), `${id} ${name}`).toBeNull();
    expect(materialSpec('tv', 'metalDark')).toBeNull();
    expect(materialSpec('nope', 'wood')).toBeNull();
  });
  it('lists the texture ids the furniture can use', () => {
    expect(furnitureTextureIds().sort()).toEqual(['cabinet', 'fabric']);
  });
});
