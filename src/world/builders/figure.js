import { hexFor } from '../../logic/colours.js';
import { CHARACTER_SPOT } from '../layout.js';

// A simple human-shaped stand-in for the character model (FR-16).
// Collision is the character solid in layout.js, so the figure blocks walking like the model does.
export function buildFigure(THREE, { hair, clothing }) {
  const g = new THREE.Group();
  g.position.set(CHARACTER_SPOT.x, 0, CHARACTER_SPOT.z);
  g.rotation.y = (-30 * Math.PI) / 180;
  g.userData.kind = 'character';
  g.userData.plain = 'figure';

  const mat = (name, hex) => {
    const m = new THREE.MeshStandardMaterial({ color: hex, roughness: 1 });
    m.name = name;
    return m;
  };
  const part = (geometry, material, y) => {
    const m = new THREE.Mesh(geometry, material);
    m.position.y = y;
    g.add(m);
    return m;
  };
  const clothes = mat(
    'figure-clothing',
    hexFor('clothing', clothing) ?? '#6f8f5a',
  );
  const trousers = mat('figure-trousers', '#7ea6c9');
  const skin = mat('figure-skin', '#e0b394');
  const hairMaterial = mat('figure-hair', hexFor('hair', hair) ?? '#3b2a20');

  for (const x of [-0.11, 0.11]) {
    const leg = part(new THREE.BoxGeometry(0.18, 0.8, 0.18), trousers, 0.4);
    leg.position.x = x;
  }
  part(new THREE.BoxGeometry(0.5, 0.6, 0.25), clothes, 1.1);
  part(new THREE.SphereGeometry(0.14, 12, 10), skin, 1.55);
  const cap = part(
    new THREE.SphereGeometry(0.15, 12, 10, 0, Math.PI * 2, 0, Math.PI / 1.8),
    hairMaterial,
    1.57,
  );
  cap.rotation.x = -0.15;
  return g;
}
