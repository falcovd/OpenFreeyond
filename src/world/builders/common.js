// Shared helpers. No import of aframe: THREE is passed in.

// assets: { texture(id), model(id), gltf(id) } built from the loader's result (null when missing).
export function makeAssets(values) {
  return {
    texture: (id) => (values.get(id)?.isTexture ? values.get(id) : null),
    gltf: (id) => values.get(id) ?? null,
    model: (id) => values.get(id)?.scene ?? null,
  };
}

// A material that uses the texture when it loaded and a plain colour when it did not (FR-16).
// A tint can only darken a texture. `gain` brightens a dark texture so the tint reads as its colour.
export function surface(
  THREE,
  assets,
  textureId,
  fallback,
  { repeat, tint, gain = 1 } = {},
) {
  const tex = assets.texture(textureId);
  if (!tex)
    return new THREE.MeshStandardMaterial({ color: fallback, roughness: 1 });
  const map = tex.clone();
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  if (repeat) map.repeat.set(repeat[0], repeat[1]);
  map.needsUpdate = true;
  return new THREE.MeshStandardMaterial({
    map,
    color: new THREE.Color(tint ?? 0xffffff).multiplyScalar(gain),
    roughness: 1,
  });
}

export function box(THREE, w, h, d, material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z);
  return m;
}

// A plain block in the place of a solid whose model failed. It has the solid's footprint (FR-16).
export function plainBlock(THREE, solid, label = 'plain') {
  const g = new THREE.Group();
  g.position.set(solid.x, 0, solid.z);
  g.userData.kind = solid.kind;
  g.userData.plain = label;
  const height = solid.h ?? 1;
  const material = new THREE.MeshStandardMaterial({
    color: solid.color ?? '#c9b8a0',
  });
  g.add(box(THREE, solid.w, height, solid.d, material, 0, height / 2, 0));
  return g;
}

// Scales a model to a height and stands it on y = 0. Returns a wrapper group.
export function fitToHeight(THREE, object, height) {
  const wrapper = new THREE.Group();
  wrapper.add(object);
  const size = new THREE.Box3()
    .setFromObject(object)
    .getSize(new THREE.Vector3());
  if (size.y > 0) object.scale.multiplyScalar(height / size.y);
  const bounds = new THREE.Box3().setFromObject(object);
  object.position.y -= bounds.min.y;
  const centre = bounds.getCenter(new THREE.Vector3());
  object.position.x -= centre.x;
  object.position.z -= centre.z;
  return wrapper;
}

// A small stable number from a string, for varying rotation and sway between objects.
export function hash(text) {
  let h = 0;
  for (const c of text) h = (h * 31 + c.charCodeAt(0)) % 1000;
  return h / 1000;
}
