# OpenFreeyond Phase 1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build phase 1 of OpenFreeyond: a walkable cozy 3D place in the desktop browser with a character, a try-out, a seven-field intake kept in the person's own browser, and the outside-the-product routines for interviews and weekly notes.

**Architecture:** Plain JavaScript modules. All rules (validation, storage, start-screen choices, collision, support check, colour mapping) are pure functions in `src/logic/` and `src/world/layout.js`, unit tested with Vitest. A thin A-Frame layer in `src/world/` renders the place and the character from that data. A thin DOM layer in `src/ui/` and `src/main.js` wires screens to the logic. The 3D scene itself is checked by hand, as the project plan says. The built site is static and is hosted on GitHub Pages.

**Tech Stack:** JavaScript (ES modules), Vite, A-Frame (three.js), Vitest + jsdom, ESLint, Prettier, Docker (dev container, nginx for the production build), GitHub Actions, GitHub Pages. Source of these choices: `plans/project-plan.md` (no `.adlc-project/PROJECT.md` exists).

**Spec:** `specs/openfreeyond-companion/spec.md` (v1). Do not change it. If something is wrong or unclear, stop and ask.

---

## Decisions this plan settles

- **OQ-3 (hosting): GitHub Pages.** It is free (assumption A-7), static, and named as the simplest candidate in `plans/project-plan.md`. Task 11 sets it up. If it fails, the PO revisits A-7.
- **"Seven intake fields":** name and age (one field), appearance (hair and clothing colour), character, hobbies, background story, voice, living environment. This follows the plan's field table and FR-8.
- **Placeholder choices (spec OQ-1, product, builder decides):** the 8 hair colours, 8 clothing colours and 3 voice names in Task 2 are placeholders. The builder replaces them in `src/logic/fields.js` before going online. The example character's colours must stay in the sets.
- **Character model: `assets/models/Casual_Hoodie.fbx`** (checked on 2026-11-08). It has flat-colour materials without textures, about 18.6k vertices, a separate `Hair` material, a `Purple` material for the hoodie and shoes, and a clip named `Idle`. The app recolours hair through `Hair` and clothing through `Purple`. The trousers (`LightBlue`) stay as they are. `Casual.fbx` was rejected: its hair and clothing materials are less clean.
- **Source assets stay out of git:** `assets/` holds the source files and is ignored by git. Only the converted `public/assets/character.glb` is committed. The Downtown City MegaKit and the zip files are not used by this plan (they are neither used nor deleted by it).
- **Unsupported browser:** supported means a desktop Chrome, Firefox or Safari user agent with WebGL. Edge (Chromium) passes the check because its agent string contains Chrome. The spec lists only three browsers, so the PO can tighten this later.
- **Broken kept data (AC-4.6):** on the first load with broken data the example character loads in the place with a message. The person can go back to the start screen with the "Back to start" button; the start screen then treats the data as none. A new intake overwrites it.
- **"Make a new character" (AC-5.5):** a confirmation is shown first. The kept answers are replaced when the new intake is saved.
- **Frame-rate display (AC-1.6):** the scene shows A-Frame's `stats` panel when the address has `?stats`.

## Not in this plan (flag)

- Furniture and house models: the place uses simple shapes (Task 7). Replacing them with models is not planned.
- The character's licence: the folder has no licence file for the character. The builder checks it (Task 8, Step 1) before the model goes online.
- Anything in spec "Out of Scope".

---

## Task 0: Project, tooling, Docker and CI (enabler, delivers no spec ID)

**Files:**
- Create: `package.json`, `vite.config.js`, `eslint.config.js`, `.prettierrc`, `.gitignore`, `.dockerignore`, `Dockerfile`, `docker-compose.yml`, `nginx.conf`, `index.html`, `.github/workflows/ci.yml`, `src/main.js`, `tests/smoke.test.js`

**Step 1: Initialise git and npm**

Run:
```bash
cd /Users/falco.vandooremolen/PRIVE/Projects/OpenFreeyond
git init
npm init -y
npm install --save-exact aframe@1.6.0
npm install --save-dev vite vitest jsdom eslint @eslint/js globals prettier three@0.170.0
```
Expected: `package.json` and `node_modules/` exist. (If a newer 1.x A-Frame is preferred, install it instead and keep it pinned.)

**Step 2: Write `package.json` scripts and module type**

Edit `package.json` so these keys exist (keep the installed dependency versions):
```json
{
  "name": "openfreeyond",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "lint": "eslint .",
    "format": "prettier --write ."
  }
}
```

**Step 3: Write the config files**

`vite.config.js`:
```js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: process.env.BASE_PATH || '/',
  server: { host: true, port: 5173 },
  test: { environment: 'jsdom', include: ['tests/**/*.test.js'] },
});
```

`eslint.config.js`:
```js
import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['dist/', 'node_modules/'] },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node, AFRAME: 'readonly' },
    },
  },
];
```

`.prettierrc`:
```json
{ "singleQuote": true }
```

`.gitignore`:
```
node_modules/
dist/
assets/
```

`.dockerignore`:
```
node_modules
dist
.git
assets
```

`index.html`:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>OpenFreeyond</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

`src/main.js` (temporary):
```js
document.getElementById('app').textContent = 'OpenFreeyond';
```

`tests/smoke.test.js`:
```js
import { describe, it, expect } from 'vitest';

describe('tooling', () => {
  it('runs tests', () => {
    expect(1 + 1).toBe(2);
  });
});
```

**Step 4: Write the Docker and CI files**

`Dockerfile`:
```dockerfile
FROM node:22-alpine AS dev
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev"]

FROM dev AS build
RUN npm run build

FROM nginx:alpine AS prod
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

`nginx.conf`:
```nginx
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;
  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

`docker-compose.yml`:
```yaml
services:
  dev:
    build:
      context: .
      target: dev
    ports:
      - '5173:5173'
    volumes:
      - .:/app
      - /app/node_modules
```

`.github/workflows/ci.yml`:
```yaml
name: CI
on: [push, pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build
```

**Step 5: Verify**

Run: `npm test && npm run lint && npm run build`
Expected: 1 test passes, no lint errors, `dist/` created.

Run: `docker compose up --build` and open `http://localhost:5173`
Expected: page shows "OpenFreeyond"; stop with Ctrl+C.

Run: `docker build --target prod -t openfreeyond-prod . && docker run --rm -p 8080:80 openfreeyond-prod` and open `http://localhost:8080`
Expected: same page served by nginx; stop it.

**Step 6: Commit**

```bash
git add -A
git commit -m "chore: project tooling, docker and ci"
```

---

## Task 1: Browser support check

**Delivers:** NFR-1, NFR-5, AC-5.6. Stories: US-1, US-5.

**Files:**
- Create: `src/logic/support.js`
- Test: `tests/support.test.js`

**Step 1: Write the failing test** (`tests/support.test.js`)
```js
import { describe, it, expect } from 'vitest';
import { isSupportedBrowser, SUPPORTED_MESSAGE } from '../src/logic/support.js';

const CHROME =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const FIREFOX =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:132.0) Gecko/20100101 Firefox/132.0';
const SAFARI =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15';
const IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const OLD_IE = 'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko';

describe('isSupportedBrowser', () => {
  it('accepts desktop Chrome, Firefox and Safari with WebGL', () => {
    for (const userAgent of [CHROME, FIREFOX, SAFARI]) {
      expect(isSupportedBrowser({ userAgent, hasWebGL: true })).toBe(true);
    }
  });
  it('rejects a browser without WebGL', () => {
    expect(isSupportedBrowser({ userAgent: CHROME, hasWebGL: false })).toBe(false);
  });
  it('rejects mobile browsers', () => {
    expect(isSupportedBrowser({ userAgent: IPHONE, hasWebGL: true })).toBe(false);
  });
  it('rejects unknown browsers', () => {
    expect(isSupportedBrowser({ userAgent: OLD_IE, hasWebGL: true })).toBe(false);
  });
  it('names the supported browsers in the message', () => {
    expect(SUPPORTED_MESSAGE).toContain('Chrome');
    expect(SUPPORTED_MESSAGE).toContain('Firefox');
    expect(SUPPORTED_MESSAGE).toContain('Safari');
  });
});
```

**Step 2: Run to verify it fails**

Run: `npx vitest run tests/support.test.js`
Expected: FAIL, cannot find `../src/logic/support.js`.

**Step 3: Implement** (`src/logic/support.js`)
```js
export const SUPPORTED_MESSAGE =
  'This browser is not supported. OpenFreeyond works in the latest Chrome, Firefox and Safari on a laptop.';

export function isSupportedBrowser({ userAgent, hasWebGL }) {
  if (!hasWebGL) return false;
  if (/Android|iPhone|iPad|Mobile/i.test(userAgent)) return false;
  return /Chrome\/|Firefox\/|Version\/[\d.]+.*Safari\//.test(userAgent);
}

export function detectWebGL(doc) {
  try {
    const canvas = doc.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}
```

**Step 4: Run to verify it passes**

Run: `npx vitest run tests/support.test.js`
Expected: PASS (5 tests).

**Step 5: Commit**
```bash
git add src/logic/support.js tests/support.test.js
git commit -m "feat: browser support check"
```

