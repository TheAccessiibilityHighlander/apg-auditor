/**
 * APG Pattern: Toolbar
 * https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/
 *
 * Design notes:
 * - A Toolbar is a container of related interactive controls (buttons, toggles,
 *   dropdowns). It uses a single tab stop with arrow key navigation between controls
 *   — the same roving tabindex pattern as Tabs and Radio Group.
 * - role="toolbar" on the container. Controls within the toolbar are standard
 *   interactive elements (buttons, checkboxes, etc.) with their own roles.
 * - Left/Right arrow keys navigate between controls horizontally. Up/Down may be
 *   used for vertical toolbars.
 * - Home/End move to the first/last control.
 * - Tab moves out of the toolbar (to the next element outside it), not between
 *   toolbar controls.
 * - The toolbar must have an accessible label if there are multiple toolbars on
 *   the page; aria-label or aria-labelledby accomplishes this.
 * - Toolbar is distinguished from Menubar by role="toolbar" vs role="menubar".
 *   Toolbar controls are direct interactive widgets; menubar items open submenus.
 */
export default {
  patternName: 'Toolbar',
  patternUrl: 'https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/',

  keyboardInteractions: [
    'Tab: Moves focus into or out of the toolbar (single tab stop).',
    'ArrowRight: Moves focus to next control in the toolbar.',
    'ArrowLeft: Moves focus to previous control in the toolbar.',
    'Home: Moves focus to first control.',
    'End: Moves focus to last control.',
  ],

  requiredRoles: ['toolbar (on the container)'],
  requiredAttributes: [
    'aria-label or aria-labelledby (if multiple toolbars exist on the page)',
  ],
  requiredStates: [],

  commonFailures: [
    'role="toolbar" is absent — AT cannot announce the toolbar container.',
    'Arrow key navigation is not implemented — Tab cycles through every control.',
    'All toolbar buttons are in the tab sequence instead of only the active one.',
  ],

  signals: [
    {
      id: 'role-toolbar',
      description: 'Container has role="toolbar"',
      weight: 10,
      required: true,
      check: { kind: 'role-equals', role: 'toolbar' },
    },
    {
      id: 'in-tab-order',
      description: 'Toolbar has a single tab stop',
      weight: 6,
      required: true,
      check: { kind: 'in-tab-order' },
    },
    {
      id: 'arrow-right-moves-focus',
      description: 'ArrowRight moves focus to next toolbar control',
      weight: 9,
      required: true,
      check: { kind: 'responds-to-key', key: 'ArrowRight', expect: 'focus-move' },
    },
    {
      id: 'arrow-left-moves-focus',
      description: 'ArrowLeft moves focus to previous toolbar control',
      weight: 8,
      required: false,
      check: { kind: 'responds-to-key', key: 'ArrowLeft', expect: 'focus-move' },
    },
    {
      id: 'home-moves-focus',
      description: 'Home moves focus to first toolbar control',
      weight: 4,
      required: false,
      check: { kind: 'responds-to-key', key: 'Home', expect: 'focus-move' },
    },
    {
      id: 'end-moves-focus',
      description: 'End moves focus to last toolbar control',
      weight: 4,
      required: false,
      check: { kind: 'responds-to-key', key: 'End', expect: 'focus-move' },
    },
    {
      id: 'aria-label-present',
      description: 'Toolbar has an accessible label',
      weight: 5,
      required: false,
      check: { kind: 'attr-present', attr: 'aria-label' },
    },
    {
      id: 'roving-tabindex',
      description: 'Uses roving tabindex (one control at 0, rest at -1)',
      weight: 7,
      required: false,
      check: { kind: 'roving-tabindex' },
    },
  ],
};
