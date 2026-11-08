// Every file the place loads. All are served from the product's own address (FR-20, AC-11.2).
const base = import.meta.env.BASE_URL;
const url = (path) => `${base}assets/${path}`;

export const MANIFEST = [
  { id: 'grass', type: 'texture', url: url('textures/grass.jpg') },
  { id: 'path', type: 'texture', url: url('textures/path.jpg') },
  { id: 'wood', type: 'texture', url: url('textures/wood.jpg') },
  { id: 'brick', type: 'texture', url: url('textures/brick.jpg') },
  { id: 'roof', type: 'texture', url: url('textures/roof.jpg') },
  { id: 'sky', type: 'texture', url: url('textures/sky.jpg') },
  { id: 'tree-round', type: 'model', url: url('models/tree-round.glb') },
  { id: 'tree-pine', type: 'model', url: url('models/tree-pine.glb') },
  { id: 'bush', type: 'model', url: url('models/bush.glb') },
  { id: 'character', type: 'model', url: url('character.glb') },
];
