/**
 * lib/fingerprinter.js
 *
 * Two-phase DOM fingerprinting engine.
 *
 * passiveFingerprint(el)         — synchronous, pure DOM inspection, no side effects
 * activeFingerprint(el, keys?)   — async keyboard probing with best-effort restoration
 *
 * Runs inside the page context (content script or MAIN world) where the live DOM
 * is accessible.
 */

// ─── Native ARIA role map (HTML-AAM condensed) ───────────────────────────────

const NATIVE_ROLES = new Map([
  // Buttons
  ['button',   () => 'button'],
  ['input',    el => {
    const t = (el.getAttribute('type') || 'text').toLowerCase();
    return {
      checkbox: 'checkbox',
      radio:    'radio',
      range:    'slider',
      number:   'spinbutton',
      button:   'button',
      submit:   'button',
      reset:    'button',
      image:    'button',
      search:   'searchbox',
    }[t] ?? 'textbox';
  }],
  ['select',   el => el.multiple ? 'listbox' : 'combobox'],
  ['textarea', () => 'textbox'],
  // Links
  ['a',        el => el.hasAttribute('href') ? 'link' : null],
  ['area',     el => el.hasAttribute('href') ? 'link' : null],
  // Landmarks
  ['main',     () => 'main'],
  ['nav',      () => 'navigation'],
  ['aside',    () => 'complementary'],
  ['search',   () => 'search'],
  ['form',     el => el.getAttribute('aria-label') || el.getAttribute('aria-labelledby')
                     ? 'form' : null],
  ['section',  el => el.getAttribute('aria-label') || el.getAttribute('aria-labelledby')
                     ? 'region' : null],
  ['article',  () => 'article'],
  ['header',   el => isTopLevelSection(el) ? 'banner' : null],
  ['footer',   el => isTopLevelSection(el) ? 'contentinfo' : null],
  // Headings
  ['h1', () => 'heading'], ['h2', () => 'heading'], ['h3', () => 'heading'],
  ['h4', () => 'heading'], ['h5', () => 'heading'], ['h6', () => 'heading'],
  // Lists
  ['ul',  () => 'list'],
  ['ol',  () => 'list'],
  ['li',  () => 'listitem'],
  // Table
  ['table',    () => 'table'],
  ['tr',       () => 'row'],
  ['td',       () => 'cell'],
  ['th',       el => (el.getAttribute('scope') === 'row') ? 'rowheader' : 'columnheader'],
  ['caption',  () => null],
  // Range / progress
  ['meter',    () => 'meter'],
  ['progress', () => 'progressbar'],
  // Dialog
  ['dialog',   () => 'dialog'],
  // Details/Summary
  ['details',  () => 'group'],
  ['summary',  () => 'button'],
  // Images
  ['img', el => {
    const alt = el.getAttribute('alt');
    if (alt === null) return 'img';
    if (alt === '')   return 'presentation';
    return 'img';
  }],
]);

function isTopLevelSection(el) {
  let p = el.parentElement;
  while (p) {
    const t = p.tagName.toLowerCase();
    if (['article', 'aside', 'main', 'nav', 'section'].includes(t)) return false;
    p = p.parentElement;
  }
  return true;
}

/**
 * Resolve the computed ARIA role for an element.
 * Explicit role= attribute wins; native role is the fallback.
 */
function computeRole(el) {
  const explicit = el.getAttribute('role');
  if (explicit) return explicit.trim().split(/\s+/)[0];
  const tag = el.tagName.toLowerCase();
  const resolver = NATIVE_ROLES.get(tag);
  if (!resolver) return null;
  const role = resolver(el);
  return role || null;
}

// ─── Tab order ───────────────────────────────────────────────────────────────

const NATIVELY_FOCUSABLE = new Set(['button', 'input', 'select', 'textarea', 'a', 'area',
  'audio', 'video', 'details', 'summary', 'iframe']);

function inTabOrder(el) {
  const ti = el.getAttribute('tabindex');
  if (ti !== null) return parseInt(ti, 10) >= 0;
  const tag = el.tagName.toLowerCase();
  if (!NATIVELY_FOCUSABLE.has(tag)) return false;
  if (el.disabled) return false;
  if ((tag === 'a' || tag === 'area') && !el.hasAttribute('href')) return false;
  return true;
}

