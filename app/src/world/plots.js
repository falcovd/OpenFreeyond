import { FENCE, GATE } from './layout.js';
import { STREET } from './streetDims.js';
import { fenceLine } from '../logic/fenceLine.js';
import { LOOKS, HOUSE_SIZE } from './houseLooks.js';
import { FAR_PLOT_COUNT } from './neighbourhoodConfig.js';

// The seven other plots as data (scenery only, never in SOLIDS). layout.js must not import this file.
// Garden items are in plot-local (u, v): u is the world x, v is the distance from the outer face of the
// street-side fence, going into the plot.
export const FENCE_T = FENCE.t;
export const PATH_W = 1.2;

const WOOD = '#8b5a2b';
const tree = (shape, u, v, h) => ({
  kind: 'tree',
  shape,
  u,
  v,
  w: 0.5,
  d: 0.5,
  h,
  color: '#5c4033',
});
const bush = (u, v) => ({
  kind: 'bush',
  u,
  v,
  w: 0.6,
  d: 0.6,
  h: 0.8,
  color: '#4f7a3a',
});
const hedge = (u, v, w) => ({
  kind: 'hedge',
  u,
  v,
  w,
  d: 0.5,
  h: 1.1,
  color: '#4f7a3a',
});
const bench = (u, v) => ({
  kind: 'furniture',
  item: 'bench',
  u,
  v,
  w: 1.6,
  d: 0.6,
  h: 0.9,
  color: WOOD,
});
const table = (u, v) => ({
  kind: 'furniture',
  item: 'table',
  u,
  v,
  w: 1.2,
  d: 1.2,
  h: 0.8,
  color: '#a9743b',
});
const bed = (u, v) => ({ u, v, w: 2, d: 1 });

const near = (minX, maxX) => ({ minX, maxX, minZ: -11, maxZ: 11 });
const far = (minX, maxX) => ({ minX, maxX, minZ: 22, maxZ: 44 });

export const PLOTS = [
  {
    id: 'near-left',
    side: 'near',
    bounds: near(-36, -12),
    gateX: -28,
    look: 'brick-pitched',
    tint: '#b4553b',
    houseFrontV: 9,
    fences: { left: true, right: false, back: true },
    carColour: '#4a6ea3',
    garden: {
      items: [
        tree('round', -33, 3, 4),
        tree('pine', -15, 5, 5),
        bush(-25, 4),
        hedge(-18, 21.2, 5),
        bench(-14.5, 12),
      ],
      beds: [bed(-32.5, 6)],
    },
  },
  {
    id: 'near-right',
    side: 'near',
    bounds: near(12, 36),
    gateX: 26,
    look: 'render-stepped',
    tint: '#f1e4cf',
    houseFrontV: 12,
    fences: { left: false, right: true, back: true },
    carColour: '#8c382b',
    garden: {
      items: [
        tree('round', 14, 4, 4.2),
        tree('pine', 34, 6, 4.5),
        bush(29, 6),
        hedge(20, 21.2, 4),
        table(18, 9),
      ],
      beds: [bed(34.2, 14)],
    },
  },
  {
    id: 'far-0',
    side: 'far',
    bounds: far(-60, -36),
    gateX: -50,
    look: 'brick-stepped',
    tint: '#8a5a44',
    houseFrontV: 8,
    fences: { left: true, right: false, back: true },
    carColour: '#d9dcdf',
    garden: {
      items: [
        tree('round', -58, 16, 4),
        tree('pine', -40, 3, 5),
        bush(-45, 5),
        hedge(-52, 20.8, 6),
        bench(-42, 9),
      ],
      beds: [bed(-58, 5)],
    },
  },
  {
    id: 'far-1',
    side: 'far',
    bounds: far(-36, -12),
    gateX: -27,
    look: 'render-pitched',
    tint: '#d9d4b8',
    houseFrontV: 13,
    fences: { left: true, right: true, back: true },
    carColour: '#3f6b4f',
    garden: {
      items: [
        tree('pine', -34.5, 5, 4.8),
        tree('round', -14, 6, 4),
        bush(-22, 8),
        bush(-30, 3.5),
        hedge(-20, 21, 4.5),
        bench(-16, 12),
      ],
      beds: [bed(-19, 4)],
    },
  },
  {
    id: 'far-2',
    side: 'far',
    bounds: far(-12, 12),
    gateX: 4,
    look: 'brick-pitched',
    tint: '#c9824f',
    houseFrontV: 10,
    fences: { left: false, right: false, back: true },
    carColour: '#c7a33a',
    garden: {
      items: [
        tree('round', -8, 5, 4.4),
        tree('pine', -10, 16, 5),
        bush(7, 6),
        hedge(-3, 21, 5),
        table(-5, 11),
      ],
      beds: [bed(-4, 3)],
    },
  },
  {
    id: 'far-3',
    side: 'far',
    bounds: far(12, 36),
    gateX: 21,
    look: 'render-pitched',
    tint: '#cfdce6',
    houseFrontV: 7,
    fences: { left: true, right: true, back: true },
    carColour: '#7a4f8c',
    garden: {
      items: [
        tree('pine', 13.5, 16, 4.6),
        tree('round', 33, 5, 4),
        bush(29, 9),
        bush(34, 16),
        hedge(27, 21, 6),
        bench(30, 3.5),
      ],
      beds: [bed(17, 4)],
    },
  },
  {
    id: 'far-4',
    side: 'far',
    bounds: far(36, 60),
    gateX: 44,
    look: 'brick-stepped',
    tint: '#a8643d',
    houseFrontV: 11,
    fences: { left: false, right: true, back: true },
    carColour: '#2f3a4a',
    garden: {
      items: [
        tree('round', 38, 5, 4.4),
        tree('pine', 57, 8, 5),
        bush(52, 4),
        hedge(52, 21, 5),
        bench(54, 12),
      ],
      beds: [bed(40, 3)],
    },
  },
];

