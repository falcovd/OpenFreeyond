import {
  HAIR_COLOURS,
  CLOTHING_COLOURS,
  VOICES,
  ENVIRONMENTS,
  FIELD_LABELS,
} from '../logic/fields.js';
import { ASSET_RECORDS } from '../data/licences.js';

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

const brandUrl = (file) => `${import.meta.env.BASE_URL}brand/${file}`;
const wordmark = (small = false) =>
  h('img', {
    class: small ? 'brand-wordmark small' : 'brand-wordmark',
    src: brandUrl('wordmark.webp'),
    alt: 'OpenFreeyond',
  });

const isWebUrl = (url) => /^https?:\/\//i.test(url ?? '');

function creditLine(record) {
  const main = record.credit ?? record.author;
  const author =
    record.credit && !record.credit.includes(record.author)
      ? ` by ${record.author}`
      : '';
  return `${main}${author} (${record.licence}) `;
}

// Small footer link on the start screen. It opens the credits panel above it.
function renderFooter() {
  let credits = null;
  const footer = h('footer', { class: 'site-footer' });
  footer.append(
    h(
      'button',
      {
        class: 'link-button',
        'data-action': 'toggle-credits',
        'aria-expanded': 'false',
        onClick: (event) => {
          if (credits) {
            credits.remove();
            credits = null;
          } else {
            credits = h(
              'div',
              { class: 'credits', role: 'region', 'aria-label': 'Credits' },
              h('h2', {}, 'Credits'),
              ASSET_RECORDS.map((r) =>
                h(
                  'p',
                  {},
                  creditLine(r),
                  isWebUrl(r.source) &&
                    h(
                      'a',
                      {
                        href: r.source,
                        target: '_blank',
                        rel: 'noopener noreferrer',
                      },
                      'source',
                    ),
                ),
              ),
            );
            footer.prepend(credits);
          }
          event.currentTarget.setAttribute('aria-expanded', String(!!credits));
        },
      },
      'Credits',
    ),
  );
  return footer;
}

export const DOOR_HINT = 'Click the door to open or close it.';
export const DOOR_STEP_ASIDE =
  'Step out of the way of the door, then click it again.';

// Lets the world change the overlay after it is drawn: the door hint, the step-aside message and the notice.
export function worldMessages(overlay) {
  let doorHint = null;
  let stepAside = null;
  const toggle = (current, visible, cls, text) => {
    if (visible && !current) {
      const el = h('p', { class: cls, role: 'status' }, text);
      overlay.append(el);
      return el;
    }
    if (!visible && current) current.remove();
    return visible ? current : null;
  };
  return {
    setDoorHint(visible) {
      doorHint = toggle(doorHint, visible, 'door-hint', DOOR_HINT);
    },
    setStepAside(visible) {
      stepAside = toggle(stepAside, visible, 'door-step', DOOR_STEP_ASIDE);
    },
    setNotice(text) {
      const el = overlay.querySelector('.notice');
      if (!text) el?.remove();
      else if (el) el.textContent = text;
      else {
        const notice = h('p', { class: 'notice', role: 'status' }, text);
        const back = overlay.querySelector('.back');
        if (back) back.after(notice);
        else overlay.prepend(notice);
      }
    },
  };
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
    h('img', {
      class: 'brand-door',
      src: brandUrl('door.webp'),
      alt: '',
      'aria-hidden': 'true',
    }),
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
      'div',
      { class: 'page' },
      h(
        'main',
        { class: 'start' },
        h(
          'div',
          { class: 'start-main' },
          h('h1', {}, wordmark()),
          notice && h('p', { class: 'notice', role: 'status' }, notice),
          options.map((choice) =>
            h(
              'button',
              { 'data-choice': choice, onClick: () => onChoose(choice) },
              CHOICE_LABELS[choice],
            ),
          ),
        ),
        h(
          'div',
          { class: 'start-art', 'aria-hidden': 'true' },
          h('img', {
            class: 'brand-door',
            src: brandUrl('door.webp'),
            alt: '',
          }),
          h('img', {
            class: 'brand-character',
            src: brandUrl('character.webp'),
            alt: '',
          }),
        ),
      ),
      renderFooter(),
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
    h(
      'main',
      { class: 'screen' },
      wordmark(true),
      h('h1', {}, 'Make your character'),
      form,
    ),
  );
}