---

## Task 2: Intake fields and validation

**Delivers:** FR-7 (the colour sets), FR-8, AC-4.1, AC-4.2, AC-4.3. Stories: US-3, US-4.

**Files:**
- Create: `src/logic/fields.js`, `src/logic/validate.js`
- Test: `tests/validate.test.js`

**Step 1: Write the failing test** (`tests/validate.test.js`)
```js
import { describe, it, expect } from 'vitest';
import { validateIntake, normalizeIntake } from '../src/logic/validate.js';
import {
  HAIR_COLOURS,
  CLOTHING_COLOURS,
  VOICES,
  ENVIRONMENTS,
} from '../src/logic/fields.js';

const valid = () => ({
  name: 'Sam',
  age: '30',
  hair: HAIR_COLOURS[0].id,
  clothing: CLOTHING_COLOURS[0].id,
  character: 'Calm',
  hobbies: 'Reading',
  background: 'Lives in a small house.',
  voice: VOICES[0].id,
  environment: ENVIRONMENTS[0].id,
});

describe('field sets', () => {
  it('offers 8 hair colours, 8 clothing colours, 3 voices and 1 environment', () => {
    expect(HAIR_COLOURS).toHaveLength(8);
    expect(CLOTHING_COLOURS).toHaveLength(8);
    expect(VOICES).toHaveLength(3);
    expect(ENVIRONMENTS).toHaveLength(1);
  });
});

describe('validateIntake', () => {
  it('accepts a complete valid intake (AC-4.1)', () => {
    expect(validateIntake(valid())).toEqual({ ok: true, errors: {} });
  });
  it('names each empty field (AC-4.2)', () => {
    for (const key of ['name', 'age', 'character', 'hobbies', 'background']) {
      const input = { ...valid(), [key]: '   ' };
      const result = validateIntake(input);
      expect(result.ok).toBe(false);
      expect(Object.keys(result.errors)).toEqual([key]);
    }
  });
  it('names appearance, voice and environment when missing', () => {
    expect(validateIntake({ ...valid(), hair: '' }).errors).toHaveProperty('appearance');
    expect(validateIntake({ ...valid(), clothing: '' }).errors).toHaveProperty('appearance');
    expect(validateIntake({ ...valid(), voice: '' }).errors).toHaveProperty('voice');
    expect(validateIntake({ ...valid(), environment: '' }).errors).toHaveProperty('environment');
  });
  it('rejects ages that are not whole numbers from 18 to 120 (AC-4.3)', () => {
    for (const age of ['17', '121', '30.5', 'abc', '-20']) {
      expect(validateIntake({ ...valid(), age }).errors).toHaveProperty('age');
    }
    for (const age of ['18', '120', 34]) {
      expect(validateIntake({ ...valid(), age }).ok).toBe(true);
    }
  });
  it('rejects text longer than 500 characters (AC-4.3)', () => {
    const long = 'a'.repeat(501);
    expect(validateIntake({ ...valid(), background: long }).errors).toHaveProperty('background');
    expect(validateIntake({ ...valid(), background: 'a'.repeat(500) }).ok).toBe(true);
  });
});

describe('normalizeIntake', () => {
  it('trims text and turns age into a number', () => {
    const out = normalizeIntake({ ...valid(), name: '  Sam  ', age: ' 30 ' });
    expect(out.name).toBe('Sam');
    expect(out.age).toBe(30);
    expect(validateIntake(out).ok).toBe(true);
  });
});
```

**Step 2: Run to verify it fails**

Run: `npx vitest run tests/validate.test.js`
Expected: FAIL, modules not found.

**Step 3: Implement**

`src/logic/fields.js` (placeholders for OQ-1, the builder replaces them; keep `dark-blond` and `moss-green` because the example character uses them):
```js
export const TEXT_MAX = 500;
export const AGE_MIN = 18;
export const AGE_MAX = 120;

export const HAIR_COLOURS = [
  { id: 'black', label: 'Black', hex: '#1c1a1a' },
  { id: 'dark-brown', label: 'Dark brown', hex: '#3b2a20' },
  { id: 'brown', label: 'Brown', hex: '#6b4423' },
  { id: 'auburn', label: 'Auburn', hex: '#8b3a1e' },
  { id: 'dark-blond', label: 'Dark blond', hex: '#a68a4f' },
  { id: 'blond', label: 'Blond', hex: '#d9bf77' },
  { id: 'grey', label: 'Grey', hex: '#a8a8a8' },
  { id: 'white', label: 'White', hex: '#efefef' },
];

export const CLOTHING_COLOURS = [
  { id: 'moss-green', label: 'Moss green', hex: '#6f8f5a' },
  { id: 'mustard', label: 'Mustard', hex: '#d4a017' },
  { id: 'terracotta', label: 'Terracotta', hex: '#c4623f' },
  { id: 'dusty-blue', label: 'Dusty blue', hex: '#6e8fb0' },
  { id: 'cream', label: 'Cream', hex: '#f1e6cf' },
  { id: 'plum', label: 'Plum', hex: '#6d3b5c' },
  { id: 'charcoal', label: 'Charcoal', hex: '#3a3a3a' },
  { id: 'rose', label: 'Rose', hex: '#d98fa0' },
];

export const VOICES = [
  { id: 'soft-friendly', label: 'Soft and friendly' },
  { id: 'warm-calm', label: 'Warm and calm' },
  { id: 'bright-playful', label: 'Bright and playful' },
];

export const ENVIRONMENTS = [
  { id: 'house-garden-street', label: 'House with a garden on a cozy street' },
];

export const TEXT_FIELDS = ['name', 'character', 'hobbies', 'background'];

export const FIELD_LABELS = {
  name: 'Name',
  age: 'Age',
  appearance: 'Appearance',
  character: 'Character',
  hobbies: 'Hobbies and favourite things',
  background: 'Background story',
  voice: 'Voice',
  environment: 'Living environment',
};
```

`src/logic/validate.js`:
```js
import {
  TEXT_MAX,
  AGE_MIN,
  AGE_MAX,
  TEXT_FIELDS,
  FIELD_LABELS,
  HAIR_COLOURS,
  CLOTHING_COLOURS,
  VOICES,
  ENVIRONMENTS,
} from './fields.js';

const text = (value) => (typeof value === 'string' ? value.trim() : '');
const inSet = (set, id) => set.some((item) => item.id === id);

export function validateIntake(input) {
  const errors = {};

  for (const key of TEXT_FIELDS) {
    const value = text(input[key]);
    if (value === '') errors[key] = `${FIELD_LABELS[key]} is required.`;
    else if (value.length > TEXT_MAX)
      errors[key] = `${FIELD_LABELS[key]} must be at most ${TEXT_MAX} characters.`;
  }

  const rawAge = String(input.age ?? '').trim();
  if (rawAge === '') errors.age = `${FIELD_LABELS.age} is required.`;
  else if (!/^\d+$/.test(rawAge) || Number(rawAge) < AGE_MIN || Number(rawAge) > AGE_MAX)
    errors.age = `${FIELD_LABELS.age} must be a whole number from ${AGE_MIN} to ${AGE_MAX}.`;

  if (!inSet(HAIR_COLOURS, input.hair) || !inSet(CLOTHING_COLOURS, input.clothing))
    errors.appearance = `${FIELD_LABELS.appearance} needs a hair colour and a clothing colour.`;
  if (!inSet(VOICES, input.voice)) errors.voice = `${FIELD_LABELS.voice} is required.`;
  if (!inSet(ENVIRONMENTS, input.environment))
    errors.environment = `${FIELD_LABELS.environment} is required.`;

  return { ok: Object.keys(errors).length === 0, errors };
}

export function normalizeIntake(input) {
  return {
    name: text(input.name),
    age: Number(String(input.age).trim()),
    hair: input.hair,
    clothing: input.clothing,
    character: text(input.character),
    hobbies: text(input.hobbies),
    background: text(input.background),
    voice: input.voice,
    environment: input.environment,
  };
}
```

**Step 4: Run to verify it passes**

Run: `npx vitest run tests/validate.test.js`
Expected: PASS.

**Step 5: Commit**
```bash
git add src/logic/fields.js src/logic/validate.js tests/validate.test.js
git commit -m "feat: intake fields and validation"
```

---

## Task 3: Keeping data in the person's own browser

**Delivers:** FR-9, NFR-3, NFR-5, AC-3.2, AC-3.3, AC-4.4, AC-4.6, AC-4.7. Stories: US-3, US-4.

**Files:**
- Create: `src/logic/store.js`
- Test: `tests/store.test.js`

AC-3.3 holds because the browser keeps this data per browser profile and per site; nothing is sent anywhere, so no code is needed beyond not using a server. Task 13 checks it by hand.

