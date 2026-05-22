// Content script — DOM traversal, scan orchestration, and element fingerprinting
// axe-core is injected by the background service worker before APG_START_SCAN fires

(function () {
if (window.__apgAuditorLoaded) return;
window.__apgAuditorLoaded = true;

let scanInProgress = false;

// ── Inline fingerprint engine ─────────────────────────────────────────────────
// Mirrors lib/fingerprinter.js — kept inline because content scripts cannot
// import ES modules. Any logic change must be mirrored in lib/fingerprinter.js.

const _APG_NATIVE_ROLES = new Map([
  ['button',   () => 'button'],
  ['input',    el => ({ checkbox:'checkbox', radio:'radio', range:'slider',
      number:'spinbutton', button:'button', submit:'button', reset:'button',
      image:'button', search:'searchbox' }[(el.getAttribute('type')||'text').toLowerCase()] ?? 'textbox')],
  ['select',   el => el.multiple ? 'listbox' : 'combobox'],
  ['textarea', () => 'textbox'],
  ['a',        el => el.hasAttribute('href') ? 'link' : null],
  ['area',     el => el.hasAttribute('href') ? 'link' : null],
  ['main',     () => 'main'],     ['nav',     () => 'navigation'],
  ['aside',    () => 'complementary'], ['search',  () => 'search'],
  ['form',     el => (el.getAttribute('aria-label')||el.getAttribute('aria-labelledby')) ? 'form' : null],
  ['section',  el => (el.getAttribute('aria-label')||el.getAttribute('aria-labelledby')) ? 'region' : null],
  ['article',  () => 'article'],
  ['header',   el => _apgIsTopLevel(el) ? 'banner' : null],
  ['footer',   el => _apgIsTopLevel(el) ? 'contentinfo' : null],
  ['h1','h2','h3','h4','h5','h6'].reduce((m,t) => { m.set(t, ()=>'heading'); return m; }, new Map()),
  ['ul', () => 'list'], ['ol', () => 'list'], ['li', () => 'listitem'],
  ['table', () => 'table'], ['tr', () => 'row'], ['td', () => 'cell'],
  ['th',   el => el.getAttribute('scope')==='row' ? 'rowheader' : 'columnheader'],
  ['meter', () => 'meter'], ['progress', () => 'progressbar'],
  ['dialog', () => 'dialog'], ['details', () => 'group'], ['summary', () => 'button'],
  ['img', el => { const a = el.getAttribute('alt'); return a===null?'img':a===''?'presentation':'img'; }],
]);
// Flatten the heading sub-map into the main map
['h1','h2','h3','h4','h5','h6'].forEach(t => _APG_NATIVE_ROLES.set(t, () => 'heading'));

function _apgIsTopLevel(el) {
  let p = el.parentElement;
  while (p) {
    if (['article','aside','main','nav','section'].includes(p.tagName.toLowerCase())) return false;
    p = p.parentElement;
  }
  return true;
}

function _apgComputeRole(el) {
  const explicit = el.getAttribute('role');
  if (explicit) return explicit.trim().split(/\s+/)[0];
  const r = _APG_NATIVE_ROLES.get(el.tagName.toLowerCase());
  return r ? (r(el) || null) : null;
}

const _APG_FOCUSABLE_TAGS = new Set(['button','input','select','textarea','a','area',
  'audio','video','details','summary','iframe']);

function _apgInTabOrder(el) {
  const ti = el.getAttribute('tabindex');
  if (ti !== null) return parseInt(ti, 10) >= 0;
  const tag = el.tagName.toLowerCase();
  if (!_APG_FOCUSABLE_TAGS.has(tag)) return false;
  if (el.disabled) return false;
  if ((tag === 'a' || tag === 'area') && !el.hasAttribute('href')) return false;
  return true;
}

function _apgPassiveFingerprint(el) {
  const tag  = el.tagName.toLowerCase();
  const role = _apgComputeRole(el);
  const attrs = new Set(), attrValues = new Map();
  for (const { name, value } of el.attributes) { attrs.add(name); attrValues.set(name, value); }

  const descendantsByRole = new Map();
  for (const child of el.querySelectorAll('*')) {
    const r = _apgComputeRole(child);
    if (r) descendantsByRole.set(r, (descendantsByRole.get(r) ?? 0) + 1);
  }
  const peersByRole = new Map();
  const parent = el.parentElement;
  if (parent) {
    for (const sib of parent.children) {
      if (sib === el) continue;
      const r = _apgComputeRole(sib);
      if (r) peersByRole.set(r, (peersByRole.get(r) ?? 0) + 1);
    }
  }

  const withTi = el.querySelectorAll('[tabindex]');
  let rovingTabindex = false;
  if (withTi.length >= 2) {
    let hasZero = false, hasNeg = false;
    for (const d of withTi) {
      const v = parseInt(d.getAttribute('tabindex'), 10);
      if (v === 0) hasZero = true; if (v === -1) hasNeg = true;
      if (hasZero && hasNeg) { rovingTabindex = true; break; }
    }
  }

  const cs = window.getComputedStyle(el);
  return { tag, role, attrs, attrValues, inTabOrder: _apgInTabOrder(el),
    tabindexValue: el.getAttribute('tabindex') !== null ? parseInt(el.getAttribute('tabindex'),10) : null,
    descendantsByRole, peersByRole, rovingTabindex, computedStyle: { cursor: cs.cursor } };
}

const _APG_KEY_MAP = { Enter:'Enter', Space:' ', ArrowRight:'ArrowRight', ArrowLeft:'ArrowLeft',
  ArrowDown:'ArrowDown', ArrowUp:'ArrowUp', Escape:'Escape', Home:'Home', End:'End',
  Tab:'Tab', PageDown:'PageDown', PageUp:'PageUp' };
const _APG_PROBE_ORDER = ['ArrowRight','ArrowLeft','ArrowDown','ArrowUp',
  'Home','End','PageDown','PageUp','Escape','Tab','Enter','Space'];

function _apgFireKey(el, signalKey) {
  const key  = _APG_KEY_MAP[signalKey] ?? signalKey;
  const code = signalKey === 'Space' ? 'Space' : signalKey;
  const init = { key, code, bubbles: true, cancelable: true };
  el.dispatchEvent(new KeyboardEvent('keydown', init));
  el.dispatchEvent(new KeyboardEvent('keyup',   init));
}

function _apgSnapAttrs(el) {
  const m = new Map();
  for (const { name, value } of el.attributes) m.set(name, value);
  return m;
}

function _apgDiffAttrs(before, el) {
  const changes = new Map(), after = _apgSnapAttrs(el);
  for (const [n, bv] of before) { const av = after.get(n)??null; if(av!==bv) changes.set(n,{before:bv,after:av}); }
  for (const [n, av] of after)  { if (!before.has(n)) changes.set(n, {before:null,after:av}); }
  return changes;
}

function _apgIsHidden(el) {
  if (!el.isConnected) return true;
  const cs = window.getComputedStyle(el);
  return cs.display==='none' || cs.visibility==='hidden' || el.getAttribute('aria-hidden')==='true';
}

function _apgTick() { return new Promise(r => setTimeout(r, 16)); }

async function _apgActiveFingerprint(el) {
  if (document.activeElement !== el) { el.focus({ preventScroll: true }); await _apgTick(); }
  const keyProbes = new Map();
  let activationMutations = { self: new Map(), parent: new Map() };

  for (const signalKey of _APG_PROBE_ORDER) {
    const beforeFocus  = document.activeElement;
    const beforeAttrs  = _apgSnapAttrs(el);
    const beforeParent = el.parentElement ? _apgSnapAttrs(el.parentElement) : new Map();
    const wasHidden    = _apgIsHidden(el);

    _apgFireKey(el, signalKey);
    await _apgTick();

    const afterFocus     = document.activeElement;
    const attrMutations  = _apgDiffAttrs(beforeAttrs, el);
    const focusMoved     = afterFocus !== beforeFocus;
    const closed         = !wasHidden && _apgIsHidden(el);
    const valueChanged   = attrMutations.has('aria-valuenow') || attrMutations.has('value');
    const activated      = !focusMoved && !closed && attrMutations.size > 0;

    keyProbes.set(signalKey, { focusMoved, activated, closed, valueChanged, attrMutations });

    if (signalKey === 'Enter') {
      const parentMutations = el.parentElement ? _apgDiffAttrs(beforeParent, el.parentElement) : new Map();
      activationMutations = { self: attrMutations, parent: parentMutations };
    }
    if (focusMoved && !closed && el.isConnected) { el.focus({ preventScroll: true }); await _apgTick(); }
    if (closed) break;
  }
  return { keyProbes, activationMutations };
}

function _apgSerializePassive(pf) {
  return { tag: pf.tag, role: pf.role, attrs: [...pf.attrs],
    attrValues: [...pf.attrValues.entries()], inTabOrder: pf.inTabOrder,
    tabindexValue: pf.tabindexValue,
    descendantsByRole: [...pf.descendantsByRole.entries()],
    peersByRole: [...pf.peersByRole.entries()],
    rovingTabindex: pf.rovingTabindex, computedStyle: pf.computedStyle };
}

function _apgSerializeActive(af) {
  return {
    keyProbes: [...af.keyProbes.entries()].map(([k, p]) =>
      [k, { ...p, attrMutations: [...p.attrMutations.entries()] }]),
    activationMutations: {
      self:   [...af.activationMutations.self.entries()],
      parent: [...af.activationMutations.parent.entries()],
    },
  };
}

// ── Listen for scan trigger from service worker or panel ────────────────────

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'START_SCAN') {
    console.log('[APG] START_SCAN received in content script');
    startScan().then(sendResponse);
    return true;
  }
  if (msg.type === 'FINGERPRINT_ELEMENT') {
    (async () => {
      try {
        const el = getElementByXPath(msg.xpath);
        if (!el) { sendResponse({ error: 'Element not found for xpath: ' + msg.xpath }); return; }
        const passive = _apgPassiveFingerprint(el);
        let active = null;
        if (_apgInTabOrder(el)) {
          try { active = await _apgActiveFingerprint(el); } catch { /* passive only */ }
        }
        sendResponse({
          passive: _apgSerializePassive(passive),
          active:  active ? _apgSerializeActive(active) : null,
        });
      } catch (err) {
        sendResponse({ error: err.message });
      }
    })();
    return true;
  }
  if (msg.type === 'PING') {
    sendResponse({ pong: true });
  }
});

