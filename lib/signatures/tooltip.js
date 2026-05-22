/**
 * APG Pattern: Tooltip
 * https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/
 *
 * Design notes:
 * - A Tooltip is a popup that displays additional description for a trigger element
 *   on hover or focus. It is non-interactive — users cannot navigate into it.
 * - role="tooltip" on the tooltip container. The trigger references it via
 *   aria-describedby (NOT aria-labelledby — tooltips supplement, not replace, a label).
 * - The tooltip appears on focus AND hover; it dismisses on Escape, blur, or
 *   moving the pointer away. Escape dismissal is the critical keyboard requirement.
 * - Since the tooltip is non-interactive, the trigger element carries the interaction:
 *   in-tab-order, escape-closes, and aria-describedby are checked on or relative to
 *   the trigger, not the tooltip popup itself.
 * - A tooltip popup MUST NOT receive focus. If it contains interactive elements,
 *   it is a dialog, not a tooltip.
 * - aria-describedby on the trigger element links to the tooltip ID. The scorer
 *   checks aria-describedby on the fingerprinted element (assumed to be the trigger).
 */
export default {
  patternName: 'Tooltip',
  patternUrl: 'https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/',

  keyboardInteractions: [
    'Tab: Moves focus to the trigger element; tooltip appears.',
    'Escape: Dismisses the tooltip without moving focus.',
    'Shift+Tab or Tab (away from trigger): Tooltip dismisses as focus leaves.',
  ],

  requiredRoles: ['tooltip (on the tooltip popup element)'],
  requiredAttributes: [
    'aria-describedby (on the trigger — references the tooltip element ID)',
    'id (on the tooltip element — targeted by aria-describedby)',
  ],
  requiredStates: [
    'Tooltip is not focusable (tabindex="-1" or not in tab sequence).',
  ],

  commonFailures: [
    'aria-describedby is absent on the trigger — AT never reads the tooltip content.',
    'role="tooltip" is absent on the popup — it is treated as a generic hidden element.',
    'Escape does not dismiss the tooltip — keyboard users cannot clear it.',
    'The tooltip contains interactive elements — use a dialog instead.',
  ],

  signals: [
    {
      id: 'role-tooltip',
      description: 'Popup element has role="tooltip"',
      weight: 10,
      required: true,
      check: { kind: 'role-equals', role: 'tooltip' },
    },
    {
      id: 'aria-describedby-present',
      description: 'Trigger carries aria-describedby linking to the tooltip',
      weight: 9,
      required: true,
      check: { kind: 'attr-present', attr: 'aria-describedby' },
    },
    {
      id: 'in-tab-order',
      description: 'Trigger element is keyboard reachable',
      weight: 6,
      required: true,
      check: { kind: 'in-tab-order' },
    },
    {
      id: 'escape-closes',
      description: 'Escape dismisses the tooltip',
      weight: 8,
      required: false,
      check: { kind: 'responds-to-key', key: 'Escape', expect: 'close' },
    },
  ],
};
