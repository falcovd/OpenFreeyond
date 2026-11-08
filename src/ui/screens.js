import {
  HAIR_COLOURS,
  CLOTHING_COLOURS,
  VOICES,
  ENVIRONMENTS,
  FIELD_LABELS,
} from '../logic/fields.js';

export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key.startsWith('on'))
      el.addEventListener(key.slice(2).toLowerCase(), value);
    else if (key === 'class') el.className = value;
    else if (value !== null && value !== undefined && value !== false)
      el.setAttribute(key, value);
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    el.append(child.nodeType ? child : document.createTextNode(child));
  }
  return el;
}

export function renderWorldOverlay(
  root,
  { notice, showHint, onDismissHint, onBack },
) {
  const overlay = h('div', { class: 'overlay' });
  overlay.append(
    h(
      'button',
      { class: 'back', 'data-action': 'back', onClick: onBack },
      'Back to start',
    ),
  );
  if (notice)
    overlay.append(h('p', { class: 'notice', role: 'status' }, notice));
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

// Full-screen "loading" cover. Returns the element; the caller removes it (FR-15).
export function renderLoading(root) {
  const el = h(
    'div',
    { class: 'loading', role: 'status', 'aria-live': 'polite' },
    h('div', { class: 'spinner', 'aria-hidden': 'true' }),
    h('p', {}, 'Loading the place…'),
  );
  root.append(el);
  return el;
}

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
        h(
          'button',
          { 'data-choice': choice, onClick: () => onChoose(choice) },
          CHOICE_LABELS[choice],
        ),
      ),
    ),
  );
}

export function renderConfirm(root, { onYes, onNo }) {
  root.replaceChildren(
    h(
      'main',
      { class: 'screen' },
      h(
        'p',
        {},
        'Making a new character replaces the one kept in this browser when you finish. Continue?',
      ),
      h(
        'button',
        { 'data-action': 'yes', onClick: onYes },
        'Yes, make a new one',
      ),
      h('button', { 'data-action': 'no', onClick: onNo }, 'No, go back'),
    ),
  );
}

export function renderMessage(root, message) {
  root.replaceChildren(
    h('main', { class: 'screen' }, h('p', { role: 'alert' }, message)),
  );
}

const select = (name, items, value) =>
  h(
    'select',
    { id: name, name },
    h('option', { value: '' }, 'Choose...'),
    items.map((i) =>
      h('option', { value: i.id, selected: i.id === value }, i.label),
    ),
  );

export function renderIntake(root, { values, errors, onSubmit, onCancel }) {
  const error = (key) =>
    errors[key] && h('p', { class: 'error', role: 'alert' }, errors[key]);
  const text = (name, label, tag = 'input') =>
    h(
      'div',
      {},
      h('label', { for: name }, label),
      tag === 'input'
        ? h('input', {
            id: name,
            name,
            value: values[name] ?? '',
            type: 'text',
          })
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
    h(
      'div',
      {},
      h('label', { for: 'voice' }, FIELD_LABELS.voice),
      select('voice', VOICES, values.voice),
      error('voice'),
    ),
    h(
      'div',
      {},
      h('label', { for: 'environment' }, FIELD_LABELS.environment),
      select('environment', ENVIRONMENTS, values.environment),
      error('environment'),
    ),
    h('button', { type: 'submit' }, 'Enter the place'),
    h(
      'button',
      { type: 'button', 'data-action': 'cancel', onClick: onCancel },
      'Cancel',
    ),
  );
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    onSubmit(data);
  });
  root.replaceChildren(
    h('main', { class: 'screen' }, h('h1', {}, 'Make your character'), form),
  );
}
