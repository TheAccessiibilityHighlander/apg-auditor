/**
 * APG Pattern: Menu Button
 * https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/
 *
 * Design notes:
 * - A Menu Button is a button that opens a popup menu. It is the trigger half of
 *   the Menu pattern; the menu popup itself is covered by the Menu signature.
 * - The decisive signals: role="button" (or native button) + aria-haspopup + aria-expanded.
 *   This combination distinguishes Menu Button from a plain Button (no aria-haspopup)
 *   and from a Combobox (no aria-haspopup="menu", different popup type).
 * - aria-haspopup values: "menu" (most common), "true" (legacy, equivalent to "menu").
 *   Values of "listbox", "tree", "grid", or "dialog" indicate Combobox-family patterns.
 * - Enter and Space both open the menu (same as a standard button activating something).
 *   ArrowDown may also open the menu and move focus to the first item.
 * - When the menu is open, Enter/Space may also activate the focused menu item.
 *   These interactions are in the Menu signature, not here.
 * - activation-mutates checks aria-expanded: false→true on first activation.
 */
export default {
  patternName: 'Menu Button',
  patternUrl: 'https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/',

  keyboardInteractions: [
    'Enter / Space: Opens the menu and moves focus to first item (or last item with Up arrow).',
    'ArrowDown (optional): Opens the menu and moves focus to first item.',
    'ArrowUp (optional): Opens the menu and moves focus to last item.',
  ],

  requiredRoles: ['button (the trigger element)'],
  requiredAttributes: [
    'aria-haspopup="menu" (or "true") — declares that this button opens a menu',
    'aria-expanded="false" when menu is closed, "true" when open',
    'aria-controls (references the menu element ID)',
  ],
  requiredStates: [
    'aria-expanded="false" when the menu is closed',
    'aria-expanded="true" when the menu is open',
  ],

  commonFailures: [
    'aria-haspopup is absent — AT cannot announce that this button opens a menu.',
    'aria-expanded is absent — open/closed state is not communicated to AT.',
    'ArrowDown does not open the menu — common APG keyboard shortcut is missing.',
  ],

  signals: [
    {
      id: 'role-button',
      description: 'Trigger has role="button"',
      weight: 7,
      required: true,
      check: { kind: 'role-equals', role: 'button' },
    },
    {
      id: 'aria-haspopup-present',
      description: 'aria-haspopup declares the popup type (menu or true)',
      weight: 10,
      required: true,
      check: { kind: 'attr-present', attr: 'aria-haspopup' },
    },
    {
      id: 'aria-expanded-present',
      description: 'aria-expanded reflects open/closed state of the menu',
      weight: 9,
      required: true,
      check: { kind: 'attr-present', attr: 'aria-expanded' },
    },
    {
      id: 'in-tab-order',
      description: 'Button is reachable by Tab',
      weight: 5,
      required: true,
      check: { kind: 'in-tab-order' },
    },
    {
      id: 'enter-activates',
      description: 'Enter opens the menu',
      weight: 7,
      required: false,
      check: { kind: 'responds-to-key', key: 'Enter', expect: 'activation' },
    },
    {
      id: 'space-activates',
      description: 'Space opens the menu',
      weight: 6,
      required: false,
      check: { kind: 'responds-to-key', key: 'Space', expect: 'activation' },
    },
    {
      id: 'activation-mutates-expanded',
      description: 'Activation toggles aria-expanded on the button',
      weight: 8,
      required: false,
      check: { kind: 'activation-mutates', target: 'self', attr: 'aria-expanded' },
    },
    {
      id: 'arrowdown-opens-menu',
      description: 'ArrowDown opens the menu',
      weight: 6,
      required: false,
      check: { kind: 'responds-to-key', key: 'ArrowDown', expect: 'activation' },
    },
  ],
};