**Step 1: Write the failing test** (`tests/store.test.js`)
```js
import { describe, it, expect } from 'vitest';
import {
  getStorage,
  saveCharacter,
  loadCharacter,
  isHintSeen,
  markHintSeen,
} from '../src/logic/store.js';
import { EXAMPLE_CHARACTER } from '../src/logic/startScreen.js';

class MemoryStorage {
  constructor() {
    this.data = new Map();
  }
  getItem(k) {
    return this.data.has(k) ? this.data.get(k) : null;
  }
  setItem(k, v) {
    this.data.set(k, String(v));
  }
  removeItem(k) {
    this.data.delete(k);
  }
}

class BlockedStorage {
  getItem() {
    throw new Error('blocked');
  }
  setItem() {
    throw new Error('blocked');
  }
  removeItem() {
    throw new Error('blocked');
  }
}

describe('character storage', () => {
  it('returns none when nothing is kept', () => {
    expect(loadCharacter(new MemoryStorage())).toEqual({ status: 'none' });
  });
  it('keeps and loads a character (AC-3.2, AC-4.4)', () => {
    const s = new MemoryStorage();
    expect(saveCharacter(s, EXAMPLE_CHARACTER)).toEqual({ ok: true });
    expect(loadCharacter(s)).toEqual({ status: 'ok', data: EXAMPLE_CHARACTER });
  });
  it('reports broken data when it is not valid JSON (AC-4.6)', () => {
    const s = new MemoryStorage();
    s.setItem('openfreeyond.character.v1', '{not json');
    expect(loadCharacter(s)).toEqual({ status: 'broken' });
  });
  it('reports broken data when it fails the intake rules (AC-4.6)', () => {
    const s = new MemoryStorage();
    s.setItem('openfreeyond.character.v1', JSON.stringify({ ...EXAMPLE_CHARACTER, age: 5 }));
    expect(loadCharacter(s)).toEqual({ status: 'broken' });
  });
  it('reports unavailable when there is no storage or it throws (AC-4.7)', () => {
    expect(loadCharacter(null)).toEqual({ status: 'unavailable' });
    expect(loadCharacter(new BlockedStorage())).toEqual({ status: 'unavailable' });
    expect(saveCharacter(null, EXAMPLE_CHARACTER)).toEqual({ ok: false });
    expect(saveCharacter(new BlockedStorage(), EXAMPLE_CHARACTER)).toEqual({ ok: false });
  });
});

describe('hint flag', () => {
  it('is not seen at first, and seen after it is marked', () => {
    const s = new MemoryStorage();
    expect(isHintSeen(s)).toBe(false);
    markHintSeen(s);
    expect(isHintSeen(s)).toBe(true);
  });
  it('is never seen when storage is blocked', () => {
    expect(isHintSeen(new BlockedStorage())).toBe(false);
    expect(() => markHintSeen(new BlockedStorage())).not.toThrow();
  });
});

describe('getStorage', () => {
  it('returns null when the window has no usable storage', () => {
    const win = {
      get localStorage() {
        throw new Error('blocked');
      },
    };
    expect(getStorage(win)).toBeNull();
  });
});
```

**Step 2: Run to verify it fails**

Run: `npx vitest run tests/store.test.js`
Expected: FAIL, modules not found. Note: this test imports `EXAMPLE_CHARACTER` from Task 4. **Do Task 4 completely before Task 3 Step 2**, then come back to Task 3.

**Step 3: Implement** (`src/logic/store.js`)
```js
import { validateIntake } from './validate.js';

const CHARACTER_KEY = 'openfreeyond.character.v1';
const HINT_KEY = 'openfreeyond.hint-seen.v1';

export function getStorage(win = globalThis.window) {
  try {
    const storage = win.localStorage;
    storage.setItem('__openfreeyond_test__', '1');
    storage.removeItem('__openfreeyond_test__');
    return storage;
  } catch {
    return null;
  }
}

export function saveCharacter(storage, character) {
  if (!storage) return { ok: false };
  try {
    storage.setItem(CHARACTER_KEY, JSON.stringify(character));
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export function loadCharacter(storage) {
  if (!storage) return { status: 'unavailable' };
  let raw;
  try {
    raw = storage.getItem(CHARACTER_KEY);
  } catch {
    return { status: 'unavailable' };
  }
  if (raw === null) return { status: 'none' };
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return { status: 'broken' };
  }
  if (!data || typeof data !== 'object' || !validateIntake(data).ok) return { status: 'broken' };
  return { status: 'ok', data };
}

export function isHintSeen(storage) {
  if (!storage) return false;
  try {
    return storage.getItem(HINT_KEY) === '1';
  } catch {
    return false;
  }
}

export function markHintSeen(storage) {
  if (!storage) return;
  try {
    storage.setItem(HINT_KEY, '1');
  } catch {
    // Nothing can be kept; the hint will show again next time.
  }
}
```

**Step 4: Run to verify it passes** (after Task 4 exists)

Run: `npx vitest run tests/store.test.js`
Expected: PASS.

**Step 5: Commit**
```bash
git add src/logic/store.js tests/store.test.js
git commit -m "feat: keep character and hint flag in the browser"
```

---

## Task 4: Start screen choices and the example character

**Delivers:** FR-10, FR-11, FR-12, FR-13, AC-5.1, AC-5.2 (logic part), AC-5.3, AC-5.4, AC-5.5 (logic part). Story: US-5.

Do this task before Task 3 Step 2, because the store test uses `EXAMPLE_CHARACTER`.

**Files:**
- Create: `src/logic/startScreen.js`
- Test: `tests/startScreen.test.js`

**Step 1: Write the failing test** (`tests/startScreen.test.js`)
```js
import { describe, it, expect } from 'vitest';
import { startOptions, resolveChoice, EXAMPLE_CHARACTER } from '../src/logic/startScreen.js';
import { validateIntake } from '../src/logic/validate.js';

const ok = { status: 'ok', data: { ...EXAMPLE_CHARACTER, name: 'Kept Person' } };
const none = { status: 'none' };

describe('example character', () => {
  it('passes the intake rules', () => {
    expect(validateIntake(EXAMPLE_CHARACTER).ok).toBe(true);
  });
});

describe('startOptions', () => {
  it('always offers the try-out (FR-10)', () => {
    for (const result of [none, ok, { status: 'broken' }, { status: 'unavailable' }]) {
      expect(startOptions(result)).toContain('try-out');
    }
  });
  it('offers continue, make-new and try-out when a character is kept (AC-5.3)', () => {
    expect(startOptions(ok)).toEqual(['continue', 'make-new', 'try-out']);
  });
  it('offers make-new and try-out otherwise (FR-13)', () => {
    expect(startOptions(none)).toEqual(['make-new', 'try-out']);
    expect(startOptions({ status: 'broken' })).toEqual(['make-new', 'try-out']);
  });
});

describe('resolveChoice', () => {
  it('try-out enters with the example character and keeps nothing (AC-5.1, AC-5.2, AC-5.4)', () => {
    const result = resolveChoice('try-out', ok);
    expect(result).toEqual({ action: 'enter', character: EXAMPLE_CHARACTER, tryOut: true });
  });
  it('continue enters with the kept character', () => {
    expect(resolveChoice('continue', ok)).toEqual({
      action: 'enter',
      character: ok.data,
      tryOut: false,
    });
  });
  it('make-new asks to confirm when a character is kept (AC-5.5)', () => {
    expect(resolveChoice('make-new', ok)).toEqual({ action: 'confirm-replace' });
  });
  it('make-new opens the intake when nothing is kept', () => {
    expect(resolveChoice('make-new', none)).toEqual({ action: 'intake' });
  });
  it('continue without a kept character stays on the start screen', () => {
    expect(resolveChoice('continue', none)).toEqual({ action: 'stay' });
  });
});
```

**Step 2: Run to verify it fails**

Run: `npx vitest run tests/startScreen.test.js`
Expected: FAIL, module not found.

**Step 3: Implement** (`src/logic/startScreen.js`)
```js
export const EXAMPLE_CHARACTER = {
  name: 'Noor de Wit',
  age: 34,
  hair: 'dark-blond',
  clothing: 'moss-green',
  character: 'Spontaneous, curious, dry humour',
  hobbies: 'Bouldering, festivals, gaming with friends, vintage shopping, city trips',
  background:
    'Works as a baker, has lived for two years in a small house with a garden by the water and goes on a city trip with friends as often as possible.',
  voice: 'soft-friendly',
  environment: 'house-garden-street',
};

export function startOptions(loadResult) {
  return loadResult.status === 'ok'
    ? ['continue', 'make-new', 'try-out']
    : ['make-new', 'try-out'];
}

export function resolveChoice(choice, loadResult) {
  const kept = loadResult.status === 'ok';
  if (choice === 'try-out') {
    return { action: 'enter', character: EXAMPLE_CHARACTER, tryOut: true };
  }
  if (choice === 'continue') {
    return kept
      ? { action: 'enter', character: loadResult.data, tryOut: false }
      : { action: 'stay' };
  }
  if (choice === 'make-new') {
    return kept ? { action: 'confirm-replace' } : { action: 'intake' };
  }
  return { action: 'stay' };
}
```

**Step 4: Run to verify it passes**

Run: `npx vitest run tests/startScreen.test.js tests/store.test.js`
Expected: PASS for both files.

**Step 5: Commit**
```bash
git add src/logic/startScreen.js tests/startScreen.test.js
git commit -m "feat: start screen choices and example character"
```

---

## Task 5: Layout and collision

**Delivers:** FR-2, AC-1.2, AC-1.3. Story: US-1.

**Files:**
- Create: `src/world/layout.js`, `src/logic/collision.js`
- Test: `tests/collision.test.js`

