import { describe, it, expect } from 'vitest';
import {
  renderWorldOverlay,
  worldMessages,
  DOOR_HINT,
  DOOR_STEP_ASIDE,
} from '../src/ui/screens.js';

const setup = () => {
  const root = document.createElement('div');
  const overlay = renderWorldOverlay(root, {
    notice: null,
    showHint: false,
    onDismissHint() {},
    onBack() {},
  });
  return { root, messages: worldMessages(overlay) };
};

describe('door messages (FR-7, FR-8)', () => {
  it('shows and hides the door hint, one short sentence (AC-3.1, AC-3.2)', () => {
    const { root, messages } = setup();
    messages.setDoorHint(true);
    expect(root.querySelector('.door-hint').textContent).toBe(DOOR_HINT);
    expect(DOOR_HINT.split('.').filter(Boolean).length).toBe(1);
    messages.setDoorHint(true);
    expect(root.querySelectorAll('.door-hint').length).toBe(1);
    messages.setDoorHint(false);
    expect(root.querySelector('.door-hint')).toBeNull();
  });
  it('shows and hides the step-aside message (AC-3.3, AC-3.5)', () => {
    const { root, messages } = setup();
    messages.setStepAside(true);
    expect(root.querySelector('.door-step').textContent).toBe(DOOR_STEP_ASIDE);
    messages.setStepAside(false);
    expect(root.querySelector('.door-step')).toBeNull();
  });
  it('adds and updates a notice after the overlay is drawn (FR-23)', () => {
    const { root, messages } = setup();
    messages.setNotice('Something failed to load.');
    expect(root.querySelector('.notice').textContent).toBe(
      'Something failed to load.',
    );
    messages.setNotice('');
    expect(root.querySelector('.notice')).toBeNull();
  });
});
