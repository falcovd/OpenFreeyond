import './ui/styles.css';
import { LOAD_TIMEOUT_MS } from './world/assetLoader.js';
import {
  getStorage,
  loadCharacter,
  saveCharacter,
  isHintSeen,
  markHintSeen,
} from './logic/store.js';
import {
  startOptions,
  resolveChoice,
  EXAMPLE_CHARACTER,
} from './logic/startScreen.js';
import { validateIntake, normalizeIntake } from './logic/validate.js';
import {
  isSupportedBrowser,
  detectWebGL,
  SUPPORTED_MESSAGE,
} from './logic/support.js';
import {
  renderStart,
  renderConfirm,
  renderIntake,
  renderMessage,
  renderWorldOverlay,
  renderLoading,
} from './ui/screens.js';

const app = document.getElementById('app');
const storage = getStorage();
let world = null;
let brokenShown = false;
// Bumped whenever a screen is shown, so a slow world load can tell it is stale.
let screenToken = 0;

const BROKEN_NOTICE =
  'Your kept character could not be read, so the example character is shown. Making a new character replaces it.';
const NOT_KEPT_NOTICE =
  'Nothing will be kept: this browser cannot store your character. You can still explore the place now.';

function leaveWorld() {
  if (world) world.destroy();
  world = null;
}

const LOADING_LIMIT_MS = LOAD_TIMEOUT_MS;

async function enterWorld(character, { notice = null } = {}) {
  const token = ++screenToken;
  const startedAt = Date.now();
  // The cover shows at once and goes when the place is ready or after 30 seconds (FR-15).
  const loading = renderLoading(document.body);
  const limit = setTimeout(() => loading.remove(), LOADING_LIMIT_MS);
  try {
    const { mountWorld } = await import('./world/scene.js');
    if (token !== screenToken) return;
    leaveWorld();
    app.replaceChildren();
    const stats = new URLSearchParams(window.location.search).has('stats');
    const mounted = await mountWorld(app, character, { stats, startedAt });
    if (token !== screenToken) {
      mounted.destroy();
      return;
    }
    world = mounted;
    renderWorldOverlay(app, {
      notice: [notice, mounted.warning].filter(Boolean).join(' ') || null,
      showHint: !isHintSeen(storage),
      onDismissHint: () => markHintSeen(storage),
      onBack: showStart,
    });
  } catch (error) {
    console.error(error);
    if (token !== screenToken) return;
    leaveWorld();
    renderMessage(
      app,
      'The place could not be loaded. Reload the page to try again.',
    );
  } finally {
    clearTimeout(limit);
    loading.remove();
  }
}

function showStart() {
  screenToken++;
  leaveWorld();
  const kept = loadCharacter(storage);
  if (kept.status === 'broken' && !brokenShown) {
    brokenShown = true;
    enterWorld(EXAMPLE_CHARACTER, { notice: BROKEN_NOTICE });
    return;
  }
  renderStart(app, { options: startOptions(kept), onChoose });
}

function openIntake(values = {}, errors = {}) {
  screenToken++;
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
  else if (result.action === 'confirm-replace') {
    screenToken++;
    renderConfirm(app, { onYes: () => openIntake(), onNo: showStart });
  } else if (result.action === 'intake') openIntake();
}

const supported = isSupportedBrowser({
  userAgent: navigator.userAgent,
  hasWebGL: detectWebGL(document),
});
if (supported) showStart();
else renderMessage(app, SUPPORTED_MESSAGE);
