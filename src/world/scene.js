import 'aframe';
import './components.js';
import { SPAWN, CHARACTER_SPOT } from './layout.js';
import { releasePage } from './teardown.js';
import { HAIR_COLOURS, CLOTHING_COLOURS } from '../logic/fields.js';
import { MANIFEST } from './manifest.js';
import {
  loadAssets,
  failureMessage,
  assetBudgetMs,
  LOAD_TIMEOUT_MS,
} from './assetLoader.js';
import { makeAssets } from './builders/common.js';
import { buildWorld } from './buildWorld.js';
import { disposeObject, disposeAssets } from './dispose.js';
import { SKY } from './builders/sky.js';

// Only known colour ids may reach the markup; anything else gets the first entry.
function safeId(set, id) {
  return set.some((c) => c.id === id) ? id : set[0].id;
}

function makeLoaders(THREE) {
  return {
    texture: (url) =>
      new Promise((resolve, reject) => {
        new THREE.TextureLoader().load(
          url,
          (t) => {
            t.colorSpace = THREE.SRGBColorSpace;
            resolve(t);
          },
          undefined,
          reject,
        );
      }),
    model: (url) =>
      new Promise((resolve, reject) => {
        new THREE.GLTFLoader().load(url, resolve, undefined, reject);
      }),
  };
}

// Resolves when the element has loaded, or rejects when `ms` have passed, so a stalled
// init cannot hang mountWorld. The timer is cleared on success.
function whenLoaded(el, ms) {
  if (el.hasLoaded) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('The scene did not start in time.')),
      Math.max(0, ms),
    );
    el.addEventListener(
      'loaded',
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}

// Resolves when the scene has started, or when the time is up, whichever comes first.
function sceneReady(sceneEl, ms) {
  if (sceneEl.hasLoaded) return Promise.resolve();
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, Math.max(0, ms));
    sceneEl.addEventListener(
      'loaded',
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}

// `startedAt` is when the person chose, so the limits count from then, not from this call.
export async function mountWorld(
  container,
  character,
  { stats = false, startedAt = Date.now() } = {},
) {
  const deadline = startedAt + LOAD_TIMEOUT_MS;
  const THREE = AFRAME.THREE;
  const loaded = await loadAssets(MANIFEST, makeLoaders(THREE), {
    timeoutMs: assetBudgetMs(startedAt),
  });
  const assets = makeAssets(loaded.values);
  const hair = safeId(HAIR_COLOURS, character.hair);
  const clothing = safeId(CLOTHING_COLOURS, character.clothing);

  const scene = document.createElement('div');
  scene.className = 'world';
  scene.innerHTML = `
    <a-scene ${stats ? 'stats' : ''} vr-mode-ui="enabled: false" background="color: ${SKY.horizon}"
      fog="type: linear; color: ${SKY.horizon}; near: 40; far: 220">
      <a-light type="ambient" color="#ffd9b0" intensity="0.85"></a-light>
      <a-light type="directional" color="#ffd9a0" intensity="1.0" position="-6 5 8"></a-light>
      <a-light type="point" color="#ffcf8a" intensity="0.8" distance="12" position="0 2.5 -3"></a-light>
      <a-entity id="world-root" world-motion></a-entity>
      <a-entity id="character-model-entity"
        position="${CHARACTER_SPOT.x} 0 ${CHARACTER_SPOT.z}"
        rotation="0 -30 0"
        character-colours="hair: ${hair}; clothing: ${clothing}"
        idle-animation></a-entity>
      <a-entity camera="far: 1000" look-controls wasd-controls="acceleration: 25" walk-limiter position="${SPAWN.x} 1.6 ${SPAWN.z}"></a-entity>
    </a-scene>`;
  container.appendChild(scene);
  const sceneEl = scene.querySelector('a-scene');
  let root = null;
  let torn = false;

  // One teardown for destroy() and for a failed mount. Safe to call more than once.
  const teardown = () => {
    if (torn) return;
    torn = true;
    // Removing the node only disposes the renderer; the render loop must be stopped too.
    if (sceneEl) {
      // A-Frame's pending 'loaded' listener (a-scene.js play(), line 683) returns early
      // when renderStarted is set (line 689), so a late load cannot restart the loop.
      sceneEl.renderStarted = true;
      sceneEl.pause?.();
      sceneEl.renderer?.setAnimationLoop(null);
    }
    if (root) root.worldUpdaters = [];
    disposeObject(root?.getObject3D?.('world'));
    disposeObject(
      scene.querySelector('#character-model-entity')?.getObject3D?.('mesh'),
    );
    disposeAssets(loaded.values);
    try {
      sceneEl?.renderer?.forceContextLoss?.();
    } catch {
      // The context may already be gone.
    }
    scene.remove();
    // A-Frame leaves its fullscreen class on <html>; without this the page cannot scroll.
    releasePage(document.documentElement);
  };

  try {
    const world = buildWorld(THREE, assets, { hair, clothing });
    root = scene.querySelector('#world-root');
    await whenLoaded(root, deadline - Date.now());
    root.setObject3D('world', world.group);
    root.worldUpdaters = world.updaters;

    // The loaded character model goes on its entity. The existing components paint and animate it.
    const characterGltf = assets.gltf('character');
    if (characterGltf) {
      const el = scene.querySelector('#character-model-entity');
      await whenLoaded(el, deadline - Date.now());
      characterGltf.scene.animations = characterGltf.animations;
      el.setObject3D('mesh', characterGltf.scene);
      el.emit('model-loaded');
    }
    await sceneReady(sceneEl, deadline - Date.now());
  } catch (error) {
    teardown();
    throw error;
  }

  return { warning: failureMessage(loaded), destroy: teardown };
}
