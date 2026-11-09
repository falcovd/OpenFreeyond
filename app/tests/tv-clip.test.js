// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, statSync } from 'node:fs';

const path = new URL('../public/assets/interior/tv-clip.mp4', import.meta.url)
  .pathname;

// Reads the duration from the 'mvhd' atom of an mp4.
function mp4Seconds(buf) {
  const at = buf.indexOf('mvhd');
  const v = buf.readUInt8(at + 4);
  const o = at + 4 + 4 + (v === 1 ? 16 : 8);
  return v === 1
    ? Number(buf.readBigUInt64BE(o + 4)) / buf.readUInt32BE(o)
    : buf.readUInt32BE(o + 4) / buf.readUInt32BE(o);
}

describe.skipIf(!existsSync(path))('the TV clip (AC-4.6, FR-15)', () => {
  it('is at most 60 seconds and 30 MB', () => {
    expect(statSync(path).size).toBeLessThanOrEqual(30 * 1024 * 1024);
    expect(mp4Seconds(readFileSync(path))).toBeLessThanOrEqual(60);
  });
  it('has no audio track', () => {
    expect(readFileSync(path).includes('soun')).toBe(false);
  });
});
