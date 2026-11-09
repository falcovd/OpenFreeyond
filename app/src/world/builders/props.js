import { fitToBox, plainBlock } from './common.js';

// Parked cars and street lamps. They stand still, make no sound, are not lit and have no solid (the person
// can never reach the street). Without the model a plain block of the same size stands in (FR-16).
function buildProp(THREE, assets, item, modelId, kind) {
  const model = assets.model(modelId);
  let g;
  if (model) {
    g = new THREE.Group();
    g.add(
      fitToBox(
        THREE,
        model.clone(true),
        { w: item.w, d: item.d, h: item.h },
        item.rot ?? 0,
      ),
    );
    g.position.set(item.x, 0, item.z);
  } else {
    g = plainBlock(THREE, { ...item, kind }, 'plain');
  }
  g.userData.kind = kind;
  g.userData.noPick = true;
  return g;
}

export const buildCar = (THREE, assets, car) =>
  buildProp(THREE, assets, car, car.id, 'car');

// Every lamp uses the one model 'lamp'.
export const buildLamp = (THREE, assets, lamp) =>
  buildProp(THREE, assets, lamp, 'lamp', 'lamp');
