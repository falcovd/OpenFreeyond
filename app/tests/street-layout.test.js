import { describe, it, expect } from 'vitest';
import { BOUNDS, GATE, SOLIDS } from '../src/world/layout.js';
import {
  STREET,
  CARS,
  LAMPS,
  carsFor,
  lampsFor,
} from '../src/world/streetLayout.js';
import { visiblePlots, gateLine } from '../src/world/plots.js';
import { STREET_SHADOWS } from '../src/world/streetConfig.js';
import { NEIGHBOUR_CARS } from '../src/world/neighbourhoodConfig.js';
import { GROUND_SIZE, FOG } from '../src/world/builders/ground.js';

// Assumption: A-Frame's linear fog uses view depth, so at a wide angle the street ends (x = +-STREET.length / 2)
// may be only partly fogged. The tests below check the numbers; the wide-angle look is checked by eye (plan Task 14).
describe('far sidewalk (D-27)', () => {
  it('has a 20 cm by 15 cm curb and a 1.8 m sidewalk beyond the road', () => {
    expect(STREET.farCurb.z0).toBeCloseTo(STREET.road.z1);
    expect(STREET.farCurb.w).toBe(0.2);
    expect(STREET.farCurb.h).toBe(0.15);
    expect(STREET.farSidewalk.z0).toBeCloseTo(STREET.farCurb.z1);
    expect(STREET.farSidewalk.w).toBe(1.8);
    expect(STREET.farSidewalk.top).toBe(0.15);
    expect(STREET.farSidewalk.z1).toBeCloseTo(STREET.farSidewalk.z0 + 1.8);
  });
  it('is not reachable', () => {
    expect(SOLIDS.some((s) => s.z - (s.d ?? 0) / 2 >= STREET.farCurb.z0)).toBe(
      false,
    );
  });
});

describe('street dimensions (FR-8, AC-4.2)', () => {
  it('has a 1.8 m sidewalk that starts at the front fence (A-8)', () => {
    expect(STREET.sidewalk.w).toBe(1.8);
    expect(STREET.sidewalk.z0).toBe(BOUNDS.maxZ);
    expect(STREET.sidewalk.z1).toBeCloseTo(BOUNDS.maxZ + 1.8);
  });
  it('has a 15 cm curb and a 7 m road', () => {
    expect(STREET.curb.h).toBe(0.15);
    expect(STREET.curb.z0).toBeCloseTo(STREET.sidewalk.z1);
    expect(STREET.road.w).toBe(7);
    expect(STREET.road.z0).toBeCloseTo(
      STREET.sidewalk.z0 + 1.8 + STREET.curb.w,
    );
    expect(STREET.road.z1).toBeCloseTo(STREET.road.z0 + 7);
    expect(STREET.centreLineZ).toBeCloseTo(STREET.road.z0 + 3.5);
  });
  it('ends inside the fog from anywhere in the garden (AC-4.3)', () => {
    const maxX = Math.max(Math.abs(BOUNDS.minX), BOUNDS.maxX);
    expect(STREET.length / 2 - maxX).toBeGreaterThanOrEqual(FOG.far);
  });
  it('is smaller than the ground, with fog room beyond it', () => {
    expect(GROUND_SIZE / 2).toBeGreaterThan(STREET.length / 2);
    expect(GROUND_SIZE / 2).toBeGreaterThan(STREET.road.z1 + FOG.far);
  });
  it('leaves the boundary unchanged', () => {
    expect(BOUNDS.maxZ).toBe(11);
  });
});

