export const BOUNDS = { minX: -11, maxX: 11, minZ: -11, maxZ: 11 };
export const SPAWN = { x: 0, z: 6 };
export const CHARACTER_SPOT = { x: 3, z: -1 };

// kind: 'box' (default), 'tree' or 'character' (not drawn here)
export const SOLIDS = [
  { id: 'house', x: 0, z: -7, w: 6, d: 5, h: 3, color: '#e8c9a0' },
  { id: 'fence-left', x: -8, z: -2, w: 0.2, d: 10, h: 1, color: '#f2e3c6' },
  { id: 'fence-right', x: 8, z: -2, w: 0.2, d: 10, h: 1, color: '#f2e3c6' },
  { id: 'bench', x: -4, z: -2, w: 1.6, d: 0.6, h: 0.5, color: '#8b5a2b' },
  { id: 'table', x: 5, z: -4, w: 1.2, d: 1.2, h: 0.8, color: '#a9743b' },
  { id: 'planter', x: -5, z: -5, w: 2, d: 0.6, h: 0.5, color: '#7a4b2a' },
  {
    id: 'tree-1',
    kind: 'tree',
    x: -5,
    z: 3,
    w: 0.8,
    d: 0.8,
    h: 2.5,
    color: '#5c4033',
  },
  {
    id: 'tree-2',
    kind: 'tree',
    x: 6,
    z: 3,
    w: 0.8,
    d: 0.8,
    h: 2.5,
    color: '#5c4033',
  },
  { id: 'character', kind: 'character', ...CHARACTER_SPOT, w: 0.8, d: 0.8 },
];
