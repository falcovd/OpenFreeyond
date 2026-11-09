import 'aframe';
import './components.js';
import {
  SPAWN,
  CHARACTER_SPOT,
  resetCharacterSolid,
  resetHouse,
  LIGHTS,
  useClosedHouse,
} from './layout.js';
import { lightsMarkup } from './lightsMarkup.js';
import { releasePage } from './teardown.js';
import { HAIR_COLOURS, CLOTHING_COLOURS } from '../logic/fields.js';
import {
  MANIFEST,
  FURNITURE_TEXTURES,
  interiorManifest,
  itemsForFile,
} from './manifest.js';
import {
  loadAssets,
  loadInterior,
  failureMessage,
  assetBudgetMs,
  HOUSE_FAILED_MESSAGE,
  INTERIOR_FAILED_MESSAGE,
  LOAD_TIMEOUT_MS,
} from './assetLoader.js';
import { makeAssets } from './builders/common.js';
import { buildWorld } from './buildWorld.js';
import { disposeObject, disposeAssets } from './dispose.js';
import { skyParams } from './builders/sky.js';
import { FOG } from './builders/ground.js';

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
    // Silent and looping; the src is set last so the listeners are in place first.
    video: (url) =>
      new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.preload = 'auto';
        video.addEventListener('loadeddata', () => resolve(video), {
          once: true,
        });
        video.addEventListener('error', () => reject(new Error(url)), {
          once: true,
        });
        video.src = url;
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
  {
    stats = false,
    startedAt = Date.now(),
    onDoorHint,
    onStepAside,
    onNotice,
  } = {},
) {
  const deadline = startedAt + LOAD_TIMEOUT_MS;
  const THREE = AFRAME.THREE;
  const loaded = await loadAssets(MANIFEST, makeLoaders(THREE), {
    timeoutMs: assetBudgetMs(startedAt),
  });
  const assets = makeAssets(loaded.values);
  // A house that did not load is one closed block, with solids to match (FR-21).
  const houseLoaded = !!assets.gltf('house');
  if (!houseLoaded) useClosedHouse();
  const sky = skyParams(assets);
  const hair = safeId(HAIR_COLOURS, character.hair);
  const clothing = safeId(CLOTHING_COLOURS, character.clothing);

  const scene = document.createElement('div');
  scene.className = 'world';
  scene.innerHTML = `
    <a-scene ${stats ? 'stats' : ''} vr-mode-ui="enabled: false" background="color: ${sky.horizon}"
      fog="type: linear; color: ${sky.horizon}; near: ${FOG.near}; far: ${FOG.far}">
      <a-light type="ambient" color="#ffd9b0" intensity="0.85"></a-light>
      <a-light type="point" color="#ffcf8a" intensity="0.8" distance="12" position="0 2.5 -3"></a-light>
      ${houseLoaded ? lightsMarkup(LIGHTS) : ''}
      <a-entity id="world-root" world-motion></a-entity>
      <a-entity id="door-controller" house-door></a-entity>
      <a-entity id="character-model-entity"
        position="${CHARACTER_SPOT.x} 0 ${CHARACTER_SPOT.z}"
        rotation="0 -30 0"
        character-colours="hair: ${hair}; clothing: ${clothing}"
        character-mouth
        character-animation
        character-wander></a-entity>
      <a-entity camera="far: 1000" look-controls wasd-controls="acceleration: 25" walk-limiter position="${SPAWN.x} 1.6 ${SPAWN.z}"></a-entity>
    </a-scene>`;
  container.appendChild(scene);
  const sceneEl = scene.querySelector('a-scene');
  let root = null;
  let interior = null;
  let torn = false;
  const doorHint = (e) => onDoorHint?.(e.detail.visible);
  const stepAside = (e) => onStepAside?.(e.detail.visible);
  sceneEl.addEventListener('door-hint', doorHint);
  sceneEl.addEventListener('door-step-aside', stepAside);

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
    sceneEl?.removeEventListener('door-hint', doorHint);
    sceneEl?.removeEventListener('door-step-aside', stepAside);
    if (root) root.worldUpdaters = [];
    // Stops the clip and frees the video and the textures (FR-18, AC-8.1).
    interior?.tv?.dispose();
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
    resetCharacterSolid();
    resetHouse();
    // A-Frame leaves its fullscreen class on <html>; without this the page cannot scroll.
    releasePage(document.documentElement);
  };

  // A video that arrives after teardown is never given to the TV, so release it here.
  const releaseLate = (value) => {
    if (typeof value?.pause !== 'function') return;
    try {
      value.pause();
      value.removeAttribute?.('src');
      value.load?.();
    } catch {
      // Already released.
    }
  };

  // Models replace their blocks as they arrive. The TV hooks feed the TV screen (builders/interior.js).
  const startInterior = (house) => {
    const onItem = (id, value) => {
      if (id === 'tv-still') return house.tv?.setStill?.(value);
      if (id === 'tv-clip') return house.tv?.setClip?.(value);
      if (FURNITURE_TEXTURES.includes(id)) return house.setTexture(id, value);
      const file = itemsForFile(
        interiorManifest().find((a) => a.id === id)?.url,
      );
      for (const item of file) house.replace(item.id, value.scene.clone(true));
    };
    const onFail = (id) => {
      if (id === 'tv-still' || id === 'tv-clip') {
        if (id === 'tv-still') house.tv?.stillFailed?.();
        else house.tv?.clipFailed?.();
        return onNotice?.(INTERIOR_FAILED_MESSAGE);
      }
      // A furniture texture that fails leaves the kit colours on the furniture.
      if (FURNITURE_TEXTURES.includes(id))
        return onNotice?.(INTERIOR_FAILED_MESSAGE);
      const url = interiorManifest().find((a) => a.id === id)?.url;
      for (const item of itemsForFile(url)) house.fail(item.id);
      onNotice?.(INTERIOR_FAILED_MESSAGE);
    };
    loadInterior(interiorManifest(), makeLoaders(THREE), {
      onItem,
      onFail,
      onLate: (id, value) => releaseLate(value),
      isCancelled: () => torn,
    });
  };

  try {
    const world = buildWorld(THREE, assets, { hair, clothing });
    root = scene.querySelector('#world-root');
    await whenLoaded(root, deadline - Date.now());
    root.setObject3D('world', world.group);
    root.worldUpdaters = world.updaters;

    // The loaded character model goes on its entity. The components paint, animate and move it.
    const characterGltf = assets.gltf('character');
    if (characterGltf) {
      const el = scene.querySelector('#character-model-entity');
      await whenLoaded(el, deadline - Date.now());
      characterGltf.scene.animations = characterGltf.animations;
      el.setObject3D('mesh', characterGltf.scene);
      el.emit('model-loaded');
    }
    await sceneReady(sceneEl, deadline - Date.now());
    // The canvas exists only once the scene has loaded, so the door attaches now.
    const door = houseLoaded && world.group.getObjectByName('Door');
    if (door) {
      const characterEl = scene.querySelector('#character-model-entity');
      scene.querySelector('#door-controller').components['house-door']?.attach({
        node: door,
        pickables: [...world.pickables, characterEl.object3D],
      });
    }
    // The interior keeps loading after the place is ready; it is not awaited (FR-20).
    interior = world.interior;
    if (houseLoaded && interior) startInterior(interior);
  } catch (error) {
    teardown();
    throw error;
  }

  const warning = [
    failureMessage(loaded),
    houseLoaded ? '' : HOUSE_FAILED_MESSAGE,
  ]
    .filter(Boolean)
    .join(' ');
  return { warning, destroy: teardown };
}
