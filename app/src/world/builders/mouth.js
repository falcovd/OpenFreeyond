// The character model has eyes and eyebrows but no mouth. This draws one in code, as a thin
// dark ribbon that follows the curve of the face, and hangs it on the head bone so it moves
// with the idle animation. No import of aframe or three: THREE is passed in.
//
// All numbers are in the space of the "Head" bone of public/assets/character.glb (metres,
// +y up, +z forward). They were measured from the model: eyes at y 0.10 to 0.12, nose tip at
// y 0.058, chin at about y -0.01, and the face front at z 0.113 on the midline, curving back
// toward the sides. Change them here when the model is reconverted.
export const MOUTH = {
  bone: 'Head',
  y: 0.025, // height of the middle of the mouth
  faceZ: 0.1135, // face front on the midline at that height
  faceCurve: 8.8, // the face falls back by faceCurve * x^2 toward the sides
  halfWidth: 0.024,
  thickness: 0.006, // height of the ribbon in the middle
  smile: 12, // the corners lift by smile * x^2: a small, calm smile
  lift: 0.0015, // distance in front of the skin, so the skin does not hide it
  colour: '#5c2b27',
};

// A ribbon from the left corner to the right corner. It is thickest in the middle and tapers to the corners.
function ribbonGeometry(THREE, { segments = 10 } = {}) {
  const position = [];
  const index = [];
  for (let i = 0; i <= segments; i++) {
    const x = (i / segments - 0.5) * 2 * MOUTH.halfWidth;
    const t = x / MOUTH.halfWidth; // -1 to 1
    const yCentre = MOUTH.y + MOUTH.smile * x * x;
    const z = MOUTH.faceZ - MOUTH.faceCurve * x * x + MOUTH.lift;
    const half = (MOUTH.thickness / 2) * (1 - 0.7 * t * t);
    position.push(x, yCentre + half, z, x, yCentre - half, z);
    if (i < segments) {
      const a = i * 2;
      index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(position, 3),
  );
  geometry.setIndex(index);
  geometry.computeVertexNormals();
  return geometry;
}

export function buildMouth(THREE) {
  const material = new THREE.MeshStandardMaterial({
    color: MOUTH.colour,
    roughness: 1,
    side: THREE.DoubleSide, // the ribbon must show whichever way the winding ends up
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  material.name = 'Mouth';
  const mesh = new THREE.Mesh(ribbonGeometry(THREE), material);
  mesh.name = 'Mouth';
  mesh.userData.part = 'mouth';
  return mesh;
}

// Hangs one mouth on the head bone of a loaded model. Returns the mouth, or null when the
// model has no such bone. Safe to call more than once: an earlier mouth is replaced.
export function attachMouth(THREE, root) {
  let head = null;
  root.traverse((node) => {
    if (!head && node.isBone && node.name === MOUTH.bone) head = node;
  });
  if (!head) return null;
  for (const child of [...head.children]) {
    if (child.userData.part === 'mouth') {
      head.remove(child);
      child.geometry?.dispose?.();
      child.material?.dispose?.();
    }
  }
  const mouth = buildMouth(THREE);
  head.add(mouth);
  return mouth;
}
