import { fencePosts } from '../../logic/fenceLine.js';
import { box, surface } from './common.js';

function tag(mesh, part) {
  mesh.userData.part = part;
  return mesh;
}

// Posts at most a metre apart (fencePosts) and two rails, along the longer side (FR-8). Collision stays the solid's box.
export function buildFence(THREE, assets, solid) {
  const g = new THREE.Group();
  g.position.set(solid.x, 0, solid.z);
  g.userData.kind = 'fence';
  const alongZ = solid.d >= solid.w;
  const length = alongZ ? solid.d : solid.w;
  const wood = () =>
    surface(THREE, assets, 'wood', solid.color, { repeat: [1, 1] });
  for (const t of fencePosts(solid)) {
    const post = alongZ
      ? box(THREE, 0.12, solid.h, 0.12, wood(), 0, solid.h / 2, t)
      : box(THREE, 0.12, solid.h, 0.12, wood(), t, solid.h / 2, 0);
    g.add(tag(post, 'post'));
  }
  for (const y of [solid.h * 0.35, solid.h * 0.75]) {
    const rail = alongZ
      ? box(THREE, 0.06, 0.1, length, wood(), 0, y, 0)
      : box(THREE, length, 0.1, 0.06, wood(), 0, y, 0);
    g.add(tag(rail, 'rail'));
  }
  return g;
}

export function buildFurniture(THREE, assets, solid) {
  const g = new THREE.Group();
  g.position.set(solid.x, 0, solid.z);
  g.userData.kind = 'furniture';
  const wood = () => surface(THREE, assets, 'wood', solid.color);
  const leg = (x, z, h) => box(THREE, 0.07, h, 0.07, wood(), x, h / 2, z);

  if (solid.item === 'bench') {
    const { w, d } = solid;
    g.add(box(THREE, w, 0.08, d, wood(), 0, 0.45, 0)); // seat
    g.add(box(THREE, w, 0.4, 0.06, wood(), 0, 0.75, -d / 2 + 0.05)); // backrest
    for (const x of [-w / 2 + 0.1, w / 2 - 0.1])
      for (const z of [-d / 2 + 0.08, d / 2 - 0.08]) g.add(leg(x, z, 0.45));
  } else if (solid.item === 'table') {
    const { w, d } = solid;
    g.add(box(THREE, w, 0.06, d, wood(), 0, 0.77, 0)); // top
    for (const x of [-w / 2 + 0.08, w / 2 - 0.08])
      for (const z of [-d / 2 + 0.08, d / 2 - 0.08]) g.add(leg(x, z, 0.77));
  } else {
    // planter: wooden trough, soil and a few green plants
    const { w, d, h } = solid;
    g.add(box(THREE, w, h, d, wood(), 0, h / 2, 0));
    const soil = new THREE.MeshStandardMaterial({
      color: '#4a3322',
      roughness: 1,
    });
    g.add(box(THREE, w - 0.1, 0.06, d - 0.1, soil, 0, h + 0.01, 0));
    const leaf = new THREE.MeshStandardMaterial({ color: '#5f8f48' });
    for (let i = 0; i < 5; i++) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), leaf);
      s.position.set(-w / 2 + 0.3 + i * ((w - 0.6) / 4), h + 0.14, 0);
      g.add(s);
    }
  }
  return g;
}
