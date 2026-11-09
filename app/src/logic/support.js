export const SUPPORTED_MESSAGE =
  'This browser is not supported. OpenFreeyond works in the latest Chrome, Firefox and Safari on a laptop.';

export function isSupportedBrowser({ userAgent, hasWebGL }) {
  if (!hasWebGL) return false;
  if (/Android|iPhone|iPad|Mobile/i.test(userAgent)) return false;
  return /Chrome\/|Firefox\/|Version\/[\d.]+.*Safari\//.test(userAgent);
}

export function detectWebGL(doc) {
  try {
    const canvas = doc.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}
