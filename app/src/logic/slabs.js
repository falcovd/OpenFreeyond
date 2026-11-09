// Pure: where each paving slab goes. Local coordinates: x across the width (centred), y along the
// length from 0. Slabs are 60 cm across and 30 cm along, in stack bond. Whole slabs fill the width;
// only the last row can be partial (the end of the strip).
export const SLAB = { across: 0.6, along: 0.3, joint: 0.02 };

const round9 = (v) => Math.round(v * 1e9) / 1e9;

export function slabGrid({ width, length, slab = SLAB }) {
  const across = Math.round(width / slab.across);
  if (Math.abs(across * slab.across - width) > 1e-9)
    throw new Error(`width ${width} is not a whole number of slabs`);
  const rows = Math.ceil(length / slab.along - 1e-9);
  const slabs = [];
  for (let r = 0; r < rows; r++) {
    const y0 = r * slab.along;
    // Rounded so a whole row is exactly slab.along, not 0.3 plus 1e-15.
    const l = round9(Math.min(slab.along, length - y0));
    for (let c = 0; c < across; c++)
      slabs.push({
        x: -width / 2 + (c + 0.5) * slab.across,
        y: y0 + l / 2,
        w: slab.across,
        l,
      });
  }
  return { across, rows, slabs };
}
