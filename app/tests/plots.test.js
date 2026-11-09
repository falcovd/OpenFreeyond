import { describe, it, expect } from 'vitest';
import {
  PLOTS,
  visiblePlots,
  plotFences,
  plotHouse,
  plotPath,
  plotGarden,
  gateLine,
  FENCE_T,
} from '../src/world/plots.js';
import { LOOKS, HOUSE_SIZE } from '../src/world/houseLooks.js';
import { FAR_PLOT_COUNT } from '../src/world/neighbourhoodConfig.js';
import { BOUNDS, FENCE, SOLIDS, outsideSolids } from '../src/world/layout.js';
import { slabGrid } from '../src/logic/slabs.js';
import { walkableArea } from '../src/logic/walkable.js';

const near = () => PLOTS.filter((p) => p.side === 'near');
const far = () => PLOTS.filter((p) => p.side === 'far');
const GATE_OPENING = 1.2;
const box = (o) => ({
  minX: o.x - o.w / 2,
  maxX: o.x + o.w / 2,
  minZ: o.z - o.d / 2,
  maxZ: o.z + o.d / 2,
});
const overlaps = (a, b, margin = 0) =>
  a.minX < b.maxX + margin &&
  a.maxX > b.minX - margin &&
  a.minZ < b.maxZ + margin &&
  a.maxZ > b.minZ - margin;
const gardenOf = (plot) => {
  const g = plotGarden(plot);
  return [...g.items, ...g.beds];
};
const hueBucket = (hex) => {
  const [r, g, b] = [1, 3, 5].map(
    (i) => parseInt(hex.slice(i, i + 2), 16) / 255,
  );
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max - min < 0.12) return 'grey';
  let h;
  if (max === r) h = ((g - b) / (max - min)) % 6;
  else if (max === g) h = (b - r) / (max - min) + 2;
  else h = (r - g) / (max - min) + 4;
  return Math.floor(((h * 60 + 360) % 360) / 30);
};

describe('the plots next to ours and across the road (AC-1.1, AC-1.2)', () => {
  it('has 2 plots on our side and 5 across the road', () => {
    expect(PLOTS).toHaveLength(7);
    expect(near()).toHaveLength(2);
    expect(far()).toHaveLength(5);
  });
  it('puts one 24 by 22 m plot on each side of ours, front edges on our front line (AC-1.1)', () => {
    const [left, right] = near().map((p) => p.bounds);
    expect(left).toEqual({ minX: -36, maxX: -12, minZ: -11, maxZ: 11 });
    expect(right).toEqual({ minX: 12, maxX: 36, minZ: -11, maxZ: 11 });
    expect(left.maxZ).toBe(BOUNDS.maxZ);
  });
  it('puts 5 plots of 24 by 22 m side by side from -60 to 60, the middle one opposite ours (AC-1.2)', () => {
    far().forEach((p, i) => {
      expect(p.bounds.minX).toBe(-60 + 24 * i);
      expect(p.bounds.maxX).toBe(-36 + 24 * i);
      expect(p.bounds.maxZ - p.bounds.minZ).toBe(22);
      expect(p.bounds.minZ).toBe(22);
    });
    expect(far()[2].bounds).toMatchObject({ minX: -12, maxX: 12 });
  });
});

describe('one fence line on every boundary (AC-1.4)', () => {
  const sideFences = (plots, rowZ) => {
    const ours = rowZ === 'near' ? SOLIDS : [];
    const pieces = [...ours, ...plots.flatMap(plotFences)];
    return pieces.filter(
      (p) => p.id === 'fence-left' || p.id === 'fence-right',
    );
  };
  const standingOn = (pieces, x, z0, z1) =>
    pieces.filter(
      (p) =>
        Math.abs(p.x - x) <= FENCE_T / 2 + 1e-6 &&
        p.z - p.d / 2 >= z0 - 1e-6 &&
        p.z + p.d / 2 <= z1 + 1e-6,
    );

  it('has exactly one fence on each boundary of the near row, ours at x = +-12 counted', () => {
    const pieces = sideFences(visiblePlots(5), 'near');
    for (const x of [-36, -12, 12, 36])
      expect(standingOn(pieces, x, -11, 11), `x=${x}`).toHaveLength(1);
  });
  it('has exactly one fence on each boundary of the far row', () => {
    const pieces = sideFences(visiblePlots(5), 'far');
    for (const x of [-60, -36, -12, 12, 36, 60])
      expect(standingOn(pieces, x, 22, 44), `x=${x}`).toHaveLength(1);
  });
  it('keeps plots 1, 2 and 3 fenced on all sides with FAR_PLOT_COUNT 3', () => {
    const visible = visiblePlots(3);
    expect(visible.filter((p) => p.side === 'far').map((p) => p.id)).toEqual([
      'far-1',
      'far-2',
      'far-3',
    ]);
    const pieces = sideFences(visible, 'far');
    for (const x of [-36, -12, 12, 36])
      expect(standingOn(pieces, x, 22, 44), `x=${x}`).toHaveLength(1);
    for (const p of visible)
      expect(plotFences(p).map((f) => f.id)).toEqual(
        expect.arrayContaining(['fence-back', 'fence-front-left', 'gate']),
      );
  });
  it('shows all seven with the default count and the far five by default', () => {
    expect(FAR_PLOT_COUNT).toBe(5);
    expect(visiblePlots()).toHaveLength(7);
  });
  it('puts the gate on the street side of each plot', () => {
    for (const p of PLOTS) {
      const gate = plotFences(p).find((f) => f.id === 'gate');
      const streetZ = p.side === 'near' ? p.bounds.maxZ : p.bounds.minZ;
      expect(Math.abs(gate.z - streetZ)).toBeCloseTo(FENCE.t / 2);
    }
  });
});

