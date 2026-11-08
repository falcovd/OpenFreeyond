// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';

let release;
vi.mock('../src/ui/styles.css', () => ({}));

const tick = (ms = 20) => new Promise((r) => setTimeout(r, ms));

async function boot(mount) {
  vi.resetModules();
  vi.doMock('../src/world/scene.js', async () => ({ mountWorld: mount }));
  document.body.innerHTML = '<div id="app"></div>';
  await import('../src/main.js');
  await tick();
}

beforeEach(() => {
  localStorage.clear();
  Object.defineProperty(navigator, 'userAgent', {
    value: 'Mozilla/5.0 Chrome/120',
    configurable: true,
  });
  HTMLCanvasElement.prototype.getContext = () => ({});
});

describe('loading indicator (FR-15)', () => {
  it('shows from the moment the person chooses and goes when the place is ready (AC-8.1, AC-8.2)', async () => {
    const gate = new Promise((r) => {
      release = r;
    });
    await boot(async (container) => {
      await gate;
      const el = document.createElement('div');
      el.className = 'world';
      container.appendChild(el);
      return { destroy: () => el.remove() };
    });
    document.querySelector('[data-choice="try-out"]').click();
    await tick();
    expect(document.querySelector('.loading')).not.toBeNull();
    release();
    await tick();
    expect(document.querySelector('.loading')).toBeNull();
    expect(document.querySelector('.world')).not.toBeNull();
  });

  it('removes the indicator after 30 seconds even when the place never gets ready (AC-8.6)', async () => {
    await boot(() => new Promise(() => {}));
    // Fake timers only after boot: boot waits on a real timeout.
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    try {
      document.querySelector('[data-choice="try-out"]').click();
      await vi.advanceTimersByTimeAsync(50);
      expect(document.querySelector('.loading')).not.toBeNull();
      await vi.advanceTimersByTimeAsync(30000);
      expect(document.querySelector('.loading')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('tells the world when the person chose, so its limits count from then (AC-8.6)', async () => {
    let options;
    await boot(async (container, _character, opts) => {
      options = opts;
      const el = document.createElement('div');
      el.className = 'world';
      container.appendChild(el);
      return { destroy: () => el.remove() };
    });
    const before = Date.now();
    document.querySelector('[data-choice="try-out"]').click();
    await tick();
    expect(options.startedAt).toBeGreaterThanOrEqual(before);
    expect(options.startedAt).toBeLessThanOrEqual(Date.now());
  });

  it('shows the short message when assets failed (AC-8.3)', async () => {
    await boot(async (container) => {
      const el = document.createElement('div');
      el.className = 'world';
      container.appendChild(el);
      return {
        destroy: () => el.remove(),
        warning: 'Some parts of the place could not be loaded.',
      };
    });
    document.querySelector('[data-choice="try-out"]').click();
    await tick();
    expect(document.querySelector('.notice').textContent).toMatch(
      /could not be loaded/,
    );
  });
});
