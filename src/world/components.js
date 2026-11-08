import { resolveMove } from '../logic/collision.js';
import { applyColours } from '../logic/colours.js';
import { SOLIDS, BOUNDS } from './layout.js';

const MAX_STEP = 0.15; // metres

// Stops the camera rig from walking through solid objects or out of the place (FR-2).
AFRAME.registerComponent('walk-limiter', {
  init() {
    const p = this.el.object3D.position;
    this.last = { x: p.x, z: p.z };
  },
  tick() {
    const p = this.el.object3D.position;
    // Move in small steps: a big frame step could jump over a thin fence,
    // because resolveMove only checks where each step ends.
    const dist = Math.hypot(p.x - this.last.x, p.z - this.last.z);
    const steps = Math.max(1, Math.ceil(dist / MAX_STEP));
    let next = this.last;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const target = {
        x: this.last.x + (p.x - this.last.x) * t,
        z: this.last.z + (p.z - this.last.z) * t,
      };
      next = resolveMove(next, target, SOLIDS, BOUNDS);
    }
    p.x = next.x;
    p.z = next.z;
    this.last = next;
  },
});

// Sets the hair and clothing materials of the loaded model (FR-7).
AFRAME.registerComponent('character-colours', {
  schema: { hair: { type: 'string' }, clothing: { type: 'string' } },
  init() {
    this.el.addEventListener('model-loaded', () => this.paint());
  },
  update() {
    this.paint();
  },
  paint() {
    const mesh = this.el.getObject3D('mesh');
    if (mesh) applyColours(mesh, this.data);
  },
});

// Plays the animation clip named "Idle" in a loop (FR-6). The model holds only that clip.
AFRAME.registerComponent('idle-animation', {
  init() {
    this.mixer = null;
    this.el.addEventListener('model-loaded', () => {
      const mesh = this.el.getObject3D('mesh');
      const clip =
        mesh &&
        mesh.animations &&
        mesh.animations.find((c) => c.name === 'Idle');
      if (!clip) return;
      this.mixer = new AFRAME.THREE.AnimationMixer(mesh);
      this.mixer.clipAction(clip).play();
    });
  },
  tick(time, delta) {
    if (this.mixer) this.mixer.update(delta / 1000);
  },
  remove() {
    if (this.mixer) this.mixer.stopAllAction();
  },
});

// Calls the update functions of trees and clouds every frame (FR-14).
// scene.js sets `worldUpdaters` on the element.
AFRAME.registerComponent('world-motion', {
  tick(time) {
    const seconds = time / 1000;
    for (const update of this.el.worldUpdaters ?? []) update(seconds);
  },
});