// ─── Passive fingerprint ─────────────────────────────────────────────────────

/**
 * @typedef {object} PassiveFingerprint
 * @property {string}           tag
 * @property {string|null}      role
 * @property {Set<string>}      attrs          — attribute names present
 * @property {Map<string,string>} attrValues   — attribute name → current value
 * @property {boolean}          inTabOrder
 * @property {number|null}      tabindexValue
 * @property {Map<string,number>} descendantsByRole
 * @property {Map<string,number>} peersByRole  — sibling elements' roles
 * @property {boolean}          rovingTabindex
 * @property {{ cursor: string }} computedStyle
 */

/**
 * Synchronous, read-only inspection of a DOM element.
 * @param {Element} el
 * @returns {PassiveFingerprint}
 */
export function passiveFingerprint(el) {
  const tag = el.tagName.toLowerCase();
  const role = computeRole(el);

  // All attribute names + values
  const attrs = new Set();
  const attrValues = new Map();
  for (const { name, value } of el.attributes) {
    attrs.add(name);
    attrValues.set(name, value);
  }

  // Descendants by role
  const descendantsByRole = new Map();
  for (const child of el.querySelectorAll('*')) {
    const r = computeRole(child);
    if (r) descendantsByRole.set(r, (descendantsByRole.get(r) ?? 0) + 1);
  }

  // Siblings by role (peers)
  const peersByRole = new Map();
  const parent = el.parentElement;
  if (parent) {
    for (const sib of parent.children) {
      if (sib === el) continue;
      const r = computeRole(sib);
      if (r) peersByRole.set(r, (peersByRole.get(r) ?? 0) + 1);
    }
  }

  // Roving tabindex: descendants mix tabindex=0 and tabindex=-1 on same role
  const rovingTabindex = detectRovingTabindex(el);

  // Sampled computed style
  const cs = window.getComputedStyle(el);

  return {
    tag,
    role,
    attrs,
    attrValues,
    inTabOrder: inTabOrder(el),
    tabindexValue: el.getAttribute('tabindex') !== null
      ? parseInt(el.getAttribute('tabindex'), 10)
      : null,
    descendantsByRole,
    peersByRole,
    rovingTabindex,
    computedStyle: { cursor: cs.cursor },
  };
}

function detectRovingTabindex(el) {
  const withTabindex = el.querySelectorAll('[tabindex]');
  if (withTabindex.length < 2) return false;
  let hasZero = false, hasNegOne = false;
  for (const d of withTabindex) {
    const v = parseInt(d.getAttribute('tabindex'), 10);
    if (v === 0)  hasZero = true;
    if (v === -1) hasNegOne = true;
    if (hasZero && hasNegOne) return true;
  }
  return false;
}

// ─── Active fingerprint ──────────────────────────────────────────────────────

// Signal key name → KeyboardEvent key value
const KEY_MAP = {
  Enter:     'Enter',
  Space:     ' ',
  ArrowRight:'ArrowRight',
  ArrowLeft: 'ArrowLeft',
  ArrowDown: 'ArrowDown',
  ArrowUp:   'ArrowUp',
  Escape:    'Escape',
  Home:      'Home',
  End:       'End',
  Tab:       'Tab',
  PageDown:  'PageDown',
  PageUp:    'PageUp',
};

// Probe order: navigation keys first (less state-destructive), activation last
const PROBE_ORDER = [
  'ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp',
  'Home', 'End', 'PageDown', 'PageUp',
  'Escape', 'Tab', 'Enter', 'Space',
];

/** All keys used across any signal in the signature library. */
export const DEFAULT_PROBE_KEYS = new Set(PROBE_ORDER);

function fireKey(el, signalKey) {
  const key = KEY_MAP[signalKey] ?? signalKey;
  const init = {
    key,
    code: signalKey === 'Space' ? 'Space' : signalKey,
    bubbles: true,
    cancelable: true,
  };
  el.dispatchEvent(new KeyboardEvent('keydown', init));
  el.dispatchEvent(new KeyboardEvent('keyup',   init));
}

function snapshotAttrs(el) {
  const snap = new Map();
  for (const { name, value } of el.attributes) snap.set(name, value);
  return snap;
}

