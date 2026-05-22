/**
 * APG Pattern: Menu
 * https://www.w3.org/WAI/ARIA/apg/patterns/menu/
 *
 * Design notes:
 * - A Menu is a list of choices (actions or navigation). It is opened by a trigger
 *   (a Menu Button or a Menubar item) and dismissed after selection or Escape.
 *   This signature targets the menu popup itself, not its trigger.
 * - role="menu" on the container; role="menuitem", role="menuitemcheckbox", or
 *   role="menuitemradio" on items. The scorer checks for any menuitem variant.
 * - Escape must close the menu and return focus to the trigger. This is required.
 * - Arrow keys navigate between items; Home/End jump to first/last.
 * - A menu opened as a submenu also responds to Left arrow (closes submenu and
 *   returns focus to parent menu item) and Right arrow (opens submenu).
 * - Menus are ephemeral — they should not be confused with Menubars (persistent
 *   navigation bars). The absence of role="menubar" as an ancestor is an implicit
 *   distinguisher, but the scorer handles this at a higher level.
 */
export default {
  patternName: 'Menu',
  patternUrl: 'https://www.w3.org/WAI/ARIA/apg/patterns/menu/',

  keyboardInteractions: [
    'ArrowDown: Moves focus to next menu item.',
    'ArrowUp: Moves focus to previous menu item.',
    'Home: Moves focus to first menu item.',
    'End: Moves focus to last menu item.',
    'Enter: Activates the focused menu item and closes the menu.',
    'Escape: Closes the menu and returns focus to the triggering element.',
    'ArrowRight (submenu): Opens a submenu if one exists.',
    'ArrowLeft (submenu): Closes the submenu and returns focus to parent item.',
  ],

  requiredRoles: [
    'menu (on the container)',
    'menuitem / menuitemcheckbox / menuitemradio (on each item)',
  ],
  requiredAttributes: [
    'aria-haspopup (on the trigger button — references the menu type)',
    'aria-expanded (on the trigger — true when menu is open)',
  ],
  requiredStates: [],

  commonFailures: [
    'role="menuitem" is absent on list items — AT cannot navigate the menu by item.',
    'Escape does not close the menu — keyboard users cannot dismiss it.',
    'Arrow key navigation is not implemented — Tab key moves through items instead.',
  ],

  signals: [
    {
      id: 'role-menu',
      description: 'Container has role="menu"',
      weight: 10,
      required: true,
      check: { kind: 'role-equals', role: 'menu' },
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
      description: 'Menu receives focus when opened',
      weight: 6,
      required: true,
      check: { kind: 'in-tab-order' },
    },
    {
      id: 'arrow-down-moves-focus',
      description: 'ArrowDown moves focus to next menu item',
      weight: 9,
      required: true,
      check: { kind: 'responds-to-key', key: 'ArrowDown', expect: 'focus-move' },
    },
    {
      id: 'arrow-up-moves-focus',
      description: 'ArrowUp moves focus to previous menu item',
      weight: 8,
      required: false,
      check: { kind: 'responds-to-key', key: 'ArrowUp', expect: 'focus-move' },
    },
    {
      id: 'escape-closes',
      description: 'Escape closes the menu',
      weight: 9,
      required: true,
      check: { kind: 'responds-to-key', key: 'Escape', expect: 'close' },
    },
    {
      id: 'enter-activates',
      description: 'Enter activates the focused menu item',
      weight: 7,
      required: false,
      check: { kind: 'responds-to-key', key: 'Enter', expect: 'activation' },
    },
  ],
};