**Step 1: Write the failing test** (`tests/collision.test.js`)
```js
import { describe, it, expect } from 'vitest';
import { resolveMove, hitsSolid } from '../src/logic/collision.js';
import { SOLIDS, BOUNDS, SPAWN, CHARACTER_SPOT } from '../src/world/layout.js';

const box = [{ x: 0, z: 0, w: 2, d: 2 }];
const bounds = { minX: -10, maxX: 10, minZ: -10, maxZ: 10 };

describe('resolveMove', () => {
  it('lets a person move in free space', () => {
    expect(resolveMove({ x: 5, z: 5 }, { x: 5.1, z: 5.1 }, box, bounds)).toEqual({ x: 5.1, z: 5.1 });
  });
  it('blocks walking into a solid object (AC-1.2)', () => {
    const result = resolveMove({ x: 0, z: 3 }, { x: 0, z: 1.2 }, box, bounds);
    expect(result).toEqual({ x: 0, z: 3 });
  });
  it('slides along a solid object', () => {
    const result = resolveMove({ x: 0.5, z: 1.5 }, { x: 0.7, z: 1.2 }, box, bounds);
    expect(result.x).toBeCloseTo(0.7);
    expect(result.z).toBe(1.5);
  });
  it('keeps a person inside the place at the edge (AC-1.3)', () => {
    const result = resolveMove({ x: 9.6, z: 0 }, { x: 12, z: 0 }, [], bounds, 0.3);
    expect(result.x).toBeCloseTo(9.7);
  });
});

describe('layout', () => {
  it('has all solids inside the bounds', () => {
    for (const s of SOLIDS) {
      expect(s.x - s.w / 2).toBeGreaterThanOrEqual(BOUNDS.minX);
      expect(s.x + s.w / 2).toBeLessThanOrEqual(BOUNDS.maxX);
      expect(s.z - s.d / 2).toBeGreaterThanOrEqual(BOUNDS.minZ);
      expect(s.z + s.d / 2).toBeLessThanOrEqual(BOUNDS.maxZ);
    }
  });
  it('starts the person in free space', () => {
    expect(hitsSolid(SPAWN.x, SPAWN.z, SOLIDS, 0.3)).toBe(false);
  });
  it('has the character spot among the solids', () => {
    expect(SOLIDS.some((s) => s.x === CHARACTER_SPOT.x && s.z === CHARACTER_SPOT.z)).toBe(true);
  });
});
```

**Step 2: Run to verify it fails**

Run: `npx vitest run tests/collision.test.js`
Expected: FAIL, modules not found.

**Step 3: Implement**

`src/logic/collision.js`:
```js
export function hitsSolid(x, z, solids, radius) {
  return solids.some(
    (s) => Math.abs(x - s.x) < s.w / 2 + radius && Math.abs(z - s.z) < s.d / 2 + radius,
  );
}

function clampToBounds(p, b, r) {
  return {
    x: Math.min(Math.max(p.x, b.minX + r), b.maxX - r),
    z: Math.min(Math.max(p.z, b.minZ + r), b.maxZ - r),
  };
}

export function resolveMove(prev, next, solids, bounds, radius = 0.3) {
  const target = clampToBounds(next, bounds, radius);
  let x = target.x;
  let z = prev.z;
  if (hitsSolid(x, z, solids, radius)) x = prev.x;
  z = target.z;
  if (hitsSolid(x, z, solids, radius)) z = prev.z;
  return { x, z };
}
```

`src/world/layout.js` (one source for what is drawn and what blocks walking; adjust positions by eye in Task 7):
```js
export const BOUNDS = { minX: -11, maxX: 11, minZ: -11, maxZ: 11 };
export const SPAWN = { x: 0, z: 6 };
export const CHARACTER_SPOT = { x: 3, z: -1 };

// kind: 'box' (default), 'tree' or 'character' (not drawn here)
export const SOLIDS = [
  { id: 'house', x: 0, z: -7, w: 6, d: 5, h: 3, color: '#e8c9a0' },
  { id: 'fence-left', x: -8, z: -2, w: 0.2, d: 10, h: 1, color: '#f2e3c6' },
  { id: 'fence-right', x: 8, z: -2, w: 0.2, d: 10, h: 1, color: '#f2e3c6' },
  { id: 'bench', x: -4, z: -2, w: 1.6, d: 0.6, h: 0.5, color: '#8b5a2b' },
  { id: 'table', x: 5, z: -4, w: 1.2, d: 1.2, h: 0.8, color: '#a9743b' },
  { id: 'planter', x: -5, z: -5, w: 2, d: 0.6, h: 0.5, color: '#7a4b2a' },
  { id: 'tree-1', kind: 'tree', x: -5, z: 3, w: 0.8, d: 0.8, h: 2.5, color: '#5c4033' },
  { id: 'tree-2', kind: 'tree', x: 6, z: 3, w: 0.8, d: 0.8, h: 2.5, color: '#5c4033' },
  { id: 'character', kind: 'character', ...CHARACTER_SPOT, w: 0.8, d: 0.8 },
];
```

**Step 4: Run to verify it passes**

Run: `npx vitest run tests/collision.test.js`
Expected: PASS.

**Step 5: Commit**
```bash
git add src/logic/collision.js src/world/layout.js tests/collision.test.js
git commit -m "feat: place layout and collision"
```

---

## Task 6: Mapping colours onto the character model

**Delivers:** FR-7 (the character shows the chosen colours), AC-3.1 (logic part). Story: US-3.

**Files:**
- Create: `src/logic/colours.js`
- Test: `tests/colours.test.js`

The converted model (Task 8) has a material named `Hair` for the hair and `Purple` for the hoodie and shoes. The names live in one constant, `CHARACTER_MATERIALS`, so a different model only needs that constant changed.

**Step 1: Write the failing test** (`tests/colours.test.js`)
```js
import { describe, it, expect } from 'vitest';
import { applyColours, hexFor, CHARACTER_MATERIALS } from '../src/logic/colours.js';

const makeMaterial = (name) => ({
  name,
  color: {
    value: null,
    set(v) {
      this.value = v;
    },
  },
});

const makeRoot = (materials) => ({
  traverse(fn) {
    fn({ isMesh: false });
    for (const material of materials) fn({ isMesh: true, material });
  },
});

describe('hexFor', () => {
  it('finds the hex of a hair and a clothing colour', () => {
    expect(hexFor('hair', 'dark-blond')).toBe('#a68a4f');
    expect(hexFor('clothing', 'moss-green')).toBe('#6f8f5a');
  });
  it('returns undefined for an unknown id', () => {
    expect(hexFor('hair', 'nope')).toBeUndefined();
  });
});

describe('CHARACTER_MATERIALS', () => {
  it('names the model materials for hair and clothing', () => {
    expect(CHARACTER_MATERIALS).toEqual({ hair: 'Hair', clothing: 'Purple' });
  });
});

describe('applyColours', () => {
  it('sets the hair and clothing materials and leaves others alone', () => {
    const hair = makeMaterial(CHARACTER_MATERIALS.hair);
    const clothing = makeMaterial(CHARACTER_MATERIALS.clothing);
    const skin = makeMaterial('Skin');
    applyColours(makeRoot([hair, clothing, skin]), { hair: 'dark-blond', clothing: 'moss-green' });
    expect(hair.color.value).toBe('#a68a4f');
    expect(clothing.color.value).toBe('#6f8f5a');
    expect(skin.color.value).toBeNull();
  });
  it('handles meshes with several materials', () => {
    const hair = makeMaterial(CHARACTER_MATERIALS.hair);
    const root = {
      traverse(fn) {
        fn({ isMesh: true, material: [hair] });
      },
    };
    applyColours(root, { hair: 'black', clothing: 'plum' });
    expect(hair.color.value).toBe('#1c1a1a');
  });
});
```

**Step 2: Run to verify it fails**

Run: `npx vitest run tests/colours.test.js`
Expected: FAIL, module not found.

**Step 3: Implement** (`src/logic/colours.js`)
```js
import { HAIR_COLOURS, CLOTHING_COLOURS } from './fields.js';

const SETS = { hair: HAIR_COLOURS, clothing: CLOTHING_COLOURS };

// Material names in the converted character model (Task 8). Change them here for another model.
export const CHARACTER_MATERIALS = { hair: 'Hair', clothing: 'Purple' };

export function hexFor(kind, id) {
  return SETS[kind].find((c) => c.id === id)?.hex;
}

export function applyColours(root, { hair, clothing }) {
  const hairHex = hexFor('hair', hair);
  const clothingHex = hexFor('clothing', clothing);
  root.traverse((node) => {
    if (!node.isMesh) return;
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    for (const material of materials) {
      if (material.name === CHARACTER_MATERIALS.hair && hairHex) material.color.set(hairHex);
      if (material.name === CHARACTER_MATERIALS.clothing && clothingHex)
        material.color.set(clothingHex);
    }
  });
}
```

**Step 4: Run to verify it passes**

Run: `npx vitest run tests/colours.test.js`
Expected: PASS.

**Step 5: Commit**
```bash
git add src/logic/colours.js tests/colours.test.js
git commit -m "feat: map chosen colours onto the character model"
```

