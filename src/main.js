import './ui/styles.css';
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
} from './ui/screens.js';

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
    renderMessage(
      app,
      'The place could not be loaded. Reload the page to try again.',
    );
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
  else if (result.action === 'confirm-replace')
    renderConfirm(app, { onYes: () => openIntake(), onNo: showStart });
  else if (result.action === 'intake') openIntake();
}

const supported = isSupportedBrowser({
  userAgent: navigator.userAgent,
  hasWebGL: detectWebGL(document),
});
if (supported) showStart();
else renderMessage(app, SUPPORTED_MESSAGE);
