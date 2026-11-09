// @vitest-environment node
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import {
  FOOT,
  shortenFeet,
  softenFootTracks,
} from '../scripts/lib/foot-tweaks.mjs';

// A leg of two bones with a skinned mesh: vertices on the shin (weight 1 to the leg), on the shoe
// (weight 1 to the foot) and between them (half and half). The foot points along +z, heel at z = 0.
function makeLeg() {
  const leg = new THREE.Bone();
  leg.name = 'LowerLegR';
  const foot = new THREE.Bone();
  foot.name = 'FootR';
  leg.add(foot);
  foot.position.set(0, -0.4, 0);
  const root = new THREE.Group();
  root.add(leg);

  const points = [
    // x, y, z, leg weight, foot weight
    [0, 0.2, 0, 1, 0], // shin
    [0, -0.4, 0.05, 0.5, 0.5], // ankle: half and half
    [0, -0.45, 0, 0, 1], // heel (the back of the shoe)
    [0, -0.45, 0.1, 0, 1], // middle of the shoe
    [0, -0.45, 0.3, 0, 1], // toe
  ];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(
      points.flatMap((p) => p.slice(0, 3)),
      3,
    ),
  );
  geometry.setAttribute(
    'skinIndex',
    new THREE.Uint16BufferAttribute(
      points.flatMap(() => [0, 1, 0, 0]),
      4,
    ),
  );
  geometry.setAttribute(
    'skinWeight',
    new THREE.Float32BufferAttribute(
      points.flatMap((p) => [p[3], p[4], 0, 0]),
      4,
    ),
  );
  const mesh = new THREE.SkinnedMesh(geometry, new THREE.MeshBasicMaterial());
  root.add(mesh);
  root.updateMatrixWorld(true);
  mesh.bind(new THREE.Skeleton([leg, foot]));
  return { root, mesh, leg, foot, geometry };
}

const z = (geometry, i) => geometry.attributes.position.getZ(i);
const y = (geometry, i) => geometry.attributes.position.getY(i);

describe('shortenFeet', () => {
  it('shortens the shoe from the heel forward and leaves the heel where it is', () => {
    const { root, geometry } = makeLeg();
    shortenFeet(root, 0.5);
    expect(z(geometry, 2)).toBeCloseTo(0); // heel
    expect(z(geometry, 3)).toBeCloseTo(0.05); // middle: half as far from the heel
    expect(z(geometry, 4)).toBeCloseTo(0.15); // toe: 0.3 became 0.15
  });
  it('leaves the leg alone and only blends the ankle', () => {
    const { root, geometry } = makeLeg();
    shortenFeet(root, 0.5);
    expect(z(geometry, 0)).toBeCloseTo(0); // shin unchanged
    // the ankle has half its weight on the foot, so it is scaled halfway: factor 1 - 0.5 * (1 - 0.5) = 0.75
    expect(z(geometry, 1)).toBeCloseTo(0.05 * 0.75);
  });
  it('does not change heights, only length', () => {
    const { root, geometry } = makeLeg();
    shortenFeet(root, 0.5);
    expect(y(geometry, 4)).toBeCloseTo(-0.45);
    expect(y(geometry, 0)).toBeCloseTo(0.2);
  });
  it('does nothing at factor 1, and ignores a model without feet', () => {
    const { root, geometry } = makeLeg();
    shortenFeet(root, 1);
    expect(z(geometry, 4)).toBeCloseTo(0.3);
    expect(() => shortenFeet(new THREE.Group(), 0.5)).not.toThrow();
  });
});

describe('softenFootTracks', () => {
  const angleBetween = (a, b) => a.angleTo(b);
  const rest = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.2, 0, 0));
  const bent = new THREE.Quaternion().setFromEuler(new THREE.Euler(1.2, 0, 0));
  const clipWith = (q) =>
    new THREE.AnimationClip('Walk', 1, [
      new THREE.QuaternionKeyframeTrack(
        'FootR.quaternion',
        [0, 1],
        [...rest.toArray(), ...q.toArray()],
      ),
      new THREE.QuaternionKeyframeTrack(
        'LowerLegR.quaternion',
        [0, 1],
        [...rest.toArray(), ...q.toArray()],
      ),
    ]);
  const model = () => {
    const g = new THREE.Group();
    const foot = new THREE.Bone();
    foot.name = 'FootR';
    foot.quaternion.copy(rest);
    g.add(foot);
    return g;
  };

  it('moves the foot part of the way from its bend back to its rest pose', () => {
    const clip = clipWith(bent);
    softenFootTracks([clip], model(), 0.5);
    const out = new THREE.Quaternion().fromArray(clip.tracks[0].values, 4);
    expect(angleBetween(out, rest)).toBeCloseTo(
      angleBetween(bent, rest) * 0.5,
      3,
    );
  });
  it('leaves the rest pose and the other bones alone', () => {
    const clip = clipWith(bent);
    softenFootTracks([clip], model(), 0.5);
    const first = new THREE.Quaternion().fromArray(clip.tracks[0].values, 0);
    expect(angleBetween(first, rest)).toBeCloseTo(0, 5);
    const leg = new THREE.Quaternion().fromArray(clip.tracks[1].values, 4);
    expect(angleBetween(leg, bent)).toBeCloseTo(0, 5);
  });
  it('does nothing at factor 1', () => {
    const clip = clipWith(bent);
    softenFootTracks([clip], model(), 1);
    const out = new THREE.Quaternion().fromArray(clip.tracks[0].values, 4);
    expect(angleBetween(out, bent)).toBeCloseTo(0, 5);
  });
});

describe('the chosen amounts', () => {
  it('shorten the feet and soften the ankle, but not beyond a sensible range', () => {
    expect(FOOT.length).toBeGreaterThan(0.6);
    expect(FOOT.length).toBeLessThan(1);
    expect(FOOT.ankle).toBeGreaterThan(0.4);
    expect(FOOT.ankle).toBeLessThan(1);
  });
});
