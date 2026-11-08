// Small corrections to the character's feet, applied by scripts/convert-character.mjs.
// In the original model the shoes are long and the foot pivots hard at the ankle, so a swinging
// foot looks like a flipper. These two functions shorten the shoe and soften the ankle.
import * as THREE from 'three';

export const FOOT = {
  length: 0.85, // the shoe keeps this share of its length, measured from the heel
  ankle: 0.7, // the foot keeps this share of its turn away from the rest pose
};

const FOOT_BONE = /^Foot[LR]$/;

// Scales every vertex that belongs to a foot along the walking direction (+z), from the heel
// forward. A vertex shared between the foot and the leg (the sock, the ankle) is scaled in
// proportion to how much of it belongs to the foot, so the skin does not tear.
// Call it on the model in its rest pose, before the clips are exported.
export function shortenFeet(root, factor = FOOT.length) {
  if (factor === 1) return;
  root.updateMatrixWorld(true);
  const point = new THREE.Vector3();
  root.traverse((mesh) => {
    if (!mesh.isSkinnedMesh) return;
    const { position, skinIndex, skinWeight } = mesh.geometry.attributes;
    const bones = mesh.skeleton.bones;
    const isFoot = bones.map((b) => FOOT_BONE.test(b.name));
    if (!isFoot.some(Boolean)) return;

    // How much of each vertex belongs to a foot bone, and where it is in the world.
    const share = new Float32Array(position.count);
    const worldZ = new Float32Array(position.count);
    for (let i = 0; i < position.count; i++) {
      for (let k = 0; k < 4; k++) {
        if (isFoot[skinIndex.getComponent(i, k)])
          share[i] += skinWeight.getComponent(i, k);
      }
      point.fromBufferAttribute(position, i).applyMatrix4(mesh.matrixWorld);
      worldZ[i] = point.z;
    }
    // The heel is the back of the part that is mostly foot.
    let heel = Infinity;
    for (let i = 0; i < position.count; i++) {
      if (share[i] > 0.5) heel = Math.min(heel, worldZ[i]);
    }
    if (!Number.isFinite(heel)) return;

    const inverse = mesh.matrixWorld.clone().invert();
    for (let i = 0; i < position.count; i++) {
      if (share[i] === 0) continue;
      const scale = 1 - share[i] * (1 - factor);
      point.fromBufferAttribute(position, i).applyMatrix4(mesh.matrixWorld);
      point.z = heel + (point.z - heel) * scale;
      point.applyMatrix4(inverse);
      position.setXYZ(i, point.x, point.y, point.z);
    }
    position.needsUpdate = true;
    mesh.geometry.computeBoundingBox();
    mesh.geometry.computeBoundingSphere();
  });
}

// Moves the rotation of each foot bone in the clips part of the way back to the bone's rest
// pose, so the ankle bends less. Other bones are left alone.
export function softenFootTracks(clips, root, factor = FOOT.ankle) {
  if (factor === 1) return;
  const rest = new Map();
  root.traverse((node) => {
    if (node.isBone && FOOT_BONE.test(node.name) && !rest.has(node.name))
      rest.set(node.name, node.quaternion.clone());
  });
  const q = new THREE.Quaternion();
  for (const clip of clips) {
    for (const track of clip.tracks) {
      const match = /^(.+)\.quaternion$/.exec(track.name);
      if (!match || !rest.has(match[1])) continue;
      for (let i = 0; i < track.values.length; i += 4) {
        q.fromArray(track.values, i);
        rest.get(match[1]).clone().slerp(q, factor).toArray(track.values, i);
      }
    }
  }
}
