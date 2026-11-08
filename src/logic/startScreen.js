export const EXAMPLE_CHARACTER = Object.freeze({
  name: 'Noor de Wit',
  age: 34,
  hair: 'dark-blond',
  clothing: 'moss-green',
  character: 'Spontaneous, curious, dry humour',
  hobbies:
    'Bouldering, festivals, gaming with friends, vintage shopping, city trips',
  background:
    'Works as a baker, has lived for two years in a small house with a garden by the water and goes on a city trip with friends as often as possible.',
  voice: 'soft-friendly',
  environment: 'house-garden-street',
});

export function startOptions(loadResult) {
  return loadResult.status === 'ok'
    ? ['continue', 'make-new', 'try-out']
    : ['make-new', 'try-out'];
}

export function resolveChoice(choice, loadResult) {
  const kept = loadResult.status === 'ok';
  if (choice === 'try-out') {
    return { action: 'enter', character: EXAMPLE_CHARACTER, tryOut: true };
  }
  if (choice === 'continue') {
    return kept
      ? { action: 'enter', character: loadResult.data, tryOut: false }
      : { action: 'stay' };
  }
  if (choice === 'make-new') {
    return kept ? { action: 'confirm-replace' } : { action: 'intake' };
  }
  return { action: 'stay' };
}