---

## Task 7: The place (A-Frame scene, walking, light)

**Delivers:** FR-1, FR-4, AC-1.1, AC-1.5. Story: US-1. Checked by hand (the plan does not automate 3D tests).

**Files:**
- Create: `src/world/components.js`, `src/world/scene.js`

**Step 1: Write the components** (`src/world/components.js`)
```js
import { resolveMove } from '../logic/collision.js';
import { applyColours } from '../logic/colours.js';
import { SOLIDS, BOUNDS } from './layout.js';

// Stops the camera rig from walking through solid objects or out of the place (FR-2).
AFRAME.registerComponent('walk-limiter', {
  init() {
    const p = this.el.object3D.position;
    this.last = { x: p.x, z: p.z };
  },
  tick() {
    const p = this.el.object3D.position;
    const next = resolveMove(this.last, { x: p.x, z: p.z }, SOLIDS, BOUNDS);
    p.x = next.x;
    p.z = next.z;
    this.last = next;
  },
});

// Sets the hair and clothing materials of the loaded model (FR-7).
AFRAME.registerComponent('character-colours', {
  schema: { hair: { type: 'string' }, clothing: { type: 'string' } },
  init() {
    this.el.addEventListener('model-loaded', () => this.paint());
  },
  update() {
    this.paint();
  },
  paint() {
    const mesh = this.el.getObject3D('mesh');
    if (mesh) applyColours(mesh, this.data);
  },
});

// Plays the animation clip named "Idle" in a loop (FR-6). The model holds only that clip.
AFRAME.registerComponent('idle-animation', {
  init() {
    this.mixer = null;
    this.el.addEventListener('model-loaded', () => {
      const mesh = this.el.getObject3D('mesh');
      const clip = mesh && mesh.animations && mesh.animations.find((c) => c.name === 'Idle');
      if (!clip) return;
      this.mixer = new AFRAME.THREE.AnimationMixer(mesh);
      this.mixer.clipAction(clip).play();
    });
  },
  tick(time, delta) {
    if (this.mixer) this.mixer.update(delta / 1000);
  },
  remove() {
    if (this.mixer) this.mixer.stopAllAction();
  },
});
```

**Step 2: Write the scene builder** (`src/world/scene.js`)
```js
import 'aframe';
import './components.js';
import { SOLIDS, SPAWN, CHARACTER_SPOT } from './layout.js';

const CHARACTER_URL = `${import.meta.env.BASE_URL}assets/character.glb`;

function drawSolid(s) {
  if (s.kind === 'character') return '';
  if (s.kind === 'tree') {
    return `
      <a-cylinder position="${s.x} ${s.h / 2} ${s.z}" radius="0.25" height="${s.h}" color="${s.color}"></a-cylinder>
      <a-sphere position="${s.x} ${s.h + 0.6} ${s.z}" radius="1.2" color="#6f9a4d"></a-sphere>`;
  }
  const roof =
    s.id === 'house'
      ? `<a-cone position="${s.x} ${s.h + 1} ${s.z}" radius-bottom="4.6" radius-top="0.1" height="2" segments-radial="4" rotation="0 45 0" color="#b5543a"></a-cone>`
      : '';
  return `
    <a-box position="${s.x} ${s.h / 2} ${s.z}" width="${s.w}" height="${s.h}" depth="${s.d}" color="${s.color}"></a-box>
    ${roof}`;
}

export function mountWorld(container, character, { stats = false } = {}) {
  const scene = document.createElement('div');
  scene.className = 'world';
  scene.innerHTML = `
    <a-scene ${stats ? 'stats' : ''} vr-mode-ui="enabled: false" background="color: #f6d9a8">
      <a-assets timeout="15000">
        <a-asset-item id="character-model" src="${CHARACTER_URL}"></a-asset-item>
      </a-assets>
      <a-plane rotation="-90 0 0" width="24" height="24" color="#8fae6b"></a-plane>
      <a-light type="ambient" color="#ffe2b8" intensity="0.7"></a-light>
      <a-light type="directional" color="#ffd9a0" intensity="0.8" position="-3 6 4"></a-light>
      <a-light type="point" color="#ffcf8a" intensity="0.8" distance="12" position="0 2.5 -3"></a-light>
      ${SOLIDS.map(drawSolid).join('')}
      <a-entity
        gltf-model="#character-model"
        position="${CHARACTER_SPOT.x} 0 ${CHARACTER_SPOT.z}"
        rotation="0 -30 0"
        character-colours="hair: ${character.hair}; clothing: ${character.clothing}"
        idle-animation></a-entity>
      <a-entity id="rig" position="${SPAWN.x} 0 ${SPAWN.z}" wasd-controls="acceleration: 25" walk-limiter>
        <a-entity camera look-controls position="0 1.6 0"></a-entity>
      </a-entity>
    </a-scene>`;
  container.appendChild(scene);
  return { destroy: () => scene.remove() };
}
```
Only fixed colour ids from the sets reach this markup, never free text from the intake.

**Step 3: Check by hand (the character model arrives in Task 8)**

Temporarily wire the world in `src/main.js`:
```js
import('./world/scene.js').then(({ mountWorld }) => {
  mountWorld(document.getElementById('app'), { hair: 'dark-blond', clothing: 'moss-green' }, { stats: true });
});
```
Run: `docker compose up` and open `http://localhost:5173`
Expected: a green ground, a house with a roof, fence segments, bench, table, planter, two trees, warm light. WASD or the arrow keys move; click-drag looks around; walking into the house, a fence or a tree stops you; walking to the edge stops you. (AC-1.1, AC-1.5). The character does not show yet (missing asset), that is fine.

**Step 4: Commit**
```bash
git add src/world/components.js src/world/scene.js src/main.js
git commit -m "feat: walkable cozy place"
```

---

## Task 8: The character in the place

**Delivers:** FR-6, AC-2.1, AC-2.2; supports FR-7 and AC-3.1. Story: US-2.

**Files:**
- Create: `scripts/convert-character.mjs`, `public/assets/character.glb`, `public/assets/LICENSE-character.txt`
- Source (not committed): `assets/models/Casual_Hoodie.fbx`

A-Frame cannot load FBX, and the FBX holds 24 animation clips and transparent materials. The script below turns it into a small GLB with one clip (`Idle`), opaque materials with the same names, and metres instead of centimetres (so no scale change is needed in the scene).

**Step 1: Check the licence (manual, before anything goes online)**

The character folder has no licence file. The zip it came from (`Hoodie Character by Quaternius`) or the pack's web page states the licence. Read it. It must allow use and redistribution (CC0 is ideal; CC-BY needs a credit line). Write the model name, author, source link and licence text into `public/assets/LICENSE-character.txt`. If the licence does not allow it, stop and tell the PO.

**Step 2: Write the converter** (`scripts/convert-character.mjs`)
```js
// Converts an FBX character to a small GLB: metres, one named animation clip only.
// Usage: node scripts/convert-character.mjs <input.fbx> <output.glb> [clipName] [Material=#hex ...]
// Extra Material=#hex arguments set the base colour of a material (for example LightBlue=#7ea6c9).
import fs from 'fs';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

const [input, output, clipName = 'Idle', ...overrides] = process.argv.slice(2);
if (!input || !output) {
  console.error('Usage: node scripts/convert-character.mjs <input.fbx> <output.glb> [clipName] [Material=#hex ...]');
  process.exit(1);
}

// GLTFExporter needs FileReader to pack binary output; Node has Blob but not FileReader.
globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buffer) => {
      this.result = buffer;
      this.onloadend?.();
    });
  }
  readAsDataURL(blob) {
    blob.arrayBuffer().then((buffer) => {
      this.result = `data:${blob.type};base64,${Buffer.from(buffer).toString('base64')}`;
      this.onloadend?.();
    });
  }
};

console.warn = () => {};
const data = fs.readFileSync(input);
const model = new FBXLoader().parse(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength), '');

const clip = model.animations.find((a) => a.name.split('|').pop() === clipName);
if (!clip) {
  console.error(`No clip named "${clipName}". Found: ${model.animations.map((a) => a.name).join(', ')}`);
  process.exit(1);
}
clip.name = clipName;

// The FBX materials arrive fully transparent and glowing. Replace each with a plain opaque
// standard material that keeps the name and colour (names matter: the app recolours by name).
const seen = new Map();
model.traverse((node) => {
  if (!node.isMesh) return;
  const fix = (old) => {
    if (!seen.has(old.name)) {
      seen.set(
        old.name,
        new THREE.MeshStandardMaterial({ name: old.name, color: old.color, roughness: 1, metalness: 0 }),
      );
    }
    return seen.get(old.name);
  };
  node.material = Array.isArray(node.material) ? node.material.map(fix) : fix(node.material);
});

for (const override of overrides) {
  const [name, hex] = override.split('=');
  if (!seen.has(name)) {
    console.error(`No material named "${name}". Found: ${[...seen.keys()].join(', ')}`);
    process.exit(1);
  }
  seen.get(name).color.set(hex);
}

// FBX units are centimetres; glTF uses metres.
model.scale.setScalar(0.01);
model.updateMatrixWorld(true);

const exporter = new GLTFExporter();
const glb = await new Promise((resolve, reject) =>
  exporter.parse(model, resolve, reject, { binary: true, animations: [clip], onlyVisible: false }),
);
fs.writeFileSync(output, Buffer.from(glb));
console.log(`Wrote ${output} (${(glb.byteLength / 1024).toFixed(0)} KB), clip "${clipName}"`);
```
(`three` is already a dev dependency from Task 0.)

