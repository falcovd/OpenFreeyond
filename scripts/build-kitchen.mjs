/* global Buffer, URL, console */
// Builds public/assets/interior/kitchen.glb: one row of Kenney Furniture Kit (CC0) kitchen pieces,
// at the kit's own scale, front facing +z. Reads the raw pack from the git-ignored /assets folder.
// Run: node scripts/build-kitchen.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

// GLTFExporter wants a browser FileReader.
globalThis.FileReader = class {
  readAsArrayBuffer(b) {
    b.arrayBuffer().then((r) => {
      this.result = r;
      this.onloadend?.();
    });
  }
  readAsDataURL(b) {
    b.arrayBuffer().then((r) => {
      this.result =
        'data:application/octet-stream;base64,' +
        Buffer.from(r).toString('base64');
      this.onloadend?.();
    });
  }
};

const PACK = new URL(
  '../assets/kenney-furniture-kit/Models/GLTF format/',
  import.meta.url,
);
const PIECES = [
  'kitchenCabinetDrawer',
  'kitchenSink',
  'kitchenCabinet',
  'kitchenStove',
  'kitchenCabinet',
];
const PIECE_WIDTH = 0.43;

const loader = new GLTFLoader();
const parse = (name) => {
  const b = readFileSync(new URL(`${name}.glb`, PACK));
  const ab = b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
  return new Promise((res, rej) => loader.parse(ab, '', res, rej));
};

const root = new THREE.Group();
root.name = 'kitchen';
for (const [i, name] of PIECES.entries()) {
  const { scene } = await parse(name);
  scene.position.x = i * PIECE_WIDTH;
  root.add(scene);
}
// The pieces start at their front-left corner: centre the row on x and z.
root.updateMatrixWorld(true);
const box = new THREE.Box3().setFromObject(root);
const c = box.getCenter(new THREE.Vector3());
const wrap = new THREE.Group();
root.position.set(-c.x, -box.min.y, -c.z);
wrap.add(root);

const glb = await new Promise((resolve, reject) =>
  new GLTFExporter().parse(wrap, resolve, reject, { binary: true, trs: true }),
);
const out = new URL('../public/assets/interior/kitchen.glb', import.meta.url);
writeFileSync(out, Buffer.from(glb));
console.log(`kitchen.glb written, ${glb.byteLength} bytes`);
