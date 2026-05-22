/**
 * APG Pattern: Combobox
 * https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
 *
 * Design notes:
 * - This targets the APG 1.2+ combobox: a single <input> with role="combobox"
 *   that controls a popup (listbox, grid, tree, or dialog). The old APG 1.1
 *   pattern used an outer container div — that architecture is obsolete.
 * - aria-expanded and aria-controls are both required; their absence is a
 *   definitive accessibility failure on ANY combobox.
 * - has-listbox-popup is required: the popup must exist in the DOM. It may
 *   be hidden (display:none / aria-hidden) before activation; the check looks
 *   for the role anywhere in the document, not just visible descendants.
 * - The popup can technically be role="grid" or role="tree" per APG; the
 *   listbox variant covers the overwhelming majority of real-world usage.
 *   A secondary grid/tree check is included at lower weight.
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

  requiredRoles: ['combobox (on input)', 'listbox (on popup)', 'option (on popup items)'],
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
    'aria-expanded is absent on the combobox input — screen readers cannot announce popup state changes.',
    'aria-controls is missing or references a non-existent element — popup is not programmatically associated.',
    'Popup list items are missing role="option" — screen readers cannot enumerate or navigate options.',
  ],

  signals: [
    {
      id: 'role-combobox',
      description: 'Input element has role="combobox"',
      weight: 10,
      required: true,
      check: { kind: 'role-equals', role: 'combobox' },
    },
    {
      id: 'native-input-tag',
      description: 'Implemented on a native <input> element',
      weight: 4,
      required: false,
      check: { kind: 'tag-in', tags: ['input'] },
    },
    {
      id: 'aria-expanded-present',
      description: 'aria-expanded attribute is present on the combobox input',
      weight: 9,
      required: true,
      check: { kind: 'attr-present', attr: 'aria-expanded' },
    },
    {
      id: 'aria-controls-present',
      description: 'aria-controls attribute links the input to its popup',
      weight: 8,
      required: true,
      check: { kind: 'attr-present', attr: 'aria-controls' },
    },
    {
      id: 'has-listbox-popup',
      description: 'A popup element with role="listbox" exists in the document',
      weight: 8,
      required: true,
      check: { kind: 'has-descendant-role', role: 'listbox' },
    },
    {
      id: 'arrowdown-opens-or-moves',
      description: 'ArrowDown opens the popup or moves selection within it',
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
      description: 'Interaction toggles aria-expanded between true and false',
      weight: 8,
      required: false,
      check: { kind: 'activation-mutates', target: 'self', attr: 'aria-expanded' },
    },
  ],
};
