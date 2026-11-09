import { resolveMove } from '../logic/collision.js';
import { applyColours } from '../logic/colours.js';
import {
  createDoor,
  stepDoor,
  clickDoor,
  doorAngle,
  isAtRest,
  isFullyOpen,
  inDoorway,
  distanceToDoor,
  hintVisible,
  stepAsideVisible,
  CLICK_RANGE,
} from '../logic/door.js';
import { isClick } from '../logic/click.js';
import {
  SOLIDS,
  BOUNDS,
  CHARACTER_SPOT,
  DOOR,
  HINGE,
  OPENING,
  SWING_SPACE,
  doorSolids,
  resetCharacterSolid,
  resetHouse,
  wanderSolids,
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

// Plays the clip for what the character is doing: "Idle" standing, "Walk" walking (FR-6), and
// "Wave" once when a person comes close. character-wander says which, with 'character-state'
// and 'character-wave' events. The model holds only those three clips.
AFRAME.registerComponent('character-animation', {
  init() {
    this.mixer = null;
    this.actions = {};
    this.current = null;
    this.wanted = 'Idle';
    this.onModel = () => this.setup();
    this.onState = (event) => {
      this.wanted = event.detail.moving ? 'Walk' : 'Idle';
      // Standing is what he does while he waves: let the wave finish (it then goes to `wanted`).
      // Walking again cuts it short.
      const waving = this.current && this.current === this.actions.Wave;
      if (waving && this.wanted === 'Idle') return;
      this.playClip(this.wanted);
    };
    this.onWave = () => this.playClip('Wave');
    this.el.addEventListener('model-loaded', this.onModel);
    this.el.addEventListener('character-state', this.onState);
    this.el.addEventListener('character-wave', this.onWave);
  },
  setup() {
    const mesh = this.el.getObject3D('mesh');
    if (!mesh || !mesh.animations) return;
    this.mixer = new AFRAME.THREE.AnimationMixer(mesh);
    for (const name of ['Idle', 'Walk', 'Wave']) {
      const clip = mesh.animations.find((c) => c.name === name);
      if (clip) this.actions[name] = this.mixer.clipAction(clip);
    }
    // The wave plays once and holds its last pose until the clip below takes over.
    const wave = this.actions.Wave;
    if (wave) {
      wave.setLoop(AFRAME.THREE.LoopOnce, 1);
      wave.clampWhenFinished = true;
      // When the wave ends he goes back to what he is doing (standing, or walking).
      this.mixer.addEventListener('finished', (event) => {
        if (event.action === wave) this.playClip(this.wanted);
      });
    }
    this.playClip(this.wanted, 0);
  },
  // Not called `play`: A-Frame replaces a component's `play` with a wrapper that drops its arguments.
  playClip(name, fade = FADE_SECONDS) {
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
    this.el.removeEventListener('character-wave', this.onWave);
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
    this.solids = wanderSolids();
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
    if (this.state.waveNow) this.el.emit('character-wave');
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

const DOOR_BOX = { hinge: HINGE, w: DOOR.w, h: DOOR.h, t: 0.05 };
const CHECK_SECONDS = 0.1; // how often the view checks run
// Points on the door (in the door's own space) that are tried to see whether any part of it is in view.
const DOOR_SPOTS = [
  [0.6, 1.05],
  [0.15, 0.3],
  [1.05, 0.3],
  [0.15, 1.8],
  [1.05, 1.8],
];

// The front door: click to open and close, hint and step-aside events. A fresh component starts with the door
// closed on every visit, and nothing is stored (FR-6, NFR-3). scene.js calls attach() once the house is built.
AFRAME.registerComponent('house-door', {
  init() {
    this.door = createDoor();
    this.node = null;
    this.pickables = [];
    this.player = null;
    this.down = null;
    this.requested = false; // a click was ignored because someone was in the doorway
    this.hint = false;
    this.stepAside = false;
    this.sinceCheck = 0;
    this.raycaster = new AFRAME.THREE.Raycaster();
    this.canvas = null;
  },
  attach({ node, pickables }) {
    this.node = node;
    this.pickables = pickables;
    this.player = this.el.sceneEl.querySelector('[camera]');
    this.canvas = this.el.sceneEl.canvas;
    this.onDown = (e) => {
      if (e.button === 0) this.down = { x: e.clientX, y: e.clientY };
    };
    this.onUp = (e) => {
      if (e.button !== 0) return;
      const down = this.down;
      this.down = null;
      if (isClick(down, { x: e.clientX, y: e.clientY })) this.click(e);
    };
    this.canvas?.addEventListener('pointerdown', this.onDown);
    this.canvas?.addEventListener('pointerup', this.onUp);
  },
  person() {
    const p = this.player.object3D.position;
    return { x: p.x, y: p.y, z: p.z };
  },
  blocked(person) {
    return inDoorway(person, [OPENING, SWING_SPACE]);
  },
  isDoorHit(object) {
    for (let o = object; o; o = o.parent) if (o === this.node) return true;
    return false;
  },
  click(e) {
    if (!this.node || !this.player) return;
    const THREE = AFRAME.THREE;
    const rect = this.canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(ndc, this.el.sceneEl.camera);
    const hit = this.raycaster.intersectObjects(this.pickables, true)[0];
    if (!hit || !this.isDoorHit(hit.object)) return; // a wall or an object is in the way (AC-1.4)
    const person = this.person();
    if (distanceToDoor(person, DOOR_BOX, doorAngle(this.door)) > CLICK_RANGE)
      return; // FR-2
    const result = clickDoor(this.door, { inDoorway: this.blocked(person) });
    this.door = result.door;
    if (result.outcome === 'step-aside') this.requested = true;
  },
  // True when some part of the door can be seen: on screen and the nearest thing along the ray is the door.
  doorInView() {
    const THREE = AFRAME.THREE;
    const camera = this.el.sceneEl.camera;
    const from = camera.getWorldPosition(new THREE.Vector3());
    this.node.updateWorldMatrix(true, false);
    this.raycaster.camera = camera;
    for (const [x, y] of DOOR_SPOTS) {
      const point = this.node.localToWorld(new THREE.Vector3(x, y, 0));
      const ndc = point.clone().project(camera);
      if (Math.abs(ndc.x) > 1 || Math.abs(ndc.y) > 1 || ndc.z > 1) continue;
      const dir = point.clone().sub(from);
      const dist = dir.length();
      this.raycaster.set(from, dir.normalize());
      this.raycaster.far = dist + 0.05;
      const hit = this.raycaster.intersectObjects(this.pickables, true)[0];
      this.raycaster.far = Infinity;
      if (hit && this.isDoorHit(hit.object)) return true;
    }
    return false;
  },
  tick(time, delta) {
    if (!this.node || !this.player) return;
    this.door = stepDoor(this.door, Math.min(delta / 1000, 0.1));
    this.node.rotation.y = doorAngle(this.door);
    const { door, swing } = doorSolids();
    door.off = isFullyOpen(this.door); // only a fully open door lets a person through (FR-4)
    swing.off = isAtRest(this.door);
    this.sinceCheck += delta / 1000;
    if (this.sinceCheck < CHECK_SECONDS) return;
    this.sinceCheck = 0;
    const person = this.person();
    const blocked = this.blocked(person);
    const distance = distanceToDoor(person, DOOR_BOX, doorAngle(this.door));
    const inView =
      isAtRest(this.door) && distance <= CLICK_RANGE && this.doorInView();
    const hint = hintVisible({
      door: this.door,
      distance,
      inView,
      inDoorway: blocked,
    });
    const stepAside = stepAsideVisible({
      requested: this.requested,
      inDoorway: blocked,
    });
    if (!blocked) this.requested = false;
    if (hint !== this.hint) this.el.emit('door-hint', { visible: hint });
    if (stepAside !== this.stepAside)
      this.el.emit('door-step-aside', { visible: stepAside });
    this.hint = hint;
    this.stepAside = stepAside;
  },
  remove() {
    this.canvas?.removeEventListener('pointerdown', this.onDown);
    this.canvas?.removeEventListener('pointerup', this.onUp);
    resetHouse();
  },
});
