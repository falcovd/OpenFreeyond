// What the TV screen shows. clip: none | loading | ready | blocked | failed. still: loading | ready | failed.
export function tvSource({ mode, clip, still }) {
  if (mode === 'clip' && clip === 'ready') return 'clip';
  return still === 'ready' ? 'still' : 'dark';
}
