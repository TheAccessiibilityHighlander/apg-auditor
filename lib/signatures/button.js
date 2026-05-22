/**
 * APG Pattern: Button
 * https://www.w3.org/WAI/ARIA/apg/patterns/button/
 *
 * Design notes:
 * - enter-activates / space-activates are required:true. The Phase 3 scorer
 *   must auto-pass these for elements where tagName is in ['button','input']
 *   because the browser handles native activation before JS can observe it
 *   (and our synthetic keydown with preventDefault suppresses it).
 * - no-menu-popup is a low-weight distinguisher from the Menu Button pattern;
 *   its absence does not fail the pattern, it just lowers confidence slightly.
 */
export default {
  patternName: 'Button',
  patternUrl: 'https://www.w3.org/WAI/ARIA/apg/patterns/button/',

  keyboardInteractions: [
    'Enter: Activates the button.',
    'Space: Activates the button.',
  ],

  requiredRoles: ['button'],
  requiredAttributes: [],
  requiredStates: [
    'aria-pressed (toggle buttons only — true | false | mixed)',
    'aria-expanded (when button controls an expandable widget)',
    'aria-disabled (when action is temporarily unavailable but should remain discoverable)',
  ],

  commonFailures: [
    'Custom button built from <div> or <span> is missing role="button" and cannot be reached by keyboard.',
    'Element responds to click but not to Enter or Space — keyboard users cannot activate it.',
    'Button has no accessible name; aria-label, aria-labelledby, or visible text content is absent.',
  ],

  signals: [
    {
      id: 'role-button',
      description: 'Has button role (native <button>/<input> or explicit role="button")',
      weight: 8,
      required: false,
      check: { kind: 'role-equals', role: 'button' },
    },
    {
      id: 'native-button-tag',
      description: 'Uses a native <button> or <input type="button|submit|reset|image">',
      weight: 5,
      required: false,
      check: { kind: 'tag-in', tags: ['button', 'input'] },
    },
    {
      id: 'in-tab-order',
      description: 'Reachable by Tab key (tabindex >= 0 or natively focusable)',
      weight: 6,
      required: true,
      check: { kind: 'in-tab-order' },
    },
    {
      id: 'enter-activates',
      description: 'Enter key triggers activation',
      weight: 9,
      required: true,
      check: { kind: 'responds-to-key', key: 'Enter', expect: 'activation' },
    },
    {
      id: 'space-activates',
      description: 'Space key triggers activation',
      weight: 8,
      required: true,
      check: { kind: 'responds-to-key', key: 'Space', expect: 'activation' },
    },
    {
      id: 'cursor-pointer',
      description: 'Visual cursor is pointer on hover',
      weight: 2,
      required: false,
      check: { kind: 'computed-style', property: 'cursor', value: 'pointer' },
    },
    {
      id: 'no-menu-popup',
      description: 'Does not declare a menu or listbox popup (distinguishes from Menu Button)',
      weight: 3,
      required: false,
      check: { kind: 'attr-absent', attr: 'aria-haspopup' },
    },
  ],
};
