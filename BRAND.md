# OpenFreeyond brand

This file is the reference for every branding decision in the project. Read it before you change colours, type, logos or on-screen wording. When a change needs a new rule, update this file in the same commit. The builder decides changes to this file.

Origin: `assets/images/Gemini_Generated_Image_hw9uvthw9uvthw9u.jpeg` (git-ignored, not shipped). `scripts/make-brand-assets.mjs` cuts it into the files in `public/brand/`.

## Idea

A door that opens into a cozy place. The screens around the world are dark and softly glowing, like a doorway at night. The place behind the door stays warm and homely.

- **Branded:** start screen, confirm screen, intake form, loading cover, overlay panels and buttons in the world.
- **Not branded:** the 3D place itself (sky, ground, house, garden, lighting) keeps the warm look from `specs/world-visuals/`. Do not make the world dark or neon.
- The 3D character model keeps its own style. The hologram character in the source picture is an illustration only, shown on the start screen.

## Logo and wordmark

| File                                               | Use                                                                                                                                 |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `public/brand/wordmark.webp`                       | "OpenFreeyond" in white, teal and violet. Top of the start screen, small on other screens. Always with the alt text "OpenFreeyond". |
| `public/brand/door.webp`                           | The open-door mark. Start screen and loading cover.                                                                                 |
| `public/brand/character.webp`                      | Waving hologram illustration. Start screen only, decorative (empty alt text), hidden on narrow windows.                             |
| `public/brand/favicon.png`, `apple-touch-icon.png` | Tab icon and home-screen icon, from the door.                                                                                       |

Rules:

- Use the images only on the dark background (`--bg`). Their edges are faded into it with a CSS mask, so no box shows.
- Keep the aspect ratio. Do not stretch, recolour, rotate or add effects.
- Wordmark: at least 140 px wide. Door: at least 48 px wide. Leave free space around each of at least a quarter of its height.
- Never write the name as plain text in another colour scheme where the wordmark fits. In running text write "OpenFreeyond" (one word, capital O and F).

## Colours

Sampled from the source picture. CSS variables live in `src/ui/styles.css` (`:root`).

| Name      | Hex       | Variable   | Use                                        |
| --------- | --------- | ---------- | ------------------------------------------ |
| Night     | `#0b1024` | `--bg`     | Page background                            |
| Panel     | `#141b36` | `--panel`  | Cards, overlay panels, form fields         |
| Line      | `#2a3560` | `--line`   | Borders and dividers                       |
| Text      | `#e8f4fb` | `--text`   | Body text and headings                     |
| Muted     | `#a9b8d4` | `--muted`  | Secondary text                             |
| Teal      | `#34f8de` | `--teal`   | Primary buttons, focus ring, links, "Free" |
| Violet    | `#8a84fd` | `--violet` | Secondary accent, borders on hover, "yond" |
| Door blue | `#52ace9` | `--glow`   | Glow around buttons and panels             |
| Error     | `#ff8a8a` | `--error`  | Error messages                             |

Warm world colours (cream `#f6e9d2`, terracotta `#b5543a`, sky `#f6d9a8`) belong to the world and stay as they are in `src/world/`.

Contrast (WCAG ratio, 4.5 or more is required for body text):

| Pair                         | Ratio |
| ---------------------------- | ----- |
| Text on Night                | 16.8  |
| Muted on Night               | 9.4   |
| Teal on Night                | 14.0  |
| Violet on Night              | 6.1   |
| Night on Teal (button label) | 14.0  |
| Text on Panel                | 15.1  |
| Teal on Panel                | 12.6  |
| Violet on Panel              | 5.5   |
| Error on Night               | 8.3   |

Check any new pair before using it and add it here.

## Typography

- System font stack: `system-ui, sans-serif`. No web fonts, so the first visit stays light.
- Headings: weight 700. Body: 1rem, line height 1.5. Buttons: 1rem, weight 600.
- The wordmark is an image. Do not imitate it with text effects.

## UI rules

- **Primary button:** Teal background, Night label, 0.5 rem radius, soft glow on hover and focus. One primary button per screen group.
- **Secondary button:** transparent, Violet border, Text label.
- **Panels and form fields:** Panel background, Line border, 0.75 rem radius. Overlay panels over the world are translucent Panel (95 percent) so the world stays visible.
- **Focus:** a 3 px Teal outline with 2 px offset on every interactive element. Never remove it.
- **Glow:** `0 0 18px` of `--glow` at about 35 percent. Use it on buttons, the door mark and panels, nowhere else.
- **Motion:** only the loading door pulse. It stops when the person asks for reduced motion.
- **Loading cover:** Night background, the door mark pulsing, the text "Loading the place…".

## Voice

Short, friendly, plain English. Say what happens and what to do next. No jargon, no exclamation marks, no emoji. Examples: "Making a new character replaces the one kept in this browser", "Enter the place".

## Licence and source of the brand assets

The picture was generated with Google Gemini from the builder's prompt. The terms for public use of Gemini output have not been checked yet. Check them before the place goes online and record the result here. The brand files are not in `src/data/licences.js`, because that list covers only third-party assets under CC0 or CC-BY and its tests require a source link. The world assets keep their records there.

Status: **unverified**.