// The near plots, and the far plots kept for farCount (5: all, 3: plots 1, 2, 3).
export function visiblePlots(farCount = FAR_PLOT_COUNT) {
  const farPlots = PLOTS.filter((p) => p.side === 'far');
  const kept = farCount >= farPlots.length ? farPlots : farPlots.slice(1, 4);
  return [...PLOTS.filter((p) => p.side === 'near'), ...kept];
}

const isNear = (plot) => plot.side === 'near';
const toZ = (plot, v) =>
  isNear(plot) ? plot.bounds.maxZ - v : plot.bounds.minZ + v;

export function plotFences(plot) {
  const skip = ['left', 'right', 'back'].filter((s) => !plot.fences[s]);
  return fenceLine(
    plot.bounds,
    FENCE,
    { x: plot.gateX, w: GATE.w },
    { skip, gateSide: isNear(plot) ? 'maxZ' : 'minZ' },
  );
}

export function plotHouse(plot) {
  const look = LOOKS[plot.look];
  const rot = isNear(plot) ? 0 : Math.PI;
  // The turn by rot flips the house's local x, so the door's world x is x + doorOffset * cos(rot).
  const x = plot.gateX - look.doorOffset * Math.cos(rot);
  const z = isNear(plot)
    ? plot.bounds.maxZ - plot.houseFrontV - HOUSE_SIZE.d / 2
    : plot.bounds.minZ + plot.houseFrontV + HOUSE_SIZE.d / 2;
  return {
    x,
    z,
    rot,
    look: plot.look,
    floors: look.floors,
    footprint: {
      minX: x - HOUSE_SIZE.w / 2,
      maxX: x + HOUSE_SIZE.w / 2,
      minZ: z - HOUSE_SIZE.d / 2,
      maxZ: z + HOUSE_SIZE.d / 2,
    },
  };
}

// From the inner face of the street-side fence (the gate) to the front door.
export function plotPath(plot) {
  const z0 = toZ(plot, FENCE_T);
  const z1 = toZ(plot, plot.houseFrontV);
  return {
    x: plot.gateX,
    z0,
    z1,
    w: PATH_W,
    length: plot.houseFrontV - FENCE_T,
  };
}

export function plotGarden(plot) {
  const counts = {};
  const items = plot.garden.items.map(({ u, v, ...item }) => {
    const name = item.kind === 'furniture' ? item.item : item.kind;
    counts[name] = (counts[name] ?? 0) + 1;
    return {
      id: `${plot.id}-${name}-${counts[name]}`,
      ...item,
      x: u,
      z: toZ(plot, v),
    };
  });
  const beds = plot.garden.beds.map(({ u, v, ...bedRest }, i) => ({
    id: `${plot.id}-bed-${i + 1}`,
    ...bedRest,
    x: u,
    z: toZ(plot, v),
  }));
  return { items, beds };
}

// The strip 1.2 m wide from the front door through the gate and across the sidewalk to the curb.
export function gateLine(plot) {
  const doorZ = toZ(plot, plot.houseFrontV);
  const curbZ = isNear(plot) ? STREET.curb.z1 : STREET.farCurb.z0;
  return {
    x: plot.gateX,
    z: (doorZ + curbZ) / 2,
    w: PATH_W,
    d: Math.abs(curbZ - doorZ),
  };
}
