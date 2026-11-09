// The backdrop (FR-9): a static picture of European buildings on the inside of an open cylinder around the
// place. It does not move, has no depth, casts and receives no shadow and is not pickable. The fog fades it.
// Until the picture has arrived (or if it failed), a plain band of the horizon colour stands in its place,
// so no void shows between the ground and the sky (AC-4.7).

export const BACKDROP = {
  radius: 100, // m; the far plots' corners are about 74 m from the origin, so they all stand inside
  height: 20, // m, between 15 and 25 (AC-4.4)
  bottom: -1.6, // m; it stands in the ground: the grass strip along the bottom of the picture (8%) lies below it
  segments: 128,
  // The picture is 4 : 1 and the cylinder is 2 * PI * 100 = 628 m around and 20 m high, so the picture repeats
  // this many times around (it is seamless: its ends are cross-faded). One repeat is 78.5 m by 20 m (3.9 : 1).
  repeat: 8,
  renderOrder: 0, // just above the sky sphere (-1): drawn after it and before the scene
};

// The plain band, or the picture when `assets` already has the 'backdrop' texture.
export function buildBackdrop(THREE, assets, { horizon }) {
  const geometry = new THREE.CylinderGeometry(
    BACKDROP.radius,
    BACKDROP.radius,
    BACKDROP.height,
    BACKDROP.segments,
    1,
    true,
  );
  const material = new THREE.MeshBasicMaterial({
    color: horizon,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
    fog: true,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = BACKDROP.bottom + BACKDROP.height / 2;
  mesh.renderOrder = BACKDROP.renderOrder;
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.userData.kind = 'backdrop';
  mesh.userData.noPick = true;
  mesh.userData.plain = 'backdrop';

  // The picture replaces the plain colour. It is the colour space the loader sets (sRGB) and repeats sideways.
  mesh.userData.setTexture = (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.repeat.set(BACKDROP.repeat, 1);
    texture.needsUpdate = true;
    material.map = texture;
    material.color.set(0xffffff);
    material.needsUpdate = true;
    delete mesh.userData.plain;
  };
  const texture = assets.texture('backdrop');
  if (texture) mesh.userData.setTexture(texture);
  return mesh;
}
