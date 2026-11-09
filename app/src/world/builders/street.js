import { STREET } from '../streetLayout.js';
import { buildSlabs, SLAB_UNDER } from './slabs.js';
import { surface, box } from './common.js';

const DASH = { on: 3, off: 3, w: 0.12, y: 0.02 };

// Layers 1 to 2 cm apart would fight for depth at a distance; a polygon offset pulls the upper one forward.
function offset(material, units) {
  material.polygonOffset = true;
  material.polygonOffsetFactor = units;
  material.polygonOffsetUnits = units;
  return material;
}

function tag(object, kind) {
  object.userData.kind = kind;
  return object;
}

// The street beyond the front fence: sidewalk of slabs on a platform, a curb, the road, a dashed
// centre line and the same curb and sidewalk on the far side. Along the street is world x; the street is data only and nothing in it can be reached.
export function buildStreet(THREE, assets) {
  const { sidewalk, curb, road, length, farSidewalk, farCurb } = STREET;
  const g = new THREE.Group();
  g.userData.kind = 'street';
  g.userData.noPick = true;

  // A sidewalk (slab strip on a platform) and its curb. The near and the far side are the same build.
  const addSide = (sidewalk, curb) => {
    // The slab strip's local z (along it) runs along world x, local x across it runs to -z.
    const slabs = buildSlabs(THREE, assets, {
      width: sidewalk.w,
      length,
      texture: 'paving',
      fallback: '#b9b3a8',
      kind: 'street-slab',
      top: sidewalk.top,
    });
    slabs.rotation.y = Math.PI / 2;
    slabs.position.set(-length / 2, 0, (sidewalk.z0 + sidewalk.z1) / 2);
    g.add(slabs);

    // The platform under the slabs, so the sidewalk does not float.
    // Its top is the height of the slab underlay (see slabs.js), so no gap and no 5 mm step.
    const platformH = sidewalk.top - SLAB_UNDER;
    g.add(
      tag(
        box(
          THREE,
          length,
          platformH,
          sidewalk.w,
          new THREE.MeshStandardMaterial({ color: '#a8a39a', roughness: 1 }),
          0,
          platformH / 2,
          (sidewalk.z0 + sidewalk.z1) / 2,
        ),
        'street-slab',
      ),
    );

    g.add(
      tag(
        box(
          THREE,
          length,
          curb.h,
          curb.w,
          surface(THREE, assets, 'paving', '#c4c0b8', {
            repeat: [length / 0.6, 1],
          }),
          0,
          curb.h / 2,
          (curb.z0 + curb.z1) / 2,
        ),
        'curb',
      ),
    );
  };
  addSide(sidewalk, curb);

  // Asphalt repeats every 4 m both ways, so the tiles stay square.
  const roadMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(length, road.w),
    offset(
      surface(THREE, assets, 'asphalt', '#4a4d52', {
        repeat: [length / 4, road.w / 4],
      }),
      -2,
    ),
  );
  roadMesh.rotation.x = -Math.PI / 2;
  roadMesh.position.set(0, 0.01, (road.z0 + road.z1) / 2);
  g.add(tag(roadMesh, 'road'));

  const period = DASH.on + DASH.off;
  const count = Math.floor(length / period);
  const dashGeo = new THREE.PlaneGeometry(DASH.on, DASH.w);
  dashGeo.rotateX(-Math.PI / 2);
  const dashes = new THREE.InstancedMesh(
    dashGeo,
    offset(
      new THREE.MeshStandardMaterial({ color: '#f2f0e6', roughness: 1 }),
      -4,
    ),
    count,
  );
  const m = new THREE.Matrix4();
  for (let i = 0; i < count; i++) {
    m.makeTranslation(
      -length / 2 + i * period + DASH.on / 2,
      DASH.y,
      STREET.centreLineZ,
    );
    dashes.setMatrixAt(i, m);
  }
  dashes.instanceMatrix.needsUpdate = true;
  g.add(tag(dashes, 'road'));

  addSide(farSidewalk, farCurb); // scenery on the far side of the road (D-27)
  return g;
}
