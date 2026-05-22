/**
 * APG Pattern: Slider
 * https://www.w3.org/WAI/ARIA/apg/patterns/slider/
 *
 * Design notes:
 * - A Slider allows users to select a value from a continuous or discrete range
 *   by dragging a thumb. role="slider" on the thumb element.
 * - Native <input type="range"> is the preferred implementation. The scorer must
 *   auto-pass value-change signals for native range inputs.
 * - aria-valuenow, aria-valuemin, aria-valuemax are required. aria-valuetext is
 *   required when the numeric value is not self-describing.
 * - Arrow keys adjust the value: Right/Up increase; Left/Down decrease.
 *   Home moves to minimum; End moves to maximum.
 * - The responds-to-key check uses expect:'value-change' — a new expect type that
 *   Phase 3 must implement. It checks that the arrow key changes aria-valuenow.
 * - Slider vs Slider Multi-Thumb: a single thumb has peer-group-min < 2 for
 *   slider roles. Multi-thumb is a distinct signature with peer-group-min >= 2.
 * - Orientation: aria-orientation="vertical" or "horizontal" (default horizontal).
 */
export default {
  patternName: 'Slider',
  patternUrl: 'https://www.w3.org/WAI/ARIA/apg/patterns/slider/',

  keyboardInteractions: [
    'ArrowRight / ArrowUp: Increases slider value by one step.',
    'ArrowLeft / ArrowDown: Decreases slider value by one step.',
    'Home: Sets slider to minimum value.',
    'End: Sets slider to maximum value.',
    'Page Up (optional): Increases value by a larger step.',
    'Page Down (optional): Decreases value by a larger step.',
  ],

  requiredRoles: ['slider (on the thumb element)'],
  requiredAttributes: [
    'aria-valuenow (current value)',
    'aria-valuemin (minimum value)',
    'aria-valuemax (maximum value)',
    'aria-valuetext (human-readable value, when numeric is insufficient)',
    'aria-orientation (if not horizontal)',
  ],
  requiredStates: [
    'aria-valuenow updates to reflect the current thumb position.',
  ],

  commonFailures: [
    'aria-valuenow is absent — AT cannot announce the current value.',
    'Arrow keys do not change the value — keyboard users cannot adjust the slider.',
    'aria-valuemin and aria-valuemax are absent — AT cannot announce the range context.',
  ],

  signals: [
    {
      id: 'role-slider',
      description: 'Element has role="slider"',
      weight: 10,
      required: true,
      check: { kind: 'role-equals', role: 'slider' },
    },
    {
      id: 'native-range-tag',
      description: 'Implemented as a native <input type="range">',
      weight: 5,
      required: false,
      check: { kind: 'tag-in', tags: ['input'] },
    },
    {
      id: 'in-tab-order',
      description: 'Slider thumb is reachable by Tab',
      weight: 6,
      required: true,
      check: { kind: 'in-tab-order' },
    },
    {
      id: 'aria-valuenow-present',
      description: 'aria-valuenow specifies the current value',
      weight: 9,
      required: false, // native <input type="range"> uses the value attribute, not aria-valuenow
      check: { kind: 'attr-present', attr: 'aria-valuenow' },
    },
    {
      id: 'aria-valuemin-present',
      description: 'aria-valuemin specifies the range minimum',
      weight: 7,
      required: false,
      check: { kind: 'attr-present', attr: 'aria-valuemin' },
    },
    {
      id: 'aria-valuemax-present',
      description: 'aria-valuemax specifies the range maximum',
      weight: 7,
      required: false,
      check: { kind: 'attr-present', attr: 'aria-valuemax' },
    },
    {
      id: 'arrow-right-changes-value',
      description: 'ArrowRight increases the slider value (aria-valuenow changes)',
      weight: 9,
      required: true,
      check: { kind: 'responds-to-key', key: 'ArrowRight', expect: 'value-change' },
    },
    {
      id: 'arrow-left-changes-value',
      description: 'ArrowLeft decreases the slider value',
      weight: 8,
      required: false,
      check: { kind: 'responds-to-key', key: 'ArrowLeft', expect: 'value-change' },
    },
    {
      id: 'home-sets-minimum',
      description: 'Home sets slider to minimum value',
      weight: 5,
      required: false,
      check: { kind: 'responds-to-key', key: 'Home', expect: 'value-change' },
    },
    {
      id: 'end-sets-maximum',
      description: 'End sets slider to maximum value',
      weight: 5,
      required: false,
      check: { kind: 'responds-to-key', key: 'End', expect: 'value-change' },
    },
  ],
};
