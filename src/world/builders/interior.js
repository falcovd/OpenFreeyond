import { INTERIOR_ITEMS } from '../layout.js';
import { fitToBox } from './common.js';
import { tvSource } from '../../logic/tv.js';
import { TV_MODE, INTERIOR_DIM } from '../interiorConfig.js';
import { materialSpec, boxProject } from '../../logic/furniture-textures.js';

function block(THREE, item) {
  const g = new THREE.Group();
  g.position.set(item.x, item.y ?? 0, item.z);
  g.userData.item = item.id;
  g.userData.plain = item.id;
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(item.w, item.h, item.d),
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(item.color).multiplyScalar(INTERIOR_DIM),
    }),
  );
  m.position.y = item.h / 2;
  g.add(m);
  return g;
}

const DARK_SCREEN = '#101014';

// The TV screen (FR-15, FR-22, FR-23). It holds what is known about the clip and the still and
// shows the right one (tvSource). The screen plane is a child of the model, in the model's own
// frame (layout.js measured `screen` there), so it scales and turns with the model.
// No sound: the video is muted and the screen never touches audio.
export function attachTv(THREE, mode = TV_MODE) {
  const item = INTERIOR_ITEMS.find((i) => i.id === 'tv');
  const state = {
    clip: mode === 'clip' ? 'loading' : 'none',
    still: 'loading',
  };
  let screen = null;
  let video = null;
  let stillTexture = null;
  let videoTexture = null;
  let disposed = false;

  const refresh = () => {
    if (!screen || disposed) return;
    const source = tvSource({ mode, ...state });
    const m = screen.material;
    if (source === 'clip') {
      videoTexture ??= new THREE.VideoTexture(video);
      videoTexture.colorSpace = THREE.SRGBColorSpace;
      m.map = videoTexture;
      m.color.set('#ffffff');
    } else if (source === 'still') {
      m.map = stillTexture;
      m.color.set('#ffffff');
    } else {
      m.map = null;
      m.color.set(DARK_SCREEN);
    }
    m.needsUpdate = true;
  };

  return {
    state,
    get screen() {
      return screen;
    },
    // Called with the model object that fitToBox scales.
    mount(model) {
      if (disposed || screen) return screen;
      const { w, h, y, z } = item.screen;
      screen = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({
          color: DARK_SCREEN,
          toneMapped: false,
        }),
      );
      screen.name = 'TvScreen';
      screen.position.set(0, y, z);
      model.add(screen);
      refresh();
      return screen;
    },
    setStill(texture) {
      stillTexture = texture;
      state.still = 'ready';
      refresh();
    },
    stillFailed() {
      state.still = 'failed';
      refresh();
    },
    setClip(element) {
      if (disposed) return;
      video = element;
      video.muted = true;
      video.loop = true;
      state.clip = 'ready';
      // A browser may refuse to start it; the still stays then (AC-4.7).
      Promise.resolve(video.play?.()).catch(() => this.clipBlocked());
      refresh();
    },
    clipBlocked() {
      state.clip = 'blocked';
      refresh();
    },
    clipFailed() {
      state.clip = 'failed';
      refresh();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      if (video) {
        video.pause?.();
        video.removeAttribute?.('src');
        video.src = '';
        video.load?.();
      }
      videoTexture?.dispose();
      stillTexture?.dispose();
      screen?.geometry.dispose();
      screen?.material.dispose();
    },
  };
}

