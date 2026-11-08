// Loads every file of the manifest. Never rejects: a file that fails, or has not loaded after the
// limit, is listed in `failed` and the caller draws a plain colour or block for it (FR-16).
// This file must not import aframe, so it runs in unit tests.
export const LOAD_TIMEOUT_MS = 30000;

export function loadAssets(
  manifest,
  loaders,
  { timeoutMs = LOAD_TIMEOUT_MS, onProgress } = {},
) {
  return new Promise((resolve) => {
    const values = new Map();
    const failed = [];
    const pending = new Set(manifest.map((a) => a.id));
    let finished = false;
    let timer = null;

    const finish = (stalled) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      for (const id of pending) failed.push(id);
      resolve({ values, failed, stalled });
    };

    const settle = (id) => {
      pending.delete(id);
      onProgress?.(manifest.length - pending.size, manifest.length);
      if (pending.size === 0) finish(false);
    };

    if (manifest.length === 0) return finish(false);
    timer = setTimeout(() => finish(true), timeoutMs);

    for (const asset of manifest) {
      Promise.resolve()
        .then(() => loaders[asset.type](asset.url))
        .then(
          (value) => {
            if (finished) return;
            values.set(asset.id, value);
            settle(asset.id);
          },
          () => {
            if (finished) return;
            failed.push(asset.id);
            settle(asset.id);
          },
        );
    }
  });
}

export function failureMessage({ failed, stalled }) {
  if (stalled)
    return 'Some parts of the place took too long to load. Plain colours and shapes are shown where they are missing.';
  if (failed.length > 0)
    return 'Some parts of the place could not be loaded. Plain colours and shapes are shown where they are missing.';
  return '';
}
