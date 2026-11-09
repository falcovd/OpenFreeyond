// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import * as THREE from 'three';
import { disposeObject, disposeAssets } from '../src/world/dispose.js';

const spyMesh = (geometry, material) => {
  const mesh = new THREE.Mesh(geometry, material);
  vi.spyOn(geometry, 'dispose');
  for (const m of [material].flat()) vi.spyOn(m, 'dispose');
  return mesh;
};

describe('disposeObject', () => {
  it('disposes geometry, material and every texture map of a mesh', () => {
    const map = new THREE.Texture();
    const normalMap = new THREE.Texture();
    vi.spyOn(map, 'dispose');
    vi.spyOn(normalMap, 'dispose');
    const material = new THREE.MeshStandardMaterial({ map, normalMap });
    const root = new THREE.Group();
    const mesh = spyMesh(new THREE.BoxGeometry(), material);
    root.add(mesh);
    disposeObject(root);
    expect(mesh.geometry.dispose).toHaveBeenCalledTimes(1);
    expect(material.dispose).toHaveBeenCalledTimes(1);
    expect(map.dispose).toHaveBeenCalledTimes(1);
    expect(normalMap.dispose).toHaveBeenCalledTimes(1);
  });

  it('handles a material array and a material without maps', () => {
    const a = new THREE.MeshBasicMaterial();
    const b = new THREE.MeshBasicMaterial({ map: new THREE.Texture() });
    vi.spyOn(b.map, 'dispose');
    const mesh = spyMesh(new THREE.BoxGeometry(), [a, b]);
    disposeObject(mesh);
    expect(a.dispose).toHaveBeenCalledTimes(1);
    expect(b.dispose).toHaveBeenCalledTimes(1);
    expect(b.map.dispose).toHaveBeenCalledTimes(1);
  });

  it('is safe for a shared material and for objects without geometry', () => {
    const shared = new THREE.MeshBasicMaterial();
    const root = new THREE.Group();
    const one = spyMesh(new THREE.BoxGeometry(), shared);
    const two = new THREE.Mesh(new THREE.BoxGeometry(), shared);
    root.add(one, two, new THREE.Object3D(), new THREE.Line());
    expect(() => disposeObject(root)).not.toThrow();
    expect(shared.dispose.mock.calls.length).toBeGreaterThanOrEqual(1);
    expect(shared.dispose.mock.calls.length).toBeLessThanOrEqual(2);
  });

  it('ignores null and objects with no children', () => {
    expect(() => disposeObject(null)).not.toThrow();
    expect(() => disposeObject({})).not.toThrow();
  });
});

describe('disposeAssets', () => {
  it('disposes textures and glTF scenes, and ignores other values', () => {
    const tex = new THREE.Texture();
    vi.spyOn(tex, 'dispose');
    const mesh = spyMesh(
      new THREE.BoxGeometry(),
      new THREE.MeshBasicMaterial(),
    );
    const scene = new THREE.Group();
    scene.add(mesh);
    const values = new Map([
      ['grass', tex],
      ['bush', { scene }],
      ['odd', 42],
    ]);
    expect(() => disposeAssets(values)).not.toThrow();
    expect(tex.dispose).toHaveBeenCalledTimes(1);
    expect(mesh.geometry.dispose).toHaveBeenCalledTimes(1);
  });
});
