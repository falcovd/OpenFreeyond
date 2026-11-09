import { describe, it, expect } from 'vitest';
import { BOUNDS, GATE, SOLIDS } from '../src/world/layout.js';
import {
  STREET,
  CARS,
  LAMPS,
  SHADOW_REGION,
} from '../src/world/streetLayout.js';
import {
  STREET_CARS,
  STREET_LAMPS,
  STREET_SHADOWS,
} from '../src/world/streetConfig.js';
import { GROUND_SIZE, FOG } from '../src/world/builders/ground.js';

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

describe('cars and lamps (FR-9, FR-10, AC-4.4, AC-4.7)', () => {
  it('match the build-time counts', () => {
    expect(CARS).toHaveLength(STREET_CARS);
    expect(LAMPS).toHaveLength(STREET_LAMPS);
  });
  it('stand within 10 m of the gate', () => {
    for (const o of [...CARS, ...LAMPS]) {
      expect(Math.abs(o.x - GATE.x), o.id).toBeLessThanOrEqual(10);
    }
  });
  it('park cars on the road next to the curb', () => {
    for (const c of CARS) {
      expect(c.z, c.id).toBeGreaterThanOrEqual(STREET.road.z0);
      expect(c.z, c.id).toBeLessThanOrEqual(STREET.road.z0 + 3);
    }
  });
  it('put lamps on the sidewalk', () => {
    for (const l of LAMPS) {
      expect(l.z, l.id).toBeGreaterThanOrEqual(STREET.sidewalk.z0);
      expect(l.z, l.id).toBeLessThanOrEqual(STREET.sidewalk.z1);
    }
  });
  it('does not overlap cars', () => {
    for (let i = 0; i < CARS.length; i++) {
      for (let j = i + 1; j < CARS.length; j++) {
        const a = CARS[i];
        const b = CARS[j];
        expect(Math.abs(a.x - b.x)).toBeGreaterThanOrEqual(
          Math.max(a.w, b.w) + 0.5,
        );
      }
    }
  });
  it('stand beyond the walkable garden and are not solids', () => {
    for (const o of [...CARS, ...LAMPS]) {
      expect(o.z - o.d / 2, o.id).toBeGreaterThan(BOUNDS.maxZ);
      expect(
        SOLIDS.some((s) => s.id === o.id),
        o.id,
      ).toBe(false);
    }
  });
});

describe('build-time switches and shadow region (FR-17, OQ-2)', () => {
  it('keep at least one car and one lamp', () => {
    expect(STREET_CARS).toBeGreaterThanOrEqual(1);
    expect(STREET_LAMPS).toBeGreaterThanOrEqual(1);
  });
  it('set shadows to on or off', () => {
    expect(['on', 'off']).toContain(STREET_SHADOWS);
  });
  it('hold the whole street in the shadow region', () => {
    expect(SHADOW_REGION.maxZ).toBeGreaterThan(STREET.road.z1);
    expect(SHADOW_REGION.minX).toBe(BOUNDS.minX);
    expect(SHADOW_REGION.maxX).toBe(BOUNDS.maxX);
  });
});

describe('solids stay inside the garden (FR-14)', () => {
  it('has nothing in SOLIDS that reaches past BOUNDS.maxZ', () => {
    for (const s of SOLIDS)
      expect(s.z - s.d / 2, s.id).toBeLessThanOrEqual(BOUNDS.maxZ);
  });
});
