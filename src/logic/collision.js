export function hitsSolid(x, z, solids, radius) {
  return solids.some(
    (s) =>
      Math.abs(x - s.x) < s.w / 2 + radius &&
      Math.abs(z - s.z) < s.d / 2 + radius,
  );
}

function clampToBounds(p, b, r) {
  return {
    x: Math.min(Math.max(p.x, b.minX + r), b.maxX - r),
    z: Math.min(Math.max(p.z, b.minZ + r), b.maxZ - r),
  };
}

export function resolveMove(prev, next, solids, bounds, radius = 0.3) {
  const target = clampToBounds(next, bounds, radius);
  let x = target.x;
  let z = prev.z;
  if (hitsSolid(x, z, solids, radius)) x = prev.x;
  z = target.z;
  if (hitsSolid(x, z, solids, radius)) z = prev.z;
  return { x, z };
}
