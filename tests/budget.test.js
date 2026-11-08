// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('../public/assets', import.meta.url).pathname;
const total = (dir) =>
  readdirSync(dir).reduce((sum, name) => {
    const p = join(dir, name);
    return sum + (statSync(p).isDirectory() ? total(p) : statSync(p).size);
  }, 0);

describe('download budget (NFR-2)', () => {
  it('keeps shipped assets at or under 20 MB, so the page, scripts and assets stay under 30 MB', () => {
    expect(total(ROOT)).toBeLessThanOrEqual(20 * 1024 * 1024);
  });
  it('keeps every texture at 1 MB or less, except the sky photo (3 MB)', () => {
    for (const f of readdirSync(join(ROOT, 'textures'))) {
      const limit = f === 'sky.jpg' ? 3 * 1024 * 1024 : 1024 * 1024;
      expect(statSync(join(ROOT, 'textures', f)).size, f).toBeLessThanOrEqual(
        limit,
      );
    }
  });
});
