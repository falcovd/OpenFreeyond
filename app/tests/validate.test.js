import { describe, it, expect } from 'vitest';
import { validateIntake, normalizeIntake } from '../src/logic/validate.js';
import {
  HAIR_COLOURS,
  CLOTHING_COLOURS,
  VOICES,
  ENVIRONMENTS,
} from '../src/logic/fields.js';

const valid = () => ({
  name: 'Sam',
  age: '30',
  hair: HAIR_COLOURS[0].id,
  clothing: CLOTHING_COLOURS[0].id,
  character: 'Calm',
  hobbies: 'Reading',
  background: 'Lives in a small house.',
  voice: VOICES[0].id,
  environment: ENVIRONMENTS[0].id,
});

describe('field sets', () => {
  it('offers 8 hair colours, 8 clothing colours, 3 voices and 1 environment', () => {
    expect(HAIR_COLOURS).toHaveLength(8);
    expect(CLOTHING_COLOURS).toHaveLength(8);
    expect(VOICES).toHaveLength(3);
    expect(ENVIRONMENTS).toHaveLength(1);
  });
});

describe('validateIntake', () => {
  it('accepts a complete valid intake (AC-4.1)', () => {
    expect(validateIntake(valid())).toEqual({ ok: true, errors: {} });
  });
  it('names each empty field (AC-4.2)', () => {
    for (const key of ['name', 'age', 'character', 'hobbies', 'background']) {
      const input = { ...valid(), [key]: '   ' };
      const result = validateIntake(input);
      expect(result.ok).toBe(false);
      expect(Object.keys(result.errors)).toEqual([key]);
    }
  });
  it('does not throw on non-object input and names every field', () => {
    for (const input of [null, undefined, 42, 'text', []]) {
      let result;
      expect(() => {
        result = validateIntake(input);
      }).not.toThrow();
      expect(result.ok).toBe(false);
      for (const key of [
        'name',
        'age',
        'appearance',
        'character',
        'hobbies',
        'background',
        'voice',
        'environment',
      ])
        expect(result.errors).toHaveProperty(key);
    }
  });
  it('names appearance, voice and environment when missing', () => {
    expect(validateIntake({ ...valid(), hair: '' }).errors).toHaveProperty(
      'appearance',
    );
    expect(validateIntake({ ...valid(), clothing: '' }).errors).toHaveProperty(
      'appearance',
    );
    expect(validateIntake({ ...valid(), voice: '' }).errors).toHaveProperty(
      'voice',
    );
    expect(
      validateIntake({ ...valid(), environment: '' }).errors,
    ).toHaveProperty('environment');
  });
  it('rejects ages that are not whole numbers from 18 to 120 (AC-4.3)', () => {
    for (const age of ['17', '121', '30.5', 'abc', '-20']) {
      expect(validateIntake({ ...valid(), age }).errors).toHaveProperty('age');
    }
    for (const age of ['18', '120', 34]) {
      expect(validateIntake({ ...valid(), age }).ok).toBe(true);
    }
  });
  it('rejects text longer than 500 characters (AC-4.3)', () => {
    const long = 'a'.repeat(501);
    expect(
      validateIntake({ ...valid(), background: long }).errors,
    ).toHaveProperty('background');
    expect(validateIntake({ ...valid(), background: 'a'.repeat(500) }).ok).toBe(
      true,
    );
  });
});

describe('normalizeIntake', () => {
  it('trims text and turns age into a number', () => {
    const out = normalizeIntake({ ...valid(), name: '  Sam  ', age: ' 30 ' });
    expect(out.name).toBe('Sam');
    expect(out.age).toBe(30);
    expect(validateIntake(out).ok).toBe(true);
  });
});
