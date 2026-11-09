/* global Buffer, URL, console */
// Builds public/assets/models/street/{car-1,car-2,car-3,lamp}.glb from Kenney packs (CC0): Car Kit
// (sedan, hatchback-sports, suv) and City Kit Roads (light-curved). Reads the raw packs from the
// git-ignored source-assets/street-dl folder. The source files are treated as untrusted data: they are
// only parsed (never executed) and rewritten at the glTF level, so the models stay byte-for-byte what
// Kenney made, apart from one wrapping node (turn, scale, stand on y=0, centre) and the colour palette
// image, which moves from an external file into the GLB.
// Cars: Kenney cars face +z; the wrapper turns them to face +x. The lamp: its arm points to -z; the
// wrapper turns it to point to +z (over the road).
// Run: node scripts/build-street-props.mjs
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const SRC = new URL('../source-assets/street-dl/', import.meta.url);
const OUT = new URL('../public/assets/models/street/', import.meta.url);
const CARS = 'kenney-car-kit/x/Models/GLB format/';
const ROADS = 'kenney-city-kit-roads/x/Models/GLB format/';

// scale: metres per Kenney unit (Kenney's cars are small and chunky; the layout sizes follow the result).
const JOBS = [
  { out: 'car-1.glb', src: CARS + 'sedan.glb', turn: Math.PI / 2, scale: 1.2 },
  {
    out: 'car-2.glb',
    src: CARS + 'hatchback-sports.glb',
    turn: Math.PI / 2,
    scale: 1.35,
  },
  { out: 'car-3.glb', src: CARS + 'suv.glb', turn: Math.PI / 2, scale: 1.25 },
  {
    out: 'lamp.glb',
    src: ROADS + 'light-curved.glb',
    turn: Math.PI,
    height: 4.5,
  },
];

function readGlb(file) {
  const b = readFileSync(file);
  if (b.readUInt32LE(0) !== 0x46546c67) throw new Error(`${file}: not a GLB`);
  const jl = b.readUInt32LE(12);
  const json = JSON.parse(b.subarray(20, 20 + jl).toString('utf8'));
  const bl = b.readUInt32LE(20 + jl);
  const bin = b.subarray(28 + jl, 28 + jl + bl);
  return { json, bin };
}

// Axis-aligned box of everything reachable from the scene (nodes here only translate).
function sceneBox(json) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  const walk = (i, off) => {
    const n = json.nodes[i];
    const t = n.translation ?? [0, 0, 0];
    if (n.rotation || n.scale || n.matrix)
      throw new Error('unexpected node transform');
    const o = off.map((v, k) => v + t[k]);
    if (n.mesh !== undefined)
      for (const p of json.meshes[n.mesh].primitives) {
        const a = json.accessors[p.attributes.POSITION];
        for (let k = 0; k < 3; k++) {
          min[k] = Math.min(min[k], a.min[k] + o[k]);
          max[k] = Math.max(max[k], a.max[k] + o[k]);
        }
      }
    for (const c of n.children ?? []) walk(c, o);
  };
  for (const i of json.scenes[json.scene ?? 0].nodes) walk(i, [0, 0, 0]);
  return { min, max };
}

async function build(job) {
  const srcUrl = new URL(job.src, SRC);
  const { json, bin } = readGlb(srcUrl);
  const box = sceneBox(json);
  const size = box.max.map((v, k) => v - box.min[k]);
  const scale = job.height ? job.height / size[1] : job.scale;

  // The colour palette image moves into the GLB.
  const parts = [bin];
  let length = bin.length;
  for (const img of json.images ?? []) {
    if (!img.uri || /^data:/.test(img.uri)) continue;
    const png = readFileSync(new URL(img.uri, srcUrl));
    if (png.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG');
    const pad = (4 - (length % 4)) % 4;
    if (pad) parts.push(Buffer.alloc(pad));
    length += pad;
    json.bufferViews.push({
      buffer: 0,
      byteOffset: length,
      byteLength: png.length,
    });
    img.bufferView = json.bufferViews.length - 1;
    img.mimeType = 'image/png';
    delete img.uri;
    parts.push(png);
    length += png.length;
  }
  const pad = (4 - (length % 4)) % 4;
  if (pad) parts.push(Buffer.alloc(pad));
  length += pad;
  json.buffers = [{ byteLength: length }];

  // One wrapper node: turn about y, scale, centre on x and z, stand on y = 0.
  const c = Math.cos(job.turn);
  const s = Math.sin(job.turn);
  const centre = [
    (box.min[0] + box.max[0]) / 2,
    box.min[1],
    (box.min[2] + box.max[2]) / 2,
  ];
  const turned = [
    c * centre[0] + s * centre[2],
    centre[1],
    -s * centre[0] + c * centre[2],
  ];
  const roots = json.scenes[json.scene ?? 0].nodes;
  json.nodes.push({
    name: job.out.replace('.glb', ''),
    rotation: [0, Math.sin(job.turn / 2), 0, Math.cos(job.turn / 2)],
    scale: [scale, scale, scale],
    translation: turned.map((v) => -v * scale),
    children: roots,
  });
  json.scenes[json.scene ?? 0].nodes = [json.nodes.length - 1];
  json.asset = {
    version: '2.0',
    generator: 'scripts/build-street-props.mjs',
    copyright: 'Kenney (www.kenney.nl), CC0',
  };

  const jbuf = Buffer.from(JSON.stringify(json));
  const jpad = (4 - (jbuf.length % 4)) % 4;
  const jchunk = Buffer.concat([jbuf, Buffer.alloc(jpad, 0x20)]);
  const bchunk = Buffer.concat(parts);
  const total = 12 + 8 + jchunk.length + 8 + bchunk.length;
  const head = Buffer.alloc(20);
  head.writeUInt32LE(0x46546c67, 0);
  head.writeUInt32LE(2, 4);
  head.writeUInt32LE(total, 8);
  head.writeUInt32LE(jchunk.length, 12);
  head.writeUInt32LE(0x4e4f534a, 16);
  const bhead = Buffer.alloc(8);
  bhead.writeUInt32LE(bchunk.length, 0);
  bhead.writeUInt32LE(0x004e4942, 4);
  writeFileSync(
    new URL(job.out, OUT),
    Buffer.concat([head, jchunk, bhead, bchunk]),
  );
  const after =
    job.turn === Math.PI / 2
      ? [size[2], size[1], size[0]]
      : [size[0], size[1], size[2]];
  console.log(
    `${job.out}: ${total} bytes, size after (x,y,z) ${after.map((v) => (v * scale).toFixed(2)).join(' x ')} m`,
  );
}

mkdirSync(OUT, { recursive: true });
for (const job of JOBS) await build(job);
