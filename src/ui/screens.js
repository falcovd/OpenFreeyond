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
