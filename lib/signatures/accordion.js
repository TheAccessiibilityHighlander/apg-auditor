/**
 * APG Pattern: Accordion
 * https://www.w3.org/WAI/ARIA/apg/patterns/accordion/
 *
 * Design notes:
 * - Accordion is a coordinated group of disclosures. The primary distinguisher
 *   from a standalone Disclosure is peer-group-min: at least 2 sibling header
 *   buttons with aria-expanded must exist.
 * - Each accordion header is a <button> (or role="button") with aria-expanded.
 *   The controlled panel ideally has role="region" with aria-labelledby pointing
 *   back to the header — this association is optional per APG but strongly recommended.
 * - APG specifies both "single open" and "multi-open" variants; the scorer does
 *   not distinguish between them.
 * - The signal set largely mirrors Disclosure, with peer-group-min added as the
 *   distinguishing signal and has-region-panel as a supporting signal.
 */
export default {
  patternName: 'Accordion',
  patternUrl: 'https://www.w3.org/WAI/ARIA/apg/patterns/accordion/',

  keyboardInteractions: [
    'Enter / Space: Toggles the visibility of the associated panel.',
    'Tab: Moves focus to next focusable element (not necessarily next accordion header).',
    'Shift+Tab: Moves focus to previous focusable element.',
    'Down Arrow (optional): Moves focus to next accordion header.',
    'Up Arrow (optional): Moves focus to previous accordion header.',
    'Home (optional): Moves focus to first accordion header.',
    'End (optional): Moves focus to last accordion header.',
  ],

  requiredRoles: ['button (each accordion header)'],
  requiredAttributes: [
    'aria-expanded (on each header button)',
    'aria-controls (on each header button — references its panel)',
    'id (on each panel — referenced by its header\'s aria-controls)',
  ],
  requiredStates: [
    'aria-expanded="true" when the panel is visible',
    'aria-expanded="false" when the panel is hidden',
  ],

  commonFailures: [
    'aria-expanded is absent on header buttons — AT cannot announce open/closed state.',
    'Panels are hidden with CSS only rather than display:none or hidden attribute.',
    'No programmatic association between header and panel (missing aria-controls).',
    'Only one item exists — a single disclosure is not an accordion.',
  ],

  signals: [
    {
      id: 'in-tab-order',
      description: 'Header button is reachable by Tab key',
      weight: 5,
      required: true,
      check: { kind: 'in-tab-order' },
    },
    {
      id: 'role-button',
      description: 'Header element has role="button"',
      weight: 7,
      required: true,
      check: { kind: 'role-equals', role: 'button' },
    },
    {
      id: 'aria-expanded-present',
      description: 'aria-expanded attribute is present on the header',
      weight: 9,
      required: true,
      check: { kind: 'attr-present', attr: 'aria-expanded' },
    },
    {
      id: 'enter-activates',
      description: 'Enter key toggles the panel',
      weight: 8,
      required: true,
      check: { kind: 'responds-to-key', key: 'Enter', expect: 'activation' },
    },
    {
      id: 'space-activates',
      description: 'Space key toggles the panel',
      weight: 7,
      required: false,
      check: { kind: 'responds-to-key', key: 'Space', expect: 'activation' },
    },
    {
      id: 'activation-mutates-expanded',
      description: 'Activation toggles aria-expanded on the header',
      weight: 9,
      required: false,
      check: { kind: 'activation-mutates', target: 'self', attr: 'aria-expanded' },
    },
    {
      id: 'aria-controls-present',
      description: 'aria-controls links header to its panel',
      weight: 7,
      required: false,
      check: { kind: 'attr-present', attr: 'aria-controls' },
    },
    {
      id: 'has-region-panel',
      description: 'Associated panel has role="region"',
      weight: 5,
      required: false,
      check: { kind: 'has-descendant-role', role: 'region' },
    },
    {
      id: 'peer-group-headers',
      description: 'At least 2 sibling accordion header buttons exist',
      weight: 8,
      required: false,
      check: { kind: 'peer-group-min', role: 'button', min: 2 },
    },
  ],
};
