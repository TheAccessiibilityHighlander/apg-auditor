/**
 * APG Pattern: Link
 * https://www.w3.org/WAI/ARIA/apg/patterns/link/
 *
 * Design notes:
 * - Link is distinguished from Button by a critical behavioral difference:
 *   Enter activates a link; Space does NOT. Buttons respond to both.
 *   The scorer should treat Space activation as evidence AGAINST Link and FOR Button.
 * - Native <a href="..."> is the strongly preferred implementation. The scorer
 *   must auto-pass enter-activates for native anchor tags.
 * - A link without an href is a placeholder link; it should still have role="link"
 *   and respond to Enter. Placeholder links are valid but unusual.
 * - aria-haspopup on a link-like element is a strong signal toward Menu Button,
 *   not Link — scored as a negative signal (no-popup).
 * - Links open new locations or trigger navigation. If the element triggers an
 *   in-page action (like opening a dialog), it should be a button, not a link.
 * - Accessible name is required — a link must have text content, aria-label,
 *   or aria-labelledby to describe its destination.
 */
export default {
  patternName: 'Link',
  patternUrl: 'https://www.w3.org/WAI/ARIA/apg/patterns/link/',

  keyboardInteractions: [
    'Tab: Moves focus to the link.',
    'Enter: Activates the link (follows href or fires click event).',
    '(Space does NOT activate links — use buttons for in-page actions.)',
  ],

  requiredRoles: ['link (native <a> or role="link")'],
  requiredAttributes: [
    'href (on native <a> — absent on placeholder links)',
    'Accessible name via text content, aria-label, or aria-labelledby',
  ],
  requiredStates: [],

  commonFailures: [
    '<a> element has no href and no role="link" — it is not keyboard accessible.',
    'Link text is non-descriptive ("click here", "read more") — AT cannot convey destination.',
    'Space key is handled as an activator — this is button behavior, not link behavior.',
  ],

  signals: [
    {
      id: 'role-link',
      description: 'Element has role="link" (native or ARIA)',
      weight: 10,
      required: true,
      check: { kind: 'role-equals', role: 'link' },
    },
    {
      id: 'native-anchor-tag',
      description: 'Implemented as a native <a> element',
      weight: 5,
      required: false,
      check: { kind: 'tag-in', tags: ['a'] },
    },
    {
      id: 'in-tab-order',
      description: 'Link is reachable by Tab',
      weight: 6,
      required: true,
      check: { kind: 'in-tab-order' },
    },
    {
      id: 'enter-activates',
      description: 'Enter key activates the link',
      weight: 9,
      required: true,
      check: { kind: 'responds-to-key', key: 'Enter', expect: 'activation' },
    },
    {
      id: 'no-popup',
      description: 'Link does not have aria-haspopup (that would indicate Menu Button)',
      weight: 4,
      required: false,
      check: { kind: 'attr-absent', attr: 'aria-haspopup' },
    },
  ],
};
