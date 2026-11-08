/* global process, console, Buffer */
// Converts an FBX character to a small GLB: metres, named animation clips only.
// Usage: node scripts/convert-character.mjs <input.fbx> <output.glb> [clipNames=Idle] [Material=#hex ...]
// clipNames is a comma-separated list, for example Idle,Walk.
// Extra Material=#hex arguments set the base colour of a material (for example LightBlue=#7ea6c9).
import fs from 'fs';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

const [input, output, clipList = 'Idle', ...overrides] = process.argv.slice(2);
if (!input || !output) {
  console.error(
    'Usage: node scripts/convert-character.mjs <input.fbx> <output.glb> [clipNames=Idle] [Material=#hex ...]\n  clipNames is a comma-separated list, for example Idle,Walk',
  );
  process.exit(1);
}

// GLTFExporter needs FileReader to pack binary output; Node has Blob but not FileReader.
globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buffer) => {
      this.result = buffer;
      this.onloadend?.();
    });
  }
  readAsDataURL(blob) {
    blob.arrayBuffer().then((buffer) => {
      this.result = `data:${blob.type};base64,${Buffer.from(buffer).toString('base64')}`;
      this.onloadend?.();
    });
  }
};

console.warn = () => {};
const data = fs.readFileSync(input);
const model = new FBXLoader().parse(
  data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength),
  '',
);

const clips = clipList.split(',').map((clipName) => {
  const clip = model.animations.find(
    (a) => a.name.split('|').pop() === clipName,
  );
  if (!clip) {
    console.error(
      `No clip named "${clipName}". Found: ${model.animations.map((a) => a.name).join(', ')}`,
    );
    process.exit(1);
  }
  clip.name = clipName;
  return clip;
});

// The FBX materials arrive fully transparent and glowing. Replace each with a plain opaque
// standard material that keeps the name and colour (names matter: the app recolours by name).
const seen = new Map();
model.traverse((node) => {
  if (!node.isMesh) return;
  const fix = (old) => {
    if (!seen.has(old.name)) {
      seen.set(
        old.name,
        new THREE.MeshStandardMaterial({
          name: old.name,
          color: old.color,
          roughness: 1,
          metalness: 0,
        }),
      );
    }
    return seen.get(old.name);
  };
  node.material = Array.isArray(node.material)
    ? node.material.map(fix)
    : fix(node.material);
});

for (const override of overrides) {
  const [name, hex] = override.split('=');
  if (!seen.has(name)) {
    console.error(
      `No material named "${name}". Found: ${[...seen.keys()].join(', ')}`,
    );
    process.exit(1);
  }
  seen.get(name).color.set(hex);
}

// FBX units are centimetres; glTF uses metres.
model.scale.setScalar(0.01);
model.updateMatrixWorld(true);

const exporter = new GLTFExporter();
const glb = await new Promise((resolve, reject) =>
  exporter.parse(model, resolve, reject, {
    binary: true,
    animations: clips,
    onlyVisible: false,
  }),
);
fs.writeFileSync(output, Buffer.from(glb));
console.log(
  `Wrote ${output} (${(glb.byteLength / 1024).toFixed(0)} KB), clips "${clipList}"`,
);