**Step 3: Convert**

Run:
```bash
mkdir -p public/assets
node scripts/convert-character.mjs assets/models/Casual_Hoodie.fbx public/assets/character.glb Idle
```
Expected: `Wrote public/assets/character.glb (about 1300 KB), clip "Idle"`.

Tested on 2026-11-08: the output has 7 opaque materials (`Skin`, `LightBlue`, `White`, `Purple`, `Eyebrows`, `Eye`, `Hair`), one animation named `Idle`, and 4 skinned meshes.

**Step 4: Check by hand**

Run: `docker compose up` and open `http://localhost:5173` (the temporary wiring from Task 7 is still in place).
Expected:
- The character is visible, standing at the fixed spot, with a repeating small movement (AC-2.1). If it is invisible, its materials are transparent: re-run Step 3.
- Walk away and come back: it is in the same place (AC-2.2).
- With `hair: dark-blond; clothing: moss-green`, the hair and the hoodie show those colours.
- The size is about 1.8 m tall. If it is too big, small or faces away, change `rotation` or add a `scale` in `src/world/scene.js`.
- The converted colours of some parts may look too dark in the FBX (`LightBlue` trousers, `Eye`, `Eyebrows`). Fix any that look wrong by passing overrides, for example:
  `node scripts/convert-character.mjs assets/models/Casual_Hoodie.fbx public/assets/character.glb Idle LightBlue=#7ea6c9`
  The colour is a design choice of the builder.

**Step 5: Commit**
```bash
git add scripts/convert-character.mjs public/assets src/world/scene.js
git commit -m "feat: character with idle animation and colours"
```

---

## Task 9: Controls hint

**Delivers:** FR-5, AC-1.8. Story: US-1.

**Files:**
- Create: `src/ui/screens.js` (first part), `src/ui/styles.css`
- Test: `tests/hint.test.js`

**Step 1: Write the failing test** (`tests/hint.test.js`)
```js
import { describe, it, expect } from 'vitest';
import { renderWorldOverlay } from '../src/ui/screens.js';

function setup(options) {
  const root = document.createElement('div');
  renderWorldOverlay(root, {
    notice: null,
    showHint: true,
    onDismissHint: () => {},
    onBack: () => {},
    ...options,
  });
  return root;
}

describe('controls hint', () => {
  it('shows how to move and look for keyboard, mouse and trackpad (FR-5)', () => {
    const text = setup({}).textContent;
    expect(text).toMatch(/W A S D|arrow/i);
    expect(text).toMatch(/mouse or trackpad/i);
  });
  it('is dismissible and calls back once (AC-1.8)', () => {
    let calls = 0;
    const root = setup({ onDismissHint: () => calls++ });
    root.querySelector('[data-action="dismiss-hint"]').click();
    expect(calls).toBe(1);
    expect(root.querySelector('.hint')).toBeNull();
  });
  it('is not shown when it was seen before (AC-1.8)', () => {
    expect(setup({ showHint: false }).querySelector('.hint')).toBeNull();
  });
});
```

**Step 2: Run to verify it fails**

Run: `npx vitest run tests/hint.test.js`
Expected: FAIL, module not found.

**Step 3: Implement** (`src/ui/screens.js`, first part; later tasks add to it)
```js
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key.startsWith('on')) el.addEventListener(key.slice(2).toLowerCase(), value);
    else if (key === 'class') el.className = value;
    else if (value !== null && value !== undefined && value !== false) el.setAttribute(key, value);
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    el.append(child.nodeType ? child : document.createTextNode(child));
  }
  return el;
}

export function renderWorldOverlay(root, { notice, showHint, onDismissHint, onBack }) {
  const overlay = h('div', { class: 'overlay' });
  overlay.append(h('button', { class: 'back', 'data-action': 'back', onClick: onBack }, 'Back to start'));
  if (notice) overlay.append(h('p', { class: 'notice', role: 'status' }, notice));
  if (showHint) {
    const hint = h(
      'div',
      { class: 'hint', role: 'dialog', 'aria-label': 'Controls' },
      h('p', {}, 'Move: W A S D or the arrow keys.'),
      h('p', {}, 'Look around: click and drag with the mouse or trackpad.'),
      h(
        'button',
        {
          'data-action': 'dismiss-hint',
          onClick: () => {
            hint.remove();
            onDismissHint();
          },
        },
        'Got it',
      ),
    );
    overlay.append(hint);
  }
  root.append(overlay);
  return overlay;
}
```

`src/ui/styles.css`:
```css
body { margin: 0; font-family: system-ui, sans-serif; background: #f6e9d2; color: #3b2a20; }
.screen { max-width: 36rem; margin: 3rem auto; padding: 0 1rem; }
.screen button, .overlay button { font: inherit; padding: 0.6rem 1rem; margin: 0.25rem 0.25rem 0.25rem 0; border: 0; border-radius: 0.5rem; background: #b5543a; color: #fff; cursor: pointer; }
label { display: block; margin: 0.75rem 0 0.25rem; font-weight: 600; }
input, select, textarea { width: 100%; font: inherit; padding: 0.4rem; box-sizing: border-box; }
.error { color: #a02020; margin: 0.25rem 0 0; }
.world { position: fixed; inset: 0; }
.overlay { position: fixed; top: 0.75rem; left: 0.75rem; z-index: 10; max-width: 22rem; }
.notice, .hint { background: rgba(255, 244, 224, 0.95); padding: 0.75rem; border-radius: 0.5rem; margin: 0.5rem 0 0; }
```

**Step 4: Run to verify it passes**

Run: `npx vitest run tests/hint.test.js`
Expected: PASS.

**Step 5: Commit**
```bash
git add src/ui tests/hint.test.js
git commit -m "feat: dismissible controls hint"
```

---

## Task 10: Start screen, intake form and wiring

**Delivers:** FR-7, FR-8, FR-9, FR-10, FR-11, FR-12, FR-13 (screens and wiring); AC-3.1, AC-3.2, AC-4.1, AC-4.2, AC-4.3, AC-4.4, AC-4.6, AC-4.7, AC-5.1, AC-5.2, AC-5.3, AC-5.4, AC-5.5, AC-5.6; NFR-3, NFR-5. Stories: US-3, US-4, US-5.

**Files:**
- Modify: `src/ui/screens.js`, `src/main.js`
- Test: `tests/screens.test.js`

**Step 1: Write the failing test** (`tests/screens.test.js`)
```js
import { describe, it, expect } from 'vitest';
import { renderStart, renderConfirm, renderIntake, renderMessage } from '../src/ui/screens.js';
import { HAIR_COLOURS } from '../src/logic/fields.js';

const root = () => document.createElement('div');

describe('renderStart', () => {
  it('shows one button per option (AC-5.3)', () => {
    const r = root();
    renderStart(r, { options: ['continue', 'make-new', 'try-out'], onChoose: () => {} });
    expect(r.querySelectorAll('button')).toHaveLength(3);
  });
  it('reports the chosen option (AC-5.1)', () => {
    const r = root();
    let chosen = null;
    renderStart(r, { options: ['make-new', 'try-out'], onChoose: (c) => (chosen = c) });
    r.querySelector('[data-choice="try-out"]').click();
    expect(chosen).toBe('try-out');
  });
});

describe('renderConfirm', () => {
  it('lets the person confirm or cancel (AC-5.5)', () => {
    const r = root();
    let answer = null;
    renderConfirm(r, { onYes: () => (answer = 'yes'), onNo: () => (answer = 'no') });
    r.querySelector('[data-action="no"]').click();
    expect(answer).toBe('no');
    r.querySelector('[data-action="yes"]').click();
    expect(answer).toBe('yes');
  });
});

describe('renderIntake', () => {
  it('shows all seven fields, with the 8 hair colours as choices', () => {
    const r = root();
    renderIntake(r, { values: {}, errors: {}, onSubmit: () => {}, onCancel: () => {} });
    for (const name of ['name', 'age', 'hair', 'clothing', 'character', 'hobbies', 'background', 'voice', 'environment']) {
      expect(r.querySelector(`[name="${name}"]`)).not.toBeNull();
    }
    expect(r.querySelectorAll('[name="hair"] option:not([value=""])')).toHaveLength(HAIR_COLOURS.length);
  });
  it('names the fields that have an error (AC-4.2, AC-4.3)', () => {
    const r = root();
    renderIntake(r, {
      values: {},
      errors: { age: 'Age must be a whole number from 18 to 120.' },
      onSubmit: () => {},
      onCancel: () => {},
    });
    expect(r.textContent).toContain('Age must be a whole number from 18 to 120.');
  });
  it('submits the entered values (AC-4.1)', () => {
    const r = root();
    let submitted = null;
    renderIntake(r, { values: {}, errors: {}, onSubmit: (v) => (submitted = v), onCancel: () => {} });
    r.querySelector('[name="name"]').value = 'Sam';
    r.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true }));
    expect(submitted.name).toBe('Sam');
  });
});

describe('renderMessage', () => {
  it('shows a message (AC-5.6)', () => {
    const r = root();
    renderMessage(r, 'Not supported');
    expect(r.textContent).toContain('Not supported');
  });
});
```

