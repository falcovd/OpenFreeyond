// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';

const KEY = 'openfreeyond.character.v1';
const mounts = [];
let gate = null; // when set, the scene module import waits for it

vi.mock('../src/ui/styles.css', () => ({}));
const sceneModule = async () => {
  if (gate) await gate;
  return {
    mountWorld: (container, character) => {
      const el = document.createElement('div');
      el.className = 'world';
      container.appendChild(el);
      const mount = { character, destroyed: false };
      mount.destroy = () => {
        mount.destroyed = true;
        el.remove();
      };
      mounts.push(mount);
      return mount;
    },
  };
};

const app = () => document.getElementById('app');
const tick = () => new Promise((r) => setTimeout(r, 20));
const choices = () =>
  [...app().querySelectorAll('[data-choice]')].map((b) => b.dataset.choice);
const field = (name) => app().querySelector(`[name="${name}"]`);

async function boot() {
  vi.resetModules();
  vi.doMock('../src/world/scene.js', sceneModule); // re-run the factory so `gate` applies
  document.body.innerHTML = '<div id="app"></div>';
  await import('../src/main.js');
  await tick();
}
async function click(selector) {
  app().querySelector(selector).click();
  await tick();
}
async function submitValid(name = 'Sam') {
  const first = (n) => field(n).querySelector('option:not([value=""])').value;
  field('name').value = name;
  field('age').value = '30';
  for (const n of ['hair', 'clothing', 'voice', 'environment']) {
    field(n).value = first(n);
  }
  for (const n of ['character', 'hobbies', 'background']) field(n).value = 'x';
  app()
    .querySelector('form')
    .dispatchEvent(new Event('submit', { cancelable: true }));
  await tick();
}

beforeEach(() => {
  localStorage.clear();
  mounts.length = 0;
  gate = null;
  Object.defineProperty(navigator, 'userAgent', {
    value: 'Mozilla/5.0 Chrome/120',
    configurable: true,
  });
  HTMLCanvasElement.prototype.getContext = () => ({});
});

describe('main flow', () => {
  it('fresh start shows two options', async () => {
    await boot();
    expect(choices()).toEqual(['make-new', 'try-out']);
  });

  it('try-out mounts the example character and stores nothing', async () => {
    await boot();
    await click('[data-choice="try-out"]');
    expect(mounts).toHaveLength(1);
    expect(mounts[0].character.name).toBe('Noor de Wit');
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('an empty intake field is named and nothing is mounted', async () => {
    await boot();
    await click('[data-choice="make-new"]');
    await submitValid('');
    expect(app().textContent).toMatch(/name/i);
    expect(mounts).toHaveLength(0);
  });

  it('a valid intake mounts and stores; Continue restores the same colours', async () => {
    await boot();
    await click('[data-choice="make-new"]');
    await submitValid();
    const stored = JSON.parse(localStorage.getItem(KEY));
    expect(mounts).toHaveLength(1);
    expect(mounts[0].character.hair).toBe(stored.hair);
    expect(mounts[0].character.clothing).toBe(stored.clothing);

    await boot();
    expect(choices()).toEqual(['continue', 'make-new', 'try-out']);
    await click('[data-choice="continue"]');
    expect(mounts.at(-1).character.hair).toBe(stored.hair);
    expect(mounts.at(-1).character.clothing).toBe(stored.clothing);
  });

  it('a broken stored value shows the example character with the notice', async () => {
    localStorage.setItem(KEY, '{broken');
    await boot();
    expect(mounts[0].character.name).toBe('Noor de Wit');
    expect(app().querySelector('.notice').textContent).toMatch(
      /could not be read/,
    );
  });

  it('a slow world load does not replace a newer screen', async () => {
    let release;
    gate = new Promise((resolve) => (release = resolve));
    await boot();
    app().querySelector('[data-choice="try-out"]').click();
    app().querySelector('[data-choice="make-new"]').click();
    await tick();
    expect(app().querySelector('form')).not.toBeNull();

    release();
    await tick();
    expect(app().querySelector('form')).not.toBeNull();
    expect(mounts).toHaveLength(0);
  });
});
