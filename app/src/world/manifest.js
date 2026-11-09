// Every file the place loads. All are served from the product's own address (FR-20, AC-11.2).
import { INTERIOR_ITEMS } from './layout.js';
import { furnitureTextureIds } from '../logic/furniture-textures.js';
import { TV_MODE } from './interiorConfig.js';
import { STREET_CARS, STREET_LAMPS } from './streetConfig.js';

// The textures the furniture needs. They load with the interior, after the place is ready.
export const FURNITURE_TEXTURES = furnitureTextureIds();

const base = import.meta.env.BASE_URL;
const url = (path) => `${base}assets/${path}`;

// The street models that exist (FR-16). Add an id here when its file is added under models/street/;
// tests/manifest.test.js fails if a listed file is missing. An item without a file is drawn as a plain block.
const STREET_MODEL_IDS = ['car-1', 'car-2', 'car-3', 'lamp'];

// Only the models the build switches use: car-1..car-N for N = STREET_CARS, and 'lamp' when STREET_LAMPS >= 1.
export function streetManifest(
  cars = STREET_CARS,
  lamps = STREET_LAMPS,
  ids = STREET_MODEL_IDS,
) {
  return ids
    .filter((id) => {
      if (id === 'lamp') return lamps >= 1;
      const n = /^car-(\d+)$/.exec(id)?.[1];
      return n !== undefined && Number(n) <= cars;
    })
    .map((id) => ({ id, type: 'model', url: url(`models/street/${id}.glb`) }));
}

export const MANIFEST = [
  { id: 'grass', type: 'texture', url: url('textures/grass.jpg') },
  { id: 'paving', type: 'texture', url: url('textures/paving.jpg') },
  { id: 'asphalt', type: 'texture', url: url('textures/asphalt.jpg') },
  { id: 'wood', type: 'texture', url: url('textures/wood.jpg') },
  { id: 'soil', type: 'texture', url: url('textures/soil.jpg') },
  { id: 'brick', type: 'texture', url: url('textures/brick.jpg') },
  { id: 'roof', type: 'texture', url: url('textures/roof.jpg') },
  { id: 'wallpaper', type: 'texture', url: url('textures/wallpaper.jpg') },
  { id: 'sky', type: 'texture', url: url('textures/sky.jpg') },
  { id: 'tree-round', type: 'model', url: url('models/tree-round.glb') },
  { id: 'tree-pine', type: 'model', url: url('models/tree-pine.glb') },
  { id: 'bush', type: 'model', url: url('models/bush.glb') },
  { id: 'house', type: 'model', url: url('models/house.glb') },
  { id: 'character', type: 'model', url: url('character.glb') },
  ...streetManifest(),
];

// The interior loads after the place is ready (OQ-3). One entry per file: the two pendants share one.
// A model entry's id is the id of the first item that uses the file; itemsForFile finds them all.
export function interiorManifest(tvMode = TV_MODE) {
  const seen = new Set();
  const models = INTERIOR_ITEMS.filter((i) => i.file)
    .map((i) => ({ id: i.id, type: 'model', url: url(i.file) }))
    .filter((m) => (seen.has(m.url) ? false : seen.add(m.url)));
  return [
    ...models,
    ...FURNITURE_TEXTURES.map((id) => ({
      id,
      type: 'texture',
      url: url(`textures/${id}.jpg`),
    })),
    { id: 'tv-still', type: 'texture', url: url('interior/tv-still.jpg') },
    ...(tvMode === 'clip'
      ? [{ id: 'tv-clip', type: 'video', url: url('interior/tv-clip.mp4') }]
      : []),
  ];
}

// Every interior item that uses the file at this URL.
export function itemsForFile(fileUrl) {
  return INTERIOR_ITEMS.filter((i) => i.file && url(i.file) === fileUrl);
}