// ── Main scan orchestration ──────────────────────────────────────────────────

async function startScan() {
  console.log('[APG] startScan() called, scanInProgress:', scanInProgress);
  if (scanInProgress) return { error: 'Scan already in progress' };
  scanInProgress = true;

  try {
    console.log('[APG] Traversing DOM…');
    notifyPanel({ type: 'SCAN_STATUS', status: 'running', message: 'Traversing DOM…' });

    const components = traverseDOM();
    console.log('[APG] DOM traversal complete, components found:', components.length);
    notifyPanel({ type: 'SCAN_STATUS', status: 'running', message: `Found ${components.length} components. Running axe-core…` });

    console.log('[APG] window.axe available:', typeof window.axe);
    const axeResults = await runAxe();
    console.log('[APG] axe scan complete, violations:', axeResults.violations.length);

    // Map axe violations + incomplete to components where possible
    const mapped = mapAxeToComponents(components, axeResults.violations, axeResults.incomplete);

    notifyPanel({
      type: 'SCAN_COMPLETE',
      components: mapped,
      axeSummary: {
        violations: mapped.filter(c => c.axeViolations?.length > 0).length,
        incomplete: mapped.filter(c => c.axeIncomplete?.length > 0).length,
        passes:     mapped.filter(c => !c.axeViolations?.length && !c.axeIncomplete?.length).length,
        inapplicable: axeResults.inapplicable.length,
      },
    });

    return { ok: true, count: components.length };
  } catch (err) {
    console.error('[APG] Scan error:', err);
    notifyPanel({ type: 'SCAN_ERROR', message: err.message });
    return { error: err.message };
  } finally {
    scanInProgress = false;
  }
}

