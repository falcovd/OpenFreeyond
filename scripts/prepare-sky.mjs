/* global process, console */
// Usage: node scripts/prepare-sky.mjs <equirectangular image> <out.jpg> <out.json> [width=4096]
// Makes the sky JPEG (2:1) and a small JSON file with the colour of the horizon and the
// direction of the sun. Directions use the mapping of the sky sphere in
// src/world/builders/sky.js: u = phi / 2pi, v = theta / pi (from the top),
// direction = (cos phi sin theta, cos theta, sin phi sin theta).
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';

const [input, outJpg, outJson, width = '4096'] = process.argv.slice(2);
if (!input || !outJpg || !outJson) {
  console.error(
    'Usage: node scripts/prepare-sky.mjs <input> <out.jpg> <out.json> [width]',
  );
  process.exit(1);
}
const W = Number(width);
const H = W / 2;

await sharp(input, { limitInputPixels: false })
  .resize(W, H, { fit: 'fill' })
  .jpeg({ quality: 82, mozjpeg: true })
  .toFile(outJpg);

// Analyse a small copy of the finished JPEG.
const AW = 512;
const AH = 256;
const { data } = await sharp(outJpg)
  .resize(AW, AH, { fit: 'fill' })
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const px = (x, y) => {
  const i = (y * AW + x) * 3;
  return [data[i], data[i + 1], data[i + 2]];
};

// Horizon colour: the mean of a band 2 to 8 degrees above the horizon.
const rowAt = (elevationDeg) => Math.round(((90 - elevationDeg) / 180) * AH);
const sum = [0, 0, 0];
let n = 0;
for (let y = rowAt(8); y <= rowAt(2); y++) {
  for (let x = 0; x < AW; x++) {
    const p = px(x, y);
    sum[0] += p[0];
    sum[1] += p[1];
    sum[2] += p[2];
    n++;
  }
}
const horizon =
  '#' +
  sum
    .map((s) =>
      Math.round(s / n)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('');

// Sun: the mean direction of the brightest pixels (within 2 percent of the maximum).
const luma = (p) => 0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2];
let max = 0;
for (let y = 0; y < AH; y++)
  for (let x = 0; x < AW; x++) max = Math.max(max, luma(px(x, y)));
const v = [0, 0, 0];
for (let y = 0; y < AH; y++) {
  for (let x = 0; x < AW; x++) {
    if (luma(px(x, y)) < max * 0.98) continue;
    const phi = 2 * Math.PI * ((x + 0.5) / AW);
    const theta = Math.PI * ((y + 0.5) / AH);
    v[0] += Math.cos(phi) * Math.sin(theta);
    v[1] += Math.cos(theta);
    v[2] += Math.sin(phi) * Math.sin(theta);
  }
}
const len = Math.hypot(...v);
const sun = v.map((c) => Math.round((c / len) * 10000) / 10000);

writeFileSync(outJson, JSON.stringify({ horizon, sun }, null, 2) + '\n');
console.log(`wrote ${outJpg} and ${outJson}`, { horizon, sun });
