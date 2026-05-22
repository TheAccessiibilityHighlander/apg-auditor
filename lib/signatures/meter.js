/**
 * APG Pattern: Meter
 * https://www.w3.org/WAI/ARIA/apg/patterns/meter/
 *
 * Design notes:
 * - A Meter represents a scalar measurement within a known range (e.g., disk usage,
 *   battery level, skill rating). It is NOT interactive — no keyboard handling.
 * - Native <meter> is the preferred implementation. The ARIA equivalent uses
 *   role="meter" with aria-valuenow, aria-valuemin, aria-valuemax.
 * - aria-valuetext should be used when the numeric value alone is insufficient
 *   (e.g., "75%" vs "75 gigabytes used of 100 gigabytes total").
 * - Meter is distinct from Progressbar (role="progressbar"): a meter shows a
 *   static measurement; a progressbar shows the status of an ongoing operation.
 * - Since Meter is read-only, in-tab-order is NOT required — meters are typically
 *   not in the tab sequence (they convey information, not actions).
 */
export default {
  patternName: 'Meter',
  patternUrl: 'https://www.w3.org/WAI/ARIA/apg/patterns/meter/',

  keyboardInteractions: [
    '(None — meters are read-only status indicators and are not interactive.)',
  ],

  requiredRoles: ['meter (native or ARIA)'],
  requiredAttributes: [
    'aria-valuenow (current value)',
    'aria-valuemin (minimum value)',
    'aria-valuemax (maximum value)',
    'aria-valuetext (human-readable description of the value, when numeric is insufficient)',
  ],
  requiredStates: [],

  commonFailures: [
    'aria-valuenow is absent — AT cannot announce the current measurement.',
    'aria-valuemin and aria-valuemax are absent — AT cannot contextualize the value.',
    'role="progressbar" is used instead of role="meter" for a static measurement.',
  ],

  signals: [
    {
      id: 'role-meter',
      description: 'Element has role="meter"',
      weight: 10,
      required: true,
      check: { kind: 'role-equals', role: 'meter' },
    },
    {
      id: 'native-meter-tag',
      description: 'Implemented as a native <meter> element',
      weight: 5,
      required: false,
      check: { kind: 'tag-in', tags: ['meter'] },
    },
    {
      id: 'aria-valuenow-present',
      description: 'aria-valuenow specifies the current value',
      weight: 9,
      required: true,
      check: { kind: 'attr-present', attr: 'aria-valuenow' },
    },
    {
      id: 'aria-valuemin-present',
      description: 'aria-valuemin specifies the minimum value',
      weight: 7,
      required: false,
      check: { kind: 'attr-present', attr: 'aria-valuemin' },
    },
    {
      id: 'aria-valuemax-present',
      description: 'aria-valuemax specifies the maximum value',
      weight: 7,
      required: false,
      check: { kind: 'attr-present', attr: 'aria-valuemax' },
    },
    {
      id: 'aria-valuetext-present',
      description: 'aria-valuetext provides a human-readable value description',
      weight: 6,
      required: false,
      check: { kind: 'attr-present', attr: 'aria-valuetext' },
    },
  ],
};
