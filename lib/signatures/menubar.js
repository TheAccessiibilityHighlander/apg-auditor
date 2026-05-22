/**
 * APG Pattern: Menu Bar
 * https://www.w3.org/WAI/ARIA/apg/patterns/menubar/
 *
 * Design notes:
 * - A Menubar is a persistent horizontal bar of menu items, typically a top-level
 *   application navigation bar (like File, Edit, View in a desktop application).
 *   It differs from a Menu in that it is always visible, not a popup.
 * - role="menubar" on the container; role="menuitem" on top-level items.
 *   Items that open submenus carry aria-haspopup="menu" and aria-expanded.
 * - Horizontal arrow keys (Left/Right) navigate between top-level items; this is
 *   the primary differentiator from a Menu (which uses vertical arrow keys).
 * - Down arrow from a menubar item opens its submenu. Up arrow may open and jump
 *   to the last item. Escape from a submenu returns to the menubar item.
 * - Home/End move to first/last menubar item. Tab exits the menubar entirely.
 * - The menubar itself has a single tab stop (roving tabindex); Tab moves focus
 *   out of the menubar, not between menubar items.
 */
export default {
  patternName: 'Menu Bar',
  patternUrl: 'https://www.w3.org/WAI/ARIA/apg/patterns/menubar/',

  keyboardInteractions: [
    'ArrowRight: Moves focus to next menu item in the bar.',
    'ArrowLeft: Moves focus to previous menu item in the bar.',
    'ArrowDown: Opens the submenu of the focused item and moves focus into it.',
    'ArrowUp: Opens the submenu and moves focus to its last item.',
    'Home: Moves focus to first item in the menubar.',
    'End: Moves focus to last item in the menubar.',
    'Escape: Closes any open submenu; returns focus to the menubar item.',
    'Tab: Moves focus to next element outside the menubar.',
  ],

  requiredRoles: [
    'menubar (on the container)',
    'menuitem (on each top-level item)',
  ],
  requiredAttributes: [
    'aria-haspopup (on items with submenus)',
    'aria-expanded (on items with submenus)',
  ],
  requiredStates: [],

  commonFailures: [
    'role="menubar" is absent — AT treats the bar as a generic group of buttons.',
    'Arrow key navigation is not implemented — Tab moves between items instead.',
    'Submenus lack role="menu" — the popup hierarchy is invisible to AT.',
  ],

  signals: [
    {
      id: 'role-menubar',
      description: 'Container has role="menubar"',
      weight: 10,
      required: true,
      check: { kind: 'role-equals', role: 'menubar' },
    },
    {
      id: 'has-menuitem-role',
      description: 'Contains descendant elements with role="menuitem"',
      weight: 9,
      required: true,
      check: { kind: 'has-descendant-role', role: 'menuitem' },
    },
    {
      id: 'in-tab-order',
      description: 'Menubar has a single tab stop',
      weight: 6,
      required: true,
      check: { kind: 'in-tab-order' },
    },
    {
      id: 'arrow-right-moves-focus',
      description: 'ArrowRight moves focus to next menubar item',
      weight: 9,
      required: true,
      check: { kind: 'responds-to-key', key: 'ArrowRight', expect: 'focus-move' },
    },
    {
      id: 'arrow-left-moves-focus',
      description: 'ArrowLeft moves focus to previous menubar item',
      weight: 8,
      required: false,
      check: { kind: 'responds-to-key', key: 'ArrowLeft', expect: 'focus-move' },
    },
    {
      id: 'arrow-down-opens-submenu',
      description: 'ArrowDown opens a submenu from the focused item',
      weight: 7,
      required: false,
      check: { kind: 'responds-to-key', key: 'ArrowDown', expect: 'activation' },
    },
    {
      id: 'home-moves-focus',
      description: 'Home moves focus to first menubar item',
      weight: 4,
      required: false,
      check: { kind: 'responds-to-key', key: 'Home', expect: 'focus-move' },
    },
    {
      id: 'end-moves-focus',
      description: 'End moves focus to last menubar item',
      weight: 4,
      required: false,
      check: { kind: 'responds-to-key', key: 'End', expect: 'focus-move' },
    },
  ],
};
