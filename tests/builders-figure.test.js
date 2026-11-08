import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { buildFigure } from '../src/world/builders/figure.js';
import { hexFor } from '../src/logic/colours.js';
import { CHARACTER_SPOT } from '../src/world/layout.js';

const colourOf = (root, name) => {
  let hex;
  root.traverse((o) => {
    if (o.material?.name === name) hex = '#' + o.material.color.getHexString();
  });
  return hex;
};

describe('plain figure (FR-16, AC-8.4)', () => {
  const figure = buildFigure(THREE, { hair: 'blond', clothing: 'plum' });
  it('stands in the character spot', () => {
    expect(figure.position.x).toBe(CHARACTER_SPOT.x);
    expect(figure.position.z).toBe(CHARACTER_SPOT.z);
  });
  it('is about the size of a person', () => {
    const box = new THREE.Box3().setFromObject(figure);
    expect(box.max.y - box.min.y).toBeGreaterThan(1.5);
    expect(box.max.y - box.min.y).toBeLessThan(2);
  });
  it('takes the chosen hair and clothing colours', () => {
    expect(colourOf(figure, 'figure-hair')).toBe(hexFor('hair', 'blond'));
    expect(colourOf(figure, 'figure-clothing')).toBe(
      hexFor('clothing', 'plum'),
    );
  });
  it('is marked as the plain character figure', () => {
    expect(figure.userData.kind).toBe('character');
    expect(figure.userData.plain).toBe('figure');
  });
});
