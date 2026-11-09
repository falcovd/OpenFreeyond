import { slabGrid, SLAB } from '../../logic/slabs.js';
import { surface, hash } from './common.js';

// The underlay sits this far below the slab top (the slabs are 4 cm thick, so it shows in the joints).
export const SLAB_UNDER = 0.035;

// One InstancedMesh of thin boxes on a darker underlay that shows in the joints. Local x runs across the
// strip and local z along it, from the start end (z = 0) to the far end. The caller places and turns the group.
export function buildSlabs(
  THREE,
  assets,
  { width, length, texture, fallback, kind, top = 0.05, tint },
) {
  const { slabs } = slabGrid({ width, length });
  const g = new THREE.Group();
  g.userData.kind = kind;
  const under = new THREE.Mesh(
    new THREE.PlaneGeometry(width, length),
    new THREE.MeshStandardMaterial({
      color: '#6f6a62',
      roughness: 1,
      polygonOffset: true, // pulls it clear of whatever surface it lies on
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    }),
  );
  under.userData.flat = true; // applyShadows keeps it from casting
  under.rotation.x = -Math.PI / 2;
  under.position.set(0, top - SLAB_UNDER, length / 2);
  g.add(under);
  const mesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 0.04, 1), // scaled per instance
    surface(THREE, assets, texture, fallback, { tint }),
    slabs.length,
  );
  const m = new THREE.Matrix4();
  const colour = new THREE.Color();
  slabs.forEach((s, i) => {
    m.compose(
      new THREE.Vector3(s.x, top - 0.02, s.y),
      new THREE.Quaternion(),
      new THREE.Vector3(s.w - SLAB.joint, 1, s.l - SLAB.joint),
    );
    mesh.setMatrixAt(i, m);
    // A small brightness change per slab so the slabs read as separate pieces (never near black).
    mesh.setColorAt(i, colour.setScalar(0.92 + 0.08 * hash(`${kind}${i}`)));
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  g.add(mesh);
  return g;
}
