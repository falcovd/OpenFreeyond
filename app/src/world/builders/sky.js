import skyMeta from '../../data/sky.json';
import { shadowFollow } from '../../logic/shadowFollow.js';
import { shadowFrustum } from '../../logic/shadowFrustum.js';
import {
  SHADOW_MAP_SIZE,
  SHADOW_RADIUS,
  SUN_DISTANCE,
  SHADOW_BIAS,
  SHADOW_NORMAL_BIAS,
  SHADOW_BLUR,
} from '../shadowConfig.js';

export const SKY = { radius: 400, horizon: '#cfe6f5', zenith: '#3f86d0' };

// The sky turns this many radians per second: a full turn takes about 105 minutes. Calm, not distracting.
// The sun light turns with it, so shading stays in step with the sun in the photo.
export const SKY_DRIFT = 0.001;

// The photo fades into the fog colour from this far below to this far above the horizon.
export const BLEND = { belowDeg: 4, aboveDeg: 6 };

// The light direction when there is no photo. Same direction as the light of phase 1.
const FALLBACK_SUN = (() => {
  const v = [-6, 5, 8];
  const len = Math.hypot(...v);
  return v.map((c) => c / len);
})();

const HEX = /^#[0-9a-f]{6}$/i;

// True when the sky data can be trusted: a hex colour and a unit vector that points above the horizon.
export function validSkyMeta(meta) {
  if (!meta || typeof meta.horizon !== 'string' || !HEX.test(meta.horizon))
    return false;
  const sun = meta.sun;
  if (!Array.isArray(sun) || sun.length !== 3) return false;
  if (!sun.every(Number.isFinite)) return false;
  return Math.abs(Math.hypot(...sun) - 1) < 0.01 && sun[1] > 0;
}

// What the sky and the fog use. The photo data counts only when the photo itself loaded (FR-16).
// `horizon` is checked against a hex pattern, so it is safe to place in markup.
export function skyParams(assets, meta = skyMeta) {
  if (assets.texture('sky') && validSkyMeta(meta))
    return { photo: true, horizon: meta.horizon, sun: meta.sun };
  return { photo: false, horizon: SKY.horizon, sun: FALLBACK_SUN };
}

const smoothstep = (t) => {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
};

// The photo on the inside of a sphere. Vertex alpha fades it out toward and below the horizon,
// so the fog-coloured background and the ground meet it without a seam (FR-3).
function photoSphere(THREE, texture) {
  const geometry = new THREE.SphereGeometry(SKY.radius, 64, 96);
  const pos = geometry.attributes.position;
  const rgba = [];
  const span = BLEND.belowDeg + BLEND.aboveDeg;
  for (let i = 0; i < pos.count; i++) {
    const elevation = Math.asin(pos.getY(i) / SKY.radius) * (180 / Math.PI);
    rgba.push(1, 1, 1, smoothstep((elevation + BLEND.belowDeg) / span));
  }
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(rgba, 4));
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    vertexColors: true,
    transparent: true,
    side: THREE.BackSide,
    fog: false,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.scale.x = -1; // seen from inside, the photo would otherwise be mirrored
  return mesh;
}

// The phase 1 sky: a gradient from the horizon colour up to deeper blue. Used when the photo is missing.
function gradientSphere(THREE) {
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
  return new THREE.Mesh(geometry, material);
}

// The sky sphere and the sun light. The group turns slowly (FR-14); the sphere is child 0.
export function buildSky(
  THREE,
  assets,
  params = skyParams(assets),
  { shadows = false } = {},
) {
  const group = new THREE.Group();
  const mesh = params.photo
    ? photoSphere(THREE, assets.texture('sky'))
    : gradientSphere(THREE);
  mesh.renderOrder = -1;
  group.add(mesh);
  group.userData.noPick = true; // a click goes through the sky
  group.userData.kind = 'sky';
  const sun = new THREE.DirectionalLight('#ffd9a0', 1.0);
  sun.position.set(...params.sun).multiplyScalar(SUN_DISTANCE);
  if (shadows) {
    const f = shadowFrustum({ radius: SHADOW_RADIUS, distance: SUN_DISTANCE });
    sun.castShadow = true;
    sun.shadow.mapSize.set(SHADOW_MAP_SIZE, SHADOW_MAP_SIZE);
    Object.assign(sun.shadow.camera, f);
    sun.shadow.camera.updateProjectionMatrix();
    sun.shadow.bias = SHADOW_BIAS;
    sun.shadow.normalBias = SHADOW_NORMAL_BIAS;
    sun.shadow.radius = SHADOW_BLUR;
  }
  // The target is part of the scene so the shadow follower can move it (a light's target only counts
  // when it has a world matrix).
  group.add(sun, sun.target);
  group.userData.sun = sun;
  // The sun's direction now, in world space: the local direction turned by the group about y.
  group.userData.sunDirection = () => {
    const [x, y, z] = params.sun;
    const a = group.rotation.y;
    return [
      x * Math.cos(a) + z * Math.sin(a),
      y,
      -x * Math.sin(a) + z * Math.cos(a),
    ];
  };
  // Puts the shadow box on a person (world x, z). The light lives in the turning group, so the maths
  // run in the group's own frame: the person is turned back by the group's angle, and the sun
  // direction there is the constant local one. Rotation about y keeps the light's right and up axes,
  // so snapping to whole texels in the local frame snaps in the light's frame too.
  group.userData.follow = (person) => {
    const a = group.rotation.y;
    const local = {
      x: person.x * Math.cos(a) - person.z * Math.sin(a),
      z: person.x * Math.sin(a) + person.z * Math.cos(a),
    };
    const r = shadowFollow({
      person: local,
      dir: params.sun,
      distance: SUN_DISTANCE,
      texel: (2 * SHADOW_RADIUS) / SHADOW_MAP_SIZE,
    });
    sun.target.position.set(r.target.x, r.target.y, r.target.z);
    sun.position.set(r.position.x, r.position.y, r.position.z);
  };
  group.userData.update = (seconds) => {
    group.rotation.y = seconds * SKY_DRIFT;
  };
  return group;
}
