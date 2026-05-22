/**
 * tests/scorer.test.js
 *
 * Unit tests for lib/scorer.js.
 * Uses Node's built-in test runner — no dependencies required.
 * Run: node --test tests/scorer.test.js
 *
 * Tests use manually constructed fingerprints so no DOM/browser is needed.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { score, scoreAll } from '../lib/scorer.js';

// ─── Fingerprint factories ────────────────────────────────────────────────────

function makePassive(overrides = {}) {
  return {
    tag:               'div',
    role:              null,
    attrs:             new Set(),
    attrValues:        new Map(),
    inTabOrder:        false,
    tabindexValue:     null,
    descendantsByRole: new Map(),
    peersByRole:       new Map(),
    rovingTabindex:    false,
    computedStyle:     { cursor: 'default' },
    ...overrides,
  };
}

function makeActive(keyProbes = {}, activationMutations = {}) {
  return {
    keyProbes: new Map(Object.entries({
      Enter:      { focusMoved: false, activated: false, closed: false, valueChanged: false, attrMutations: new Map() },
      Space:      { focusMoved: false, activated: false, closed: false, valueChanged: false, attrMutations: new Map() },
      ArrowRight: { focusMoved: false, activated: false, closed: false, valueChanged: false, attrMutations: new Map() },
      ArrowLeft:  { focusMoved: false, activated: false, closed: false, valueChanged: false, attrMutations: new Map() },
      ArrowDown:  { focusMoved: false, activated: false, closed: false, valueChanged: false, attrMutations: new Map() },
      ArrowUp:    { focusMoved: false, activated: false, closed: false, valueChanged: false, attrMutations: new Map() },
      Escape:     { focusMoved: false, activated: false, closed: false, valueChanged: false, attrMutations: new Map() },
      Home:       { focusMoved: false, activated: false, closed: false, valueChanged: false, attrMutations: new Map() },
      End:        { focusMoved: false, activated: false, closed: false, valueChanged: false, attrMutations: new Map() },
      ...keyProbes,
    })),
    activationMutations: {
      self:   new Map(),
      parent: new Map(),
      ...activationMutations,
    },
  };
}

function fp(passiveOverrides = {}, activeOverrides = null) {
  return {
    passive: makePassive(passiveOverrides),
    active:  activeOverrides,
  };
}

// ─── Minimal signature fixtures ───────────────────────────────────────────────

const SIG_BUTTON = {
  patternName: 'Button',
  patternUrl:  'https://www.w3.org/WAI/ARIA/apg/patterns/button/',
  signals: [
    { id: 'role-button',        weight: 8, required: false, check: { kind: 'role-equals', role: 'button' } },
    { id: 'native-button-tag',  weight: 5, required: false, check: { kind: 'tag-in', tags: ['button', 'input'] } },
    { id: 'in-tab-order',       weight: 6, required: true,  check: { kind: 'in-tab-order' } },
    { id: 'enter-activates',    weight: 9, required: true,  check: { kind: 'responds-to-key', key: 'Enter', expect: 'activation' } },
    { id: 'space-activates',    weight: 8, required: true,  check: { kind: 'responds-to-key', key: 'Space', expect: 'activation' } },
    { id: 'no-menu-popup',      weight: 3, required: false, check: { kind: 'attr-absent', attr: 'aria-haspopup' } },
  ],
};

const SIG_DISCLOSURE = {
  patternName: 'Disclosure',
  patternUrl:  'https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/',
  signals: [
    { id: 'in-tab-order',              weight: 5, required: true,  check: { kind: 'in-tab-order' } },
    { id: 'enter-activates',           weight: 8, required: true,  check: { kind: 'responds-to-key', key: 'Enter', expect: 'activation' } },
    { id: 'role-button',               weight: 6, required: false, check: { kind: 'role-equals', role: 'button' } },
    { id: 'aria-expanded-present',     weight: 9, required: false, check: { kind: 'attr-present', attr: 'aria-expanded' } },
    { id: 'activation-mutates-expanded', weight: 9, required: false, check: { kind: 'activation-mutates', target: 'self', attr: 'aria-expanded' } },
    { id: 'native-details-tag',        weight: 8, required: false, check: { kind: 'tag-in', tags: ['details', 'summary'] } },
    { id: 'activation-mutates-open',   weight: 9, required: false, check: { kind: 'activation-mutates', target: 'parent', attr: 'open' } },
  ],
};

const SIG_COMBOBOX = {
  patternName: 'Combobox',
  patternUrl:  'https://www.w3.org/WAI/ARIA/apg/patterns/combobox/',
  signals: [
    { id: 'role-combobox',       weight: 10, required: true,  check: { kind: 'role-equals', role: 'combobox' } },
    { id: 'aria-expanded-present', weight: 9, required: true, check: { kind: 'attr-present', attr: 'aria-expanded' } },
    { id: 'aria-controls-present', weight: 8, required: true, check: { kind: 'attr-present', attr: 'aria-controls' } },
    { id: 'has-listbox-popup',   weight: 8, required: true,   check: { kind: 'has-descendant-role', role: 'listbox' } },
  ],
};

const SIG_TABS = {
  patternName: 'Tabs',
  patternUrl:  'https://www.w3.org/WAI/ARIA/apg/patterns/tabs/',
  signals: [
    { id: 'role-tab',             weight: 8, required: true, check: { kind: 'has-descendant-role', role: 'tab' } },
    { id: 'has-tabpanel',         weight: 7, required: true, check: { kind: 'has-descendant-role', role: 'tabpanel' } },
    { id: 'aria-selected-present',weight: 8, required: true, check: { kind: 'attr-present', attr: 'aria-selected' } },
    { id: 'roving-tabindex',      weight: 8, required: true, check: { kind: 'roving-tabindex' } },
    { id: 'arrow-right-moves-focus', weight: 9, required: true, check: { kind: 'responds-to-key', key: 'ArrowRight', expect: 'focus-move' } },
    { id: 'peer-group-tabs',      weight: 4, required: false, check: { kind: 'peer-group-min', role: 'tab', min: 2 } },
  ],
};

const SIG_SLIDER = {
  patternName: 'Slider',
  patternUrl:  'https://www.w3.org/WAI/ARIA/apg/patterns/slider/',
  signals: [
    { id: 'role-slider',              weight: 10, required: true, check: { kind: 'role-equals', role: 'slider' } },
    { id: 'in-tab-order',             weight: 6,  required: true, check: { kind: 'in-tab-order' } },
    { id: 'aria-valuenow-present',    weight: 9,  required: true, check: { kind: 'attr-present', attr: 'aria-valuenow' } },
    { id: 'arrow-right-changes-value',weight: 9,  required: true, check: { kind: 'responds-to-key', key: 'ArrowRight', expect: 'value-change' } },
  ],
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('score() — basic checks', () => {

  it('returns full confidence for a perfect native button', () => {
    // Native <button> — auto-pass for enter/space activation
    const result = score(SIG_BUTTON, fp({
      tag:        'button',
      role:       'button',
      inTabOrder: true,
    }));
    assert.equal(result.confidence, 1.0);
    assert.equal(result.hardFailed, false);
    assert.deepEqual(result.requiredFailed, []);
  });

  it('caps confidence at 0.4 when a required signal fails', () => {
    // div with no tabindex — in-tab-order fails
    const result = score(SIG_BUTTON, fp({
      tag:        'div',
      role:       'button',
      inTabOrder: false,
    }));
    assert.equal(result.hardFailed, true);
    assert.ok(result.confidence <= 0.4, `expected <= 0.4, got ${result.confidence}`);
    assert.ok(result.requiredFailed.includes('in-tab-order'));
  });

  it('scores zero confidence when ALL required signals fail', () => {
    const result = score(SIG_COMBOBOX, fp({
      tag:  'div',
      role: 'button',   // wrong role
    }));
    assert.equal(result.hardFailed, true);
    assert.ok(result.confidence <= 0.4);
    assert.ok(result.requiredFailed.includes('role-combobox'));
  });

  it('awards full credit when all signals pass', () => {
    const result = score(SIG_COMBOBOX, fp({
      tag:  'input',
      role: 'combobox',
      attrs: new Set(['aria-expanded', 'aria-controls']),
      descendantsByRole: new Map([['listbox', 1]]),
    }));
    assert.equal(result.confidence, 1.0);
    assert.equal(result.hardFailed, false);
  });

});

describe('score() — responds-to-key', () => {

  it('passes focus-move check when key moved focus', () => {
    const active = makeActive({ ArrowRight: { focusMoved: true, activated: false, closed: false, valueChanged: false, attrMutations: new Map() } });
    const result = score(SIG_TABS, {
      passive: makePassive({
        descendantsByRole: new Map([['tab', 3], ['tabpanel', 3]]),
        attrs:             new Set(['aria-selected']),
        rovingTabindex:    true,
      }),
      active,
    });
    const arrowSig = result.signals.find(s => s.id === 'arrow-right-moves-focus');
    assert.equal(arrowSig.passed, true);
    assert.equal(result.hardFailed, false);
  });

  it('fails focus-move check when key did not move focus', () => {
    const result = score(SIG_TABS, {
      passive: makePassive({
        descendantsByRole: new Map([['tab', 3], ['tabpanel', 3]]),
        attrs:             new Set(['aria-selected']),
        rovingTabindex:    true,
      }),
      active: makeActive(), // ArrowRight focusMoved: false by default
    });
    const arrowSig = result.signals.find(s => s.id === 'arrow-right-moves-focus');
    assert.equal(arrowSig.passed, false);
    assert.equal(result.hardFailed, true); // arrow-right required
  });

  it('passes value-change check when aria-valuenow changed', () => {
    const active = makeActive({
      ArrowRight: { focusMoved: false, activated: false, closed: false, valueChanged: true, attrMutations: new Map() },
    });
    const result = score(SIG_SLIDER, {
      passive: makePassive({
        tag:        'div',
        role:       'slider',
        attrs:      new Set(['aria-valuenow']),
        inTabOrder: true,
      }),
      active,
    });
    const valueSig = result.signals.find(s => s.id === 'arrow-right-changes-value');
    assert.equal(valueSig.passed, true);
  });

  it('auto-passes Enter activation for native <button>', () => {
    const result = score(SIG_BUTTON, fp({
      tag:        'button',
      role:       'button',
      inTabOrder: true,
    }));
    const enterSig = result.signals.find(s => s.id === 'enter-activates');
    assert.equal(enterSig.passed, true);
    assert.match(enterSig.reason, /auto-pass/);
  });

  it('auto-passes Space activation for native <button>', () => {
    const result = score(SIG_BUTTON, fp({
      tag:        'button',
      role:       'button',
      inTabOrder: true,
    }));
    const spaceSig = result.signals.find(s => s.id === 'space-activates');
    assert.equal(spaceSig.passed, true);
    assert.match(spaceSig.reason, /auto-pass/);
  });

  it('auto-passes Enter activation for native <a>', () => {
    const result = score(SIG_BUTTON, fp({ tag: 'a', role: 'link', inTabOrder: true }));
    const enterSig = result.signals.find(s => s.id === 'enter-activates');
    assert.equal(enterSig.passed, true);
  });

  it('does NOT auto-pass Space for native <a> (links do not respond to Space)', () => {
    const result = score(SIG_BUTTON, fp({ tag: 'a', role: 'link', inTabOrder: true }));
    const spaceSig = result.signals.find(s => s.id === 'space-activates');
    // No active fingerprint → skipped, not auto-passed
    assert.equal(spaceSig.skipped, true);
  });

});

describe('score() — activation-mutates', () => {

  it('passes activation-mutates self when attr changed on Enter', () => {
    const active = makeActive({}, {
      self: new Map([['aria-expanded', { before: 'false', after: 'true' }]]),
    });
    const result = score(SIG_DISCLOSURE, {
      passive: makePassive({
        tag:        'button',
        role:       'button',
        attrs:      new Set(['aria-expanded']),
        inTabOrder: true,
      }),
      active,
    });
    const mutSig = result.signals.find(s => s.id === 'activation-mutates-expanded');
    assert.equal(mutSig.passed, true);
  });

  it('passes activation-mutates parent for native <details> path', () => {
    const active = makeActive({}, {
      parent: new Map([['open', { before: null, after: '' }]]),
    });
    const result = score(SIG_DISCLOSURE, {
      passive: makePassive({
        tag:        'summary',
        role:       'button',
        inTabOrder: true,
      }),
      active,
    });
    const mutSig = result.signals.find(s => s.id === 'activation-mutates-open');
    assert.equal(mutSig.passed, true);
  });

});

describe('score() — no active fingerprint', () => {

  it('skips responds-to-key checks when active fingerprint is null', () => {
    const result = score(SIG_BUTTON, fp({ tag: 'div', role: 'button', inTabOrder: true }));
    const enterSig = result.signals.find(s => s.id === 'enter-activates');
    assert.equal(enterSig.skipped, true);
    assert.equal(enterSig.passed, false);
  });

  it('skipped required signals go to requiredSkipped, not requiredFailed', () => {
    // No active fingerprint → responds-to-key signals are skipped, not failed.
    // Skipped signals are excluded from maxScore, so confidence reflects only
    // what was actually checked (passive signals).
    const result = score(SIG_BUTTON, fp({ tag: 'div', role: 'button', inTabOrder: true }));
    assert.ok(!result.requiredFailed.includes('enter-activates'),
      'skipped signal should not appear in requiredFailed');
    assert.ok(!result.requiredFailed.includes('space-activates'),
      'skipped signal should not appear in requiredFailed');
    assert.ok(result.requiredSkipped.includes('enter-activates'),
      'skipped required signal should appear in requiredSkipped');
    assert.ok(result.requiredSkipped.includes('space-activates'),
      'skipped required signal should appear in requiredSkipped');
    // hardFailed should be false — no checks ran and failed
    assert.equal(result.hardFailed, false);
  });

});

describe('score() — peer-group-min', () => {

  it('passes when element + peers meet the minimum', () => {
    const result = score(SIG_TABS, {
      passive: makePassive({
        role:              'tab',
        attrs:             new Set(['aria-selected']),
        descendantsByRole: new Map([['tab', 2], ['tabpanel', 3]]),
        peersByRole:       new Map([['tab', 2]]),  // 2 sibling tabs + self = 3
        rovingTabindex:    true,
      }),
      active: makeActive({ ArrowRight: { focusMoved: true, activated: false, closed: false, valueChanged: false, attrMutations: new Map() } }),
    });
    const peerSig = result.signals.find(s => s.id === 'peer-group-tabs');
    assert.equal(peerSig.passed, true);
  });

  it('fails when only one tab exists (no peers)', () => {
    const result = score(SIG_TABS, {
      passive: makePassive({
        role:              'tab',
        attrs:             new Set(['aria-selected']),
        descendantsByRole: new Map([['tab', 1], ['tabpanel', 1]]),
        peersByRole:       new Map(), // no siblings
        rovingTabindex:    false,
      }),
      active: makeActive(),
    });
    const peerSig = result.signals.find(s => s.id === 'peer-group-tabs');
    assert.equal(peerSig.passed, false);
  });

});

describe('score() — computed-style', () => {

  it('passes when cursor matches expected value', () => {
    const SIG_WITH_STYLE = {
      patternName: 'Test',
      patternUrl:  'https://example.com',
      signals: [
        { id: 'cursor-pointer', weight: 2, required: false,
          check: { kind: 'computed-style', property: 'cursor', value: 'pointer' } },
      ],
    };
    const result = score(SIG_WITH_STYLE, fp({ computedStyle: { cursor: 'pointer' } }));
    assert.equal(result.signals[0].passed, true);
  });

  it('fails when cursor does not match', () => {
    const SIG_WITH_STYLE = {
      patternName: 'Test',
      patternUrl:  'https://example.com',
      signals: [
        { id: 'cursor-pointer', weight: 2, required: false,
          check: { kind: 'computed-style', property: 'cursor', value: 'pointer' } },
      ],
    };
    const result = score(SIG_WITH_STYLE, fp({ computedStyle: { cursor: 'default' } }));
    assert.equal(result.signals[0].passed, false);
  });

});

describe('scoreAll()', () => {

  it('returns results sorted by confidence descending', () => {
    const sigs = new Map([
      ['Button',    SIG_BUTTON],
      ['Combobox',  SIG_COMBOBOX],
      ['Disclosure', SIG_DISCLOSURE],
    ]);
    // Combobox-shaped element
    const fingerprint = fp({
      tag:               'input',
      role:              'combobox',
      attrs:             new Set(['aria-expanded', 'aria-controls']),
      inTabOrder:        true,
      descendantsByRole: new Map([['listbox', 1]]),
    });
    const results = scoreAll(sigs, fingerprint);
    assert.equal(results[0].patternName, 'Combobox');
    for (let i = 1; i < results.length; i++) {
      assert.ok(results[i - 1].confidence >= results[i].confidence,
        `results not sorted: index ${i-1} (${results[i-1].confidence}) < index ${i} (${results[i].confidence})`);
    }
  });

  it('gives Combobox top score for a combobox element', () => {
    const sigs = new Map([
      ['Button',   SIG_BUTTON],
      ['Combobox', SIG_COMBOBOX],
      ['Slider',   SIG_SLIDER],
    ]);
    const results = scoreAll(sigs, fp({
      tag:               'input',
      role:              'combobox',
      attrs:             new Set(['aria-expanded', 'aria-controls']),
      inTabOrder:        true,
      descendantsByRole: new Map([['listbox', 1]]),
    }));
    assert.equal(results[0].patternName, 'Combobox');
    assert.equal(results[0].confidence, 1.0);
  });

});
