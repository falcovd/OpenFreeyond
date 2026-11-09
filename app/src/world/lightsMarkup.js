// Markup for the warm lights in the house (FR-14). No aframe import, so it runs in unit tests.
// A light with a value that is not a plain colour or a finite number is skipped, never written.
const COLOUR = /^#[0-9a-f]{6}$/i;
const NUMBERS = ['x', 'y', 'z', 'intensity', 'distance'];

export function lightsMarkup(lights) {
  return lights
    .filter(
      (l) =>
        COLOUR.test(l.color) && NUMBERS.every((k) => Number.isFinite(l[k])),
    )
    .map(
      (l) =>
        `<a-light type="point" color="${l.color}" intensity="${l.intensity}" distance="${l.distance}" decay="2" position="${l.x} ${l.y} ${l.z}"></a-light>`,
    )
    .join('\n      ');
}
