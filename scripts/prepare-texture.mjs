/* global process, console */
// Usage: node scripts/prepare-texture.mjs <input image> <output.jpg> [size=1024]
// Makes a square JPEG at most <size> px (OQ-4: JPEG, at most 1024 px).
import sharp from 'sharp';

const [input, output, size = '1024'] = process.argv.slice(2);
if (!input || !output) {
  console.error(
    'Usage: node scripts/prepare-texture.mjs <input> <output.jpg> [size]',
  );
  process.exit(1);
}
const px = Math.min(Number(size), 1024);
await sharp(input)
  .resize(px, px, { fit: 'cover' })
  .jpeg({ quality: 80, mozjpeg: true })
  .toFile(output);
console.log(`wrote ${output}`);
