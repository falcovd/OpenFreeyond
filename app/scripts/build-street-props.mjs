/* global Buffer, URL, console */
// Builds public/assets/models/street/{car-1,car-2,car-3,lamp}.glb from Quaternius models (CC0, via
// Poly Pizza): Cars Bundle (Normal Car 1 = sedan, Normal Car 2 = hatchback, SUV) and Street Light.
// Reads the raw files from the git-ignored source-assets/street-dl2 folder. The source files are treated
// as untrusted data: they are only parsed (never executed) and rewritten at the glTF level, so the models
// stay what Quaternius made, apart from one wrapping node (turn, scale, stand on y=0, centre) and, for
// the hatchback, a new body colour (the original is light blue, like the sedan).
// Cars: the models face +z; the wrapper turns them to face +x. The lamp: its arm already points to +z
// (over the road), so it is not turned. The models have no textures (flat material colours), no logos
// and no number plate text.
// Run: node scripts/build-street-props.mjs
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const SRC = new URL('../source-assets/street-dl2/', import.meta.url);
const OUT = new URL('../public/assets/models/street/', import.meta.url);
const CARS = 'pp/';

// scale: metres per source unit. recolour: base colour override for one named material.
const JOBS = [
  {
    out: 'car-1.glb',
    src: CARS + 'Cz6yDaUcM9.glb',
    turn: Math.PI / 2,
    scale: 1.05,
  },
  {
    out: 'car-2.glb',
    src: CARS + 'unqqkULtRU.glb',
    turn: Math.PI / 2,
    scale: 1.2,
    recolour: { LightBlue: [0.55, 0.22, 0.17, 1] },
  },
  {
    out: 'car-3.glb',
    src: CARS + 'xsMtZhBkxL.glb',
    turn: Math.PI / 2,
    scale: 1,
  },
  { out: 'lamp.glb', src: 'lamps/nFwrlcLvM5.glb', turn: 0, height: 4.5 },
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

// 4x4 column-major matrix of a node (translation, rotation quaternion, scale).
function nodeMatrix(n) {
  if (n.matrix) throw new Error('unexpected node matrix');
  const [x, y, z, w] = n.rotation ?? [0, 0, 0, 1];
  const [sx, sy, sz] = n.scale ?? [1, 1, 1];
  const [tx, ty, tz] = n.translation ?? [0, 0, 0];
  return [
    (1 - 2 * (y * y + z * z)) * sx,
    2 * (x * y + z * w) * sx,
    2 * (x * z - y * w) * sx,
    0,
    2 * (x * y - z * w) * sy,
    (1 - 2 * (x * x + z * z)) * sy,
    2 * (y * z + x * w) * sy,
    0,
    2 * (x * z + y * w) * sz,
    2 * (y * z - x * w) * sz,
    (1 - 2 * (x * x + y * y)) * sz,
    0,
    tx,
    ty,
    tz,
    1,
  ];
}
function mul(a, b) {
  const r = new Array(16).fill(0);
  for (let c = 0; c < 4; c++)
    for (let rr = 0; rr < 4; rr++)
      for (let k = 0; k < 4; k++) r[c * 4 + rr] += a[k * 4 + rr] * b[c * 4 + k];
  return r;
}

// Axis-aligned box of everything reachable from the scene, with the node transforms applied.
function sceneBox(json) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  const walk = (i, parent) => {
    const n = json.nodes[i];
    const m = mul(parent, nodeMatrix(n));
    if (n.mesh !== undefined)
      for (const p of json.meshes[n.mesh].primitives) {
        const a = json.accessors[p.attributes.POSITION];
        for (let corner = 0; corner < 8; corner++) {
          const v = [0, 1, 2].map((k) =>
            (corner >> k) & 1 ? a.max[k] : a.min[k],
          );
          for (let k = 0; k < 3; k++) {
            const t =
              m[12 + k] + m[k] * v[0] + m[4 + k] * v[1] + m[8 + k] * v[2];
            min[k] = Math.min(min[k], t);
            max[k] = Math.max(max[k], t);
          }
        }
      }
    for (const c of n.children ?? []) walk(c, m);
  };
  const I = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  for (const i of json.scenes[json.scene ?? 0].nodes) walk(i, I);
  return { min, max };
}

async function build(job) {
  const srcUrl = new URL(job.src, SRC);
  const { json, bin } = readGlb(srcUrl);
  const box = sceneBox(json);
  const size = box.max.map((v, k) => v - box.min[k]);
  const scale = job.height ? job.height / size[1] : job.scale;
  for (const m of json.materials ?? []) {
    const c = job.recolour?.[m.name];
    if (c) m.pbrMetallicRoughness.baseColorFactor = c;
  }

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
    copyright: 'Quaternius (quaternius.com), CC0',
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
