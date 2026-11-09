import { describe, it, expect } from 'vitest';
import { fenceLine, fencePosts } from '../src/logic/fenceLine.js';

const B = { minX: -12, maxX: 12, minZ: -11, maxZ: 11 };
const FENCE = { t: 0.2, h: 1, color: '#f2e3c6' };
const GATE = { x: -1.95, w: 1.2 };
const solids = fenceLine(B, FENCE, GATE);
const byId = (id) => solids.find((s) => s.id === id);

describe('fenceLine (FR-1, FR-4, FR-5, AC-1.4)', () => {
  it('makes six solids: left, right, back, two front pieces and the gate', () => {
    expect(solids.map((s) => s.id).sort()).toEqual([
      'fence-back',
      'fence-front-left',
      'fence-front-right',
      'fence-left',
      'fence-right',
      'gate',
    ]);
    expect(byId('gate').kind).toBe('gate');
  });
  it('puts the outer face of every fence on the edge and keeps it inside the bounds', () => {
    for (const s of solids) {
      expect(s.x - s.w / 2).toBeGreaterThanOrEqual(B.minX - 1e-9);
      expect(s.x + s.w / 2).toBeLessThanOrEqual(B.maxX + 1e-9);
      expect(s.z - s.d / 2).toBeGreaterThanOrEqual(B.minZ - 1e-9);
      expect(s.z + s.d / 2).toBeLessThanOrEqual(B.maxZ + 1e-9);
    }
    expect(byId('fence-left').x - 0.1).toBeCloseTo(B.minX);
    expect(byId('fence-back').z - 0.1).toBeCloseTo(B.minZ);
    expect(byId('gate').z + 0.1).toBeCloseTo(B.maxZ);
  });
  it('leaves no gap other than the gate: the pieces touch end to end', () => {
    const front = ['fence-front-left', 'gate', 'fence-front-right']
      .map(byId)
      .sort((a, b) => a.x - b.x);
    expect(front[0].x + front[0].w / 2).toBeCloseTo(
      front[1].x - front[1].w / 2,
    );
    expect(front[1].x + front[1].w / 2).toBeCloseTo(
      front[2].x - front[2].w / 2,
    );
    expect(front[0].x - front[0].w / 2).toBeCloseTo(B.minX + FENCE.t);
    expect(front[2].x + front[2].w / 2).toBeCloseTo(B.maxX - FENCE.t);
    // the back piece runs between the side fences, so no corner is missing
    const back = byId('fence-back');
    expect(back.x - back.w / 2).toBeCloseTo(B.minX + FENCE.t);
    expect(byId('fence-left').d).toBeCloseTo(B.maxZ - B.minZ);
  });
  it('has a gate of 1.2 m centred on the path x (AC-2.3)', () => {
    expect(byId('gate').w).toBeCloseTo(1.2);
    expect(byId('gate').x).toBeCloseTo(GATE.x);
  });
});

describe('fencePosts (FR-2, FR-4)', () => {
  it('puts posts about every metre, the first and last inset 6 cm from the ends, on every piece', () => {
    for (const piece of solids) {
      const posts = fencePosts(piece);
      const half = Math.max(piece.w, piece.d) / 2;
      expect(posts[0], piece.id).toBeCloseTo(-half + 0.06);
      expect(posts.at(-1), piece.id).toBeCloseTo(half - 0.06);
      for (let i = 1; i < posts.length; i++) {
        const gap = posts[i] - posts[i - 1];
        expect(gap, piece.id).toBeLessThanOrEqual(1.0 + 1e-9);
        expect(gap, piece.id).toBeGreaterThan(0.5); // the 1.2 m gate gets 0.54 m gaps
      }
    }
  });
  it('leaves exactly 1.2 m between the inner faces of the two gate-side end posts', () => {
    const l = byId('fence-front-left');
    const r = byId('fence-front-right');
    const halfPost = 0.06;
    const leftPostCentre = l.x + fencePosts(l).slice(-1)[0];
    const rightPostCentre = r.x + fencePosts(r)[0];
    const leftInnerFace = leftPostCentre + halfPost;
    const rightInnerFace = rightPostCentre - halfPost;
    expect(rightInnerFace - leftInnerFace).toBeCloseTo(1.2);
  });
});

describe('fenceLine with skipped edges and the gate on the minZ side (neighbourhood)', () => {
  const FENCE = { t: 0.2, h: 1, color: '#f2e3c6' };
  it('skips the right edge: no right piece, and the back and front pieces run to the edge', () => {
    const B = { minX: -36, maxX: -12, minZ: -11, maxZ: 11 };
    const s = fenceLine(B, FENCE, { x: -28, w: 1.2 }, { skip: ['right'] });
    expect(s.find((p) => p.id === 'fence-right')).toBeUndefined();
    const back = s.find((p) => p.id === 'fence-back');
    expect(back.x + back.w / 2).toBeCloseTo(-12);
  });
  it('skips the left edge too, and the back edge', () => {
    const B = { minX: 12, maxX: 36, minZ: -11, maxZ: 11 };
    const s = fenceLine(
      B,
      FENCE,
      { x: 25, w: 1.2 },
      { skip: ['left', 'back'] },
    );
    expect(s.map((p) => p.id).sort()).toEqual([
      'fence-front-left',
      'fence-front-right',
      'fence-right',
      'gate',
    ]);
  });
  it('puts the gate on the minZ edge for the far plots', () => {
    const B = { minX: -12, maxX: 12, minZ: 22, maxZ: 44 };
    const s = fenceLine(B, FENCE, { x: 4, w: 1.2 }, { gateSide: 'minZ' });
    const gate = s.find((p) => p.id === 'gate');
    expect(gate.z - 0.1).toBeCloseTo(22);
    const back = s.find((p) => p.id === 'fence-back');
    expect(back.z + 0.1).toBeCloseTo(44);
  });
  it('keeps every mirrored piece inside the bounds and touching end to end', () => {
    const B = { minX: -12, maxX: 12, minZ: 22, maxZ: 44 };
    const s = fenceLine(B, FENCE, { x: 4, w: 1.2 }, { gateSide: 'minZ' });
    for (const p of s) {
      expect(p.x - p.w / 2).toBeGreaterThanOrEqual(B.minX - 1e-9);
      expect(p.x + p.w / 2).toBeLessThanOrEqual(B.maxX + 1e-9);
      expect(p.z - p.d / 2).toBeGreaterThanOrEqual(B.minZ - 1e-9);
      expect(p.z + p.d / 2).toBeLessThanOrEqual(B.maxZ + 1e-9);
    }
    const front = s
      .filter((p) =>
        ['fence-front-left', 'gate', 'fence-front-right'].includes(p.id),
      )
      .sort((a, b) => a.x - b.x);
    expect(front.map((p) => p.id)).toEqual([
      'fence-front-left',
      'gate',
      'fence-front-right',
    ]);
    expect(front[0].x + front[0].w / 2).toBeCloseTo(
      front[1].x - front[1].w / 2,
    );
    expect(front[1].x + front[1].w / 2).toBeCloseTo(
      front[2].x - front[2].w / 2,
    );
    for (const p of front) expect(p.z).toBeCloseTo(22.1);
    for (const p of s) expect(fencePosts(p).length).toBeGreaterThanOrEqual(2);
  });
  it('is unchanged without options (our plot)', () => {
    const B = { minX: -12, maxX: 12, minZ: -11, maxZ: 11 };
    expect(fenceLine(B, FENCE, { x: -1.95, w: 1.2 })).toHaveLength(6);
  });
});
