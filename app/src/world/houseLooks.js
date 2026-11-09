// The four house shapes (OQ-1). Data only, no three. Each shape is 8 by 5 m.
// doorOffset: the front door's x from the house centre, in the house's own frame (before the turn by rot).
export const HOUSE_SIZE = { w: 8, d: 5, floorHeight: 2.5 };

export const LOOKS = {
  'brick-pitched': {
    file: 'models/houses/brick-pitched.glb',
    floors: 2,
    roof: 'pitched',
    facade: 'brick',
    doorOffset: -1.95,
  },
  'brick-stepped': {
    file: 'models/houses/brick-stepped.glb',
    floors: 3,
    roof: 'stepped',
    facade: 'brick',
    doorOffset: 1.6,
  },
  'render-pitched': {
    file: 'models/houses/render-pitched.glb',
    floors: 2,
    roof: 'pitched',
    facade: 'render',
    doorOffset: 1.95,
  },
  'render-stepped': {
    file: 'models/houses/render-stepped.glb',
    floors: 3,
    roof: 'stepped',
    facade: 'render',
    doorOffset: -1.6,
  },
};
