import { INTERIOR_ITEMS } from '../layout.js';
import { fitToBox } from './common.js';
import { tvSource } from '../../logic/tv.js';
import { TV_MODE } from '../interiorConfig.js';

function block(THREE, item) {
  const g = new THREE.Group();
  g.position.set(item.x, item.y ?? 0, item.z);
  g.userData.item = item.id;
  g.userData.plain = item.id;
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(item.w, item.h, item.d),
    new THREE.MeshStandardMaterial({ color: item.color }),
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

// A plain block for every item at once. replace(id, scene) swaps one block for its model,
// fitted into the footprint of the block. fail(id) keeps the block (FR-20, FR-23).
export function buildInterior(THREE, { tvMode = TV_MODE } = {}) {
  const group = new THREE.Group();
  group.userData.kind = 'interior';
  const slots = new Map();
  for (const item of INTERIOR_ITEMS) {
    const b = block(THREE, item);
    slots.set(item.id, b);
    group.add(b);
  }
  const tv = attachTv(THREE, tvMode);
  return {
    group,
    slots,
    tv,
    replace(id, scene) {
      const item = INTERIOR_ITEMS.find((i) => i.id === id);
      const old = slots.get(id);
      if (!item || !old) return null;
      const fitted = fitToBox(THREE, scene, item, item.rot ?? 0);
      fitted.position.set(item.x, item.y ?? 0, item.z);
      fitted.userData.item = id;
      // After the fit, so the plane does not change the size of the model.
      if (id === 'tv') tv.mount(scene);
      group.remove(old);
      group.add(fitted);
      slots.set(id, fitted);
      return fitted;
    },
    fail(id) {
      const slot = slots.get(id);
      if (slot) slot.userData.failed = true;
    },
  };
}
