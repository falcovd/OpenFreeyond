import { box, surface } from './common.js';

// A flower bed: soil with a random-looking mix of daisies, tulips and lavender-like spikes,
// each on its own leaning stem, with leaves and small tufts of foliage between them.
// The layout comes from a seed made of the bed's id, so a bed looks the same on every visit
// and two beds differ. A flower bed is never a solid (AC-4.7).
// Every part is one InstancedMesh, so a bed costs about eight draw calls however many flowers it has.
// No import of aframe: THREE is passed in.

const WOOD_TILE = 1; // metres of board that one copy of the wood texture covers
const SOIL_TOP = 0.12;
const SOIL_COLOUR = '#5a3d28'; // when the soil texture is missing
const SOIL_TILE = 0.6; // metres of soil that one copy of the texture covers
const BORDER = { thickness: 0.07, height: 0.19, colour: '#74492a' }; // wooden boards, like the fence
const SPACING = 0.2; // spacing of the jittered grid the flowers grow on
const MARGIN = 0.16; // flowers stay this far from the edge of the bed, so leaning stems stay inside it
const JITTER = 0.07;

const DAISY_COLOURS = ['#ffffff', '#fff3c4', '#ffd6e0'];
const TULIP_COLOURS = ['#e8456b', '#f08a4b', '#f2c14e', '#c85fb0', '#fbe9e7'];
const SPIKE_COLOURS = ['#8d6fd1', '#6f7fe0', '#b58be0'];
const LEAF_COLOURS = ['#4f7a3a', '#5d8a42', '#3f6a30'];

