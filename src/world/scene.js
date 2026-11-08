import 'aframe';
import './components.js';
import { SOLIDS, SPAWN, CHARACTER_SPOT } from './layout.js';

const CHARACTER_URL = `${import.meta.env.BASE_URL}assets/character.glb`;

function drawSolid(s) {
  if (s.kind === 'character') return '';
  if (s.kind === 'tree') {
    return `
      <a-cylinder position="${s.x} ${s.h / 2} ${s.z}" radius="0.25" height="${s.h}" color="${s.color}"></a-cylinder>
      <a-sphere position="${s.x} ${s.h + 0.6} ${s.z}" radius="1.2" color="#6f9a4d"></a-sphere>`;
  }
  const roof =
    s.id === 'house'
      ? `<a-cone position="${s.x} ${s.h + 1} ${s.z}" radius-bottom="4.6" radius-top="0.1" height="2" segments-radial="4" rotation="0 45 0" color="#b5543a"></a-cone>`
      : '';
  return `
    <a-box position="${s.x} ${s.h / 2} ${s.z}" width="${s.w}" height="${s.h}" depth="${s.d}" color="${s.color}"></a-box>
    ${roof}`;
}

export function mountWorld(container, character, { stats = false } = {}) {
  const scene = document.createElement('div');
  scene.className = 'world';
  scene.innerHTML = `
    <a-scene ${stats ? 'stats' : ''} vr-mode-ui="enabled: false" background="color: #f6d9a8">
      <a-assets timeout="15000">
        <a-asset-item id="character-model" src="${CHARACTER_URL}"></a-asset-item>
      </a-assets>
      <a-plane rotation="-90 0 0" width="24" height="24" color="#8fae6b"></a-plane>
      <a-light type="ambient" color="#ffe2b8" intensity="0.7"></a-light>
      <a-light type="directional" color="#ffd9a0" intensity="0.8" position="-3 6 4"></a-light>
      <a-light type="point" color="#ffcf8a" intensity="0.8" distance="12" position="0 2.5 -3"></a-light>
      ${SOLIDS.map(drawSolid).join('')}
      <a-entity
        gltf-model="#character-model"
        position="${CHARACTER_SPOT.x} 0 ${CHARACTER_SPOT.z}"
        rotation="0 -30 0"
        character-colours="hair: ${character.hair}; clothing: ${character.clothing}"
        idle-animation></a-entity>
      <a-entity id="rig" position="${SPAWN.x} 0 ${SPAWN.z}" wasd-controls="acceleration: 25" walk-limiter>
        <a-entity camera look-controls position="0 1.6 0"></a-entity>
      </a-entity>
    </a-scene>`;
  container.appendChild(scene);
  return { destroy: () => scene.remove() };
}
