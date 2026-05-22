/**
 * APG Pattern: Slider (Multi-Thumb)
 * https://www.w3.org/WAI/ARIA/apg/patterns/slider-multithumb/
 *
 * Design notes:
 * - A multi-thumb slider has two or more thumbs that define a range (e.g., price
 *   range filter with min/max handles). Each thumb has its own role="slider".
 * - The primary distinguisher from Slider is peer-group-min: at least 2 sibling
 *   slider roles must exist. The scorer should prefer Multi-Thumb when this
 *   condition is met.
 * - Each thumb carries its own aria-valuenow, aria-valuemin, aria-valuemax.
 *   The min of the max thumb should be >= the value of the min thumb (dynamic
 *   range constraints). This is a value constraint that Phase 3 may verify.
 * - aria-valuetext on each thumb must clearly describe which thumb it is
 *   (e.g., "Minimum price: $50", "Maximum price: $200").
 * - All other keyboard interactions are identical to single-thumb Slider.
 */
export default {
  patternName: 'Slider (Multi-Thumb)',
  patternUrl: 'https://www.w3.org/WAI/ARIA/apg/patterns/slider-multithumb/',

  keyboardInteractions: [
    'Tab: Moves focus between slider thumbs.',
    'ArrowRight / ArrowUp: Increases the focused thumb\'s value by one step.',
    'ArrowLeft / ArrowDown: Decreases the focused thumb\'s value by one step.',
    'Home: Sets the focused thumb to its minimum allowed value.',
    'End: Sets the focused thumb to its maximum allowed value.',
  ],

  requiredRoles: ['slider (on each thumb — minimum 2 thumbs)'],
  requiredAttributes: [
    'aria-valuenow (on each thumb)',
    'aria-valuemin (on each thumb)',
    'aria-valuemax (on each thumb)',
    'aria-valuetext (on each thumb — must distinguish which thumb)',
    'aria-label or aria-labelledby (on each thumb)',
  ],
  requiredStates: [
    'aria-valuenow on each thumb updates independently.',
    'aria-valuemin on the max thumb tracks the current value of the min thumb.',
  ],

  commonFailures: [
    'Thumbs share a single role="slider" element instead of having independent ARIA roles.',
    'aria-valuetext is absent — AT cannot distinguish between the minimum and maximum thumbs.',
    'Dynamic range constraints are not updated (min thumb value doesn\'t constrain max thumb).',
  ],

  signals: [
    {
      id: 'role-slider',
      description: 'Element has role="slider"',
      weight: 9,
      required: true,
      check: { kind: 'role-equals', role: 'slider' },
    },
    {
      id: 'peer-group-sliders',
      description: 'At least 2 sibling slider elements exist (multi-thumb)',
      weight: 10,
      required: true,
      check: { kind: 'peer-group-min', role: 'slider', min: 2 },
    },
    {
      id: 'in-tab-order',
      description: 'Each thumb is reachable by Tab',
      weight: 6,
      required: true,
      check: { kind: 'in-tab-order' },
    },
    {
      id: 'aria-valuenow-present',
      description: 'aria-valuenow is present on each thumb',
      weight: 9,
      required: true,
      check: { kind: 'attr-present', attr: 'aria-valuenow' },
    },
    {
      id: 'aria-valuetext-present',
      description: 'aria-valuetext distinguishes each thumb\'s role',
      weight: 8,
      required: false,
      check: { kind: 'attr-present', attr: 'aria-valuetext' },
    },
    {
      id: 'arrow-right-changes-value',
      description: 'ArrowRight increases the focused thumb\'s value',
      weight: 9,
      required: true,
      check: { kind: 'responds-to-key', key: 'ArrowRight', expect: 'value-change' },
    },
    {
      id: 'arrow-left-changes-value',
      description: 'ArrowLeft decreases the focused thumb\'s value',
      weight: 8,
      required: false,
      check: { kind: 'responds-to-key', key: 'ArrowLeft', expect: 'value-change' },
    },
  ],
};
