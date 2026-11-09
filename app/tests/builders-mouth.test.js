import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { buildMouth, attachMouth, MOUTH } from '../src/world/builders/mouth.js';

// Head bone space of character.glb: eyes at y 0.097 to 0.122 and z about 0.10, nose tip at
// y 0.058, chin at about y -0.01, face front about z 0.113 on the midline (measured from the model).
const EYE_Y = 0.097;
const NOSE_Y = 0.058;
const CHIN_Y = -0.01;

function bounds(mesh) {
  mesh.geometry.computeBoundingBox();
  return mesh.geometry.boundingBox;
}

describe('mouth', () => {
  const mouth = buildMouth(THREE);
  const box = bounds(mouth);

  it('sits between the nose and the chin', () => {
    expect(box.max.y).toBeLessThan(NOSE_Y);
    expect(box.min.y).toBeGreaterThan(CHIN_Y);
    expect(box.max.y).toBeLessThan(EYE_Y);
  });
  it('is narrow and thin, like a mouth on a small head', () => {
    expect(box.max.x - box.min.x).toBeGreaterThan(0.03);
    expect(box.max.x - box.min.x).toBeLessThan(0.07);
    expect(box.max.y - box.min.y).toBeLessThan(0.02);
  });
  it('is centred on the face and in front of it, not inside the head', () => {
    expect(box.min.x).toBeCloseTo(-box.max.x);
    expect(box.min.z).toBeGreaterThan(0.09);
    expect(box.max.z).toBeLessThan(0.12);
  });
  it('is a dark opaque colour, so it reads on the skin', () => {
    expect(mouth.material.transparent).toBe(false);
    const c = mouth.material.color;
    expect(0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b).toBeLessThan(0.2);
  });
  it('is tagged as the mouth', () => {
    expect(mouth.userData.part).toBe('mouth');
  });
});

describe('attachMouth', () => {
  const makeRoot = () => {
    const root = new THREE.Group();
    const head = new THREE.Bone();
    head.name = MOUTH.bone;
    root.add(head);
    return { root, head };
  };

  it('puts the mouth on the head bone', () => {
    const { root, head } = makeRoot();
    const mouth = attachMouth(THREE, root);
    expect(mouth.parent).toBe(head);
  });
  it('adds only one mouth, even when called twice', () => {
    const { root, head } = makeRoot();
    attachMouth(THREE, root);
    attachMouth(THREE, root);
    expect(
      head.children.filter((c) => c.userData.part === 'mouth'),
    ).toHaveLength(1);
  });
  it('does nothing when the model has no head bone', () => {
    expect(attachMouth(THREE, new THREE.Group())).toBeNull();
  });
});
