import { surface, plainBlock } from './common.js';
import { HOUSE, HOUSE_BLOCK } from '../layout.js';

function tag(object, part) {
  object.userData.part = part;
  return object;
}

function size(THREE, mesh) {
  mesh.geometry.computeBoundingBox();
  return mesh.geometry.boundingBox.getSize(new THREE.Vector3());
}

// The house is the generated model (scripts/build-house.mjs). Materials are swapped by name, as the
// character's colours are. Without the model the house is one closed block: no door, no rooms (FR-21).
export function buildHouse(THREE, assets) {
  const gltf = assets.gltf('house');
  if (!gltf?.scene) {
    const block = plainBlock(THREE, HOUSE_BLOCK, 'house');
    block.userData.closed = true;
    return block;
  }
  const g = new THREE.Group();
  g.position.set(HOUSE.x, 0, HOUSE.z);
  g.userData.kind = 'house';
  const scene = gltf.scene;
  g.add(scene);

  let walls = null;
  const meshes = [];
  scene.traverse((o) => o.isMesh && meshes.push(o));
  for (const mesh of meshes) {
    const old = mesh.material;
    switch (old?.name) {
      case 'Wall': {
        const s = size(THREE, mesh);
        mesh.material = surface(THREE, assets, 'brick', '#e8c9a0', {
          repeat: [Math.max(s.x, s.z) / 2, s.y / 2],
        });
        if (old.side === THREE.DoubleSide)
          mesh.material.side = THREE.DoubleSide;
        if (!walls) walls = tag(mesh, 'walls');
        break;
      }
      case 'Roof':
        mesh.material = surface(THREE, assets, 'roof', '#b5543a', {
          repeat: [HOUSE.w / 1.5, HOUSE.d / 1.5],
          tint: '#d9a98c',
          gain: 2.8,
        });
        mesh.material.side = THREE.DoubleSide;
        tag(mesh, 'roof');
        break;
      case 'Wood':
        mesh.material = surface(THREE, assets, 'wood', '#8b5a2b');
        break;
      case 'Floor':
        mesh.material = surface(THREE, assets, 'wood', '#c9a06b', {
          repeat: [3, 3],
        });
        break;
      case 'Plaster':
        mesh.material = new THREE.MeshStandardMaterial({
          color: '#f1e4cf',
          roughness: 1,
        });
        break;
      case 'Ceiling':
        mesh.material = new THREE.MeshStandardMaterial({
          color: '#f6efe3',
          roughness: 1,
        });
        break;
      case 'Glass':
        old.color.set('#9cc7e8');
        old.roughness = 0.2;
        old.emissive.set('#3b5a73');
        old.emissiveIntensity = 0.25;
        break;
    }
  }
  scene.traverse((o) => {
    if (o.name === 'Door') {
      tag(o, 'door');
      g.userData.door = o;
    } else if (/^Window/.test(o.name)) tag(o, 'window');
  });
  return g;
}
