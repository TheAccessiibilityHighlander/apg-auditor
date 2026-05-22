/**
 * APG Pattern: Switch
 * https://www.w3.org/WAI/ARIA/apg/patterns/switch/
 *
 * Design notes:
 * - A Switch is a binary toggle control — on or off. It is semantically equivalent
 *   to a checkbox but conveys an immediate effect (like a light switch) rather than
 *   form field selection.
 * - role="switch" is the required ARIA role. Native <input type="checkbox"> can serve
 *   as a switch if it has role="switch" explicitly added; without it, it is a Checkbox.
 * - aria-checked is required and BINARY ONLY: "true" or "false". Unlike Checkbox,
 *   aria-checked="mixed" is NOT valid for Switch.
 * - Both Enter and Space should toggle the switch per APG. Unlike Link (Enter only)
 *   and Checkbox (Space only for native), Switch responds to both.
 * - activation-mutates checks aria-checked flipping between "true" and "false".
 * - The visual label should describe the thing being controlled, not the action
 *   (e.g., "Dark mode" not "Toggle dark mode") — AT reads "Dark mode, switch, on/off".
 */
export default {
  patternName: 'Switch',
  patternUrl: 'https://www.w3.org/WAI/ARIA/apg/patterns/switch/',

  keyboardInteractions: [
    'Tab: Moves focus to the switch.',
    'Enter / Space: Toggles the switch between on and off.',
  ],

  requiredRoles: ['switch (on the toggle element)'],
  requiredAttributes: [
    'aria-checked="true" when on, "false" when off (no "mixed" allowed)',
  ],
  requiredStates: [
    'aria-checked="true" when the switch is on',
    'aria-checked="false" when the switch is off',
  ],

  commonFailures: [
    'role="switch" is absent — AT announces the control as a checkbox.',
    'aria-checked is absent — on/off state is invisible to AT.',
    'aria-checked="mixed" is used — this is invalid for a switch.',
  ],

  signals: [
    {
      id: 'role-switch',
      description: 'Element has role="switch"',
      weight: 10,
      required: true,
      check: { kind: 'role-equals', role: 'switch' },
    },
    {
      id: 'in-tab-order',
      description: 'Switch is reachable by Tab',
      weight: 6,
      required: true,
      check: { kind: 'in-tab-order' },
    },
    {
      id: 'aria-checked-present',
      description: 'aria-checked reflects on/off state',
      weight: 9,
      required: true,
      check: { kind: 'attr-present', attr: 'aria-checked' },
    },
    {
      id: 'space-activates',
      description: 'Space toggles the switch',
      weight: 8,
      required: true,
      check: { kind: 'responds-to-key', key: 'Space', expect: 'activation' },
    },
    {
      id: 'enter-activates',
      description: 'Enter toggles the switch',
      weight: 7,
      required: false,
      check: { kind: 'responds-to-key', key: 'Enter', expect: 'activation' },
    },
    {
      id: 'activation-mutates-checked',
      description: 'Activation toggles aria-checked between true and false',
      weight: 8,
      required: false,
      check: { kind: 'activation-mutates', target: 'self', attr: 'aria-checked' },
    },
  ],
};
