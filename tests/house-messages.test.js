import { describe, it, expect } from 'vitest';
import {
  HOUSE_FAILED_MESSAGE,
  INTERIOR_FAILED_MESSAGE,
} from '../src/world/assetLoader.js';

describe('house load messages (FR-21, FR-23)', () => {
  it('are one short sentence each', () => {
    for (const m of [HOUSE_FAILED_MESSAGE, INTERIOR_FAILED_MESSAGE])
      expect(m.split('.').filter(Boolean).length).toBe(1);
  });
});
