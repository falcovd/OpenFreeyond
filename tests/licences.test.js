// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { ASSET_RECORDS, USABLE_LICENCES } from '../src/data/licences.js';

const ROOT = new URL('../public/assets', import.meta.url).pathname;

function files(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? files(p) : [p];
  });
}

describe('asset licence records (AC-11.1, AC-11.4)', () => {
  it('has a record for every shipped asset file, and no record without a file', () => {
    const shipped = files(ROOT)
      .map((p) => relative(ROOT, p))
      .filter((p) => !p.startsWith('.'))
      .sort();
    const recorded = ASSET_RECORDS.flatMap((r) => r.files).sort();
    expect(recorded).toEqual(shipped);
  });

  it('gives every record an author, a source link, the licence text and a usable licence', () => {
    for (const r of ASSET_RECORDS) {
      expect(r.author.trim(), r.files.join()).not.toBe('');
      expect(r.source, r.files.join()).toMatch(/^https:\/\//);
      expect(r.licenceText.trim().length, r.files.join()).toBeGreaterThan(20);
      expect(USABLE_LICENCES, r.files.join()).toContain(r.licence);
    }
  });

  it('requires a credit line for every CC-BY asset', () => {
    for (const r of ASSET_RECORDS.filter((x) =>
      x.licence.startsWith('CC-BY'),
    )) {
      expect(r.credit?.trim(), r.files.join()).toBeTruthy();
    }
  });

  it('records the character (AC-11.4)', () => {
    expect(ASSET_RECORDS.some((r) => r.files.includes('character.glb'))).toBe(
      true,
    );
  });

  it('lists unverified records so they are confirmed before going online', () => {
    for (const r of ASSET_RECORDS) {
      expect(['boolean', 'undefined'], r.files.join()).toContain(
        typeof r.verified,
      );
    }
    const unverified = ASSET_RECORDS.filter((r) => r.verified === false);
    for (const r of unverified) {
      expect(r.note?.trim(), r.files.join()).toBeTruthy();
    }
  });
});
