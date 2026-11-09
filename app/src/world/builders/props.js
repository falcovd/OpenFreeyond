import { fitToBox, plainBlock } from './common.js';
import { STREET } from '../streetLayout.js';

// Parked cars and street lamps. They stand still, make no sound, are not lit and have no solid (the person
// can never reach the street). Without the model a plain block of the same size stands in (FR-16).
// A car's paint is the model's 'Body' material: each car clones it and takes the car's colour, so cars of
// one model do not share a material and the cached model stays as loaded.
function tintBody(THREE, object, colour) {
  if (!colour) return;
  object.traverse((o) => {
    if (!o.material) return;
    const tint = (m) => {
      if (m.name !== 'Body') return m;
      const c = m.clone();
      c.color.set(colour);
      return c;
    };
    o.material = Array.isArray(o.material)
      ? o.material.map(tint)
      : tint(o.material);
  });
}

function buildProp(THREE, assets, item, modelId, kind, y = 0, tint = false) {
  const model = assets.model(modelId);
  let g;
  if (model) {
    g = new THREE.Group();
    const copy = model.clone(true);
    if (tint) tintBody(THREE, copy, item.colour);
    g.add(
      fitToBox(THREE, copy, { w: item.w, d: item.d, h: item.h }, item.rot ?? 0),
    );
    g.position.set(item.x, y, item.z);
  } else {
    g = plainBlock(
      THREE,
      { ...item, kind, color: item.colour ?? item.color },
      'plain',
    );
    g.position.y += y;
  }
  g.userData.kind = kind;
  g.userData.noPick = true;
  return g;
}

export const buildCar = (THREE, assets, car) =>
  buildProp(THREE, assets, car, car.model, 'car', 0, true);

// Every lamp uses the one model 'lamp'. Lamps on the far side (rot PI) stand on the far sidewalk.
export const buildLamp = (THREE, assets, lamp) =>
  buildProp(
    THREE,
    assets,
    lamp,
    'lamp',
    'lamp',
    lamp.z > STREET.road.z1 ? STREET.farSidewalk.top : STREET.sidewalk.top,
  );
