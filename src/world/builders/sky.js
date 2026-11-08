export const SKY = { radius: 400, horizon: '#cfe6f5', zenith: '#3f86d0' };

// A big inside-out sphere. Colour runs from the horizon colour up to the deeper blue overhead.
// Everything at or below the horizon uses the horizon colour, which is also the fog colour (FR-1, FR-3).
export function buildSky(THREE) {
  const geometry = new THREE.SphereGeometry(SKY.radius, 32, 24);
  const horizon = new THREE.Color(SKY.horizon);
  const zenith = new THREE.Color(SKY.zenith);
  const colours = [];
  const pos = geometry.attributes.position;
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const t = Math.max(0, pos.getY(i) / SKY.radius);
    c.copy(horizon).lerp(zenith, Math.pow(t, 0.6));
    colours.push(c.r, c.g, c.b);
  }
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colours, 3));
  const material = new THREE.MeshBasicMaterial({
    vertexColors: true,
    side: THREE.BackSide,
    fog: false,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.renderOrder = -1;
  const group = new THREE.Group();
  group.add(mesh);
  return group;
}

// A few puffy clouds made of white spheres. The whole group turns slowly around the place (FR-2, FR-14).
export function buildClouds(THREE, { count = 8 } = {}) {
  const group = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({
    color: '#ffffff',
    transparent: true,
    opacity: 0.92,
    fog: false,
  });
  for (let i = 0; i < count; i++) {
    const cloud = new THREE.Group();
    const puffs = 4 + (i % 3);
    for (let p = 0; p < puffs; p++) {
      const s = 10 + ((i * 7 + p * 5) % 9);
      const puff = new THREE.Mesh(new THREE.SphereGeometry(s, 10, 8), material);
      puff.position.set(p * 11 - puffs * 5, (p % 2) * 3, (p % 3) * 4);
      puff.scale.y = 0.55;
      cloud.add(puff);
    }
    const angle = (i / count) * Math.PI * 2;
    const radius = 150 + (i % 3) * 40;
    cloud.position.set(
      Math.cos(angle) * radius,
      55 + (i % 4) * 12,
      Math.sin(angle) * radius,
    );
    cloud.rotation.y = -angle;
    group.add(cloud);
  }
  // 0.004 radians per second: a full turn takes about 26 minutes. Calm, not distracting.
  group.userData.update = (seconds) => {
    group.rotation.y = seconds * 0.004;
  };
  return group;
}
