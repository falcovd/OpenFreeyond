// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { INTERIOR_ITEMS } from '../src/world/layout.js';

const root = new URL('../', import.meta.url).pathname;
const read = (name) =>
  readFileSync(
    new URL(`../../docs/verification/${name}`, import.meta.url),
    'utf8',
  );
const checklist = read('enter-the-house-checklist.md');
const streetChecklist = read('garden-fences-and-street-checklist.md');
const neighbourChecklist = read('neighbourhood-checklist.md');

// The text of the "Missing items" section, up to the next heading of the same or a higher level.
function missingSection(text = checklist) {
  const m = text.match(/^## Missing items\s*$([\s\S]*?)(?=^## |(?![\s\S]))/m);
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

describe('missing street items are listed (AC-6.7, FR-16)', () => {
  const section = missingSection(streetChecklist);
  const STREET_FILES = [
    'models/street/car-1.glb',
    'models/street/car-2.glb',
    'models/street/car-3.glb',
    'models/street/lamp.glb',
    'textures/paving.jpg',
    'textures/asphalt.jpg',
  ];

  it('has a "Missing items" section, even when it says none', () => {
    expect(section).not.toBeNull();
    expect(section.trim().length).toBeGreaterThan(0);
  });

  it('lists every street file that is not shipped', () => {
    for (const f of STREET_FILES)
      if (!existsSync(`${root}public/assets/${f}`))
        expect(section, f).toContain(f);
  });

  it('names the source of every street file that is shipped', () => {
    for (const f of STREET_FILES)
      if (existsSync(`${root}public/assets/${f}`))
        expect(section, f).toContain(f.split('/').pop());
  });
});

describe('missing neighbourhood items are listed (AC-6.14, FR-5, FR-9, FR-15)', () => {
  const section = missingSection(neighbourChecklist);
  const HOUSES = readdirSync(`${root}public/assets/models/houses`).map(
    (f) => `models/houses/${f}`,
  );
  const FILES = [...HOUSES, 'textures/backdrop.webp'];

  it('has a "Missing items" section, even when it says none', () => {
    expect(section).not.toBeNull();
    expect(section.trim().length).toBeGreaterThan(0);
  });

  it('lists every neighbourhood file that is not shipped', () => {
    for (const f of FILES)
      if (!existsSync(`${root}public/assets/${f}`))
        expect(section, f).toContain(f);
  });

  it('names the source of every neighbourhood file that is shipped', () => {
    expect(HOUSES.length).toBeGreaterThanOrEqual(4);
    for (const f of FILES)
      if (existsSync(`${root}public/assets/${f}`))
        expect(section, f).toContain(f.split('/').pop());
  });

  it('says where the houses and the backdrop came from', () => {
    expect(section).toMatch(/script/i);
    expect(section).toMatch(/Gemini/);
  });
});
