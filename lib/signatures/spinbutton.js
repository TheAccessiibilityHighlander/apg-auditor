/**
 * APG Pattern: Spinbutton
 * https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/
 *
 * Design notes:
 * - A Spinbutton allows users to select a value from a discrete ordered set by
 *   typing or by pressing Up/Down arrows. It is like a slider but text-input-based.
 * - Native <input type="number"> is the preferred implementation but has known
 *   accessibility inconsistencies across browsers/AT. ARIA spinbutton is often used
 *   as a replacement.
 * - role="spinbutton" is required. aria-valuenow (or the input's value attribute)
 *   reflects the current value.
 * - ArrowUp increases; ArrowDown decreases. These use expect:'value-change' since
 *   the visible value changes, not focus position.
 * - Page Up/Down may increase/decrease by a larger step (optional).
 * - Home sets to minimum; End sets to maximum (optional).
 * - The spinbutton is typically accompanied by increment/decrement buttons, but
 *   these are supplementary UI — the ARIA role on the input is the authoritative signal.
 */
export default {
  patternName: 'Spinbutton',
  patternUrl: 'https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/',

  keyboardInteractions: [
    'ArrowUp: Increases the value by one step.',
    'ArrowDown: Decreases the value by one step.',
    'Home: Sets to minimum value.',
    'End: Sets to maximum value.',
    'Page Up (optional): Increases value by a larger step.',
    'Page Down (optional): Decreases value by a larger step.',
  ],

  requiredRoles: ['spinbutton (on the input element)'],
  requiredAttributes: [
    'aria-valuenow (current value)',
    'aria-valuemin (minimum value)',
    'aria-valuemax (maximum value)',
    'aria-valuetext (when the numeric value alone is insufficient)',
  ],
  requiredStates: [
    'aria-valuenow updates when the user increments/decrements the value.',
  ],

  commonFailures: [
    'role="spinbutton" is absent on a custom spinner — AT treats it as a generic input.',
    'aria-valuenow is absent — AT cannot announce the current value.',
    'Arrow keys do not change the value — keyboard users cannot increment/decrement.',
  ],

  signals: [
    {
      id: 'role-spinbutton',
      description: 'Element has role="spinbutton"',
      weight: 10,
      required: true,
      check: { kind: 'role-equals', role: 'spinbutton' },
    },
    {
      id: 'native-number-tag',
      description: 'Implemented as a native <input type="number">',
      weight: 4,
      required: false,
      check: { kind: 'tag-in', tags: ['input'] },
    },
    {
      id: 'in-tab-order',
      description: 'Spinbutton is reachable by Tab',
      weight: 6,
      required: true,
      check: { kind: 'in-tab-order' },
    },
    {
      id: 'aria-valuenow-present',
      description: 'aria-valuenow specifies the current value',
      weight: 9,
      required: false, // native <input type="number"> uses the value attribute, not aria-valuenow
      check: { kind: 'attr-present', attr: 'aria-valuenow' },
    },
    {
      id: 'aria-valuemin-present',
      description: 'aria-valuemin specifies the minimum',
      weight: 6,
      required: false,
      check: { kind: 'attr-present', attr: 'aria-valuemin' },
    },
    {
      id: 'aria-valuemax-present',
      description: 'aria-valuemax specifies the maximum',
      weight: 6,
      required: false,
      check: { kind: 'attr-present', attr: 'aria-valuemax' },
    },
    {
      id: 'arrowup-changes-value',
      description: 'ArrowUp increases the value',
      weight: 9,
      required: true,
      check: { kind: 'responds-to-key', key: 'ArrowUp', expect: 'value-change' },
    },
    {
      id: 'arrowdown-changes-value',
      description: 'ArrowDown decreases the value',
      weight: 8,
      required: false,
      check: { kind: 'responds-to-key', key: 'ArrowDown', expect: 'value-change' },
    },
  ],
};