describe('the gate, path and door (AC-1.5, AC-1.6, AC-2.9)', () => {
  it('has a clear opening of 1.2 m at least 1.2 m from the plot corners', () => {
    for (const p of PLOTS) {
      const gate = plotFences(p).find((f) => f.id === 'gate');
      expect(gate.w).toBeCloseTo(GATE_OPENING);
      expect(gate.x - gate.w / 2 - p.bounds.minX).toBeGreaterThanOrEqual(1.2);
      expect(p.bounds.maxX - (gate.x + gate.w / 2)).toBeGreaterThanOrEqual(1.2);
    }
  });
  it('has a different gate x on every plot', () => {
    const xs = PLOTS.map((p) => p.gateX);
    expect(new Set(xs).size).toBe(7);
  });
  it('puts the front door in line with the gate', () => {
    for (const p of PLOTS) {
      const h = plotHouse(p);
      expect(h.x + LOOKS[p.look].doorOffset * Math.cos(h.rot)).toBeCloseTo(
        p.gateX,
      );
    }
  });
  it('runs a straight 1.2 m path of whole slabs from the gate to the door', () => {
    for (const p of PLOTS) {
      const path = plotPath(p);
      expect(path.w).toBe(1.2);
      expect(path.length).toBeCloseTo(p.houseFrontV - FENCE_T);
      expect(Math.abs(path.z1 - path.z0)).toBeCloseTo(path.length);
      const grid = slabGrid({ width: path.w, length: path.length });
      expect(grid.across).toBe(2);
      expect(grid.slabs.every((s) => Math.abs(s.w - 0.6) < 1e-9)).toBe(true);
    }
  });
  it('has the gate line start at the door and reach the curb', () => {
    for (const p of PLOTS) {
      const line = gateLine(p);
      expect(line.w).toBe(1.2);
      expect(line.x).toBe(p.gateX);
      expect(line.d).toBeGreaterThan(p.houseFrontV + 1.8);
    }
  });
});

describe('the houses (AC-2.1, AC-2.8, AC-2.9)', () => {
  it('has an 8 by 5 m footprint, 2 or 3 floors and the 8 m side to the street', () => {
    for (const p of PLOTS) {
      const h = plotHouse(p);
      expect(h.footprint.maxX - h.footprint.minX).toBeCloseTo(HOUSE_SIZE.w);
      expect(h.footprint.maxZ - h.footprint.minZ).toBeCloseTo(HOUSE_SIZE.d);
      expect([2, 3]).toContain(h.floors);
    }
  });
  it('faces +z on our side and -z (rotation pi) across the road', () => {
    for (const p of near()) {
      const h = plotHouse(p);
      expect(h.rot).toBe(0);
      expect(h.z).toBeLessThan(p.bounds.maxZ);
    }
    for (const p of far()) {
      const h = plotHouse(p);
      expect(h.rot).toBeCloseTo(Math.PI);
      expect(h.z).toBeGreaterThan(p.bounds.minZ);
    }
  });
  it('stands 3 m behind the street fence and 1 m from the other fences', () => {
    for (const p of PLOTS) {
      const { footprint: f } = plotHouse(p);
      const b = p.bounds;
      expect(f.minX - (b.minX + FENCE_T)).toBeGreaterThanOrEqual(1);
      expect(b.maxX - FENCE_T - f.maxX).toBeGreaterThanOrEqual(1);
      if (p.side === 'near') {
        expect(b.maxZ - f.maxZ).toBeGreaterThanOrEqual(3);
        expect(f.minZ - (b.minZ + FENCE_T)).toBeGreaterThanOrEqual(1);
      } else {
        expect(f.minZ - b.minZ).toBeGreaterThanOrEqual(3);
        expect(b.maxZ - FENCE_T - f.maxZ).toBeGreaterThanOrEqual(1);
      }
    }
  });
  it('gives no two plots the same gate and house position', () => {
    const keys = PLOTS.map((p) => {
      const h = plotHouse(p);
      return `${p.gateX}|${h.x}|${h.z}`;
    });
    expect(new Set(keys).size).toBe(7);
    expect(new Set(PLOTS.map((p) => plotHouse(p).x)).size).toBe(7);
  });
  it('shows at least 4 distinct looks (AC-2.3 data)', () => {
    const looks = new Set(
      PLOTS.map((p) => {
        const l = LOOKS[p.look];
        return `${p.look}|${l.facade}|${hueBucket(p.tint)}`;
      }),
    );
    expect(looks.size).toBeGreaterThanOrEqual(4);
    expect(new Set(PLOTS.map((p) => p.look)).size).toBeGreaterThanOrEqual(4);
    expect(new Set(PLOTS.map((p) => p.tint)).size).toBe(7);
  });
});

