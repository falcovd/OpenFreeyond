import { describe, it, expect } from 'vitest';
import {
  applyColours,
  hexFor,
  CHARACTER_MATERIALS,
} from '../src/logic/colours.js';

const makeMaterial = (name) => ({
  name,
  color: {
    value: null,
    set(v) {
      this.value = v;
    },
  },
});

const makeRoot = (materials) => ({
  traverse(fn) {
    fn({ isMesh: false });
    for (const material of materials) fn({ isMesh: true, material });
  },
});

describe('hexFor', () => {
  it('finds the hex of a hair and a clothing colour', () => {
    expect(hexFor('hair', 'dark-blond')).toBe('#a68a4f');
    expect(hexFor('clothing', 'moss-green')).toBe('#6f8f5a');
  });
  it('returns undefined for an unknown id', () => {
    expect(hexFor('hair', 'nope')).toBeUndefined();
  });
});

describe('CHARACTER_MATERIALS', () => {
  it('names the model materials for hair and clothing', () => {
    expect(CHARACTER_MATERIALS).toEqual({ hair: 'Hair', clothing: 'Purple' });
  });
});

describe('applyColours', () => {
  it('sets the hair and clothing materials and leaves others alone', () => {
    const hair = makeMaterial(CHARACTER_MATERIALS.hair);
    const clothing = makeMaterial(CHARACTER_MATERIALS.clothing);
    const skin = makeMaterial('Skin');
    applyColours(makeRoot([hair, clothing, skin]), {
      hair: 'dark-blond',
      clothing: 'moss-green',
    });
    expect(hair.color.value).toBe('#a68a4f');
    expect(clothing.color.value).toBe('#6f8f5a');
    expect(skin.color.value).toBeNull();
  });
  it('handles meshes with several materials', () => {
    const hair = makeMaterial(CHARACTER_MATERIALS.hair);
    const root = {
      traverse(fn) {
        fn({ isMesh: true, material: [hair] });
      },
    };
    applyColours(root, { hair: 'black', clothing: 'plum' });
    expect(hair.color.value).toBe('#1c1a1a');
  });
});
