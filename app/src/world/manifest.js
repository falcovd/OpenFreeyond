// Every file the place loads. All are served from the product's own address (FR-20, AC-11.2).
import { INTERIOR_ITEMS } from './layout.js';
import { furnitureTextureIds } from '../logic/furniture-textures.js';
import { TV_MODE } from './interiorConfig.js';

// The textures the furniture needs. They load with the interior, after the place is ready.
export const FURNITURE_TEXTURES = furnitureTextureIds();

const base = import.meta.env.BASE_URL;
const url = (path) => `${base}assets/${path}`;

export const MANIFEST = [
  { id: 'grass', type: 'texture', url: url('textures/grass.jpg') },
  { id: 'path', type: 'texture', url: url('textures/path.jpg') },
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