describe('the gardens (AC-2.7)', () => {
  it('has at least 3 trees or bushes, 1 hedge, 1 bench or table and 1 flower bed', () => {
    for (const p of PLOTS) {
      const { items, beds } = plotGarden(p);
      const count = (f) => items.filter(f).length;
      expect(
        count((i) => i.kind === 'tree' || i.kind === 'bush'),
      ).toBeGreaterThanOrEqual(3);
      expect(count((i) => i.kind === 'hedge')).toBeGreaterThanOrEqual(1);
      expect(
        count(
          (i) => i.kind === 'furniture' && ['bench', 'table'].includes(i.item),
        ),
      ).toBeGreaterThanOrEqual(1);
      expect(beds.length).toBeGreaterThanOrEqual(1);
    }
  });
  it('keeps every item inside the plot, 0.3 m from the fence inner faces', () => {
    for (const p of PLOTS) {
      const inner = {
        minX: p.bounds.minX + FENCE_T + 0.3,
        maxX: p.bounds.maxX - FENCE_T - 0.3,
        minZ: p.bounds.minZ + FENCE_T + 0.3,
        maxZ: p.bounds.maxZ - FENCE_T - 0.3,
      };
      for (const it of gardenOf(p)) {
        const b = box(it);
        expect(b.minX, it.id).toBeGreaterThanOrEqual(inner.minX - 1e-9);
        expect(b.maxX, it.id).toBeLessThanOrEqual(inner.maxX + 1e-9);
        expect(b.minZ, it.id).toBeGreaterThanOrEqual(inner.minZ - 1e-9);
        expect(b.maxZ, it.id).toBeLessThanOrEqual(inner.maxZ + 1e-9);
      }
    }
  });
  it('keeps every item off the house (1 m) and off the gate line', () => {
    for (const p of PLOTS) {
      const house = plotHouse(p).footprint;
      const line = box(gateLine(p));
      for (const it of gardenOf(p)) {
        expect(overlaps(box(it), house, 1), `${it.id} near house`).toBe(false);
        expect(overlaps(box(it), line), `${it.id} on gate line`).toBe(false);
      }
    }
  });
  it('keeps items apart from each other', () => {
    for (const p of PLOTS) {
      const all = gardenOf(p);
      for (let i = 0; i < all.length; i++)
        for (let j = i + 1; j < all.length; j++)
          expect(
            overlaps(box(all[i]), box(all[j]), 0.2),
            `${all[i].id} / ${all[j].id}`,
          ).toBe(false);
    }
  });
  it('has unique ids', () => {
    const ids = PLOTS.flatMap((p) => gardenOf(p).map((i) => i.id));
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('differs on every plot: no shared item position, no same layout', () => {
    const seen = new Set();
    for (const p of PLOTS)
      for (const it of gardenOf(p)) {
        const key = `${it.x},${it.z}`;
        expect(seen.has(key), key).toBe(false);
        seen.add(key);
      }
    const layouts = PLOTS.map((p) =>
      gardenOf(p)
        .map(
          (i) =>
            `${i.kind}:${(i.x - p.bounds.minX).toFixed(2)},${i.z - (p.side === 'near' ? p.bounds.maxZ : p.bounds.minZ)}`,
        )
        .sort()
        .join(';'),
    );
    expect(new Set(layouts).size).toBe(7);
  });
});

describe('plots are scenery (AC-5.2, FR-10)', () => {
  it('adds nothing to SOLIDS', () => {
    const ids = new Set(SOLIDS.map((s) => s.id));
    for (const p of PLOTS) {
      expect(ids.has(p.id)).toBe(false);
      for (const f of plotFences(p))
        if (f.id !== 'fence-left' && f.id !== 'fence-right')
          expect(SOLIDS.includes(f)).toBe(false);
      for (const it of gardenOf(p)) expect(ids.has(it.id)).toBe(false);
    }
    expect(
      SOLIDS.every(
        (s) =>
          !String(s.id).startsWith('near-') && !String(s.id).startsWith('far-'),
      ),
    ).toBe(true);
  });
  it('keeps the walkable area at 444.5 m2 or more', () => {
    expect(walkableArea(outsideSolids(), BOUNDS)).toBeGreaterThanOrEqual(444.5);
  });
});
