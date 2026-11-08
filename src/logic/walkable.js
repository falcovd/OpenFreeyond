import { hitsSolid } from './collision.js';

// Area inside the bounds that no solid covers, counted on a grid (AC-4.3).
export function walkableArea(solids, bounds, cell = 0.1) {
  const nx = Math.round((bounds.maxX - bounds.minX) / cell);
  const nz = Math.round((bounds.maxZ - bounds.minZ) / cell);
  let free = 0;
  for (let i = 0; i < nx; i++) {
    const x = bounds.minX + (i + 0.5) * cell;
    for (let j = 0; j < nz; j++) {
      const z = bounds.minZ + (j + 0.5) * cell;
      const covered = solids.some(
        (s) => Math.abs(x - s.x) < s.w / 2 && Math.abs(z - s.z) < s.d / 2,
      );
      if (!covered) free++;
    }
  }
  return free * cell * cell;
}

// True when a person of this radius can walk from `from` to a spot within `dist` of `target` (AC-4.4).
export function reachesWithin(
  from,
  target,
  dist,
  solids,
  bounds,
  radius = 0.3,
  cell = 0.2,
) {
  const key = (x, z) => `${Math.round(x / cell)},${Math.round(z / cell)}`;
  const seen = new Set([key(from.x, from.z)]);
  const queue = [{ x: from.x, z: from.z }];
  while (queue.length) {
    const p = queue.shift();
    if (Math.hypot(p.x - target.x, p.z - target.z) <= dist) return true;
    for (const [dx, dz] of [
      [cell, 0],
      [-cell, 0],
      [0, cell],
      [0, -cell],
    ]) {
      const x = p.x + dx;
      const z = p.z + dz;
      if (x < bounds.minX + radius || x > bounds.maxX - radius) continue;
      if (z < bounds.minZ + radius || z > bounds.maxZ - radius) continue;
      const k = key(x, z);
      if (seen.has(k) || hitsSolid(x, z, solids, radius)) continue;
      seen.add(k);
      queue.push({ x, z });
    }
  }
  return false;
}