**Step 2: Run to verify it fails**

Run: `npx vitest run tests/screens.test.js`
Expected: FAIL, `renderStart` is not exported.

**Step 3: Implement**

Add to `src/ui/screens.js` (below the code from Task 9; add the import at the top of the file):
```js
import {
  HAIR_COLOURS,
  CLOTHING_COLOURS,
  VOICES,
  ENVIRONMENTS,
  FIELD_LABELS,
} from '../logic/fields.js';

const CHOICE_LABELS = {
  continue: 'Continue with my character',
  'make-new': 'Make a new character',
  'try-out': 'Try-out',
};

export function renderStart(root, { options, notice, onChoose }) {
  root.replaceChildren(
    h(
      'main',
      { class: 'screen' },
      h('h1', {}, 'OpenFreeyond'),
      notice && h('p', { class: 'notice', role: 'status' }, notice),
      options.map((choice) =>
        h('button', { 'data-choice': choice, onClick: () => onChoose(choice) }, CHOICE_LABELS[choice]),
      ),
    ),
  );
}

export function renderConfirm(root, { onYes, onNo }) {
  root.replaceChildren(
    h(
      'main',
      { class: 'screen' },
      h('p', {}, 'Making a new character replaces the one kept in this browser when you finish. Continue?'),
      h('button', { 'data-action': 'yes', onClick: onYes }, 'Yes, make a new one'),
      h('button', { 'data-action': 'no', onClick: onNo }, 'No, go back'),
    ),
  );
}

export function renderMessage(root, message) {
  root.replaceChildren(h('main', { class: 'screen' }, h('p', { role: 'alert' }, message)));
}

const select = (name, items, value) =>
  h(
    'select',
    { id: name, name },
    h('option', { value: '' }, 'Choose...'),
    items.map((i) => h('option', { value: i.id, selected: i.id === value }, i.label)),
  );

export function renderIntake(root, { values, errors, onSubmit, onCancel }) {
  const error = (key) => errors[key] && h('p', { class: 'error', role: 'alert' }, errors[key]);
  const text = (name, label, tag = 'input') =>
    h(
      'div',
      {},
      h('label', { for: name }, label),
      tag === 'input'
        ? h('input', { id: name, name, value: values[name] ?? '', type: 'text' })
        : h('textarea', { id: name, name, rows: 3 }, values[name] ?? ''),
      error(name),
    );

  const form = h(
    'form',
    { novalidate: 'novalidate' },
    text('name', FIELD_LABELS.name),
    text('age', FIELD_LABELS.age),
    h(
      'div',
      {},
      h('label', { for: 'hair' }, 'Hair colour'),
      select('hair', HAIR_COLOURS, values.hair),
      h('label', { for: 'clothing' }, 'Clothing colour'),
      select('clothing', CLOTHING_COLOURS, values.clothing),
      error('appearance'),
    ),
    text('character', FIELD_LABELS.character, 'textarea'),
    text('hobbies', FIELD_LABELS.hobbies, 'textarea'),
    text('background', FIELD_LABELS.background, 'textarea'),
    h('div', {}, h('label', { for: 'voice' }, FIELD_LABELS.voice), select('voice', VOICES, values.voice), error('voice')),
    h(
      'div',
      {},
      h('label', { for: 'environment' }, FIELD_LABELS.environment),
      select('environment', ENVIRONMENTS, values.environment),
      error('environment'),
    ),
    h('button', { type: 'submit' }, 'Enter the place'),
    h('button', { type: 'button', 'data-action': 'cancel', onClick: onCancel }, 'Cancel'),
  );
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    onSubmit(data);
  });
  root.replaceChildren(h('main', { class: 'screen' }, h('h1', {}, 'Make your character'), form));
}
```
Replace `src/main.js` with the real wiring:
```js
import './ui/styles.css';
import { getStorage, loadCharacter, saveCharacter, isHintSeen, markHintSeen } from './logic/store.js';
import { startOptions, resolveChoice, EXAMPLE_CHARACTER } from './logic/startScreen.js';
import { validateIntake, normalizeIntake } from './logic/validate.js';
import { isSupportedBrowser, detectWebGL, SUPPORTED_MESSAGE } from './logic/support.js';
import { renderStart, renderConfirm, renderIntake, renderMessage, renderWorldOverlay } from './ui/screens.js';

const app = document.getElementById('app');
const storage = getStorage();
let world = null;
let brokenShown = false;

const BROKEN_NOTICE =
  'Your kept character could not be read, so the example character is shown. Making a new character replaces it.';
const NOT_KEPT_NOTICE =
  'Nothing will be kept: this browser cannot store your character. You can still explore the place now.';

function leaveWorld() {
  if (world) world.destroy();
  world = null;
}

async function enterWorld(character, { notice = null } = {}) {
  try {
    const { mountWorld } = await import('./world/scene.js');
    leaveWorld();
    app.replaceChildren();
    const stats = new URLSearchParams(window.location.search).has('stats');
    world = mountWorld(app, character, { stats });
    renderWorldOverlay(app, {
      notice,
      showHint: !isHintSeen(storage),
      onDismissHint: () => markHintSeen(storage),
      onBack: showStart,
    });
  } catch {
    leaveWorld();
    renderMessage(app, 'The place could not be loaded. Reload the page to try again.');
  }
}

function showStart() {
  leaveWorld();
  const kept = loadCharacter(storage);
  if (kept.status === 'broken' && !brokenShown) {
    brokenShown = true;
    enterWorld(EXAMPLE_CHARACTER, { notice: BROKEN_NOTICE });
    return;
  }
  renderStart(app, { options: startOptions(kept), onChoose: onChoose });
}

function openIntake(values = {}, errors = {}) {
  renderIntake(app, {
    values,
    errors,
    onCancel: showStart,
    onSubmit: (entered) => {
      const result = validateIntake(entered);
      if (!result.ok) return openIntake(entered, result.errors);
      const character = normalizeIntake(entered);
      const saved = saveCharacter(storage, character);
      enterWorld(character, { notice: saved.ok ? null : NOT_KEPT_NOTICE });
    },
  });
}

function onChoose(choice) {
  const result = resolveChoice(choice, loadCharacter(storage));
  if (result.action === 'enter') enterWorld(result.character);
  else if (result.action === 'confirm-replace') renderConfirm(app, { onYes: () => openIntake(), onNo: showStart });
  else if (result.action === 'intake') openIntake();
}

const supported = isSupportedBrowser({ userAgent: navigator.userAgent, hasWebGL: detectWebGL(document) });
if (supported) showStart();
else renderMessage(app, SUPPORTED_MESSAGE);
```

**Step 4: Run to verify it passes**

Run: `npm test && npm run lint`
Expected: all tests pass, no lint errors.

**Step 5: Check by hand**

Run: `docker compose up`, open `http://localhost:5173`, and walk through:
- Start screen shows "Make a new character" and "Try-out" (FR-10, FR-13).
- Try-out: the place loads with the example character, no account, no personal details; there are no colour choices (AC-5.1, AC-5.2).
- Make a new character with an empty field, then age `17`, then 501 characters of text: each time the field is named and entry is blocked (AC-4.2, AC-4.3).
- A valid intake: the place loads with the chosen colours (AC-4.1, AC-3.1).
- Reload: the start screen shows three options; "Continue" shows the same colours (AC-3.2, AC-4.4, AC-5.3).
- "Try-out", then "Back to start": "Continue" still shows your colours (AC-5.4).
- "Make a new character" shows the confirmation; "No" keeps the old; "Yes" then finishing the form replaces it (AC-5.5).
- In the browser dev tools set `localStorage['openfreeyond.character.v1']` to `{broken`, reload: the example character loads with a message (AC-4.6).
- In a private window of a browser that blocks storage, or after blocking site data, finish the intake: a "Nothing will be kept" message shows and the place still loads (AC-4.7).

**Step 6: Commit**
```bash
git add src tests
git commit -m "feat: start screen, intake form and wiring"
```

---

## Task 11: Hosting and deploy (settles OQ-3: GitHub Pages)

**Delivers:** FR-3, AC-1.4. Story: US-1.

**Files:**
- Create: `.github/workflows/pages.yml`

**Step 1: Write the workflow** (`.github/workflows/pages.yml`)
```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm test
      - run: BASE_PATH=/${{ github.event.repository.name }}/ npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - id: deployment
        uses: actions/deploy-pages@v4
```

**Step 2: Set up GitHub (manual)**

- Create the GitHub repository and push `main`: `git branch -M main`, `git remote add origin <url>`, `git push -u origin main`.
- In the repository settings, Pages, set "Build and deployment" to "GitHub Actions".
- Check that the repository is allowed to use Pages on the account's plan. If it is not free for this repository, stop and tell the PO: assumption A-7 fails and the constraint must be revisited.

**Step 3: Check by hand**

