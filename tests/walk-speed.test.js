// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { WANDER } from '../src/logic/wander.js';

// The Walk clip is "in place": the body stays put and the feet swing. While a foot is on the
// ground it moves backwards at the speed the character should walk, or his feet skate over the
// ground. This measures that speed from the model itself, so it stays right after a reconversion.
async function naturalWalkSpeed() {
  const file = readFileSync(
    new URL('../public/assets/character.glb', import.meta.url),
  );
  const data = file.buffer.slice(
    file.byteOffset,
    file.byteOffset + file.byteLength,
  );
  const gltf = await new Promise((resolve, reject) =>
    new GLTFLoader().parse(data, '', resolve, reject),
  );
  const clip = gltf.animations.find((a) => a.name === 'Walk');
  const mixer = new THREE.AnimationMixer(gltf.scene);
  mixer.clipAction(clip).play();

  const feet = [];
  gltf.scene.traverse((o) => {
    if (o.isBone && /^Foot[LR]/.test(o.name)) feet.push(o);
  });
  expect(feet.length).toBeGreaterThanOrEqual(2);

  const steps = 120;
  const dt = clip.duration / steps;
  const track = feet.map(() => []);
  for (let i = 0; i <= steps; i++) {
    mixer.setTime(i * dt);
    gltf.scene.updateMatrixWorld(true);
    feet.forEach((foot, k) => {
      const p = new THREE.Vector3();
      foot.getWorldPosition(p);
      track[k].push(p);
    });
  }
  // The model faces +z. A foot is on the ground while it is within 4 cm of its lowest point.
  const speeds = [];
  track.forEach((points) => {
    const low = Math.min(...points.map((p) => p.y));
    for (let i = 1; i < points.length; i++) {
      if (points[i].y < low + 0.04 && points[i - 1].y < low + 0.04)
        speeds.push(-(points[i].z - points[i - 1].z) / dt);
    }
  });
  speeds.sort((a, b) => a - b);
  return speeds[Math.floor(speeds.length / 2)];
}

describe('walking speed', () => {
  it('matches the ground speed of the Walk clip, so his feet do not skate', async () => {
    const natural = await naturalWalkSpeed();
    expect(natural).toBeGreaterThan(0.8);
    expect(natural).toBeLessThan(2.5);
    expect(Math.abs(WANDER.speed - natural) / natural).toBeLessThan(0.05);
  });
});
