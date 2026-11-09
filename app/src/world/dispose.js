// Frees GPU and JS resources held by a three.js object tree.
// This file must not import aframe or three, so it runs in unit tests.
const isTexture = (v) => v && v.isTexture === true;

function disposeMaterial(material) {
  for (const value of Object.values(material)) {
    if (isTexture(value)) value.dispose();
  }
  material.dispose?.();
}

export function disposeObject(root) {
  if (!root || typeof root.traverse !== 'function') return;
  const seen = new Set();
  root.traverse((node) => {
    node.geometry?.dispose?.();
    const materials = [].concat(node.material ?? []);
    for (const material of materials) {
      if (!material || seen.has(material)) continue;
      seen.add(material);
      disposeMaterial(material);
    }
  });
}

// `values` is the map from loadAssets: textures, and glTF results with a `scene`.
export function disposeAssets(values) {
  for (const value of values?.values?.() ?? []) {
    if (isTexture(value)) value.dispose();
    else if (value?.scene) disposeObject(value.scene);
  }
}
