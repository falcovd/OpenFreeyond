import { describe, it, expect } from 'vitest';
import { lightsMarkup } from '../src/world/lightsMarkup.js';
import { LIGHTS } from '../src/world/layout.js';

describe('warm lights (FR-14, AC-4.3)', () => {
  it('makes one point light per light, in the house', () => {
    const html = lightsMarkup(LIGHTS);
    expect(html.match(/<a-light/g).length).toBe(LIGHTS.length);
    for (const l of LIGHTS)
      expect(html).toContain(`position="${l.x} ${l.y} ${l.z}"`);
  });
  it('is warm: every colour has red above green above blue', () => {
    for (const l of LIGHTS) {
      const [r, g, b] = [1, 3, 5].map((i) =>
        parseInt(l.color.slice(i, i + 2), 16),
      );
      expect(r > g && g > b).toBe(true);
    }
  });
  it('writes only safe values into the markup', () => {
    expect(
      lightsMarkup([
        {
          id: 'x',
          x: 0,
          y: 0,
          z: 0,
          color: '"><script>',
          intensity: 1,
          distance: 1,
        },
      ]),
    ).toBe('');
  });
});
