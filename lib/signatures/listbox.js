/**
 * APG Pattern: Listbox
 * https://www.w3.org/WAI/ARIA/apg/patterns/listbox/
 *
 * Design notes:
 * - Listbox presents a list of options from which users select one or more items.
 *   It is distinct from a Combobox (which wraps a listbox in a collapsible popup)
 *   and from a native <select> (which this pattern is often used to replace).
 * - role="listbox" on the container; role="option" on each item. This is required.
 * - aria-selected on options is required. In a single-select listbox, the selected
 *   option has aria-selected="true"; unselected options have aria-selected="false".
 *   For multi-select, aria-multiselectable="true" on the listbox enables multiple
 *   aria-selected="true" items.
 * - Arrow key navigation between options is required. The listbox uses roving
 *   tabindex or aria-activedescendant for focus management.
 * - Listbox vs Combobox: a standalone listbox is always visible; a combobox popup
 *   listbox is hidden until activated. The scorer must give Combobox higher priority
 *   when role="combobox" is present on a sibling/ancestor input.
 */
export default {
  patternName: 'Listbox',
  patternUrl: 'https://www.w3.org/WAI/ARIA/apg/patterns/listbox/',

  keyboardInteractions: [
    'ArrowDown: Moves focus to next option.',
    'ArrowUp: Moves focus to previous option.',
    'Home: Moves focus to first option.',
    'End: Moves focus to last option.',
    'Enter / Space: Selects the focused option (single-select).',
    'Shift+ArrowDown / Shift+ArrowUp: Extends selection (multi-select).',
    'Ctrl+A: Selects all options (multi-select).',
  ],

  requiredRoles: [
    'listbox (on the container)',
    'option (on each list item)',
  ],
  requiredAttributes: [
    'aria-selected (on each option — "true" for selected, "false" for unselected)',
    'aria-multiselectable="true" (on listbox when multiple selection is supported)',
    'aria-activedescendant (on listbox when using active-descendant focus management)',
  ],
  requiredStates: [
    'aria-selected="true" on the currently selected option(s)',
    'aria-disabled="true" on options that cannot be selected',
  ],

  commonFailures: [
    'role="option" is absent on list items — AT cannot enumerate options.',
    'aria-selected is absent on options — selection state is invisible to AT.',
    'Arrow key navigation is not implemented — keyboard users cannot move between options.',
  ],

  signals: [
    {
      id: 'role-listbox',
      description: 'Container has role="listbox"',
      weight: 10,
      required: true,
      check: { kind: 'role-equals', role: 'listbox' },
    },
    {
      id: 'has-option-role',
      description: 'Contains descendant elements with role="option"',
      weight: 9,
      required: true,
      check: { kind: 'has-descendant-role', role: 'option' },
    },
    {
      id: 'aria-selected-present',
      description: 'Options carry aria-selected',
      weight: 8,
      required: true,
      check: { kind: 'attr-present', attr: 'aria-selected' },
    },
    {
      id: 'in-tab-order',
      description: 'Listbox is reachable by Tab',
      weight: 6,
      required: true,
      check: { kind: 'in-tab-order' },
    },
    {
      id: 'arrow-down-moves-focus',
      description: 'ArrowDown moves focus to next option',
      weight: 9,
      required: true,
      check: { kind: 'responds-to-key', key: 'ArrowDown', expect: 'focus-move' },
    },
    {
      id: 'arrow-up-moves-focus',
      description: 'ArrowUp moves focus to previous option',
      weight: 8,
      required: false,
      check: { kind: 'responds-to-key', key: 'ArrowUp', expect: 'focus-move' },
    },
    {
      id: 'aria-multiselectable-present',
      description: 'aria-multiselectable enables multiple selection',
      weight: 4,
      required: false,
      check: { kind: 'attr-present', attr: 'aria-multiselectable' },
    },
    {
      id: 'aria-activedescendant-present',
      description: 'Uses aria-activedescendant focus management',
      weight: 5,
      required: false,
      check: { kind: 'attr-present', attr: 'aria-activedescendant' },
    },
  ],
};
