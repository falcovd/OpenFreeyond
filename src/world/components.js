import { resolveMove } from '../logic/collision.js';
import { applyColours } from '../logic/colours.js';
import {
  SOLIDS,
  BOUNDS,
  CHARACTER_SPOT,
  resetCharacterSolid,
} from './layout.js';
import { initialState, stepWander } from '../logic/wander.js';
import { attachMouth } from './builders/mouth.js';

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

// The model has no mouth, so one is drawn on its head bone when the model is loaded.
AFRAME.registerComponent('character-mouth', {
  init() {
    this.el.addEventListener('model-loaded', () => this.attach());
    this.attach();
  },
  attach() {
    const mesh = this.el.getObject3D('mesh');
    if (mesh) attachMouth(AFRAME.THREE, mesh);
  },
});

const FADE_SECONDS = 0.25; // cross-fade between Idle and Walk
const MAX_STEP_SECONDS = 0.1; // a slow frame or a hidden tab must not make him jump
const START_HEADING = (-30 * Math.PI) / 180; // as in the markup of scene.js

// Plays the clip for what the character is doing: "Idle" standing, "Walk" walking (FR-6).
// character-wander says which, with a 'character-state' event. The model holds only those two clips.
AFRAME.registerComponent('character-animation', {
  init() {
    this.mixer = null;
    this.actions = {};
    this.current = null;
    this.wanted = 'Idle';
    this.onModel = () => this.setup();
    this.onState = (event) => {
      this.wanted = event.detail.moving ? 'Walk' : 'Idle';
      this.play(this.wanted);
    };
    this.el.addEventListener('model-loaded', this.onModel);
    this.el.addEventListener('character-state', this.onState);
  },
  setup() {
    const mesh = this.el.getObject3D('mesh');
    if (!mesh || !mesh.animations) return;
    this.mixer = new AFRAME.THREE.AnimationMixer(mesh);
    for (const name of ['Idle', 'Walk']) {
      const clip = mesh.animations.find((c) => c.name === name);
      if (clip) this.actions[name] = this.mixer.clipAction(clip);
    }
    this.play(this.wanted, 0);
  },
  play(name, fade = FADE_SECONDS) {
    const next = this.actions[name];
    if (!next || next === this.current) return;
    next.reset().setEffectiveWeight(1).play();
    if (this.current) this.current.crossFadeTo(next, fade, false);
    this.current = next;
  },
  tick(time, delta) {
    if (this.mixer) this.mixer.update(delta / 1000);
  },
  remove() {
    this.el.removeEventListener('model-loaded', this.onModel);
    this.el.removeEventListener('character-state', this.onState);
    if (this.mixer) this.mixer.stopAllAction();
  },
});

// Lets the character wander through the garden (see src/logic/wander.js). It starts when the
// model has loaded: with the plain figure there is nothing to move, and the figure stays put.
// His solid in SOLIDS moves with him, so the walk-limiter stops the player at his current spot.
AFRAME.registerComponent('character-wander', {
  init() {
    this.active = false;
    this.moving = false;
    this.player = null;
    this.solids = SOLIDS.filter((s) => s.id !== 'character');
    this.body = SOLIDS.find((s) => s.id === 'character');
    this.state = initialState(
      CHARACTER_SPOT.x,
      CHARACTER_SPOT.z,
      START_HEADING,
    );
    this.onModel = () => {
      this.active = true;
    };
    this.el.addEventListener('model-loaded', this.onModel);
  },
  tick(time, delta) {
    if (!this.active) return;
    this.player ??= this.el.sceneEl.querySelector('[camera]');
    if (!this.player) return;
    const seconds = Math.min(delta / 1000, MAX_STEP_SECONDS);
    const p = this.player.object3D.position;
    this.state = stepWander(this.state, seconds, {
      solids: this.solids,
      bounds: BOUNDS,
      player: { x: p.x, z: p.z },
      rng: Math.random,
    });
    this.el.object3D.position.set(this.state.x, 0, this.state.z);
    this.el.object3D.rotation.y = this.state.heading;
    if (this.body) {
      this.body.x = this.state.x;
      this.body.z = this.state.z;
    }
    if (this.state.moving !== this.moving) {
      this.moving = this.state.moving;
      this.el.emit('character-state', { moving: this.moving });
    }
  },
  remove() {
    this.el.removeEventListener('model-loaded', this.onModel);
    resetCharacterSolid();
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