describe('cars and lamps follow the plots (FR-7, FR-8, AC-3.1..3.5)', () => {
  const plots = visiblePlots();
  const all = [{ id: 'ours', side: 'near', gateX: GATE.x }, ...plots];
  const byPlot = (list, id) => list.find((o) => o.plotId === id);
  const xRange = (p) =>
    p.id === 'ours'
      ? [BOUNDS.minX, BOUNDS.maxX]
      : [p.bounds.minX, p.bounds.maxX];

  it('has one car and one lamp per visible plot plus ours', () => {
    expect(CARS).toHaveLength(8);
    expect(LAMPS).toHaveLength(8);
    expect(CARS.filter((c) => c.rot === 0)).toHaveLength(3);
    expect(CARS.filter((c) => c.rot === Math.PI)).toHaveLength(5);
    expect(byPlot(CARS, 'ours').x).toBe(0);
  });
  it('centres each car on its plot and parks it next to its own curb', () => {
    for (const p of all) {
      const c = byPlot(CARS, p.id);
      const [a, b] = xRange(p);
      expect(c.x, p.id).toBeCloseTo((a + b) / 2);
      if (p.side === 'near') {
        expect(c.z, p.id).toBeGreaterThanOrEqual(STREET.road.z0);
        expect(c.z, p.id).toBeLessThanOrEqual(STREET.road.z0 + 3);
        expect(c.rot).toBe(0);
      } else {
        expect(c.z, p.id).toBeGreaterThanOrEqual(STREET.road.z1 - 3);
        expect(c.z, p.id).toBeLessThanOrEqual(STREET.road.z1);
        expect(c.rot).toBe(Math.PI);
      }
    }
  });
  it('uses the three car models, by plot index modulo 3, with the model box sizes', () => {
    expect(new Set(CARS.map((c) => c.model))).toEqual(
      new Set(['car-1', 'car-2', 'car-3']),
    );
    expect(CARS.find((c) => c.model === 'car-1').w).toBe(4.43);
    for (const c of CARS) expect(c.kind).toBe('car');
  });
  it('shows at least 3 colours and never the same colour on neighbouring cars of one side', () => {
    expect(new Set(CARS.map((c) => c.colour)).size).toBeGreaterThanOrEqual(4);
    for (const side of [0, Math.PI]) {
      const row = CARS.filter((c) => c.rot === side).sort((a, b) => a.x - b.x);
      for (let i = 1; i < row.length; i++)
        expect(row[i].colour).not.toBe(row[i - 1].colour);
    }
  });
  it('does not overlap cars', () => {
    for (let i = 0; i < CARS.length; i++)
      for (let j = i + 1; j < CARS.length; j++) {
        const a = CARS[i];
        const b = CARS[j];
        if (a.rot === b.rot)
          expect(Math.abs(a.x - b.x)).toBeGreaterThanOrEqual(
            Math.max(a.w, b.w) + 0.5,
          );
      }
  });
  it('puts lamps on the sidewalk of their side, turned by PI on the far side', () => {
    for (const p of all) {
      const l = byPlot(LAMPS, p.id);
      const s = p.side === 'near' ? STREET.sidewalk : STREET.farSidewalk;
      expect(l.z, p.id).toBeGreaterThanOrEqual(s.z0);
      expect(l.z, p.id).toBeLessThanOrEqual(s.z1);
      expect(l.rot).toBe(p.side === 'near' ? 0 : Math.PI);
    }
  });
  it('keeps every lamp at least 1.2 m from its plot gate line', () => {
    for (const p of all) {
      const l = byPlot(LAMPS, p.id);
      const g = p.id === 'ours' ? { x: GATE.x, w: 1.2 } : gateLine(p);
      expect(Math.abs(l.x - g.x) - g.w / 2, p.id).toBeGreaterThanOrEqual(1.2);
    }
  });
  it('stand beyond the walkable garden and are not solids', () => {
    for (const o of [...CARS, ...LAMPS]) {
      expect(o.z - o.d / 2).toBeGreaterThan(BOUNDS.maxZ);
      expect(
        SOLIDS.some((s) => s.id === o.id),
        o.id,
      ).toBe(false);
    }
  });
  it('drops the neighbours cars when NEIGHBOUR_CARS is off, never our own', () => {
    const cars = carsFor(plots, { neighbourCars: 'off' });
    expect(cars.map((c) => c.plotId)).toEqual(['ours']);
  });
  it('drops the cars and lamps of the removed far plots (FAR_PLOT_COUNT 3)', () => {
    const few = visiblePlots(3);
    expect(carsFor(few)).toHaveLength(6);
    expect(lampsFor(few)).toHaveLength(6);
    expect(carsFor([]).map((c) => c.plotId)).toEqual(['ours']);
    expect(lampsFor([]).map((l) => l.plotId)).toEqual(['ours']);
    expect(carsFor(few).some((c) => c.plotId === 'far-0')).toBe(false);
  });
});

describe('build-time switches (FR-13, OQ-2)', () => {
  it('set shadows and neighbour switches to on or off', () => {
    expect(['on', 'off']).toContain(STREET_SHADOWS);
    expect(['on', 'off']).toContain(NEIGHBOUR_CARS);
  });
});

describe('solids stay inside the garden (FR-14)', () => {
  it('has nothing in SOLIDS that reaches past BOUNDS.maxZ', () => {
    for (const s of SOLIDS)
      expect(s.z - s.d / 2, s.id).toBeLessThanOrEqual(BOUNDS.maxZ);
  });
});