// Small seeded random numbers (mulberry32): the same seed always gives the same row of numbers.
function seededRandom(text) {
  let h = 2166136261;
  for (const c of text) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// One part of the bed: a shape drawn many times, each with its own matrix and colour.
class Part {
  constructor(THREE, geometry, material, name) {
    this.THREE = THREE;
    this.geometry = geometry;
    this.material = material;
    this.name = name;
    this.items = [];
  }
  add(matrix, colour) {
    this.items.push({ matrix, colour: new this.THREE.Color(colour) });
  }
  build() {
    if (this.items.length === 0) return null;
    const mesh = new this.THREE.InstancedMesh(
      this.geometry,
      this.material,
      this.items.length,
    );
    this.items.forEach((item, i) => {
      mesh.setMatrixAt(i, item.matrix);
      mesh.setColorAt(i, item.colour);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
    mesh.userData.part = this.name;
    return mesh;
  }
}

// Soil and border use the 'soil' and 'wood' textures, and plain colours when they did not load (FR-16).
export function buildFlowerBed(THREE, assets, bed) {
  const random = seededRandom(bed.id);
  const between = (lo, hi) => lo + random() * (hi - lo);
  const pick = (list) => list[Math.floor(random() * list.length)];

  const g = new THREE.Group();
  g.position.set(bed.x, 0, bed.z);
  g.userData.kind = 'flower-bed';
  const soil = box(
    THREE,
    bed.w,
    SOIL_TOP,
    bed.d,
    surface(THREE, assets, 'soil', SOIL_COLOUR, {
      repeat: [bed.w / SOIL_TILE, bed.d / SOIL_TILE],
    }),
    0,
    SOIL_TOP / 2,
    0,
  );
  soil.userData.part = 'soil';
  g.add(soil);

  // A low wooden frame around the soil, so the bed does not look like soil lying on the grass.
  // The boards sit just outside the bed, and the soil is a little lower than their top edge.
  const t = BORDER.thickness;
  const boards = [
    [bed.w + 2 * t, t, 0, (bed.d + t) / 2], // front
    [bed.w + 2 * t, t, 0, -(bed.d + t) / 2], // back
    [t, bed.d, (bed.w + t) / 2, 0], // right
    [t, bed.d, -(bed.w + t) / 2, 0], // left
  ];
  for (const [w, d, x, z] of boards) {
    const board = box(
      THREE,
      w,
      BORDER.height,
      d,
      surface(THREE, assets, 'wood', BORDER.colour, {
        repeat: [Math.max(w, d) / WOOD_TILE, BORDER.height / WOOD_TILE],
      }),
      x,
      BORDER.height / 2,
      z,
    );
    board.userData.part = 'border';
    g.add(board);
  }

  const material = (side = THREE.FrontSide) =>
    new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, side });
  const flat = (geometry, x, y, z) => geometry.scale(x, y, z);

  const stems = new Part(
    THREE,
    new THREE.CylinderGeometry(0.007, 0.01, 1, 5),
    material(),
    'stems',
  );
  const leaves = new Part(
    THREE,
    flat(new THREE.SphereGeometry(0.05, 6, 4), 1, 0.15, 0.4),
    material(THREE.DoubleSide),
    'leaves',
  );
  // Foliage: low, soft mounds of leaves.
  const foliage = new Part(
    THREE,
    flat(new THREE.SphereGeometry(0.06, 6, 4), 1, 0.65, 1),
    material(),
    'foliage',
  );
  const petals = new Part(
    THREE,
    flat(new THREE.SphereGeometry(0.036, 6, 4), 1, 0.25, 0.5),
    material(THREE.DoubleSide),
    'daisy-petals',
  );
  const centres = new Part(
    THREE,
    new THREE.SphereGeometry(0.026, 6, 4),
    material(),
    'daisy-centres',
  );
  // A cup: the lower part of a sphere, open at the top, taller than it is wide.
  const cup = new THREE.SphereGeometry(
    0.045,
    8,
    6,
    0,
    Math.PI * 2,
    Math.PI * 0.38,
    Math.PI * 0.62,
  );
  cup.scale(1, 1.5, 1);
  cup.translate(0, 0.05, 0);
  const tulips = new Part(THREE, cup, material(THREE.DoubleSide), 'tulips');
  const buds = new Part(
    THREE,
    new THREE.SphereGeometry(0.014, 5, 4),
    material(),
    'spike-buds',
  );

  const up = new THREE.Vector3(0, 1, 0);
  const matrix = (position, quaternion, scale = [1, 1, 1]) =>
    new THREE.Matrix4().compose(
      position,
      quaternion,
      new THREE.Vector3(...scale),
    );

  const cols = Math.max(1, Math.floor((bed.w - 2 * MARGIN) / SPACING) + 1);
  const rows = Math.max(1, Math.floor((bed.d - 2 * MARGIN) / SPACING) + 1);
  const stepX = cols > 1 ? (bed.w - 2 * MARGIN) / (cols - 1) : 0;
  const stepZ = rows > 1 ? (bed.d - 2 * MARGIN) / (rows - 1) : 0;
  const clamp = (v, half) =>
    Math.max(-half + MARGIN, Math.min(half - MARGIN, v));

  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      // Now and then a gap, so the bed does not look like a grid.
      if (random() < 0.08) continue;
      const x = clamp(
        -bed.w / 2 + MARGIN + i * stepX + between(-JITTER, JITTER),
        bed.w / 2,
      );
      const z = clamp(
        -bed.d / 2 + MARGIN + j * stepZ + between(-JITTER, JITTER),
        bed.d / 2,
      );
      const base = new THREE.Vector3(x, SOIL_TOP, z);

      const kind = random();
      const height =
        kind < 0.35
          ? between(0.16, 0.3) // daisy
          : kind < 0.75
            ? between(0.2, 0.36) // tulip
            : between(0.26, 0.44); // spike

      // The stem leans a little in a random direction.
      const lean = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(
          between(-0.14, 0.14),
          between(0, Math.PI * 2),
          between(-0.14, 0.14),
          'YXZ',
        ),
      );
      const dir = up.clone().applyQuaternion(lean);
      const tip = base.clone().addScaledVector(dir, height);
      stems.add(
        matrix(base.clone().addScaledVector(dir, height / 2), lean, [
          1,
          height,
          1,
        ]),
        pick(LEAF_COLOURS),
      );

      // Two leaves low on the stem.
      for (let k = 0; k < 2; k++) {
        const angle = random() * Math.PI * 2;
        const q = new THREE.Quaternion()
          .setFromEuler(new THREE.Euler(0, angle, 0.45))
          .premultiply(lean);
        const out = new THREE.Vector3(
          Math.cos(angle),
          0,
          -Math.sin(angle),
        ).multiplyScalar(0.045);
        const at = base
          .clone()
          .addScaledVector(dir, height * between(0.2, 0.45))
          .add(out);
        const size = between(0.8, 1.3);
        leaves.add(matrix(at, q, [size, size, size]), pick(LEAF_COLOURS));
      }

      if (kind < 0.35) {
        // Daisy: eight flat petals around a yellow centre, the face tilted a little toward the viewer.
        const face = lean
          .clone()
          .multiply(
            new THREE.Quaternion().setFromEuler(
              new THREE.Euler(between(0.2, 0.6), 0, 0),
            ),
          );
        const colour = pick(DAISY_COLOURS);
        for (let k = 0; k < 8; k++) {
          const a = (k / 8) * Math.PI * 2;
          const local = new THREE.Vector3(Math.cos(a), 0, -Math.sin(a));
          const at = tip
            .clone()
            .addScaledVector(local.clone().applyQuaternion(face), 0.05);
          const q = face
            .clone()
            .multiply(
              new THREE.Quaternion().setFromEuler(new THREE.Euler(0, a, 0)),
            );
          petals.add(matrix(at, q), colour);
        }
        centres.add(matrix(tip.clone(), face), '#f2b705');
      } else if (kind < 0.75) {
        tulips.add(matrix(tip.clone(), lean), pick(TULIP_COLOURS));
      } else {
        // Spike: a column of small buds along the top of the stem.
        const colour = pick(SPIKE_COLOURS);
        for (let k = 0; k < 6; k++) {
          const side = new THREE.Vector3(
            k % 2 ? 0.012 : -0.012,
            0,
            between(-0.01, 0.01),
          );
          const at = tip
            .clone()
            .addScaledVector(dir, -0.06 + k * 0.02)
            .add(side.applyQuaternion(lean));
          buds.add(matrix(at, lean), colour);
        }
      }
    }
  }

  // Tufts of foliage fill the gaps between the flowers.
  const tufts = Math.round(cols * rows * 0.9);
  for (let n = 0; n < tufts; n++) {
    const s = between(0.7, 1.3);
    const at = new THREE.Vector3(
      between(-bed.w / 2 + MARGIN, bed.w / 2 - MARGIN),
      SOIL_TOP + 0.02 * s,
      between(-bed.d / 2 + MARGIN, bed.d / 2 - MARGIN),
    );
    const q = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(0, random() * Math.PI * 2, 0),
    );
    foliage.add(matrix(at, q, [s, s, s]), pick(LEAF_COLOURS));
  }

  for (const part of [stems, leaves, foliage, petals, centres, tulips, buds]) {
    const mesh = part.build();
    if (mesh) g.add(mesh);
  }
  return g;
}
