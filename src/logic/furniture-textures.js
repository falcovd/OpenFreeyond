// Pure helpers for giving the flat-colour furniture real materials (PO finding 4).
// The Kenney models point their UVs into a shared colour atlas, so a tiling texture needs UVs of its
// own: they are projected from the box side that each face looks at, in metres.

// Which material the parts of an item get. `texture` is a manifest id, `size` is the width of one
// repeat in metres, `gain` brightens a dark texture (a tint can only darken), `tint` is a colour
// that multiplies the texture ('kit' keeps the colour the kit gave the part). Parts that are not
// listed (metal, glass, the glowing lamp shades, the TV) keep their flat colour.
// The table and chairs use the pale cabinet wood, so they stand apart from the darker plank floor.
const CABINET = { texture: 'cabinet', size: 0.6, tint: '#ffffff', gain: 1.5 };
const WOOD = { ...CABINET, tint: '#fff0d8', gain: 2.3 };
const FABRIC = { texture: 'fabric', size: 0.8, tint: 'kit', gain: 5 };

export const FURNITURE_MATERIALS = {
  couch: { wood: WOOD, carpet: FABRIC },
  'dining-table': { wood: WOOD },
  'tv-cabinet': { wood: CABINET },
  kitchen: {
    wood: CABINET,
    woodDark: { ...CABINET, tint: '#c9b8a6' },
  },
};
// Every dining chair uses the same rule.
const CHAIR = { wood: WOOD };

export function materialSpec(itemId, materialName) {
  const table = itemId.startsWith('chair-')
    ? CHAIR
    : FURNITURE_MATERIALS[itemId];
  return table?.[materialName] ?? null;
}

// The TV body and stand are always dark (PO finding R-10), whatever the kit colours and the interior
// dimming: the kit makes them light grey and teal grey. A colour per material name, by item id.
export const DARK_FRAME = '#1a1a1d';
const FORCED_COLOURS = {
  tv: { metalDark: DARK_FRAME, metal: '#26262a' },
};

// The colour a part is forced to, or null when it keeps its kit colour.
export function forcedColour(itemId, materialName) {
  return FORCED_COLOURS[itemId]?.[materialName] ?? null;
}

// The texture ids the furniture can use, for the manifest and the tests.
export function furnitureTextureIds() {
  const ids = new Set();
  for (const t of [...Object.values(FURNITURE_MATERIALS), CHAIR])
    for (const spec of Object.values(t)) ids.add(spec.texture);
  return [...ids];
}

// The two UV numbers of one vertex: the face is seen along its dominant normal axis. `p` is the
// position and `n` the normal, both in metres in the model's own frame. `size` is metres per repeat.
export function boxUv(p, n, size) {
  const ax = Math.abs(n[0]);
  const ay = Math.abs(n[1]);
  const az = Math.abs(n[2]);
  if (ay >= ax && ay >= az) return [p[0] / size, p[2] / size];
  if (ax >= az) return [p[2] / size, p[1] / size];
  return [p[0] / size, p[1] / size];
}

// Fills a UV array (2 numbers per vertex) from flat position and normal arrays (3 per vertex).
export function boxProject(positions, normals, size) {
  const count = positions.length / 3;
  const uv = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) {
    const [u, v] = boxUv(
      [positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]],
      [normals[i * 3], normals[i * 3 + 1], normals[i * 3 + 2]],
      size,
    );
    uv[i * 2] = u;
    uv[i * 2 + 1] = v;
  }
  return uv;
}