// ── DOM Traversal ────────────────────────────────────────────────────────────

const INTERACTIVE_SELECTORS = [
  'button', 'input', 'select', 'textarea', 'a[href]',
  '[role="button"]', '[role="link"]', '[role="menuitem"]',
  '[role="menuitemcheckbox"]', '[role="menuitemradio"]',
  '[role="option"]', '[role="tab"]', '[role="treeitem"]',
  '[role="gridcell"]', '[role="columnheader"]', '[role="rowheader"]',
  '[role="slider"]', '[role="spinbutton"]', '[role="switch"]',
  '[role="checkbox"]', '[role="radio"]', '[role="combobox"]',
  '[role="listbox"]', '[role="menu"]', '[role="menubar"]',
  '[role="tablist"]', '[role="tree"]', '[role="treegrid"]',
  '[role="grid"]', '[role="dialog"]', '[role="alertdialog"]',
  'details', 'summary',
  '[tabindex]',
];

const LANDMARK_SELECTORS = [
  'header', 'footer', 'main', 'nav', 'aside', 'section', 'article', 'form',
  '[role="banner"]', '[role="contentinfo"]', '[role="main"]',
  '[role="navigation"]', '[role="complementary"]', '[role="region"]',
  '[role="form"]', '[role="search"]',
];

