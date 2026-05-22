/**
 * APG Pattern: Combobox
 * https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
 *
 * Design notes:
 * - Covers both ARIA 1.2 (role="combobox" + aria-controls + aria-expanded) and the
 *   widely-deployed ARIA 1.1 pattern (role="textbox" + aria-owns, no aria-expanded).
 * - role-combobox-or-textbox is the required gate: any combobox is on an input element
 *   with either role. role-combobox rewards the correct ARIA 1.2 implementation.
 * - Popup linkage uses aria-controls (ARIA 1.2) OR aria-owns (ARIA 1.1) — neither is
 *   required alone because implementations legitimately use either.
 * - has-listbox-popup was removed: listbox popups are never DOM descendants of the
 *   input; they live elsewhere in the DOM referenced by aria-controls/aria-owns.
 * - aria-haspopup and aria-autocomplete are strong positive identifiers that
 *   distinguish comboboxes from plain text inputs.
 */
export default {
  patternName: 'Combobox',
  patternUrl: 'https://www.w3.org/WAI/ARIA/apg/patterns/combobox/',

  keyboardInteractions: [
    'ArrowDown: Opens popup if closed; moves focus to first/next option in popup.',
    'ArrowUp: Opens popup if closed; moves focus to last/previous option in popup.',
    'Enter: Selects focused option in popup and closes popup.',
    'Escape: Closes popup without selecting; restores original value.',
    'Alt+ArrowDown: Opens popup without moving focus to popup.',
    'Alt+ArrowUp: Closes popup and returns focus to combobox.',
    'Home / End (in input): Moves text cursor to start/end of value.',
    'Printable characters: Type to filter options.',
  ],

  requiredRoles: ['combobox (on input — ARIA 1.2)', 'listbox (on popup)', 'option (on popup items)'],
  requiredAttributes: [
    'aria-expanded (on combobox input — false when closed, true when open)',
    'aria-controls (on combobox input — references the popup element ID)',
    'aria-activedescendant (on combobox input when popup is open and option is focused)',
  ],
  requiredStates: [
    'aria-expanded="false" when popup is closed',
    'aria-expanded="true" when popup is open',
    'aria-selected="true" on the selected option',
  ],

  commonFailures: [
    'aria-expanded is absent — screen readers cannot announce when the popup opens or closes.',
    'aria-controls (or aria-owns) is missing — popup is not programmatically associated with the input.',
    'Popup list items are missing role="option" — screen readers cannot enumerate or navigate options.',
    'role="combobox" is absent — element announces as a plain text field, not a combobox.',
  ],

  signals: [
    {
      id: 'role-combobox-or-textbox',
      description: 'Element has role="combobox" or role="textbox" (ARIA 1.1 uses textbox)',
      weight: 6,
      required: true,
      check: { kind: 'role-in', roles: ['combobox', 'textbox'] },
    },
    {
      id: 'role-combobox',
      description: 'Has role="combobox" — correct ARIA 1.2 implementation',
      weight: 8,
      required: false,
      check: { kind: 'role-equals', role: 'combobox' },
    },
    {
      id: 'native-input-tag',
      description: 'Implemented on a native <input> element',
      weight: 5,
      required: false,
      check: { kind: 'tag-in', tags: ['input'] },
    },
    {
      id: 'in-tab-order',
      description: 'Combobox is reachable by Tab',
      weight: 4,
      required: true,
      check: { kind: 'in-tab-order' },
    },
    {
      id: 'aria-haspopup-present',
      description: 'aria-haspopup signals this input controls a popup',
      weight: 8,
      required: false,
      check: { kind: 'attr-present', attr: 'aria-haspopup' },
    },
    {
      id: 'aria-expanded-present',
      description: 'aria-expanded reflects open/closed popup state',
      weight: 9,
      required: false,
      check: { kind: 'attr-present', attr: 'aria-expanded' },
    },
    {
      id: 'aria-controls-present',
      description: 'aria-controls links input to popup (ARIA 1.2)',
      weight: 7,
      required: false,
      check: { kind: 'attr-present', attr: 'aria-controls' },
    },
    {
      id: 'aria-owns-present',
      description: 'aria-owns links input to popup (ARIA 1.1 pattern)',
      weight: 6,
      required: false,
      check: { kind: 'attr-present', attr: 'aria-owns' },
    },
    {
      id: 'aria-autocomplete-present',
      description: 'aria-autocomplete indicates filtering/suggestion behavior',
      weight: 6,
      required: false,
      check: { kind: 'attr-present', attr: 'aria-autocomplete' },
    },
    {
      id: 'arrowdown-opens-or-moves',
      description: 'ArrowDown opens popup or moves to next suggestion',
      weight: 7,
      required: false,
      check: { kind: 'responds-to-key', key: 'ArrowDown', expect: 'activation' },
    },
    {
      id: 'escape-closes',
      description: 'Escape closes the popup',
      weight: 7,
      required: false,
      check: { kind: 'responds-to-key', key: 'Escape', expect: 'close' },
    },
    {
      id: 'enter-selects',
      description: 'Enter selects the highlighted option',
      weight: 6,
      required: false,
      check: { kind: 'responds-to-key', key: 'Enter', expect: 'activation' },
    },
    {
      id: 'activation-toggles-expanded',
      description: 'Interaction toggles aria-expanded state',
      weight: 8,
      required: false,
      check: { kind: 'activation-mutates', target: 'self', attr: 'aria-expanded' },
    },
  ],
};
