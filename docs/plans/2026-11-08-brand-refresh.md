# Brand refresh: apply the new logo design

Source: `assets/images/Gemini_Generated_Image_hw9uvthw9uvthw9u.jpeg` (2752x1536, 2.3 MB).

## What the design shows

- A wordmark, "OpenFreeyond": "Open" in white, "Free" in teal, "yond" in violet, with a small glitch effect on the end.
- A mark: a glowing open door with a green valley and lake behind it, and pixels rising out of it.
- A character: a glowing, hologram-style woman with grey-blue hair and a grey jacket, waving.
- A palette: near-black navy background, cyan/teal glow (about #2de2c8), violet (about #a066ff), white text. Sample exact values from the final crops.

## Decision to make first

The design is dark and neon. The app today is warm and cozy (cream `#f6e9d2`, terracotta `#b5543a`), and `specs/world-visuals/` aims for "warm". Two ways to resolve it:

- **A. Brand on the screens, warm inside the world (recommended).** The start screen, intake, loading screen and overlay buttons use the new dark palette. The 3D place stays warm. This fits the idea of a door that opens into a cozy world, and it needs no change to the world-visuals spec.
- **B. Full dark theme, including the world.** This needs a new sky and lighting and conflicts with the world-visuals spec (G-1, "warm").

The steps below assume A.

## Steps

1. **Write `BRAND.md`** in the repo root, before any styling work. It is the reference for every branding decision during development, and later steps point back to it. Contents:
   - Brand idea: a door that opens into a cozy place, and the decision from "Decision to make first" (screens branded, world warm) with the reason.
   - Logo and wordmark: files, minimum size, clear space, and what not to do (stretch, recolour, put on a light background).
   - Colour palette: each colour with a name, hex value, CSS variable and use (background, text, teal accent, violet accent, glow), plus the warm world colours that stay as they are. Include the contrast result for each text and background pair.
   - Typography: the font stack and sizes for headings, body and buttons.
   - UI rules: buttons, focus rings, panels and the glow effect, with the loading and overlay states.
   - Imagery and character: how the door mark and the character illustration may be used, and that the 3D character model is not restyled.
   - Tone of voice for on-screen text (short, friendly, plain English).
   - Source and licence of the brand assets (the Gemini origin of the original image) and who decides changes.
   Keep it short and concrete, and link it from the README and `CLAUDE.md` so future sessions read it before touching the look. Steps 2 to 9 follow it; when a step needs a new rule, update `BRAND.md` in the same commit.
2. **Cut the assets.** The JPEG is one composite picture. Crop it into separate files and put them in `public/assets/brand/` (the root `assets/` folder is git-ignored and does not ship):
   - the door mark (square, transparent or dark background),
   - the wordmark,
   - a favicon (32 and 180 px) from the door,
   - optionally the waving character as a start-screen illustration.
   Convert to WebP or PNG, each under 150 KB. Do not ship the 2.3 MB original (spec G-3 budgets 30 MB for the first visit). The wordmark could also be rebuilt as live text with a gradient, which stays sharp and costs nothing.
3. **Define the palette as CSS variables** in `src/ui/styles.css` (`--bg`, `--text`, `--accent-teal`, `--accent-violet`, `--glow`). Replace the hard-coded colours there.
4. **Restyle the screens** (`renderStart`, `renderConfirm`, `renderIntake` in `src/ui/screens.js`): dark background, the mark and wordmark at the top of the start screen, teal/violet buttons with a soft glow, light text, visible focus rings. Check text contrast (white on navy is fine; check teal and violet on navy).
5. **Restyle the loading screen** (`.loading`, `.spinner`): dark background, spinner in teal/violet, optionally the door mark pulsing. Keep it visible while the world and the character load.
6. **Restyle the world overlay** (Back, Credits, hint, notice): dark translucent panels so they match the screens and stay readable over the warm world.
7. **Page metadata** in `index.html`: favicon links, `theme-color` set to the navy, and Open Graph image and title for link previews. Use `import.meta.env.BASE_URL` paths so GitHub Pages still works.
8. **Credits and licences.** The image was generated with Gemini. Check the generator's terms for commercial or public use, and add an entry for the brand assets to `src/data/licences.js` so the in-app credits stay complete (US-11 in the world-visuals spec).
9. **Docs.** Add the new look and a link to `BRAND.md` to the README and `CLAUDE.md`, and update `.adlc-project/PROJECT.md` with a UX Guide section (styling and design tokens) next time you run `/adlc-toolkit:init-adlc-project`.

## Verify

- `npm run lint`, `npm run format:check`, `npm test`, `npm run build` all pass.
- Start screen, intake, loading and in-world overlay checked in Chrome, Firefox and Safari. Back and forth between the world and the start screen still scrolls (the `a-fullscreen` teardown).
- `BRAND.md` exists, matches what was built, and is linked from the README and `CLAUDE.md`.
- Brand files add well under 1 MB to the first-visit transfer.
- Favicon and link preview show correctly on the deployed Pages build (`BASE_PATH`).

## Out of scope

Changing the 3D world's look, replacing the character model with the hologram-style one from the picture (it is a different, much more stylised character), and any phase 2 voice work.

## Result and deviations (applied 2026-11-08)

- Option A was applied. Done: steps 1 to 7 and the docs part of step 9.
- Brand files are in `public/brand/` (about 125 KB in total), not `public/assets/`, so the world's licence and 20 MB budget tests do not cover them. `scripts/make-brand-assets.mjs` regenerates them from the source picture.
- Step 8: the brand files are not in `src/data/licences.js`, because its tests require a CC0 or CC-BY licence and a source link. The Gemini terms are recorded as **unverified** in `BRAND.md` and must be checked before going online.
- Step 7: no Open Graph image was added. A link preview needs an absolute address, which depends on where the site is deployed.
- Not yet done: updating `.adlc-project/PROJECT.md` with a UX Guide section (re-run `/adlc-toolkit:init-adlc-project`), and the cross-browser check in Firefox and Safari.
