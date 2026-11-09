import { BOUNDS, GATE } from './layout.js';
import { STREET } from './streetDims.js';
import { visiblePlots } from './plots.js';
import { NEIGHBOUR_CARS } from './neighbourhoodConfig.js';

export { STREET };

// Our own plot as a record next to the other plots (never in PLOTS: it is the garden).
const OURS = {
  id: 'ours',
  side: 'near',
  bounds: { minX: BOUNDS.minX, maxX: BOUNDS.maxX },
  gateX: GATE.x,
  carColour: '#d9dcdf',
};

// The three car models and their measured boxes (they match the files in models/street/).
const CAR_MODELS = [
  { model: 'car-1', w: 4.43, d: 1.9, h: 1.24 },
  { model: 'car-2', w: 3.97, d: 1.97, h: 1.37 },
  { model: 'car-3', w: 4.21, d: 2.11, h: 1.53 },
];

const centreX = (plot) => (plot.bounds.minX + plot.bounds.maxX) / 2;
const isNear = (plot) => plot.side === 'near';

// One car per plot, centred on the plot's x range, parallel to the curb. They face the driving direction of
// their side: rot 0 on our side, PI on the far side. The model differs by plot index modulo 3 (our plot first).
// neighbourCars 'off' leaves only our car.
export function carsFor(plots, { neighbourCars = 'on' } = {}) {
  const all = [OURS, ...plots];
  return all
    .map((plot, i) => ({ plot, i }))
    .filter(({ plot }) => plot === OURS || neighbourCars !== 'off')
    .map(({ plot, i }) => {
      const m = CAR_MODELS[i % CAR_MODELS.length];
      const near = isNear(plot);
      return {
        id: `car-${plot.id}`,
        model: m.model,
        plotId: plot.id,
        x: plot === OURS ? 0 : centreX(plot),
        z: near
          ? STREET.road.z0 + 0.15 + m.d / 2
          : STREET.road.z1 - 0.15 - m.d / 2,
        w: m.w,
        d: m.d,
        h: m.h,
        rot: near ? 0 : Math.PI,
        colour: plot.carColour,
        kind: 'car',
      };
    });
}

// The lamp model is a pole with a curved arm that reaches 0.83 m beyond the lamp's z. The model is centred
// on its footprint, so the pole stands 0.67 m behind the lamp's z: the pole is 1 m from the fence (near) or
// from the far sidewalk's outer edge (far) and the arm tip is over the edge of the road.
const LAMP_Z_NEAR = STREET.sidewalk.z0 + 1.0 + 0.67;
const LAMP_Z_FAR = STREET.farSidewalk.z1 - 1.0 - 0.67;
// The gate line is 1.2 m wide; the lamp centre stays at least 1.2 m from its edge.
const LAMP_GATE_CLEAR = 1.2 + 0.6;

function lampX(plot) {
  const x = centreX(plot);
  const dx = x - plot.gateX;
  if (Math.abs(dx) >= LAMP_GATE_CLEAR) return x;
  return plot.gateX + (dx < 0 ? -LAMP_GATE_CLEAR : LAMP_GATE_CLEAR);
}

// One lamp per plot on its own sidewalk, away from the plot's gate line. Far lamps are turned by PI.
export function lampsFor(plots) {
  return [OURS, ...plots].map((plot) => ({
    id: `lamp-${plot.id}`,
    kind: 'lamp',
    plotId: plot.id,
    x: lampX(plot),
    z: isNear(plot) ? LAMP_Z_NEAR : LAMP_Z_FAR,
    w: 0.33,
    d: 1.66,
    h: 4.5,
    rot: isNear(plot) ? 0 : Math.PI,
    color: '#3d4148',
  }));
}

export const CARS = carsFor(visiblePlots(), { neighbourCars: NEIGHBOUR_CARS });
export const LAMPS = lampsFor(visiblePlots());

// The sun's shadow box must hold the whole street, far sidewalk included (OQ-2).
export const SHADOW_REGION = { ...BOUNDS, maxZ: STREET.farSidewalk.z1 + 0.5 };