// Gives the parts of one fitted model a tiling texture, by material name (materialSpec). The kit's UVs
// point into its colour atlas, so each such mesh gets a geometry copy with UVs projected from its box
// sides, in metres. A part whose texture has not arrived keeps its kit colour. Clones of one file share
// geometry and materials, so both are copied per mesh before they change.
function texturise(THREE, id, scene, textures, wrapped) {
  scene.updateMatrixWorld(true);
  const inverse = new THREE.Matrix4().copy(scene.matrixWorld).invert();
  const metres = scene.scale.x;
  scene.traverse((mesh) => {
    if (!mesh.isMesh || mesh.userData.textured) return;
    if (Array.isArray(mesh.material) || !mesh.geometry.attributes.normal)
      return;
    const spec = materialSpec(id, mesh.material.name);
    const source = spec && textures.get(spec.texture);
    if (!source) return;
    if (!wrapped.has(spec.texture)) {
      const map = source.clone();
      map.wrapS = map.wrapT = THREE.RepeatWrapping;
      map.needsUpdate = true;
      wrapped.set(spec.texture, map);
    }
    const toModel = new THREE.Matrix4().multiplyMatrices(
      inverse,
      mesh.matrixWorld,
    );
    const normalMatrix = new THREE.Matrix3().getNormalMatrix(toModel);
    const geometry = mesh.geometry.clone();
    const { position, normal } = geometry.attributes;
    const p = new THREE.Vector3();
    const n = new THREE.Vector3();
    const ps = [];
    const ns = [];
    for (let i = 0; i < position.count; i++) {
      p.fromBufferAttribute(position, i).applyMatrix4(toModel);
      n.fromBufferAttribute(normal, i).applyMatrix3(normalMatrix);
      ps.push(p.x * metres, p.y * metres, p.z * metres);
      ns.push(n.x, n.y, n.z);
    }
    geometry.setAttribute(
      'uv',
      new THREE.BufferAttribute(boxProject(ps, ns, spec.size), 2),
    );
    const material = mesh.material.clone();
    material.map = wrapped.get(spec.texture);
    material.roughness = 1;
    material.metalness = 0;
    if (spec.tint === 'kit') material.color.multiplyScalar(spec.gain);
    else material.color.set(spec.tint).multiplyScalar(INTERIOR_DIM * spec.gain);
    material.needsUpdate = true;
    mesh.geometry = geometry;
    mesh.material = material;
    mesh.userData.textured = true;
  });
}

// A plain block for every item at once. replace(id, scene) swaps one block for its model,
// fitted into the footprint of the block. fail(id) keeps the block (FR-20, FR-23).
export function buildInterior(
  THREE,
  { tvMode = TV_MODE, textures: given = {} } = {},
) {
  const group = new THREE.Group();
  group.userData.kind = 'interior';
  const slots = new Map();
  for (const item of INTERIOR_ITEMS) {
    const b = block(THREE, item);
    slots.set(item.id, b);
    group.add(b);
  }
  const tv = attachTv(THREE, tvMode);
  // Textures for the furniture by manifest id; the ones from the interior load arrive later (setTexture).
  const textures = new Map(Object.entries(given).filter(([, t]) => t));
  const wrapped = new Map();
  const models = new Map();
  // Clones of one file share their materials, so each is dimmed once.
  const dimmed = new Set();
  const dim = (object) =>
    object.traverse((o) => {
      for (const m of [].concat(o.material ?? [])) {
        if (!m.color || dimmed.has(m)) continue;
        dimmed.add(m);
        m.color.multiplyScalar(INTERIOR_DIM);
      }
    });
  return {
    group,
    slots,
    tv,
    replace(id, scene) {
      const item = INTERIOR_ITEMS.find((i) => i.id === id);
      const old = slots.get(id);
      if (!item || !old) return null;
      dim(scene);
      const fitted = fitToBox(THREE, scene, item, item.rot ?? 0);
      fitted.position.set(item.x, item.y ?? 0, item.z);
      fitted.userData.item = id;
      // After the fit, so the plane does not change the size of the model.
      if (id === 'tv') tv.mount(scene);
      models.set(id, scene);
      texturise(THREE, id, scene, textures, wrapped);
      group.remove(old);
      group.add(fitted);
      slots.set(id, fitted);
      return fitted;
    },
    // A furniture texture arrived: every model already in place that wants it gets it.
    setTexture(textureId, texture) {
      if (!texture) return;
      textures.set(textureId, texture);
      for (const [id, scene] of models)
        texturise(THREE, id, scene, textures, wrapped);
    },
    fail(id) {
      const slot = slots.get(id);
      if (slot) slot.userData.failed = true;
    },
  };
}
