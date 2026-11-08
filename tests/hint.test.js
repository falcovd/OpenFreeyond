import { describe, it, expect } from 'vitest';
import { renderWorldOverlay } from '../src/ui/screens.js';

function setup(options) {
  const root = document.createElement('div');
  renderWorldOverlay(root, {
    notice: null,
    showHint: true,
    onDismissHint: () => {},
    onBack: () => {},
    ...options,
  });
  return root;
}

describe('controls hint', () => {
  it('shows how to move and look for keyboard, mouse and trackpad (FR-5)', () => {
    const text = setup({}).textContent;
    expect(text).toMatch(/W A S D|arrow/i);
    expect(text).toMatch(/mouse or trackpad/i);
  });
  it('is dismissible and calls back once (AC-1.8)', () => {
    let calls = 0;
    const root = setup({ onDismissHint: () => calls++ });
    root.querySelector('[data-action="dismiss-hint"]').click();
    expect(calls).toBe(1);
    expect(root.querySelector('.hint')).toBeNull();
  });
  it('is not shown when it was seen before (AC-1.8)', () => {
    expect(setup({ showHint: false }).querySelector('.hint')).toBeNull();
  });
  it('calls onBack when the back button is clicked', () => {
    let calls = 0;
    const root = setup({ onBack: () => calls++ });
    root.querySelector('[data-action="back"]').click();
    expect(calls).toBe(1);
  });
  it('shows the notice when given and not otherwise', () => {
    const withNotice = setup({ notice: 'Your data could not be read.' });
    expect(withNotice.querySelector('.notice').textContent).toBe(
      'Your data could not be read.',
    );
    expect(setup({}).querySelector('.notice')).toBeNull();
  });
});
