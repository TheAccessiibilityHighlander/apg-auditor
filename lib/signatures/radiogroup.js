/**
 * APG Pattern: Radio Group
 * https://www.w3.org/WAI/ARIA/apg/patterns/radio/
 *
 * Design notes:
 * - A Radio Group is a set of mutually exclusive choices. Selecting one deselects
 *   all others. It uses role="radiogroup" on the container with role="radio" children.
 * - Native <input type="radio"> grouped by name attribute is the preferred implementation.
 *   The scorer must auto-pass aria-checked and arrow key nav for native radio inputs.
 * - The radio group has a single tab stop: Tab moves into the group (to the checked
 *   or first radio), then arrow keys move within the group (roving tabindex).
 *   This is the same roving tabindex pattern as Tabs.
 * - aria-checked on each radio is required. Unlike checkboxes, radios use
 *   aria-checked="true"/"false" only (no "mixed").
 * - Arrow keys (Up/Down or Left/Right) move focus AND select the radio simultaneously
 *   (auto-selection). This differs from Listbox where selection is a separate action.
 * - activation-mutates checks aria-checked flipping to "true" on the focused item.
 */
export default {
  patternName: 'Radio Group',
  patternUrl: 'https://www.w3.org/WAI/ARIA/apg/patterns/radio/',

  keyboardInteractions: [
    'Tab: Moves focus to the checked radio (or first radio if none checked).',
    'ArrowDown / ArrowRight: Moves focus to next radio and selects it.',
    'ArrowUp / ArrowLeft: Moves focus to previous radio and selects it.',
    'Space: Selects the focused radio (if not already selected).',
  ],

  requiredRoles: [
    'radiogroup (on the container)',
    'radio (on each option)',
  ],
  requiredAttributes: [
    'aria-checked (on each radio — "true" for selected, "false" for unselected)',
    'aria-labelledby or aria-label (on the radiogroup — describes the group question)',
  ],
  requiredStates: [
    'Exactly one aria-checked="true" among the radios in the group (or none if no default).',
  ],

  commonFailures: [
    'Arrow keys do not move focus within the group — keyboard users cannot change selection.',
    'aria-checked is absent on radio items — selection state is invisible to AT.',
    'The group has no accessible label — AT cannot announce what question the radios answer.',
  ],

  signals: [
    {
      id: 'role-radiogroup',
      description: 'Container has role="radiogroup"',
      weight: 9,
      required: true,
      check: { kind: 'role-equals', role: 'radiogroup' },
    },
    {
      id: 'has-radio-role',
      description: 'Contains descendant elements with role="radio"',
      weight: 9,
      required: true,
      check: { kind: 'has-descendant-role', role: 'radio' },
    },
    {
      id: 'aria-checked-present',
      description: 'Radio items carry aria-checked',
      weight: 8,
      required: true,
      check: { kind: 'attr-present', attr: 'aria-checked' },
    },
    {
      id: 'in-tab-order',
      description: 'Radio group has a single tab stop',
      weight: 6,
      required: true,
      check: { kind: 'in-tab-order' },
    },
    {
      id: 'arrow-down-moves-focus',
      description: 'ArrowDown moves focus to next radio option',
      weight: 9,
      required: true,
      check: { kind: 'responds-to-key', key: 'ArrowDown', expect: 'focus-move' },
    },
    {
      id: 'arrow-right-moves-focus',
      description: 'ArrowRight moves focus to next radio option',
      weight: 7,
      required: false,
      check: { kind: 'responds-to-key', key: 'ArrowRight', expect: 'focus-move' },
    },
    {
      id: 'roving-tabindex',
      description: 'Uses roving tabindex (checked/active radio: 0, others: -1)',
      weight: 7,
      required: false,
      check: { kind: 'roving-tabindex' },
    },
    {
      id: 'aria-label-present',
      description: 'Group has an accessible label',
      weight: 6,
      required: false,
      check: { kind: 'attr-present', attr: 'aria-label' },
    },
  ],
};
