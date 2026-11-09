/* global console, process, Buffer */
// Cuts the brand picture into the small files the site uses, in public/brand/.
// Usage: node scripts/make-brand-assets.mjs [source.jpeg]
// The source sits in the git-ignored source-assets/ folder. `sharp` is only available
// through a transitive dev dependency, so run `npm ci` first.
import sharp from 'sharp';
import fs from 'fs';

const source =
  process.argv[2] ??
  'source-assets/images/Gemini_Generated_Image_hw9uvthw9uvthw9u.jpeg';
const out = 'public/brand';
fs.mkdirSync(out, { recursive: true });

// Regions of the 2752x1536 source: [left, top, width, height].
const DOOR = [740, 200, 560, 790];
const WORDMARK = [220, 995, 1590, 250];
const CHARACTER = [1770, 220, 930, 1316];
const DOOR_SQUARE = [770, 460, 520, 520];

const crop = ([left, top, width, height]) =>
  sharp(source).extract({ left, top, width, height });

// The wordmark's last letters reach into the character's region of the source.
// Paint that corner with the background colour, feathered, before cropping.
async function character() {
  const [left, top, width, height] = CHARACTER;
  const patch = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <filter id="f"><feGaussianBlur stdDeviation="14"/></filter>
      <rect x="-60" y="${985 - top}" width="${1800 - left + 60}" height="${1240 - 985}" fill="#0b1630" filter="url(#f)"/>
    </svg>`,
  );
  const base = await crop(CHARACTER).toBuffer();
  // sharp resizes before it composites, so paint at full size first.
  const painted = await sharp(base)
    .composite([
      { input: await sharp(patch, { density: 72 }).png().toBuffer() },
    ])
    .toBuffer();
  return sharp(painted).resize({ width: 520 }).webp({ quality: 80 });
}

const files = {
  'door.webp': crop(DOOR).resize({ width: 420 }).webp({ quality: 82 }),
  'wordmark.webp': crop(WORDMARK).resize({ width: 880 }).webp({ quality: 85 }),
  'character.webp': await character(),
  'favicon.png': crop(DOOR_SQUARE).resize(64, 64).png({ compressionLevel: 9 }),
  'apple-touch-icon.png': crop(DOOR_SQUARE)
    .resize(180, 180)
    .png({ compressionLevel: 9 }),
};
for (const [name, image] of Object.entries(files)) {
  const info = await image.toFile(`${out}/${name}`);
  console.log(name, `${info.width}x${info.height}`, `${info.size} bytes`);
}
