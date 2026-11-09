// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { INTERIOR_ITEMS } from '../src/world/layout.js';

const root = new URL('../', import.meta.url).pathname;
const checklist = readFileSync(
  `${root}docs/verification/enter-the-house-checklist.md`,
  'utf8',
);

// The text of the "Missing items" section, up to the next heading of the same or a higher level.
function missingSection() {
  const m = checklist.match(
    /^## Missing items\s*$([\s\S]*?)(?=^## |(?![\s\S]))/m,
  );
  return m ? m[1] : null;
}

describe('missing items are listed (AC-7.4, AC-7.5, AC-7.6, FR-19)', () => {
  it('has a "Missing items" section, even when it says none', () => {
    expect(missingSection()).not.toBeNull();
    expect(missingSection().trim().length).toBeGreaterThan(0);
  });

  it('lists every interior item that has no model file', () => {
    const section = missingSection();
    for (const item of INTERIOR_ITEMS.filter((i) => i.file === null))
      expect(section, item.id).toContain(item.id);
  });

  it('lists every interior item whose model file is not shipped', () => {
    const section = missingSection();
    for (const item of INTERIOR_ITEMS.filter((i) => i.file)) {
      if (!existsSync(`${root}public/assets/${item.file}`))
        expect(section, item.id).toContain(item.id);
    }
  });

  it('lists tv-clip when the clip is not shipped', () => {
    if (!existsSync(`${root}public/assets/interior/tv-clip.mp4`))
      expect(missingSection()).toContain('tv-clip');
  });
});