function diffAttrs(before, el) {
  const changes = new Map();
  const after = snapshotAttrs(el);
  // Changed or removed
  for (const [name, beforeVal] of before) {
    const afterVal = after.get(name) ?? null;
    if (afterVal !== beforeVal) changes.set(name, { before: beforeVal, after: afterVal });
  }
  // Added
  for (const [name, afterVal] of after) {
    if (!before.has(name)) changes.set(name, { before: null, after: afterVal });
  }
  return changes;
}

function isHidden(el) {
  if (!el.isConnected) return true;
  const cs = window.getComputedStyle(el);
  return cs.display === 'none' || cs.visibility === 'hidden' || el.getAttribute('aria-hidden') === 'true';
}

/**
 * @typedef {object} KeyProbeResult
 * @property {boolean}                             focusMoved
 * @property {boolean}                             activated    — non-focus mutation observed
 * @property {boolean}                             closed       — element became hidden
 * @property {boolean}                             valueChanged — aria-valuenow or value attr changed
 * @property {Map<string,{before,after}>}           attrMutations — mutations on the element itself
 */

/**
 * @typedef {object} ActiveFingerprint
 * @property {Map<string, KeyProbeResult>} keyProbes
 * @property {{ self: Map, parent: Map }}  activationMutations — attrs mutated on Enter
 */

/**
 * Asynchronously probe keyboard behavior on a focused element.
 * Best-effort: restores focus after each key; cannot undo all state changes.
 *
 * @param {Element} el
 * @param {Set<string>} [keys]  — signal key names to probe (defaults to all)
 * @returns {Promise<ActiveFingerprint>}
 */
export async function activeFingerprint(el, keys = DEFAULT_PROBE_KEYS) {
  // Ensure the element is focused before probing
  if (document.activeElement !== el) {
    el.focus({ preventScroll: true });
    await tick();
  }

  const keyProbes = new Map();
  let activationMutations = { self: new Map(), parent: new Map() };

  for (const signalKey of PROBE_ORDER) {
    if (!keys.has(signalKey)) continue;

    const beforeFocus    = document.activeElement;
    const beforeAttrs    = snapshotAttrs(el);
    const beforeParent   = el.parentElement ? snapshotAttrs(el.parentElement) : new Map();
    const wasHidden      = isHidden(el);

    // Observe attribute mutations via MutationObserver as a cross-check
    const observedMutations = new Map();
    const observer = new MutationObserver(recs => {
      for (const r of recs) {
        if (r.type === 'attributes') {
          const attr = r.attributeName;
          if (!observedMutations.has(attr)) {
            observedMutations.set(attr, {
              before: r.oldValue,
              after: r.target.getAttribute(attr),
            });
          }
        }
      }
    });
    observer.observe(el, { attributes: true, attributeOldValue: true });

    // Fire the key
    fireKey(beforeFocus === el ? el : el, signalKey);
    await tick();
    observer.disconnect();

    const afterFocus = document.activeElement;
    const attrMutations = diffAttrs(beforeAttrs, el);

    const focusMoved    = afterFocus !== beforeFocus;
    const isNowHidden   = isHidden(el);
    const closed        = !wasHidden && isNowHidden;
    const valueChanged  = attrMutations.has('aria-valuenow') || attrMutations.has('value');
    const activated     = !focusMoved && !closed && attrMutations.size > 0;

    keyProbes.set(signalKey, { focusMoved, activated, closed, valueChanged, attrMutations });

    // Capture activation-specific parent mutations for Enter key
    if (signalKey === 'Enter') {
      const parentMutations = el.parentElement ? diffAttrs(beforeParent, el.parentElement) : new Map();
      activationMutations = { self: attrMutations, parent: parentMutations };
    }

    // Restore focus to element if it moved somewhere else
    if (focusMoved && !closed && el.isConnected) {
      el.focus({ preventScroll: true });
      await tick();
    }

    // If something closed, stop probing — further probes would be meaningless
    if (closed) break;
  }

  return { keyProbes, activationMutations };
}

/** One event-loop tick — enough for synchronous and rAF-based DOM updates. */
function tick() {
  return new Promise(resolve => setTimeout(resolve, 16));
}
