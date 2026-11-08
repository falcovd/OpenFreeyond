// A-Frame 1.6 adds `a-fullscreen` to <html> when a non-embedded scene connects
// (a-scene.js addFullScreenStyles). Its CSS then makes <html> position: fixed and
// <body> overflow: hidden; height: 100%. Nothing removes the class when the scene
// is detached, so the start screen and intake form could not scroll afterwards.
// This file must not import aframe so it can be unit tested without WebGL.
const AFRAME_PAGE_CLASSES = ['a-fullscreen'];

export function releasePage(documentElement) {
  documentElement.classList.remove(...AFRAME_PAGE_CLASSES);
}
