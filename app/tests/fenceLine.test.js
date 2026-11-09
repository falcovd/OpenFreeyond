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
  it('puts posts about every metre, the first and last inset 6 cm from the ends', () => {
    const posts = fencePosts(byId('fence-left'));
    expect(posts[0]).toBeCloseTo(-11 + 0.06);
    for (let i = 1; i < posts.length; i++) {
      const gap = posts[i] - posts[i - 1];
      expect(gap).toBeLessThanOrEqual(1.0 + 1e-9);
      expect(gap).toBeGreaterThan(0.9);
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
