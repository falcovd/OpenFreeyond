import { describe, it, expect } from 'vitest';
import {
  renderStart,
  renderConfirm,
  renderIntake,
  renderMessage,
} from '../src/ui/screens.js';
import { HAIR_COLOURS } from '../src/logic/fields.js';

const root = () => document.createElement('div');

describe('renderStart', () => {
  it('shows one button per option (AC-5.3)', () => {
    const r = root();
    renderStart(r, {
      options: ['continue', 'make-new', 'try-out'],
      onChoose: () => {},
    });
    expect(r.querySelectorAll('button')).toHaveLength(3);
  });
  it('reports the chosen option (AC-5.1)', () => {
    const r = root();
    let chosen = null;
    renderStart(r, {
      options: ['make-new', 'try-out'],
      onChoose: (c) => (chosen = c),
    });
    r.querySelector('[data-choice="try-out"]').click();
    expect(chosen).toBe('try-out');
  });
});

describe('renderConfirm', () => {
  it('lets the person confirm or cancel (AC-5.5)', () => {
    const r = root();
    let answer = null;
    renderConfirm(r, {
      onYes: () => (answer = 'yes'),
      onNo: () => (answer = 'no'),
    });
    r.querySelector('[data-action="no"]').click();
    expect(answer).toBe('no');
    r.querySelector('[data-action="yes"]').click();
    expect(answer).toBe('yes');
  });
});

describe('renderIntake', () => {
  it('shows all seven fields, with the 8 hair colours as choices', () => {
    const r = root();
    renderIntake(r, {
      values: {},
      errors: {},
      onSubmit: () => {},
      onCancel: () => {},
    });
    for (const name of [
      'name',
      'age',
      'hair',
      'clothing',
      'character',
      'hobbies',
      'background',
      'voice',
      'environment',
    ]) {
      expect(r.querySelector(`[name="${name}"]`)).not.toBeNull();
    }
    expect(
      r.querySelectorAll('[name="hair"] option:not([value=""])'),
    ).toHaveLength(HAIR_COLOURS.length);
  });
  it('names the fields that have an error (AC-4.2, AC-4.3)', () => {
    const r = root();
    renderIntake(r, {
      values: {},
      errors: { age: 'Age must be a whole number from 18 to 120.' },
      onSubmit: () => {},
      onCancel: () => {},
    });
    expect(r.textContent).toContain(
      'Age must be a whole number from 18 to 120.',
    );
  });
  it('submits the entered values (AC-4.1)', () => {
    const r = root();
    let submitted = null;
    renderIntake(r, {
      values: {},
      errors: {},
      onSubmit: (v) => (submitted = v),
      onCancel: () => {},
    });
    r.querySelector('[name="name"]').value = 'Sam';
    r.querySelector('form').dispatchEvent(
      new Event('submit', { cancelable: true }),
    );
    expect(submitted.name).toBe('Sam');
  });
});

describe('renderMessage', () => {
  it('shows a message (AC-5.6)', () => {
    const r = root();
    renderMessage(r, 'Not supported');
    expect(r.textContent).toContain('Not supported');
  });
});
