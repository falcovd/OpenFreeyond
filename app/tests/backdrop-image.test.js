// @vitest-environment node
import { describe, it, expect, beforeAll } from 'vitest';
import { statSync, existsSync } from 'node:fs';
import sharp from 'sharp';

const FILE = new URL('../public/assets/textures/backdrop.webp', import.meta.url)
  .pathname;

describe('backdrop picture (FR-9, AC-4.1, AC-4.2)', () => {
  let width;
  let height;
  let data;
  let channels;
  beforeAll(async () => {
    const r = await sharp(FILE).raw().toBuffer({ resolveWithObject: true });
    ({ width, height, channels } = r.info);
    data = r.data;
  });
  const px = (x, y) => {
    const o = (y * width + x) * channels;
    return [data[o], data[o + 1], data[o + 2], data[o + 3]];
  };

  it('exists and is at most 2 MB', () => {
    expect(existsSync(FILE)).toBe(true);
    expect(statSync(FILE).size).toBeLessThanOrEqual(2 * 1024 * 1024);
  });
  it('is at least 2048 px wide, about 4 : 1, with an alpha channel', async () => {
    expect(width).toBeGreaterThanOrEqual(2048);
    expect(width / height).toBeGreaterThanOrEqual(3.5);
    expect(width / height).toBeLessThanOrEqual(4.5);
    expect((await sharp(FILE).metadata()).hasAlpha).toBe(true);
    expect(channels).toBe(4);
  });
  it('is fully transparent along the top row and mostly opaque lower down', () => {
    for (let x = 0; x < width; x++) expect(px(x, 0)[3]).toBe(0);
    let opaque = 0;
    for (let x = 0; x < width; x++) if (px(x, height - 1)[3] > 250) opaque++;
    expect(opaque / width).toBeGreaterThan(0.9);
  });
  it('has buildings and sky: a good part of the strip is opaque and a good part transparent', () => {
    let opaque = 0;
    let clear = 0;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 250) opaque++;
      if (data[i] < 5) clear++;
    }
    const total = width * height;
    expect(opaque / total).toBeGreaterThan(0.3);
    expect(clear / total).toBeGreaterThan(0.1);
  });
  it('repeats without a seam: the left and right edge columns match', () => {
    // The step from the last column to the first must be like any step between two neighbouring columns.
    const dist = (a, b) => {
      const wa = a[3] / 255;
      const wb = b[3] / 255;
      let d = Math.abs(a[3] - b[3]) / 4;
      for (let c = 0; c < 3; c++) d += Math.abs(a[c] - b[c]) * Math.min(wa, wb);
      return d / 4;
    };
    const step = (x1, x2) => {
      let sum = 0;
      for (let y = 0; y < height; y++) sum += dist(px(x1, y), px(x2, y));
      return sum / height;
    };
    let total = 0;
    for (let x = 0; x < width - 1; x++) total += step(x, x + 1);
    const typical = total / (width - 1);
    expect(step(width - 1, 0)).toBeLessThan(typical * 2.5);
  });
});
