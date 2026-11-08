import { HAIR_COLOURS, CLOTHING_COLOURS } from './fields.js';

const SETS = { hair: HAIR_COLOURS, clothing: CLOTHING_COLOURS };

// Material names in the converted character model (Task 8). Change them here for another model.
export const CHARACTER_MATERIALS = { hair: 'Hair', clothing: 'Purple' };

export function hexFor(kind, id) {
  return SETS[kind].find((c) => c.id === id)?.hex;
}

export function applyColours(root, { hair, clothing }) {
  const hairHex = hexFor('hair', hair);
  const clothingHex = hexFor('clothing', clothing);
  root.traverse((node) => {
    if (!node.isMesh) return;
    const materials = Array.isArray(node.material)
      ? node.material
      : [node.material];
    for (const material of materials) {
      if (material.name === CHARACTER_MATERIALS.hair && hairHex)
        material.color.set(hairHex);
      if (material.name === CHARACTER_MATERIALS.clothing && clothingHex)
        material.color.set(clothingHex);
    }
  });
}
