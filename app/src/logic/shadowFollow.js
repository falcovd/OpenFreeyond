// Pure: where the sun's shadow box stands for a person. The box is a sphere of fixed radius around the
// person. Its centre is snapped to whole texels in the light's own axes, so shadows do not shimmer
// when the person walks or the sky turns. No three, no DOM.
// `dir` is the direction from the ground towards the sun (it need not be unit length).
export function shadowFollow({ person, dir, distance, texel }) {
  const len = Math.hypot(...dir);
  const d = dir.map((v) => v / len);
  // The light looks along -d with world up (0, 1, 0), as three's lookAt does:
  // right = up x d (normalised), up = d x right.
  let right = [d[2], 0, -d[0]];
  const rl = Math.hypot(...right);
  right = rl < 1e-9 ? [1, 0, 0] : right.map((v) => v / rl);
  const up = [
    d[1] * right[2] - d[2] * right[1],
    d[2] * right[0] - d[0] * right[2],
    d[0] * right[1] - d[1] * right[0],
  ];
  const p = [person.x, 0, person.z];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const u = Math.round(dot(p, right) / texel) * texel;
  const v = Math.round(dot(p, up) / texel) * texel;
  const along = dot(p, d); // the depth component is not part of the texel grid
  const target = [0, 1, 2].map((i) => right[i] * u + up[i] * v + d[i] * along);
  return {
    target: { x: target[0], y: target[1], z: target[2] },
    position: {
      x: target[0] + d[0] * distance,
      y: target[1] + d[1] * distance,
      z: target[2] + d[2] * distance,
    },
  };
}