Open the Pages address after the workflow finishes, in a supported browser.
Expected: the place loads with nothing to install, including the character model from `assets/` (AC-1.4). If assets are missing, the `BASE_PATH` is wrong; check the Network tab.

**Step 4: Commit**
```bash
git add .github/workflows/pages.yml
git commit -m "ci: deploy to GitHub Pages"
```

---

## Task 12: Routines outside the product (interviews and weekly notes)

**Delivers:** FR-14, FR-15, FR-16, AC-6.1, AC-6.2, AC-6.3, AC-6.4, AC-7.1. Stories: US-6, US-7.

**Files:**
- Create: `docs/process/interview-routine.md`, `docs/process/interview-tally.md`, `docs/process/session-notes.md`

**Step 1: Write `docs/process/interview-routine.md`**
```markdown
# Interview routine (G-2)

Do this for each independent person. Nothing here happens inside the product.

1. Check that the person is persona-matching and not the builder. Answer yes to all three:
   - Adult.
   - Plays relaxed or story-like games.
   - Uses a desktop or laptop.
2. Share the web address and let them try the place (the try-out is enough). Do not explain it first.
3. Interview them with `discovery/openfreeyond-companion/evidence/interview-guide.md`. Ask this question in the end: "Would you try this?" Note yes, no or unsure.
4. Save notes as `discovery/openfreeyond-companion/evidence/interviews/interview-NN.md` with the note template from the guide. No names, not in the file name and not in the text. Have consent for any recording.
5. Add one row to `docs/process/interview-tally.md`.
```

**Step 2: Write `docs/process/interview-tally.md`**
```markdown
# Interview tally (G-2)

| # | Date | Persona-matching (3 of 3) | Would try it (yes / no / unsure) | Notes file |
|---|---|---|---|---|

## How to read it

- Interviewed = rows in the table.
- Yes = rows with "yes".
- G-2 is **met** when Interviewed is at least 3 and Yes x 3 is at least Interviewed x 2 (two thirds).
- With fewer than 3 interviewed, G-2 is **not yet met**.
- Examples: 2 of 3 met; 3 of 4 met; 2 of 4 not met; 4 of 5 met.
```

**Step 3: Write `docs/process/session-notes.md`**
```markdown
# Session notes (G-1)

Write a line for each relaxing session in the place, at least once per week for 4 weeks after the place is online.
Rating: "feels like mine", 1 to 5.

| Week | Date | Sessions this week | Rating (1-5) | Note |
|---|---|---|---|---|

## How to read it

G-1 is **met** when there was at least 1 session in each of the 4 weeks and the rating is 4 or more.
```

**Step 4: Check against the spec by hand**

- AC-6.1: follow the routine once; the note and the tally row exist and contain no name.
- AC-6.2 and AC-6.3: with a filled and an unfilled tally, the "How to read it" rule gives the right answer (use the examples).
- AC-6.4: search the notes folder for names (`grep -ril` for any name you used while testing); there must be none.
- AC-7.1: after 4 weeks, `session-notes.md` shows sessions per week and ratings.

**Step 5: Commit**
```bash
git add docs/process
git commit -m "docs: interview and session note routines"
```

---

## Task 13: Verification checklist and README (known limitations)

**Delivers:** NFR-1, NFR-2, NFR-3, NFR-4 (and the checks for AC-1.1 to AC-1.7, AC-3.3, AC-4.5). Stories: US-1, US-3, US-4.

**Files:**
- Create: `README.md`, `docs/verification/phase-1-checklist.md`

**Step 1: Write `README.md`**
```markdown
# OpenFreeyond

A cozy 3D place in the desktop browser, with a character who lives there. Phase 1 of the plan in `plans/project-plan.md`.

## Run

- Dev: `docker compose up`, then open http://localhost:5173
- Tests: `npm test`. Lint: `npm run lint`.
- Production build in nginx: `docker build --target prod -t openfreeyond-prod . && docker run --rm -p 8080:80 openfreeyond-prod`
- Frame-rate display: add `?stats` to the address.

## Known limitations (phase 1)

- No accessibility level is promised. Keyboard and mouse or trackpad only (NFR-4).
- Desktop and laptop browsers only: latest Chrome, Firefox and Safari. No mobile support.
- Everything you fill in stays in your own browser. Another browser or device does not see it, and clearing site data removes it.

## Documents

- Spec: `specs/openfreeyond-companion/spec.md`
- Plan: `docs/plans/2026-11-07-openfreeyond-phase-1.md`
- Checklist: `docs/verification/phase-1-checklist.md`
- Interview and session routines: `docs/process/`
```

**Step 2: Write `docs/verification/phase-1-checklist.md`**
```markdown
# Phase 1 verification checklist

Test note: laptop used: ______ . Date: ______ .
Do the browser rows in each of: Chrome ___ Firefox ___ Safari ___ (latest version at the time of testing).

## Per browser (NFR-1, AC-1.7)
- [ ] AC-1.1 Movement keys and mouse or trackpad move and turn the view.
- [ ] AC-1.2 Walking into the house, fence, bench, table, planter and trees is blocked.
- [ ] AC-1.3 Walking outward at every edge keeps you inside the place.
- [ ] AC-1.4 The web address loads the place with nothing to install.
- [ ] AC-1.5 Warm light and domestic objects are visible; no threat or timer.
- [ ] AC-1.6 / NFR-2 Open the address with `?stats`. Walk for 2 minutes through the whole place. The average frames per second is 30 or better. Result: ____ fps.

## Once, on the live address
- [ ] AC-3.3 Colours chosen in one browser are not applied in another browser or on another device.
- [ ] AC-4.5 / NFR-3 Open the browser's network tool, submit the intake: no request carries the entered values. Loading the page and its files is allowed.
- [ ] NFR-3 There are no accounts, no analytics requests and no server storage.
- [ ] NFR-4 The README states that no accessibility level is promised.

## Intake and start screen
The checks of AC-3.1 to AC-5.6 are in Task 10 Step 5 of the plan.
```

**Step 3: Run the checklist**

Fill the checklist on the live address from Task 11, in all three browsers. If any frame-rate result is under 30, record it; per the spec that is a failure of FR-1. Reduce detail (fewer objects, simpler model) in `src/world/layout.js` and `src/world/scene.js`, then repeat.

**Step 4: Commit**
```bash
git add README.md docs/verification
git commit -m "docs: readme and verification checklist"
```

---

## Coverage table

Every FR, NFR and AC ID and the task that delivers it. "T13 (check)" means the task verifies it by hand.

| ID | Task |
|---|---|
| FR-1 | T7 |
| FR-2 | T5, T7 |
| FR-3 | T0 (build), T11 |
| FR-4 | T7 |
| FR-5 | T9 |
| FR-6 | T7, T8 |
| FR-7 | T2, T6, T10 |
| FR-8 | T2, T10 |
| FR-9 | T3, T10 |
| FR-10 | T4, T10 |
| FR-11 | T4, T10 |
| FR-12 | T4, T10 |
| FR-13 | T4, T10 |
| FR-14 | T12 |
| FR-15 | T12 |
| FR-16 | T12 |
| NFR-1 | T1, T13 (check) |
| NFR-2 | T13 (check; `?stats` from T7) |
| NFR-3 | T3, T10, T13 (check) |
| NFR-4 | T13 |
| NFR-5 | T1, T3, T10 |
| AC-1.1 | T7, T13 (check) |
| AC-1.2 | T5, T13 (check) |
| AC-1.3 | T5, T13 (check) |
| AC-1.4 | T11, T13 (check) |
| AC-1.5 | T7, T13 (check) |
| AC-1.6 | T13 (check) |
| AC-1.7 | T13 (check) |
| AC-1.8 | T9 |
| AC-2.1 | T8 |
| AC-2.2 | T8 |
| AC-3.1 | T6, T8, T10 |
| AC-3.2 | T3, T10 |
| AC-3.3 | T3, T13 (check) |
| AC-4.1 | T2, T10 |
| AC-4.2 | T2, T10 |
| AC-4.3 | T2, T10 |
| AC-4.4 | T3, T10 |
| AC-4.5 | T13 (check), T10 (no code sends data) |
| AC-4.6 | T3, T10 |
| AC-4.7 | T3, T10 |
| AC-5.1 | T4, T10 |
| AC-5.2 | T4, T10 |
| AC-5.3 | T4, T10 |
| AC-5.4 | T4, T10 |
| AC-5.5 | T4, T10 |
| AC-5.6 | T1, T10 |
| AC-6.1 | T12 |
| AC-6.2 | T12 |
| AC-6.3 | T12 |
| AC-6.4 | T12 |
| AC-7.1 | T12 |

**Gaps:** none. Every FR, NFR and AC ID has a task.

**Risks to watch in the plan (not gaps):**
- AC-1.6 and AC-1.7 depend on the builder's laptop and on the chosen model's weight; Task 13 may send you back to Task 7 and 8.
- The placeholder colours and voice names (spec OQ-1) must be confirmed by the builder before going online.
- Task 8 depends on the licence of `Casual_Hoodie.fbx`, which is not in the folder. Check it in Step 1. The converted file must stay about 1.3 MB; if colours look wrong after conversion, use the override arguments.
- Task 11 depends on GitHub Pages being free for the repository (assumption A-7).
