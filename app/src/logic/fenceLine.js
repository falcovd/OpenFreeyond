// Pure: the fence along the edge of the place, as solids and post positions. No three, no DOM.
// The outer face of every piece is on the edge; the pieces touch end to end; the front is split by the gate.
const POST = 0.12;

// options.skip: edges to leave out ('left', 'right', 'back'), for sides shared with a neighbour. The back and
// street pieces then run to the plot edge. options.gateSide: the street edge, 'maxZ' (default) or 'minZ'.
export function fenceLine(
  bounds,
  { t, h, color },
  gate,
  { skip = [], gateSide = 'maxZ' } = {},
) {
  const { minX, maxX, minZ, maxZ } = bounds;
  const cz = (minZ + maxZ) / 2;
  const innerLo = skip.includes('left') ? minX : minX + t;
  const innerHi = skip.includes('right') ? maxX : maxX - t;
  const frontZ = maxZ - t / 2;
  const gl = gate.x - gate.w / 2;
  const gh = gate.x + gate.w / 2;
  const piece = (id, x, z, w, d, kind = 'fence') => ({
    id,
    kind,
    x,
    z,
    w,
    d,
    h,
    color,
  });
  const pieces = [
    piece('fence-left', minX + t / 2, cz, t, maxZ - minZ),
    piece('fence-right', maxX - t / 2, cz, t, maxZ - minZ),
    piece(
      'fence-back',
      (innerLo + innerHi) / 2,
      minZ + t / 2,
      innerHi - innerLo,
      t,
    ),
    piece('fence-front-left', (innerLo + gl) / 2, frontZ, gl - innerLo, t),
    piece('gate', gate.x, frontZ, gate.w, t, 'gate'),
    piece('fence-front-right', (gh + innerHi) / 2, frontZ, innerHi - gh, t),
  ]
    .filter((p) => !(p.id === 'fence-left' && skip.includes('left')))
    .filter((p) => !(p.id === 'fence-right' && skip.includes('right')))
    .filter((p) => !(p.id === 'fence-back' && skip.includes('back')));
  if (gateSide !== 'minZ') return pieces;
  return pieces.map((p) => ({ ...p, z: minZ + maxZ - p.z }));
}

// Post centres along the long side of a piece, relative to the piece centre. The first and last post are
// inset by half a post so that the end faces line up with the piece ends; the gap is at most 1 m.
export function fencePosts(piece) {
  const length = Math.max(piece.w, piece.d);
  const span = length - POST;
  const gaps = Math.max(1, Math.ceil(span - 1e-9));
  return Array.from(
    { length: gaps + 1 },
    (_, i) => -span / 2 + (i * span) / gaps,
  );
}