const NON_INTERACTIVE_SELECTORS = [
  'img', 'svg', 'canvas', 'video', 'audio',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'table', 'figure', 'figcaption',
  '[role="img"]', '[role="figure"]', '[role="table"]',
  '[role="heading"]', '[role="status"]', '[role="alert"]',
  '[role="log"]', '[role="marquee"]', '[role="timer"]',
  '[role="progressbar"]', '[role="tooltip"]',
];

function traverseDOM() {
  const seen = new Set();
  const components = [];
  let idCounter = 0;

  function processEl(el, category) {
    if (seen.has(el)) return;
    seen.add(el);

    const comp = extractComponent(el, category, ++idCounter);
    if (comp) components.push(comp);
  }

  INTERACTIVE_SELECTORS.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => processEl(el, 'interactive'));
  });
  LANDMARK_SELECTORS.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => processEl(el, 'landmark'));
  });
  NON_INTERACTIVE_SELECTORS.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => processEl(el, 'content'));
  });

  return components;
}

function extractComponent(el, category, id) {
  const tagName = el.tagName.toLowerCase();
  const role = el.getAttribute('role') || inferRole(el);
  const componentType = classifyComponent(el, tagName, role);

  // Grab relevant ARIA attributes
  const ariaAttrs = {};
  for (const attr of el.attributes) {
    if (attr.name.startsWith('aria-') || attr.name === 'role' || attr.name === 'tabindex') {
      ariaAttrs[attr.name] = attr.value;
    }
  }

  // Text content / accessible name
  const accessibleName = getAccessibleName(el);

  // XPath for unique identification
  const xpath = getXPath(el);

  // Bounding box for highlight
  const rect = el.getBoundingClientRect();

  return {
    id: `comp-${id}`,
    category,
    componentType,
    tagName,
    role,
    ariaAttrs,
    accessibleName,
    xpath,
    outerHTML: el.outerHTML.substring(0, 500),
    rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
    axeViolations: [],
  };
}

function classifyComponent(el, tagName, role) {
  if (role) {
    const roleMap = {
      button: 'Button', link: 'Link', checkbox: 'Checkbox', radio: 'Radio Button',
      switch: 'Switch', slider: 'Slider', spinbutton: 'Spin Button',
      combobox: 'Combobox', listbox: 'Listbox', option: 'Option',
      menu: 'Menu', menubar: 'Menu Bar', menuitem: 'Menu Item',
      menuitemcheckbox: 'Menu Item Checkbox', menuitemradio: 'Menu Item Radio',
      tab: 'Tab', tablist: 'Tab List', tabpanel: 'Tab Panel',
      tree: 'Tree', treeitem: 'Tree Item', treegrid: 'Tree Grid',
      grid: 'Grid', gridcell: 'Grid Cell', dialog: 'Dialog',
      alertdialog: 'Alert Dialog', alert: 'Alert', status: 'Status',
      progressbar: 'Progress Bar', tooltip: 'Tooltip',
      navigation: 'Navigation', main: 'Main', banner: 'Banner',
      contentinfo: 'Content Info', complementary: 'Complementary',
      region: 'Region', form: 'Form', search: 'Search',
      heading: 'Heading', img: 'Image', figure: 'Figure',
    };
    if (roleMap[role]) return roleMap[role];
  }

  const tagMap = {
    button: 'Button', a: 'Link', input: classifyInput,
    select: 'Select', textarea: 'Textarea',
    details: 'Disclosure', summary: 'Disclosure Summary',
    dialog: 'Dialog', form: 'Form', table: 'Table',
    img: 'Image', svg: 'SVG Image', canvas: 'Canvas',
    video: 'Video', audio: 'Audio', figure: 'Figure',
    h1: 'Heading', h2: 'Heading', h3: 'Heading',
    h4: 'Heading', h5: 'Heading', h6: 'Heading',
    nav: 'Navigation', header: 'Banner', footer: 'Content Info',
    main: 'Main', aside: 'Complementary', section: 'Region',
    article: 'Article',
  };

  const val = tagMap[tagName];
  if (typeof val === 'function') return val(el);
  return val || 'Generic Element';
}

