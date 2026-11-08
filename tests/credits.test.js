// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderWorldOverlay } from '../src/ui/screens.js';
import { ASSET_RECORDS } from '../src/data/licences.js';

const render = () => {
  const root = document.createElement('div');
  renderWorldOverlay(root, {
    notice: null,
    showHint: false,
    onDismissHint() {},
    onBack() {},
  });
  return root;
};

describe('credits section (AC-11.3)', () => {
  it('lists every credit that a licence requires', () => {
    const root = render();
    root.querySelector('[data-action="toggle-credits"]').click();
    const text = root.querySelector('.credits').textContent;
    for (const r of ASSET_RECORDS.filter((x) => x.credit))
      expect(text).toContain(r.credit);
  });
  it('shows the credits panel only after the button is pressed', () => {
    const root = render();
    expect(root.querySelector('.credits')).toBeNull();
  });
  it('hides the panel again when the button is pressed twice', () => {
    const root = render();
    const button = root.querySelector('[data-action="toggle-credits"]');
    button.click();
    button.click();
    expect(root.querySelector('.credits')).toBeNull();
  });
  it('names the source and licence of every asset pack', () => {
    const root = render();
    root.querySelector('[data-action="toggle-credits"]').click();
    const text = root.querySelector('.credits').textContent;
    for (const r of ASSET_RECORDS) {
      expect(text).toContain(r.author);
      expect(text).toContain(r.licence);
    }
  });
  it('links each source safely and only over http(s)', () => {
    const root = render();
    root.querySelector('[data-action="toggle-credits"]').click();
    const links = [...root.querySelectorAll('.credits a')];
    expect(links.length).toBe(ASSET_RECORDS.length);
    for (const a of links) {
      expect(a.getAttribute('href')).toMatch(/^https?:\/\//);
      expect(a.getAttribute('target')).toBe('_blank');
      expect(a.getAttribute('rel')).toBe('noopener noreferrer');
    }
  });
});
