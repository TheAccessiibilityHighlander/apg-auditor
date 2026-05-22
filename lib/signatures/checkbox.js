/**
 * APG Pattern: Checkbox
 * https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/
 *
 * Design notes:
 * - Two variants: standard binary checkbox (checked/unchecked) and tri-state
 *   checkbox (checked/unchecked/mixed). Both are covered by this signature.
 * - Native <input type="checkbox"> is the preferred implementation. The scorer
 *   must auto-pass space-activates and aria-checked for native checkboxes since
 *   the browser manages checked state via the `checked` property, not aria-checked.
 * - For ARIA custom checkboxes: role="checkbox" + aria-checked are required.
 *   aria-checked="mixed" signals the tri-state variant.
 * - Space toggles the checkbox; Enter does NOT activate checkboxes per APG
 *   (Enter is reserved for forms). Enter is therefore absent from this signature.
 * - activation-mutates checks aria-checked for ARIA path; native path toggles
 *   the DOM `checked` property instead, which the scorer must handle specially.
 */
export default {
  patternName: 'Checkbox',
  patternUrl: 'https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/',

  keyboardInteractions: [
    'Tab: Moves focus to the checkbox.',
    'Space: Toggles the checkbox state (checked / unchecked / mixed).',
  ],

  requiredRoles: ['checkbox (native or ARIA)'],
  requiredAttributes: [
    'aria-checked (on ARIA checkbox — "true", "false", or "mixed" for tri-state)',
  ],
  requiredStates: [
    'aria-checked="true" when checked',
    'aria-checked="false" when unchecked',
    'aria-checked="mixed" when indeterminate (tri-state only)',
  ],

  commonFailures: [
    'aria-checked is absent on a custom ARIA checkbox — state changes are invisible to AT.',
    'Space key does not toggle the checkbox — custom checkboxes must implement this explicitly.',
    'Tri-state checkbox uses aria-checked="mixed" but does not visually distinguish the mixed state.',
  ],

  signals: [
    {
      id: 'role-checkbox',
      description: 'Element has role="checkbox" (ARIA or native)',
      weight: 10,
      required: true,
      check: { kind: 'role-equals', role: 'checkbox' },
    },
    {
      id: 'native-checkbox-tag',
      description: 'Implemented as a native <input type="checkbox">',
      weight: 5,
      required: false,
      check: { kind: 'tag-in', tags: ['input'] },
    },
    {
      id: 'in-tab-order',
      description: 'Checkbox is reachable by Tab',
      weight: 6,
      required: true,
      check: { kind: 'in-tab-order' },
    },
    {
      id: 'aria-checked-present',
      description: 'aria-checked attribute is present (ARIA path)',
      weight: 9,
      required: false,
      check: { kind: 'attr-present', attr: 'aria-checked' },
    },
    {
      id: 'space-activates',
      description: 'Space key toggles the checkbox state',
      weight: 9,
      required: true,
      check: { kind: 'responds-to-key', key: 'Space', expect: 'activation' },
    },
    {
      id: 'activation-mutates-checked',
      description: 'Activation toggles aria-checked on the element (ARIA path)',
      weight: 8,
      required: false,
      check: { kind: 'activation-mutates', target: 'self', attr: 'aria-checked' },
    },
  ],
};