function classifyInput(el) {
  const type = (el.getAttribute('type') || 'text').toLowerCase();
  const inputTypeMap = {
    checkbox: 'Checkbox', radio: 'Radio Button', range: 'Slider',
    number: 'Spin Button', search: 'Search Input', email: 'Email Input',
    tel: 'Telephone Input', url: 'URL Input', date: 'Date Picker',
    time: 'Time Picker', color: 'Color Picker', file: 'File Upload',
    submit: 'Submit Button', reset: 'Reset Button', button: 'Button',
    image: 'Image Button',
  };
  return inputTypeMap[type] || 'Text Input';
}

function inferRole(el) {
  const tag = el.tagName.toLowerCase();
  const roleInference = {
    button: 'button', a: 'link', input: 'textbox',
    select: 'listbox', textarea: 'textbox', img: 'img',
    h1: 'heading', h2: 'heading', h3: 'heading',
    h4: 'heading', h5: 'heading', h6: 'heading',
    nav: 'navigation', header: 'banner', footer: 'contentinfo',
    main: 'main', aside: 'complementary', section: 'region',
    form: 'form', table: 'table', dialog: 'dialog',
  };
  if (tag === 'input') {
    const type = el.getAttribute('type')?.toLowerCase();
    if (type === 'checkbox') return 'checkbox';
    if (type === 'radio') return 'radio';
    if (type === 'range') return 'slider';
  }
  return roleInference[tag] || null;
}

function getAccessibleName(el) {
  // aria-labelledby > aria-label > label element > placeholder > title > text content
  const labelledBy = el.getAttribute('aria-labelledby');
  if (labelledBy) {
    const labelEl = document.getElementById(labelledBy);
    if (labelEl) return labelEl.textContent.trim();
  }
  const ariaLabel = el.getAttribute('aria-label');
  if (ariaLabel) return ariaLabel.trim();

  const id = el.getAttribute('id');
  if (id) {
    const label = document.querySelector(`label[for="${id}"]`);
    if (label) return label.textContent.trim();
  }

  const placeholder = el.getAttribute('placeholder');
  if (placeholder) return `[placeholder] ${placeholder}`;

  const title = el.getAttribute('title');
  if (title) return `[title] ${title}`;

  const text = el.textContent?.trim();
  if (text && text.length < 200) return text;

  const alt = el.getAttribute('alt');
  if (alt !== null) return alt || '[empty alt]';

  return '';
}

function getXPath(el) {
  const parts = [];
  let node = el;
  while (node && node.nodeType === Node.ELEMENT_NODE) {
    let index = 0;
    let sibling = node.previousSibling;
    while (sibling) {
      if (sibling.nodeType === Node.ELEMENT_NODE && sibling.tagName === node.tagName) index++;
      sibling = sibling.previousSibling;
    }
    parts.unshift(`${node.tagName.toLowerCase()}[${index + 1}]`);
    node = node.parentNode;
  }
  return '/' + parts.join('/');
}

// ── axe-core ─────────────────────────────────────────────────────────────────

function runAxe() {
  return new Promise((resolve, reject) => {
    window.axe.run(document, {
      reporter: 'v2',
      resultTypes: ['violations', 'passes', 'incomplete', 'inapplicable'],
    }, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
}

// ── Map axe violations + incomplete to components ─────────────────────────────

function buildAxeMap(rules) {
  const map = new Map();
  rules.forEach(rule => {
    rule.nodes.forEach(node => {
      node.target.forEach(selector => {
        try {
          const el = document.querySelector(selector);
          if (!el) return;
          const existing = map.get(el) || [];
          existing.push({
            id: rule.id,
            impact: rule.impact,
            description: rule.description,
            help: rule.help,
            helpUrl: rule.helpUrl,
            tags: rule.tags,
            // Node-level detail
            html: node.html,
            failureSummary: node.failureSummary,
            target: node.target,
          });
          map.set(el, existing);
        } catch { /* invalid selector — skip */ }
      });
    });
  });
  return map;
}

function mapAxeToComponents(components, violations, incomplete) {
  const violationMap = buildAxeMap(violations);
  const incompleteMap = buildAxeMap(incomplete || []);

  return components.map(comp => {
    try {
      const el = getElementByXPath(comp.xpath);
      if (!el) return comp;
      return {
        ...comp,
        axeViolations: violationMap.get(el) || [],
        axeIncomplete: incompleteMap.get(el) || [],
      };
    } catch { /* skip */ }
    return comp;
  });
}

function getElementByXPath(xpath) {
  const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
  return result.singleNodeValue;
}

// ── Send results to panel ─────────────────────────────────────────────────────

function notifyPanel(data) {
  chrome.runtime.sendMessage({ ...data, source: 'content' });
}
})();
