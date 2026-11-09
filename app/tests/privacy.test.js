// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const LOGIC = new URL('../src/logic', import.meta.url).pathname;
const WORLD = new URL('../src/world', import.meta.url).pathname;
const UI = new URL('../src/ui', import.meta.url).pathname;
const MAIN = new URL('../src/main.js', import.meta.url).pathname;

const files = (dir) =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? files(p) : [p];
  });
const code = (p) =>
  readFileSync(p, 'utf8')
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');

const FORBIDDEN =
  /localStorage|sessionStorage|indexedDB|document\.cookie|sendBeacon|XMLHttpRequest|\bfetch\s*\(/;
const STORAGE = /localStorage|sessionStorage|indexedDB|document\.cookie/;
const ADDRESS = /https?:\/\//;

describe('the new look stores and sends nothing (NFR-3, AC-9.4, AC-9.5)', () => {
  it('never touches storage, cookies or the network from the world code', () => {
    for (const p of files(WORLD)) {
      expect(code(p), p).not.toMatch(FORBIDDEN);
    }
  });
  it('only loads files through the manifest, with no hard-coded outside address (AC-11.2)', () => {
    for (const p of files(WORLD)) {
      expect(code(p), p).not.toMatch(ADDRESS);
    }
  });
  it('keeps the scans able to fail', () => {
    expect("fetch('x')").toMatch(FORBIDDEN);
    expect('window.localStorage').toMatch(FORBIDDEN);
    expect('navigator.sendBeacon(u)').toMatch(FORBIDDEN);
    expect("load('https://x')").toMatch(ADDRESS);
    expect('// fetch(1)\nconst a = 1;'.replace(/\/\/.*$/gm, '')).not.toMatch(
      FORBIDDEN,
    );
  });
  it('scans a non-empty set of files', () => {
    expect(files(WORLD).length).toBeGreaterThan(5);
  });
});

describe('storage stays behind the phase 1 store (AC-9.4)', () => {
  it('does not touch storage from the ui or the entry point', () => {
    for (const p of [...files(UI), MAIN]) {
      expect(code(p), p).not.toMatch(STORAGE);
    }
  });
});

describe('the door and the TV store and send nothing (NFR-3, AC-8.1, AC-8.2)', () => {
  it('keeps storage and the network out of door.js, click.js and tv.js', () => {
    for (const f of ['door.js', 'click.js', 'tv.js'])
      expect(code(join(LOGIC, f)), f).not.toMatch(FORBIDDEN);
  });
  it('plays the TV clip without sound and never reaches for the microphone or camera', () => {
    const src =
      code(join(WORLD, 'builders/interior.js')) + code(join(WORLD, 'scene.js'));
    expect(src).toMatch(/muted\s*=\s*true/);
    expect(src).not.toMatch(/getUserMedia|AudioContext|\.volume\s*=/);
  });
});
