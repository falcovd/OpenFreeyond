/* global process, console, Buffer */
// Usage: node scripts/make-backdrop.mjs <source image> <out.webp> [preview.png]
// Makes the backdrop strip (FR-9) from the one picture the Product Owner supplied (4128 x 1024, a row of
// European houses with sky above and a grass strip below):
//   1. the last part is cross-faded into the first part, so the strip repeats sideways without a seam;
//   2. the sky fades away through a soft vertical alpha gradient, so the place's own sky shows through
//      (roofs and trees stay opaque; there is no hard edge);
//   3. the result is resized to 2048 x 512 and written as alpha WebP.
import sharp from 'sharp';

// Size of the result (4 : 1, like the source).
const OUT_WIDTH = 2048;
const OUT_HEIGHT = 512;
// The last and the first part of the picture that are cross-faded.
const WRAP_FRACTION = 0.06;
// Alpha is 0 above SKY_CLEAR_BELOW and 1 below SKY_SOLID_BELOW (fractions of the height from the top),
// smooth in between. The far roofs and trees begin at about 0.26 of the height.
const SKY_CLEAR_BELOW = 0.14;
const SKY_SOLID_BELOW = 0.27;
// Pale, bluish-grey pixels inside the ramp are made a little more transparent than the ramp says
// (cloud and haze), so the ramp does not eat the roofs. 0 switches it off.
const SKY_TINT_WEIGHT = 0.35;

const [input, outFile, previewFile] = process.argv.slice(2);
if (!input || !outFile) {
  console.error(
    'Usage: node scripts/make-backdrop.mjs <source image> <out.webp> [preview.png]',
  );
  process.exit(1);
}

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

const { data, info } = await sharp(input, { limitInputPixels: false })
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const { width: W, height: H } = info;

// 1. Cross-fade the last part into the first part and drop it, so the right edge meets the left edge.
const overlap = Math.round(W * WRAP_FRACTION);
const width = W - overlap;
const rgba = Buffer.alloc(width * H * 4);
for (let y = 0; y < H; y++) {
  for (let x = 0; x < width; x++) {
    const o = (y * width + x) * 4;
    const a = (y * W + x) * 3; // head
    const t = x < overlap ? x / overlap : 1; // 0: all tail (continues the left neighbour), 1: all head
    const b = (y * W + width + x) * 3; // tail
    for (let c = 0; c < 3; c++)
      rgba[o + c] = Math.round(data[a + c] * t + data[b + c] * (1 - t));
    // 2. The sky fades through a vertical gradient.
    const r = rgba[o];
    const g = rgba[o + 1];
    const bl = rgba[o + 2];
    let alpha = smooth(SKY_CLEAR_BELOW, SKY_SOLID_BELOW, y / H);
    // Cloud and haze: light and bluish-grey (blue at least as strong as red, low spread).
    const light = (r + g + bl) / 3 / 255;
    const bluish = bl >= r && Math.max(r, g, bl) - Math.min(r, g, bl) < 60;
    if (bluish && alpha < 1) alpha *= 1 - SKY_TINT_WEIGHT * light;
    rgba[o + 3] = Math.round(alpha * 255);
  }
}

const image = sharp(rgba, {
  raw: { width, height: H, channels: 4 },
}).resize(OUT_WIDTH, OUT_HEIGHT, { kernel: 'lanczos3', fit: 'fill' });
// exact: keep the colour of transparent pixels, so no dark fringe shows where the picture fades.
await image
  .clone()
  .webp({ quality: 80, alphaQuality: 90, exact: true })
  .toFile(outFile);
if (previewFile) {
  // A flat preview on the horizon colour for looking at the result.
  await image
    .clone()
    .flatten({ background: '#cfe6f5' })
    .png()
    .toFile(previewFile);
}
console.log(`wrote ${outFile} (${OUT_WIDTH}x${OUT_HEIGHT}) from ${W}x${H}`);
